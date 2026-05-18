import React, { useState } from 'react';

import './Popup.css';
import '../../sentry';

// -------------------------------------------------

const Popup = () => {
  const [isLoggingOut, setLoggingOut] = useState(false);

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      // Clear stored credentials first so a parallel Gmail tab that re-reads
      // storage after the LOG_OUT broadcast won't find a stale token.
      // TODO: we should also probably notify server to clear the right cookie
      try {
        await chrome.storage.sync.clear();
      } catch (e) {
        console.error('storage.sync.clear failed', e);
      }
      await chrome.runtime.sendMessage({ your: 'LOG_OUT' });
      // Close the popup so the user gets clear feedback that logout completed.
      window.close();
    } finally {
      // In case window.close() is blocked, re-enable the button so the user
      // can retry instead of being stuck on a disabled control.
      setLoggingOut(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <button className="App-link" disabled={isLoggingOut} onClick={onLogout}>
          Log out
        </button>
      </header>
    </div>
  );
};

export default Popup;
