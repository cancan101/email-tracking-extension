function processLogin() {
  console.log('Logging in...');
  // FIXME(cancan101): this is mega insecure and can have values injected.
  if (window.location.hash.charAt(0) === '#') {
    const loginPayloadStr = window.location.hash.slice(1);

    const data = new URLSearchParams(loginPayloadStr);

    const accessToken = data.get('accessToken');
    const expiresInStr = data.get('expiresIn');
    const emailAccount = data.get('emailAccount');

    if (accessToken && expiresInStr && emailAccount) {
      const expiresIn = parseInt(expiresInStr, 10);
      const expiresAt = new Date().getTime() / 1000 + expiresIn;
      console.log(
        'Saving accessToken and expiresAt',
        emailAccount,
        expiresAt,
        expiresIn,
        new Date().getTime() / 1000
      );

      chrome.storage.sync
        .set({
          [emailAccount]: {
            accessToken,
            expiresAt,
          },
        })
        .catch((e) => {
          // ignore
        });
      chrome.runtime.sendMessage({ your: 'LOGIN_IN' });

      window.location.hash = '';
      window.location.pathname = '/logged-in';
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
