import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Returns the current unix timestamp in seconds. */
export function nowSecs(): number {
  return Math.floor(Date.now() / 1000)
}
