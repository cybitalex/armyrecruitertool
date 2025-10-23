# US Army Recruitment Intake Tool - Design Guidelines

## Design Approach

**Selected Framework:** Fluent Design System (Microsoft)
**Rationale:** Government and military applications require professionalism, clarity, and accessibility compliance. Fluent Design provides the structured, trustworthy aesthetic needed for official data collection while maintaining modern usability standards.

**Core Principles:**
- Clarity and efficiency in data entry
- Professional, authoritative appearance befitting military context
- Maximum accessibility for diverse recruiting environments
- Clear visual hierarchy for complex forms and data review

## Typography System

**Font Stack:**
- Primary: 'Inter' (Google Fonts) - Clean, professional sans-serif
- Monospace: 'JetBrains Mono' for data fields requiring precision

**Type Scale:**
- Page Headers: text-3xl font-bold (30px)
- Section Headers: text-xl font-semibold (20px)
- Form Labels: text-sm font-medium (14px)
- Input Text: text-base (16px)
- Helper Text: text-xs (12px)
- Data Tables: text-sm (14px)

## Layout System

**Spacing Units:** Use Tailwind units of 2, 4, 6, and 8 consistently
- Form field spacing: space-y-6
- Section padding: p-8
- Card padding: p-6
- Button padding: px-4 py-2

**Container Strategy:**
- Main content: max-w-7xl mx-auto
- Form sections: max-w-4xl mx-auto
- Data review panels: Full width with internal grid

**Grid Structure:**
- Multi-step forms: Single column on mobile, 2-column on desktop (grid-cols-1 md:grid-cols-2)
- Data tables: Responsive horizontal scroll on mobile
- Dashboard metrics: 3-4 column grid (grid-cols-1 sm:grid-cols-2 lg:grid-cols-4)

## Component Library

### Navigation
**Top Bar:** Fixed header with Army branding (left), navigation tabs (center), user profile/logout (right). Height: h-16, shadow-md for depth.

**Progress Indicator:** Multi-step horizontal stepper showing form completion status with numbered circles and connecting lines.

### Form Components
**Input Fields:**
- Text inputs with floating labels
- Clear focus states with 2px border emphasis
- Inline validation icons (checkmark/error) positioned right
- Required field indicators (*)
- Helper text below inputs

**Field Groups:**
- Related fields grouped with subtle background cards
- Section headers with divider lines
- Collapsible sections for optional information

**Form Layout:**
- Personal Information (Name, DOB, SSN, Contact)
- Educational Background
- Military Interest (Branch preferences, roles)
- Physical Qualifications
- Background Check Consent

### Data Display
**Recruit Cards:** Grid of submitted applications with status badges (New, In Review, Approved, Rejected), preview of key info (name, date, status), quick action buttons.

**Detail View:** Full-width panel with tabbed sections for complete recruit information, edit capabilities, status update controls, document attachments section.

**Status Badges:** Pill-shaped labels with icon prefixes indicating application state.

### Actions
**Primary Button:** Solid fill, px-6 py-3, rounded-md, font-medium
**Secondary Button:** Border style, same sizing
**Icon Buttons:** Square (h-10 w-10), rounded-md for table actions

### Data Tables
**Structure:**
- Sticky header row
- Alternating row backgrounds for readability
- Sortable columns with arrow indicators
- Row actions (view, edit, delete) in fixed right column
- Pagination controls at bottom

### Modals & Overlays
**Confirmation Dialogs:** Centered modals with backdrop blur for critical actions (delete, submit)
**Slide-out Panels:** Right-side drawer for detailed views without losing context

## Page Layouts

### Dashboard View
**Top Section:** 4-column metrics (Total Recruits, Pending Review, Approved This Month, Rejected)
**Main Section:** Search/filter bar + data table with recent applications
**Sidebar:** Quick filters by status, date range selector

### Intake Form View
**Header:** Progress stepper showing 5 steps
**Content:** Centered form (max-w-4xl) with clear sections, prominent "Save Draft" and "Continue" buttons at bottom
**Autosave Indicator:** Subtle text showing last saved timestamp

### Review Detail View
**Header:** Recruit name + status with large action buttons (Approve/Reject/Request Info)
**Body:** Tabbed interface (Personal Info, Education, Preferences, Documents, History)
**Sidebar:** Timeline of application events, assigned recruiter info

## Icons
**Library:** Heroicons (Outline for UI chrome, Solid for filled states)
**Usage:** Form field prefixes, status indicators, action buttons, navigation items

## Accessibility
- All form inputs have associated labels
- ARIA labels for icon-only buttons
- Keyboard navigation support for all interactive elements
- High contrast mode compatibility
- Focus indicators on all interactive elements (ring-2 ring-offset-2)

## Animations
**Minimal approach:**
- Form field focus transitions (150ms ease)
- Button hover states (100ms)
- Modal fade-in (200ms)
- No scroll animations or decorative effects

## Images
**No hero images required.** This is a productivity tool focused on data entry and management. Any imagery should be limited to:
- Army logo/emblem in header (official branding)
- Avatar placeholders in user profiles
- Document preview thumbnails

**Brand Integration:** Small Army seal in top-left of header, official color accents used sparingly for CTAs and status indicators.