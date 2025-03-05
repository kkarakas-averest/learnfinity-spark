
import { cn } from "@/lib/utils";
import { createContext, useContext } from '@/lib/react-helpers';
import { ChevronRight } from "lucide-react";

const BreadcrumbContext = createContext({});

interface BreadcrumbProps {
  className?: string;
  separator?: React.ReactNode;
  children: React.ReactNode;
}

const Breadcrumb = ({
  children,
  className,
  separator = <ChevronRight className="h-4 w-4" />,
  ...props
}: BreadcrumbProps) => {
  return (
    <nav
      className={cn(
        "relative flex flex-wrap items-center text-sm",
        className
      )}
      {...props}
    >
      <ol className="flex items-center space-x-2">
        <BreadcrumbContext.Provider value={{ separator }}>
          {children}
        </BreadcrumbContext.Provider>
      </ol>
    </nav>
  );
};

Breadcrumb.displayName = "Breadcrumb";

export { Breadcrumb };
