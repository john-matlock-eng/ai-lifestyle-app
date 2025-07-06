## TypeScript Timeout Type Reference

### Common Issue
When using `setTimeout` or `setInterval` in a React/browser environment, TypeScript may incorrectly infer the return type as `NodeJS.Timeout` instead of `number`.

### Solutions

#### Option 1: Type Casting (Quick Fix)
```typescript
// For setTimeout
const timeoutId = setTimeout(() => {}, 1000) as unknown as number;

// For setInterval  
const intervalId = setInterval(() => {}, 1000) as unknown as number;
```

#### Option 2: Window Methods (Explicit)
```typescript
// Use window.setTimeout explicitly
const timeoutId = window.setTimeout(() => {}, 1000);
const intervalId = window.setInterval(() => {}, 1000);
```

#### Option 3: ReturnType (Type-safe)
```typescript
// Using ReturnType for better type safety
const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
timeoutRef.current = setTimeout(() => {}, 1000);
```

#### Option 4: Number Type (Simple)
```typescript
// When storing in refs or state
const timeoutRef = useRef<number>();
timeoutRef.current = setTimeout(() => {}, 1000) as unknown as number;
```

### Why This Happens
- TypeScript includes both DOM and Node.js type definitions
- In Node.js, `setTimeout` returns a `Timeout` object
- In browsers, `setTimeout` returns a number
- TypeScript sometimes gets confused about the environment

### Best Practice
For React applications, use `window.setTimeout` or cast to `number` to ensure browser-compatible types.
