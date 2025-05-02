# Agentic AI Chrome Extension

A Chrome extension that implements an agentic AI system using the meta-llama/llama-4-scout-17b-16e-instruct model. The extension can handle complex queries by breaking them down into multiple LLM interactions and tool calls.

## Features

- Interactive chat interface
- Persistent conversation history
- Agentic AI capabilities
- Tool integration for complex tasks
- Clean and modern UI

## Installation

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Configuration

Before using the extension, you need to:

1. Replace `YOUR_LLM_API_ENDPOINT` in popup.js with your actual LLM API endpoint
2. Replace `YOUR_API_KEY` in popup.js with your actual API key

## Usage

1. Click the extension icon in your Chrome toolbar
2. Type your query in the input box
3. Click "Submit" to process your query
4. The extension will:
   - Analyze your query
   - Determine if tool usage is needed
   - Execute necessary tools
   - Provide a complete answer

## Example Queries

- "Calculate the sum of exponential values of the first 6 Fibonacci Numbers"
- "What is the square root of 144 multiplied by the cube root of 27?"
- "Find the average of the first 10 prime numbers"

## Development

The extension consists of:
- manifest.json: Extension configuration
- popup.html: User interface
- popup.js: Main logic
- background.js: Background processes
- styles.css: Styling
- icons/: Extension icons

## License

MIT License 