interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'white' | 'gray'
  className?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  const colorClasses = {
    primary: 'text-blue-600',
    white: 'text-white',
    gray: 'text-gray-400'
  }

  return (
    <div className={`inline-block animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
      <svg 
        className="w-full h-full" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="m12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6z"
        />
      </svg>
    </div>
  )
}