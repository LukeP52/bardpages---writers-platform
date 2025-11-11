'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Excerpt } from '@/types'
import { storage } from '@/lib/storage'
import ExcerptForm from '@/components/ExcerptForm'

interface EditExcerptPageProps {
  params: { id: string }
}

export default function EditExcerptPage({ params }: EditExcerptPageProps) {
  const router = useRouter()
  const [excerpt, setExcerpt] = useState<Excerpt | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadedExcerpt = storage.getExcerpt(params.id)
    if (!loadedExcerpt) {
      router.push('/excerpts')
      return
    }
    setExcerpt(loadedExcerpt)
    setIsLoading(false)
  }, [params.id, router])

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
    return null
  }

  return <ExcerptForm excerpt={excerpt} mode="edit" />
}