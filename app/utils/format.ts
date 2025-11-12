/**
 * Format utility functions for displaying data
 */

/**
 * Format a number as currency (SAR)
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string (e.g., "SAR 1,234.56")
 */
export function formatCurrency(amount: number | string | null | undefined, decimals: number = 2): string {
  if (amount === null || amount === undefined || amount === '') {
    return 'SAR 0.00'
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  if (isNaN(numAmount)) {
    return 'SAR 0.00'
  }

  return `SAR ${numAmount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

/**
 * Format a date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted date range (e.g., "01/11/2025 - 30/11/2025")
 */
export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate

  return `${formatDate(start)} - ${formatDate(end)}`
}

/**
 * Format a date as DD/MM/YYYY
 * @param date - The date to format
 * @returns Formatted date string (e.g., "01/11/2025")
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) {
    return ''
  }

  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) {
    return ''
  }

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  return `${day}/${month}/${year}`
}

/**
 * Format a date and time as DD/MM/YYYY HH:MM
 * @param date - The date to format
 * @returns Formatted datetime string (e.g., "01/11/2025 14:30")
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) {
    return ''
  }

  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) {
    return ''
  }

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}`
}

/**
 * Format a number with specified decimal places
 * @param num - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 */
export function formatNumber(num: number | string | null | undefined, decimals: number = 2): string {
  if (num === null || num === undefined || num === '') {
    return '0.00'
  }

  const numValue = typeof num === 'string' ? parseFloat(num) : num

  if (isNaN(numValue)) {
    return '0.00'
  }

  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Format a quantity with appropriate decimal places based on unit
 * @param quantity - The quantity to format
 * @param unit - The unit of measurement (optional)
 * @returns Formatted quantity string
 */
export function formatQuantity(quantity: number | string | null | undefined, unit?: string): string {
  if (quantity === null || quantity === undefined || quantity === '') {
    return '0.00'
  }

  const numQty = typeof quantity === 'string' ? parseFloat(quantity) : quantity

  if (isNaN(numQty)) {
    return '0.00'
  }

  // Use 4 decimal places for precise quantities, 2 for whole units like EA
  const decimals = unit === 'EA' ? 0 : 4

  const formatted = numQty.toLocaleString('en-US', {
    minimumFractionDigits: unit === 'EA' ? 0 : 2,
    maximumFractionDigits: decimals,
  })

  return unit ? `${formatted} ${unit}` : formatted
}
