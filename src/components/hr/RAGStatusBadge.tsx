
import React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type RAGStatus = "red" | "amber" | "green"

interface RAGStatusBadgeProps {
  status: RAGStatus
  className?: string
}

const statusConfig = {
  red: {
    className: "bg-red-100 text-red-800 hover:bg-red-100",
    label: "At Risk",
  },
  amber: {
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    label: "Needs Attention",
  },
  green: {
    className: "bg-green-100 text-green-800 hover:bg-green-100",
    label: "On Track",
  },
}

const RAGStatusBadge: React.FC<RAGStatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status]

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

export default RAGStatusBadge
