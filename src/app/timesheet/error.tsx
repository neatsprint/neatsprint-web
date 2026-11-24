"use client";

import { RouteError } from "@/components/ui/route-error";

export default function Error({ reset }: { reset: () => void }) {
  return <RouteError reset={reset} title="The timesheet could not be loaded" />;
}
