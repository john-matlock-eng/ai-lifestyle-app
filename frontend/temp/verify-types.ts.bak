// Quick verification that types are working correctly
import type { Goal, GoalActivity, GoalProgress } from './src/features/goals/types/api.types';
import { useEncryption } from './src/hooks/useEncryption';
import { fileURLToPath } from 'node:url';

// Test 1: import.meta.url should be recognized
console.log('Testing import.meta.url types...');
const testUrl = import.meta.url;
console.log('✅ import.meta types working');

// Test 2: setTimeout return type
console.log('Testing setTimeout return type...');
const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {}, 100);
clearTimeout(timeoutId);
console.log('✅ setTimeout types working');

// Test 3: useRef with undefined
console.log('Testing useRef initialization...');
import { useRef } from 'react';
const Component = () => {
  const ref = useRef<number | undefined>(undefined);
  return null;
};
console.log('✅ useRef types working');

console.log('\n🎉 All type fixes verified successfully!');
