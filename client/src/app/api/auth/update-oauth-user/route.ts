import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from '../lib/prisma.js';

/**
 * API endpoint to update OAuth user information
 * This is called when a new OAuth user signs in to ensure they have proper role and settings
 */
export async function POST(request: NextRequest) {
  try {
    // Get the token from the request
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, role } = body;

    if (!id || !role) {
      return NextResponse.json(
        { error: "Missing required fields: id, role" },
        { status: 400 },
      );
    }

    // Update the user's role if they don't have one
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role: role.toUpperCase(),
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating OAuth user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
