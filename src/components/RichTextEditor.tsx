'use client'

import { Editor } from '@tinymce/tinymce-react'
import { useRef, useState, useEffect } from 'react'

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
  const editorRef = useRef<any>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleEditorChange = (content: string) => {
    onChange(content)
  }

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
      <Editor
        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "no-api-key"}
        onInit={(evt, editor) => editorRef.current = editor}
        value={value}
        onEditorChange={handleEditorChange}
        init={{
          height,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'charmap',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'table', 'help', 'wordcount'
          ],
          toolbar: readonly ? false : 
            'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
          content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px }',
          placeholder,
          resize: false,
          branding: false,
          elementpath: false,
          statusbar: true,
          setup: (editor: any) => {
            editor.on('init', () => {
              if (readonly) {
                editor.mode.set('readonly')
              }
            })
          }
        }}
      />
    </div>
  )
}