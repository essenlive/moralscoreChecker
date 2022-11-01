chrome.runtime.onMessage.addListener(function (request, sender) {
    chrome.browserAction.setBadgeBackgroundColor({ color: '#000' }, () => {
        chrome.browserAction.setBadgeText({ text: request, tabId: sender.tab.id });
    })
});