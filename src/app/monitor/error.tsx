"use client";

import { RouteError } from "@/components/ui/route-error";

export default function Error({ reset }: { reset: () => void }) {
  return <RouteError reset={reset} title="Monitoring could not be loaded" />;
}
