# Firebase Authentication Integration

## Overview
Complete Firebase Authentication integration with Email/Password and Google Sign-In providers. All authentication logic is cleanly separated from UI components.

## Folder Structure

```
Ontrackr/
├── backend/
│   └── auth/
│       ├── authService.ts       # Core authentication functions
│       ├── authContext.tsx      # Auth state management & provider
│       └── authHelpers.ts       # Validation utilities
├── components/
│   └── auth/
│       └── ProtectedRoute.tsx   # Route protection wrapper
├── app/
│   ├── layout.tsx               # Root layout with AuthProvider
│   ├── page.tsx                 # Home page with auth redirect
│   └── auth/
│       ├── login/page.tsx       # Login page (Firebase connected)
│       └── signup/page.tsx      # Signup page (Firebase connected)
└── lib/
    └── firebase.ts              # Firebase initialization
```

## Backend Services

### authService.ts
Core authentication functions:
- `signUpWithEmail(data)` - Create new user with email/password
- `signInWithEmail(data)` - Sign in existing user
- `signInWithGoogle()` - Google OAuth sign-in
- `logout()` - Sign out current user
- `getCurrentUser()` - Get current authenticated user
- `handleAuthError(error)` - Error handling and user-friendly messages

### authContext.tsx
React Context for auth state:
- `AuthProvider` - Wraps app to provide auth state
- `useAuth()` - Hook to access current user and loading state
- Listens to Firebase auth state changes automatically

### authHelpers.ts
Validation utilities:
- `validateEmail(email)` - Email format validation
- `validatePassword(password)` - Password strength validation
- `validateFullName(name)` - Name validation

## UI Integration

### Login Page
- Email/password authentication
- Google Sign-In
- Error handling with user-friendly messages
- Loading states
- Auto-redirect to /projects on success

### Signup Page
- Email/password registration
- Google Sign-In
- Full name collection
- Terms acceptance checkbox
- Form validation
- Error handling
- Auto-redirect to /projects on success

### Header Component
- Displays current user info (name, email)
- Real logout functionality
- Dropdown menu with logout option

### Protected Routes
- `ProtectedRoute` component wraps authenticated pages
- Auto-redirects to /auth/login if not authenticated
- Shows loading spinner during auth check
- Integrated into DashboardLayout

### Home Page
- Checks auth state on load
- Redirects authenticated users to /projects
- Redirects unauthenticated users to /auth/login

## Authentication Flow

### Sign Up Flow
1. User enters name, email, password
2. Form validates inputs
3. Calls `authService.signUpWithEmail()`
4. Creates Firebase user account
5. Sets displayName to provided full name
6. Auto-redirects to /projects
7. Error displayed if registration fails

### Sign In Flow
1. User enters email, password
2. Form validates inputs
3. Calls `authService.signInWithEmail()`
4. Authenticates with Firebase
5. Auto-redirects to /projects
6. Error displayed if login fails

### Google Sign-In Flow
1. User clicks Google button
2. Opens Google OAuth popup
3. User selects Google account
4. Firebase creates/signs in user
5. Auto-redirects to /projects
6. Error displayed if cancelled or fails

### Logout Flow
1. User clicks logout in header menu
2. Calls `authService.logout()`
3. Firebase signs out user
4. Auth context updates to null
5. Protected routes redirect to /auth/login

## Error Handling

All Firebase errors are mapped to user-friendly messages:
- `auth/email-already-in-use` → "This email is already registered"
- `auth/weak-password` → "Password should be at least 6 characters"
- `auth/invalid-email` → "Invalid email address"
- `auth/user-not-found` → "No account found with this email"
- `auth/wrong-password` → "Incorrect password"
- `auth/too-many-requests` → "Too many attempts. Please try again later"
- `auth/network-request-failed` → "Network error. Please check your connection"
- `auth/popup-closed-by-user` → "Sign-in popup was closed"

## TypeScript Types

All auth functions are strictly typed:
```typescript
interface SignUpData {
  email: string;
  password: string;
  fullName: string;
}

interface SignInData {
  email: string;
  password: string;
}

interface AuthError {
  code: string;
  message: string;
}
```

## State Management

Auth state is managed via React Context:
- Single source of truth for current user
- Automatically syncs with Firebase auth state
- Available throughout app via `useAuth()` hook
- Loading state prevents flash of wrong content

## Security Features

- Client-side validation before API calls
- Firebase security rules control backend access
- Protected routes prevent unauthorized access
- Secure password requirements (6+ characters)
- OAuth handled securely by Firebase
- Auto-logout on session expiration

## Production Ready

- No mock data or placeholder auth logic
- Clean separation of concerns
- Proper error handling and user feedback
- Loading states for better UX
- TypeScript strict typing
- Follows Next.js App Router best practices
- Respects client/server boundaries

## Environment Variables

All Firebase credentials stored in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```
