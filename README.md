# A.R.I.A. (Aria) - Your AI Research Assistant

[![License](https://img.shields.io/github/license/lifan0127/ai-research-assistant)](https://github.com/lifan0127/ai-research-assistant/blob/master/LICENSE)
[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-square&logo=github)](https://github.com/windingwind/zotero-plugin-template)

Aria is a Zotero plugin powered by Large Language Models (LLMs). A-R-I-A is the acronym of "AI Research Assistant" in reverse order.

This branch is developed based on [_A.R.I.A. (Aria) - Your AI Research Assistant_](https://github.com/lifan0127/ai-research-assistant) By [_lifan0127_](https://github.com/lifan0127)

## Build the project
Here is an example on how to build this project. For more information on how to build, please visit this project: [https://github.com/windingwind/zotero-plugin-template](https://github.com/windingwind/zotero-plugin-template)


For Zotero 7
```bash
git clone -b zotero-7 https://github.com/zhiruiw1/ai-research-assistant/
```
Go to the directory and build the project
```bash
cd zotero-gpt
npm install
npm run build
```

## Installation

The generated `.xpi` file in the build directory is the extension that you can install in Zotero.

#### Go to 'Tool' tab
![Tool tab](assets/screenshots/Tool-tab.png)

#### Select 'Plugin' tab
![Plugin tab](assets/screenshots/Plugin-tab.png)

#### Click on 'Setting'
![Setting](assets/screenshots/Plugin-setting.png)

#### Select 'Install Plugin From File...'
![Setting](assets/screenshots/install-plugin.png)

#### Allocate 'build' folder
![Build folder](assets/screenshots/build-folder.png)

#### Select 'aria.xpi' file
![aria xpi](assets/screenshots/select-file.png)

#### Plugin installed
![aria installed](assets/screenshots/installed.png)

## Quickstart

### Use Drag-and-Drop to Reference Your Zotero Items and Collections

![Drag and Drop](assets/videos/drag-and-drop.gif)

## Added Feature

### Exporting CSV file for JSON prompt answer

![Export Button](assets/screenshots/export-button.png)

#### Provide a JSON prompt

![JSON prompt](assets/screenshots/JSON-prompt-example.png)

#### Save to local file path

![Saving](assets/screenshots/export-example.png)

### Output CSV file
![File example](assets/screenshots/file-example.png)


## Zotero and GPT Requirements

- Currently, only Zotero 7 is supported.
- Aria requires the OpenAI GPT-4 model family. ([how can I access GPT-4?](https://help.openai.com/en/articles/7102672-how-can-i-access-gpt-4))

## Preferences

Aria is configurable through Edit > Preferences > Aria. Please note that some changes require Zotero restart.

- __OpenAI API__: Set OpenAI api key and base URL
- __Model Selection__: Choose between the base GPT-4 model and the new GPT-4 Turbo model (Preview).
- __OpenAI Configurations__: Set the temperature and top_p value.
- __Zoom Level__: Adjust the zoom level to fit your screen resolution 
- __Keyboard shortcut__: Change the keyboard shortcut combination to better fit your workflow.

![Aria](assets/screenshots/ChatGPT-configs.png)

## Development

Refer to the [Zotero Plugin Development](https://www.zotero.org/support/dev/client_coding/plugin_development) guide to find instructions on how to setup the plugin in your local environment.




