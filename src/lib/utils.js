import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Room type styles mapping from hardcoded colors to theme variables
export const roomTypeStyleMapping = {
  // Map blue colors to primary
  'bg-blue-100': 'bg-primary/10',
  'bg-blue-50': 'bg-primary/5',
  'text-blue-100': 'text-primary-foreground/80',
  'text-blue-600': 'text-primary',
  'text-blue-700': 'text-primary',
  'text-blue-800': 'text-primary-foreground',
  'hover:bg-blue-700': 'hover:bg-primary/90',
  'border-blue-300': 'border-primary/30',
  'border-blue-400': 'border-primary/40',
  'border-blue-500': 'border-primary/50',
  'from-blue-50': 'from-primary/5',
  'to-blue-100': 'to-primary/10',
  'from-blue-700': 'from-primary',
  'to-blue-600': 'to-primary/90',
  'bg-blue-600': 'bg-primary',
  'bg-blue-800': 'bg-primary-foreground/10',
  'ring-blue-400': 'ring-primary/40',
  'ring-blue-500': 'ring-primary/50',
  'hover:text-blue-600': 'hover:text-primary',
  'hover:bg-blue-50': 'hover:bg-primary/5',
  
  // Map other colors as needed
  'bg-gray-100': 'bg-muted',
  'bg-gray-50': 'bg-muted/50',
  'text-gray-400': 'text-muted-foreground',
  'text-gray-500': 'text-muted-foreground',
  'text-gray-600': 'text-muted-foreground',
  'text-gray-700': 'text-foreground/80',
  'text-gray-800': 'text-foreground',
  'border-gray-200': 'border-border',
  'border-gray-300': 'border-border',
  'hover:bg-gray-300': 'hover:bg-muted-foreground/20',
  'from-gray-50': 'from-muted/50',
  'to-gray-100': 'to-muted'
}
