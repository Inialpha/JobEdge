import { cn } from "@/lib/utils"

interface CircularLoaderProps {
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export default function CircularLoader({ size = 'medium', className }: CircularLoaderProps = {}) {
  const sizeClasses = {
    small: 'w-6 h-6 border-2',
    medium: 'w-10 h-10 border-3',
    large: 'w-16 h-16 border-4',
  }

  return (
    <div
      className={cn(
        "inline-block animate-spin rounded-full border-solid border-green-500 border-t-transparent",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}
