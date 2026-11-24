import { NextResponse } from "next/server";

import { getProfile } from "@/lib/session";

export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ code: "unauthenticated" }, { status: 401 });
  }
  return NextResponse.json({ data: profile });
}
