'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useCitationStore } from '@/stores/citationStore'
import { TextSelection } from '@/types/citations'

interface TextAnnotatorProps {
  content: string
  excerptId: string
  quillRef?: React.MutableRefObject<any | null>
  onSelectionChange?: (selection: TextSelection | null) => void
}

export default function TextAnnotator({ 
  content, 
  excerptId, 
  quillRef,
  onSelectionChange 
}: TextAnnotatorProps) {
  const { 
    setCurrentExcerpt, 
    setTextSelection, 
    uiState, 
    getAnnotationsForExcerpt 
  } = useCitationStore()
  
  const lastSelectionRef = useRef<TextSelection | null>(null)

  // Initialize citation document for this excerpt
  useEffect(() => {
    if (excerptId) {
      setCurrentExcerpt(excerptId)
    }
  }, [excerptId, setCurrentExcerpt])

  const handleSelectionChange = useCallback(() => {
    // Only track selections when in annotation mode
    if (!uiState.isAnnotating) return

    let selection: TextSelection | null = null

    if (quillRef?.current) {
      // Get selection from Quill editor
      try {
        const range = quillRef.current.getSelection()
        if (range && range.length > 0) {
          const text = quillRef.current.getText(range.index, range.length)
          if (text.trim()) {
            selection = {
              text: text.trim(),
              startIndex: range.index,
              endIndex: range.index + range.length,
              isValid: true
            }
          }
        }
      } catch (error) {
        console.warn('Error getting Quill selection:', error)
      }
    } else {
      // Fallback to browser selection API
      const browserSelection = window.getSelection()
      if (browserSelection && browserSelection.toString().trim()) {
        const range = browserSelection.getRangeAt(0)
        
        // Calculate approximate indices based on text content
        const selectedText = browserSelection.toString().trim()
        const textContent = content.replace(/<[^>]*>/g, '') // Strip HTML
        const startIndex = textContent.indexOf(selectedText)
        
        if (startIndex !== -1) {
          selection = {
            text: selectedText,
            startIndex: startIndex,
            endIndex: startIndex + selectedText.length,
            isValid: true
          }
        }
      }
    }

    // Only update if selection has actually changed
    if (JSON.stringify(selection) !== JSON.stringify(lastSelectionRef.current)) {
      lastSelectionRef.current = selection
      setTextSelection(selection)
      onSelectionChange?.(selection)
    }
  }, [uiState.isAnnotating, quillRef, content, setTextSelection, onSelectionChange])

  // Set up selection listeners
  useEffect(() => {
    if (quillRef?.current) {
      // Quill selection change listener
      const quill = quillRef.current
      quill.on('selection-change', handleSelectionChange)
      
      return () => {
        if (quill) {
          quill.off('selection-change', handleSelectionChange)
        }
      }
    } else {
      // Browser selection change listener
      document.addEventListener('selectionchange', handleSelectionChange)
      
      return () => {
        document.removeEventListener('selectionchange', handleSelectionChange)
      }
    }
  }, [handleSelectionChange, quillRef])

  // Clear selection when annotation mode is disabled
  useEffect(() => {
    if (!uiState.isAnnotating) {
      lastSelectionRef.current = null
      setTextSelection(null)
      onSelectionChange?.(null)
    }
  }, [uiState.isAnnotating, setTextSelection, onSelectionChange])

  // This component doesn't render anything - it just manages text selection
  return null
}

// Hook for easier access to text annotation functionality
export const useTextAnnotation = (excerptId: string) => {
  const store = useCitationStore()
  
  return {
    isAnnotating: store.uiState.isAnnotating,
    currentSelection: store.uiState.currentSelection,
    startAnnotating: () => {
      store.setCurrentExcerpt(excerptId)
      store.startAnnotating()
    },
    stopAnnotating: store.stopAnnotating,
    addAnnotation: (sourceId: string) => {
      const { currentSelection } = store.uiState
      if (currentSelection?.isValid && currentSelection.text.trim()) {
        const annotation = store.addAnnotation(excerptId, {
          startIndex: currentSelection.startIndex,
          endIndex: currentSelection.endIndex,
          selectedText: currentSelection.text,
          sourceId
        })
        store.stopAnnotating()
        return annotation
      }
      return null
    },
    annotations: store.getAnnotationsForExcerpt(excerptId),
    sources: store.getSourcesForExcerpt(excerptId)
  }
}