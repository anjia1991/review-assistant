import React, { useState } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { BotMessageProps, UserMessageProps } from '../message/types';
import { exportButtonDef } from './types';
import { createStandaloneNote, createChildNote } from '../../../apis/zotero';

interface ExportButtonProps extends exportButtonDef {
  input: BotMessageProps['input'] & { answer?: string };
  states?: UserMessageProps['states'];
}

export function ExportButton({ utils, input, states }: ExportButtonProps) {
  const items = states?.items ?? [];
  const [notification, setNotification] = useState('');

  function extractYear(dateString: string) {
    if (!dateString) return 'N/A';
    const yearMatch = dateString.match(/\b\d{4}\b/);
    return yearMatch ? yearMatch[0] : 'N/A';
  }

  function extractAuthors(item: Zotero.Item) {
    const creators = item.getCreators();

    if (!creators || creators.length === 0) {
      return [];
    }

    const authors = creators
      .filter((creator: { creatorTypeID: string | number }) => {
        const creatorType = Zotero.CreatorTypes.getName(creator.creatorTypeID).toLowerCase();
        return ['author', 'contributor', 'editor'].includes(creatorType);
      })
      .map((creator: { fieldMode: number; lastName: string; firstName: string }) => {
        let name = '';
        if (creator.fieldMode === 1) {
          name = creator.lastName || '';
        } else {
          const firstName = creator.firstName || '';
          const lastName = creator.lastName || '';
          name = `${firstName} ${lastName}`.trim();
        }
        return name;
      });

    return authors;
  }

  async function pickSaveLocation(defaultFileName: string) {
    const nsIFilePicker = Components.interfaces.nsIFilePicker;
    const fp = Components.classes['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);

    fp.init(window, 'Save CSV File', nsIFilePicker.modeSave);
    fp.appendFilter('CSV Files', '*.csv');
    fp.defaultString = defaultFileName;

    const result = await new Promise((resolve) => fp.open(resolve));

    if (result === nsIFilePicker.returnOK || result === nsIFilePicker.returnReplace) {
      return fp.file;
    }
    return null;
  }

  async function parseJSONData() {
    try {
      if (!input.answer) {
        console.error('No input data to parse.');
        return [];
      }
      const jsonData = JSON.parse(input.answer);
  
      // If there's an "articles" property and it's an array, return that
      if (jsonData.articles && Array.isArray(jsonData.articles)) {
        return jsonData.articles;
      }
      // If the entire JSON is already an array, return it as is
      if (Array.isArray(jsonData)) {
        return jsonData;
      }
      // If it's a single object, wrap it in an array
      if (typeof jsonData === 'object') {
        return [jsonData];
      }
  
      // Otherwise, log an error and return an empty array
      console.error('Parsed data is neither an array nor an object.');
      return [];
    } catch (error) {
      console.error('Failed to parse input JSON:', error);
      return [];
    }
  }
  

  function flattenObject(ob: any, prefix = '', res: { [key: string]: string } = {}) {
    for (const key in ob) {
      if (Object.prototype.hasOwnProperty.call(ob, key)) {
        const value = ob[key];
        const newKey = prefix ? `${prefix}.${key}` : key; // Join keys with dot notation

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const isLeafNode = Object.values(value).every((v) => typeof v !== 'object');
          if (isLeafNode) {
            res[newKey] = Object.entries(value)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ');
          } else {
            flattenObject(value, newKey, res);
          }
        } else if (Array.isArray(value)) {
          res[newKey] = value
            .map((elem) => {
              if (elem && typeof elem === 'object') {
                const isLeafNode = Object.values(elem).every((v) => typeof v !== 'object');
                if (isLeafNode) {
                  return Object.entries(elem)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(', ');
                } else {
                  const nestedRes = {};
                  flattenObject(elem, '', nestedRes);
                  return Object.entries(nestedRes)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(', ');
                }
              } else {
                return elem;
              }
            })
            .join('; ');
        } else {
          res[newKey] = value;
        }
      }
    }
    return res;
  }

  function getUniqueFieldNames(jsonItems: any[]) {
    const standardFields = ['title', 'author', 'year', 'doi'];
    const fieldNames = new Set();

    jsonItems.forEach((item) => {
      const flattenedItem = flattenObject(item);
      Object.keys(flattenedItem).forEach((key) => {
        if (!standardFields.includes(key.toLowerCase())) {
          fieldNames.add(key);
        }
      });
    });
    return Array.from(fieldNames);
  }

  function getStandardFieldsForItem(zoteroItem: any) {
    // Extract standard fields from the Zotero item
    const authors = extractAuthors(zoteroItem) || [];
    const standardFields = {
      Key: zoteroItem.key,
      Title: zoteroItem.getField('title'),
      Authors: authors,
      'Publication Year': extractYear(zoteroItem.getField('date')),
      'Publication Title': zoteroItem.getField('publicationTitle') || 'N/A',
      DOI: zoteroItem.getField('DOI') || 'N/A',
    };
    return standardFields;
  }

  function combineFields(
    itemsData: { standardFields: any; customFields: any }[],
    customFieldNames: any[]
  ) {
    return itemsData.map(({ standardFields, customFields }) => {
      const combined = { ...standardFields };
      const flattenedCustomFields = flattenObject(customFields);

      customFieldNames.forEach((fieldName) => {
        let value = flattenedCustomFields[fieldName];
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        combined[fieldName] = value || 'N/A';
      });
      return combined;
    });
  }

  function prepareCSVData(combinedItems: any[], customFieldNames: unknown[]) {
    const authorColumns = ['Author 0', 'Author 1', 'Author 2', 'Other Authors'];

    const headers = [
      'Key',
      'Title',
      'Publication Year',
      'Publication Title',
      'DOI',
      ...authorColumns,
      ...customFieldNames,
    ];

    const csvRows = [];
    csvRows.push(headers.join(',')); // Header row

    combinedItems.forEach((item) => {
      const values = headers.map((header) => {
        let value = item[header as keyof typeof item] || 'N/A';

        // Handle authors
        if (authorColumns.includes(header as string)) {
          const authors = item['Authors'] || [];
          const authorIndex = authorColumns.indexOf(header as string);
          if (authorIndex < 3) {
            value = authors[authorIndex] || 'N/A';
          } else if (header === 'Other Authors') {
            if (authors.length > 3) {
              value = authors.slice(3).join('; ');
            } else {
              value = 'N/A';
            }
          }
        } else if (header === 'Authors') {
          value = null; // Exclude this field
        } else {
          if (value === undefined || value === null) {
            value = 'N/A';
          } else {
            value = String(value);
          }
        }

        if (value !== null) {
          return `"${value.replace(/"/g, '""')}"`; // Escape double quotes
        } else {
          return null; // Exclude this value
        }
      });
      csvRows.push(values.filter((v) => v !== null).join(','));
    });

    return csvRows.join('\n');
  }

  async function exportToCSV(csvContent: string) {
    const fileName = `exported_items.csv`;
    const file = await pickSaveLocation(fileName);
    if (file) {
      await Zotero.File.putContentsAsync(file, csvContent);
      Zotero.debug('CSV export completed successfully.');
    } else {
      Zotero.debug('User canceled the file save operation.');
    }
  }

  async function createErrorCollection(errorItems: any[]) {
    // Create a new collection
    const collection = new Zotero.Collection();
    collection.name = 'Export Errors ' + new Date().toLocaleString();
    await collection.saveTx();

    // Add items to the collection
    for (const item of errorItems) {
      collection.addItem(item);
    }
    await collection.saveTx();
  }

  async function exportJSONDataToCSV() {
    const errorItems = [];
    const successItemsData = [];

    const jsonItems = await parseJSONData();
    if (jsonItems.length === 0) {
      setNotification('No items to export, please modify the JSON prompt.');
      return;
    }

    // Retrieve selected Zotero items
    const zoteroItemIds = items.map((item) => item.id);
    if (zoteroItemIds.length === 0) {
      setNotification('No Zotero items selected.');
      return;
    }

    // Retrieve Zotero items
    const zoteroItems = await Promise.all(zoteroItemIds.map((id) => Zotero.Items.getAsync(id)));

    // Extract custom field names
    const customFieldNames = getUniqueFieldNames(jsonItems);

    for (let i = 0; i < zoteroItems.length; i++) {
      const zoteroItem = zoteroItems[i];
      const jsonItem = jsonItems[i];

      if (!jsonItem) {
        console.warn(`No JSON data for Zotero item at index ${i}. Skipping.`);
        errorItems.push(zoteroItem);
        continue;
      }

      try {
        // Process the item
        const standardFields = getStandardFieldsForItem(zoteroItem);
        const itemsData = {
          standardFields,
          customFields: jsonItem,
        };
        successItemsData.push(itemsData);
      } catch (error) {
        console.error(`Error processing item at index ${i}:`, error);
        errorItems.push(zoteroItem);
      }
    }

    if (successItemsData.length === 0) {
      setNotification('No items were successfully processed for export.');
      return;
    }

    // Combine fields for successful items
    const combinedItems = combineFields(successItemsData, customFieldNames);

    // Prepare CSV data
    const csvContent = prepareCSVData(combinedItems, customFieldNames);

    // Export to CSV
    await exportToCSV(csvContent);

    // Handle error items
    if (errorItems.length > 0) {
      await createErrorCollection(errorItems);
      setNotification(
        `${errorItems.length} item(s) could not be exported and were added to a new collection for review.`
      );
    } else {
      setNotification('Export completed successfully.');
    }
  }

  return (
    <div className="relative">
      <div className="rounded border border-solid border-neutral-300">
        <button
          type="button"
          className="relative inline-flex items-center bg-white text-neutral-500 hover:bg-gray-200 focus:z-10 rounded border-none px-2 py-1"
          aria-label="Export"
          onClick={exportJSONDataToCSV}
        >
          <span className="ml-2 text-sm">Export CSV</span>
        </button>
      </div>
      {notification && (
        <div className="mt-2 text-sm text-red-600">
          {notification}
        </div>
      )}
    </div>
  );
}
