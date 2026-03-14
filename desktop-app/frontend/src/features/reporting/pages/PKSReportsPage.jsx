import React, { useEffect, useState } from 'react'
import {
    Box,
    Grid,
    Paper,
    Typography,
    Tab,
    Tabs,
    Button,
    IconButton,
    Card,
    CardContent,
    Stack,
    Chip,
    CircularProgress,
    Alert,
    TextField,
    MenuItem,
    Drawer,
    Divider
} from '@mui/material'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from 'recharts'
import { DataGrid, GridToolbar } from '@mui/x-data-grid'
import {
    FileDown,
    Filter,
    RefreshCw,
    Calendar,
    AlertTriangle,
    TrendingUp,
    List,
    PieChart as PieChartIcon,
    X
} from 'lucide-react'

import { useReportStore } from '../store/useReportStore'
// Custom Tab Panel Component
function CustomTabPanel(props) {
    const { children, value, index, ...other } = props

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`pks-report-tabpanel-${index}`}
            aria-labelledby={`pks-report-tab-${index}`}
            {...other}
            style={{ height: '100%' }}
        >
            {value === index && (
                <Box sx={{ p: 3, height: '100%' }}>
                    {children}
                </Box>
            )}
        </div>
    )
}

const PKSReportsPage = ({ wails }) => {
    // Store state
    const {
        activeTab,
        setActiveTab,
        transactions,
        filters,
        updateFilters,
        resetFilters
    } = useReportStore()

    // Local state
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [tabValue, setTabValue] = useState(0)

    // Map store activeTab to index
    useEffect(() => {
        const tabMap = { 'summary': 0, 'details': 1, 'trends': 2, 'anomalies': 3 }
        setTabValue(tabMap[activeTab] || 0)
    }, [activeTab])

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue)
        const tabMap = { 0: 'summary', 1: 'details', 2: 'trends', 3: 'anomalies' }
        setActiveTab(tabMap[newValue])
    }

    // Initial load
    useEffect(() => {
        if (wails) {
            // Initialize data
            const init = async () => {
                try {
                    // Load presets and options
                    // Note: In a real implementation, we would call the backend services
                    // For now, we'll simulate or use what's available

                    // If we had the actual services bound to wails, we would use them here
                    // const reportService = wails.Services.PKSReportService
                    // await loadDatePresets(reportService)
                    // await loadFilterOptions(reportService)

                    // For now, let's just set some defaults if needed
                } catch (error) {
                    console.error("Failed to initialize reports:", error)
                }
            }

            init()
        }
    }, [wails])

    // Mock data generation for UI development (remove in production)
    const handleGenerateReport = async () => {
        // In a real app, we would construct the request object and call generateReport
        // const request = { ...filters }
        // await generateReport(wails.Services.PKSReportService, request)

        console.log("Generating report with filters:", filters)
    }

    const handleExportCSV = () => {
        console.log("Exporting to CSV...")
        // exportToCSV(wails.Services.PKSReportService, filters)
    }

    const handleExportExcel = () => {
        console.log("Exporting to Excel...")
        // exportToExcel(wails.Services.PKSReportService, filters)
    }

    // Columns for DataGrid
    const columns = [
        { field: 'noTransaksi', headerName: 'No. Transaksi', width: 150 },
        {
            field: 'timbang1Date',
            headerName: 'Tanggal Timbang 1',
            width: 180,
            renderCell: (params) => params.value ? new Date(params.value).toLocaleString('id-ID') : '-'
        },
        { field: 'nomorKendaraan', headerName: 'No. Polisi', width: 120 },
        { field: 'supplierName', headerName: 'Supplier', width: 200 },
        { field: 'sourceSummary', headerName: 'Sumber TBS', width: 180 },
        { field: 'productName', headerName: 'Produk', width: 150 },
        { field: 'bruto', headerName: 'Bruto (kg)', width: 130, type: 'number' },
        { field: 'netto', headerName: 'Netto (kg)', width: 150, type: 'number' },
        { field: 'netto2', headerName: 'Netto 2 (kg)', width: 150, type: 'number' },
        { field: 'grade', headerName: 'Grade', width: 100 },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    color={params.value === 'selesai' ? 'success' : 'default'}
                    size="small"
                />
            )
        },
    ]

    return (
        <Box sx={{ minHeight: 'min(72vh, 860px)', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Header */}
            <Paper sx={{ p: 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                <Box>
                    <Typography variant="h5" component="h1" fontWeight="bold">
                        Laporan PKS
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Analisis transaksi, tren, dan performa operasional
                    </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Button
                        variant="outlined"
                        startIcon={<Filter size={18} />}
                        onClick={() => setIsFilterOpen(true)}
                    >
                        Filter
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<FileDown size={18} />}
                        onClick={handleExportCSV}
                    >
                        Export CSV
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<FileDown size={18} />}
                        onClick={handleExportExcel}
                        color="primary"
                    >
                        Export Excel
                    </Button>
                </Stack>
            </Paper>

            {/* Main Content */}
            <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="report tabs" variant="scrollable" scrollButtons="auto">
                        <Tab icon={<PieChartIcon size={18} />} iconPosition="start" label="Ringkasan" />
                        <Tab icon={<List size={18} />} iconPosition="start" label="Detail Transaksi" />
                        <Tab icon={<TrendingUp size={18} />} iconPosition="start" label="Tren & Analisis" />
                        <Tab icon={<AlertTriangle size={18} />} iconPosition="start" label="Anomali" />
                    </Tabs>
                </Box>

                {/* Summary Tab */}
                <CustomTabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        {/* Key Metrics */}
                        <Grid item xs={12} md={6} xl={3}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>Total Transaksi</Typography>
                                    <Typography variant="h4">0</Typography>
                                    <Typography variant="caption" color="success.main">+0% dari periode lalu</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6} xl={3}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>Total Netto (Ton)</Typography>
                                    <Typography variant="h4">0</Typography>
                                    <Typography variant="caption" color="success.main">+0% dari periode lalu</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6} xl={3}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>Rata-rata Potongan</Typography>
                                    <Typography variant="h4">0%</Typography>
                                    <Typography variant="caption" color="text.secondary">Target: &lt; 5%</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6} xl={3}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>Waktu Rata-rata</Typography>
                                    <Typography variant="h4">0m</Typography>
                                    <Typography variant="caption" color="text.secondary">Per transaksi</Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Charts */}
                        <Grid item xs={12} xl={8}>
                            <Card sx={{ height: { xs: 320, xl: 400 } }}>
                                <CardContent sx={{ height: '100%' }}>
                                    <Typography variant="h6" gutterBottom>Volume Harian (Ton)</Typography>
                                    <ResponsiveContainer width="100%" height="90%">
                                        <BarChart data={[]}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="netto" fill="#8884d8" name="Netto" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} xl={4}>
                            <Card sx={{ height: { xs: 320, xl: 400 } }}>
                                <CardContent sx={{ height: '100%' }}>
                                    <Typography variant="h6" gutterBottom>Komposisi Grade</Typography>
                                    <ResponsiveContainer width="100%" height="90%">
                                        <PieChart>
                                            <Pie
                                                data={[]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </CustomTabPanel>

                {/* Details Tab */}
                <CustomTabPanel value={tabValue} index={1}>
                    <Box sx={{ height: 'clamp(400px, 52vh, 560px)', width: '100%', overflowX: 'auto' }}>
                        <DataGrid
                            rows={transactions || []}
                            columns={columns}
                            getRowId={(row) => row.noTransaksi || Math.random()}
                            slots={{ toolbar: GridToolbar }}
                            slotProps={{
                                toolbar: {
                                    showQuickFilter: true,
                                },
                            }}
                            pageSizeOptions={[10, 25, 50, 100]}
                            initialState={{
                                pagination: { paginationModel: { pageSize: 25 } },
                            }}
                            density="compact"
                            sx={{ minWidth: 1480 }}
                        />
                    </Box>
                </CustomTabPanel>

                {/* Trends Tab */}
                <CustomTabPanel value={tabValue} index={2}>
                    <Typography variant="h6">Analisis Tren</Typography>
                    <Typography color="text.secondary">Grafik tren jangka panjang akan ditampilkan di sini.</Typography>
                </CustomTabPanel>

                {/* Anomalies Tab */}
                <CustomTabPanel value={tabValue} index={3}>
                    <Typography variant="h6">Deteksi Anomali</Typography>
                    <Typography color="text.secondary">Daftar transaksi yang mencurigakan atau di luar batas normal.</Typography>
                </CustomTabPanel>
            </Paper>

            {/* Filter Drawer */}
            <Drawer
                anchor="right"
                open={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
            >
                <Box sx={{ width: { xs: '100vw', sm: 380 }, maxWidth: '100vw', p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">Filter Laporan</Typography>
                        <IconButton onClick={() => setIsFilterOpen(false)}>
                            <X size={20} />
                        </IconButton>
                    </Box>

                    <Stack spacing={3}>
                        <TextField
                            label="Dari Tanggal"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => updateFilters({ startDate: new Date(e.target.value) })}
                        />
                        <TextField
                            label="Sampai Tanggal"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => updateFilters({ endDate: new Date(e.target.value) })}
                        />

                        <TextField
                            select
                            label="Supplier"
                            fullWidth
                            value={filters.supplierIds[0] || ''}
                            onChange={(e) => updateFilters({ supplierIds: [e.target.value] })}
                        >
                            <MenuItem value="">Semua Supplier</MenuItem>
                            {/* Add supplier options here */}
                        </TextField>

                        <TextField
                            select
                            label="Produk"
                            fullWidth
                            value={filters.productIds[0] || ''}
                            onChange={(e) => updateFilters({ productIds: [e.target.value] })}
                        >
                            <MenuItem value="">Semua Produk</MenuItem>
                            {/* Add product options here */}
                        </TextField>

                        <Divider />

                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            onClick={() => {
                                handleGenerateReport()
                                setIsFilterOpen(false)
                            }}
                        >
                            Terapkan Filter
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => resetFilters()}
                        >
                            Reset Filter
                        </Button>
                    </Stack>
                </Box>
            </Drawer>
        </Box>
    )
}

export default PKSReportsPage
