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

  const chaptersHTML = chapters.map(chapter => `
    <div class="chapter">
      <h2>${chapter.title}</h2>
      <div class="chapter-content">${chapter.content}</div>
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
    body {
      font-family: ${book.formatting.fontFamily}, serif;
      font-size: ${book.formatting.fontSize}pt;
      line-height: ${book.formatting.lineHeight};
      margin: ${book.formatting.marginTop}in ${book.formatting.marginRight}in ${book.formatting.marginBottom}in ${book.formatting.marginLeft}in;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    h1 { 
      font-size: 2.5em; 
      margin-bottom: 0.5em; 
      text-align: center;
      page-break-before: always;
    }
    
    h2 { 
      font-size: 2em; 
      margin: 2em 0 1em 0;
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
      text-align: justify;
    }
    
    p {
      margin: 1em 0;
      text-indent: 1em;
    }
    
    @media print {
      body {
        margin: 1in;
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