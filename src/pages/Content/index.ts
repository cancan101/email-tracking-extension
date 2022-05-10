console.log('Content script works!');

function addScript(src: string): void {
  console.log(`addScript: ${src}`);
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = chrome.runtime.getURL(src);
  script.dataset.extensionId = chrome.runtime.id;
  (document.body || document.head || document.documentElement).appendChild(
    script
  );
}

addScript('gmailJsLoader.bundle.js');

window.addEventListener(
  'get-settings-data',
  function (event) {
    console.log('get-settings-data');
    window.dispatchEvent(
      new CustomEvent('settings-retrieved', { detail: 'settingsData' })
    );
  },
  false
);
