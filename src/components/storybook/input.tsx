import React from 'react'

export interface InputProps {
  label: string
  id: string
  type?: 'text' | 'email' | 'password'
  value?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  required?: boolean
  error?: string
  className?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  id,
  type = 'text',
  value = '',
  onChange,
  onBlur,
  placeholder,
  required = false,
  error,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label
        htmlFor={id}
        className="text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        id={id}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
      />
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  )
}
