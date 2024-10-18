import { BasicTool, BasicOptions } from 'zotero-plugin-toolkit/dist/basic'
import { ManagerTool } from 'zotero-plugin-toolkit/dist/basic'
import { UITool } from 'zotero-plugin-toolkit/dist/tools/ui'
import { ShortcutManager } from 'zotero-plugin-toolkit/dist/managers/shortcut'
import { Providers } from './Providers'
import { config } from '../../package.json'
import React from 'react'
import ReactDOM from 'react-dom'

// function createDataProvider(fieldName: string) {
//   return (item: Zotero.Item, dataKey: string) => {
//     const extra = item.getField('extra') || '';
    
//     // Handle complex fields like Methodology, Discussion, and ResultsFindings
//     const regex = new RegExp(`^${fieldName}.*?:\\s*(.*?)$`, 'm');
//     const match = extra.match(regex);
    
//     return match ? match[1].trim() : '';
//   };
// }

export class ReactRoot {
  private ui: UITool
  private base: BasicTool
  private document: Document
  private root!: HTMLDivElement
  private activeElement?: HTMLElement
  private dialog?: Window

  constructor() {
    this.base = new BasicTool()
    this.ui = new UITool()
    this.document = this.base.getGlobal('document')
    this.registerStyle()
    this.registerToolbar()
    this.registerShortcut()
    // this.registerCustomColumns()
    // As message entries are no longer stored in preferences (due to the size limit), we need to remove the existing entries. This may be removed after several upgrade cycles.
    this.removeMessagesInPrefs()
  }

  private registerStyle() {
    const styles = this.ui.createElement(document, 'link', {
      properties: {
        type: 'text/css',
        rel: 'stylesheet',
        href: `chrome://${config.addonRef}/content/scripts/${config.addonRef}.css`,
      },
    })
    this.document.documentElement.appendChild(styles)
  }

  private registerToolbar() {
    const ariaBtn = this.ui.createElement(this.document, 'toolbarbutton', {
      id: 'zotero-tb-aria',
      removeIfExists: true,
      attributes: {
        class: 'zotero-tb-button',
        tooltiptext: 'Launch Aria',
        style: 'list-style-image: url(chrome://aria/content/icons/favicon@16x16.png)',
      },
      listeners: [
        {
          type: 'click',
          listener: () => {
            if (this.dialog && !this.dialog.closed) {
              this.dialog.focus()
            } else {
              this.launchApp()
            }
          },
        },
      ],
    })
    const toolbarNode = this.document.getElementById('zotero-tb-note-add')
    if (toolbarNode) {
      toolbarNode.after(ariaBtn)
    }
  }

//   private async registerCustomColumns() {
//     await Zotero.ItemTreeManager.registerColumns([
//         {
//             dataKey: 'Objective',
//             label: 'Objective',
//             pluginID: config.addonID,
//             flex: 0,
//             dataProvider: createDataProvider('Objective')
//         },
//         {
//             dataKey: 'Methodology', // Fixed to match "Methodology" directly in extra field
//             label: 'Methodology',
//             pluginID: config.addonID,
//             flex: 0,
//             dataProvider: createDataProvider('Methodology')
//         },
//         {
//             dataKey: 'Discussion',  // Fixed to match "Discussion" directly
//             label: 'Discussion',
//             pluginID: config.addonID,
//             flex: 0,
//             dataProvider: createDataProvider('Discussion')
//         },
//         {
//             dataKey: 'ResultsFindings',  // Fixed to match "ResultsFindings" directly
//             label: 'Results/Findings',
//             pluginID: config.addonID,
//             flex: 0,
//             dataProvider: createDataProvider('ResultsFindings')
//         },
//         {
//             dataKey: 'DataPoints',  // Fixed to match "DataPoints" directly
//             label: 'DataPoints',
//             pluginID: config.addonID,
//             flex: 0,
//             dataProvider: createDataProvider('Data Points')
//         },
//         {
//             dataKey: 'Implications',
//             label: 'Implications',
//             pluginID: config.addonID,
//             flex: 0,
//             dataProvider: createDataProvider('Implications')
//         },
//         {
//             dataKey: 'Relationships',
//             label: 'Relationships',
//             pluginID: config.addonID,
//             flex: 0,
//             dataProvider: createDataProvider('Relationships')
//         }
//     ]);
// }

  private removeMessagesInPrefs() {
    try {
      const rootKey = 'extensions.zotero.aria.messageKeys'
      const rootVal = Zotero.Prefs.get(rootKey, true)
      if (typeof rootVal !== 'string') {
        return
      }
      const messageKeys = JSON.parse(rootVal) || []
      messageKeys.forEach((key: string) => Zotero.Prefs.clear('aria.message.' + key, true))
      Zotero.Prefs.clear(rootKey, true)
      console.log('Aria messages in prefs removed.')
    } catch (error) {
      console.log('Error removing Aria messages in prefs', error)
    }
  }

  private launchApp() {
    const windowArgs = {
      _initPromise: Zotero.Promise.defer(),
    }
    const dialogWidth = Math.max(window.outerWidth * 0.6, 720)
    const dialogHeight = window.outerHeight * 0.8
    const left = window.screenX + window.outerWidth / 2 - dialogWidth / 2
    const top = window.screenY + window.outerHeight / 2 - dialogHeight / 2
    const dialog = (window as any).openDialog(
      'chrome://aria/content/popup.xhtml',
      `${config.addonRef}-window`,
      `chrome,titlebar,status,width=${dialogWidth},height=${dialogHeight},left=${left},top=${top},resizable=yes`,
      windowArgs
    )
    // Assign the dialog to the addon object so that it can be accessed from within the addon
    addon.data.popup.window = dialog
    // await windowArgs._initPromise.promise
    this.dialog = dialog
    const this2 = this
    dialog!.addEventListener(
      'load',
      function () {
        const entry = dialog.document.getElementById('aria-entry-point')
        ReactDOM.render(React.createElement(Providers), entry)
      },
      { once: true }
    )
    dialog.addEventListener(
      'dialogclosing',
      function () {
        this2.dialog = undefined
      },
      { once: true }
    )
  }

  private registerShortcut() {
    // Keycodes: https://github.com/windingwind/zotero-plugin-toolkit/blob/da8a602b81a7586b51a29baff86d22d0422b6580/src/managers/shortcut.ts#L746
    const shortCut = new ShortcutManager()
    shortCut.register('event', {
      id: 'aria-plugin-key',
      modifiers: (Zotero.Prefs.get(`${config.addonRef}.SHORTCUT_MODIFIER`) as string) || 'shift',
      key: (Zotero.Prefs.get(`${config.addonRef}.SHORTCUT_KEY`) as string) || 'r',
      callback: event => {
        if (this.dialog && !this.dialog.closed) {
          this.dialog.focus()
        } else {
          this.launchApp()
        }
      },
    })
  }
}

export class ReactRootManager extends ManagerTool {
  private reactRoot: ReactRoot

  constructor(base?: BasicTool | BasicOptions) {
    super(base)
    this.reactRoot = new ReactRoot()
  }

  public register(
    commands: {
      name: string
      label?: string
      when?: () => boolean
      callback: ((reactRoot: ReactRoot) => Promise<void>) | ((reactRoot: ReactRoot) => void) | any[]
    }[]
  ) {}

  public unregister(name: string) {}

  public unregisterAll() {}
}
