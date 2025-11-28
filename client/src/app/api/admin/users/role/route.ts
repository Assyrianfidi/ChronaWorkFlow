import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../lib/auth';
import { authConfig } from '../lib/auth';
import { prisma } from '../lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // Verify admin access
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId, role } = await req.json();

    // Validate role
    if (!['ADMIN', 'USER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}
