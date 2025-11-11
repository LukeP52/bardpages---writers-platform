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

      quillRef.current = new QuillConstructor(containerRef.current, {
        theme: 'snow',
        placeholder,
      })

      if (typeof initialValueRef.current === 'string') {
        quillRef.current.clipboard.dangerouslyPasteHTML(
          initialValueRef.current
        )
      }

      quillRef.current.on('text-change', () => {
        if (onChange) {
          onChange(quillRef.current.root.innerHTML)
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

