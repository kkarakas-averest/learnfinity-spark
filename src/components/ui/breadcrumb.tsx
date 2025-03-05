import React from "@/lib/react-helpers";
import {
  CaretRight,
  Home,
} from "lucide-react"

import { cn } from "@/lib/utils"

type BreadcrumbItem = {
  title: string
  href?: string
}

interface BreadcrumbProps extends React.HTMLAttributes<HTMLDivElement> {
  items: BreadcrumbItem[]
}

const Breadcrumb = ({ items, className, ...props }: BreadcrumbProps) => {
  return (
    <nav aria-label="breadcrumbs" className={cn("w-full", className)} {...props}>
      <ol className="list-none p-0 inline-flex items-center">
        <li>
          <a href="/" className="flex items-center text-blue-600 hover:text-blue-800">
            <Home className="h-4 w-4 mr-1" />
            Home
          </a>
        </li>
        {items.map((item, index) => (
          <li key={index}>
            <div className="flex items-center">
              <CaretRight className="h-4 w-4 mx-2 text-gray-400" />
              {item.href ? (
                <a
                  href={item.href}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {item.title}
                </a>
              ) : (
                <span className="text-gray-500">{item.title}</span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export { Breadcrumb }
