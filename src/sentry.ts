import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

import { sentrySettings, sentryEnabled } from './settings';

// -------------------------------------------------

if (sentryEnabled) {
  Sentry.init({
    ignoreErrors: [
      'pinto.mainpage.FastTearoffBodyController',
      "Cannot read properties of null (reading 'gbar')",
      'AppContext is disposed, cannot get',
    ],
    integrations: [new BrowserTracing()],
    ...sentrySettings,
  });
}
