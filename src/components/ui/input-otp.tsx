import React from "@/lib/react-helpers";

import { cn } from "@/lib/utils"

export interface InputOTPProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Callback when all inputs are filled
   */
  onChange?: (value: string) => void
  /**
   * Number of inputs
   * @default 6
   */
  length?: number
}

const InputOTP = React.forwardRef<HTMLInputElement, InputOTPProps>(
  ({ className, length = 6, onChange, ...props }, ref) => {
    const [otp, setOtp] = React.useState(Array(length).fill(""))
    const inputRefs = React.useRef<Array<HTMLInputElement | null>>([])

    const handleChange = (index: number, value: string) => {
      const newOtp = [...otp]
      newOtp[index] = value

      if (value && index < length - 1 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus()
      }

      setOtp(newOtp)
      onChange?.(newOtp.join(""))
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }

    return (
      <div className="flex gap-2">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            type="text"
            maxLength={1}
            className={cn(
              "w-12 h-12 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:appearance-none",
              className
            )}
            value={otp[index] || ""}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            ref={(el) => (inputRefs.current[index] = el)}
            {...props}
          />
        ))}
      </div>
    )
  }
)
InputOTP.displayName = "InputOTP"

export { InputOTP }
