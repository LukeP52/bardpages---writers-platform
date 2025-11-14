'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Excerpt } from '@/types'
import { useStorage } from '@/contexts/StorageContext'
import LoadingState from '@/components/LoadingState'
import RichTextEditor from '@/components/RichTextEditor'

interface ExcerptDetailPageProps {
  params: { id: string }
}

export default function ExcerptDetailPage({ params }: ExcerptDetailPageProps) {
  const router = useRouter()
  const [excerpt, setExcerpt] = useState<Excerpt | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const storage = useStorage()

  useEffect(() => {
    let mounted = true
    
    const loadExcerpt = async () => {
      // Don't try to load if storage is still initializing
      if (storage.isLoading) {
        console.log('Storage still loading, skipping excerpt load')
        return
      }
      
      // Only proceed if component is still mounted and we haven't already loaded
      if (!mounted || excerpt) {
        return
      }
      
      // Add a small delay to ensure storage is fully ready
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Check if component is still mounted after delay
      if (!mounted) return
      
      try {
        const loadedExcerpt = await storage.getExcerpt(params.id)
        
        if (mounted) {
          setExcerpt(loadedExcerpt || null)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error loading excerpt:', error)
        if (mounted) {
          setExcerpt(null)
          setIsLoading(false)
        }
      }
    }

    loadExcerpt()
    
    return () => {
      mounted = false
    }
  }, [params.id, storage.isLoading])

  const handleDelete = async () => {
    if (!excerpt) return
    
    const confirmed = confirm(`Are you sure you want to delete "${excerpt.title}"? This action cannot be undone.`)
    if (!confirmed) return

    await storage.deleteExcerpt(excerpt.id)
    router.push('/excerpts')
  }

  if (isLoading) {
    return <LoadingState message="Loading excerpt..." />
  }

  if (!excerpt) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Excerpt Not Found</h1>
          <p className="text-gray-500 mb-6">The excerpt you're looking for doesn't exist or may have been deleted.</p>
          <Link
            href="/excerpts"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Excerpts
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{excerpt.title}</h1>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>{excerpt.wordCount} words</span>
            <span>•</span>
            <span>Created {excerpt.createdAt.toLocaleDateString()}</span>
            <span>•</span>
            <span>Updated {excerpt.updatedAt.toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/excerpts/${excerpt.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {excerpt.tags.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {excerpt.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <RichTextEditor
            value={excerpt.content}
            onChange={() => {}}
            readonly={true}
            height={500}
          />
          
          {excerpt.imageUrl && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <img 
                src={excerpt.imageUrl} 
                alt={excerpt.title} 
                className="max-w-full h-auto rounded-lg border border-gray-200"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <Link
          href="/excerpts"
          className="text-blue-600 hover:text-blue-800 transition-colors"
        >
          ← Back to Excerpts
        </Link>
        <Link
          href={`/excerpts/${excerpt.id}/edit`}
          className="text-blue-600 hover:text-blue-800 transition-colors"
        >
          Edit this excerpt →
        </Link>
      </div>
    </div>
  )
}