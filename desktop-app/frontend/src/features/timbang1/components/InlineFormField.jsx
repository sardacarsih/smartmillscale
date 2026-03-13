import React from 'react'

/**
 * InlineFormField - Reusable component for inline form fields
 * Displays label and control on the same line with consistent spacing
 */
const InlineFormField = ({
  label,
  required = false,
  labelWidth = 'w-32', // 128px default for consistent alignment
  children
}) => {
  return (
    <div className="flex items-center gap-3">
      <label className={`flex-shrink-0 ${labelWidth} text-sm font-medium text-gray-300`}>
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}

export default InlineFormField
