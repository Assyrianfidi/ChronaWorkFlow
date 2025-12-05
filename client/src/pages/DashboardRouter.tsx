import * as React from "react"
import { useAuth } from "../contexts/AuthContext"
import {
  AdminDashboard,
  ManagerDashboard,
  UserDashboard,
  AuditorDashboard,
  InventoryDashboard
} from "./dashboards"

const DashboardRouter: React.FC = () => {
  const { user } = useAuth()

  if (!user) {
    return <div>Loading...</div>
  }

  switch (user.role) {
    case "ADMIN":
      return <AdminDashboard />
    case "MANAGER":
      return <ManagerDashboard />
    case "USER":
      return <UserDashboard />
    case "AUDITOR":
      return <AuditorDashboard />
    case "INVENTORY_MANAGER":
      return <InventoryDashboard />
    default:
      return <UserDashboard />
  }
}

export default DashboardRouter
