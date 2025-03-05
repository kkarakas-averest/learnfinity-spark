
import { Fragment } from '@/lib/react-helpers';
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
  children?: React.ReactNode;
}

export function Sidebar({ className, children }: SidebarProps) {
  return (
    <div
      className={cn(
        "flex h-screen w-64 flex-col border-r bg-background",
        className
      )}
    >
      {children}
    </div>
  );
}

interface SidebarSectionProps {
  title?: string;
  children?: React.ReactNode;
}

export function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <Fragment>
      {title && (
        <h3 className="px-4 py-2 text-lg font-semibold tracking-tight">
          {title}
        </h3>
      )}
      <div className="px-3">{children}</div>
    </Fragment>
  );
}

export function SidebarNav({ children }: { children: React.ReactNode }) {
  return <nav className="grid gap-1">{children}</nav>;
}

export function SidebarFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-auto border-t p-4">
      {children}
    </div>
  );
}
