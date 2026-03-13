import React from 'react'

/**
 * FormField Wrapper Component
 *
 * Provides consistent label/input layout with error and hint support.
 *
 * @param {string} label - Field label
 * @param {boolean} required - Show required indicator (*)
 * @param {string} error - Error message to display
 * @param {string} hint - Hint text to display below input
 * @param {ReactNode} children - Input element(s)
 */
const FormField = ({
  label,
  required = false,
  error = null,
  hint = null,
  children
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {children}

      {error && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}

      {hint && !error && (
        <p className="text-sm text-gray-400">{hint}</p>
      )}
    </div>
  )
}

export default FormField
