import React, { useState, useEffect } from 'react';
import useStore from './store';

type LoginState = 'UNREQUESTED' | 'REQUESTING' | 'REQUESTED' | 'FAILED';

const FAILED_RESET_MS = 5_000;

export default function LoginButton({
  requestLogin,
}: {
  requestLogin: () => Promise<void>;
}): React.ReactElement {
  const [loginState, setLoginState] = useState<LoginState>('UNREQUESTED');
  const [errorTitle, setErrorTitle] = useState<string | undefined>(undefined);
  const isLoggedIn = useStore((state) => state.isLoggedIn());

  let label: string;
  if (loginState === 'REQUESTING') {
    label = 'Requesting...';
  } else if (loginState === 'REQUESTED') {
    label = 'Requested';
  } else if (loginState === 'FAILED') {
    label = 'Login failed — try again';
  } else {
    label = 'Login';
  }

  const doLogin = async () => {
    if (loginState === 'REQUESTING' || loginState === 'REQUESTED') {
      return;
    }
    setLoginState('REQUESTING');
    setErrorTitle(undefined);
    try {
      await requestLogin();
      setLoginState('REQUESTED');
    } catch (err) {
      // requestLogin throws on network/timeout/rate-limit; surface this to
      // the user instead of leaving the button stuck on "Requested".
      console.error('LoginButton: requestLogin failed', err);
      setErrorTitle(err instanceof Error ? err.message : String(err));
      setLoginState('FAILED');
      // After a few seconds, reset so the user can retry.
      setTimeout(() => {
        setLoginState((current) =>
          current === 'FAILED' ? 'UNREQUESTED' : current
        );
      }, FAILED_RESET_MS);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      setLoginState('UNREQUESTED');
      setErrorTitle(undefined);
    }
  }, [isLoggedIn]);

  const style = isLoggedIn
    ? { display: 'none' }
    : { marginLeft: '12px', marginRight: '12px' };

  // we should pass a sync function to onClick
  return (
    <div style={style} onClick={doLogin} title={errorTitle}>
      {label}
    </div>
  );
}
