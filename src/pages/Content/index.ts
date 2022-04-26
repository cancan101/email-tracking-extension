import { printLine } from './modules/print';

console.log('Content script works!');
console.log('Must reload extension for modifications to take effect.');

printLine("Using the 'printLine' function from the Print Module");

function addScript(src: string) {
  console.log(`addScript: ${src}`);
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = chrome.runtime.getURL(src);
  (document.body || document.head || document.documentElement).appendChild(
    script
  );
}

addScript('gmailJsLoader.bundle.js');

const value = 'value';
chrome.storage.sync.set({ key: value }, function () {
  console.log('Value is set to ' + value);
});
