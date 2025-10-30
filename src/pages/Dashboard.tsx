import React from 'react';

export default function Dashboard() {
  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <div className="dashboard-grid">
        <div className="card">
          <h3>Companies</h3>
          <p>Manage your client companies</p>
        </div>
        <div className="card">
          <h3>Customers</h3>
          <p>Customer management</p>
        </div>
        <div className="card">
          <h3>Transactions</h3>
          <p>View and manage transactions</p>
        </div>
        <div className="card">
          <h3>Reports</h3>
          <p>Financial reports and analytics</p>
        </div>
      </div>
    </div>
  );
}
