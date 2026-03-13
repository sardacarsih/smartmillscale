# User Management Module

Enhanced user management system with comprehensive CRUD operations, pagination, search, filtering, and bulk operations.

## Features

### Core Functionality
- **CRUD Operations**: Create, Read, Update, Delete users
- **Pagination**: Efficient data loading with customizable page sizes
- **Search**: Real-time search across username, full name, and email
- **Filtering**: Filter by role, status, and date ranges
- **Sorting**: Sort by any field with ascending/descending order
- **Bulk Operations**: Update or delete multiple users at once

### Advanced Features
- **User Statistics**: Dashboard with key metrics
- **User Activity**: View audit logs and login history
- **Password Management**: Reset passwords with strength validation
- **Role-Based Access Control**: Secure authorization checks
- **Real-time Updates**: Live data synchronization
- **Offline Support**: Works with enhanced mock fallbacks

### UI/UX Features
- **Responsive Design**: Works on desktop and mobile
- **Dark Theme**: Consistent with app design
- **Loading States**: Smooth loading indicators
- **Error Handling**: Comprehensive error messages
- **Success Notifications**: Confirmation for all actions
- **Keyboard Navigation**: Full keyboard accessibility

## Architecture

### Backend (Go)
```
desktop-app/internal/auth/
├── service.go          # Enhanced business logic
├── models.go           # Database models
└── validation.go       # Input validation

desktop-app/app.go      # Wails bindings
```

### Frontend (React)
```
frontend/src/features/user-management/
├── pages/
│   ├── UserManagement.jsx           # Legacy component
│   └── UserManagementEnhanced.jsx   # Enhanced component
├── components/
│   ├── UserStatsCard.jsx           # Statistics cards
│   ├── UserFilters.jsx             # Filter panel
│   ├── UserTable.jsx               # Data table
│   ├── PaginationControls.jsx      # Pagination
│   ├── BulkOperations.jsx          # Bulk actions
│   └── CreateUserModal.jsx         # Create user form
├── store/
│   └── useUserManagementStore.js   # Zustand state management
├── utils/
│   ├── validation.js               # Form validation
│   └── errorHandling.js            # Error utilities
└── index.js                        # Exports
```

## Usage

### Basic Usage
```jsx
import UserManagementEnhanced from '@/features/user-management';

function Dashboard() {
  return (
    <UserManagementEnhanced onBack={() => navigate('/dashboard')} />
  );
}
```

### Using Store Directly
```jsx
import { useUserManagementStore } from '@/features/user-management';

function UserStats() {
  const { stats, loadStats } = useUserManagementStore();

  useEffect(() => {
    loadStats(wails.GetUserStats);
  }, []);

  return <div>{stats.totalUsers} users</div>;
}
```

### Validation Utilities
```jsx
import { validateUserCreation, validatePassword } from '@/features/user-management';

const errors = validateUserCreation({
  username: 'john_doe',
  fullName: 'John Doe',
  email: 'john@example.com',
  password: 'SecurePass123',
  role: 'TIMBANGAN'
});
```

## API Reference

### Backend Methods

#### User CRUD
- `GetUsersPaginated(page, pageSize, search, role, isActive, sortBy, sortOrder)`
- `GetUserStats()`
- `CreateUser(username, password, email, fullName, role)`
- `UpdateUser(userID, fullName, email, role, isActive)`
- `DeleteUser(userID)`
- `ResetUserPassword(userID, newPassword)`

#### Advanced Operations
- `GetUserActivity(userID, limit)`
- `BulkUpdateUsers(userIDs, updates)`
- `BulkDeleteUsers(userIDs)`

### Frontend Store

#### State
```javascript
{
  users: [],                    // Array of users
  pagination: {},               // Pagination info
  filters: {},                  // Current filters
  selectedUsers: [],            // Selected user IDs
  isLoading: false,             // Loading states
  error: null,                  // Error messages
  successMessage: null,         // Success messages
  stats: {}                     // User statistics
}
```

#### Actions
- `loadUsers()` - Load users with current filters
- `createUser(userData)` - Create new user
- `updateUser(userID, userData)` - Update existing user
- `deleteUser(userID)` - Delete user
- `searchUsers(searchTerm)` - Search users
- `applyFilters(filters)` - Apply filters
- `bulkUpdateUsers(updates)` - Bulk update
- `bulkDeleteUsers()` - Bulk delete

## Validation Rules

### Username
- Required: Yes
- Length: 3-50 characters
- Format: Letters, numbers, underscore, dash
- Must start with letter

### Full Name
- Required: Yes
- Length: 2-100 characters
- Format: Letters, spaces, basic punctuation

### Email
- Required: No
- Format: Valid email address
- Length: Max 100 characters

### Password
- Required: Yes (for new users)
- Length: Min 6 characters
- Complexity: Must contain uppercase, lowercase, and numbers
- Additional: No repeated characters, no common patterns

### Role
- Required: Yes
- Values: ADMIN, SUPERVISOR, TIMBANGAN, GRADING

## Error Handling

### Error Types
- `NETWORK_ERROR` - Connection issues
- `VALIDATION_ERROR` - Invalid input
- `AUTHORIZATION_ERROR` - Permission denied
- `NOT_FOUND_ERROR` - Resource not found
- `CONFLICT_ERROR` - Data conflicts
- `SERVER_ERROR` - Server issues

### Error Recovery
- Automatic retry for network errors
- Clear error messages for validation issues
- Graceful degradation for missing permissions
- Fallback to mock data in development

## Testing

### Unit Tests
```bash
# Backend tests
cd desktop-app && go test ./internal/auth/...

# Frontend tests
cd frontend && npm test user-management
```

### Integration Tests
```bash
# Test complete CRUD flow
npm test user-management-integration

# Test error handling
npm test user-management-errors
```

## Performance

### Optimization Features
- **Pagination**: Limits data transfer to 20-100 records per page
- **Debounced Search**: Reduces API calls during typing
- **Memoized Components**: Prevents unnecessary re-renders
- **Virtual Scrolling**: Handles large user lists efficiently
- **Batch Operations**: Reduces individual API calls

### Recommended Limits
- **Page Size**: 20-100 users per page
- **Search Debounce**: 300ms delay
- **Bulk Operations**: Max 100 users per operation
- **Cache Duration**: 5 minutes for user stats

## Security

### Security Features
- **Input Validation**: All inputs validated on client and server
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CSRF Protection**: Token validation
- **Audit Logging**: All operations logged
- **Session Management**: Secure session handling

### Permission Checks
- **Admin Only**: User creation, deletion, role changes
- **Self-Service**: Users can change own password
- **Audit Trail**: All actions tracked with user context

## Development

### Mock Data
The module includes comprehensive mock data for development:
- Realistic user profiles
- Various roles and statuses
- Activity logs
- Pagination simulation

### Development Mode
```jsx
// Enable enhanced mock mode
const mockUsers = generateMockUsers(50);
const mockStats = generateMockStats();
```

### Debugging
```javascript
// Enable debug logging
console.log('User Management Debug:', {
  users: users.length,
  filters: filters,
  pagination: pagination
});
```

## Migration

### From Legacy Component
1. Import `UserManagementEnhanced` instead of `UserManagement`
2. Update any direct API calls to use the store
3. Replace local state with Zustand store
4. Add error handling for new operations

### Breaking Changes
- Store-based state management
- Enhanced validation rules
- New API endpoints
- Updated error handling

## Contributing

### Adding New Features
1. Update backend service in `service.go`
2. Add Wails bindings in `app.go`
3. Update Zustand store methods
4. Create React components
5. Add validation rules
6. Write tests

### Code Style
- Follow existing patterns
- Use TypeScript where possible
- Add comprehensive error handling
- Include loading states
- Write unit tests

## Support

For issues and questions:
1. Check error messages and console logs
2. Verify API connectivity
3. Test with mock data
4. Review validation rules
5. Check permissions and roles