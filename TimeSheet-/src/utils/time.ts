/**
 * Format seconds into HH:MM:SS format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return [hours, minutes, secs]
    .map((val) => String(val).padStart(2, '0'))
    .join(':')
}

/**
 * Format seconds into human-readable format (e.g., "2h 30m")
 */
export function formatDurationShort(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h`
  } else if (minutes > 0) {
    return `${minutes}m`
  } else {
    return '< 1m'
  }
}

/**
 * Format time range (e.g., "9:00 AM - 5:30 PM")
 */
export function formatTimeRange(start: string, end: string): string {
  const startTime = new Date(start).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  const endTime = new Date(end).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${startTime} - ${endTime}`
}

/**
 * Format date (e.g., "Jan 15, 2024")
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format date with day name (e.g., "Monday, Jan 15")
 */
export function formatDateWithDay(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Check if date is today
 */
export function isToday(date: string): boolean {
  const today = new Date()
  const check = new Date(date)
  return (
    check.getDate() === today.getDate() &&
    check.getMonth() === today.getMonth() &&
    check.getFullYear() === today.getFullYear()
  )
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: string): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const check = new Date(date)
  return (
    check.getDate() === yesterday.getDate() &&
    check.getMonth() === yesterday.getMonth() &&
    check.getFullYear() === yesterday.getFullYear()
  )
}

/**
 * Get relative date label (Today, Yesterday, or formatted date)
 */
export function getRelativeDateLabel(date: string): string {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return formatDateWithDay(date)
}
