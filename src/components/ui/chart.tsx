import React from "@/lib/react-helpers";

type ChartProps = React.HTMLAttributes<HTMLDivElement>

const Chart = React.forwardRef<HTMLDivElement, ChartProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={className} {...props} />
    )
  }
)
Chart.displayName = "Chart"

export { Chart }
