import React from "@/lib/react-helpers";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"

import { cn } from "@/lib/utils"

const RadioGroup = RadioGroupPrimitive.Root

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        {children}
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

const RadioGroupLabel = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Label>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Label
    ref={ref}
    className={cn(
      "px-2.5 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
))
RadioGroupLabel.displayName = RadioGroupPrimitive.Label.displayName

export { RadioGroup, RadioGroupItem, RadioGroupLabel }
