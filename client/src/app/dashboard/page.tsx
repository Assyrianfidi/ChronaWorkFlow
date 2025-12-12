"use client";

import { MainLayout } from '../components/layout/MainLayout.js';
import { EnterpriseDashboardNew } from '../components/dashboard/EnterpriseDashboardNew.js';

export default function DashboardPage() {
  return (
    <MainLayout>
      <EnterpriseDashboardNew />
    </MainLayout>
  );
}
