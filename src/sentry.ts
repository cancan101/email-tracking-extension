import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/browser';

import { sentrySettings, sentryEnabled } from './settings';

// -------------------------------------------------

if (sentryEnabled) {
  Sentry.init({
    ignoreErrors: [
      'pinto.mainpage.FastTearoffBodyController',
      "Cannot read properties of null (reading 'gbar')",
      'AppContext is disposed, cannot get',
      "Cannot read properties of null (reading 'parentNode')",
      'Error in protected function',
      'is not registered',
    ],
    integrations: [new BrowserTracing()],
    ...sentrySettings,
  });
}
export default Sentry;
