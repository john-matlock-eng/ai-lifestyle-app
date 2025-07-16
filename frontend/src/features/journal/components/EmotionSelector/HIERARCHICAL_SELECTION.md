# Hierarchical Emotion Selection

## Overview

The emotion wheel now implements hierarchical selection, which automatically selects parent emotions when a child emotion is selected. This creates a more logical and intuitive emotion selection flow.

## How It Works

### Automatic Parent Selection

When you select a specific emotion:

1. **Tertiary emotion** → Automatically selects its secondary and core parent
2. **Secondary emotion** → Automatically selects its core parent
3. **Core emotion** → Selected independently

### Example

Selecting "Optimistic" (tertiary) will automatically select:

- "Happy" (core parent)
- "Joyful" (secondary parent)
- "Optimistic" (the selected emotion)

## Visual Indicators

### Empty State

- Core emotions pulse with a subtle animation when no emotions are selected
- Helper text appears: "Start by selecting a core emotion"
- Core emotions have a thicker border to draw attention

### Selected State

The selected emotions display shows clear hierarchy:

- **Core emotions**: Larger pills with stronger colors and shadows
- **Secondary emotions**: Indented with › arrow indicator
- **Tertiary emotions**: Further indented with ›› arrow indicator

### Orphaned Emotions

If hierarchical selection is disabled and a child emotion is selected without its parent, it appears as "orphaned" with a dashed border.

## User Benefits

1. **Logical Flow**: Ensures emotional states make sense hierarchically
2. **Faster Selection**: Auto-selects related emotions
3. **Visual Clarity**: Clear parent-child relationships
4. **Guided Experience**: Encourages starting with broad emotions

## Configuration

### Enable/Disable Hierarchical Selection

```tsx
<EmotionSelector
  value={selectedEmotions}
  onChange={setSelectedEmotions}
  hierarchicalSelection={true} // Default: true
/>
```

### In the Wheel Component

```tsx
<EmotionWheel
  selectedEmotions={selectedEmotions}
  onEmotionToggle={handleToggle}
  hierarchicalSelection={true}
/>
```

## Interaction Patterns

### Selection

1. User clicks "Ecstatic" (tertiary)
2. System automatically selects:
   - "Happy" (core) - if not already selected
   - "Elated" (secondary) - if not already selected
   - "Ecstatic" (tertiary)

### Deselection

- Removing any emotion only removes that specific emotion
- Child emotions remain selected when parent is removed
- This allows users to refine their selections

## Design Decisions

### Why Hierarchical Selection?

- **Semantic Accuracy**: Being "optimistic" implies being "joyful" and "happy"
- **User Guidance**: Helps users understand emotion relationships
- **Data Quality**: Ensures more complete emotional profiles

### Visual Hierarchy

- Size and prominence decrease from core → secondary → tertiary
- Indentation shows parent-child relationships
- Color intensity reflects emotion depth

## Future Enhancements

1. **Cascade Deselection**: Option to remove all children when parent is removed
2. **Exclusive Branches**: Prevent selecting conflicting emotions (e.g., happy and sad simultaneously)
3. **Emotion Intensity**: Add sliders for each selected emotion
4. **Custom Hierarchies**: Allow users to define their own emotion relationships
