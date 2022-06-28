import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

import { sentrySettings } from './settings';

// -------------------------------------------------

Sentry.init({
  ...sentrySettings,
  integrations: [new BrowserTracing()],
});
