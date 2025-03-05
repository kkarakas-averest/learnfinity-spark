
import * as React from "react";
import { cn } from "@/lib/utils";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("w-64 bg-white border-r h-screen", className)}
      {...props}
    />
  )
);

Sidebar.displayName = "Sidebar";

interface SidebarSectionProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarSection = React.forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("py-4 px-3", className)}
      {...props}
    />
  )
);

SidebarSection.displayName = "SidebarSection";

interface SidebarItemProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

const SidebarItem = React.forwardRef<HTMLDivElement, SidebarItemProps>(
  ({ className, active, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center py-2 px-3 rounded-md cursor-pointer hover:bg-gray-100",
        active && "bg-gray-100 font-medium",
        className
      )}
      {...props}
    />
  )
);

SidebarItem.displayName = "SidebarItem";

export { Sidebar, SidebarSection, SidebarItem };
