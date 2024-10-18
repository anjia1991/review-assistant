import React, { useState } from 'react'
import { DocumentTextIcon, PlusSmallIcon, MinusSmallIcon } from '@heroicons/react/24/outline'
import { BotMessageProps, UserMessageProps } from '../message/types'
import { useOutsideClick } from '../../hooks/useOutsideClick'
import { noteButtonDef } from './types'
import { createStandaloneNote, createChildNote } from '../../../apis/zotero'

interface NoteButtonProps extends noteButtonDef {
  input: BotMessageProps['input']
  states?: UserMessageProps['states']
}

export function NoteButton({ utils, input, states }: NoteButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useOutsideClick(() => setOpen(false))
  const items = states?.items ?? []

  function handleOpen() {
    setOpen(!open)
  }

  async function createNote() {
    const content = await utils.createNote(input)
    const note = await createStandaloneNote(content)
    ZoteroPane.selectItem(note.id, true)
  }

  async function addNoteToItem(itemId: number) {
    const content = await utils.createNote(input)
    const note = await createChildNote(content, itemId as number)
    ZoteroPane.selectItem(note.id)
  }
// Function to extract fields from the extra field
// function extractFieldsFromExtra(extra: string): { [key: string]: string } {
//   const fieldNames = [
//     'Objective',
//     'Methodology',
//     'Discussion',
//     'ResultsFindings',
//     'Data Points',
//     'Implications',
//     'Relationships',
//   ];
//   const extractedFields: { [key: string]: string } = {};

//   for (const field of fieldNames) {
//     const regex = new RegExp(`^${field}:\\s*(.*?)$`, 'im');
//     const match = extra.match(regex);
//     extractedFields[field] = match ? match[1].trim() : 'N/A';
//   }

//   return extractedFields;
// }

// function sanitizeFileName(name: string) {
//   return name.replace(/[<>:"/\\|?*]+/g, '_');
// }

 // async function saveAnswerToColumn(itemId: number) {
  //   try {
  //       if (input.answer) {
  //           const answerText = input.answer;

  //           // Parse the "extra" field's embedded JSON data
  //           const parsedAnswer = JSON.parse(answerText);  // Parse the embedded JSON

  //           const title = parsedAnswer.title || 'N/A';
  //           const author = parsedAnswer.author || 'N/A';
  //           const year = parsedAnswer.year || 'N/A';
  //           const objective = parsedAnswer.objective || 'N/A';

  //           // Handle multi-line and comma-separated values
  //           const methodologyOverview = parsedAnswer.Methodology?.Overview || 'N/A';
  //           const discussion = parsedAnswer.Discussion?.MainPoints?.join(", ") || 'N/A';
  //           const resultsFindings = parsedAnswer.ResultsFindings?.Summary || 'N/A';
  //           const dataPoints = parsedAnswer.ResultsFindings?.DataPoints?.map((dp: { Label: any; Value: any }) => `${dp.Label}: ${dp.Value}`).join(", ") || 'N/A';
  //           const implications = parsedAnswer.Discussion?.Implications || 'N/A';
  //           const relationships = parsedAnswer.ResultsFindings?.Relationships?.map((rel: { Entities: any[]; Relation: any }) => `${rel.Entities.join(", ")}: ${rel.Relation}`).join(", ") || 'N/A';

  //           // Update Zotero fields with parsed data, ensuring correct capitalization and matching field names
  //           await updateItemField(itemId, 'Title', title);
  //           await updateItemField(itemId, 'Author', author);
  //           await updateItemField(itemId, 'Year', year);
  //           await updateItemField(itemId, 'Objective', objective);

  //           // Correctly parse and update the methodology, discussion, and result columns
  //           await updateItemField(itemId, 'Methodology', methodologyOverview);
  //           await updateItemField(itemId, 'Discussion', discussion);
  //           await updateItemField(itemId, 'ResultsFindings', resultsFindings);
  //           await updateItemField(itemId, 'Data Points', dataPoints);
  //           await updateItemField(itemId, 'Implications', implications);
  //           await updateItemField(itemId, 'Relationships', relationships);
  //       }
  //   } catch (error) {
  //       console.error('Failed to parse and save input JSON', error);
  //   }
  // }

  // async function saveAnswersToItems() {
  //   try {
  //     if (input.answer) {
  //       console.log('Input answer:', input.answer);
  //       let jsonData = JSON.parse(input.answer);
  //       console.log('Parsed jsonData:', jsonData);
  
  //       // Check if jsonData has an 'articles' property that's an array
  //       if (jsonData.articles && Array.isArray(jsonData.articles)) {
  //         jsonData = jsonData.articles;
  //       }
  
  //       if (!Array.isArray(jsonData)) {
  //         console.error('Parsed data is not an array.');
  //         return;
  //       }
  
  //       await updateItemsFromJSON(jsonData);
  //       Zotero.debug('Items updated successfully.');
  //     } else {
  //       Zotero.debug('No answer data to process.');
  //     }
  //   } catch (error) {
  //     console.error('Failed to parse and save input JSON', error);
  //   }
  // }
  
  

  // async function updateItemsFromJSON(jsonData: any[]) {
  //   for (const jsonItem of jsonData) {
  //     // Find the Zotero item by title
  //     const zoteroItem = await findZoteroItemByTitle(jsonItem.title);
  
  //     if (zoteroItem) {
  //       // Update the 'extra' field of the Zotero item
  //       await updateItemExtraField(zoteroItem, jsonItem);
  //     } else {
  //       Zotero.debug('No Zotero item found for title: ' + jsonItem.title);
  //     }
  //   }
  // }

    // async function updateItemExtraField(item: Zotero.Item, jsonItemData: any) {
  //   let extra = item.getField('extra') || '';
  
  //   // Prepare the data to append to 'extra'
  //   const fieldsToUpdate = {
  //     'Objective': jsonItemData.objective || 'N/A',
  //     'Methodology': jsonItemData.Methodology?.Overview || 'N/A',
  //     'Discussion': jsonItemData.Discussion?.MainPoints?.join('; ') || 'N/A',
  //     'ResultsFindings': jsonItemData.ResultsFindings?.Summary || 'N/A',
  //     'Data Points': jsonItemData.ResultsFindings?.DataPoints?.map((dp: { Label: any; Value: any }) => `${dp.Label}: ${dp.Value}`).join('; ') || 'N/A',
  //     'Implications': jsonItemData.Discussion?.Implications || 'N/A',
  //     'Relationships': jsonItemData.ResultsFindings?.Relationships?.map((rel: { Entities: any[]; Relation: any }) => `${rel.Entities.join(', ')}: ${rel.Relation}`).join('; ') || 'N/A',
  //   };
  
  //   // Update or add fields in 'extra'
  //   for (const [field, value] of Object.entries(fieldsToUpdate)) {
  //     const fieldRegex = new RegExp(`^${field}:.*$`, 'im');
  //     if (extra.match(fieldRegex)) {
  //       extra = extra.replace(fieldRegex, `${field}: ${value}`);
  //     } else {
  //       extra += `\n${field}: ${value}`;
  //     }
  //   }
  
  //   // Trim and set the updated 'extra' field
  //   item.setField('extra', extra.trim());
  //   await item.saveTx();
  // }
   
  
  // async function updateItemField(itemId: number, field: string, value: string) {
  //   const item = await Zotero.Items.getAsync(itemId);
  //   let extra = item.getField('extra') || '';
  //   const fieldRegex = new RegExp(`^${field}:.*$`, 'm');
  //   if (extra.match(fieldRegex)) {
  //     extra = extra.replace(fieldRegex, `${field}: ${value}`);
  //   } else {
  //     extra = `${extra}\n${field}: ${value}`;
  //   }
  //   item.setField('extra', extra.trim());
  //   await item.saveTx();
  // }

  return (
    <div className="relative">
      <div className="rounded border border-solid border-neutral-300">
        <button
          ref={ref}
          type="button"
          className="relative inline-flex items-center bg-white text-neutral-500 hover:bg-gray-200 focus:z-10 rounded border-none px-2 py-1"
          aria-label="Note"
          onClick={handleOpen}
        >
          <DocumentTextIcon className="w-5 h-5 text-neutral-500" aria-hidden="true" />
          <span className="ml-2 text-sm">Note</span>
          {open ? (
            <MinusSmallIcon className="ml-2 w-4 h-4 text-neutral-500" aria-hidden="true" />
          ) : (
            <PlusSmallIcon className="ml-2 w-4 h-4 text-neutral-500" aria-hidden="true" />
          )}
        </button>
      </div>
      <ul
        className={`${
          open ? 'visible' : 'invisible'
        } absolute left-0 list-none m-0 mt-4 p-0 shadow-lg border border-solid border-gray-200`}
        style={{ background: '-moz-field' }}
      >
        <li>
          <button
            className="text-left text-sm w-full block px-2 py-1 whitespace-nowrap border-none bg-white hover:bg-gray-200"
            onClick={createNote}
          >
            Create standalone note
          </button>
        </li>
        {items.map(item => {
          const itemTitle = item.title && item.title.length > 64 ? item.title.slice(0, 64) + '...' : item.title
          return (
            <li key={item.id}>
              <button
                className="text-left text-sm w-full block px-2 py-1 whitespace-nowrap border-none bg-white hover:bg-gray-200"
                onClick={() => addNoteToItem(item.id)}
              >
                Add child note to "{itemTitle}"
              </button>
            </li>
          )
        })}
        {/* <li>
              <button
                className="text-left text-sm w-full block px-2 py-1 whitespace-nowrap border-none bg-white hover:bg-gray-200"
                onClick={() => saveAnswerToColumn(item.id)}
              >
                Save answers accordingly to "{itemTitle}"
              </button>
            </li> */}
      </ul>
    </div>
  )
}
