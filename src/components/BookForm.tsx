'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Book, Storyboard } from '@/types'
import { useStorage } from '@/contexts/StorageContext'

interface BookFormProps {
  book?: Book
  mode: 'create' | 'edit'
}

export default function BookForm({ book, mode }: BookFormProps) {
  const router = useRouter()
  const storage = useStorage()
  const [title, setTitle] = useState(book?.title || '')
  const [subtitle, setSubtitle] = useState(book?.subtitle || '')
  const [author, setAuthor] = useState(book?.author || '')
  const [storyboardId, setStoryboardId] = useState(book?.storyboardId || '')
  const [genre, setGenre] = useState(book?.metadata.genre || '')
  const [description, setDescription] = useState(book?.metadata.description || '')
  const [language, setLanguage] = useState(book?.metadata.language || 'en')
  const [isbn, setIsbn] = useState(book?.metadata.isbn || '')
  
  // Typography & Text
  const [fontFamily, setFontFamily] = useState(book?.formatting.fontFamily || 'Times New Roman')
  const [fontSize, setFontSize] = useState(book?.formatting.fontSize || 12)
  const [lineHeight, setLineHeight] = useState(book?.formatting.lineHeight || 1.6)
  
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
  const [chapterBreakStyle, setChapterBreakStyle] = useState(book?.formatting.chapterBreakStyle || 'page-break')
  
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
  const [activeTab, setActiveTab] = useState<'typography' | 'structure' | 'layout' | 'advanced'>('typography')

  useEffect(() => {
    const loadStoryboards = async () => {
      try {
        const storyboards = await storage.getStoryboards()
        setAvailableStoryboards(storyboards)
      } catch (error) {
        console.error('Failed to load storyboards:', error)
      }
    }
    loadStoryboards()
  }, [storage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !author.trim() || !storyboardId) {
      alert('Please provide title, author, and select a storyboard.')
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
          description: description.trim() || undefined,
          genre: genre.trim() || undefined,
          language,
          isbn: isbn.trim() || undefined,
        },
        formatting: {
          // Typography
          fontFamily,
          fontSize,
          lineHeight,
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
          chapterBreakStyle,
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

      await storage.saveBook(bookData)
      router.push('/books')
    } catch (error) {
      console.error('Error saving book:', error)
      alert('There was an error saving your book. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  // Live Preview Component
  const LivePreview = () => (
    <div className="card p-6">
      <h3 className="text-lg font-bold text-black mb-4 uppercase tracking-wide">Live Preview</h3>
      <div 
        className="bg-white border-2 border-gray-200 rounded-lg p-8 shadow-inner"
        style={{
          fontFamily,
          fontSize: `${fontSize}pt`,
          lineHeight,
          textAlign: textAlignment as any,
          marginTop: `${marginTop}in`,
          marginBottom: `${marginBottom}in`,
          marginLeft: `${marginLeft}in`,
          marginRight: `${marginRight}in`,
        }}
      >
        {/* Chapter Title Preview */}
        {useChapters && (
          <div className="mb-6">
            <h1 
              style={{
                fontFamily: chapterTitleFont,
                fontSize: `${chapterTitleSize}pt`,
                fontWeight: 'bold',
                marginBottom: `${paragraphSpacing}em`
              }}
            >
              {chapterNumberStyle === 'numeric' && '1. '}
              {chapterNumberStyle === 'roman' && 'I. '}
              {chapterNumberStyle === 'words' && 'One. '}
              Chapter One
            </h1>
          </div>
        )}
        
        {/* Sample Text Preview */}
        <div>
          <p style={{ 
            textIndent: dropCapEnabled ? '0' : `${firstLineIndent}em`,
            marginBottom: `${paragraphSpacing}em`,
            position: 'relative'
          }}>
            {dropCapEnabled && (
              <span style={{
                float: 'left',
                fontSize: `${fontSize * 3}pt`,
                lineHeight: '1',
                marginRight: '4px',
                marginTop: '4px'
              }}>
                T
              </span>
            )}
            {title || 'Your Book Title'} - This is how your book text will appear with the current formatting settings. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
          <p style={{ 
            textIndent: `${firstLineIndent}em`,
            marginBottom: `${paragraphSpacing}em` 
          }}>
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
          </p>
        </div>

        {/* Page Numbers Preview */}
        {headerFooterEnabled && (
          <div className="mt-8 pt-4 border-t border-gray-200 text-center">
            <div style={{ fontSize: `${fontSize * 0.8}pt` }}>
              {pageNumbers.includes('bottom') && '— 1 —'}
              {pageNumbers.includes('top') && (
                <div className="mb-4 text-center">— {author || 'Author'} —</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Condensed Top Section - Basic Info and Metadata */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-black mb-6 uppercase tracking-wide">
          Book Information
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* First Row */}
          <div className="xl:col-span-2">
            <label htmlFor="title" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input text-lg"
              placeholder="Enter book title..."
              required
            />
          </div>

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

          {/* Second Row */}
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
              placeholder="Enter subtitle..."
            />
          </div>

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
              placeholder="e.g., Fiction"
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
        
        {/* Description spans full width */}
        <div className="mt-6">
          <label htmlFor="description" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input resize-none w-full"
            rows={2}
            placeholder="Brief description of your book..."
          />
        </div>
      </div>

      {/* Full Width Settings Dashboard */}
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-black mb-6 uppercase tracking-wide">
            Book Settings
          </h2>
          <div className="flex flex-wrap gap-2 border-b border-gray-200">
            {[
              { id: 'typography', label: 'Typography' },
              { id: 'structure', label: 'Structure' },
              { id: 'layout', label: 'Layout' },
              { id: 'advanced', label: 'Advanced' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-sm font-semibold uppercase tracking-wide border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="card p-6">
            {activeTab === 'typography' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-black mb-4 uppercase tracking-wide">Typography & Text</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Garamond">Garamond</option>
                      <option value="Minion Pro">Minion Pro</option>
                      <option value="Baskerville">Baskerville</option>
                      <option value="Inter">Inter</option>
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="fontSize" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                      Font Size (pt)
                    </label>
                    <input
                      type="number"
                      id="fontSize"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="input"
                      min="8"
                      max="18"
                      step="0.5"
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
                      onChange={(e) => setLineHeight(Number(e.target.value))}
                      className="input"
                      min="1.0"
                      max="3.0"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label htmlFor="textAlignment" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                      Text Alignment
                    </label>
                    <select
                      id="textAlignment"
                      value={textAlignment}
                      onChange={(e) => setTextAlignment(e.target.value as 'left' | 'center' | 'right' | 'justify')}
                      className="input"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                      <option value="justify">Justify</option>
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
                      onChange={(e) => setParagraphSpacing(Number(e.target.value))}
                      className="input"
                      min="0"
                      max="2"
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
                      onChange={(e) => setFirstLineIndent(Number(e.target.value))}
                      className="input"
                      min="0"
                      max="2"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'structure' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-black mb-4 uppercase tracking-wide">Book Structure</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={useChapters}
                        onChange={(e) => setUseChapters(e.target.checked)}
                        className="mr-3"
                      />
                      <span className="text-sm font-bold text-black uppercase tracking-wide">
                        Use Chapter Formatting
                      </span>
                    </label>
                  </div>

                  {useChapters && (
                    <div className="pl-6 border-l-2 border-blue-200 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            onChange={(e) => setChapterTitleSize(Number(e.target.value))}
                            className="input"
                            min="12"
                            max="24"
                          />
                        </div>

                        <div>
                          <label htmlFor="chapterNumberStyle" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                            Chapter Numbering
                          </label>
                          <select
                            id="chapterNumberStyle"
                            value={chapterNumberStyle}
                            onChange={(e) => setChapterNumberStyle(e.target.value as 'numeric' | 'roman' | 'words' | 'none')}
                            className="input"
                          >
                            <option value="numeric">Numeric (1, 2, 3)</option>
                            <option value="roman">Roman (I, II, III)</option>
                            <option value="words">Words (One, Two, Three)</option>
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
                            onChange={(e) => setChapterBreakStyle(e.target.value as 'page-break' | 'section-break' | 'spacing')}
                            className="input"
                          >
                            <option value="page-break">New Page</option>
                            <option value="spacing">Extra Spacing</option>
                            <option value="section-break">Section Break</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-black mb-4 uppercase tracking-wide">Page Layout & Margins</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <label htmlFor="marginTop" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                      Top Margin (in)
                    </label>
                    <input
                      type="number"
                      id="marginTop"
                      value={marginTop}
                      onChange={(e) => setMarginTop(Number(e.target.value))}
                      className="input"
                      min="0.5"
                      max="3"
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
                      onChange={(e) => setMarginBottom(Number(e.target.value))}
                      className="input"
                      min="0.5"
                      max="3"
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
                      onChange={(e) => setMarginLeft(Number(e.target.value))}
                      className="input"
                      min="0.5"
                      max="3"
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
                      onChange={(e) => setMarginRight(Number(e.target.value))}
                      className="input"
                      min="0.5"
                      max="3"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-black mb-4 uppercase tracking-wide">Advanced Options</h3>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="pageNumbers" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                      Page Numbers
                    </label>
                    <select
                      id="pageNumbers"
                      value={pageNumbers}
                      onChange={(e) => setPageNumbers(e.target.value as 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left' | 'none')}
                      className="input"
                    >
                      <option value="bottom-center">Bottom Center</option>
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="top-center">Top Center</option>
                      <option value="top-right">Top Right</option>
                      <option value="top-left">Top Left</option>
                      <option value="none">None</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={dropCapEnabled}
                          onChange={(e) => setDropCapEnabled(e.target.checked)}
                          className="mr-3"
                        />
                        <span className="text-sm font-bold text-black uppercase tracking-wide">
                          Drop Cap (First Letter)
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={headerFooterEnabled}
                          onChange={(e) => setHeaderFooterEnabled(e.target.checked)}
                          className="mr-3"
                        />
                        <span className="text-sm font-bold text-black uppercase tracking-wide">
                          Headers & Footers
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-bold text-black mb-4 uppercase tracking-wide">Reference Style</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={includeReferences}
                            onChange={(e) => setIncludeReferences(e.target.checked)}
                            className="mr-3"
                          />
                          <span className="text-sm font-bold text-black uppercase tracking-wide">
                            Include References
                          </span>
                        </label>
                      </div>

                      {includeReferences && (
                        <div className="pl-6 border-l-2 border-blue-200 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label htmlFor="referenceStyle" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                                Reference Format
                              </label>
                              <select
                                id="referenceStyle"
                                value={referenceStyle}
                                onChange={(e) => setReferenceStyle(e.target.value as 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee' | 'vancouver')}
                                className="input"
                              >
                                <option value="apa">APA</option>
                                <option value="mla">MLA</option>
                                <option value="chicago">Chicago</option>
                                <option value="harvard">Harvard</option>
                                <option value="ieee">IEEE</option>
                                <option value="vancouver">Vancouver</option>
                              </select>
                            </div>

                            <div>
                              <label htmlFor="citationStyle" className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                                Citation Style
                              </label>
                              <select
                                id="citationStyle"
                                value={citationStyle}
                                onChange={(e) => setCitationStyle(e.target.value as 'footnotes' | 'endnotes' | 'inline')}
                                className="input"
                              >
                                <option value="footnotes">Footnotes</option>
                                <option value="endnotes">Endnotes</option>
                                <option value="inline">Inline</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
        
        {/* Live Preview */}
        <LivePreview />
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4 justify-end pt-8">
        <button
          type="button"
          onClick={handleCancel}
          className="btn btn-secondary"
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