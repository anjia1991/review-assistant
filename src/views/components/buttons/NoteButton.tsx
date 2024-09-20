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
      const data = input; // Assuming 'input' is your AI output object
      const answerText = data.answer; // Get the 'answer' field
      
      // Function to extract the content of each field from the table format
      function extractFromTable(text: string | undefined, fieldName: string) {
        const regex = new RegExp(`\\|\\s*${fieldName}\\s*\\|\\s*([\\s\\S]*?)\\s*\\|`, 'i');
        const match = (text ?? '').match(regex);
        return match ? match[1].trim() : null;
      }
  
      // Extract specific fields from the table
      const title = extractFromTable(answerText, 'Title');
      const author = extractFromTable(answerText, 'Author');
      const year = extractFromTable(answerText, 'Year');
      const objective = extractFromTable(answerText, 'Objective');
      const methodology = extractFromTable(answerText, 'Methodology');
      const steps = extractFromTable(answerText, 'Steps');
      const discussion = extractFromTable(answerText, 'Discussion');
      const resultsFindings = extractFromTable(answerText, 'Results/Findings');
      const dataPoints = extractFromTable(answerText, 'Data Points');
      const relationships = extractFromTable(answerText, 'Relationships');
  
      // Log each field to debug
      console.log('Title:', title);
      console.log('Author:', author);
      console.log('Year:', year);
      console.log('Objective:', objective);
      console.log('Methodology:', methodology);
      console.log('Steps:', steps);
      console.log('Discussion:', discussion);
      console.log('ResultsFindings:', resultsFindings);
      console.log('DataPoints:', dataPoints);
      console.log('Relationships:', relationships);
  
      // Fetch the Zotero item and its current 'extra' field
      const item = await Zotero.Items.getAsync(itemId);
      let extra = item.getField('extra') || '';
  
      // Remove existing custom fields from the extra field to prevent duplicates
      extra = extra
        .split('\n')
        .filter(line => !line.startsWith('Answer Text:') &&
                        !line.startsWith('Objective:') &&
                        !line.startsWith('Methodology:') &&
                        !line.startsWith('Steps:') &&
                        !line.startsWith('Discussion:') &&
                        !line.startsWith('ResultsFindings:') &&
                        !line.startsWith('DataPoints:') &&
                        !line.startsWith('Relationships:'))
        .join('\n');
  
      // Append new extracted data to the extra field
      if (title) extra += `\nTitle: ${title}`;
      if (author) extra += `\nAuthor: ${author}`;
      if (year) extra += `\nYear: ${year}`;
      if (objective) extra += `\nObjective: ${objective}`;
      if (methodology) extra += `\nMethodology: ${methodology}`;
      if (steps) extra += `\nSteps: ${steps}`;
      if (discussion) extra += `\nDiscussion: ${discussion}`;
      if (resultsFindings) extra += `\nResultsFindings: ${resultsFindings}`;
      if (dataPoints) extra += `\nDataPoints: ${dataPoints}`;
      if (relationships) extra += `\nRelationships: ${relationships}`;
  
      // Update the 'extra' field in the Zotero item
      item.setField('extra', extra.trim());
      await item.saveTx();
  
      // Optionally, focus the updated item
      ZoteroPane.selectItem(itemId);
    } catch (error) {
      console.error('Failed to parse and save input string', error);
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
