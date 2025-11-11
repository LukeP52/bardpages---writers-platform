import { ReactNode } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export default function EmptyState({ 
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-6 py-16 px-4 ${className}`}>
      <div className="flex flex-col items-center space-y-4 text-center">
        {icon && (
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
            {icon}
          </div>
        )}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 max-w-md">{description}</p>
        </div>
      </div>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn btn-primary"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          {actionLabel}
        </button>
      )}
    </div>
  )
}