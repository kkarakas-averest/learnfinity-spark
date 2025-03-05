
import React from "@/lib/react-helpers";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CalendarProps = {
  month?: Date;
  onMonthChange?: (date: Date) => void;
  className?: string;
  selected?: Date | Date[];
  onSelect?: (date: Date | undefined) => void;
  disabled?: boolean;
  fromDate?: Date;
  toDate?: Date;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function Calendar({
  month = new Date(),
  onMonthChange,
  className,
  selected,
  onSelect,
  disabled,
  fromDate,
  toDate
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(month);
  
  React.useEffect(() => {
    setCurrentMonth(month);
  }, [month]);

  const handlePreviousMonth = () => {
    const date = new Date(currentMonth);
    date.setMonth(date.getMonth() - 1);
    setCurrentMonth(date);
    onMonthChange?.(date);
  };

  const handleNextMonth = () => {
    const date = new Date(currentMonth);
    date.setMonth(date.getMonth() + 1);
    setCurrentMonth(date);
    onMonthChange?.(date);
  };

  const getMonthDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add previous month's days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        currentMonth: false
      });
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        currentMonth: true
      });
    }
    
    // Add next month's days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        currentMonth: false
      });
    }
    
    return days;
  };

  const isSelected = (date: Date) => {
    if (!selected) return false;
    
    if (Array.isArray(selected)) {
      return selected.some(d => d.toDateString() === date.toDateString());
    }
    
    return selected.toDateString() === date.toDateString();
  };

  const isDisabled = (date: Date) => {
    if (disabled) return true;
    
    if (fromDate && date < fromDate) return true;
    if (toDate && date > toDate) return true;
    
    return false;
  };

  const handleDateClick = (date: Date) => {
    if (isDisabled(date)) return;
    onSelect?.(date);
  };

  const days = getMonthDays();

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between mb-4">
        <Button
          type="button"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={handlePreviousMonth}
          disabled={fromDate && new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1) <= fromDate}
        >
          <span className="sr-only">Previous month</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-medium">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={handleNextMonth}
          disabled={toDate && new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0) >= toDate}
        >
          <span className="sr-only">Next month</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-xs text-muted-foreground">
            {day}
          </div>
        ))}
        {days.map((day, i) => (
          <Button
            key={i}
            type="button"
            variant="ghost"
            className={cn(
              "h-8 w-8 p-0 text-xs font-normal",
              !day.currentMonth && "text-muted-foreground opacity-50",
              isSelected(day.date) && "bg-primary text-primary-foreground",
              isDisabled(day.date) && "pointer-events-none opacity-30"
            )}
            onClick={() => handleDateClick(day.date)}
            disabled={isDisabled(day.date)}
          >
            {day.date.getDate()}
          </Button>
        ))}
      </div>
    </div>
  );
}
