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

export const exportBook = async (book: Book, options: ExportOptions): Promise<string> => {
  switch (options.format) {
    case 'html':
      return exportToHTML(book, options)
    case 'pdf':
      // For now, return HTML - in a real app, you'd use a library like Puppeteer
      return exportToHTML(book, options)
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