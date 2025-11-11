'use client'

import { Editor } from '@tinymce/tinymce-react'
import { useRef } from 'react'

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

  const handleEditorChange = (content: string) => {
    onChange(content)
  }

  return (
    <div className="rich-text-editor">
      <Editor
        onInit={(evt, editor) => editorRef.current = editor}
        value={value}
        onEditorChange={handleEditorChange}
        init={{
          height,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
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