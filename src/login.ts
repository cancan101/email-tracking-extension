const baseUrl = process.env.EMAIL_TRACKING_BACKEND_URL;
const useMagicUrl = `${baseUrl}/api/v1/login/use-magic`;

// -------------------------------------------------

function processLogin(
  accessToken: string,
  expiresIn: number,
  emailAccount: string,
  trackingSlug: string
) {
  const expiresAt = new Date().getTime() / 1000 + expiresIn;
  console.log(
    'Saving accessToken and expiresAt',
    emailAccount,
    expiresAt,
    expiresIn,
    trackingSlug
  );

  chrome.storage.sync
    .set({
      [emailAccount]: {
        accessToken,
        expiresAt,
        trackingSlug,
      },
    })
    .then(() => {
      chrome.runtime.sendMessage({ your: 'LOGIN_IN', emailAccount });

      const loggedInUrl = new URL(window.location.toString());
      loggedInUrl.pathname = '/logged-in';
      loggedInUrl.search = '';

      window.location.replace(loggedInUrl);
    })
    .catch((e) => {
      console.error(e);
    });
}

async function processQsLogin() {
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get('token');
  if (!token) {
    console.log('Missing token');
    return;
  }
  const resp = await fetch(useMagicUrl, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({ token }),
  });

  if (!resp.ok) {
    console.log('Error with fetch. Received:', resp.status);
    return;
  }
  const data = await resp.json();
  const accessToken = data['accessToken'];
  const expiresIn = data['expiresIn'];
  const emailAccount = data['emailAccount'];
  const trackingSlug = data['trackingSlug'];

  if (accessToken && expiresIn && emailAccount && trackingSlug) {
    processLogin(accessToken, expiresIn, emailAccount, trackingSlug);
  } else {
    console.log('Missing accessToken or expiresIn');
    return;
  }
}

processQsLogin();
