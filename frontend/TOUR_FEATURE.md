# User Onboarding Tour Feature

## Overview
The JobEdge application now includes an interactive guided tour for first-time users. This tour helps new users understand how to:
1. Create their master profile/resume
2. Create their first job application

## Technology
- **Library**: [react-joyride](https://react-joyride.com/) v2.9.3
- **Framework**: React + TypeScript

## How It Works

### Automatic Tour Triggering
The tour automatically starts when:
- A user logs in for the first time
- The user has not yet created a master profile/resume
- The user has not previously completed or skipped the tour

### Tour Flow
1. **Home Page Tour**
   - Welcome message introducing JobEdge
   - Explanation of the dashboard
   - Guidance to create a master profile

2. **Applications Page Tour** (after profile creation)
   - Congratulations message
   - Introduction to the Applications page
   - Guidance to create the first job application

### Tour Persistence
The tour state is stored in `localStorage` using the user's ID as a key:
- `tour_completed_{userId}`: Tracks if the user has completed/skipped the tour
- `tour_stage_{userId}`: Tracks the current stage (home or applications)

### Manual Tour Control
Users can restart the tour at any time from:
- **Settings Page** → "Getting Started Tour" section → "Restart Tour" button

## Implementation Details

### Key Components

#### 1. TourContext (`/frontend/src/context/TourContext.tsx`)
Manages the global tour state:
- `run`: Whether the tour is currently running
- `stepIndex`: Current step in the tour
- `tourActive`: Whether any tour is active
- `startTour()`: Manually start the tour
- `stopTour()`: Stop and mark tour as completed
- `resetTour()`: Clear tour completion state
- `navigateToApplications()`: Transition between tour stages

#### 2. Tour Configuration (`/frontend/src/utils/tourConfig.ts`)
Defines:
- `homeTourSteps`: Steps for the Home page tour
- `applicationsTourSteps`: Steps for the Applications page tour
- `tourStyles`: Custom styling for the tour tooltips
- `tourLocale`: Custom button labels

#### 3. Integration Points
- **Home.tsx**: Displays tour steps for profile creation
- **Applications.tsx**: Displays tour steps for creating applications
- **Settings.tsx**: Provides tour restart functionality

### Component Loading Strategy
To ensure tour elements are available before Joyride searches for them:
- Each component sets a `componentLoaded` state after data is fetched
- The Joyride component only renders when `componentLoaded === true`
- Tour starts with a 1-second delay to allow DOM rendering

### Tour Steps Configuration

#### Home Page Steps
1. Welcome message (center overlay)
2. Dashboard overview (target: `.home-welcome-section`)
3. Create profile button (target: `#create-profile-btn`)

#### Applications Page Steps
1. Congratulations message (target: `.applications-header`)
2. New application button (target: `#new-application-btn`)

## Customization

### Styling
The tour uses custom styling defined in `tourConfig.ts`:
- Primary color: `#7c3aed` (purple-600)
- Overlay: Semi-transparent black
- Tooltip width: 380px
- Custom button styles matching the app theme

### Adding New Steps
To add new tour steps:

1. Edit `/frontend/src/utils/tourConfig.ts`
2. Add new step objects to the appropriate array:
```typescript
{
  target: '#element-id',
  content: 'Step description',
  placement: 'bottom',
}
```

3. Ensure the target element has the corresponding ID or class

### Modifying Tour Behavior
Edit `/frontend/src/context/TourContext.tsx` to:
- Change when the tour triggers
- Add new tour stages
- Modify navigation logic

## Testing

### Manual Testing Checklist
1. **First-time user flow**:
   - Create a new account
   - Login and verify tour starts automatically
   - Complete tour steps and verify persistence

2. **Skip functionality**:
   - Start tour
   - Click "Skip Tour"
   - Verify tour doesn't restart on page reload

3. **Restart functionality**:
   - Go to Settings page
   - Click "Restart Tour"
   - Verify tour starts from the beginning

4. **Navigation flow**:
   - Complete Home page tour
   - Create a master profile
   - Verify tour continues on Applications page

## Browser Compatibility
The tour works in all modern browsers that support:
- localStorage
- ES6+ JavaScript
- React 18+

## Performance Considerations
- Tour state is stored in localStorage (minimal overhead)
- Joyride is only loaded when needed
- Components wait for data before rendering tour
- No performance impact when tour is not active

## Future Enhancements
Potential improvements:
- Add more tour stages for other features
- Multi-language support
- Analytics tracking for tour completion rates
- Video or GIF demonstrations in tour steps
- Contextual help tooltips for advanced features
