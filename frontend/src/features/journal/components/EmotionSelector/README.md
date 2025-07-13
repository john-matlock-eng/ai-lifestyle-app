# EmotionSelector Component

A comprehensive emotion selection component for the AI Lifestyle App journal feature. It provides two interfaces for users to select their emotions: an interactive emotion wheel and a hierarchical drill-down list.

## Features

- **Two Interface Modes**: 
  - **Wheel View**: Visual emotion wheel with three hierarchical levels
  - **List View**: Drill-down interface with breadcrumb navigation
  - **Both**: Users can switch between views

- **Hierarchical Emotion Structure**:
  - **Core Emotions** (6): Happy, Sad, Angry, Fearful, Surprised, Disgusted
  - **Secondary Emotions** (32): More specific feelings within each core emotion
  - **Tertiary Emotions** (100+): Highly specific emotional states

- **Multi-Selection Support**: Users can select multiple emotions to capture complex emotional states

- **Customizable Options**:
  - Maximum selection limit
  - Default view mode
  - Responsive design

## Usage

```tsx
import { EmotionSelector } from '@/features/journal/components';

const MyComponent = () => {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  
  return (
    <EmotionSelector
      value={selectedEmotions}
      onChange={setSelectedEmotions}
      mode="both"              // 'wheel' | 'list' | 'both'
      maxSelections={5}        // optional: limit selections
    />
  );
};
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string[]` | required | Array of selected emotion IDs |
| `onChange` | `(emotions: string[]) => void` | required | Callback when emotions change |
| `mode` | `'wheel' \| 'list' \| 'both'` | `'both'` | Interface mode |
| `maxSelections` | `number` | undefined | Maximum number of emotions that can be selected |
| `className` | `string` | `''` | Additional CSS classes |

## Integration with Journal Templates

The emotion selector has been integrated into the journal template system:

```typescript
// In template definition
{
  id: 'emotions',
  title: "Today's Emotions",
  prompt: 'How are you feeling?',
  type: 'emotions',
  required: true,
  options: {
    maxSelections: 5,
    mode: 'both'
  }
}
```

### Data Extraction

The template extractors convert selected emotions into:
- **mood**: The first selected emotion (for backward compatibility)
- **tags**: Each emotion is added as a tag with format `emotion-{id}`

## Emotion Data Structure

```typescript
interface Emotion {
  id: string;
  label: string;
  color: string;
  parent?: string;
  level: 'core' | 'secondary' | 'tertiary';
}
```

## Helper Functions

```typescript
import { 
  getEmotionById,
  getEmotionPath,
  getEmotionEmoji,
  getCoreEmotions,
  getSecondaryEmotions,
  getTertiaryEmotions 
} from './emotionData';

// Get emotion details
const emotion = getEmotionById('joyful');

// Get full emotion path (e.g., Happy → Joyful → Optimistic)
const path = getEmotionPath('optimistic');

// Get emoji for an emotion
const emoji = getEmotionEmoji('happy'); // 😊
```

## Styling

The component uses the app's theme system and respects light/dark modes. Colors are carefully chosen to be accessible and visually distinct.

## Accessibility

- Keyboard navigation support
- ARIA labels for screen readers
- High contrast mode support
- Clear visual feedback for selections

## Future Enhancements

- Add emotion intensity slider for each selected emotion
- Emotion history tracking
- Personalized emotion suggestions based on patterns
- Custom emotion additions
- Emotion combinations (e.g., "bittersweet" = happy + sad)