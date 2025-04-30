document.addEventListener('DOMContentLoaded', () => {
    const queryInput = document.getElementById('queryInput');
    const submitButton = document.getElementById('submitQuery');
    const conversationHistory = document.getElementById('conversationHistory');
    let conversationContext = [];

    submitButton.addEventListener('click', async () => {
        const query = queryInput.value.trim();
        if (!query) return;

        // Add user message to UI
        addMessageToUI('user', query);
        queryInput.value = '';

        try {
            console.log('Sending query to background script:', query);
            // Send message to background script
            const response = await chrome.runtime.sendMessage({
                type: 'processQuery',
                query: query,
                context: conversationContext
            });

            console.log('Received response from background script:', response);

            if (response.error) {
                addMessageToUI('assistant', `Error: ${response.error}`);
                return;
            }

            // Add assistant response to UI
            addMessageToUI('assistant', response.finalResponse);
            
            // Update conversation context
            conversationContext = response.updatedContext;
        } catch (error) {
            console.error('Error in popup:', error);
            addMessageToUI('assistant', `Error: ${error.message}`);
        }
    });

    function addMessageToUI(type, content) {
        console.log('Adding message to UI:', { type, content });
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.textContent = content;
        conversationHistory.appendChild(messageDiv);
        conversationHistory.scrollTop = conversationHistory.scrollHeight;
    }
}); 