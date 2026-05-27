import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAmount(amount: number | null): string {
  if (!amount) return 'Varies'
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'No deadline set'
  const date = new Date(deadline)
  return date.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function daysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null
  const now = new Date()
  const due = new Date(deadline)
  const diff = due.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function deadlineUrgency(days: number | null): 'overdue' | 'urgent' | 'soon' | 'upcoming' | null {
  if (days === null) return null
  if (days < 0) return 'overdue'
  if (days <= 7) return 'urgent'
  if (days <= 30) return 'soon'
  return 'upcoming'
}
