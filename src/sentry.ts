import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

import { sentrySettings, sentryEnabled } from './settings';

// -------------------------------------------------

if (sentryEnabled) {
  Sentry.init({
    ...sentrySettings,
    integrations: [new BrowserTracing()],
  });
}
