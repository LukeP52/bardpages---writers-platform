'use client'

import { useEffect, useRef } from 'react'
import type Quill from 'quill'

type QuillEditorProps = {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}

export default function QuillEditor({
  value,
  onChange,
  placeholder,
}: QuillEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const quillRef = useRef<Quill | null>(null)
  const initialValueRef = useRef(value)

  useEffect(() => {
    let isMounted = true

    async function initEditor() {
      const QuillModule = await import('quill')
      const QuillConstructor = QuillModule.default

      if (!isMounted || !containerRef.current || quillRef.current) {
        return
      }

      const quillInstance = new QuillConstructor(containerRef.current, {
        theme: 'snow',
        placeholder,
      })

      quillRef.current = quillInstance

      if (typeof initialValueRef.current === 'string') {
        quillInstance.clipboard.dangerouslyPasteHTML(initialValueRef.current)
      }

      quillInstance.on('text-change', () => {
        if (onChange) {
          onChange(quillInstance.root.innerHTML)
        }
      })
    }

    void initEditor()

    return () => {
      isMounted = false
      if (quillRef.current) {
        quillRef.current.off('text-change')
        quillRef.current = null
      }
    }
  }, [onChange, placeholder])

  useEffect(() => {
    if (
      quillRef.current &&
      typeof value === 'string' &&
      quillRef.current.root.innerHTML !== value
    ) {
      const selection = quillRef.current.getSelection()
      quillRef.current.clipboard.dangerouslyPasteHTML(value)
      if (selection) {
        quillRef.current.setSelection(selection)
      }
    }
  }, [value])

  return <div ref={containerRef} />
}

