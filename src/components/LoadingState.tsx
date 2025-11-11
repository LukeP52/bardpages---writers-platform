import LoadingSpinner from './LoadingSpinner'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function LoadingState({ 
  message = 'Loading...', 
  size = 'md',
  className = ''
}: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 py-12 ${className}`}>
      <LoadingSpinner size={size} />
      <p className="text-secondary font-medium">{message}</p>
    </div>
  )
}