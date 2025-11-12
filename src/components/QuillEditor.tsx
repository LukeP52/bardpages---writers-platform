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
  ['pagebreak'],
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
  'pagebreak',
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

      // Custom Page Break Blot
      const Embed = QuillConstructor.import('blots/embed') as any
      
      class PageBreak extends Embed {
        static create(value: any) {
          const node = super.create()
          node.innerHTML = `
            <div class="ql-page-break" style="
              display: flex; 
              align-items: center; 
              margin: 20px 0; 
              user-select: none;
              border: 2px dashed #ccc;
              padding: 10px;
              background: #f8f9fa;
              border-radius: 4px;
            ">
              <div style="
                flex: 1; 
                height: 2px; 
                background: linear-gradient(to right, #ddd, transparent);
              "></div>
              <span style="
                padding: 0 15px; 
                font-size: 12px; 
                color: #666; 
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 1px;
              ">Page Break</span>
              <div style="
                flex: 1; 
                height: 2px; 
                background: linear-gradient(to left, #ddd, transparent);
              "></div>
            </div>
          `
          return node
        }
        
        static value(node: any) {
          return true
        }
      }
      
      PageBreak.blotName = 'pagebreak'
      PageBreak.tagName = 'div'
      PageBreak.className = 'ql-page-break-container'
      
      QuillConstructor.register(PageBreak, true)

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

      // Add custom toolbar handler for page breaks
      const toolbar = quillInstance.getModule('toolbar') as any
      toolbar.addHandler('pagebreak', () => {
        const range = quillInstance.getSelection()
        if (range) {
          quillInstance.insertEmbed(range.index, 'pagebreak', true, 'user')
          quillInstance.setSelection(range.index + 1, 0, 'silent')
        }
      })

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

  return (
    <>
      <style jsx global>{`
        /* Page break styling for editor */
        .ql-page-break-container {
          display: block !important;
          margin: 20px 0 !important;
        }
        
        .ql-page-break {
          page-break-after: always;
          page-break-inside: avoid;
        }
        
        /* Text selection styling for Quill editor */
        .ql-editor ::selection {
          background-color: #3b82f6 !important; /* Blue background */
          color: white !important; /* White text */
        }
        
        .ql-editor ::-moz-selection {
          background-color: #3b82f6 !important; /* Blue background for Firefox */
          color: white !important; /* White text */
        }
        
        /* Alternative selection styling with better contrast */
        .ql-container .ql-editor {
          selection-background-color: #3b82f6;
        }
        
        sup {
          color: #2563eb !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          font-size: 0.75em !important;
          line-height: 1 !important;
          vertical-align: super !important;
          text-decoration: none !important;
        }
        
        sup:hover {
          color: #1d4ed8 !important;
          background-color: #eff6ff !important;
          border-radius: 2px !important;
          padding: 1px 2px !important;
        }
        
        /* Page break toolbar button styling */
        .ql-toolbar .ql-pagebreak::before {
          content: "⏎";
          font-size: 16px;
          font-weight: bold;
        }
        
        .ql-toolbar .ql-pagebreak {
          width: 28px !important;
        }
        
        .ql-toolbar .ql-pagebreak:hover {
          background: #f0f0f0;
        }
        
        /* Print styles for page breaks */
        @media print {
          .ql-page-break-container {
            page-break-after: always;
            page-break-inside: avoid;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: transparent !important;
            display: none !important;
          }
        }
      `}</style>
      <div ref={containerRef} className={className} />
    </>
  )
}

