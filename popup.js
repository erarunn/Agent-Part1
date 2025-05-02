// Store conversation history
let conversationHistory = [];

// Initialize the extension
document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('submitQuery');
    const queryInput = document.getElementById('queryInput');
    const conversationHistoryDiv = document.getElementById('conversationHistory');

    // Load conversation history from storage
    chrome.storage.local.get(['conversationHistory'], (result) => {
        if (result.conversationHistory) {
            conversationHistory = result.conversationHistory;
            updateConversationDisplay();
        }
    });

    submitButton.addEventListener('click', async () => {
        const query = queryInput.value.trim();
        if (!query) return;

        // Add user query to conversation
        addToConversation('user', query);
        queryInput.value = '';

        try {
            // Process the query through the agentic system
            const result = await processQuery(query);
            addToConversation('ai', result);
        } catch (error) {
            addToConversation('ai', `Error: ${error.message}`);
        }

        // Save conversation history
        chrome.storage.local.set({ conversationHistory });
    });
});

// Add message to conversation and update display
function addToConversation(role, content) {
    conversationHistory.push({ role, content });
    updateConversationDisplay();
}

// Update the conversation display
function updateConversationDisplay() {
    const conversationHistoryDiv = document.getElementById('conversationHistory');
    conversationHistoryDiv.innerHTML = '';

    conversationHistory.forEach((message) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}-message`;
        messageDiv.textContent = message.content;
        conversationHistoryDiv.appendChild(messageDiv);
    });

    // Scroll to bottom
    conversationHistoryDiv.scrollTop = conversationHistoryDiv.scrollHeight;
}

// Simple fallback responses for common queries
const fallbackResponses = {
    'hi': 'Hello! How can I assist you today?',
    'hello': 'Hi there! How can I help you?',
    'help': 'I can help you with various tasks. Try asking me a question or giving me a task to complete.',
    'error': 'I apologize, but I\'m having trouble connecting to the AI service. Please try again later or rephrase your question.'
};

// Process query through the agentic system
async function processQuery(query) {
    // Check for simple fallback responses first
    const lowerQuery = query.toLowerCase().trim();
    if (fallbackResponses[lowerQuery]) {
        return fallbackResponses[lowerQuery];
    }

    // Initialize the conversation with the model
    let currentContext = conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    
    try {
        // First LLM call to analyze the query
        const analysisResponse = await callLLMWithRetry(currentContext + '\n\nAnalyze this query and provide a concise answer with only the essential information: ' + query);
        
        // Check if tool usage is needed
        if (analysisResponse.includes('tool')) {
            // Extract tool information from the response
            const toolInfo = await callLLMWithRetry(currentContext + '\n\nBased on the analysis, what tool should be used and with what parameters?');
            
            // Execute the tool call
            const toolResult = await executeTool(toolInfo);
            
            // Add tool result to context
            currentContext += `\nTool Result: ${toolResult}`;
            
            // Final LLM call to provide the complete answer
            const finalResponse = await callLLMWithRetry(currentContext + '\n\nProvide a concise final answer with only the essential information:');
            
            return finalResponse;
        } else {
            // If no tool is needed, return the direct response
            return analysisResponse;
        }
    } catch (error) {
        console.error('Error processing query:', error);
        return fallbackResponses['error'];
    }
}

// Call the LLM API with retry mechanism
async function callLLMWithRetry(prompt, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await callLLM(prompt);
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);
            if (attempt === maxRetries) {
                throw error;
            }
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }
}

// Call the LLM API
async function callLLM(prompt) {
    const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    const API_KEY = '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';

    try {
        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that provides concise answers with only essential information. For mathematical calculations, provide only the final result. Do not include any special symbols, boxes, or formatting. Just provide the plain answer.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 100,
                top_p: 0.95,
                frequency_penalty: 0,
                presence_penalty: 0
            })
        });

        if (!apiResponse.ok) {
            const errorData = await apiResponse.json();
            throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await apiResponse.json();
        // Clean up the response by removing special characters and formatting
        let cleanResponse = data.choices[0].message.content.trim();
        cleanResponse = cleanResponse.replace(/[$\boxed{}]/g, ''); // Remove $, \boxed, and {}
        cleanResponse = cleanResponse.replace(/^\s*The\s+final\s+answer\s+is:\s*/i, ''); // Remove "The final answer is:"
        return cleanResponse;
    } catch (error) {
        console.error('LLM API Error:', error);
        throw new Error(`Failed to call LLM API: ${error.message}`);
    }
}

// Execute tool based on the tool info
async function executeTool(toolInfo) {
    // This is a simplified example. In a real implementation, you would:
    // 1. Parse the tool info to determine which tool to use
    // 2. Execute the appropriate tool
    // 3. Return the result
    
    // For demonstration, we'll just return a mock result
    return `Tool executed with info: ${toolInfo}`;
} 