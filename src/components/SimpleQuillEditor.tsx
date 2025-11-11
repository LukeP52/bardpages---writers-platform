'use client'

import { useEffect, useRef } from 'react'

interface SimpleQuillEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  height?: number
}

export default function SimpleQuillEditor({ 
  value = '', 
  onChange, 
  placeholder = "Start writing...",
  height = 400
}: SimpleQuillEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<any>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    async function initQuill() {
      if (initializedRef.current || !containerRef.current) return
      
      try {
        // Dynamic import with better error handling
        const { default: Quill } = await import('quill')
        
        if (!containerRef.current) return
        
        // Simple toolbar configuration
        const options = {
          theme: 'snow',
          placeholder,
          modules: {
            toolbar: [
              ['bold', 'italic', 'underline'],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              ['link'],
              ['clean']
            ]
          }
        }

        quillRef.current = new Quill(containerRef.current, options)
        initializedRef.current = true

        // Set initial content
        if (value) {
          quillRef.current.clipboard.dangerouslyPasteHTML(value)
        }

        // Listen for changes
        quillRef.current.on('text-change', () => {
          const html = quillRef.current.root.innerHTML
          onChange?.(html)
        })

        console.log('SimpleQuillEditor: Initialized successfully')
      } catch (error) {
        console.error('SimpleQuillEditor: Failed to initialize:', error)
        
        // Fallback to textarea if Quill fails
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <textarea 
              placeholder="${placeholder}"
              style="width: 100%; height: ${height - 50}px; padding: 12px; border: 1px solid #ccc; border-radius: 6px; font-family: inherit;"
            >${value}</textarea>
          `
          
          const textarea = containerRef.current.querySelector('textarea')
          textarea?.addEventListener('input', (e) => {
            onChange?.((e.target as HTMLTextAreaElement).value)
          })
        }
      }
    }

    // Small delay to ensure DOM is ready
    setTimeout(initQuill, 50)

    return () => {
      if (quillRef.current) {
        quillRef.current = null
      }
      initializedRef.current = false
    }
  }, [])

  // Update content when value prop changes
  useEffect(() => {
    if (quillRef.current && initializedRef.current) {
      const currentContent = quillRef.current.root.innerHTML
      if (currentContent !== value) {
        quillRef.current.clipboard.dangerouslyPasteHTML(value || '')
      }
    }
  }, [value])

  return (
    <div className="simple-quill-editor">
      <div 
        ref={containerRef}
        style={{ minHeight: height }}
        className="border border-gray-300 rounded-lg overflow-hidden"
      />
      
      <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
        <span>Powered by Quill</span>
      </div>
    </div>
  )
}