console.log('Content script works!');

function addScript(src: string): void {
  console.log(`addScript: ${src}`);
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = chrome.runtime.getURL(src);
  // Set this so injector can read off
  script.dataset.extensionId = chrome.runtime.id;
  (document.body || document.head || document.documentElement).appendChild(
    script
  );
}

addScript('gmailJsLoader.bundle.js');

// chrome.runtime.onMessage only fires for messages from this extension's own
// contexts (background/popup/options), so sender.id === chrome.runtime.id is
// guaranteed by Chrome. External pages cannot reach this listener.
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log('contentScript::onMessage', request, sender);
  const eventType = request.your;
  if (eventType === 'LOGIN_IN') {
    window.dispatchEvent(new CustomEvent('login-notice', { detail: request }));
  } else if (eventType === 'LOG_OUT') {
    window.dispatchEvent(new CustomEvent('logout-notice', { detail: request }));
  }
  sendResponse();
});
