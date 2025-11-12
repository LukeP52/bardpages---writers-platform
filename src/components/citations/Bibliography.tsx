'use client'

import { useMemo } from 'react'
import { useCitationStore } from '@/stores/citationStore'
import { CitationFormatter } from '@/services/citationFormatter'
import { Source, CitationStyle } from '@/types/citations'

interface BibliographyProps {
  excerptId: string
  style?: CitationStyle
  className?: string
}

export default function Bibliography({ 
  excerptId, 
  style, 
  className = '' 
}: BibliographyProps) {
  const { getSourcesForExcerpt, getAnnotationsForExcerpt } = useCitationStore()
  
  const sources = getSourcesForExcerpt(excerptId)
  const annotations = getAnnotationsForExcerpt(excerptId)
  
  const citationStyle = style || CitationFormatter.getAvailableStyles()[0]

  const bibliography = useMemo(() => {
    // Only include sources that are actually cited
    const citedSources = sources.filter(source => 
      annotations.some(annotation => annotation.sourceId === source.id)
    )
    
    if (citedSources.length === 0) return []
    
    return CitationFormatter.formatBibliography(citedSources, citationStyle)
  }, [sources, annotations, citationStyle])

  if (bibliography.length === 0) {
    return null
  }

  return (
    <div className={`bibliography ${className}`}>
      <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">
        References
      </h3>
      
      <div className="space-y-3">
        {bibliography.map((citation, index) => (
          <div 
            key={citation.id}
            id={`cite-${index + 1}`}
            className="text-sm text-slate-700 leading-relaxed"
          >
            <span className="font-medium text-slate-900 mr-2">
              [{index + 1}]
            </span>
            <span dangerouslySetInnerHTML={{ __html: citation.full }} />
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          Formatted in {citationStyle.name} style
        </p>
      </div>
    </div>
  )
}

// Hook for getting formatted bibliography data
export const useBibliography = (excerptId: string, style?: CitationStyle) => {
  const { getSourcesForExcerpt, getAnnotationsForExcerpt } = useCitationStore()
  
  return useMemo(() => {
    const sources = getSourcesForExcerpt(excerptId)
    const annotations = getAnnotationsForExcerpt(excerptId)
    const citationStyle = style || CitationFormatter.getAvailableStyles()[0]
    
    const citedSources = sources.filter(source => 
      annotations.some(annotation => annotation.sourceId === source.id)
    )
    
    if (citedSources.length === 0) {
      return { bibliography: [], hasCitations: false }
    }
    
    const bibliography = CitationFormatter.formatBibliography(citedSources, citationStyle)
    
    return { 
      bibliography, 
      hasCitations: true,
      style: citationStyle,
      sourceCount: citedSources.length
    }
  }, [excerptId, style, getSourcesForExcerpt, getAnnotationsForExcerpt])
}