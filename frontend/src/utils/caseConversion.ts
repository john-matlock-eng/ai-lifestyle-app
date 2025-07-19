/**
 * Utility functions for converting between camelCase and snake_case
 */

/**
 * Convert a snake_case string to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert a camelCase string to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Recursively convert object keys from snake_case to camelCase
 */
export function snakeToCamelObject<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => snakeToCamelObject(item)) as any;
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = snakeToCamel(key);
        result[camelKey] = snakeToCamelObject(obj[key]);
      }
    }
    
    return result;
  }
  
  return obj;
}

/**
 * Recursively convert object keys from camelCase to snake_case
 */
export function camelToSnakeObject<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => camelToSnakeObject(item)) as any;
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const snakeKey = camelToSnake(key);
        result[snakeKey] = camelToSnakeObject(obj[key]);
      }
    }
    
    return result;
  }
  
  return obj;
}
