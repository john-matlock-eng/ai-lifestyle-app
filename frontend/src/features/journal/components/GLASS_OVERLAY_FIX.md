# Glass Overlay Fix for Template and Pattern Pickers

## Problem
When hovering over journal templates or goal pattern cards, a glass overlay effect was making the text unreadable. This was caused by:

1. **Transparent overlays**: Absolute positioned divs with semi-transparent backgrounds
2. **Glass morphism effects**: Using `backdrop-filter: blur()` with transparent backgrounds
3. **Gradient backgrounds**: Complex gradients that reduced text contrast
4. **Surface-glass variable**: Using `rgba()` colors with low opacity (0.7-0.8)

## Solution

### 1. Removed Overlay Elements
```jsx
// REMOVED this problematic code:
{hoveredTemplate === templateId && (
  <div className="absolute inset-0 bg-gradient-to-t from-accent/10 to-transparent pointer-events-none" />
)}
```

### 2. Changed to Solid Backgrounds
```jsx
// Before
className="bg-gradient-to-br from-surface via-surface to-surface-hover"

// After
className="bg-surface hover:bg-surface-hover"
```

### 3. Added CSS Overrides
Created override CSS files to force solid backgrounds:
- `template-picker-override.css` - For journal templates
- `pattern-selector-override.css` - For goal patterns

Key fixes:
```css
/* Force solid backgrounds */
background-color: var(--surface) !important;

/* Remove backdrop filters */
backdrop-filter: none !important;

/* Ensure full opacity */
opacity: 1 !important;
```

### 4. Updated Hover States
- Removed gradient overlays on hover
- Use solid `--surface-hover` color instead
- Maintain border color changes for visual feedback
- Keep scale transform for interaction feedback

## Files Modified

1. **EnhancedTemplatePicker.tsx**
   - Removed overlay div
   - Simplified background classes
   - Added override CSS import

2. **PatternSelector.tsx**
   - Added override CSS import
   - Added wrapper class for CSS targeting

3. **New CSS Files**
   - `template-picker-override.css`
   - `pattern-selector-override.css`

## Testing
To verify the fix:
1. Navigate to journal creation
2. Hover over template cards
3. Text should remain fully readable
4. Same for goal pattern selection

## Theme Compatibility
The fix works with all themes because it uses CSS variables:
- `--surface`: Solid background color
- `--surface-hover`: Solid hover color
- No transparency or filters applied