# Emotion Wheel - Enhanced with Pan & Zoom

## New Features Added

### 1. Drag to Pan
- **When zoomed in**, you can now drag the wheel around to explore different sections
- Works with both **mouse drag** and **touch gestures**
- Visual feedback with grab/grabbing cursor
- Pan boundaries prevent dragging the wheel completely off-screen

### 2. Enhanced Zoom
- **Zoom range**: 0.8x to 4x (previously 0.8x to 1.5x)
- **Mouse wheel zoom**: Scroll to zoom in/out
- **Smart pan adjustment**: Pan offset scales with zoom to keep content centered
- **Zoom buttons**: Now use 0.2 increments for faster zooming

### 3. Reset Functionality
- **ESC key**: Resets both zoom and pan position
- **Click outside**: Resets view when not actively panning
- **Reset button**: Now resets both zoom and pan
- Button is disabled only when at default zoom AND center position

## Technical Implementation

### State Management
```typescript
const [isPanning, setIsPanning] = useState(false);
const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
const [lastPanOffset, setLastPanOffset] = useState({ x: 0, y: 0 });
```

### Pan Logic
- Tracks drag start position and calculates delta movement
- Maintains boundaries based on zoom level: `maxPan = (wheelSize * (zoomLevel - 1)) / 2`
- Smooth transitions when not actively panning
- Prevents text selection during drag

### Zoom Logic
- Mouse wheel events are captured and prevented from scrolling the page
- Pan offset is scaled proportionally when zooming to maintain position
- Zoom is clamped between 0.8 and 4.0

## User Instructions

When the wheel is zoomed in (>1.2x), instructions appear at the top:
"Drag to pan • Scroll to zoom • ESC to reset"

## CSS Enhancements

- Grab cursor when hovering (zoomed)
- Grabbing cursor when dragging
- Prevents text selection in the wheel
- Hardware acceleration with `will-change: transform`

## Usage Example

```tsx
<EmotionWheel
  selectedEmotions={selectedEmotions}
  onEmotionToggle={handleEmotionToggle}
/>
```

The component handles all pan and zoom functionality internally - no additional props needed!

## Browser Compatibility

- Works on all modern browsers
- Touch support for mobile devices
- Fallback cursor styles for older browsers
- Smooth performance with CSS transforms
