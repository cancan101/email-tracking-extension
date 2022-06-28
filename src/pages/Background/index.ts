import * as Sentry from '@sentry/react';

import { sentrySettings, sentryEnabled } from '../../settings';

// -------------------------------------------------

if (sentryEnabled) {
  Sentry.init({
    ...sentrySettings,
  });
}

// -------------------------------------------------

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
    notifyLogin(request.emailAccount);

    // Close the tab automatically
    const tabId = sender.tab?.id;
    if (tabId !== undefined) {
      chrome.tabs.remove([tabId]);
    }
  } else if (request.your === 'LOG_OUT') {
    console.log('receive logout');
    notifyLogout();
  }
  // https://stackoverflow.com/a/71520415/2638485
  sendResponse();
});

function reloadTabs(): void {
  chrome.tabs.query({ url: 'https://mail.google.com/*' }, function (tabs) {
    tabs.forEach(function (tab) {
      if (tab.id !== undefined) {
        chrome.tabs.reload(tab.id);
      }
    });
  });
}

function notifyLogin(emailAccount: string): void {
  chrome.tabs.query({ url: 'https://mail.google.com/*' }, function (tabs) {
    tabs.forEach(function (tab) {
      if (tab.id !== undefined) {
        chrome.tabs.sendMessage(tab.id, { your: 'LOGIN_IN', emailAccount });
      }
    });
  });
}

function notifyLogout(emailAccount?: string): void {
  chrome.tabs.query({ url: 'https://mail.google.com/*' }, function (tabs) {
    tabs.forEach(function (tab) {
      if (tab.id !== undefined) {
        chrome.tabs.sendMessage(tab.id, { your: 'LOG_OUT', emailAccount });
      }
    });
  });
}

// reload gmail tab on installation (this will allow extension to initialize correctly)
chrome.runtime.onInstalled.addListener(reloadTabs);
