# Tutorial System Documentation

## Overview

The Army Recruiter Tool now includes a comprehensive tutorial system to help first-time users learn how to use the application. The system includes:

1. **Welcome Modal** - Shown to first-time users when they log in
2. **Help Button** - Available in the header for all users
3. **Contextual Tutorials** - Different tutorials for different pages
4. **Progress Tracking** - Uses localStorage to remember completion

## Features

### 1. Welcome Modal
- Automatically appears for first-time users
- Shows a friendly welcome message
- Offers two options:
  - **Get Started** - Dismisses the modal
  - **Take Tutorial** - Opens the general tutorial

### 2. Help Button
- Located in the header (desktop and mobile)
- Opens a contextual tutorial based on the current page
- Available on all protected routes

### 3. Tutorial Content

The system includes tutorials for:

- **General** - Getting started overview
- **Dashboard** - Dashboard features and navigation
- **My QR Code** - QR code management
- **Prospecting** - Prospecting map usage
- **Station Commander** - Station management features

Each tutorial includes:
- Step-by-step guidance
- Visual icons for each step
- Progress indicator
- Navigation (Previous/Next/Finish)

## Implementation Details

### Files Created/Modified

1. **`client/src/components/tutorial.tsx`**
   - Main tutorial component
   - Welcome modal component
   - Tutorial content definitions
   - Helper functions

2. **`client/src/components/header.tsx`**
   - Added Help button
   - Integrated tutorial dialog

3. **`client/src/App.tsx`**
   - Added welcome modal integration
   - Handles first-time user detection

### Storage Keys

- `army-recruiter-tutorial-completed` - Tracks if user has completed a tutorial
- `army-recruiter-welcome-shown` - Tracks if welcome modal has been shown

### Customization

To add new tutorial content:

1. Edit `tutorialContent` object in `tutorial.tsx`
2. Add a new entry with:
   - `title` - Tutorial title
   - `description` - Brief description
   - `steps` - Array of tutorial steps

Example:
```typescript
"new-page": {
  title: "New Page Tutorial",
  description: "Learn how to use the new page",
  steps: [
    {
      title: "Step 1",
      description: "Description of step 1",
      icon: Home, // Optional icon component
    },
    // ... more steps
  ],
}
```

To add tutorial for a new page:

1. Add route mapping in `getTutorialPage()` function
2. Add tutorial content to `tutorialContent` object

## User Experience

### First-Time Users
1. User logs in
2. Welcome modal appears
3. User can:
   - Click "Get Started" to dismiss
   - Click "Take Tutorial" to start general tutorial

### Returning Users
1. Help button always available in header
2. Clicking Help opens contextual tutorial for current page
3. Tutorial progress is saved (can skip and return later)

### Tutorial Flow
1. User clicks Help button or "Take Tutorial"
2. Tutorial dialog opens with first step
3. Progress bar shows current step
4. User navigates with Previous/Next buttons
5. On completion, tutorial is marked as completed

## Styling

The tutorial system uses the existing Army theme:
- **Background**: `bg-army-black`
- **Text**: `text-army-tan` / `text-army-gold`
- **Borders**: `border-army-field01`
- **Accents**: `bg-army-gold` for highlights

## Future Enhancements

Potential improvements:
- Video tutorials
- Interactive tooltips (highlighting specific UI elements)
- Tutorial analytics (track completion rates)
- Role-specific tutorials (different content for recruiters vs station commanders)
- Multi-language support

## Testing

To test the tutorial system:

1. Clear localStorage:
   ```javascript
   localStorage.removeItem('army-recruiter-welcome-shown');
   localStorage.removeItem('army-recruiter-tutorial-completed');
   ```

2. Refresh the page and log in
3. Welcome modal should appear
4. Test Help button on different pages
5. Verify contextual tutorials load correctly

## Support

For questions or issues with the tutorial system, refer to:
- Component: `client/src/components/tutorial.tsx`
- Integration: `client/src/components/header.tsx`
- App integration: `client/src/App.tsx`

