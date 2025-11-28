'use client';

import { MainLayout } from '../components/layout/MainLayout';
import { EnterpriseDashboardNew } from '../components/dashboard/EnterpriseDashboardNew';

export default function DashboardPage() {
  return (
    <MainLayout>
      <EnterpriseDashboardNew />
    </MainLayout>
  );
}
