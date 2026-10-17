import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge Tailwind CSS classes with conflict resolution.
 * Combines clsx for conditional classes and tailwind-merge for dedup.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
