// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Agentic AI Assistant installed');
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CLEAR_HISTORY') {
        chrome.storage.local.remove(['conversationHistory'], () => {
            sendResponse({ success: true });
        });
        return true; // Required for async response
    }
}); 