import React, { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, X, Search } from 'lucide-react'

/**
 * SearchableDropdown Component
 *
 * A reusable dropdown component with search/filter functionality,
 * keyboard navigation, and dark theme support.
 *
 * @param {Array} options - Array of option objects
 * @param {string|number} value - Selected value
 * @param {Function} onChange - Change handler (receives value)
 * @param {string} placeholder - Placeholder text
 * @param {Function} getOptionLabel - Function to get display label from option
 * @param {Function} getOptionValue - Function to get value from option
 * @param {Function} filterOption - Optional custom filter function
 * @param {boolean} disabled - Disabled state
 * @param {boolean} required - Required field
 * @param {boolean} isLoading - Loading state
 * @param {number} maxHeight - Max dropdown height in pixels (default: 300)
 * @param {string} noOptionsMessage - Message when no options available
 */
const SearchableDropdown = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select...',
  getOptionLabel = (opt) => opt?.label || String(opt),
  getOptionValue = (opt) => opt?.value ?? opt,
  filterOption = null,
  disabled = false,
  required = false,
  isLoading = false,
  maxHeight = 300,
  noOptionsMessage = 'No options available'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)
  const optionsListRef = useRef(null)

  // Get selected option object
  const selectedOption = useMemo(() => {
    return options.find(opt => getOptionValue(opt) === value)
  }, [options, value, getOptionValue])

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options

    const query = searchQuery.toLowerCase().trim()

    // Use custom filter if provided
    if (filterOption) {
      return options.filter(opt => filterOption(opt, query))
    }

    // Default filter: search in label
    return options.filter(opt => {
      const label = getOptionLabel(opt).toLowerCase()
      // Support multi-word search (all words must match)
      const words = query.split(/\s+/)
      return words.every(word => label.includes(word))
    })
  }, [options, searchQuery, filterOption, getOptionLabel])

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(-1)
  }, [filteredOptions])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Auto-scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsListRef.current) {
      const highlightedElement = optionsListRef.current.children[highlightedIndex]
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [highlightedIndex])

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        if (isOpen) {
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex])
          }
        } else {
          setIsOpen(true)
        }
        break

      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchQuery('')
        break

      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          )
        }
        break

      case 'ArrowUp':
        e.preventDefault()
        if (isOpen) {
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
        }
        break

      case 'Tab':
        setIsOpen(false)
        setSearchQuery('')
        break

      default:
        // Any other key opens dropdown and focuses search
        if (!isOpen && !e.ctrlKey && !e.metaKey && !e.altKey) {
          setIsOpen(true)
        }
        break
    }
  }

  const handleSelect = (option) => {
    const optionValue = getOptionValue(option)
    onChange(optionValue)
    setIsOpen(false)
    setSearchQuery('')
    setHighlightedIndex(-1)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setSearchQuery('')
  }

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (!isOpen) {
        setSearchQuery('')
      }
    }
  }

  return (
    <div
      ref={dropdownRef}
      className="relative w-full"
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <div
        onClick={handleToggle}
        className={`
          w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600
          flex items-center justify-between cursor-pointer
          transition-colors duration-150
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500 focus-within:border-blue-500'}
          ${isOpen ? 'border-blue-500' : ''}
        `}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="dropdown-options"
        tabIndex={disabled ? -1 : 0}
      >
        <span className={selectedOption ? 'text-white' : 'text-gray-400'}>
          {selectedOption ? getOptionLabel(selectedOption) : placeholder}
          {required && !selectedOption && <span className="text-red-400 ml-1">*</span>}
        </span>

        <div className="flex items-center gap-2">
          {/* Clear button */}
          {selectedOption && !disabled && (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-white transition-colors"
              type="button"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Chevron icon */}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-xl overflow-hidden"
          role="presentation"
        >
          {/* Search Input */}
          <div className="p-2 border-b border-gray-600">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 bg-gray-800 text-white border border-gray-600 rounded focus:border-blue-500 focus:outline-none text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options List */}
          <div
            ref={optionsListRef}
            className="overflow-y-auto"
            style={{ maxHeight: `${maxHeight}px` }}
            role="listbox"
            id="dropdown-options"
          >
            {isLoading ? (
              <div className="px-4 py-8 text-center text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-sm">Loading...</p>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400">
                {searchQuery ? (
                  <>
                    <p className="text-sm">No results found for "{searchQuery}"</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </>
                ) : (
                  <p className="text-sm">{noOptionsMessage}</p>
                )}
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const optionValue = getOptionValue(option)
                const isSelected = optionValue === value
                const isHighlighted = index === highlightedIndex

                return (
                  <div
                    key={optionValue}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`
                      px-4 py-2 cursor-pointer transition-colors duration-100
                      ${isSelected ? 'bg-blue-600 text-white' : 'text-gray-200'}
                      ${isHighlighted && !isSelected ? 'bg-gray-600' : ''}
                      ${!isSelected && !isHighlighted ? 'hover:bg-gray-600' : ''}
                    `}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {getOptionLabel(option)}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer with result count */}
          {filteredOptions.length > 0 && !isLoading && (
            <div className="px-4 py-2 bg-gray-800 border-t border-gray-600 text-xs text-gray-400">
              {searchQuery ? (
                <>
                  {filteredOptions.length} of {options.length} options
                </>
              ) : (
                <>
                  {options.length} option{options.length !== 1 ? 's' : ''} available
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchableDropdown
