console.log('This is the background page.');
console.log('Put the background scripts here.');

chrome.runtime.onMessageExternal.addListener(function (
  message,
  sender,
  send_response
) {
  send_response('hi extension.js!');
});
