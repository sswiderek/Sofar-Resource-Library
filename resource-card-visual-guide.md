# Resource Card Visual Style Guide

## Card Anatomy

Each resource card consists of the following visual elements:

1. Color-coded top border (height: 1.5)
2. Optional internal-only indicator banner
3. Type badge (top left)
4. Date (top right, if available)
5. Resource title
6. Resource description
7. Footer with view count and action button

## Visual Reference

```
┌─────────────────────────────────────┐
│            COLOR STRIP               │ <- h-1.5 bg-color-300 (type-specific)
├─────────────────────────────────────┤
│ 🔒 Internal Use Only                │ <- Optional, amber background
├─────────────────────────────────────┤
│ ┌─────────┐                 Mar 2025│ <- Type badge & date
│ │ Webinar │                         │
│ └─────────┘                         │
│                                     │
│ Resource Title Goes Here            │ <- text-[#1e5bb0] font-semibold
│                                     │
│ This is the resource description    │ <- text-neutral-600 line-clamp-3/4
│ that provides details about what    │
│ the resource contains. It may span  │
│ multiple lines but is limited.      │
│                                     │
├─────────────────────────────────────┤ <- border-t border-blue-50
│ 👁️ 42 views          View Resource →│ <- Footer with view count and action
└─────────────────────────────────────┘
```

## CSS Classes Breakdown

### Card Container
```css
.card {
  background-color: white;
  overflow: hidden;
  border-width: 1px;
  border-color: #e5e5e5; /* neutral-200 */
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition-property: all;
  transition-duration: 200ms;
}

.card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  border-color: #bfdbfe; /* blue-200 */
}

/* For internal-only resources */
.card-internal {
  border-color: #fcd34d; /* amber-300 */
}
```

### Color Strips
```css
.color-strip {
  height: 0.375rem; /* h-1.5 */
}

/* Example color strips for different resource types */
.color-strip-webinar { background-color: #22d3ee; } /* cyan-400 */
.color-strip-slides { background-color: #5eead4; } /* teal-300 */
.color-strip-blog { background-color: #fcd34d; } /* amber-300 */
.color-strip-onepager { background-color: #22c55e; } /* green-500 */
```

### Internal Use Banner
```css
.internal-banner {
  background-color: #fffbeb; /* amber-50 */
  padding: 0.375rem 0.75rem; /* px-3 py-1.5 */
  border-bottom: 1px solid #fef3c7; /* border-b border-amber-100 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.internal-banner-text {
  display: flex;
  align-items: center;
  color: #b45309; /* text-amber-700 */
  font-size: 0.75rem; /* text-xs */
  font-weight: 500; /* font-medium */
  cursor: help;
}

.internal-banner-icon {
  height: 0.75rem;
  width: 0.75rem;
  margin-right: 0.25rem;
}
```

### Type Badge
```css
.type-badge {
  border-width: 1px;
  border-radius: 0.375rem; /* rounded-md */
  padding: 0.25rem 0.5rem; /* px-2 py-1 */
  font-size: 0.75rem; /* text-xs */
  font-weight: 500; /* font-medium */
  max-width: 65%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Example type badge colors */
.badge-webinar {
  background-color: #ecfeff; /* bg-cyan-100 */
  color: #0e7490; /* text-cyan-700 */
  border-color: #a5f3fc; /* border-cyan-200 */
}

.badge-slides {
  background-color: #f0fdfa; /* bg-teal-100 */
  color: #0f766e; /* text-teal-700 */
  border-color: #99f6e4; /* border-teal-200 */
}
```

### Card Content
```css
.card-content {
  padding: 0.75rem 1.25rem; /* p-3 sm:p-5 */
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem; /* mb-3 */
  gap: 0.5rem; /* gap-2 */
}

.card-date {
  font-size: 0.75rem; /* text-xs */
  color: #737373; /* text-neutral-500 */
  font-weight: 500; /* font-medium */
  flex-shrink: 0;
}

.card-title {
  font-size: 1rem; /* text-base sm:text-lg */
  font-weight: 600; /* font-semibold */
  color: #1e5bb0; /* sofar blue */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.25; /* leading-tight */
  margin-bottom: 0.5rem; /* mb-2 sm:mb-3 */
}

.card-title:hover {
  color: #1d4ed8; /* text-blue-700 */
}

.card-description {
  font-size: 0.75rem; /* text-xs sm:text-sm */
  color: #525252; /* text-neutral-600 */
  display: -webkit-box;
  -webkit-line-clamp: 3; /* sm:line-clamp-4 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex-grow: 1;
}

.card-footer {
  margin-top: 0.75rem; /* mt-3 */
  padding-top: 0.75rem; /* pt-3 */
  border-top: 1px solid #eff6ff; /* border-t border-blue-50 */
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-count {
  display: flex;
  align-items: center;
  font-size: 0.75rem; /* text-xs */
  color: #737373; /* text-neutral-500 */
}

.view-count-icon {
  height: 0.75rem;
  width: 0.75rem;
  margin-right: 0.25rem;
  opacity: 0.7;
}

.view-resource-button {
  display: flex;
  align-items: center;
  font-size: 0.75rem; /* text-xs sm:text-sm */
  font-weight: 500; /* font-medium */
  color: #2563eb; /* text-blue-600 */
}

.view-resource-button:hover {
  color: #1d4ed8; /* text-blue-700 */
}

.view-resource-icon {
  height: 0.75rem;
  width: 0.75rem;
  margin-left: 0.25rem;
}
```

## Tailwind Configuration

Ensure your Tailwind configuration includes these design tokens:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // If your project uses a custom blue for the Sofar brand
        'sofar-blue': '#1e5bb0',
      },
      screens: {
        'xs': '480px',
      },
      lineClamp: {
        4: '4',
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
}
```

## Card Responsiveness

The cards are designed to be responsive:

- On small screens, padding is reduced (p-3 vs p-5)
- Font sizes are smaller on mobile (text-base vs text-lg for titles)
- Description shows fewer lines on mobile (line-clamp-3 vs line-clamp-4)
- Icons are slightly smaller on mobile

These responsive adjustments ensure the cards look good on all device sizes while maintaining visual hierarchy and readability.
