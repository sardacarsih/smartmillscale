import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material'
import {
  UploadFile as UploadIcon,
  Download as DownloadIcon,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material'

const ExportImportDialogMUI = ({ open, onClose, onExport, onImport, loading }) => {
  const [activeTab, setActiveTab] = useState(0)
  const [includeInactive, setIncludeInactive] = useState(false)
  const [csvContent, setCsvContent] = useState('')
  const [importResults, setImportResults] = useState(null)

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    setImportResults(null)
  }

  const handleExport = async () => {
    if (onExport) {
      await onExport(includeInactive)
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCsvContent(e.target.result)
      }
      reader.readAsText(file)
    }
  }

  const handleImport = async () => {
    if (onImport && csvContent) {
      const results = await onImport(csvContent)
      setImportResults(results)
    }
  }

  const handleReset = () => {
    setCsvContent('')
    setImportResults(null)
    setIncludeInactive(false)
    setActiveTab(0)
    onClose()
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : handleReset} maxWidth="md" fullWidth>
      <DialogTitle>Export / Import User</DialogTitle>

      {loading && <LinearProgress />}

      <DialogContent>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tab icon={<DownloadIcon />} label="Export" iconPosition="start" />
          <Tab icon={<UploadIcon />} label="Import" iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Export data user ke file CSV. File dapat dibuka dengan Excel atau aplikasi spreadsheet lainnya.
            </Alert>

            <FormControlLabel
              control={
                <Checkbox
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                />
              }
              label="Sertakan user yang nonaktif"
            />

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Format CSV yang akan diekspor:
              </Typography>
              <Typography variant="caption" component="pre" sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, mt: 1 }}>
                ID,Username,Full Name,Email,Role,Is Active,Must Change Password,Created At,Last Login At
              </Typography>
            </Box>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Import user dari file CSV. Pastikan format file sesuai dengan template.
            </Alert>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Format CSV yang diperlukan:
              </Typography>
              <Typography variant="caption" component="pre" sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, mt: 1 }}>
{`Username,Full Name,Email,Role,Password
johndoe,John Doe,john@example.com,TIMBANGAN,Password123
janedoe,Jane Doe,jane@example.com,SUPERVISOR,SecurePass456`}
              </Typography>
            </Box>

            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mb: 2 }}
            >
              Pilih File CSV
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={handleFileSelect}
              />
            </Button>

            {csvContent && (
              <Alert severity="success" sx={{ mb: 2 }}>
                File berhasil dipilih ({csvContent.split('\n').length - 1} baris data)
              </Alert>
            )}

            {importResults && (
              <Box sx={{ mt: 2 }}>
                <Alert
                  severity={importResults.failureCount === 0 ? 'success' : 'warning'}
                  sx={{ mb: 2 }}
                >
                  Import selesai: {importResults.successCount} berhasil, {importResults.failureCount} gagal
                </Alert>

                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Baris</TableCell>
                        <TableCell>Username</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Keterangan</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {importResults.results.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell>{result.row}</TableCell>
                          <TableCell>{result.username || '-'}</TableCell>
                          <TableCell>
                            {result.success ? (
                              <Chip
                                icon={<CheckCircle />}
                                label="Berhasil"
                                color="success"
                                size="small"
                              />
                            ) : (
                              <Chip
                                icon={<ErrorIcon />}
                                label="Gagal"
                                color="error"
                                size="small"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color={result.success ? 'success.main' : 'error.main'}>
                              {result.error || 'User berhasil dibuat'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleReset} disabled={loading}>
          Tutup
        </Button>
        {activeTab === 0 ? (
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={loading}
            startIcon={<DownloadIcon />}
          >
            Export CSV
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={loading || !csvContent}
            startIcon={<UploadIcon />}
          >
            Import CSV
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ExportImportDialogMUI
