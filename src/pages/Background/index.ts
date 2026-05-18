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

// Validate that an inbound externally_connectable message actually originated
// from a mail.google.com page. The manifest's `externally_connectable.matches`
// is the primary gate, but explicit validation is cheap defense-in-depth and
// surfaces an obvious red flag if the manifest ever loosens.
//
// Note: this does NOT prevent token theft from a malicious script *already
// running* in a Gmail tab (e.g., from another extension that injects into
// Gmail, or a Gmail XSS). The proper fix is to stop exposing raw tokens to
// page-context callers at all and instead proxy API calls through the
// background worker; that's a larger refactor tracked separately.
function isAllowedExternalSender(
  sender: chrome.runtime.MessageSender
): boolean {
  if (typeof sender.url !== 'string') return false;
  let url: URL;
  try {
    url = new URL(sender.url);
  } catch {
    return false;
  }
  return url.protocol === 'https:' && url.hostname === 'mail.google.com';
}

chrome.runtime.onMessageExternal.addListener(
  function (message, sender, send_response) {
    if (!isAllowedExternalSender(sender)) {
      console.warn('background::onMessageExternal rejected sender', sender.url);
      send_response();
      return false;
    }

    const runner = async () => {
      if (message.your === 'STORAGE') {
        const { emailAccount } = message;
        if (typeof emailAccount !== 'string') {
          return;
        }
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
      }
      return;
    };
    runner().then((response) => send_response(response));
    return true;
  }
);

// chrome.runtime.onMessage only fires for messages from THIS extension's own
// contexts (content scripts, popup, options pages). Chrome guarantees
// sender.id === chrome.runtime.id, so we don't need an explicit id check, but
// we do reject anything that isn't from our own scripts.
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (sender.id !== chrome.runtime.id) {
    console.warn('background::onMessage rejected sender', sender);
    sendResponse();
    return false;
  }
  if (request.your === 'LOGIN_IN') {
    notifyLogin(request.emailAccount);

    // Close the tab automatically
    const tabId = sender.tab?.id;
    if (tabId !== undefined) {
      chrome.tabs.remove([tabId]);
    }
  } else if (request.your === 'LOG_OUT') {
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

function notifyLogout(): void {
  chrome.tabs.query({ url: 'https://mail.google.com/*' }, function (tabs) {
    tabs.forEach(function (tab) {
      if (tab.id !== undefined) {
        chrome.tabs.sendMessage(tab.id, { your: 'LOG_OUT' });
      }
    });
  });
}

// reload gmail tab on installation (this will allow extension to initialize correctly)
chrome.runtime.onInstalled.addListener(reloadTabs);
