import { NextRequest, NextResponse } from "next/server";
import { BASE_URL } from "@/lib/api-client";

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    const res = await fetch(
      `${BASE_URL}/api/v1/JobPosting${request.nextUrl.search}`,
      {
        headers: auth ? { Authorization: auth } : undefined,
        cache: "no-store",
      }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      {
        status: "SUCCESS",
        data: [],
        message: { info: "Offline fallback" },
        total: 0,
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    const body = await request.json();
    const res = await fetch(`${BASE_URL}/api/v1/JobPosting`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      {
        status: "FAILED",
        data: [],
        message: { error: err instanceof Error ? err.message : "Proxy error" },
        total: 0,
      },
      { status: 502 }
    );
  }
}
