import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/authenticate";
import { getUsageStats } from "@/lib/subscription";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate the request
    const { session } = await authenticate(request);
    
    // Get usage stats for the shop
    const stats = await getUsageStats(session.shop);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error("❌ Error fetching usage stats:", error);
    
    if (error instanceof Error && error.message === "Authentication failed") {
      return NextResponse.json(
        { error: "Unauthorized - please authenticate" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
