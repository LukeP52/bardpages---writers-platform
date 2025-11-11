'use client'

import { useState, useEffect, useRef } from 'react'
import type Quill from 'quill'

interface RichTextEditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
  height?: number
  readonly?: boolean
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Start writing...",
  height = 400,
  readonly = false
}: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Track if we're in the middle of updating from props to avoid loops
  const isUpdatingFromProps = useRef(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    
    let isCancelled = false

    async function initEditor() {
      try {
        console.log('Initializing Quill editor...')
        
        const QuillModule = await import('quill')
        console.log('Quill module imported:', QuillModule)
        
        const QuillConstructor = QuillModule.default
        
        if (isCancelled || !containerRef.current || quillRef.current) {
          console.log('Editor initialization cancelled or already exists')
          return
        }

        console.log('Creating Quill instance...')

        // Configure toolbar based on readonly mode
        const toolbarOptions = readonly ? false : [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'indent': '-1'}, { 'indent': '+1' }],
          ['link', 'blockquote'],
          ['clean']
        ]

        const quillInstance = new QuillConstructor(containerRef.current, {
          theme: 'snow',
          placeholder,
          readOnly: readonly,
          modules: {
            toolbar: toolbarOptions
          }
        })

        quillRef.current = quillInstance
        console.log('Quill instance created successfully')

        // Set initial content
        if (value) {
          isUpdatingFromProps.current = true
          quillInstance.root.innerHTML = value
          isUpdatingFromProps.current = false
        }

        // Listen for changes
        quillInstance.on('text-change', () => {
          if (!isUpdatingFromProps.current && onChange) {
            const html = quillInstance.root.innerHTML || ''
            onChange(html)
          }
        })

        // Set height if specified
        if (height && containerRef.current) {
          const editorDiv = containerRef.current.querySelector('.ql-editor') as HTMLElement
          if (editorDiv) {
            editorDiv.style.minHeight = `${height - 100}px` // Account for toolbar
          }
        }

        setIsLoading(false)
        console.log('Quill editor initialization complete')
      } catch (error) {
        console.error('Failed to initialize Quill:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
        setIsLoading(false)
      }
    }

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(initEditor, 100)

    return () => {
      clearTimeout(timer)
      isCancelled = true
      if (quillRef.current) {
        quillRef.current.off('text-change')
        quillRef.current = null
      }
    }
  }, [isMounted, readonly, placeholder, height])

  // Update content when value prop changes
  useEffect(() => {
    if (quillRef.current && !isUpdatingFromProps.current) {
      const currentContent = quillRef.current.root.innerHTML
      if (currentContent !== value) {
        isUpdatingFromProps.current = true
        const selection = quillRef.current.getSelection()
        quillRef.current.root.innerHTML = value
        if (selection && !readonly) {
          // Restore selection if not readonly
          quillRef.current.setSelection(selection)
        }
        isUpdatingFromProps.current = false
      }
    }
  }, [value, readonly])

  // Calculate word count from HTML content
  const getWordCount = (html: string) => {
    const text = html.replace(/<[^>]*>/g, '').trim()
    return text.length > 0 ? text.split(/\s+/).length : 0
  }

  if (!isMounted) {
    return (
      <div 
        className="border border-gray-300 rounded-lg p-4 bg-gray-50"
        style={{ height }}
      >
        <div className="text-gray-500">Preparing editor...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div 
        className="border border-red-300 rounded-lg p-4 bg-red-50"
        style={{ height }}
      >
        <div className="text-red-600">
          <strong>Editor Error:</strong> {error}
          <br />
          <small>Please refresh the page to try again.</small>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div 
        className="border border-gray-300 rounded-lg p-4 bg-gray-50 animate-pulse"
        style={{ height }}
      >
        <div className="text-gray-500">Loading Quill editor...</div>
      </div>
    )
  }

  return (
    <div className="rich-text-editor">
      <div 
        ref={containerRef}
        className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent"
        style={{ minHeight: height }}
      />
      
      {/* Word count and info */}
      <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
        <span>Words: {getWordCount(value)}</span>
        <span className="text-xs text-green-600">
          ✨ Rich text editor powered by Quill
        </span>
      </div>
    </div>
  )
}