# Component API Documentation
**AccuBooks Design System v3.0 - Complete API Reference**

---

## 📋 Table of Contents

1. [Perfect Button](#perfect-button)
2. [Perfect Card](#perfect-card)
3. [Perfect Input](#perfect-input)
4. [Perfect Modal](#perfect-modal)
5. [Perfect Avatar](#perfect-avatar)
6. [Perfect Badge](#perfect-badge)
7. [Perfect Skeleton](#perfect-skeleton)
8. [Perfect Tooltip](#perfect-tooltip)
9. [Micro Interactions](#micro-interactions)
10. [Ripple Effect](#ripple-effect)
11. [Magnetic Button](#magnetic-button)
12. [Parallax](#parallax)
13. [Stagger Animation](#stagger-animation)
14. [Floating Action Button](#floating-action-button)
15. [Loading Dots](#loading-dots)
16. [Progress Ring](#progress-ring)
17. [Particle Effect](#particle-effect)
18. [Gesture Indicator](#gesture-indicator)

---

## Perfect Button

### Overview
Enterprise-grade button component with comprehensive accessibility, micro-interactions, and security integration.

### Import
```tsx
import { PerfectButton } from '@accubooks/design-system-v3';
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | Button content |
| `variant` | `'primary' \| 'secondary' \| 'tertiary' \| 'ghost' \| 'danger' \| 'success'` | `'primary'` | Button style variant |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Button size |
| `loading` | `boolean` | `false` | Show loading state |
| `disabled` | `boolean` | `false` | Disable button |
| `icon` | `React.ReactNode` | - | Icon element |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Icon position |
| `fullWidth` | `boolean` | `false` | Full width button |
| `rounded` | `boolean` | `false` | Rounded corners |
| `glow` | `boolean` | `false` | Glow effect |
| `ripple` | `boolean` | `true` | Ripple effect |
| `onClick` | `() => void` | - | Click handler |
| `className` | `string` | `''` | Additional CSS classes |
| `ariaLabel` | `string` | - | ARIA label |
| `accessibility` | `AccessibilityProps` | `{}` | Accessibility options |

### Accessibility Props

```tsx
interface AccessibilityProps {
  announceOnClick?: boolean;      // Announce to screen reader on click
  keyboardNavigation?: boolean;   // Enable keyboard navigation
  focusVisible?: boolean;         // Show focus indicator
}
```

### Examples

#### Basic Usage
```tsx
<PerfectButton onClick={handleClick}>
  Click Me
</PerfectButton>
```

#### With Icon
```tsx
<PerfectButton icon={<SaveIcon />} iconPosition="left">
  Save
</PerfectButton>
```

#### Loading State
```tsx
<PerfectButton loading={true} disabled={true}>
  Processing...
</PerfectButton>
```

#### With Accessibility
```tsx
<PerfectButton
  ariaLabel="Save document"
  accessibility={{
    announceOnClick: true,
    keyboardNavigation: true,
    focusVisible: true
  }}
  onClick={handleSave}
>
  Save
</PerfectButton>
```

### CSS Variables

```css
.perfect-button {
  --btn-primary: #3b82f6;
  --btn-secondary: #64748b;
  --btn-success: #10b981;
  --btn-danger: #ef4444;
  --btn-tertiary: #8b5cf6;
  --btn-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --btn-glow: 0 0 20px rgba(59, 130, 246, 0.5);
}
```

---

## Perfect Card

### Overview
Versatile container component with multiple variants and interaction patterns.

### Import
```tsx
import { PerfectCard } from '@accubooks/design-system-v3';
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | Card content |
| `variant` | `'default' \| 'elevated' \| 'outlined' \| 'glass'` | `'default'` | Card style variant |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Internal padding |
| `rounded` | `boolean` | `true` | Rounded corners |
| `hoverable` | `boolean` | `true` | Hover effects |
| `clickable` | `boolean` | `false` | Click interaction |
| `glow` | `boolean` | `false` | Glow effect |
| `gradient` | `boolean` | `false` | Gradient background |
| `onClick` | `() => void` | - | Click handler |
| `className` | `string` | `''` | Additional CSS classes |
| `accessibility` | `CardAccessibilityProps` | `{}` | Accessibility options |

### Accessibility Props

```tsx
interface CardAccessibilityProps {
  role?: string;           // ARIA role
  label?: string;          // ARIA label
  describedBy?: string;    // ARIA describedby
}
```

### Examples

#### Basic Card
```tsx
<PerfectCard>
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</PerfectCard>
```

#### Elevated Card
```tsx
<PerfectCard variant="elevated" padding="lg" glow={true}>
  <h3>Featured Card</h3>
  <p>Enhanced visual presentation.</p>
</PerfectCard>
```

#### Glass Card
```tsx
<PerfectCard variant="glass" rounded={true}>
  <h3>Glass Effect</h3>
  <p>Modern glassmorphism design.</p>
</PerfectCard>
```

#### Clickable Card
```tsx
<PerfectCard
  clickable={true}
  hoverable={true}
  onClick={handleCardClick}
  accessibility={{
    role: 'button',
    label: 'Open user profile'
  }}
>
  <UserProfile />
</PerfectCard>
```

---

## Perfect Input

### Overview
Enterprise-grade input component with comprehensive validation and accessibility.

### Import
```tsx
import { PerfectInput } from '@accubooks/design-system-v3';
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'text' \| 'email' \| 'password' \| 'number' \| 'tel' \| 'url' \| 'search'` | `'text'` | Input type |
| `placeholder` | `string` | - | Placeholder text |
| `value` | `string` | - | Controlled value |
| `defaultValue` | `string` | - | Uncontrolled default |
| `onChange` | `(value: string) => void` | - | Change handler |
| `onBlur` | `() => void` | - | Blur handler |
| `onFocus` | `() => void` | - | Focus handler |
| `label` | `string` | - | Input label |
| `error` | `string` | - | Error message |
| `helper` | `string` | - | Helper text |
| `required` | `boolean` | `false` | Required field |
| `disabled` | `boolean` | `false` | Disabled state |
| `readonly` | `boolean` | `false` | Read-only state |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Input size |
| `variant` | `'default' \| 'filled' \| 'outlined'` | `'default'` | Input variant |
| `icon` | `React.ReactNode` | - | Icon element |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Icon position |
| `loading` | `boolean` | `false` | Loading state |
| `className` | `string` | `''` | Additional CSS classes |
| `accessibility` | `InputAccessibilityProps` | `{}` | Accessibility options |

### Accessibility Props

```tsx
interface InputAccessibilityProps {
  announceChanges?: boolean;    // Announce value changes
  autoComplete?: string;       // Autocomplete attribute
  inputMode?: 'none' \| 'text' \| 'decimal' \| 'numeric' \| 'tel' \| 'search' \| 'email' \| 'url';
}
```

### Examples

#### Basic Input
```tsx
<PerfectInput
  label="Email Address"
  placeholder="Enter your email"
  type="email"
  required={true}
  onChange={handleChange}
/>
```

#### With Validation
```tsx
<PerfectInput
  label="Password"
  type="password"
  required={true}
  error={passwordError}
  helper="Must be at least 8 characters"
  icon={<LockIcon />}
  onChange={handlePasswordChange}
/>
```

#### With Icon
```tsx
<PerfectInput
  label="Search"
  type="search"
  placeholder="Search items..."
  icon={<SearchIcon />}
  accessibility={{
    announceChanges: true,
    autoComplete: 'off'
  }}
  onChange={handleSearch}
/>
```

---

## Perfect Modal

### Overview
Accessible modal component with focus management and escape handling.

### Import
```tsx
import { PerfectModal } from '@accubooks/design-system-v3';
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | Modal visibility |
| `onClose` | `() => void` | - | Close handler |
| `title` | `string` | - | Modal title |
| `children` | `React.ReactNode` | - | Modal content |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Modal size |
| `closable` | `boolean` | `true` | Show close button |
| `backdrop` | `boolean` | `true` | Backdrop overlay |
| `centered` | `boolean` | `true` | Center modal |
| `animation` | `'fade' \| 'slide' \| 'zoom' \| 'flip'` | `'fade'` | Animation type |
| `className` | `string` | `''` | Additional CSS classes |
| `accessibility` | `ModalAccessibilityProps` | `{}` | Accessibility options |

### Accessibility Props

```tsx
interface ModalAccessibilityProps {
  closeOnEscape?: boolean;    // Close on escape key
  trapFocus?: boolean;        // Trap focus within modal
  restoreFocus?: boolean;     // Restore focus on close
}
```

### Examples

#### Basic Modal
```tsx
<PerfectModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Action"
>
  <p>Are you sure you want to proceed?</p>
  <div className="flex gap-2 mt-4">
    <PerfectButton onClick={handleConfirm}>Confirm</PerfectButton>
    <PerfectButton variant="ghost" onClick={handleClose}>Cancel</PerfectButton>
  </div>
</PerfectModal>
```

#### Large Modal
```tsx
<PerfectModal
  isOpen={isOpen}
  onClose={handleClose}
  title="User Details"
  size="lg"
  animation="slide"
  accessibility={{
    closeOnEscape: true,
    trapFocus: true,
    restoreFocus: true
  }}
>
  <UserDetailsForm />
</PerfectModal>
```

---

## Perfect Avatar

### Overview
Flexible avatar component with status indicators and fallbacks.

### Import
```tsx
import { PerfectAvatar } from '@accubooks/design-system-v3';
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | - | Image source |
| `alt` | `string` | - | Alt text |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `'md'` | Avatar size |
| `fallback` | `string` | - | Fallback text |
| `variant` | `'circle' \| 'square' \| 'rounded'` | `'circle'` | Shape variant |
| `status` | `'online' \| 'offline' \| 'away' \| 'busy'` | - | Status indicator |
| `showStatus` | `boolean` | `false` | Show status indicator |
| `className` | `string` | `''` | Additional CSS classes |
| `onClick` | `() => void` | - | Click handler |
| `accessibility` | `AvatarAccessibilityProps` | `{}` | Accessibility options |

### Accessibility Props

```tsx
interface AvatarAccessibilityProps {
  label?: string;           // ARIA label
  announceStatus?: boolean; // Announce status changes
}
```

### Examples

#### Basic Avatar
```tsx
<PerfectAvatar
  src="/avatar.jpg"
  alt="John Doe"
  size="lg"
/>
```

#### With Status
```tsx
<PerfectAvatar
  src="/avatar.jpg"
  alt="Jane Smith"
  size="xl"
  status="online"
  showStatus={true}
  fallback="JS"
  accessibility={{
    label: "Jane Smith avatar",
    announceStatus: true
  }}
/>
```

#### Fallback Only
```tsx
<PerfectAvatar
  alt="User"
  size="md"
  fallback="U"
  variant="rounded"
/>
```

---

## Perfect Badge

### Overview
Versatile badge component for status indicators and counts.

### Import
```tsx
import { PerfectBadge } from '@accubooks/design-system-v3';
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | Badge content |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | Badge variant |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Badge size |
| `rounded` | `boolean` | `true` | Rounded corners |
| `dot` | `boolean` | `false` | Dot style |
| `count` | `number` | - | Numeric count |
| `maxCount` | `number` | `99` | Maximum count display |
| `className` | `string` | `''` | Additional CSS classes |
| `accessibility` | `BadgeAccessibilityProps` | `{}` | Accessibility options |

### Accessibility Props

```tsx
interface BadgeAccessibilityProps {
  announceCount?: boolean;   // Announce count changes
}
```

### Examples

#### Text Badge
```tsx
<PerfectBadge variant="success">
  Active
</PerfectBadge>
```

#### Count Badge
```tsx
<PerfectBadge
  count={5}
  variant="primary"
  accessibility={{ announceCount: true }}
/>
```

#### Dot Badge
```tsx
<PerfectBadge
  dot={true}
  variant="error"
/>
```

---

## Perfect Skeleton

### Overview
Loading skeleton component for smooth content loading experiences.

### Import
```tsx
import { PerfectSkeleton } from '@accubooks/design-system-v3';
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'text' \| 'rectangular' \| 'circular'` | `'text'` | Skeleton variant |
| `width` | `string \| number` | - | Custom width |
| `height` | `string \| number` | - | Custom height |
| `lines` | `number` | `1` | Number of lines (text variant) |
| `className` | `string` | `''` | Additional CSS classes |
| `animation` | `'pulse' \| 'wave' \| 'none'` | `'pulse'` | Animation type |

### Examples

#### Text Skeleton
```tsx
<PerfectSkeleton variant="text" lines={3} />
```

#### Rectangular Skeleton
```tsx
<PerfectSkeleton
  variant="rectangular"
  width="100%"
  height={200}
/>
```

#### Circular Skeleton
```tsx
<PerfectSkeleton
  variant="circular"
  width={60}
  height={60}
/>
```

---

## Perfect Tooltip

### Overview
Accessible tooltip component with smart positioning.

### Import
```tsx
import { PerfectTooltip } from '@accubooks/design-system-v3';
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `React.ReactNode` | - | Tooltip content |
| `children` | `React.ReactNode` | - | Trigger element |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Tooltip position |
| `trigger` | `'hover' \| 'click' \| 'focus'` | `'hover'` | Trigger type |
| `delay` | `number` | `200` | Show delay (ms) |
| `arrow` | `boolean` | `true` | Show arrow |
| `className` | `string` | `''` | Additional CSS classes |
| `accessibility` | `TooltipAccessibilityProps` | `{}` | Accessibility options |

### Accessibility Props

```tsx
interface TooltipAccessibilityProps {
  describedBy?: boolean;     // Use aria-describedby
}
```

### Examples

#### Basic Tooltip
```tsx
<PerfectTooltip content="Save your changes">
  <PerfectButton>
    <SaveIcon />
  </PerfectButton>
</PerfectTooltip>
```

#### Click Tooltip
```tsx
<PerfectTooltip
  content="Click to copy"
  trigger="click"
  placement="bottom"
>
  <CopyButton />
</PerfectTooltip>
```

---

## Micro Interactions

### Overview
Micro-interaction system for delightful user feedback.

### Import
```tsx
import { MicroInteraction } from '@accubooks/design-system-v3';
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | Target element |
| `type` | `MicroInteractionType` | - | Interaction type |
| `animation` | `AnimationPreset` | `'bounce'` | Animation preset |
| `haptic` | `boolean` | `false` | Haptic feedback |
| `sound` | `boolean` | `false` | Sound effect |
| `disabled` | `boolean` | `false` | Disable interaction |
| `className` | `string` | `''` | Additional CSS classes |
| `onAnimationStart` | `() => void` | - | Animation start callback |
| `onAnimationComplete` | `() => void` | - | Animation complete callback |
| `config` | `Partial<AnimationConfig>` | `{}` | Animation configuration |

### Types

```tsx
type MicroInteractionType = 
  | 'hover' | 'focus' | 'click' | 'drag' | 'swipe' | 'pinch' 
  | 'scroll' | 'load' | 'success' | 'error' | 'warning' | 'info';

type AnimationPreset = 
  | 'bounce' | 'pulse' | 'slide' | 'fade' | 'scale' | 'rotate' 
  | 'flip' | 'shake' | 'wiggle' | 'glow' | 'ripple' | 'morph';
```

### Examples

#### Hover Animation
```tsx
<MicroInteraction type="hover" animation="bounce">
  <Card>Hover me!</Card>
</MicroInteraction>
```

#### Click with Haptic
```tsx
<MicroInteraction
  type="click"
  animation="scale"
  haptic={true}
  sound={true}
>
  <Button>Click with feedback</Button>
</MicroInteraction>
```

---

## Ripple Effect

### Overview
Material design ripple effect for touch feedback.

### Import
```tsx
import { RippleEffect } from '@accubooks/design-system-v3';
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | Target element |
| `color` | `string` | `'rgba(255, 255, 255, 0.5)'` | Ripple color |
| `duration` | `number` | `600` | Animation duration (ms) |
| `size` | `number` | `100` | Ripple size (px) |
| `disabled` | `boolean` | `false` | Disable ripples |
| `className` | `string` | `''` | Additional CSS classes |

### Examples

#### Basic Ripple
```tsx
<RippleEffect>
  <PerfectButton>Ripple Button</PerfectButton>
</RippleEffect>
```

#### Custom Color
```tsx
<RippleEffect color="rgba(59, 130, 246, 0.3)">
  <Card>Custom ripple</Card>
</RippleEffect>
```

---

## Magnetic Button

### Overview
Button with magnetic mouse following effect.

### Import
```tsx
import { MagneticButton } from '@accubooks/design-system-v3';
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | Button content |
| `strength` | `number` | `0.3` | Magnetic strength (0-1) |
| `radius` | `number` | `100` | Effect radius (px) |
| `disabled` | `boolean` | `false` | Disable effect |
| `className` | `string` | `''` | Additional CSS classes |
| `onClick` | `() => void` | - | Click handler |

### Examples

#### Basic Magnetic
```tsx
<MagneticButton strength={0.5} radius={150}>
  <PerfectButton>Magnetic</PerfectButton>
</MagneticButton>
```

---

## Parallax

### Overview
Parallax scrolling effect for depth perception.

### Import
```tsx
import { Parallax } from '@accubooks/design-system-v3';
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | Target element |
| `speed` | `number` | `0.5` | Parallax speed (0-1) |
| `disabled` | `boolean` | `false` | Disable effect |
| `className` | `string` | `''` | Additional CSS classes |

### Examples

#### Basic Parallax
```tsx
<Parallax speed={0.3}>
  <BackgroundImage />
</Parallax>
```

---

## Stagger Animation

### Overview
Staggered animation for lists and grids.

### Import
```tsx
import { StaggerAnimation } from '@accubooks/design-system-v3';
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode[]` | - | Child elements |
| `staggerDelay` | `number` | `0.1` | Delay between items (s) |
| `direction` | `'up' \| 'down' \| 'left' \| 'right' \| 'scale' \| 'fade'` | `'up'` | Animation direction |
| `disabled` | `boolean` | `false` | Disable animation |
| `className` | `string` | `''` | Additional CSS classes |

### Examples

#### List Stagger
```tsx
<StaggerAnimation staggerDelay={0.1} direction="up">
  {items.map(item => (
    <ListItem key={item.id}>{item.name}</ListItem>
  ))}
</StaggerAnimation>
```

---

## Floating Action Button

### Overview
Material design floating action button.

### Import
```tsx
import { FloatingActionButton } from '@accubooks/design-system-v3';
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `React.ReactNode` | - | Button icon |
| `label` | `string` | - | Button label (extended) |
| `position` | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | `'bottom-right'` | Button position |
| `color` | `string` | `'blue'` | Button color |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `extended` | `boolean` | `false` | Extended mode |
| `disabled` | `boolean` | `false` | Disabled state |
| `className` | `string` | `''` | Additional CSS classes |
| `onClick` | `() => void` | - | Click handler |

### Examples

#### Basic FAB
```tsx
<FloatingButton
  icon={<AddIcon />}
  onClick={handleAdd}
/>
```

#### Extended FAB
```tsx
<FloatingButton
  icon={<AddIcon />}
  label="New Item"
  extended={true}
  color="primary"
  onClick={handleAdd}
/>
```

---

## Loading Dots

### Overview
Animated loading dots indicator.

### Import
```tsx
import { LoadingDots } from '@accubooks/design-system-v3';
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number` | `8` | Dot size (px) |
| `color` | `string` | `'blue'` | Dot color |
| `count` | `number` | `3` | Number of dots |
| `duration` | `number` | `1.4` | Animation duration (s) |
| `className` | `string` | `''` | Additional CSS classes |

### Examples

#### Basic Loading
```tsx
<LoadingDots />
```

#### Custom Style
```tsx
<LoadingDots size={12} color="purple" count={4} />
```

---

## Progress Ring

### Overview
Circular progress indicator with animation.

### Import
```tsx
import { ProgressRing } from '@accubooks/design-system-v3';
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `progress` | `number` | - | Progress percentage (0-100) |
| `size` | `number` | `120` | Ring size (px) |
| `strokeWidth` | `number` | `8` | Stroke width (px) |
| `color` | `string` | `'blue'` | Progress color |
| `backgroundColor` | `string` | `'gray'` | Background color |
| `animated` | `boolean` | `true` | Animate progress |
| `showPercentage` | `boolean` | `false` | Show percentage text |
| `className` | `string` | `''` | Additional CSS classes |

### Examples

#### Basic Progress
```tsx
<ProgressRing progress={75} />
```

#### With Percentage
```tsx
<ProgressRing
  progress={60}
  size={150}
  showPercentage={true}
  color="success"
/>
```

---

## Particle Effect

### Overview
Particle explosion effect for celebrations.

### Import
```tsx
import { ParticleEffect } from '@accubooks/design-system-v3';
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `count` | `number` | `20` | Number of particles |
| `size` | `number` | `4` | Particle size (px) |
| `color` | `string` | `'blue'` | Particle color |
| `duration` | `number` | `1` | Animation duration (s) |
| `spread` | `number` | `100` | Spread distance (px) |
| `disabled` | `boolean` | `false` | Disable effect |
| `className` | `string` | `''` | Additional CSS classes |

### Examples

#### Celebration Effect
```tsx
<ParticleEffect count={30} color="gold" duration={1.5}>
  <Button onClick={triggerCelebration}>Celebrate!</Button>
</ParticleEffect>
```

---

## Gesture Indicator

### Overview
Visual gesture indicators for touch interactions.

### Import
```tsx
import { GestureIndicator } from '@accubooks/design-system-v3';
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `gesture` | `GestureType` | - | Gesture type |
| `active` | `boolean` | `false` | Active state |
| `size` | `number` | `60` | Indicator size (px) |
| `color` | `string` | `'blue'` | Indicator color |
| `className` | `string` | `''` | Additional CSS classes |

### Types

```tsx
type GestureType = 
  | 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' 
  | 'tap' | 'long-press';
```

### Examples

#### Swipe Indicator
```tsx
<GestureIndicator gesture="swipe-left" active={true} />
```

---

## 🎯 Usage Guidelines

### Performance Considerations

1. **Lazy Loading**: Use `useSmartAutoLazy` for heavy components
2. **GPU Acceleration**: Enable for complex animations
3. **Bundle Size**: Import only needed components
4. **Memory Management**: Clean up animations on unmount

### Accessibility Best Practices

1. **Semantic HTML**: Use appropriate elements
2. **ARIA Labels**: Provide descriptive labels
3. **Keyboard Navigation**: Ensure keyboard accessibility
4. **Screen Readers**: Test with screen readers
5. **Color Contrast**: Maintain WCAG AA/AAA contrast

### Security Guidelines

1. **Input Validation**: Validate all user inputs
2. **XSS Prevention**: Sanitize dynamic content
3. **CSRF Protection**: Use anti-CSRF tokens
4. **Data Privacy**: Handle sensitive data carefully

### Testing Recommendations

1. **Unit Tests**: Test component behavior
2. **Integration Tests**: Test component interactions
3. **Accessibility Tests**: Use automated testing tools
4. **Performance Tests**: Monitor performance metrics
5. **Visual Regression**: Test visual consistency

---

## 🔧 Customization

### Theme Customization

```css
:root {
  /* Override primary colors */
  --primary-50: #custom-color-50;
  --primary-500: #custom-color-500;
  --primary-900: #custom-color-900;
  
  /* Override spacing */
  --space-4: 1.25rem; /* Custom spacing */
  
  /* Override shadows */
  --shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

### Component Extension

```tsx
import { PerfectButton } from '@accubooks/design-system-v3';

const CustomButton = (props) => (
  <PerfectButton
    {...props}
    className={`custom-button ${props.className}`}
    style={{
      background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
      ...props.style
    }}
  />
);
```

### Plugin System

```tsx
import { DesignSystemProvider } from '@accubooks/design-system-v3';

const plugins = {
  analytics: {
    track: (event, data) => console.log(event, data)
  },
  i18n: {
    translate: (key) => getTranslation(key)
  }
};

function App() {
  return (
    <DesignSystemProvider plugins={plugins}>
      <YourApp />
    </DesignSystemProvider>
  );
}
```

---

## 📚 Additional Resources

- [Design System Documentation](./Design-System-v3.md)
- [Implementation Guide](./Implementation-Guide.md)
- [Accessibility Guidelines](./Accessibility-Guide.md)
- [Performance Optimization](./Performance-Guide.md)
- [Security Best Practices](./Security-Guide.md)

---

*Last updated: December 2023*
*Version: 3.0.0*
