# Frontend Architecture

This document describes the feature-based architecture of the Smart Mill Scale frontend application.

## Architecture Overview

The frontend follows a **feature-based architecture** pattern, where code is organized by feature/domain rather than by technical layer. This approach provides better modularity, scalability, and maintainability.

## Directory Structure

```
src/
├── features/               # Feature modules (domain-driven)
│   ├── auth/              # Authentication & Authorization
│   │   ├── components/    # Auth-specific components
│   │   ├── hooks/         # Auth-specific hooks
│   │   ├── pages/         # Auth pages (Login, Setup, etc.)
│   │   ├── store/         # Auth state management (Zustand)
│   │   ├── utils/         # Auth utility functions
│   │   └── index.js       # Barrel exports
│   │
│   ├── weighing/          # Weighing/Scale functionality
│   │   ├── components/    # Weighing components
│   │   ├── hooks/         # Weighing hooks
│   │   ├── store/         # Weighing state management
│   │   └── index.js       # Barrel exports
│   │
│   ├── dashboard/         # Dashboard & Analytics
│   │   ├── components/    # Dashboard components
│   │   ├── hooks/         # Dashboard hooks
│   │   ├── store/         # Dashboard state
│   │   └── index.js       # Barrel exports
│   │
│   ├── user-management/   # User Management
│   │   ├── components/    # User management components
│   │   ├── pages/         # User management pages
│   │   └── index.js       # Barrel exports
│   │
│   └── audit/             # Audit Log
│       ├── components/    # Audit components
│       ├── pages/         # Audit pages
│       └── index.js       # Barrel exports
│
├── shared/                # Shared/Common code
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Reusable custom hooks
│   ├── utils/             # Utility functions
│   ├── constants/         # Application constants
│   ├── types/             # TypeScript types (future)
│   └── index.js           # Barrel exports
│
├── config/                # Application configuration
│   └── app.config.js      # Centralized config
│
├── lib/                   # External library wrappers
│   └── wails.js           # Wails bindings wrapper
│
├── App.jsx                # Root component
├── main.jsx               # Application entry point
└── index.css              # Global styles
```

## Design Principles

### 1. Feature-Based Organization
- Code is organized by **feature/domain** rather than technical type
- Each feature is self-contained with its own components, hooks, and state
- Features can be developed, tested, and maintained independently

### 2. Separation of Concerns
- **Components**: UI presentation and user interaction
- **Hooks**: Reusable logic and side effects
- **Store**: State management (Zustand)
- **Utils**: Pure utility functions
- **Constants**: Configuration and constants

### 3. Barrel Exports
- Each feature/module exports through an `index.js` file
- Enables clean imports: `import { LoginPage } from './features/auth'`
- Provides a clear public API for each module

### 4. Shared Code
- Common components, hooks, and utilities in `shared/`
- Prevents duplication across features
- Promotes reusability

## Import Patterns

### Feature Imports
```javascript
// Good - Clean barrel imports
import { LoginPage, LockScreen, useAuthStore } from './features/auth'
import { WeighingPanel, useWeighingStore } from './features/weighing'

// Bad - Direct file imports
import LoginPage from './features/auth/pages/LoginPage'
import LockScreen from './features/auth/components/LockScreen'
```

### Shared Imports
```javascript
// Import shared components, utils, constants
import { Notification, UserBadge, formatDate, USER_ROLES } from './shared'

// Or specific imports
import { formatDate, formatWeight } from './shared/utils'
import { USER_ROLES, hasPermission } from './shared/constants'
```

### Configuration Imports
```javascript
import { APP_CONFIG } from './config/app.config'
import { wails } from './lib/wails'
```

## State Management

### Zustand Stores
Each feature can have its own Zustand store for local state:
- `features/auth/store/useAuthStore.js` - Authentication state
- `features/weighing/store/useWeighingStore.js` - Weighing data state

### Store Structure
```javascript
// Example store structure
const useFeatureStore = create((set, get) => ({
  // State
  data: null,
  isLoading: false,
  error: null,

  // Actions
  setData: (data) => set({ data }),
  setLoading: (loading) => set({ isLoading: loading }),

  // Async actions
  fetchData: async () => {
    set({ isLoading: true })
    try {
      const result = await api.getData()
      set({ data: result, error: null })
    } catch (error) {
      set({ error: error.message })
    } finally {
      set({ isLoading: false })
    }
  }
}))
```

## Custom Hooks

### Feature-Specific Hooks
Located in `features/{feature}/hooks/`
- Encapsulate feature-specific logic
- Can use feature store internally

### Shared Hooks
Located in `shared/hooks/`
- `useActivityTracker` - Track user activity
- `useInterval` - Managed intervals with cleanup

### Hook Naming Convention
- Prefix with `use` (React convention)
- Descriptive names: `useAuthSession`, `useWeighingData`

## Component Patterns

### Component Types

1. **Page Components** (`pages/`)
   - Top-level route components
   - Compose smaller components
   - Handle page-level logic

2. **Feature Components** (`features/{feature}/components/`)
   - Feature-specific UI components
   - Use feature store and hooks
   - Can be complex/stateful

3. **Shared Components** (`shared/components/`)
   - Reusable across features
   - Generic and configurable
   - Usually presentational

### Component Structure Example
```javascript
// Feature component
import { useFeatureStore } from '../store/useFeatureStore'
import { useFeatureHook } from '../hooks/useFeatureHook'

export const FeatureComponent = () => {
  const { data, fetchData } = useFeatureStore()
  const { handleAction } = useFeatureHook()

  return (
    // JSX
  )
}
```

## Configuration Management

### Centralized Config
All application configuration in `config/app.config.js`:
- Session timeouts
- Polling intervals
- Feature flags
- API settings

### Usage
```javascript
import { APP_CONFIG } from './config/app.config'

const timeout = APP_CONFIG.session.timeout
const pollInterval = APP_CONFIG.polling.weight
```

## Constants Management

### Role Constants
```javascript
import { USER_ROLES, hasRole, hasPermission } from './shared/constants'

if (hasRole(user.role, USER_ROLES.ADMIN)) {
  // Admin-only logic
}
```

### Sync Status
```javascript
import { SYNC_STATUS, SYNC_STATUS_LABELS } from './shared/constants'

const label = SYNC_STATUS_LABELS[status]
```

## Utilities

### Formatters (`shared/utils/formatters.js`)
- `formatWeight(weight, unit)` - Format weight values
- `formatDate(date, includeTime)` - Format dates
- `formatRelativeTime(date)` - Relative time ("2 menit yang lalu")
- `formatVehicleNumber(number)` - Format vehicle numbers
- `formatPercentage(value, total)` - Calculate percentages

### Validators (`shared/utils/validators.js`)
- `isValidEmail(email)` - Email validation
- `validatePassword(password)` - Password strength validation
- `validateUsername(username)` - Username format validation
- `isValidVehicleNumber(number)` - Vehicle number validation
- `validateWeight(weight)` - Weight value validation

## Best Practices

### 1. Feature Independence
- Features should be as independent as possible
- Minimize cross-feature dependencies
- Share code through `shared/` when needed

### 2. Single Responsibility
- Each file/component has a single, clear purpose
- Separation of concerns between UI and logic

### 3. Consistent Naming
- Use descriptive, consistent names
- Follow established patterns
- PascalCase for components, camelCase for functions

### 4. Export Strategy
- Use barrel exports for public APIs
- Keep internal implementation details private
- Export only what's needed

### 5. State Management
- Use Zustand for global/feature state
- Use React state for local component state
- Derive state when possible

### 6. Code Reusability
- Extract common logic to hooks
- Create shared components for reusable UI
- Use utility functions for common operations

## Adding New Features

To add a new feature:

1. Create feature directory structure:
   ```bash
   mkdir -p features/new-feature/{components,hooks,store,pages,utils}
   ```

2. Create barrel export (`features/new-feature/index.js`):
   ```javascript
   export { default as FeatureComponent } from './components/FeatureComponent'
   export { default as useFeatureStore } from './store/useFeatureStore'
   ```

3. Implement components, hooks, and store as needed

4. Import in App.jsx:
   ```javascript
   import { FeatureComponent } from './features/new-feature'
   ```

## Migration from Old Structure

The old flat structure has been migrated to this feature-based architecture:

| Old Location | New Location |
|-------------|-------------|
| `components/LockScreen.jsx` | `features/auth/components/LockScreen.jsx` |
| `pages/LoginPage.jsx` | `features/auth/pages/LoginPage.jsx` |
| `store/useAuthStore.js` | `features/auth/store/useAuthStore.js` |
| `components/WeighingPanel.jsx` | `features/weighing/components/WeighingPanel.jsx` |
| `store/useWeighingStore.js` | `features/weighing/store/useWeighingStore.js` |
| `components/Notification.jsx` | `shared/components/Notification.jsx` |

All imports have been updated in `App.jsx` to use the new structure.

## Future Enhancements

1. **TypeScript Migration**
   - Add type definitions to `shared/types/`
   - Gradual migration from .jsx to .tsx

2. **Testing Structure**
   - Add `__tests__` folders in each feature
   - Feature-specific test utilities

3. **API Layer**
   - Add `features/{feature}/api/` for API calls
   - Centralized API client in `lib/`

4. **Routing**
   - Implement React Router
   - Route definitions in each feature

5. **Code Splitting**
   - Lazy load features
   - Optimize bundle size

## Resources

- [React Documentation](https://react.dev)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
