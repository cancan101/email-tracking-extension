function processLogin() {
  console.log('Logging in...');
  if (window.location.hash.charAt(0) === '#') {
    const loginPayloadStr = window.location.hash.slice(1);
    const data = new URLSearchParams(loginPayloadStr);
    const accessToken = data.get('accessToken');
    const expiresInStr = data.get('expiresIn');
    if (accessToken && expiresInStr) {
      const expiresIn = parseInt(expiresInStr, 10);
      const expiresAt = new Date().getTime() / 1000 + expiresIn;
      console.log(
        'Saving accessToken and expiresAt',
        expiresAt,
        expiresIn,
        new Date().getTime() / 1000
      );
      chrome.storage.sync.set({
        accessToken,
        expiresAt,
      });
      window.location.hash = '';
      window.location.pathname = '/logged-in';
      chrome.runtime.sendMessage({ your: 'LOGIN_IN' });
    } else {
      console.log('Missing accessToken or expiresIn');
      return;
    }
  } else {
    console.log('Missing hash');
    return;
  }
}

processLogin();
