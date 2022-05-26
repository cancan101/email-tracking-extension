console.log('This is the background page.');
console.log('Put the background scripts here.');

chrome.runtime.onMessageExternal.addListener(function (
  message,
  sender,
  send_response
) {
  // TODO: check the sender here
  console.log('background::onMessageExternal', sender, message);
  const runner = async () => {
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
        return accountEntry;
      } else {
        return;
      }
    } /*else if (message.your === 'TEST') {
      setTimeout(() => send_response({ foo: 'bar' }), 10);
    }*/
    return;
  };
  runner().then((response) => send_response(response));
  return true;
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // TODO: check the sender here
  console.log('background::onMessage', request, sender);
  if (request.your === 'LOGIN_IN') {
    console.log('receive login');
    // TODO: pull off the login info
    notifyLogin(request);
  } else if (request.your === 'LOG_OUT') {
    console.log('receive logout');
    // TODO: notify login rather than forcing reload
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

function notifyLogin(request) {
  chrome.tabs.query({ url: '*://mail.google.com/*' }, function (tabs) {
    tabs.forEach(function (tab) {
      // TODO: format just the info needed to indicate login
      chrome.tabs.sendMessage(tab.id, { request });
    });
  });
}

// reload gmail tab on installation (this will allow extension to initialize correctly)
chrome.runtime.onInstalled.addListener(reloadTabs);
