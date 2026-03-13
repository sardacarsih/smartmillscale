import React, { useState } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
} from '@mui/material'
import {
  CloudSync as SyncIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Key as KeyIcon,
} from '@mui/icons-material'

import APIKeyManagementPage from './APIKeyManagementPage'
import userManagementTheme from '../../user-management/theme'

const SyncManagementPage = ({ currentUser, wails: wailsProp, onNavigate, onLogout }) => {
  const [activeTab, setActiveTab] = useState(0)

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  const tabs = [
    {
      id: 0,
      label: 'API Key Management',
      icon: <KeyIcon />,
      description: 'Kelola API key untuk sinkronisasi',
    },
    {
      id: 1,
      label: 'Sync Settings',
      icon: <SettingsIcon />,
      description: 'Pengaturan sinkronisasi',
      disabled: true, // Future feature
    },
    {
      id: 2,
      label: 'Security',
      icon: <SecurityIcon />,
      description: 'Keamanan sinkronisasi',
      disabled: true, // Future feature
    },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <APIKeyManagementPage
            currentUser={currentUser}
            wails={wailsProp}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />
        )
      case 1:
        return (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="info">
              <Typography variant="h6" gutterBottom>
                Sync Settings
              </Typography>
              <Typography variant="body2">
                Fitur ini akan segera tersedia. Fitur ini akan memungkinkan Anda mengkonfigurasi:
              </Typography>
              <ul style={{ textAlign: 'left', marginTop: '16px' }}>
                <li>Interval sinkronisasi otomatis</li>
                <li>Prioritas sinkronisasi</li>
                <li>Batch size konfigurasi</li>
                <li>Retry policy settings</li>
                <li>Error handling preferences</li>
              </ul>
            </Alert>
          </Box>
        )
      case 2:
        return (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="info">
              <Typography variant="h6" gutterBottom>
                Security Configuration
              </Typography>
              <Typography variant="body2">
                Fitur ini akan segera tersedia. Fitur ini akan memungkinkan Anda mengkonfigurasi:
              </Typography>
              <ul style={{ textAlign: 'left', marginTop: '16px' }}>
                <li>SSL/TLS settings</li>
                <li>Certificate management</li>
                <li>Request signing configuration</li>
                <li>IP whitelist/blacklist</li>
                <li>Rate limiting settings</li>
              </ul>
            </Alert>
          </Box>
        )
      default:
        return null
    }
  }

  return (
    <ThemeProvider theme={userManagementTheme}>
      <Box sx={{ minHeight: '100vh', bgcolor: '#111827' }}>
        {/* Header */}
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <SyncIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                Kelola Sinkronisasi
              </Typography>
              <Typography variant="body2" sx={{ color: 'gray.400' }}>
                Konfigurasi dan kelola sinkronisasi dengan server utama
              </Typography>
            </Box>
          </Box>

          {/* Tab Navigation */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: 'primary.main',
                },
              }}
            >
              {tabs.map((tab) => (
                <Tab
                  key={tab.id}
                  icon={tab.icon}
                  label={tab.label}
                  disabled={tab.disabled}
                  sx={{
                    minHeight: 64,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 'medium',
                    color: tab.disabled ? 'text.disabled' : 'text.primary',
                    '&.Mui-selected': {
                      color: 'primary.main',
                    },
                  }}
                />
              ))}
            </Tabs>
          </Paper>

          {/* Tab Content */}
          {renderTabContent()}
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default SyncManagementPage