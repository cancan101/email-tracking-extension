import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

import { sentryTunnel, sentryDsn } from './settings';

// -------------------------------------------------

Sentry.init({
  dsn: sentryDsn,
  tunnel: sentryTunnel,
  integrations: [new BrowserTracing()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});
