console.log('This is the background page.');
console.log('Put the background scripts here.');

chrome.runtime.onMessageExternal.addListener(async function (
  message,
  sender,
  send_response
) {
  if (message.your === 'STORAGE') {
    const { emailAccount } = message;
    console.log('receive storage', emailAccount);
    let storageData;
    try {
      storageData = await chrome.storage.sync.get();
    } catch {
      //ignore
      return;
    }
    const accountEntry = storageData[emailAccount];
    if (accountEntry) {
      send_response(accountEntry);
    }
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.your === 'LOGIN_IN') {
    console.log('receive login');
    reloadTabs();
  } else if (request.your === 'LOG_OUT') {
    console.log('receive logout');
    reloadTabs();
  }
  // https://stackoverflow.com/a/71520415/2638485
  sendResponse();
});

function reloadTabs() {
  chrome.tabs.query({ url: '*://mail.google.com/*' }, function (tabs) {
    tabs.forEach(function (tab) {
      chrome.tabs.reload(tab.id);
    });
  });
}

// reload gmail tab on installation (this will allow extension to initialize correctly)
chrome.runtime.onInstalled.addListener(reloadTabs);
