import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // Replay is heavyweight; turn on when you want session recordings.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
    enabled: process.env.NODE_ENV === "production",
  });
}
