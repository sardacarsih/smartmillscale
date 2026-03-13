# User Management - Material UI Rebuild

Complete rebuild of the User Management system with Modern Material Design, enhanced features, and improved UX.

## 🎨 What's New

### Backend Enhancements
- ✅ **User Self-Service**: Users can update their own profile (name, email)
- ✅ **CSV Export**: Export all users to CSV file
- ✅ **CSV Import**: Bulk import users from CSV with validation
- ✅ **Password Policy**: Configurable password strength requirements
- ✅ **Enhanced Security**: All operations properly logged and validated

### Frontend Features
- ✅ **Material UI DataGrid**: Fast, sortable, filterable table with virtual scrolling
- ✅ **Modern Dark Theme**: Professional Material Design dark theme
- ✅ **Stepper Wizard**: Multi-step user creation with validation
- ✅ **Password Strength Indicator**: Real-time password validation feedback
- ✅ **Bulk Operations**: Select and delete multiple users at once
- ✅ **Export/Import Dialog**: Tabbed interface for CSV operations
- ✅ **Self-Service Dialogs**: Profile editing and password change
- ✅ **Responsive Design**: Works on all screen sizes
- ✅ **Keyboard Shortcuts Ready**: Prepared for future enhancements

## 🚀 Quick Start

### 1. Import the new component in your App

```javascript
import { UserManagementMUI } from './features/user-management/indexMUI'

// In your router or main component:
<UserManagementMUI
  onBack={() => navigate('/dashboard')}
  currentSession={currentSession}
/>
```

### 2. Required Props

- `onBack`: Function to call when user clicks back button
- `currentSession`: Current user session object with fields:
  - `userId`: User ID
  - `username`: Username
  - `fullName`: Full name
  - `email`: Email (optional)
  - `role`: User role

### 3. Wails Bindings Required

The following methods must be exposed in your `app.go`:

```go
// Core CRUD
GetAllUsers() ([]map[string]interface{}, error)
CreateUser(username, password, email, fullName, role string) (map[string]interface{}, error)
UpdateUser(userID, fullName, email, role, isActive string) (map[string]interface{}, error)
DeleteUser(userID string) (map[string]interface{}, error)
ResetUserPassword(userID, newPassword string) (map[string]interface{}, error)

// Self-Service (NEW)
UpdateOwnProfile(fullName, email string) (map[string]interface{}, error)
ChangePassword(oldPassword, newPassword string) (map[string]interface{}, error)

// CSV Operations (NEW)
ExportUsersToCSV(includeInactive bool) (map[string]interface{}, error)
ImportUsersFromCSV(csvData string) (map[string]interface{}, error)

// Bulk Operations
BulkDeleteUsers(userIDs []string) (map[string]interface{}, error)
```

## 📋 CSV Import Format

When importing users, use this CSV format:

```csv
Username,Full Name,Email,Role,Password
johndoe,John Doe,john@example.com,TIMBANGAN,Password123
janedoe,Jane Doe,jane@example.com,SUPERVISOR,SecurePass456
```

**Required columns:**
- Username (unique)
- Full Name
- Role (ADMIN, SUPERVISOR, TIMBANGAN, GRADING)
- Password (min 8 chars, must have letter + number)

**Optional columns:**
- Email

## 🎯 Features Guide

### Admin Features

1. **Create User**
   - Click "Buat User" button or FAB (+ button bottom-right)
   - Follow 3-step wizard: Basic Info → Credentials → Review
   - Password strength validated in real-time

2. **Edit User**
   - Click edit icon (pencil) on user row
   - Update name, email, role, or active status
   - Cannot change username (security)

3. **Delete User**
   - Click delete icon (trash) on user row
   - Confirm deletion in dialog
   - User is soft-deleted (can be restored)

4. **Reset Password**
   - Click key icon on user row
   - Auto-generates secure random password
   - Password shown once (copy it!)
   - User must change on next login

5. **Bulk Delete**
   - Select multiple users with checkboxes
   - Click "Hapus (N)" button in toolbar
   - Confirm bulk deletion

6. **Export Users**
   - Click "Export / Import" button
   - Go to Export tab
   - Choose to include inactive users
   - Click "Export CSV"
   - File downloads automatically

7. **Import Users**
   - Click "Export / Import" button
   - Go to Import tab
   - Click "Pilih File CSV"
   - Select your CSV file
   - Click "Import CSV"
   - Review results (success/failure per row)

### User Self-Service Features

1. **Edit Own Profile**
   - Click profile icon in top-right
   - Update your full name or email
   - Cannot change username or role

2. **Change Password**
   - Click key icon in top-right
   - Enter old password
   - Enter new password (with strength indicator)
   - Confirm new password
   - Auto-logout after change (must re-login)

## 🎨 Customization

### Theme Colors

Edit `theme.js` to customize colors:

```javascript
primary: {
  main: '#3b82f6', // Change to your brand color
}
```

### Password Policy

Backend password policy can be adjusted in `desktop-app/internal/auth/models.go`:

```go
func GetDefaultPasswordPolicy() PasswordPolicy {
  return PasswordPolicy{
    MinLength:      8,     // Change minimum length
    RequireLetter:  true,  // Require letters
    RequireNumber:  true,  // Require numbers
    RequireSpecial: false, // Require special chars (optional)
    RequireUpper:   false, // Require uppercase (optional)
    RequireLower:   false, // Require lowercase (optional)
  }
}
```

## 🐛 Troubleshooting

### "Wails Environment Required" Error
- Make sure you're running with `wails dev`
- Check that `window.go.main.App` is available
- Verify all required methods are exposed in `app.go`

### CSV Import Fails
- Check CSV format matches template
- Ensure headers are exactly: Username, Full Name, Email, Role, Password
- Verify role values are uppercase: ADMIN, SUPERVISOR, TIMBANGAN, GRADING
- Check for special characters in usernames (only alphanumeric, _, -)

### DataGrid Not Showing Data
- Check browser console for errors
- Verify `GetAllUsers()` returns data with `id` field
- Ensure data structure matches expected format

### Password Validation Errors
- Password must be at least 8 characters
- Must contain at least 1 letter
- Must contain at least 1 number
- Check backend password policy configuration

## 📦 Files Structure

```
user-management/
├── pages/
│   └── UserManagementMUI.jsx          # Main page
├── components/
│   ├── UserDataGrid.jsx               # Material DataGrid
│   ├── CreateUserDialogMUI.jsx        # Create user wizard
│   ├── EditUserDialogMUI.jsx          # Edit user dialog
│   ├── UserProfileDialogMUI.jsx       # Self-service profile
│   ├── PasswordChangeDialogMUI.jsx    # Password change
│   └── ExportImportDialogMUI.jsx      # CSV export/import
├── store/
│   └── useUserManagementStoreMUI.js   # Zustand state management
├── theme.js                            # Material UI theme
├── indexMUI.js                         # Exports
└── README_MUI.md                       # This file
```

## 🔒 Security Notes

- All admin operations require ADMIN role
- Passwords are hashed with bcrypt (cost factor 12)
- Audit logs track all user changes
- Cannot delete last admin user
- Cannot delete own account
- SQL injection prevented with parameterized queries
- Password strength enforced on creation

## 🚀 Performance

- DataGrid uses virtual scrolling (handles 1000+ users)
- Optimized re-renders with proper React patterns
- Efficient Zustand state management
- No unnecessary API calls
- Debounced search (if implemented)

## 📝 Future Enhancements

Potential additions:
- [ ] Advanced filtering (by date range, multiple roles)
- [ ] Saved filter presets
- [ ] Column visibility toggle
- [ ] Keyboard shortcuts (Ctrl+N for new user, Ctrl+F for search)
- [ ] User avatar upload
- [ ] 2FA/TOTP support
- [ ] Session management (view active sessions)
- [ ] Activity analytics dashboard
- [ ] User impersonation for debugging
- [ ] Role permission builder

## 💡 Tips

1. **Keyboard Navigation**: Tab through form fields for faster data entry
2. **Bulk Operations**: Select multiple users to delete them at once
3. **Export Before Changes**: Always export before bulk operations
4. **Password Manager**: Use the reset password feature and give users their password to save in a password manager
5. **Regular Exports**: Schedule regular CSV exports for backup

## 🤝 Support

For issues or questions:
1. Check this README first
2. Review browser console for errors
3. Check Wails backend logs
4. Verify database connection
5. Test with `wails dev` (not production build)

---

**Built with ❤️ using React 18, Material UI 5, Zustand, and Wails v2**
