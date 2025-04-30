# Agentic AI Chrome Extension

A Chrome extension that implements an agentic AI system capable of handling complex tasks through multiple LLM interactions.

## Features

- Simple and intuitive interface
- Maintains conversation context
- Supports tool calls for complex calculations
- Handles multiple LLM interactions automatically

## Installation

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon in your Chrome toolbar
2. Enter your query in the text area
3. Click "Submit" to process your query
4. The extension will handle multiple LLM interactions automatically
5. View the conversation history in the chat window

## Development

To modify the extension:

1. Update the `LLM_API_ENDPOINT` in `background.js` to point to your LLM API
2. Add new tools in the `tools` object in `background.js`
3. Modify the UI in `popup.html` and `styles.css`

## Example Queries

- "Calculate the sum of exponential values of the first 6 Fibonacci Numbers"
- "What is the square root of 144?"
- "Generate the first 10 Fibonacci numbers"

## Note

This extension requires an LLM API endpoint to function. The current implementation uses a mock endpoint that needs to be replaced with a real one. 