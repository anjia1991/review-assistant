import React, { useState } from 'react'
import { DocumentTextIcon, PlusSmallIcon, MinusSmallIcon } from '@heroicons/react/24/outline'
import { BotMessageProps, UserMessageProps } from '../message/types'
import { useOutsideClick } from '../../hooks/useOutsideClick'
import { noteButtonDef } from './types'
import { createStandaloneNote, createChildNote } from '../../../apis/zotero'

interface NoteButtonProps extends noteButtonDef {
  input: BotMessageProps['input'] & { answer?: string }
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
 
  async function updateItemField(itemId: number, field: string, value: string) {
    const item = await Zotero.Items.getAsync(itemId);
    let extra = item.getField('extra') || '';
    const fieldRegex = new RegExp(`^${field}:.*$`, 'm');
    if (extra.match(fieldRegex)) {
      extra = extra.replace(fieldRegex, `${field}: ${value}`);
    } else {
      extra = `${field}: ${value}`; // Replace the entire extra field with the new value
    }
    item.setField('extra', extra.trim());
    await item.saveTx();
  }
  
  async function saveAnswerToColumn(itemId: number) {
    try {
      // Assuming 'input' is your AI output object
      const data = input; // Ensure 'input' is an object
      console.log('Data:', data);
  
      const answerText = data.answer; // Get the 'answer' field
      console.log('Answer Text:', answerText);
  
      // Function to extract sections based on '**SectionTitle:**' pattern
      function extractSection(text: string | undefined, sectionTitle: string) {
        const regex = new RegExp(`####\\s+${sectionTitle}\\s+([\\s\\S]*?)(?=\\n####|$)`, 'i');
        const match = text ? text.match(regex) : null;
        return match ? match[1].trim() : null;
      }
  
      // Extract sections
      const objective = extractSection(answerText, 'Objective');
      const methodology = extractSection(answerText, 'Methodology');
      const discussion = extractSection(answerText, 'Discussion');
      const resultsFindings = extractSection(answerText, 'Results/Findings');
  
      // Now, within 'Methodology', we may have sub-sections
      let overview = null;
      let details = null;
      if (methodology) {
        const overviewMatch = methodology.match(/- \*\*Overview:\*\*\s*([\s\S]*?)(?=\n- \*\*|$)/i);
        overview = overviewMatch ? overviewMatch[1].trim() : null;
  
        const detailsMatch = methodology.match(/- \*\*Details:\*\*\s*([\s\S]*?)(?=\n####|$)/i);
        details = detailsMatch ? detailsMatch[1].trim() : null;
      }
  
      // Extract 'Main Points' and 'Implications' from 'Discussion'
      let mainPoints = null;
      let implications = null;
      if (discussion) {
        const mainPointsMatch = discussion.match(/- \*\*Main Points:\*\*\s+([\s\S]*?)(?=\n- \*\*|$)/);
        mainPoints = mainPointsMatch ? mainPointsMatch[1].trim() : null;
  
        const implicationsMatch = discussion.match(/- \*\*Implications:\*\*\s+([\s\S]*?)(?=\n####|$)/);
        implications = implicationsMatch ? implicationsMatch[1].trim() : null;
      }
  
      // Extract 'Summary', 'Data Points', 'Relationships' from 'Results/Findings'
      let summary = null;
      let dataPoints = null;
      let relationships = null;
      if (resultsFindings) {
        const summaryMatch = resultsFindings.match(/- \*\*Summary:\*\*\s+([\s\S]*?)(?=\n- \*\*|$)/);
        summary = summaryMatch ? summaryMatch[1].trim() : null;
  
        const dataPointsMatch = resultsFindings.match(/- \*\*Data Points:\*\*\s+([\s\S]*?)(?=\n- \*\*|$)/);
        dataPoints = dataPointsMatch ? dataPointsMatch[1].trim() : null;
  
        const relationshipsMatch = resultsFindings.match(/- \*\*Relationships:\*\*\s+([\s\S]*?)(?=\n####|$)/);
        relationships = relationshipsMatch ? relationshipsMatch[1].trim() : null;
      }
  
      // Fetch the item and its current 'extra' field
      const item = await Zotero.Items.getAsync(itemId);
      let extra = item.getField('extra') || '';
  
      // Remove existing custom fields to prevent duplicates
      extra = extra
        .split('\n')
        .filter(line => !line.startsWith('Answer Text:') &&
                        !line.startsWith('Objective:') &&
                        !line.startsWith('Overview:') &&
                        !line.startsWith('Details:') &&
                        !line.startsWith('MainPoints:') &&
                        !line.startsWith('Summary:') &&
                        !line.startsWith('DataPoints:') &&
                        !line.startsWith('Implications:') &&
                        !line.startsWith('Relationships:'))
        .join('\n');
  
      // Append new data
      if (answerText) extra += `\nAnswer Text: ${answerText}`;
      if (objective) extra += `\nObjective: ${objective}`;
      if (overview) extra += `\nOverview: ${overview}`;
      if (details) extra += `\nDetails: ${details}`;
      if (mainPoints) extra += `\nMainPoints: ${mainPoints}`;
      if (summary) extra += `\nSummary: ${summary}`;
      if (dataPoints) extra += `\nDataPoints: ${dataPoints}`;
      if (implications) extra += `\nImplications: ${implications}`;
      if (relationships) extra += `\nRelationships: ${relationships}`;
  
      // Update the 'extra' field
      item.setField('extra', extra.trim());
      await item.saveTx();
  
      ZoteroPane.selectItem(itemId);
    } catch (error) {
      console.error('Failed to parse input string', error);
    }
  }
  
  
  

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

        {items.map(item => {
          const itemTitle = item.title && item.title.length > 64 ? item.title.slice(0, 64) + '...' : item.title
          return (
            <li key={item.id}>
              <button
                className="text-left text-sm w-full block px-2 py-1 whitespace-nowrap border-none bg-white hover:bg-gray-200"
                onClick={() => saveAnswerToColumn(item.id)}
              >
                Save answers accordingly to "{itemTitle}"
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
