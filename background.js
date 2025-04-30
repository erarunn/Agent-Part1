// Configuration
let API_KEY = '';

// Load API key from storage on startup
chrome.storage.sync.get(['huggingfaceApiKey'], (result) => {
    if (result.huggingfaceApiKey) {
        API_KEY = result.huggingfaceApiKey;
        console.log('API key loaded from storage');
    }
});

// Tool implementations
const tools = {
    calculate: (expression) => {
        try {
            return eval(expression);
        } catch (error) {
            return `Error calculating: ${error.message}`;
        }
    },
    fibonacci: (n) => {
        if (n <= 1) return n;
        let a = 0, b = 1;
        for (let i = 2; i <= n; i++) {
            [a, b] = [b, a + b];
        }
        return b;
    }
};

// Process a single LLM interaction
async function processLLMInteraction(query, context) {
    console.log('Processing LLM interaction with query:', query);
    console.log('Context:', context);

    if (!API_KEY) {
        throw new Error('Please set your Hugging Face API key in the extension options');
    }

    try {
        console.log('Making API request to Hugging Face...');
        const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                inputs: formatPrompt(query, context),
                parameters: {
                    max_new_tokens: 100,
                    temperature: 0.7,
                    top_p: 0.95,
                    repetition_penalty: 1.1,
                    return_full_text: false,
                    do_sample: true,
                    early_stopping: true
                }
            })
        });

        console.log('API Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(`API request failed: ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        console.log('API Response data:', data);
        
        if (!data || !data[0] || !data[0].generated_text) {
            throw new Error('Invalid response format from API');
        }
        
        // Clean up the response text
        let generatedText = data[0].generated_text;
        
        // Remove any special tokens or formatting artifacts
        generatedText = generatedText.replace(/\[INST\]|\[\/INST\]|\[STUB_TEXT\]|\[\/STUB_TEXT\]|\[STRATEGED\]|\[\/STRATEGED\]/g, '');
        
        // Remove any trailing incomplete sentences
        generatedText = generatedText.replace(/[^.!?]+$/, '');
        
        // Trim whitespace
        generatedText = generatedText.trim();
        
        return generatedText;
    } catch (error) {
        console.error('Error in processLLMInteraction:', error);
        throw new Error(`LLM API Error: ${error.message}`);
    }
}

// Format the prompt for the model
function formatPrompt(query, context) {
    // Limit context to last 3 messages to stay within token limits
    const recentContext = context ? context.slice(-3) : [];
    
    let prompt = 'You are an AI assistant that can perform calculations and generate Fibonacci numbers. ';
    prompt += 'When you need to perform these operations, use the appropriate tool calls in the format [TOOL:toolName:arguments]. ';
    prompt += 'Available tools are: calculate and fibonacci.\n\n';
    
    // Add context if available
    if (recentContext.length > 0) {
        prompt += 'Previous conversation:\n';
        recentContext.forEach(msg => {
            prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        });
        prompt += '\n';
    }
    
    prompt += `Current query: ${query}`;
    return prompt;
}

// Process tool calls in the LLM response
function processToolCalls(response) {
    console.log('Processing tool calls in response:', response);
    const toolCallRegex = /\[TOOL:(\w+):(.*?)\]/g;
    let processedResponse = response;
    let match;

    while ((match = toolCallRegex.exec(response)) !== null) {
        const [fullMatch, toolName, toolArgs] = match;
        console.log('Found tool call:', { toolName, toolArgs });
        if (tools[toolName]) {
            const result = tools[toolName](toolArgs);
            console.log('Tool result:', result);
            processedResponse = processedResponse.replace(fullMatch, result.toString());
        }
    }

    return processedResponse;
}

// Main message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);
    
    if (request.type === 'processQuery') {
        console.log('Processing query:', request.query);
        handleQuery(request.query, request.context)
            .then(result => {
                console.log('Query result:', result);
                sendResponse(result);
            })
            .catch(error => {
                console.error('Query error:', error);
                sendResponse({ error: error.message });
            });
        return true; // Required for async response
    } else if (request.type === 'setApiKey') {
        API_KEY = request.apiKey;
        sendResponse({ success: true });
        return true;
    }
});

// Handle the complete query process
async function handleQuery(query, context) {
    console.log('Starting handleQuery with:', { query, context });
    let currentContext = [...context, { role: 'user', content: query }];
    let finalResponse = '';
    let maxIterations = 5;
    let iteration = 0;

    while (iteration < maxIterations) {
        console.log('Iteration:', iteration);
        // Get LLM response
        const llmResponse = await processLLMInteraction(query, currentContext);
        console.log('LLM Response:', llmResponse);
        
        // Process tool calls
        const processedResponse = processToolCalls(llmResponse);
        console.log('Processed Response:', processedResponse);
        
        // Add to context
        currentContext.push({ role: 'assistant', content: processedResponse });
        
        // Check if we need to continue
        if (!processedResponse.includes('[TOOL:')) {
            finalResponse = processedResponse;
            break;
        }
        
        iteration++;
    }

    console.log('Final response:', finalResponse);
    return {
        finalResponse,
        updatedContext: currentContext
    };
} 