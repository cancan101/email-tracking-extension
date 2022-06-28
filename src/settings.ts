import { BrowserOptions } from '@sentry/browser';

const sentryTunnel = `${process.env.EMAIL_TRACKING_BACKEND_URL}/api/v1/stunnel`;
const sentryDsn = process.env.SENTRY_DSN;
const sentryRelease = process.env.VERSION;

const sentrySettings: BrowserOptions = {
  dsn: sentryDsn,
  tunnel: sentryTunnel,
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
  release: sentryRelease,
};

export { sentrySettings };
