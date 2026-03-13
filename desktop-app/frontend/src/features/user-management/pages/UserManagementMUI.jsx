import React, { useState, useEffect } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import {
  Box,
  Container,
  Typography,
  Button,
  Fab,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stack,
} from '@mui/material'
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  Delete as DeleteIcon,
  AccountCircle,
  VpnKey,
} from '@mui/icons-material'

import userManagementTheme from '../theme'
import useUserManagementStoreMUI from '../store/useUserManagementStoreMUI'
import UserDataGrid from '../components/UserDataGrid'
import CreateUserDialogMUI from '../components/CreateUserDialogMUI'
import EditUserDialogMUI from '../components/EditUserDialogMUI'
import UserProfileDialogMUI from '../components/UserProfileDialogMUI'
import PasswordChangeDialogMUI from '../components/PasswordChangeDialogMUI'
import ExportImportDialogMUI from '../components/ExportImportDialogMUI'
import { Topbar } from '../../../shared'
import { getWailsWrapper } from '../../../shared/lib/wailsWrapper'

const UserManagementMUI = ({ currentUser, wails: wailsProp, onNavigate, onLogout }) => {
  const wails = wailsProp || getWailsWrapper(true)

  const {
    users,
    selectedUsers,
    isLoading,
    error,
    successMessage,
    setSelectedUsers,
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    updateOwnProfile,
    changePassword,
    exportUsers,
    importUsers,
    bulkDeleteUsers,
    clearMessages,
  } = useUserManagementStoreMUI()

  // Modal states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showExportImportDialog, setShowExportImportDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  // Selected item states
  const [selectedUser, setSelectedUser] = useState(null)
  const [resetPasswordResult, setResetPasswordResult] = useState(null)

  // Load users on mount
  useEffect(() => {
    if (wails) {
      loadUsers(wails)
    }
  }, [wails])

  // Require Wails
  if (!wails) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#111827' }}>
        <Alert severity="error">
          <Typography variant="h6">Wails Environment Required</Typography>
          <Typography variant="body2">Please run this application using: wails dev</Typography>
        </Alert>
      </Box>
    )
  }

  // Handlers
  const handleRefresh = () => {
    loadUsers(wails)
  }

  const handleCreate = async (userData) => {
    const success = await createUser(wails, userData)
    if (success) {
      setShowCreateDialog(false)
    }
    return success
  }

  const handleEdit = (user) => {
    setSelectedUser(user)
    setShowEditDialog(true)
  }

  const handleUpdate = async (userID, updates) => {
    const success = await updateUser(wails, userID, updates)
    if (success) {
      setShowEditDialog(false)
      setSelectedUser(null)
    }
    return success
  }

  const handleDeleteClick = (user) => {
    setSelectedUser(user)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (selectedUser) {
      const success = await deleteUser(wails, selectedUser.id)
      if (success) {
        setShowDeleteConfirm(false)
        setSelectedUser(null)
      }
    }
  }

  const handleResetPasswordClick = (user) => {
    setSelectedUser(user)
    setShowResetPasswordConfirm(true)
  }

  const handleResetPasswordConfirm = async () => {
    if (selectedUser) {
      const result = await resetPassword(wails, selectedUser.id)
      if (result.success) {
        setResetPasswordResult(result.password)
        setShowResetPasswordConfirm(false)
        setSelectedUser(null)
      }
    }
  }

  const handleView = (user) => {
    setSelectedUser(user)
    // Could open a details modal here
  }

  const handleUpdateProfile = async (fullName, email) => {
    return await updateOwnProfile(wails, fullName, email)
  }

  const handleChangePassword = async (oldPassword, newPassword) => {
    return await changePassword(wails, oldPassword, newPassword)
  }

  const handleExport = async (includeInactive) => {
    return await exportUsers(wails, includeInactive)
  }

  const handleImport = async (csvData) => {
    return await importUsers(wails, csvData)
  }

  const handleBulkDeleteClick = () => {
    setShowBulkDeleteConfirm(true)
  }

  const handleBulkDeleteConfirm = async () => {
    const success = await bulkDeleteUsers(wails, selectedUsers)
    if (success) {
      setShowBulkDeleteConfirm(false)
    }
  }

  const handleSelectionChange = (newSelection) => {
    setSelectedUsers(newSelection)
  }

  return (
    <ThemeProvider theme={userManagementTheme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Topbar */}
        <Topbar
          title="Smart Mill Scale"
          subtitle="Manajemen Pengguna"
          currentUser={currentUser}
          onLogout={onLogout}
          onNavigate={onNavigate}
        />

        {/* Quick Actions Bar */}
        <Box sx={{ bgcolor: '#1f2937', borderBottom: '1px solid #374151', py: 1, px: 3 }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Tooltip title="Profil Saya">
              <IconButton size="small" onClick={() => setShowProfileDialog(true)} sx={{ color: '#9ca3af' }}>
                <AccountCircle />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ganti Password">
              <IconButton size="small" onClick={() => setShowPasswordDialog(true)} sx={{ color: '#9ca3af' }}>
                <VpnKey />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={handleRefresh} sx={{ color: '#9ca3af' }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Main Content */}
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total User
                  </Typography>
                  <Typography variant="h4">{users.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    User Aktif
                  </Typography>
                  <Typography variant="h4">
                    {users.filter((u) => u.isActive).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Dipilih
                  </Typography>
                  <Typography variant="h4">{selectedUsers.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Admin
                  </Typography>
                  <Typography variant="h4">
                    {users.filter((u) => u.role === 'ADMIN').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateDialog(true)}
            >
              Buat User
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={() => setShowExportImportDialog(true)}
            >
              Export / Import
            </Button>
            {selectedUsers.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleBulkDeleteClick}
              >
                Hapus ({selectedUsers.length})
              </Button>
            )}
          </Box>

          {/* Data Grid */}
          <Card>
            <CardContent>
              <UserDataGrid
                users={users}
                loading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onView={handleView}
                onResetPassword={handleResetPasswordClick}
                selectedUsers={selectedUsers}
                onSelectionChange={handleSelectionChange}
              />
            </CardContent>
          </Card>
        </Container>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setShowCreateDialog(true)}
        >
          <AddIcon />
        </Fab>

        {/* Dialogs */}
        <CreateUserDialogMUI
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreate}
          loading={isLoading}
        />

        <EditUserDialogMUI
          open={showEditDialog}
          onClose={() => {
            setShowEditDialog(false)
            setSelectedUser(null)
          }}
          onUpdate={handleUpdate}
          user={selectedUser}
          loading={isLoading}
        />

        <UserProfileDialogMUI
          open={showProfileDialog}
          onClose={() => setShowProfileDialog(false)}
          onUpdate={handleUpdateProfile}
          currentUser={currentUser}
          loading={isLoading}
        />

        <PasswordChangeDialogMUI
          open={showPasswordDialog}
          onClose={() => setShowPasswordDialog(false)}
          onChangePassword={handleChangePassword}
          loading={isLoading}
        />

        <ExportImportDialogMUI
          open={showExportImportDialog}
          onClose={() => setShowExportImportDialog(false)}
          onExport={handleExport}
          onImport={handleImport}
          loading={isLoading}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
          <DialogTitle>Konfirmasi Hapus</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Apakah Anda yakin ingin menghapus user <strong>{selectedUser?.username}</strong>?
              User akan dinonaktifkan dan tidak dapat login.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDeleteConfirm(false)}>Batal</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Hapus
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Delete Confirmation Dialog */}
        <Dialog open={showBulkDeleteConfirm} onClose={() => setShowBulkDeleteConfirm(false)}>
          <DialogTitle>Konfirmasi Hapus Massal</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Apakah Anda yakin ingin menghapus {selectedUsers.length} user yang dipilih?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowBulkDeleteConfirm(false)}>Batal</Button>
            <Button onClick={handleBulkDeleteConfirm} color="error" variant="contained">
              Hapus Semua
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reset Password Confirmation Dialog */}
        <Dialog open={showResetPasswordConfirm} onClose={() => setShowResetPasswordConfirm(false)}>
          <DialogTitle>Konfirmasi Reset Password</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Reset password untuk user <strong>{selectedUser?.username}</strong>?
              Password baru akan digenerate secara otomatis.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowResetPasswordConfirm(false)}>Batal</Button>
            <Button onClick={handleResetPasswordConfirm} color="warning" variant="contained">
              Reset Password
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reset Password Result Dialog */}
        <Dialog
          open={!!resetPasswordResult}
          onClose={() => setResetPasswordResult(null)}
        >
          <DialogTitle>Password Baru</DialogTitle>
          <DialogContent>
            <Alert severity="success" sx={{ mb: 2 }}>
              Password berhasil direset!
            </Alert>
            <DialogContentText>
              Password baru untuk user adalah:
            </DialogContentText>
            <Typography
              variant="h6"
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 1,
                fontFamily: 'monospace',
                textAlign: 'center',
              }}
            >
              {resetPasswordResult}
            </Typography>
            <Alert severity="warning" sx={{ mt: 2 }}>
              Catat password ini. User harus mengganti password saat login pertama kali.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetPasswordResult(null)} variant="contained">
              Tutup
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for messages */}
        <Snackbar
          open={!!error || !!successMessage}
          autoHideDuration={6000}
          onClose={clearMessages}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={clearMessages}
            severity={error ? 'error' : 'success'}
            variant="filled"
          >
            {error || successMessage}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  )
}

export default UserManagementMUI
