import React, { useState, useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * Modern FormModal Component
 *
 * Features:
 * - Dynamic form generation from configuration
 * - Validation and error handling
 * - Loading states
 * - Responsive design
 * - Accessibility support
 */

const FormModal = ({
  isOpen = false,
  onClose,
  onSubmit,
  title,
  description,
  fields = [],
  initialValues = {},
  isLoading = false,
  error = null,
  submitButtonText = 'Save',
  submitButtonIcon = null,
  cancelButtonText = 'Cancel',
  size = 'md', // sm, md, lg, xl
  className = ''
}) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Update form data when initialValues change
  useEffect(() => {
    setFormData(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // Validate field
  const validateField = (field, value) => {
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field.label || field.name} is required`;
    }

    if (field.validation && typeof field.validation === 'function') {
      return field.validation(value);
    }

    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    if (field.type === 'number' && value) {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return 'Please enter a valid number';
      }
      if (field.min !== undefined && numValue < field.min) {
        return `Value must be at least ${field.min}`;
      }
      if (field.max !== undefined && numValue > field.max) {
        return `Value must be at most ${field.max}`;
      }
    }

    return null;
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    fields.forEach((field) => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(fields.reduce((acc, field) => ({ ...acc, [field.name]: true }), {}));
    return isValid;
  };

  // Handle field change
  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    setTouched(prev => ({ ...prev, [fieldName]: true }));

    // Clear error for this field if value is now valid
    const field = fields.find(f => f.name === fieldName);
    if (field) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (onSubmit) {
      onSubmit(formData);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isLoading && onClose) {
      onClose();
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal Panel */}
        <div className={`relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full ${sizeClasses[size]} ${className}`}>
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold leading-6 text-gray-900">
                  {title}
                </h3>
                {description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={handleClose}
                disabled={isLoading}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Error Alert */}
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="px-6 py-4">
              <div className="grid gap-4">
                {fields.map((field) => {
                  const fieldValue = formData[field.name] || '';
                  const fieldError = touched[field.name] ? errors[field.name] : null;

                  return (
                    <div key={field.name}>
                      {field.type === 'select' ? (
                        <div>
                          <label
                            htmlFor={field.name}
                            className="block text-sm font-medium text-gray-700"
                          >
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <select
                            id={field.name}
                            value={fieldValue}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            disabled={isLoading || field.disabled}
                            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                              fieldError
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                            } ${field.disabled ? 'bg-gray-100' : 'bg-white'}`}
                          >
                            <option value="">Select {field.label}</option>
                            {field.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {fieldError && (
                            <p className="mt-1 text-sm text-red-600">
                              {fieldError}
                            </p>
                          )}
                        </div>
                      ) : field.type === 'textarea' ? (
                        <div>
                          <label
                            htmlFor={field.name}
                            className="block text-sm font-medium text-gray-700"
                          >
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <textarea
                            id={field.name}
                            value={fieldValue}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            disabled={isLoading || field.disabled}
                            rows={field.rows || 3}
                            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                              fieldError
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                            } ${field.disabled ? 'bg-gray-100' : 'bg-white'}`}
                            placeholder={field.placeholder}
                          />
                          {fieldError && (
                            <p className="mt-1 text-sm text-red-600">
                              {fieldError}
                            </p>
                          )}
                        </div>
                      ) : field.type === 'checkbox' ? (
                        <div className="flex items-center">
                          <input
                            id={field.name}
                            type="checkbox"
                            checked={!!fieldValue}
                            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                            disabled={isLoading || field.disabled}
                            className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                              field.disabled ? 'opacity-50' : ''
                            }`}
                          />
                          <label
                            htmlFor={field.name}
                            className="ml-2 block text-sm text-gray-900"
                          >
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {fieldError && (
                            <p className="mt-1 text-sm text-red-600">
                              {fieldError}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label
                            htmlFor={field.name}
                            className="block text-sm font-medium text-gray-700"
                          >
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <input
                            id={field.name}
                            type={field.type || 'text'}
                            value={fieldValue}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            disabled={isLoading || field.disabled}
                            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                              fieldError
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                            } ${field.disabled ? 'bg-gray-100' : 'bg-white'}`}
                            placeholder={field.placeholder}
                            step={field.type === 'number' ? field.step : undefined}
                            min={field.type === 'number' ? field.min : undefined}
                            max={field.type === 'number' ? field.max : undefined}
                          />
                          {fieldError && (
                            <p className="mt-1 text-sm text-red-600">
                              {fieldError}
                            </p>
                          )}
                        </div>
                      )}

                      {field.helper && (
                        <p className="mt-1 text-sm text-gray-500">
                          {field.helper}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {cancelButtonText}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {submitButtonIcon && !isLoading && (
                  <span>{submitButtonIcon}</span>
                )}
                <span>{isLoading ? 'Saving...' : submitButtonText}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormModal;