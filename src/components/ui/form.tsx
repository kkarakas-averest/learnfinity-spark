import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

// Update these generics to use simple non-generic types that match our declarations
type FormFieldContextValue = {
  name: string
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = ({ ...props }: any) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

type FormControlProps = React.HTMLAttributes<HTMLDivElement>

const FormControl = React.forwardRef<
  HTMLDivElement,
  FormControlProps
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("grid gap-1.5", className)} {...props}>
      {children}
    </div>
  )
})
FormControl.displayName = "FormControl"

type FormDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  FormDescriptionProps
>(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  )
})
FormDescription.displayName = "FormDescription"

type FormMessageProps = React.HTMLAttributes<HTMLParagraphElement>

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  FormMessageProps
>(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {children}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

type FormItemProps = React.HTMLAttributes<HTMLDivElement>

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    )
  }
)
FormItem.displayName = "FormItem"

type FormLabelProps = React.ComponentPropsWithoutRef<
  typeof LabelPrimitive.Root
>

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  FormLabelProps
>(({ className, ...props }, ref) => {
  return (
    <Label
      ref={ref}
      className={cn("text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormContext,
}
