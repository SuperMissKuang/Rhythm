# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native/Expo mobile application called "Rhythm" - a period and self-care tracking app. The app uses Expo Router for navigation, React Query for data management, and Zustand for state management.

## Development Commands

**Install dependencies:**
```bash
npm install
```

**Apply patches (automatically runs after install):**
```bash
npm run postinstall
```

**Start development server:**
```bash
npx expo start
```

**Development platforms:**
- Web: `npx expo start --web`
- iOS: `npx expo start --ios` 
- Android: `npx expo start --android`

## Architecture

### Core Structure
- **`src/app/`** - App routes using Expo Router file-based routing
  - `(tabs)/` - Tab-based navigation layout
  - `_layout.jsx` - Root layout with auth, query client, and splash screen
- **`src/components/`** - Reusable UI components organized by feature
- **`src/utils/`** - Utility functions, hooks, and services

### Key Features
- **Authentication**: Custom auth system in `src/utils/auth/`
- **Data Management**: React Query with 5-minute stale time, 30-minute cache
- **Navigation**: Expo Router with tab-based structure
- **State Management**: Zustand stores, React Query for server state
- **Styling**: Global CSS with theme utilities

### Component Organization
Components are organized by feature areas:
- `Today/` - Main dashboard and timeline
- `Pattern/` - Cycle tracking and calendar views  
- `SelfCare/` - Activity tracking and timing
- `More/` - Settings and additional features
- `Insight/` - Analytics and educational content

### Cross-Platform Support
- Web polyfills in `polyfills/web/` for native features
- Native-specific code in `polyfills/native/`
- Shared polyfills in `polyfills/shared/`

### Data Flow
- Authentication state managed via Zustand store
- Server data via React Query with optimistic updates
- Local data persistence using Expo SecureStore and AsyncStorage

## Key Dependencies

**Core Framework:**
- Expo 53.x with React Native 0.79.3
- React 19.x with TypeScript support

**Navigation & State:**
- `expo-router` - File-based navigation
- `@tanstack/react-query` - Server state management  
- `zustand` - Client state management

**UI & Animation:**
- `react-native-reanimated` - Animations
- `moti` - Animation library
- `@gorhom/bottom-sheet` - Bottom sheet modals
- `lucide-react-native` - Icons

**Data & Storage:**
- `expo-secure-store` - Secure local storage
- `@react-native-async-storage/async-storage` - App data storage
- `date-fns` - Date manipulation

## Path Aliases

The project uses `@/*` aliases for clean imports:
```typescript
import { useAuth } from "@/utils/auth/useAuth";
```

## Development Notes

- The app supports both mobile and web platforms
- Uses patches for specific dependency fixes (see `patches/` directory)
- Authentication is required before showing main content
- Splash screen is handled via Expo SplashScreen API
- Error boundaries wrap the entire app for crash protection