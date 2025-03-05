import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Generate a secure random password
 * @param {Object} options - Password generation options
 * @param {number} options.length - Length of password (default: 12)
 * @param {boolean} options.includeUppercase - Include uppercase letters (default: true)
 * @param {boolean} options.includeLowercase - Include lowercase letters (default: true)
 * @param {boolean} options.includeNumbers - Include numbers (default: true)
 * @param {boolean} options.includeSpecial - Include special characters (default: true)
 * @returns {string} - Generated password
 */
export const generateSecurePassword = ({
  length = 12,
  includeUppercase = true,
  includeLowercase = true,
  includeNumbers = true,
  includeSpecial = true
} = {}) => {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const specialChars = '!@#$%^&*()_-+={}[]|:;<>,.?/~';
  
  let allowedChars = '';
  if (includeUppercase) allowedChars += uppercaseChars;
  if (includeLowercase) allowedChars += lowercaseChars;
  if (includeNumbers) allowedChars += numberChars;
  if (includeSpecial) allowedChars += specialChars;
  
  // Fallback to ensure we have at least some character set
  if (!allowedChars) {
    allowedChars = lowercaseChars + numberChars;
  }
  
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allowedChars.length);
    password += allowedChars[randomIndex];
  }
  
  return password;
};

/**
 * Merge class names utility function
 * @param {string[]} inputs - Class names to merge
 * @returns {string} - Merged class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
