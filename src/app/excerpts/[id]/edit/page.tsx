'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Excerpt } from '@/types'
import { useStorage } from '@/contexts/StorageContext'
import ExcerptForm from '@/components/ExcerptForm'
import LoadingState from '@/components/LoadingState'

interface EditExcerptPageProps {
  params: Promise<{ id: string }> | { id: string }
}

export default function EditExcerptPage({ params }: EditExcerptPageProps) {
  const router = useRouter()
  const [excerpt, setExcerpt] = useState<Excerpt | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const storage = useStorage()

  useEffect(() => {
    const loadExcerpt = async () => {
      try {
        // Handle both Promise and direct params (Next.js 13+ compatibility)
        const resolvedParams = await Promise.resolve(params)
        const excerptId = resolvedParams.id
        
        // Try session cache first (for editing navigation flow)
        if (typeof window !== 'undefined') {
          const cacheKey = `editing_excerpt_${excerptId}`
          const cachedExcerpt = sessionStorage.getItem(cacheKey)
          
          if (cachedExcerpt) {
            try {
              const parsed = JSON.parse(cachedExcerpt)
              setExcerpt({
                ...parsed,
                createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(),
                updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : new Date(),
              })
              sessionStorage.removeItem(cacheKey)
              return
            } catch (error) {
              console.warn('Failed to parse cached excerpt data:', error)
            }
          }
        }

        // Load from storage
        const loadedExcerpt = await storage.getExcerpt(excerptId)
        setExcerpt(loadedExcerpt || null)
        
      } catch (error) {
        console.error('Error loading excerpt for editing:', error)
        setExcerpt(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadExcerpt()
  }, [params, storage])

  if (isLoading) {
    return <LoadingState message="Loading excerpt..." />
  }

  if (!excerpt) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card bg-white p-10 text-center space-y-4">
          <h2 className="text-2xl font-bold text-black">Excerpt Not Found</h2>
          <p className="text-gray-600">
            We couldn&apos;t load this excerpt. If you created it in this browser, make sure local storage is enabled and try again.
          </p>
          <button
            onClick={() => router.push('/excerpts')}
            className="btn btn-primary"
          >
            Back to Excerpts
          </button>
        </div>
      </div>
    )
  }

  return <ExcerptForm excerpt={excerpt} mode="edit" />
}