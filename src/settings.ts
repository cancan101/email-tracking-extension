import { BrowserOptions } from '@sentry/browser';

declare var SENTRY_RELEASE: string;

const sentryTunnel = `${process.env.EMAIL_TRACKING_BACKEND_URL}/api/v1/stunnel`;
const sentryDsn = process.env.SENTRY_DSN;
const sentryRelease = SENTRY_RELEASE;
const sentryEnabled = !process.env.SENTRY_DISABLED;
// Set tracesSampleRate to 1.0 to capture 100%
// of transactions for performance monitoring.
const tracesSampleRate = process.env.SENTRY_TRACES_SAMPLE_RATE
  ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE)
  : 0.1;

const sentrySettings: BrowserOptions = {
  dsn: sentryDsn,
  tunnel: sentryTunnel,
  tracesSampleRate,
  release: sentryRelease,
};

export { sentrySettings, sentryEnabled };
