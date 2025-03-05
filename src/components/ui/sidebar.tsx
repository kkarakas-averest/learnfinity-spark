import React from "@/lib/react-helpers";
import * as Collapsible from "@radix-ui/react-collapsible"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  title: string
}

const Sidebar = ({ className, children, title, ...props }: SidebarProps) => {
  return (
    <div
      className={cn(
        "w-full border-b md:w-60 md:border-r md:border-b-0",
        className
      )}
      {...props}
    >
      <Collapsible.Root className="flex flex-col space-y-2">
        <Collapsible.Trigger className="flex items-center justify-between px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          {title}
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 peer-data-[state=open]:rotate-180" />
        </Collapsible.Trigger>
        <Collapsible.Content className="space-y-2 overflow-hidden text-sm transition-all data-[motion=from-start]:animate-in data-[motion=from-end]:animate-out data-[motion=closest-side]:duration-300 data-[motion=from-start]:fade-in data-[motion=from-start]:slide-in-from-bottom data-[motion=from-end]:fade-out data-[motion=from-end]:slide-out-to-top">
          {children}
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  )
}

export { Sidebar }
