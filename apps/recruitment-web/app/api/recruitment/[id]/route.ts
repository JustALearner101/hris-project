import { NextRequest, NextResponse } from "next/server";
import { BASE_URL } from "@/lib/api-client";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const auth = request.headers.get("authorization");
    const res = await fetch(`${BASE_URL}/api/v1/JobPosting/${id}`, {
      headers: auth ? { Authorization: auth } : undefined,
      cache: "no-store",
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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const auth = request.headers.get("authorization");
    const body = await request.json();
    const res = await fetch(`${BASE_URL}/api/v1/JobPosting/${id}`, {
      method: "PUT",
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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const auth = request.headers.get("authorization");
    const res = await fetch(`${BASE_URL}/api/v1/JobPosting/${id}`, {
      method: "DELETE",
      headers: auth ? { Authorization: auth } : undefined,
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
