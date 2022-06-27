const sentryTunnel = `${process.env.EMAIL_TRACKING_BACKEND_URL}/api/v1/stunnel`;
const sentryDsn = process.env.SENTRY_DSN;

export { sentryTunnel, sentryDsn };
