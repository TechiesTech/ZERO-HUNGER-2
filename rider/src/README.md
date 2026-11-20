# Rider App - File Structure

This directory contains the rider delivery partner application with a clean, modular architecture following industry standards and KISS principles.

## Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── ActiveDeliveryPanel.tsx
│   ├── AuthScreens.tsx           # Login/Register screen wrapper
│   ├── AvailableOrders.tsx
│   ├── DeliveryPhotoModal.tsx
│   ├── HeaderBar.tsx
│   ├── LoginScreen.tsx
│   ├── MapView.tsx
│   ├── RegisterScreen.tsx
│   ├── RiderDashboard.tsx        # Main dashboard component
│   └── StatusBanner.tsx
├── context/             # React Context for state management
│   └── RiderContext.tsx           # Global rider state (user, orders, delivery)
├── hooks/               # Custom React hooks (business logic)
│   ├── useAuth.ts                 # Authentication logic
│   ├── useOnlineToggle.ts         # Online/offline toggle logic
│   ├── useOrders.ts               # Order fetching and management
│   └── useRiderLocation.ts        # GPS/location tracking
├── services/            # API service layer
│   ├── apiClient.ts               # Base API client
│   └── riderService.ts            # Rider-specific API calls
├── types/               # TypeScript type definitions
│   └── rider.ts                   # Rider-related types
├── App.tsx              # Main app component (entry point)
├── main.tsx             # React entry point
└── index.css            # Global styles
```

## Code Philosophy: KISS (Keep It Simple, Stupid)

### 1. **Logic First, Then UI**
Each file separates business logic from UI rendering:
- Helper functions at the top (pure functions)
- Hook/composition logic in the middle
- UI render at the bottom

Example from `useAuth.ts`:
```typescript
// Helper functions (pure logic)
const hasActiveSession = () => localStorage.getItem('rider_session') === 'true';
const getStoredOnlineStatus = () => localStorage.getItem('rider_online') === 'true';
const clearSession = () => { /* ... */ };

// Hook logic
export const useAuth = () => {
  // Uses helper functions
};
```

### 2. **Clear Function Names**
Functions describe exactly what they do:
- `hasActiveSession()` - returns boolean
- `getStoredOnlineStatus()` - returns status
- `clearSession()` - clears storage
- `restoreOnlineStatus()` - restores from API/storage

### 3. **No Code Duplication**
Common patterns extracted into reusable helpers:
- Storage operations in helper functions
- Error handling in catch blocks
- State updates in centralized functions

### 4. **Single Responsibility**
Each file does one thing well:
- `useAuth.ts` - Only auth checking and logout
- `useOrders.ts` - Only order operations
- `useOnlineToggle.ts` - Only online/offline toggle
- `AuthScreens.tsx` - Only auth screen switching

### 5. **Organized Component Structure**
In `RiderDashboard.tsx`:
```typescript
// State from context
// Hooks
// Local state

// ============ Handlers ============
// All event handlers grouped together

// ============ Render Helpers ============
// Pure functions for render logic

// ============ Render ============
// JSX return statement
```

## Architecture Principles

### Separation of Concerns
- **Components**: Pure UI rendering, no business logic
- **Hooks**: Business logic and state management
- **Services**: API communication
- **Context**: Global state sharing

### Component Composition
- `App.tsx` - Routes between auth and dashboard
- `AuthScreens.tsx` - Wraps login/register
- `RiderDashboard.tsx` - Main dashboard with map, orders, delivery

## Benefits

1. **Maintainability**: Easy to locate and modify specific functionality
2. **Testability**: Hooks and services can be tested independently
3. **Scalability**: Easy to add new features without modifying existing code
4. **Readability**: Smaller files with clear structure
5. **Collaboration**: Multiple developers can work on different files simultaneously

## Best Practices Used

- ✅ KISS principle - simple, clear functions
- ✅ Logic first, then UI
- ✅ Helper functions for common operations
- ✅ No code duplication
- ✅ Clear, descriptive function names
- ✅ Single responsibility per file
- ✅ Context API for global state
- ✅ Custom hooks for reusable logic
- ✅ TypeScript for type safety
- ✅ Clean file naming (PascalCase for components, camelCase for hooks)
- ✅ Service layer for API calls
