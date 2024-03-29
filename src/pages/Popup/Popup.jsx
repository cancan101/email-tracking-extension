import React, { useState } from 'react';

import './Popup.css';
import '../../sentry';

// -------------------------------------------------

const Popup = () => {
  const [isLoggingOut, setLoggingOut] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
        <button
          className="App-link"
          disabled={isLoggingOut}
          onClick={async () => {
            setLoggingOut(true);
            // TODO: we should also probably notify server to clear the right cookie
            await chrome.runtime.sendMessage({ your: 'LOG_OUT' });
            try {
              await chrome.storage.sync.clear();
            } catch {
              // ignore the exception here
            }
          }}
        >
          Log out
        </button>
      </header>
    </div>
  );
};

export default Popup;
