'use client'

import { useState, useEffect, useRef } from 'react'

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  if (!isMounted) {
    return (
      <div 
        className="border border-gray-300 rounded-lg p-4 bg-gray-50 animate-pulse"
        style={{ height }}
      >
        <div className="text-gray-500">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className="rich-text-editor">
      <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        {/* Simple toolbar for basic formatting */}
        {!readonly && (
          <div className="bg-gray-50 border-b border-gray-300 px-3 py-2">
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                title="This is a placeholder editor - replace with your preferred rich text editor"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                title="This is a placeholder editor - replace with your preferred rich text editor"
              >
                <em>I</em>
              </button>
              <div className="border-l border-gray-300 mx-2"></div>
              <span className="text-gray-500 text-xs py-1">
                Placeholder Editor - Replace with your preferred rich text editor
              </span>
            </div>
          </div>
        )}
        
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          readOnly={readonly}
          className="w-full p-4 resize-none border-0 focus:outline-none font-mono text-sm leading-relaxed"
          style={{ 
            minHeight: height,
            maxHeight: readonly ? height : 'none'
          }}
        />
      </div>
      
      {/* Word count */}
      <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
        <span>Word count: {value.trim().split(/\s+/).filter(word => word.length > 0).length}</span>
        {!readonly && (
          <span className="text-xs text-blue-600">
            💡 This is a basic text editor. Replace RichTextEditor component with your preferred editor.
          </span>
        )}
      </div>
    </div>
  )
}