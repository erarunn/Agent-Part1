document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const saveButton = document.getElementById('save');
    const statusDiv = document.getElementById('status');

    // Load saved API key
    chrome.storage.sync.get(['huggingfaceApiKey'], (result) => {
        if (result.huggingfaceApiKey) {
            apiKeyInput.value = result.huggingfaceApiKey;
        }
    });

    // Save API key
    saveButton.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            showStatus('Please enter an API key', 'error');
            return;
        }

        // Save to storage
        chrome.storage.sync.set({ huggingfaceApiKey: apiKey }, () => {
            // Update background script
            chrome.runtime.sendMessage({ type: 'setApiKey', apiKey }, (response) => {
                if (response.success) {
                    showStatus('API key saved successfully!', 'success');
                } else {
                    showStatus('Error saving API key', 'error');
                }
            });
        });
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = type;
        statusDiv.style.display = 'block';
        
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}); 