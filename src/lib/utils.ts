
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Debounce function to limit the rate at which a function can fire
 */
export function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number): F {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  const debounced = (...args: any[]) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
  
  return debounced as F;
}

// other utilities can be added here
