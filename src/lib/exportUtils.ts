import { Book, Excerpt } from '@/types'
import { storage } from '@/lib/storage'

export interface ExportOptions {
  format: 'pdf' | 'epub' | 'docx' | 'html'
  includeMetadata: boolean
  includeCover: boolean
  pageSize?: 'a4' | 'letter' | 'custom'
  margins?: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

export const generateBookContent = (book: Book): { title: string; content: string; chapters: Array<{ title: string; content: string; excerpts: Excerpt[] }> } => {
  const storyboard = storage.getStoryboard(book.storyboardId)
  if (!storyboard) {
    throw new Error('Storyboard not found')
  }

  const chapters: Array<{ title: string; content: string; excerpts: Excerpt[] }> = []
  let currentChapter = { title: '', content: '', excerpts: [] as Excerpt[] }
  let chapterNumber = 1

  storyboard.sections.forEach((section, index) => {
    const excerpt = storage.getExcerpt(section.excerptId)
    if (!excerpt) return

    // Start a new chapter every few excerpts or based on section notes
    const shouldStartNewChapter = 
      index === 0 || 
      section.notes?.toLowerCase().includes('chapter') ||
      currentChapter.excerpts.length >= 5

    if (shouldStartNewChapter && currentChapter.excerpts.length > 0) {
      chapters.push(currentChapter)
      chapterNumber++
      currentChapter = { title: '', content: '', excerpts: [] }
    }

    if (!currentChapter.title) {
      currentChapter.title = section.notes?.includes('chapter') 
        ? section.notes 
        : `Chapter ${chapterNumber}`
    }

    currentChapter.excerpts.push(excerpt)
    currentChapter.content += `\n\n${excerpt.content}\n\n`
  })

  // Add the last chapter
  if (currentChapter.excerpts.length > 0) {
    chapters.push(currentChapter)
  }

  const fullContent = chapters.map(chapter => 
    `${chapter.title}\n\n${chapter.content}`
  ).join('\n\n---\n\n')

  return {
    title: book.title,
    content: fullContent,
    chapters
  }
}

export const exportToHTML = (book: Book, options: ExportOptions): string => {
  const { title, content, chapters } = generateBookContent(book)
  
  const metadata = options.includeMetadata ? `
    <div class="metadata">
      <h1>${book.title}</h1>
      ${book.subtitle ? `<h2>${book.subtitle}</h2>` : ''}
      <p class="author">by ${book.author}</p>
      ${book.metadata.genre ? `<p class="genre">Genre: ${book.metadata.genre}</p>` : ''}
      ${book.metadata.description ? `<div class="description">${book.metadata.description}</div>` : ''}
    </div>
  ` : ''

  // Process images in chapter content to ensure proper sizing for Word
  const processImagesInContent = (content: string): string => {
    return content.replace(/<img([^>]*?)>/g, (match, attributes) => {
      // Extract src attribute
      const srcMatch = attributes.match(/src\s*=\s*["']([^"']*)["']/i);
      const src = srcMatch ? srcMatch[1] : '';
      
      // Extract alt attribute if present
      const altMatch = attributes.match(/alt\s*=\s*["']([^"']*)["']/i);
      const alt = altMatch ? altMatch[1] : '';
      
      // Use a table-based approach that Word handles better for image sizing
      return `
        <table align="center" style="margin: 1em auto; max-width: 100%;">
          <tr>
            <td align="center">
              <img src="${src}"${alt ? ` alt="${alt}"` : ''} width="400" height="auto" style="max-width: 400px; height: auto; border: none;">
            </td>
          </tr>
        </table>
      `;
    });
  };

  const chaptersHTML = chapters.map(chapter => `
    <div class="chapter">
      <h2>${chapter.title}</h2>
      <div class="chapter-content">${processImagesInContent(chapter.content)}</div>
    </div>
  `).join('')

  return `
<!DOCTYPE html>
<html lang="${book.metadata.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="Microsoft Word">
  <title>${title}</title>
  <style>
    body {
      font-family: ${book.formatting.fontFamily}, serif;
      font-size: ${book.formatting.fontSize}pt;
      line-height: ${book.formatting.lineHeight};
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: ${book.formatting.marginTop}in ${book.formatting.marginRight}in ${book.formatting.marginBottom}in ${book.formatting.marginLeft}in;
    }
    
    h1 { 
      font-size: 2.5em; 
      margin-bottom: 0.5em; 
      text-align: center;
      page-break-before: always;
      font-weight: bold;
    }
    
    h2 { 
      font-size: 1.8em; 
      margin: 2em 0 1em 0;
      font-weight: bold;
      ${book.formatting.chapterBreakStyle === 'page-break' ? 'page-break-before: always;' : ''}
      ${book.formatting.chapterBreakStyle === 'spacing' ? 'margin-top: 4em;' : ''}
    }
    
    .metadata {
      text-align: center;
      margin-bottom: 3em;
      border-bottom: 1px solid #ccc;
      padding-bottom: 2em;
    }
    
    .author {
      font-size: 1.2em;
      font-style: italic;
      margin: 1em 0;
    }
    
    .genre, .description {
      color: #666;
      margin: 0.5em 0;
    }
    
    .chapter {
      margin-bottom: 3em;
    }
    
    .chapter-content {
      text-align: ${book.formatting.textAlignment === 'justify' ? 'left' : book.formatting.textAlignment};
    }
    
    p {
      margin: ${book.formatting.paragraphSpacing || 0.5}em 0;
      ${book.formatting.firstLineIndent && book.formatting.firstLineIndent > 0 ? `text-indent: ${book.formatting.firstLineIndent}em;` : ''}
      word-spacing: normal;
      letter-spacing: normal;
    }
    
    /* Image sizing for Word compatibility - simplified for better Word support */
    img {
      max-width: 400px !important;
      height: auto !important;
      border: none !important;
    }
    
    /* Table-based image containers for Word compatibility */
    table {
      margin: 1em auto;
      border-collapse: collapse;
      border: none;
    }
    
    table td {
      border: none;
      padding: 0;
    }
    
    /* Word-friendly styles */
    .chapter-content p {
      text-align: ${book.formatting.textAlignment === 'justify' ? 'left' : book.formatting.textAlignment};
    }
    
    @media print {
      body {
        margin: ${book.formatting.marginTop}in ${book.formatting.marginRight}in ${book.formatting.marginBottom}in ${book.formatting.marginLeft}in;
      }
      
      p {
        text-align: ${book.formatting.textAlignment === 'justify' ? 'left' : book.formatting.textAlignment};
      }
      
      /* Enhanced image handling for print/Word */
      img {
        width: 4.5in !important;
        max-width: 4.5in !important;
        height: auto !important;
        display: block !important;
        margin: 12pt auto !important;
        border: none !important;
        page-break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  ${metadata}
  ${chaptersHTML}
</body>
</html>
  `
}

// PDF-optimized HTML that matches the preview formatting exactly
const exportToPDFPreview = (book: Book, options: ExportOptions): string => {
  const { title, content, chapters } = generateBookContent(book)
  
  const metadata = options.includeMetadata ? `
    <!-- Title Page -->
    <div class="text-center mb-16 border-b border-gray-200 pb-16">
      <h1 class="text-5xl font-bold text-black mb-4">
        ${book.title}
      </h1>
      ${book.subtitle ? `<h2 class="text-2xl text-gray-600 mb-8">${book.subtitle}</h2>` : ''}
      <p class="text-xl text-black font-medium mb-6">
        by ${book.author}
      </p>
      ${book.metadata.genre ? `<p class="text-sm text-gray-500 uppercase tracking-wide">${book.metadata.genre}</p>` : ''}
      ${book.metadata.description ? `<div class="mt-8 text-gray-700 max-w-2xl mx-auto">${book.metadata.description}</div>` : ''}
    </div>
  ` : ''

  const processImagesForPreview = (content: string): string => {
    return content.replace(/<img([^>]*?)>/g, (match, attributes) => {
      const srcMatch = attributes.match(/src\s*=\s*["']([^"']*)["']/i);
      const src = srcMatch ? srcMatch[1] : '';
      const altMatch = attributes.match(/alt\s*=\s*["']([^"']*)["']/i);
      const alt = altMatch ? altMatch[1] : '';
      
      return `<img src="${src}"${alt ? ` alt="${alt}"` : ''} class="mx-auto my-4 max-w-full h-auto" style="max-width: 400px; height: auto;">`;
    });
  };

  const chaptersHTML = chapters.map(chapter => `
    <div class="chapter ${book.formatting.chapterBreakStyle === 'page-break' ? 'break-before-page' : ''}">
      <h2 class="text-3xl font-bold text-black mb-8 ${book.formatting.chapterBreakStyle === 'spacing' ? 'mt-16' : ''}">
        ${chapter.title}
      </h2>
      <div class="prose prose-lg max-w-none" style="text-align: ${book.formatting.textAlignment === 'justify' ? 'left' : book.formatting.textAlignment}; word-spacing: normal; letter-spacing: normal;">
        ${processImagesForPreview(chapter.content)}
      </div>
    </div>
  `).join('')

  return `
<!DOCTYPE html>
<html lang="${book.metadata.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      @page {
        size: A4;
        margin: 0.75in;
      }
      
      body {
        font-family: ${book.formatting.fontFamily}, serif;
        font-size: ${book.formatting.fontSize}pt;
        line-height: ${book.formatting.lineHeight};
        color: #000 !important;
        background: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .break-before-page {
        page-break-before: always;
      }
      
      .chapter {
        page-break-inside: avoid;
        margin-bottom: 2rem;
      }
      
      h1, h2, h3 {
        page-break-after: avoid;
      }
      
      p {
        orphans: 3;
        widows: 3;
        margin: ${book.formatting.paragraphSpacing || 0.5}em 0;
        ${book.formatting.firstLineIndent && book.formatting.firstLineIndent > 0 ? `text-indent: ${book.formatting.firstLineIndent}em;` : ''}
      }
      
      img {
        max-width: 400px;
        height: auto;
        page-break-inside: avoid;
        margin: 1rem auto;
        display: block;
      }
      
      .border-gray-200 {
        border-color: #e5e7eb !important;
      }
      
      .text-gray-600 {
        color: #4b5563 !important;
      }
      
      .text-gray-500 {
        color: #6b7280 !important;
      }
      
      .text-gray-700 {
        color: #374151 !important;
      }
    }
    
    /* Screen styles for preview */
    body {
      font-family: ${book.formatting.fontFamily}, serif;
      font-size: ${book.formatting.fontSize}pt;
      line-height: ${book.formatting.lineHeight};
      background: white;
      color: #000;
      padding: 3rem;
      max-width: 8.5in;
      margin: 0 auto;
    }
    
    .container {
      background: white;
      border: 2px solid #e5e7eb;
      padding: 3rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }
  </style>
</head>
<body>
  <div class="container">
    ${metadata}
    
    <!-- Chapters -->
    <div class="space-y-12">
      ${chaptersHTML}
    </div>
    
    <!-- Book Info -->
    <div class="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
      <p>Generated from ${chapters.length} chapters</p>
      <p>Total word count: ${chapters.reduce((total, chapter) => 
        total + chapter.excerpts.reduce((sum, excerpt) => sum + excerpt.wordCount, 0), 0
      ).toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
  `
}

// PDF-specific HTML with print optimizations
const exportToPDF = (book: Book, options: ExportOptions): string => {
  const { title, content, chapters } = generateBookContent(book)
  
  const metadata = options.includeMetadata ? `
    <div class="metadata">
      <h1>${book.title}</h1>
      ${book.subtitle ? `<h2>${book.subtitle}</h2>` : ''}
      <p class="author">by ${book.author}</p>
      ${book.metadata.genre ? `<p class="genre">Genre: ${book.metadata.genre}</p>` : ''}
      ${book.metadata.description ? `<div class="description">${book.metadata.description}</div>` : ''}
    </div>
  ` : ''

  // Process images for PDF - smaller and more print-friendly
  const processImagesForPDF = (content: string): string => {
    return content.replace(/<img([^>]*?)>/g, (match, attributes) => {
      const srcMatch = attributes.match(/src\s*=\s*["']([^"']*)["']/i);
      const src = srcMatch ? srcMatch[1] : '';
      const altMatch = attributes.match(/alt\s*=\s*["']([^"']*)["']/i);
      const alt = altMatch ? altMatch[1] : '';
      
      return `
        <table align="center" style="margin: 0.5em auto; max-width: 100%; page-break-inside: avoid;">
          <tr>
            <td align="center">
              <img src="${src}"${alt ? ` alt="${alt}"` : ''} style="max-width: 300px; height: auto; border: none;">
            </td>
          </tr>
        </table>
      `;
    });
  };

  const chaptersHTML = chapters.map(chapter => `
    <div class="chapter">
      <h2>${chapter.title}</h2>
      <div class="chapter-content">${processImagesForPDF(chapter.content)}</div>
    </div>
  `).join('')

  return `
<!DOCTYPE html>
<html lang="${book.metadata.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @media print {
      @page {
        size: A4;
        margin: ${book.formatting.marginTop}in ${book.formatting.marginRight}in ${book.formatting.marginBottom}in ${book.formatting.marginLeft}in;
      }
      
      body {
        font-family: ${book.formatting.fontFamily}, serif;
        font-size: ${book.formatting.fontSize}pt;
        line-height: ${book.formatting.lineHeight};
        color: #000;
        background: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      h1 { 
        font-size: 24pt; 
        margin-bottom: 12pt; 
        text-align: center;
        page-break-before: always;
        font-weight: bold;
      }
      
      h2 { 
        font-size: 18pt; 
        margin: 24pt 0 12pt 0;
        font-weight: bold;
        ${book.formatting.chapterBreakStyle === 'page-break' ? 'page-break-before: always;' : ''}
        ${book.formatting.chapterBreakStyle === 'spacing' ? 'margin-top: 48pt;' : ''}
      }
      
      .metadata {
        text-align: center;
        margin-bottom: 36pt;
        border-bottom: 1pt solid #000;
        padding-bottom: 24pt;
      }
      
      .chapter-content {
        text-align: ${book.formatting.textAlignment === 'justify' ? 'left' : book.formatting.textAlignment};
      }
      
      p {
        margin: ${book.formatting.paragraphSpacing || 0.5}em 0;
        ${book.formatting.firstLineIndent && book.formatting.firstLineIndent > 0 ? `text-indent: ${book.formatting.firstLineIndent}em;` : ''}
        orphans: 3;
        widows: 3;
      }
      
      img {
        max-width: 300px;
        height: auto;
        page-break-inside: avoid;
        border: none;
      }
      
      table {
        border: none;
        margin: 6pt auto;
        page-break-inside: avoid;
      }
      
      table td {
        border: none;
        padding: 0;
      }
      
      .chapter {
        page-break-inside: avoid;
      }
    }
    
    /* Screen styles for preview */
    body {
      font-family: ${book.formatting.fontFamily}, serif;
      font-size: ${book.formatting.fontSize}pt;
      line-height: ${book.formatting.lineHeight};
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
      background: white;
      color: #000;
    }
    
    img {
      max-width: 300px;
      height: auto;
      border: none;
    }
  </style>
</head>
<body>
  ${metadata}
  ${chaptersHTML}
</body>
</html>
  `
}

export const exportBook = async (book: Book, options: ExportOptions): Promise<string> => {
  switch (options.format) {
    case 'html':
      return exportToHTML(book, options)
    case 'pdf':
      return exportToPDFPreview(book, options)
    case 'epub':
      // For now, return HTML - in a real app, you'd use a library like epub-gen
      return exportToHTML(book, options)
    case 'docx':
      // For now, return HTML - in a real app, you'd use a library like docx
      return exportToHTML(book, options)
    default:
      throw new Error(`Unsupported export format: ${options.format}`)
  }
}

export const downloadFile = (content: string, filename: string, mimeType: string = 'text/html') => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const downloadPDF = async (content: string, filename: string) => {
  try {
    // Create a new window with the beautifully formatted content
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    
    if (printWindow) {
      // Write the content to the new window
      printWindow.document.write(content)
      printWindow.document.close()
      
      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          // Focus the window and trigger print dialog
          printWindow.focus()
          printWindow.print()
          
          // Optional: Close the window after a delay (user can cancel this)
          setTimeout(() => {
            if (!printWindow.closed) {
              printWindow.close()
            }
          }, 1000)
        }, 1000) // Increased delay to ensure Tailwind CSS loads
      }
      
      // Handle case where onload doesn't fire
      setTimeout(() => {
        if (printWindow.document.readyState === 'complete') {
          printWindow.focus()
          printWindow.print()
        }
      }, 2000)
      
    } else {
      // Fallback: download HTML file with instructions
      const blob = new Blob([content], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = filename.replace('.pdf', '_print_ready.html')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      alert('Pop-up blocked. Downloaded HTML file instead. Open it in your browser and use Ctrl+P (Cmd+P on Mac) to print as PDF.')
    }
  } catch (error) {
    console.error('PDF generation failed:', error)
    
    // Final fallback: download HTML file
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename.replace('.pdf', '_print_ready.html')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    alert('PDF generation failed. Downloaded HTML file instead. Open it in your browser and use Ctrl+P (Cmd+P on Mac) to print as PDF.')
  }
}