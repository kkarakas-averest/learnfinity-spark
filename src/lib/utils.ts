import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Global error tracking variable that can be checked by debugging tools
declare global {
  interface Window {
    __DEBUG_HAS_TYPE_ERROR: boolean;
    __DEBUG_TYPE_ERROR_INFO: any;
  }
}

/**
 * Utility for combining Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]): string {
  try {
    if (!inputs || !Array.isArray(inputs)) {
      console.error("cn: Invalid inputs", inputs);
      return "";
    }
    
    // Filter out non-string/non-array types that might cause issues
    const validInputs = inputs.filter(input => {
      const isValid = typeof input === 'string' || 
                      Array.isArray(input) || 
                      (input !== null && typeof input === 'object');
                      
      if (!isValid) {
        console.warn(`cn: Filtered out invalid input: ${input}`);
      }
      
      return isValid;
    });
    
    return twMerge(clsx(validInputs));
  } catch (error) {
    console.error("Error in cn utility:", error);
    // Return a fallback empty string to prevent rendering issues
    return "";
  }
}

/**
 * Format a duration in seconds to a human-readable string (e.g., "2h 30m")
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0m";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`;
  }
  
  return `${minutes}m`;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}

/**
 * Truncate text with ellipsis if it exceeds maxLength
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Safely parse JSON string
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return fallback;
  }
}

/**
 * Group array of objects by specific key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Sort array of objects by specific key
 */
export function sortByKey<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const valueA = a[key];
    const valueB = b[key];
    
    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Debounce function to limit function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate a unique ID
 */
export function generateUniqueId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${randomStr}`;
}

/**
 * Extract YouTube video ID from a YouTube URL
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[7].length === 11) ? match[7] : null;
}

/**
 * Convert hex color to rgba
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  if (!hex) return `rgba(0, 0, 0, ${alpha})`;
  
  // Remove the hash if it exists
  const cleanHex = hex.replace('#', '');
  
  // Parse the hex values
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
