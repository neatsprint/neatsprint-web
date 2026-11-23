"use client";

import { RouteError } from "@/components/ui/route-error";

export default function Error({ reset }: { reset: () => void }) {
  return <RouteError reset={reset} title="Teams could not be loaded" />;
}
