import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export default function ErrorState({ 
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  className = ''
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-6 py-12 ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 max-w-md">{message}</p>
        </div>
      </div>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-secondary"
        >
          <ArrowPathIcon className="w-4 h-4 mr-2" />
          Try Again
        </button>
      )}
    </div>
  )
}