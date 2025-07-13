# EmotionSelector Component

A comprehensive emotion selection component for the AI Lifestyle App journal feature. It provides two interfaces for users to select their emotions: an interactive emotion wheel and a hierarchical drill-down list.

## Recent Improvements (v2.0)

### Visual Enhancements
- **Increased Default Size**: Wheel now defaults to 800px (max 900px) for better readability
- **Zoom Controls**: Added zoom in/out buttons (80%-150% range)
- **Smart Label Display**: Tertiary emotions only show labels when zoomed in, hovered, or selected
- **Dynamic Font Sizing**: Text size scales proportionally with wheel size and zoom level
- **Hover Tooltips**: Shows emotion name, emoji, and selection hint on hover

### Data Accuracy
- **Complete Emotion Set**: Now includes all 7 core emotions from the original wheel
- **135 Total Emotions**: 7 core + 41 secondary + 87 tertiary emotions
- **Exact Match**: Updated to precisely match the reference emotion wheel

### Theme & Styling
- **CSS Variables**: Full theme integration using CSS custom properties
- **Dark Mode Support**: Automatically adapts to light/dark themes
- **Custom CSS Classes**: Added semantic classes for easier customization
- **Print & Accessibility**: Includes print styles and reduced-motion support

### Technical Improvements
- **Better Text Rotation**: Labels automatically flip for optimal readability
- **Performance**: Optimized rendering with conditional text display
- **Responsive Design**: Automatically adjusts to container width
- **Touch Optimized**: Larger tap targets for mobile devices

## Features

- **Two Interface Modes**: 
  - **Wheel View**: Visual emotion wheel with three hierarchical levels
  - **List View**: Drill-down interface with breadcrumb navigation
  - **Both**: Users can switch between views

- **Hierarchical Emotion Structure**:
  - **Core Emotions** (7): Happy, Sad, Disgusted, Angry, Fearful, Bad, Surprised
  - **Secondary Emotions** (41): More specific feelings within each core emotion
  - **Tertiary Emotions** (87): Highly specific emotional states

- **Multi-Selection Support**: Users can select multiple emotions to capture complex emotional states

- **Customizable Options**:
  - Maximum selection limit
  - Default view mode
  - Responsive design
  - Zoom controls
  - Theme integration

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

### CSS Classes
- `.emotion-wheel-container` - Main container
- `.emotion-wheel-zoom` - Zoom container
- `.emotion-segment` - Individual emotion segments
- `.emotion-text-core/secondary/tertiary` - Text labels by level
- `.emotion-tooltip` - Hover tooltip
- `.emotion-pill` - Selected emotion tags
- `.emotion-list-item` - List view items

### CSS Variables
```css
--wheel-bg: var(--color-background);
--wheel-border: var(--color-surface-muted);
--wheel-text-primary: var(--color-theme);
--wheel-text-secondary: var(--color-muted);
--wheel-hover-brightness: 1.1;
```

## Accessibility

- Keyboard navigation support
- ARIA labels for screen readers
- High contrast mode support
- Clear visual feedback for selections
- Reduced motion support
- Print-friendly styles

## Known Issues & Solutions

### Text Readability
- **Issue**: Small text on outer rings
- **Solution**: Use zoom controls or hover over emotions to see tooltips

### Mobile Performance
- **Issue**: Large wheel may be slow on older devices
- **Solution**: List view is optimized for mobile use

### Theme Compatibility
- **Issue**: Some themes may have contrast issues
- **Solution**: CSS variables can be overridden for custom themes

## Future Enhancements

- Add emotion intensity slider for each selected emotion
- Emotion history tracking
- Personalized emotion suggestions based on patterns
- Custom emotion additions
- Emotion combinations (e.g., "bittersweet" = happy + sad)
- Export emotion data for analysis
- Emotion journey visualization over time