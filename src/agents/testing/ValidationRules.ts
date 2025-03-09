/**
 * Validation Rules
 * 
 * A collection of reusable validation rules for testing agent behaviors.
 * These rules can be used to validate agent responses against expected outcomes.
 */

import { ValidationRule } from './AgentTestFramework';

export class ValidationRules {
  /**
   * Validates that the response contains all required fields
   */
  static hasRequiredFields(requiredFields: string[]): ValidationRule {
    return {
      name: 'required-fields',
      description: `Validates that the response contains all required fields: ${requiredFields.join(', ')}`,
      validator: (result: any) => {
        if (!result || typeof result !== 'object') {
          return { 
            valid: false, 
            message: 'Result is not an object' 
          };
        }
        
        const missingFields = requiredFields.filter(field => {
          const fieldParts = field.split('.');
          let current = result;
          
          for (const part of fieldParts) {
            if (current === undefined || current === null || !Object.prototype.hasOwnProperty.call(current, part)) {
              return true;
            }
            current = current[part];
          }
          
          return false;
        });
        
        return {
          valid: missingFields.length === 0,
          message: missingFields.length === 0 
            ? 'All required fields are present' 
            : `Missing required fields: ${missingFields.join(', ')}`
        };
      }
    };
  }
  
  /**
   * Validates that a field matches an expected value
   */
  static fieldEquals(fieldPath: string, expectedValue: any): ValidationRule {
    return {
      name: `field-equals-${fieldPath}`,
      description: `Validates that the field ${fieldPath} equals the expected value`,
      validator: (result: any) => {
        if (!result || typeof result !== 'object') {
          return { 
            valid: false, 
            message: 'Result is not an object' 
          };
        }
        
        const fieldParts = fieldPath.split('.');
        let current = result;
        
        for (const part of fieldParts) {
          if (current === undefined || current === null || !Object.prototype.hasOwnProperty.call(current, part)) {
            return {
              valid: false,
              message: `Field ${fieldPath} does not exist in the result`
            };
          }
          current = current[part];
        }
        
        const isEqual = current === expectedValue || 
          (JSON.stringify(current) === JSON.stringify(expectedValue));
        
        return {
          valid: isEqual,
          message: isEqual 
            ? `Field ${fieldPath} matches expected value` 
            : `Field ${fieldPath} value ${JSON.stringify(current)} does not match expected value ${JSON.stringify(expectedValue)}`
        };
      }
    };
  }
  
  /**
   * Validates that a field is one of the expected values
   */
  static fieldInSet(fieldPath: string, validValues: any[]): ValidationRule {
    return {
      name: `field-in-set-${fieldPath}`,
      description: `Validates that the field ${fieldPath} is one of the expected values: ${validValues.join(', ')}`,
      validator: (result: any) => {
        if (!result || typeof result !== 'object') {
          return { 
            valid: false, 
            message: 'Result is not an object' 
          };
        }
        
        const fieldParts = fieldPath.split('.');
        let current = result;
        
        for (const part of fieldParts) {
          if (current === undefined || current === null || !Object.prototype.hasOwnProperty.call(current, part)) {
            return {
              valid: false,
              message: `Field ${fieldPath} does not exist in the result`
            };
          }
          current = current[part];
        }
        
        const isValid = validValues.some(value => 
          current === value || JSON.stringify(current) === JSON.stringify(value)
        );
        
        return {
          valid: isValid,
          message: isValid 
            ? `Field ${fieldPath} is one of the expected values` 
            : `Field ${fieldPath} value ${JSON.stringify(current)} is not in the set of valid values`
        };
      }
    };
  }
  
  /**
   * Validates that a field matches a regular expression
   */
  static fieldMatchesPattern(fieldPath: string, pattern: RegExp): ValidationRule {
    return {
      name: `field-matches-pattern-${fieldPath}`,
      description: `Validates that the field ${fieldPath} matches the pattern ${pattern}`,
      validator: (result: any) => {
        if (!result || typeof result !== 'object') {
          return { 
            valid: false, 
            message: 'Result is not an object' 
          };
        }
        
        const fieldParts = fieldPath.split('.');
        let current = result;
        
        for (const part of fieldParts) {
          if (current === undefined || current === null || !Object.prototype.hasOwnProperty.call(current, part)) {
            return {
              valid: false,
              message: `Field ${fieldPath} does not exist in the result`
            };
          }
          current = current[part];
        }
        
        if (typeof current !== 'string') {
          return {
            valid: false,
            message: `Field ${fieldPath} is not a string`
          };
        }
        
        const isValid = pattern.test(current);
        
        return {
          valid: isValid,
          message: isValid 
            ? `Field ${fieldPath} matches the pattern` 
            : `Field ${fieldPath} value "${current}" does not match the pattern ${pattern}`
        };
      }
    };
  }
  
  /**
   * Validates that an array field has a minimum length
   */
  static arrayMinLength(fieldPath: string, minLength: number): ValidationRule {
    return {
      name: `array-min-length-${fieldPath}`,
      description: `Validates that the array field ${fieldPath} has at least ${minLength} items`,
      validator: (result: any) => {
        if (!result || typeof result !== 'object') {
          return { 
            valid: false, 
            message: 'Result is not an object' 
          };
        }
        
        const fieldParts = fieldPath.split('.');
        let current = result;
        
        for (const part of fieldParts) {
          if (current === undefined || current === null || !Object.prototype.hasOwnProperty.call(current, part)) {
            return {
              valid: false,
              message: `Field ${fieldPath} does not exist in the result`
            };
          }
          current = current[part];
        }
        
        if (!Array.isArray(current)) {
          return {
            valid: false,
            message: `Field ${fieldPath} is not an array`
          };
        }
        
        const isValid = current.length >= minLength;
        
        return {
          valid: isValid,
          message: isValid 
            ? `Array field ${fieldPath} has at least ${minLength} items` 
            : `Array field ${fieldPath} has ${current.length} items, which is less than the required ${minLength}`
        };
      }
    };
  }
  
  /**
   * Validates that a numeric field is within a range
   */
  static numberInRange(fieldPath: string, min: number, max: number): ValidationRule {
    return {
      name: `number-in-range-${fieldPath}`,
      description: `Validates that the numeric field ${fieldPath} is between ${min} and ${max}`,
      validator: (result: any) => {
        if (!result || typeof result !== 'object') {
          return { 
            valid: false, 
            message: 'Result is not an object' 
          };
        }
        
        const fieldParts = fieldPath.split('.');
        let current = result;
        
        for (const part of fieldParts) {
          if (current === undefined || current === null || !Object.prototype.hasOwnProperty.call(current, part)) {
            return {
              valid: false,
              message: `Field ${fieldPath} does not exist in the result`
            };
          }
          current = current[part];
        }
        
        if (typeof current !== 'number') {
          return {
            valid: false,
            message: `Field ${fieldPath} is not a number`
          };
        }
        
        const isValid = current >= min && current <= max;
        
        return {
          valid: isValid,
          message: isValid 
            ? `Numeric field ${fieldPath} is within the range ${min}-${max}` 
            : `Numeric field ${fieldPath} value ${current} is outside the range ${min}-${max}`
        };
      }
    };
  }
  
  /**
   * Validates that a response was generated within a time limit
   */
  static responseTimeUnder(maxMilliseconds: number): ValidationRule {
    return {
      name: 'response-time-under',
      description: `Validates that the response was generated in under ${maxMilliseconds}ms`,
      validator: (result: any) => {
        // This validator is special - it doesn't check the result itself
        // but is meant to be used with the responseTime field in TestResult
        // The actual validation happens in the AgentTestFramework
        return { valid: true };
      }
    };
  }
  
  /**
   * Custom validator for complex validation logic
   */
  static custom(name: string, description: string, validatorFn: (result: any) => { valid: boolean; message?: string }): ValidationRule {
    return {
      name,
      description,
      validator: validatorFn
    };
  }
  
  /**
   * Validates RAG status-specific rules
   */
  static validRAGStatus(fieldPath: string): ValidationRule {
    return {
      name: `valid-rag-status-${fieldPath}`,
      description: `Validates that the field ${fieldPath} contains a valid RAG status (red, amber, green)`,
      validator: (result: any) => {
        if (!result || typeof result !== 'object') {
          return { 
            valid: false, 
            message: 'Result is not an object' 
          };
        }
        
        const fieldParts = fieldPath.split('.');
        let current = result;
        
        for (const part of fieldParts) {
          if (current === undefined || current === null || !Object.prototype.hasOwnProperty.call(current, part)) {
            return {
              valid: false,
              message: `Field ${fieldPath} does not exist in the result`
            };
          }
          current = current[part];
        }
        
        const validStatuses = ['red', 'amber', 'green'];
        const isValid = validStatuses.includes(current.toLowerCase());
        
        return {
          valid: isValid,
          message: isValid 
            ? `Field ${fieldPath} contains a valid RAG status: ${current}` 
            : `Field ${fieldPath} value "${current}" is not a valid RAG status (red, amber, green)`
        };
      }
    };
  }
} 