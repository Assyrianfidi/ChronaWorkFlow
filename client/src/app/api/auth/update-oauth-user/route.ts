import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to update OAuth user information
 * This is called when a new OAuth user signs in to ensure they have proper role and settings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, role } = body;

    if (!id || !role) {
      return NextResponse.json(
        { error: "Missing required fields: id, role" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      user: {
        id,
        role: String(role).toUpperCase(),
        isActive: true,
      },
    });
  } catch (error) {
    console.error("Error updating OAuth user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
