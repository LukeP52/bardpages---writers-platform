'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Excerpt } from '@/types'
import { storage } from '@/lib/storage'
import ExcerptForm from '@/components/ExcerptForm'

interface EditExcerptPageProps {
  params: Promise<{ id: string }> | { id: string }
}

export default function EditExcerptPage({ params }: EditExcerptPageProps) {
  const router = useRouter()
  const [excerpt, setExcerpt] = useState<Excerpt | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadExcerpt = async () => {
      // Handle both Promise and direct params (Next.js 13+ compatibility)
      const resolvedParams = await Promise.resolve(params)
      const excerptId = resolvedParams.id
      
      console.log('Edit page loading for excerpt ID:', excerptId)
      
      if (typeof window !== 'undefined') {
        const cacheKey = `editing_excerpt_${excerptId}`
        console.log('Looking for cached excerpt with key:', cacheKey)
        
        const cachedExcerpt = sessionStorage.getItem(cacheKey)
        console.log('Cached excerpt found:', cachedExcerpt ? 'YES' : 'NO')
        
        if (cachedExcerpt) {
          try {
            console.log('Parsing cached excerpt data...')
            const parsed = JSON.parse(cachedExcerpt)
            console.log('Parsed cached data:', parsed)
            
            setExcerpt({
              ...parsed,
              createdAt: parsed.createdAt
                ? new Date(parsed.createdAt)
                : new Date(),
              updatedAt: parsed.updatedAt
                ? new Date(parsed.updatedAt)
                : new Date(),
            })
            setIsLoading(false)
            sessionStorage.removeItem(cacheKey)
            console.log('Successfully loaded from cache')
            return
          } catch (error) {
            console.warn('Failed to parse cached excerpt data:', error)
          }
        }
      }

      console.log('No cache found, trying localStorage...')
      const loadedExcerpt = storage.getExcerpt(excerptId)
      console.log('localStorage excerpt found:', loadedExcerpt ? 'YES' : 'NO')
      
      if (!loadedExcerpt) {
        console.log('No excerpt found anywhere, showing error')
        setIsLoading(false)
        setExcerpt(null)
        return
      }
      setExcerpt(loadedExcerpt)
      setIsLoading(false)
    }

    loadExcerpt()
  }, [params])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="h-96 bg-gray-200 rounded mb-6"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!excerpt) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-2 border-black bg-white p-10 text-center space-y-4">
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