# Click vs Drag Detection Fix

## Problem

When clicking and dragging to pan the emotion wheel, it would select the emotion where you started the drag, which was unintended behavior.

## Solution

Implemented drag detection logic to distinguish between clicks and drags:

### 1. **Drag Detection**

- Track initial click position with `initialClickPosRef`
- Calculate distance moved: if > 5px, it's considered a drag
- Set `hasDraggedRef.current = true` when drag threshold is exceeded

### 2. **Selection Prevention**

```typescript
const handleEmotionSelect = (emotionId: string) => {
  // Don't select if we just finished dragging
  if (hasDraggedRef.current) {
    hasDraggedRef.current = false;
    return;
  }
  // ... rest of selection logic
};
```

### 3. **Click Duration Check**

- Track click start time
- If click duration < 200ms and no drag occurred, it's a valid click
- This prevents accidental selections from quick drags

## Technical Details

### State Management

```typescript
const hasDraggedRef = useRef(false); // Track if drag occurred
const clickStartTimeRef = useRef(0); // Track click start time
const initialClickPosRef = useRef({ x: 0, y: 0 }); // Track initial position
```

### Movement Calculation

```typescript
const moveDistance = Math.sqrt(
  Math.pow(clientX - initialClickPosRef.current.x, 2) +
    Math.pow(clientY - initialClickPosRef.current.y, 2),
);

if (moveDistance > 5) {
  hasDraggedRef.current = true;
}
```

### CSS Improvements

- Added `touch-action: none` for better touch handling
- Added `-webkit-touch-callout: none` to prevent iOS callouts
- Ensured all prefixes for user-select are included

## User Experience

Now when using the emotion wheel:

- **Click**: Selects/deselects emotion
- **Drag**: Pans the wheel (when zoomed) without selecting
- **Quick tap**: Still works as selection
- **Long press + drag**: Treated as pan, not selection

The 5px threshold provides a good balance between:

- Allowing small hand tremors during clicks
- Detecting intentional drags quickly

## Testing

Try these scenarios:

1. ✅ Click on emotion → Should select
2. ✅ Click and drag → Should pan, not select
3. ✅ Quick tap → Should select
4. ✅ Long press and drag → Should pan, not select
5. ✅ Small movement (<5px) → Should still select
