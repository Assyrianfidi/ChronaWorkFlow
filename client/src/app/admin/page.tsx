import { auth, authConfig } from '../lib/auth';
import { prisma } from '../lib/prisma';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboard() {
  const session = await auth();
  
  // Redirect if not admin
  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  // Fetch all users with their accounts
  const users = await prisma.user.findMany({
    include: {
      accounts: {
        select: {
          provider: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return <AdminDashboardClient users={users} />;
}
