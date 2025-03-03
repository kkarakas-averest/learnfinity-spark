import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  // Filter out undefined and null values
  const validInputs = inputs.filter(input => input !== undefined && input !== null);
  return twMerge(clsx(validInputs));
}
