/**
 * ReportService - Service layer for PKS reporting operations
 *
 * This service encapsulates all Wails API calls related to PKS reporting.
 * Benefits:
 * - Centralized API interface
 * - Easy to mock for testing
 * - Type documentation via JSDoc
 * - Error handling in one place
 * - Progress tracking for long operations
 */
export class ReportService {
    /**
     * @param {Object} wails - Wails bindings object
     */
    constructor(wails) {
        this.wails = wails
    }

    /**
     * Generate a comprehensive PKS report
     * @param {Object} request - Report request parameters
     * @param {Date|string} request.startDate - Start date for the report
     * @param {Date|string} request.endDate - End date for the report
     * @param {string} request.reportType - Type of report ('daily', 'range', 'custom')
     * @param {Object} request.filters - Filter parameters
     * @param {number[]} request.filters.supplierIds - Supplier IDs to include
     * @param {number[]} request.filters.productIds - Product IDs to include
     * @param {string} request.filters.statusFilter - Status filter ('all', 'completed', 'rejected')
     * @param {string[]} request.filters.gradeFilter - Grade filters ['A', 'B', 'C', 'D']
     * @returns {Promise<Object>} Complete report data object
     */
    async generateReport(request) {
        try {
            // Convert dates to ISO strings if they are Date objects
            const processedRequest = {
                ...request,
                startDate: request.startDate instanceof Date ? request.startDate.toISOString() : request.startDate,
                endDate: request.endDate instanceof Date ? request.endDate.toISOString() : request.endDate,
            }

            const result = await this.wails.GeneratePKSReport(JSON.stringify(processedRequest))
            return JSON.parse(result)
        } catch (error) {
            console.error('ReportService.generateReport error:', error)
            throw new Error(`Failed to generate report: ${error.message}`)
        }
    }

    /**
     * Generate report summary only (faster, no detailed transactions)
     * @param {Object} request - Report request parameters (same as generateReport)
     * @returns {Promise<Object>} Report summary data
     */
    async generateReportSummary(request) {
        try {
            const processedRequest = {
                ...request,
                startDate: request.startDate instanceof Date ? request.startDate.toISOString() : request.startDate,
                endDate: request.endDate instanceof Date ? request.endDate.toISOString() : request.endDate,
            }

            const result = await this.wails.GetPKSReportSummary(JSON.stringify(processedRequest))
            return JSON.parse(result)
        } catch (error) {
            console.error('ReportService.generateReportSummary error:', error)
            throw new Error(`Failed to generate report summary: ${error.message}`)
        }
    }

    /**
     * Export report to CSV format
     * @param {Object} request - Report request parameters (same as generateReport)
     * @returns {Promise<string>} CSV data as string
     */
    async exportToCSV(request) {
        try {
            const processedRequest = {
                ...request,
                startDate: request.startDate instanceof Date ? request.startDate.toISOString() : request.startDate,
                endDate: request.endDate instanceof Date ? request.endDate.toISOString() : request.endDate,
            }

            const result = await this.wails.ExportPKSReportToCSV(JSON.stringify(processedRequest))
            return result
        } catch (error) {
            console.error('ReportService.exportToCSV error:', error)
            throw new Error(`Failed to export to CSV: ${error.message}`)
        }
    }

    /**
     * Export report to Excel format
     * @param {Object} request - Report request parameters (same as generateReport)
     * @returns {Promise<ArrayBuffer>} Excel file binary data
     */
    async exportToExcel(request) {
        try {
            const processedRequest = {
                ...request,
                startDate: request.startDate instanceof Date ? request.startDate.toISOString() : request.startDate,
                endDate: request.endDate instanceof Date ? request.endDate.toISOString() : request.endDate,
            }

            // The result should be a base64 string or binary data
            const result = await this.wails.ExportPKSReportToExcel(JSON.stringify(processedRequest))

            // Handle different response formats
            if (typeof result === 'string') {
                // Try to parse as base64
                try {
                    // Check if it's a base64 string
                    if (result.startsWith('data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,')) {
                        // Remove data URL prefix
                        const base64Data = result.split(',')[1]
                        return this.base64ToArrayBuffer(base64Data)
                    } else {
                        // Assume it's plain base64
                        return this.base64ToArrayBuffer(result)
                    }
                } catch (parseError) {
                    // If not base64, return as-is (might be raw binary string)
                    return result
                }
            }

            return result
        } catch (error) {
            console.error('ReportService.exportToExcel error:', error)
            throw new Error(`Failed to export to Excel: ${error.message}`)
        }
    }

    /**
     * Get predefined date range options for reports
     * @returns {Promise<Array>} Array of date preset objects
     */
    async getDatePresets() {
        try {
            const result = await this.wails.GetPKSReportDatePresets()
            return JSON.parse(result)
        } catch (error) {
            console.error('ReportService.getDatePresets error:', error)
            throw new Error(`Failed to get date presets: ${error.message}`)
        }
    }

    /**
     * Get available filter options for reports
     * @returns {Promise<Object>} Filter options object with suppliers, products, grades, statuses
     */
    async getFilterOptions() {
        try {
            const result = await this.wails.GetPKSReportFilters()
            return JSON.parse(result)
        } catch (error) {
            console.error('ReportService.getFilterOptions error:', error)
            throw new Error(`Failed to get filter options: ${error.message}`)
        }
    }

    /**
     * Validate report request parameters
     * @param {Object} request - Report request parameters
     * @returns {Promise<Object>} Validation result with isValid, errors, and warnings
     */
    async validateRequest(request) {
        try {
            const processedRequest = {
                ...request,
                startDate: request.startDate instanceof Date ? request.startDate.toISOString() : request.startDate,
                endDate: request.endDate instanceof Date ? request.endDate.toISOString() : request.endDate,
            }

            const result = await this.wails.ValidatePKSReportRequest(JSON.stringify(processedRequest))
            return JSON.parse(result)
        } catch (error) {
            console.error('ReportService.validateRequest error:', error)
            throw new Error(`Failed to validate request: ${error.message}`)
        }
    }

    /**
     * Set up event listeners for export progress
     * @param {Function} onProgress - Callback function for progress updates
     * @returns {Function} Cleanup function to remove event listeners
     */
    setupExportProgressListener(onProgress) {
        const handleProgress = (event) => {
            try {
                const progress = JSON.parse(event.detail)
                onProgress(progress)
            } catch (error) {
                console.error('Failed to parse progress event:', error)
            }
        }

        // Add event listener
        window.addEventListener('export_progress', handleProgress)

        // Return cleanup function
        return () => {
            window.removeEventListener('export_progress', handleProgress)
        }
    }

    /**
     * Utility: Convert base64 string to ArrayBuffer
     * @param {string} base64 - Base64 string
     * @returns {ArrayBuffer} ArrayBuffer containing binary data
     */
    base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
        }
        return bytes.buffer
    }

    /**
     * Utility: Convert ArrayBuffer to Blob for Excel files
     * @param {ArrayBuffer} arrayBuffer - ArrayBuffer containing Excel data
     * @returns {Blob} Blob object with correct MIME type
     */
    arrayBufferToBlob(arrayBuffer) {
        return new Blob([arrayBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
    }

    /**
     * Utility: Download blob as file
     * @param {Blob} blob - Blob object to download
     * @param {string} filename - Filename for download
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    /**
     * Complete Excel export with download
     * @param {Object} request - Report request parameters
     * @param {string} filename - Optional filename (defaults to timestamped name)
     * @param {Function} onProgress - Optional progress callback
     * @returns {Promise<void>}
     */
    async exportToExcelAndDownload(request, filename = null, onProgress = null) {
        try {
            // Set up progress listener if callback provided
            let cleanupProgress = null
            if (onProgress) {
                cleanupProgress = this.setupExportProgressListener(onProgress)
            }

            // Generate Excel data
            const excelData = await this.exportToExcel(request)

            // Convert to blob
            const blob = this.arrayBufferToBlob(excelData)

            // Generate filename if not provided
            const defaultFilename = `PKS-Report-${new Date().toISOString().split('T')[0]}.xlsx`
            const finalFilename = filename || defaultFilename

            // Download
            this.downloadBlob(blob, finalFilename)

            // Cleanup
            if (cleanupProgress) {
                cleanupProgress()
            }

        } catch (error) {
            console.error('ReportService.exportToExcelAndDownload error:', error)
            throw error
        }
    }

    /**
     * Complete CSV export with download
     * @param {Object} request - Report request parameters
     * @param {string} filename - Optional filename (defaults to timestamped name)
     * @returns {Promise<void>}
     */
    async exportToCSVAndDownload(request, filename = null) {
        try {
            // Generate CSV data
            const csvData = await this.exportToCSV(request)

            // Create blob
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })

            // Generate filename if not provided
            const defaultFilename = `PKS-Report-${new Date().toISOString().split('T')[0]}.csv`
            const finalFilename = filename || defaultFilename

            // Download
            this.downloadBlob(blob, finalFilename)

        } catch (error) {
            console.error('ReportService.exportToCSVAndDownload error:', error)
            throw error
        }
    }

    /**
     * Check if the service is available (has Wails bindings)
     * @returns {boolean} True if service is available
     */
    isAvailable() {
        return this.wails &&
               typeof this.wails.GeneratePKSReport === 'function' &&
               typeof this.wails.GetPKSReportSummary === 'function' &&
               typeof this.wails.ExportPKSReportToCSV === 'function' &&
               typeof this.wails.ExportPKSReportToExcel === 'function'
    }

    /**
     * Get service capabilities
     * @returns {Object} Service capabilities object
     */
    getCapabilities() {
        return {
            generateReport: typeof this.wails.GeneratePKSReport === 'function',
            generateSummary: typeof this.wails.GetPKSReportSummary === 'function',
            exportCSV: typeof this.wails.ExportPKSReportToCSV === 'function',
            exportExcel: typeof this.wails.ExportPKSReportToExcel === 'function',
            datePresets: typeof this.wails.GetPKSReportDatePresets === 'function',
            filterOptions: typeof this.wails.GetPKSReportFilters === 'function',
            validation: typeof this.wails.ValidatePKSReportRequest === 'function',
        }
    }
}