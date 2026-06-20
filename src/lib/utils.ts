import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const LOW_STOCK_THRESHOLD = 10

export const NEAR_EXPIRY_DAYS = 30

export type ExpiryStatus = 'expired' | 'warning' | 'normal'

export interface ExpiryStatusInfo {
  status: ExpiryStatus
  label: string
  color: string
  daysLeft: number
}

export const getExpiryStatus = (expiryDate: Date | string | number): ExpiryStatusInfo => {
  const expiry = new Date(expiryDate)
  const now = new Date()
  const msPerDay = 24 * 60 * 60 * 1000
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const expiryStartOfDay = new Date(
    expiry.getFullYear(),
    expiry.getMonth(),
    expiry.getDate()
  )
  const daysLeft = Math.ceil(
    (expiryStartOfDay.getTime() - startOfDay.getTime()) / msPerDay
  )

  if (daysLeft < 0) {
    return {
      status: 'expired',
      label: `已过期 ${Math.abs(daysLeft)} 天`,
      color: 'red',
      daysLeft,
    }
  }

  if (daysLeft <= NEAR_EXPIRY_DAYS) {
    return {
      status: 'warning',
      label: daysLeft === 0 ? '今日到期' : `剩 ${daysLeft} 天`,
      color: 'orange',
      daysLeft,
    }
  }

  return {
    status: 'normal',
    label: `剩 ${daysLeft} 天`,
    color: 'green',
    daysLeft,
  }
}

export const isLowStock = (stock: number, threshold = LOW_STOCK_THRESHOLD): boolean =>
  stock < threshold
