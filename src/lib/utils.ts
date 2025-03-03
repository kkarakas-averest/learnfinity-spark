import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]): string {
  // Ensure each input is properly handled
  const validInputs = inputs.filter((input): input is NonNullable<typeof input> => {
    if (input === null || input === undefined) return false;
    if (typeof input === 'string') return true;
    if (typeof input === 'object') return true;
    return false;
  });

  // Convert any non-string objects to strings
  const processedInputs = validInputs.map(input => {
    if (typeof input === 'string') return input;
    if (typeof input === 'object') {
      return Object.entries(input)
        .filter(([_, value]) => Boolean(value))
        .map(([key]) => key)
        .join(' ');
    }
    return '';
  });

  return twMerge(clsx(processedInputs));
}
