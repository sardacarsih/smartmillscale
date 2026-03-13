/**
 * Custom hook for widget management
 */
import { useState, useCallback, useMemo } from 'react'
import { useDashboard } from './useDashboard'

/**
 * Hook to manage widgets on a dashboard
 * @param {string} userId - User ID
 * @returns {Object} Widget management functions and state
 */
export const useWidgets = (userId) => {
  const {
    dashboard,
    addWidget,
    updateWidget,
    removeWidget,
    isAddingWidget,
    isUpdatingWidget,
    isRemovingWidget,
  } = useDashboard(userId)

  const [selectedWidget, setSelectedWidget] = useState(null)
  const [isConfiguring, setIsConfiguring] = useState(false)

  // Get widgets from dashboard
  const widgets = useMemo(() => dashboard?.widgets || [], [dashboard])

  // Get visible widgets
  const visibleWidgets = useMemo(
    () => widgets.filter(w => w.is_visible),
    [widgets]
  )

  // Get widgets by type
  const getWidgetsByType = useCallback(
    (type) => widgets.filter(w => w.type === type),
    [widgets]
  )

  // Find widget by ID
  const getWidgetById = useCallback(
    (widgetId) => widgets.find(w => w.id === widgetId),
    [widgets]
  )

  // Check if widget exists
  const hasWidget = useCallback(
    (widgetId) => widgets.some(w => w.id === widgetId),
    [widgets]
  )

  // Add new widget
  const handleAddWidget = useCallback(
    async (widgetData) => {
      const newWidget = {
        id: `widget-${Date.now()}`,
        is_visible: true,
        refreshable: true,
        ...widgetData,
      }
      await addWidget(newWidget)
      return newWidget
    },
    [addWidget]
  )

  // Update existing widget
  const handleUpdateWidget = useCallback(
    async (widgetId, updates) => {
      const widget = getWidgetById(widgetId)
      if (!widget) {
        throw new Error('Widget not found')
      }
      const updatedWidget = { ...widget, ...updates }
      await updateWidget(updatedWidget)
      return updatedWidget
    },
    [getWidgetById, updateWidget]
  )

  // Remove widget
  const handleRemoveWidget = useCallback(
    async (widgetId) => {
      await removeWidget(widgetId)
    },
    [removeWidget]
  )

  // Toggle widget visibility
  const toggleWidgetVisibility = useCallback(
    async (widgetId) => {
      const widget = getWidgetById(widgetId)
      if (!widget) return
      await handleUpdateWidget(widgetId, { is_visible: !widget.is_visible })
    },
    [getWidgetById, handleUpdateWidget]
  )

  // Update widget position
  const updateWidgetPosition = useCallback(
    async (widgetId, position) => {
      await handleUpdateWidget(widgetId, { position })
    },
    [handleUpdateWidget]
  )

  // Update widget config
  const updateWidgetConfig = useCallback(
    async (widgetId, config) => {
      await handleUpdateWidget(widgetId, { config })
    },
    [handleUpdateWidget]
  )

  // Select widget for configuration
  const selectWidget = useCallback((widgetId) => {
    setSelectedWidget(widgetId)
    setIsConfiguring(true)
  }, [])

  // Deselect widget
  const deselectWidget = useCallback(() => {
    setSelectedWidget(null)
    setIsConfiguring(false)
  }, [])

  // Widget templates
  const widgetTemplates = useMemo(() => ({
    metric_card: {
      type: 'metric_card',
      title: 'Metric Card',
      position: { x: 0, y: 0, width: 4, height: 2 },
      config: { metric: '', showTrend: true },
      required_role: 'TIMBANGAN',
    },
    chart: {
      type: 'chart',
      title: 'Chart',
      position: { x: 0, y: 0, width: 6, height: 4 },
      config: { chartType: 'line', dataSource: '' },
      required_role: 'SUPERVISOR',
    },
    recent_activity: {
      type: 'recent_activity',
      title: 'Recent Activity',
      position: { x: 0, y: 0, width: 4, height: 6 },
      config: { limit: 10 },
      required_role: 'TIMBANGAN',
    },
    system_health: {
      type: 'system_health',
      title: 'System Health',
      position: { x: 0, y: 0, width: 4, height: 3 },
      config: { showDetails: true },
      required_role: 'ADMIN',
    },
    sync_status: {
      type: 'sync_status',
      title: 'Sync Status',
      position: { x: 0, y: 0, width: 4, height: 3 },
      config: { showPending: true },
      required_role: 'TIMBANGAN',
    },
    user_activity: {
      type: 'user_activity',
      title: 'User Activity',
      position: { x: 0, y: 0, width: 6, height: 4 },
      config: { timeRange: '24h' },
      required_role: 'SUPERVISOR',
    },
  }), [])

  // Create widget from template
  const createWidgetFromTemplate = useCallback(
    async (templateName, customizations = {}) => {
      const template = widgetTemplates[templateName]
      if (!template) {
        throw new Error(`Template ${templateName} not found`)
      }
      return handleAddWidget({ ...template, ...customizations })
    },
    [widgetTemplates, handleAddWidget]
  )

  return {
    // Widget data
    widgets,
    visibleWidgets,
    selectedWidget,
    isConfiguring,

    // Widget queries
    getWidgetsByType,
    getWidgetById,
    hasWidget,

    // Widget operations
    addWidget: handleAddWidget,
    updateWidget: handleUpdateWidget,
    removeWidget: handleRemoveWidget,
    toggleWidgetVisibility,
    updateWidgetPosition,
    updateWidgetConfig,

    // Widget selection
    selectWidget,
    deselectWidget,

    // Templates
    widgetTemplates,
    createWidgetFromTemplate,

    // Loading states
    isAddingWidget,
    isUpdatingWidget,
    isRemovingWidget,
  }
}

export default useWidgets
