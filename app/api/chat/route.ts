import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL   = process.env.MULE_GATEWAY_URL!;
const CLIENT_ID     = process.env.MULE_CLIENT_ID!;
const CLIENT_SECRET = process.env.MULE_CLIENT_SECRET!;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  let gatewayRes: Response;
  try {
    gatewayRes = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "client_id":     CLIENT_ID,
        "client_secret": CLIENT_SECRET,
      },
      body: JSON.stringify({ messages }),
    });
  } catch (err) {
    return NextResponse.json(
      { _debug: { error: "fetch_failed", detail: String(err), gateway: GATEWAY_URL } },
      { status: 502 }
    );
  }

  const raw = await gatewayRes.text();

  // Try to parse as JSON; fall back to plain text
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { _debug: { raw, status: gatewayRes.status } };
  }

  // Always include debug metadata so the frontend can show what went wrong
  return NextResponse.json(
    {
      ...(typeof data === "object" && data !== null ? data : {}),
      _debug: {
        status:  gatewayRes.status,
        gateway: GATEWAY_URL,
        raw:     typeof data === "object" ? undefined : raw,
      },
    },
    { status: gatewayRes.status }
  );
}
