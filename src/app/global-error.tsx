"use client";

import * as Sentry from "@sentry/nextjs";
import ErrorReporter from "@/components/ErrorReporter";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return <ErrorReporter error={error} />;
}
