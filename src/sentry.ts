import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

import { sentrySettings, sentryEnabled } from './settings';

// -------------------------------------------------

if (sentryEnabled) {
  Sentry.init({
    ignoreErrors: ['pinto.mainpage.FastTearoffBodyController'],
    integrations: [new BrowserTracing()],
    ...sentrySettings,
  });
}
