import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Intentionally untested — for PR CI failure verification. Remove after testing. */
export function ciFailureProbe(): boolean {
  return true
}
