import React, { useState } from 'react';

const baseUrl = process.env.EMAIL_TRACKING_BACKEND_URL;
const loginUrl = `${baseUrl}/login/magic`;

type LoginState = 'UNREQUESTED' | 'REQUESTING' | 'REQUESTED';

export default function Login({
  userEmail,
  loggedIn,
}: {
  userEmail: string;
  loggedIn: boolean;
}): React.ReactElement {
  const [loginState, setLoginState] = useState<LoginState>('UNREQUESTED');

  if (loginState === 'REQUESTING') {
    return <div>Requesting...</div>;
  } else if (loginState === 'REQUESTED') {
    return <div>Requested</div>;
  }

  const doLogin = async () => {
    setLoginState('REQUESTING');
    await fetch(loginUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ email: userEmail }),
    });
    setLoginState('REQUESTED');
  };

  const style = loggedIn
    ? { display: 'none' }
    : { marginLeft: '12px', marginRight: '12px' };

  return (
    <div style={style} onClick={doLogin}>
      Login
    </div>
  );
}
