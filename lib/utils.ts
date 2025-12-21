import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function getRelativeTime(date: Date | any): string {
  let dateObj: Date
  
  if (date?.toDate) {
    dateObj = date.toDate()
  } else if (date instanceof Date) {
    dateObj = date
  } else {
    dateObj = new Date(date)
  }
  
  if (isNaN(dateObj.getTime())) {
    return 'just now'
  }
  
  const nowUtc = new Date()
  const dateUtc = new Date(dateObj.toISOString())
  const diffMs = nowUtc.getTime() - dateUtc.getTime()
  
  if (diffMs < 0) {
    return 'just now'
  }
  
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  
  if (diffSec < 10) {
    return 'just now'
  } else if (diffSec < 60) {
    return 'just now'
  } else if (diffMin === 1) {
    return '1 minute ago'
  } else if (diffMin < 60) {
    return `${diffMin} minutes ago`
  } else if (diffHour === 1) {
    return '1 hour ago'
  } else if (diffHour < 24) {
    return `${diffHour} hours ago`
  } else if (diffDay === 1) {
    return 'yesterday'
  } else if (diffDay < 7) {
    return `${diffDay} days ago`
  } else if (diffDay < 14) {
    return '1 week ago'
  } else if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7)
    return `${weeks} weeks ago`
  } else if (diffDay < 60) {
    return '1 month ago'
  } else if (diffDay < 365) {
    const months = Math.floor(diffDay / 30)
    return `${months} months ago`
  } else if (diffDay < 730) {
    return '1 year ago'
  } else {
    const years = Math.floor(diffDay / 365)
    return `${years} years ago`
  }
}

export function getExactTimestamp(date: Date | any): string {
  let dateObj: Date
  
  if (date?.toDate) {
    dateObj = date.toDate()
  } else if (date instanceof Date) {
    dateObj = date
  } else {
    dateObj = new Date(date)
  }
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date'
  }
  
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
}
