import React from "react"
import * as Markdown from "./Markdown"
import { marked } from "marked"
import { createCitations } from "../../../../apis/zotero/citation"
import { ItemButton } from "../../../components/buttons/ItemButton"
import { createCollection } from "../../../../apis/zotero/collection"
import { ARIA_LIBRARY } from "../../../../constants"
import { config } from "../../../../../package.json"
import {
  annotationButtonDef,
  copyButtonDef,
  noteButtonDef,
} from "../../../components/buttons/types"
import { Control } from "../../../components/types"
import { NestedQuery } from "../../../../apis/zotero/search"
import stringify from "json-stringify-pretty-compact"

export interface Input {
  question: string
}

export interface Props {
  input: Input
  context: { query: NestedQuery }
  control: Control
}

export function Component({
  input: { question },
  context: { query },
  control,
}: Props) {
  const { scrollToEnd } = control
  return (
    <div>
      <div>qa widget: {question}</div>
      <pre>{stringify(query)}</pre>
    </div>
  )
  return (
    <div>
      <Markdown.Component input={{ content: answer }} control={control} />
      {sources.length > 0 ? (
        <div className="text-lg">
          <h4 className="p-0 m-0 !mt-4 mb-1 text-tomato">References</h4>
          <ol className="list-none p-0 m-0">
            {sources.map(({ item, attachment, bib }) => {
              return (
                <li key={item.id} className="mb-2 last:mb-0">
                  {bib}
                  <ItemButton item={item} mode="item" />
                  {attachment ? (
                    <ItemButton item={attachment} mode="attachment" />
                  ) : null}
                </li>
              )
            })}
          </ol>
        </div>
      ) : null}
    </div>
  )
}

export function compileContent({ input: { answer, sources = [] } }: Props) {
  const textContent =
    sources.length === 0
      ? answer
      : `
${answer}

#### References

${sources.map(({ bib }) => bib).join("\n")}
  `.trim()
  const htmlContent = marked(textContent)
  return { textContent, htmlContent }
}

function copy(props: Props) {
  const { textContent, htmlContent } = compileContent(props)
  return new ztoolkit.Clipboard()
    .addText(textContent, "text/unicode")
    .addText(htmlContent, "text/html")
    .copy()
}

async function createNote({ input: { answer, sources } }: Props) {
  const sourceIds = sources.map(({ item }) => item.id)
  const sourceItems = await Zotero.Items.getAsync(sourceIds)
  const citations = sourceItems.map((item) => ({
    uris: [Zotero.URI.getItemURI(item)],
    itemData: (Zotero.Utilities as any).Item.itemToCSLJSON(item),
  }))
  const sourcesContent = `
  <ol>
${sourceItems
  .map((item, i) => {
    const citation = {
      uris: [Zotero.URI.getItemURI(item)],
      itemData: (Zotero.Utilities as any).Item.itemToCSLJSON(item),
    }
    const citationPreview = Zotero.EditorInstanceUtilities.formatCitation({
      citationItems: [citation],
    })
    const citationData = {
      citationItems: [{ uris: citation.uris }],
      properties: {},
    }
    const citationKey = `<span class="citation" data-citation="${encodeURIComponent(
      JSON.stringify(citationData),
    )}">(<span class="citation-item">${citationPreview}</span>)</span>`
    return `<li>${citationKey} ${sources[i].bib.replace(/\(\d+\)\s+/, "")}</li>`
  })
  .join("\n")}
</ol>
  `.trim()
  const content =
    sources.length === 0
      ? marked(answer)
      : `
${marked(answer)}

<h2>References</h2>

${sourcesContent}`.trim()
  const note =
    '<div data-schema-version="8">' +
    `<h1>New Q&A Response from ${config.addonName} - ${new Date().toLocaleString()}</h1>` +
    content +
    "</div>"
  return note
}

export const buttonDefs = [
  {
    name: "COPY",
    utils: { copy },
  } as copyButtonDef,
  {
    name: "NOTE",
    utils: { createNote },
  } as noteButtonDef,
]
