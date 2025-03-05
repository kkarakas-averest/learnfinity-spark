import React from "@/lib/react-helpers";
import * as React from "react"
import { Calendar as CalendarPrimitive } from "react-day-picker"

import { cn } from "@/lib/utils"

const Calendar = React.forwardRef<
  React.ElementRef<typeof CalendarPrimitive>,
  React.ComponentPropsWithoutRef<typeof CalendarPrimitive>
>(({ className, ...props }, ref) => (
  <CalendarPrimitive
    ref={ref}
    className={cn("p-3", className)}
    {...props}
  />
))
Calendar.displayName = "Calendar"

export { Calendar }
