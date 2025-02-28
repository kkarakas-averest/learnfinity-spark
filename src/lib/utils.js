import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a secure random password
 * @param {Object} options - Password generation options
 * @param {number} options.length - Length of the password (default: 12)
 * @param {boolean} options.includeUppercase - Include uppercase letters (default: true)
 * @param {boolean} options.includeLowercase - Include lowercase letters (default: true)
 * @param {boolean} options.includeNumbers - Include numbers (default: true)
 * @param {boolean} options.includeSpecial - Include special characters (default: true)
 * @returns {string} A secure random password
 */
export function generateSecurePassword({
  length = 12,
  includeUppercase = true,
  includeLowercase = true,
  includeNumbers = true,
  includeSpecial = true
} = {}) {
  // Define character sets
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const specialChars = '!@#$%^&*()-_=+[]{}|;:,.<>?';
  
  // Create the character pool based on options
  let charPool = '';
  if (includeUppercase) charPool += uppercaseChars;
  if (includeLowercase) charPool += lowercaseChars;
  if (includeNumbers) charPool += numberChars;
  if (includeSpecial) charPool += specialChars;
  
  // Ensure at least one character set is included
  if (charPool.length === 0) {
    charPool = lowercaseChars + numberChars;
  }
  
  // Generate the password
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charPool.length);
    password += charPool[randomIndex];
  }
  
  // Ensure password meets requirements (at least one from each included character set)
  const requirements = [];
  if (includeUppercase) requirements.push(new RegExp(`[${uppercaseChars}]`));
  if (includeLowercase) requirements.push(new RegExp(`[${lowercaseChars}]`));
  if (includeNumbers) requirements.push(new RegExp(`[${numberChars}]`));
  if (includeSpecial) requirements.push(new RegExp(`[${specialChars}]`));
  
  // If the password doesn't meet all requirements, generate a new one recursively
  const meetsRequirements = requirements.every(req => req.test(password));
  if (!meetsRequirements) {
    return generateSecurePassword({
      length,
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSpecial
    });
  }
  
  return password;
} 