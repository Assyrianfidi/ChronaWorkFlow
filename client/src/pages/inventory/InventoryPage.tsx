import React from 'react';

const InventoryPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Inventory</h1>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <input 
            type="text" 
            placeholder="Search inventory..."
            className="px-4 py-2 border rounded-md"
          />
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md">
            Add Item
          </button>
        </div>
        <div className="mt-4">
          <p>No inventory items found</p>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
