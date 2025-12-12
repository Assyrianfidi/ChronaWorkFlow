import React from 'react';
import Layout from '@/components/Layout';

const Inventory: React.FC = () => {
  return (
    <Layout title="Inventory" description="Inventory management in AccuBooks">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900">Inventory Management</h2>
              <p className="mt-2 text-gray-600">Inventory content and functionality</p>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Inventory;