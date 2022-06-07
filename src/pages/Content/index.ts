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

// window.addEventListener(
//   'get-settings-data',
//   function (event) {
//     console.log('get-settings-data');
//     window.dispatchEvent(
//       new CustomEvent('settings-retrieved', { detail: 'settingsData' })
//     );
//   },
//   false
// );

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log('contentScript::onMessage', request, sender);
  // TODO: check the sender here
  const eventType = request.your;
  if (eventType === 'LOGIN_IN') {
    window.dispatchEvent(new CustomEvent('login-notice', { detail: request }));
  } else if (eventType === 'LOG_OUT') {
    window.dispatchEvent(new CustomEvent('logout-notice', { detail: request }));
  }
  sendResponse();
});
