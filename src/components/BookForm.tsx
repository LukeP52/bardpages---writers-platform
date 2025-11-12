'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Book, Storyboard } from '@/types'
import { storage } from '@/lib/storage'

interface BookFormProps {
  book?: Book
  mode: 'create' | 'edit'
}

export default function BookForm({ book, mode }: BookFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(book?.title || '')
  const [subtitle, setSubtitle] = useState(book?.subtitle || '')
  const [author, setAuthor] = useState(book?.author || '')
  const [storyboardId, setStoryboardId] = useState(book?.storyboardId || '')
  const [genre, setGenre] = useState(book?.metadata.genre || '')
  const [description, setDescription] = useState(book?.metadata.description || '')
  const [language, setLanguage] = useState(book?.metadata.language || 'en')
  const [isbn, setIsbn] = useState(book?.metadata.isbn || '')
  
  // Typography & Layout
  const [fontFamily, setFontFamily] = useState(book?.formatting.fontFamily || 'Inter')
  const [fontSize, setFontSize] = useState(book?.formatting.fontSize || 12)
  const [lineHeight, setLineHeight] = useState(book?.formatting.lineHeight || 1.6)
  const [chapterBreakStyle, setChapterBreakStyle] = useState(book?.formatting.chapterBreakStyle || 'page-break')
  
  // Page Layout
  const [marginTop, setMarginTop] = useState(book?.formatting.marginTop || 1)
  const [marginBottom, setMarginBottom] = useState(book?.formatting.marginBottom || 1)
  const [marginLeft, setMarginLeft] = useState(book?.formatting.marginLeft || 1)
  const [marginRight, setMarginRight] = useState(book?.formatting.marginRight || 1)
  
  // Chapter Formatting
  const [useChapters, setUseChapters] = useState<boolean>(book?.formatting.useChapters !== undefined ? book.formatting.useChapters : true)
  const [chapterTitleFont, setChapterTitleFont] = useState(book?.formatting.chapterTitleFont || 'Inter')
  const [chapterTitleSize, setChapterTitleSize] = useState(book?.formatting.chapterTitleSize || 18)
  const [chapterNumberStyle, setChapterNumberStyle] = useState(book?.formatting.chapterNumberStyle || 'numeric')
  
  // Paragraph Formatting
  const [paragraphSpacing, setParagraphSpacing] = useState(book?.formatting.paragraphSpacing || 0.5)
  const [firstLineIndent, setFirstLineIndent] = useState(book?.formatting.firstLineIndent || 0.5)
  const [textAlignment, setTextAlignment] = useState(book?.formatting.textAlignment || 'left')
  
  // Advanced Options
  const [dropCapEnabled, setDropCapEnabled] = useState<boolean>(book?.formatting.dropCapEnabled || false)
  const [headerFooterEnabled, setHeaderFooterEnabled] = useState<boolean>(book?.formatting.headerFooterEnabled !== undefined ? book.formatting.headerFooterEnabled : true)
  const [pageNumbers, setPageNumbers] = useState(book?.formatting.pageNumbers || 'bottom-center')
  
  // Reference Formatting
  const [referenceStyle, setReferenceStyle] = useState(book?.formatting.referenceStyle || 'apa')
  const [citationStyle, setCitationStyle] = useState(book?.formatting.citationStyle || 'footnotes')
  const [includeReferences, setIncludeReferences] = useState<boolean>(book?.formatting.includeReferences !== undefined ? book.formatting.includeReferences : true)
  
  const [availableStoryboards, setAvailableStoryboards] = useState<Storyboard[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setAvailableStoryboards(storage.getStoryboards())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !author.trim() || !storyboardId) {
      console.error('Please provide title, author, and select a storyboard.')
      return
    }

    setIsSubmitting(true)

    try {
      const now = new Date()
      const bookData: Book = {
        id: book?.id || uuidv4(),
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        author: author.trim(),
        storyboardId,
        metadata: {
          genre: genre.trim() || undefined,
          description: description.trim() || undefined,
          isbn: isbn.trim() || undefined,
          language,
        },
        formatting: {
          // Typography & Layout
          fontFamily,
          fontSize,
          lineHeight,
          chapterBreakStyle,
          // Page Layout
          marginTop,
          marginBottom,
          marginLeft,
          marginRight,
          // Chapter Formatting
          useChapters,
          chapterTitleFont,
          chapterTitleSize,
          chapterNumberStyle,
          // Paragraph Formatting
          paragraphSpacing,
          firstLineIndent,
          textAlignment,
          // Advanced Options
          dropCapEnabled,
          headerFooterEnabled,
          pageNumbers,
          // Reference Formatting
          referenceStyle,
          citationStyle,
          includeReferences
        },
        createdAt: book?.createdAt || now,
        updatedAt: now,
      }

      storage.saveBook(bookData)
      
      console.log(`Book ${mode === 'create' ? 'created' : 'updated'} successfully!`)
      router.push('/books')
    } catch (error) {
      console.error('Error saving book:', error)
      console.error('There was an error saving your book. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-black mb-6 uppercase tracking-wide">
          Basic Information
        </h2>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input text-xl"
              placeholder="Enter book title..."
              required
            />
          </div>

          <div>
            <label htmlFor="subtitle" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
              Subtitle
            </label>
            <input
              type="text"
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="input"
              placeholder="Enter subtitle (optional)..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="author" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Author *
              </label>
              <input
                type="text"
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="input"
                placeholder="Enter author name..."
                required
              />
            </div>

            <div>
              <label htmlFor="storyboard" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Storyboard *
              </label>
              <select
                id="storyboard"
                value={storyboardId}
                onChange={(e) => setStoryboardId(e.target.value)}
                className="input"
                required
              >
                <option value="">Select a storyboard...</option>
                {availableStoryboards.map(storyboard => (
                  <option key={storyboard.id} value={storyboard.id}>
                    {storyboard.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-black mb-6 uppercase tracking-wide">
          Metadata
        </h2>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="description" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[100px]"
              placeholder="Enter book description..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="genre" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Genre
              </label>
              <input
                type="text"
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="input"
                placeholder="e.g. Fiction, Mystery..."
              />
            </div>

            <div>
              <label htmlFor="language" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Language
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
              </select>
            </div>

            <div>
              <label htmlFor="isbn" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                ISBN
              </label>
              <input
                type="text"
                id="isbn"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                className="input"
                placeholder="978-0-000000-00-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Typography & Text Formatting */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-black mb-6 uppercase tracking-wide">
          Typography & Text
        </h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="fontFamily" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Body Font
              </label>
              <select
                id="fontFamily"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="input"
              >
                <option value="Inter">Inter</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Garamond">Garamond</option>
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Minion Pro">Minion Pro</option>
                <option value="Baskerville">Baskerville</option>
              </select>
            </div>

            <div>
              <label htmlFor="fontSize" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Body Font Size (pt)
              </label>
              <input
                type="number"
                id="fontSize"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="input"
                min="8"
                max="24"
              />
            </div>

            <div>
              <label htmlFor="lineHeight" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Line Height
              </label>
              <input
                type="number"
                id="lineHeight"
                value={lineHeight}
                onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                className="input"
                min="1.0"
                max="3.0"
                step="0.1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="textAlignment" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Text Alignment
              </label>
              <select
                id="textAlignment"
                value={textAlignment}
                onChange={(e) => setTextAlignment(e.target.value as any)}
                className="input"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="justify">Justified</option>
              </select>
            </div>

            <div>
              <label htmlFor="paragraphSpacing" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Paragraph Spacing (em)
              </label>
              <input
                type="number"
                id="paragraphSpacing"
                value={paragraphSpacing}
                onChange={(e) => setParagraphSpacing(parseFloat(e.target.value))}
                className="input"
                min="0"
                max="3.0"
                step="0.1"
              />
            </div>

            <div>
              <label htmlFor="firstLineIndent" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                First Line Indent (em)
              </label>
              <input
                type="number"
                id="firstLineIndent"
                value={firstLineIndent}
                onChange={(e) => setFirstLineIndent(parseFloat(e.target.value))}
                className="input"
                min="0"
                max="3.0"
                step="0.1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Structure */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-black mb-6 uppercase tracking-wide">
          Book Structure
        </h2>
        
        <div className="space-y-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="useChapters"
              checked={useChapters}
              onChange={(e) => setUseChapters(e.target.checked)}
              className="mr-3 w-4 h-4"
            />
            <label htmlFor="useChapters" className="text-sm font-bold text-black uppercase tracking-wide">
              Use Chapters
            </label>
            <span className="ml-2 text-xs text-gray-600">
              (Uncheck for poetry books, essays, reference works, etc.)
            </span>
          </div>

          {useChapters && (
            <div className="bg-gray-50 p-4 rounded border">
              <h3 className="text-lg font-bold text-black mb-4 uppercase tracking-wide">
                Chapter Formatting
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label htmlFor="chapterTitleFont" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                    Chapter Title Font
                  </label>
                  <select
                    id="chapterTitleFont"
                    value={chapterTitleFont}
                    onChange={(e) => setChapterTitleFont(e.target.value)}
                    className="input"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Garamond">Garamond</option>
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Trajan Pro">Trajan Pro</option>
                    <option value="Copperplate">Copperplate</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="chapterTitleSize" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                    Chapter Title Size (pt)
                  </label>
                  <input
                    type="number"
                    id="chapterTitleSize"
                    value={chapterTitleSize}
                    onChange={(e) => setChapterTitleSize(parseInt(e.target.value))}
                    className="input"
                    min="12"
                    max="48"
                  />
                </div>

                <div>
                  <label htmlFor="chapterNumberStyle" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                    Chapter Numbers
                  </label>
                  <select
                    id="chapterNumberStyle"
                    value={chapterNumberStyle}
                    onChange={(e) => setChapterNumberStyle(e.target.value as any)}
                    className="input"
                  >
                    <option value="numeric">1, 2, 3...</option>
                    <option value="roman">I, II, III...</option>
                    <option value="words">One, Two, Three...</option>
                    <option value="none">No Numbers</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="chapterBreak" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                    Chapter Break Style
                  </label>
                  <select
                    id="chapterBreak"
                    value={chapterBreakStyle}
                    onChange={(e) => setChapterBreakStyle(e.target.value as any)}
                    className="input"
                  >
                    <option value="page-break">New Page</option>
                    <option value="section-break">Section Break</option>
                    <option value="spacing">Extra Spacing</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Page Layout */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-black mb-6 uppercase tracking-wide">
          Page Layout & Margins
        </h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label htmlFor="marginTop" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Top Margin (in)
              </label>
              <input
                type="number"
                id="marginTop"
                value={marginTop}
                onChange={(e) => setMarginTop(parseFloat(e.target.value))}
                className="input"
                min="0.5"
                max="3.0"
                step="0.1"
              />
            </div>

            <div>
              <label htmlFor="marginBottom" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Bottom Margin (in)
              </label>
              <input
                type="number"
                id="marginBottom"
                value={marginBottom}
                onChange={(e) => setMarginBottom(parseFloat(e.target.value))}
                className="input"
                min="0.5"
                max="3.0"
                step="0.1"
              />
            </div>

            <div>
              <label htmlFor="marginLeft" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Left Margin (in)
              </label>
              <input
                type="number"
                id="marginLeft"
                value={marginLeft}
                onChange={(e) => setMarginLeft(parseFloat(e.target.value))}
                className="input"
                min="0.5"
                max="3.0"
                step="0.1"
              />
            </div>

            <div>
              <label htmlFor="marginRight" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Right Margin (in)
              </label>
              <input
                type="number"
                id="marginRight"
                value={marginRight}
                onChange={(e) => setMarginRight(parseFloat(e.target.value))}
                className="input"
                min="0.5"
                max="3.0"
                step="0.1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Formatting */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-black mb-6 uppercase tracking-wide">
          Advanced Options
        </h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="pageNumbers" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Page Number Position
              </label>
              <select
                id="pageNumbers"
                value={pageNumbers}
                onChange={(e) => setPageNumbers(e.target.value as any)}
                className="input"
              >
                <option value="top-left">Top Left</option>
                <option value="top-center">Top Center</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-center">Bottom Center</option>
                <option value="bottom-right">Bottom Right</option>
                <option value="none">No Page Numbers</option>
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="dropCap"
                  checked={dropCapEnabled}
                  onChange={(e) => setDropCapEnabled(e.target.checked)}
                  className="mr-3 w-4 h-4"
                />
                <label htmlFor="dropCap" className="text-sm font-bold text-black uppercase tracking-wide">
                  Drop Caps on Chapters
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="headerFooter"
                  checked={headerFooterEnabled}
                  onChange={(e) => setHeaderFooterEnabled(e.target.checked)}
                  className="mr-3 w-4 h-4"
                />
                <label htmlFor="headerFooter" className="text-sm font-bold text-black uppercase tracking-wide">
                  Headers & Footers
                </label>
              </div>
            </div>
          </div>
          
          {/* References & Citations */}
          <div className="bg-gray-50 p-4 rounded border">
            <h4 className="text-sm font-bold text-black mb-4 uppercase tracking-wide">
              References & Citations
            </h4>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeReferences"
                  checked={includeReferences}
                  onChange={(e) => setIncludeReferences(e.target.checked)}
                  className="mr-3 w-4 h-4"
                />
                <label htmlFor="includeReferences" className="text-sm font-bold text-black uppercase tracking-wide">
                  Include References Section
                </label>
              </div>

              {includeReferences && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="referenceStyle" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                      Reference Style
                    </label>
                    <select
                      id="referenceStyle"
                      value={referenceStyle}
                      onChange={(e) => setReferenceStyle(e.target.value as any)}
                      className="input"
                    >
                      <option value="apa">APA (American Psychological Association)</option>
                      <option value="mla">MLA (Modern Language Association)</option>
                      <option value="chicago">Chicago Manual of Style</option>
                      <option value="harvard">Harvard Referencing</option>
                      <option value="ieee">IEEE (Institute of Electrical and Electronics Engineers)</option>
                      <option value="vancouver">Vancouver (ICMJE)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="citationStyle" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                      Citation Style
                    </label>
                    <select
                      id="citationStyle"
                      value={citationStyle}
                      onChange={(e) => setCitationStyle(e.target.value as any)}
                      className="input"
                    >
                      <option value="footnotes">Footnotes</option>
                      <option value="endnotes">Endnotes</option>
                      <option value="inline">Inline Citations</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded border">
            <h4 className="text-sm font-bold text-black mb-3 uppercase tracking-wide">
              Formatting Preview
            </h4>
            <div 
              className="bg-white p-4 border rounded min-h-[100px]"
              style={{
                fontFamily: fontFamily,
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
                textAlign: textAlignment as any,
                textIndent: `${firstLineIndent}em`,
                marginBottom: `${paragraphSpacing}em`
              }}
            >
              {useChapters && (
                <div 
                  className="font-bold mb-3"
                  style={{
                    fontFamily: chapterTitleFont,
                    fontSize: `${chapterTitleSize}px`
                  }}
                >
                  {chapterNumberStyle === 'numeric' && 'Chapter 1: '}
                  {chapterNumberStyle === 'roman' && 'Chapter I: '}
                  {chapterNumberStyle === 'words' && 'Chapter One: '}
                  Sample Chapter Title
                </div>
              )}
              <p style={{ textIndent: dropCapEnabled ? '0' : `${firstLineIndent}em` }}>
                {dropCapEnabled && <span style={{ fontSize: '2.5em', float: 'left', lineHeight: '1', marginRight: '3px' }}>T</span>}
                his is a preview of how your book text will appear with the selected formatting options. You can see the font family, size, line height, and alignment in action.
              </p>
              <p style={{ marginTop: `${paragraphSpacing}em`, textIndent: `${firstLineIndent}em` }}>
                This second paragraph shows paragraph spacing and indentation. The preview updates as you change the formatting settings above.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="divider my-8"></div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={handleCancel}
          className="btn btn-ghost"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !title.trim() || !author.trim() || !storyboardId}
          className="btn btn-primary"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" color="white" className="mr-2" />
              Saving...
            </>
          ) : mode === 'create' ? 'Create Book' : 'Update Book'}
        </button>
      </div>
    </form>
  )
}