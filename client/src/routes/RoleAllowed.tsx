import * as React from "react"
import { useAuth } from "../contexts/AuthContext"
import Unauthorized from "../pages/Unauthorized"

interface RoleAllowedProps {
  children: React.ReactNode
  roles: string | string[]
  fallback?: React.ReactNode
}

const RoleAllowed: React.FC<RoleAllowedProps> = ({ 
  children, 
  roles,
  fallback = <Unauthorized />
}) => {
  const { user, isAuthenticated } = useAuth()

  // If not authenticated, show unauthorized
  if (!isAuthenticated || !user) {
    return <>{fallback}</>
  }

  // Check if user's role is allowed
  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  const isAllowed = allowedRoles.includes(user.role)

  return isAllowed ? <>{children}</> : <>{fallback}</>
}

export default RoleAllowed
