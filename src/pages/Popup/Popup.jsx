import React, { useState } from 'react';
import './Popup.css';

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
            chrome.runtime.sendMessage({ your: 'LOG_OUT' });
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
