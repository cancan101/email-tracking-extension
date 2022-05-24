import React, { useState } from 'react';

type LoginState = 'UNREQUESTED' | 'REQUESTING' | 'REQUESTED';

export default function LoginButton({
  isLoggedIn,
  requestLogin,
}: {
  isLoggedIn: boolean;
  requestLogin: () => Promise<void>;
}): React.ReactElement {
  const [loginState, setLoginState] = useState<LoginState>('UNREQUESTED');

  let label: string;
  if (loginState === 'REQUESTING') {
    label = 'Requesting...';
  } else if (loginState === 'REQUESTED') {
    label = 'Requested';
  } else {
    label = 'Login';
  }

  const doLogin = async () => {
    if (loginState !== 'UNREQUESTED') {
      return;
    }
    setLoginState('REQUESTING');
    await requestLogin();
    setLoginState('REQUESTED');
  };

  const style = isLoggedIn
    ? { display: 'none' }
    : { marginLeft: '12px', marginRight: '12px' };

  return (
    <div style={style} onClick={doLogin}>
      {label}
    </div>
  );
}
