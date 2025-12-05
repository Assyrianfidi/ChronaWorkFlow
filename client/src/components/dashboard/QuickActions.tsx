import * as React from "react"
import { LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"

interface QuickAction {
  label: string
  icon: LucideIcon
  href: string
}

interface QuickActionsProps {
  actions: QuickAction[]
}

const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  return (
    <div className="space-y-2">
      {actions.map((action, index) => (
        <Link
          key={index}
          to={action.href}
          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <action.icon className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  )
}

export default QuickActions
