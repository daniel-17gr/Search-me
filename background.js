// Search Me Extension - Background Service Worker for CORS-Free Autocomplete
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchSuggestions') {
    const query = request.query || '';
    if (!query.trim()) {
      sendResponse({ success: false, error: 'Empty query' });
      return true;
    }

    const url = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`;
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        sendResponse({ success: true, data });
      })
      .catch(err => {
        sendResponse({ success: false, error: err.toString() });
      });

  if (request.action === 'updateIconTheme') {
    const suffix = request.isDark ? '_dark' : '_light';
    if (chrome.action && chrome.action.setIcon) {
      chrome.action.setIcon({
        path: {
          "16":  `icons/icon16${suffix}.png`,
          "32":  `icons/icon32${suffix}.png`,
          "48":  `icons/icon48${suffix}.png`,
          "128": `icons/icon128${suffix}.png`
        }
      });
    }
    sendResponse({ success: true });
    return true;
  }
});
