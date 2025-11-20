export function useValidation() {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  /**
   * Validates a single email address
   */
  function isValidEmail(email: string): boolean {
    return emailRegex.test(email.trim())
  }

  /**
   * Validates multiple email addresses
   * @returns Object with valid and invalid email arrays
   */
  function validateEmails(emails: string[]): {
    valid: string[]
    invalid: string[]
    isValid: boolean
  } {
    const valid: string[] = []
    const invalid: string[] = []

    emails.forEach(email => {
      const trimmedEmail = email.trim()
      if (isValidEmail(trimmedEmail)) {
        valid.push(trimmedEmail)
      } else {
        invalid.push(trimmedEmail)
      }
    })

    return {
      valid,
      invalid,
      isValid: invalid.length === 0
    }
  }

  /**
   * Validates that a value is not empty
   */
  function isNotEmpty(value: string | any[]): boolean {
    if (typeof value === 'string') {
      return value.trim().length > 0
    }
    return Array.isArray(value) && value.length > 0
  }

  /**
   * Validates that end date is after start date
   */
  function isEndDateAfterStartDate(startDate: string, endDate: string): boolean {
    if (!startDate || !endDate) return false
    return new Date(endDate) > new Date(startDate)
  }

  /**
   * Validates a date range
   * @returns Object with validation result and error message
   */
  function validateDateRange(startDate: string, endDate: string): {
    isValid: boolean
    error?: string
  } {
    if (!startDate) {
      return { isValid: false, error: 'Start date is required' }
    }
    if (!endDate) {
      return { isValid: false, error: 'End date is required' }
    }
    if (!isEndDateAfterStartDate(startDate, endDate)) {
      return { isValid: false, error: 'End date must be after start date' }
    }
    return { isValid: true }
  }

  /**
   * Validates that a date is not in the past
   */
  function isDateNotInPast(date: string): boolean {
    if (!date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(date) >= today
  }

  /**
   * Validates required fields in a form state
   */
  function validateRequiredFields(fields: Record<string, any>, requiredFields: string[]): {
    isValid: boolean
    missingFields: string[]
  } {
    const missingFields = requiredFields.filter(field => {
      const value = fields[field]
      if (value === undefined || value === null) return true
      if (typeof value === 'string' && value.trim() === '') return true
      if (Array.isArray(value) && value.length === 0) return true
      return false
    })

    return {
      isValid: missingFields.length === 0,
      missingFields
    }
  }

  return {
    isValidEmail,
    validateEmails,
    isNotEmpty,
    isEndDateAfterStartDate,
    validateDateRange,
    isDateNotInPast,
    validateRequiredFields,
    emailRegex
  }
}
