import React from 'react'
;
;
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

const usersData = [
  { name: "Jan", users: 400 },
  { name: "Feb", users: 300 },
  { name: "Mar", users: 500 },
];

const salesData = [
  { name: "Product A", sales: 200 },
  { name: "Product B", sales: 450 },
  { name: "Product C", sales: 300 },
];

export function UsersOverTimeCard() {
  return (
    <section className="bg-surface2 border border-border-gray rounded-xl shadow-soft hover:shadow-elevated transition-shadow duration-200 p-4 flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-black">Active Users</h2>
        <span className="text-xs text-black/70">Last 3 months</span>
      </header>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={usersData}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="4 4" />
            <XAxis dataKey="name" stroke="#4B5563" />
            <YAxis stroke="#4B5563" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-surface1)",
                borderRadius: 12,
                border: "1px solid var(--color-border-gray)",
              }}
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#4F46E5"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function SalesOverviewCard() {
  return (
    <section className="bg-surface2 border border-border-gray rounded-xl shadow-soft hover:shadow-elevated transition-shadow duration-200 p-4 flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-black">Sales Overview</h2>
        <span className="text-xs text-black/70">Top Products</span>
      </header>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={salesData}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="4 4" />
            <XAxis dataKey="name" stroke="#4B5563" />
            <YAxis stroke="#4B5563" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-surface1)",
                borderRadius: 12,
                border: "1px solid var(--color-border-gray)",
              }}
            />
            <Bar dataKey="sales" fill="#4F46E5" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
