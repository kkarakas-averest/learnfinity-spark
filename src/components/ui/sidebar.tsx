import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronLeft, ChevronRight, PanelLeft } from "lucide-react"

import { cn } from "@/lib/utils"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full min-w-[200px] flex-col border-r bg-secondary/50 py-3",
      className
    )}
    {...props}
  />
))
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-3", className)} {...props} />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("mt-auto px-3", className)} {...props} />
))
SidebarFooter.displayName = "SidebarFooter"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-y-auto py-2 px-3", className)}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

const SidebarItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-md", className)} {...props} />
))
SidebarItem.displayName = "SidebarItem"

const SidebarItemGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-1", className)} {...props} />
))
SidebarItemGroup.displayName = "SidebarItemGroup"

const SidebarItemText = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm", className)} {...props} />
))
SidebarItemText.displayName = "SidebarItemText"

const SidebarToggleButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "group flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background shadow-sm transition-all hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      className
    )}
    {...props}
  >
    <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 group-focus:-translate-x-1" />
    <ChevronRight className="absolute h-4 w-4 translate-x-4 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 group-focus:translate-x-0 group-focus:opacity-100" />
    <span className="sr-only">Toggle Sidebar</span>
  </button>
))
SidebarToggleButton.displayName = "SidebarToggleButton"

const sidebarButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface SidebarButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sidebarButtonVariants> {
  asChild?: boolean
}

const SidebarButton = React.forwardRef<HTMLButtonElement, SidebarButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? React.forwardRef((props, ref) => (
      <PanelLeft ref={ref} {...props} />
    )) : "button"
    return (
      <Comp
        className={cn(sidebarButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
SidebarButton.displayName = "SidebarButton"

export {
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarItem,
  SidebarItemGroup,
  SidebarItemText,
  SidebarToggleButton,
  SidebarButton,
  sidebarButtonVariants,
}
