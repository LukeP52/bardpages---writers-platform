'use client'

import { useEffect, useRef } from 'react'
import type Quill from 'quill'

const DEFAULT_TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ size: ['small', false, 'large', 'huge'] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ script: 'sub' }, { script: 'super' }],
  ['blockquote', 'code-block'],
  [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  [{ color: [] }, { background: [] }],
  ['link', 'image'],
  ['clean'],
]

const DEFAULT_FORMATS = [
  'header',
  'font',
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'script',
  'blockquote',
  'code-block',
  'list',
  'indent',
  'align',
  'color',
  'background',
  'link',
  'image',
]

type QuillEditorProps = {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  modules?: Record<string, unknown>
  formats?: string[]
  onSelectionChange?: (range: { index: number; length: number } | null, source: string) => void
  quillRef?: React.MutableRefObject<Quill | null>
}

export default function QuillEditor({
  value,
  onChange,
  placeholder,
  className,
  modules,
  formats,
  onSelectionChange,
  quillRef: externalQuillRef,
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

      const Font = QuillConstructor.import('formats/font') as any
      if (Font && Array.isArray(Font.whitelist)) {
        Font.whitelist = [
          'sans-serif',
          'serif',
          'monospace',
          'arial',
          'times-new-roman',
        ]
      }
      QuillConstructor.register(Font, true)

      const Size = QuillConstructor.import('formats/size') as any
      if (Size && Array.isArray(Size.whitelist)) {
        Size.whitelist = ['small', false, 'large', 'huge']
      }
      QuillConstructor.register(Size, true)

      const quillInstance = new QuillConstructor(containerRef.current, {
        theme: 'snow',
        placeholder,
        modules: {
          toolbar: DEFAULT_TOOLBAR_OPTIONS,
          history: {
            delay: 1000,
            maxStack: 100,
            userOnly: true,
          },
          ...(modules ?? {}),
        },
        formats: formats ?? DEFAULT_FORMATS,
      })

      quillRef.current = quillInstance
      
      // Expose quill instance to parent if ref provided
      if (externalQuillRef) {
        externalQuillRef.current = quillInstance
      }

      if (typeof initialValueRef.current === 'string') {
        quillInstance.clipboard.dangerouslyPasteHTML(initialValueRef.current)
      }

      quillInstance.on('text-change', () => {
        if (onChange) {
          onChange(quillInstance.root.innerHTML)
        }
      })
      
      quillInstance.on('selection-change', (range, oldRange, source) => {
        if (onSelectionChange) {
          onSelectionChange(range, source)
        }
      })
    }

    void initEditor()

    return () => {
      isMounted = false
      if (quillRef.current) {
        quillRef.current.off('text-change')
        quillRef.current.off('selection-change')
        quillRef.current = null
      }
      if (externalQuillRef) {
        externalQuillRef.current = null
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

  return <div ref={containerRef} className={className} />
}

