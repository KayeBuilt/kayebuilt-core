import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Standard shadcn/ui utility: merges conditional class lists and resolves conflicting Tailwind utility classes (last one wins). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
