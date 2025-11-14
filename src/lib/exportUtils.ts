import { Book, Excerpt, Storyboard } from '@/types'

export interface ExportOptions {
  format: 'pdf' | 'epub' | 'docx' | 'html'
  includeMetadata: boolean
  includeCover: boolean
  imagePageBreaks?: boolean // Whether to put images on separate pages
  pageSize?: 'a4' | 'letter' | 'custom'
  margins?: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

export const generateBookContent = async (book: Book, storage: any): Promise<{ title: string; content: string; chapters: Array<{ title: string; content: string; excerpts: Excerpt[] }> }> => {
  const storyboard = await storage.getStoryboard(book.storyboardId)
  if (!storyboard) {
    throw new Error('Storyboard not found')
  }

  const chapters: Array<{ title: string; content: string; excerpts: Excerpt[] }> = []
  let currentChapter = { title: '', content: '', excerpts: [] as Excerpt[] }
  let chapterNumber = 1

  for (let index = 0; index < storyboard.sections.length; index++) {
    const section = storyboard.sections[index]
    const excerpt = await storage.getExcerpt(section.excerptId)
    if (!excerpt) continue

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
  }

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

export const exportToHTML = async (book: Book, options: ExportOptions, storage: any): Promise<string> => {
  const { title, content, chapters } = await generateBookContent(book, storage)
  
  const metadata = options.includeMetadata ? `
    <div class="metadata">
      <h1>${book.title}</h1>
      ${book.subtitle ? `<h2>${book.subtitle}</h2>` : ''}
      <p class="author">by ${book.author}</p>
      ${book.metadata.genre ? `<p class="genre">Genre: ${book.metadata.genre}</p>` : ''}
      ${book.metadata.description ? `<div class="description">${book.metadata.description}</div>` : ''}
    </div>
  ` : ''

  // Enhanced image processing for better Word compatibility
  const processImagesInContent = (content: string): string => {
    let processedContent = content;
    
    // First, handle custom page breaks from Quill editor
    processedContent = processedContent.replace(
      /<div class="ql-page-break-container">[\s\S]*?<\/div>/g, 
      '<div style="page-break-after: always;"></div>'
    );
    
    // Enhanced image handling for Word - using table-based layout for better compatibility
    const parts = processedContent.split(/(<img[^>]*>)/g);
    processedContent = '';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (part.match(/<img[^>]*>/)) {
        // Extract image attributes
        const srcMatch = part.match(/src\s*=\s*["']([^"']*)["']/i);
        const src = srcMatch ? srcMatch[1] : '';
        const altMatch = part.match(/alt\s*=\s*["']([^"']*)["']/i);
        const alt = altMatch ? altMatch[1] : '';
        
        // Configurable page breaks for images with enhanced separation
        const pageBreakStyle = options.imagePageBreaks === true 
          ? 'page-break-before: always; page-break-after: always; page-break-inside: avoid;' 
          : 'margin: 24pt 0; page-break-inside: avoid;';
        
        // Enhanced image structure for better page break control
        if (options.imagePageBreaks === true) {
          // Full page layout for images with guaranteed page isolation
          processedContent += `
            <div style="page-break-before: always; page-break-after: always; page-break-inside: avoid; min-height: 90vh;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; height: 90vh; margin: 0; padding: 0; border: none; border-collapse: collapse;">
                <tr>
                  <td align="center" valign="middle" style="text-align: center; vertical-align: middle; padding: 5vh; border: none; height: 90vh;">
                    <img src="${src}"${alt ? ` alt="${alt}"` : ''} 
                         width="432" 
                         style="width: 432px; height: auto; max-height: 70vh; border: none;" />
                  </td>
                </tr>
              </table>
            </div>
          `;
        } else {
          // Inline layout for images
          processedContent += `
            <div style="${pageBreakStyle}">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 0; padding: 0; border: none; border-collapse: collapse;">
                <tr>
                  <td align="center" valign="middle" style="text-align: center; vertical-align: middle; padding: 36pt; border: none;">
                    <img src="${src}"${alt ? ` alt="${alt}"` : ''} 
                         width="432" 
                         style="width: 432px; height: auto; max-height: 500px; border: none;" />
                  </td>
                </tr>
              </table>
            </div>
          `;
        }
      } else if (part.trim()) {
        // This is text content
        processedContent += part;
      }
    }
    
    return processedContent;
  };

  const chaptersHTML = chapters.map(chapter => `
    <div class="chapter">
      <h2>${chapter.title}</h2>
      <div class="chapter-content">${processImagesInContent(chapter.content)}</div>
    </div>
  `).join('')

  return `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40" lang="${book.metadata.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="Microsoft Word 15">
  <meta name="Originator" content="Microsoft Word 15">
  <meta name="Author" content="${book.author}">
  <meta name="Title" content="${book.title}">
  <meta name="Subject" content="${book.metadata.description || ''}">
  <meta name="Keywords" content="${book.metadata.genre || ''}">
  <!--[if gte mso 9]>
  <xml>
    <o:DocumentProperties>
      <o:Author>${book.author}</o:Author>
      <o:LastAuthor>${book.author}</o:LastAuthor>
      <o:Title>${book.title}</o:Title>
      <o:Subject>${book.metadata.description || ''}</o:Subject>
      <o:Keywords>${book.metadata.genre || ''}</o:Keywords>
      <o:Description>Generated book document</o:Description>
    </o:DocumentProperties>
    <o:OfficeDocumentSettings>
      <o:RelyOnVML/>
      <o:AllowPNG/>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
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
    
    /* Simplified Word compatibility styles with explicit sizing */
    img {
      width: 432px !important;
      height: auto !important;
      max-height: 500px !important;
      display: block !important;
      margin-left: auto !important;
      margin-right: auto !important;
      border: 0px !important;
      page-break-inside: avoid !important;
    }
    
    /* Table-based image containers for Word compatibility */
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      border: none !important;
      margin: 0 !important;
      padding: 0 !important;
      page-break-inside: avoid !important;
    }
    
    table tr {
      border: none !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    table td {
      border: none !important;
      padding: 0 !important;
      margin: 0 !important;
      text-align: center !important;
      vertical-align: middle !important;
    }
    
    /* Word-friendly paragraph styles */
    .chapter-content p {
      text-align: ${book.formatting.textAlignment === 'justify' ? 'left' : book.formatting.textAlignment};
      margin: 12pt 0 !important;
    }
    
    /* Word document structure */
    .chapter {
      page-break-inside: avoid;
      margin-bottom: 24pt;
    }
    
    .chapter h2 {
      page-break-after: avoid;
      margin-bottom: 12pt;
    }
    
    /* Print and Word-specific optimizations */
    @media print {
      @page {
        size: 8.5in 11in;
        margin: ${book.formatting.marginTop}in ${book.formatting.marginRight}in ${book.formatting.marginBottom}in ${book.formatting.marginLeft}in;
      }
      
      body {
        font-size: ${book.formatting.fontSize}pt !important;
        line-height: ${book.formatting.lineHeight} !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        color: black !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid !important;
        orphans: 3 !important;
        widows: 3 !important;
      }
      
      p {
        orphans: 3 !important;
        widows: 3 !important;
        margin: 12pt 0 !important;
        text-align: ${book.formatting.textAlignment === 'justify' ? 'left' : book.formatting.textAlignment} !important;
      }
      
      /* Explicit image sizing for print compatibility */
      img {
        width: 432px !important;
        height: auto !important;
        max-height: 500px !important;
        display: block !important;
        margin-left: auto !important;
        margin-right: auto !important;
        border: 0px !important;
        page-break-inside: avoid !important;
      }
      
      table {
        page-break-inside: avoid !important;
        margin: 0 !important;
        padding: 0 !important;
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

// Clean PDF format optimized for digital reading
const exportToPDFPreview = async (book: Book, options: ExportOptions, storage: any): Promise<string> => {
  const { title, content, chapters } = await generateBookContent(book, storage)
  
  const metadata = options.includeMetadata ? `
    <!-- Title Section -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-black mb-3">
        ${book.title}
      </h1>
      ${book.subtitle ? `<h2 class="text-xl text-gray-600 mb-6">${book.subtitle}</h2>` : ''}
      <p class="text-lg text-black font-medium">
        by ${book.author}
      </p>
      ${book.metadata.genre ? `<p class="text-sm text-gray-500 mt-2">${book.metadata.genre}</p>` : ''}
      ${book.metadata.description ? `<div class="mt-6 text-gray-700 max-w-2xl mx-auto text-base">${book.metadata.description}</div>` : ''}
    </div>
  ` : ''

  const processImages = (content: string): string => {
    let processedContent = content;
    
    // First, handle custom page breaks from Quill editor
    processedContent = processedContent.replace(
      /<div class="ql-page-break-container">[\s\S]*?<\/div>/g, 
      '<div style="page-break-after: always; margin: 0; padding: 0;"></div>'
    );
    
    // Then handle images - split content by images and create separate pages for PDF
    const parts = processedContent.split(/(<img[^>]*>)/g);
    processedContent = '';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (part.match(/<img[^>]*>/)) {
        // This is an image - put it on its own page
        const srcMatch = part.match(/src\s*=\s*["']([^"']*)["']/i);
        const src = srcMatch ? srcMatch[1] : '';
        const altMatch = part.match(/alt\s*=\s*["']([^"']*)["']/i);
        const alt = altMatch ? altMatch[1] : '';
        
        processedContent += `
          <div style="page-break-before: always; page-break-after: always; text-align: center; padding: 2rem 0; min-height: 70vh; display: flex; align-items: center; justify-content: center;">
            <img src="${src}"${alt ? ` alt="${alt}"` : ''} style="max-width: 85%; max-height: 85%; height: auto; border: none;">
          </div>
        `;
      } else if (part.trim()) {
        // This is text content
        processedContent += part;
      }
    }
    
    return processedContent;
  };

  const chaptersHTML = chapters.map((chapter, index) => `
    <div class="chapter" style="margin-bottom: 3rem;">
      <h2 style="font-size: 1.8rem; font-weight: bold; color: #000; margin-bottom: 1.5rem; ${index > 0 ? 'margin-top: 3rem;' : ''}">
        ${chapter.title}
      </h2>
      <div style="text-align: ${book.formatting.textAlignment}; line-height: 1.7;">
        ${processImages(chapter.content)}
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
  <style>
    body {
      font-family: ${book.formatting.fontFamily}, serif;
      font-size: ${book.formatting.fontSize}pt;
      line-height: ${book.formatting.lineHeight};
      color: #333;
      background: white;
      max-width: 700px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    p {
      margin: ${book.formatting.paragraphSpacing || 1}em 0;
      ${book.formatting.firstLineIndent && book.formatting.firstLineIndent > 0 ? `text-indent: ${book.formatting.firstLineIndent}em;` : ''}
    }
    
    h1, h2, h3, h4, h5, h6 {
      color: #000;
      margin-top: 2em;
      margin-bottom: 0.5em;
    }
    
    h1 { font-size: 2.2em; }
    h2 { font-size: 1.8em; }
    h3 { font-size: 1.4em; }
    
    img {
      max-width: 100%;
      height: auto;
      margin: 1.5rem auto;
      display: block;
    }
    
    .text-gray-600 { color: #666; }
    .text-gray-500 { color: #777; }
    .text-gray-700 { color: #555; }
    
    /* Clean PDF print styles */
    @media print {
      body {
        margin: 0;
        padding: 1rem;
        background: white;
        color: #000;
      }
      
      @page {
        margin: 1in;
        size: letter;
      }
    }
  </style>
</head>
<body>
  ${metadata}
  
  <!-- Book Content -->
  ${chaptersHTML}
</body>
</html>
  `
}

// PDF-specific HTML with print optimizations
const exportToPDF = async (book: Book, options: ExportOptions, storage: any): Promise<string> => {
  const { title, content, chapters } = await generateBookContent(book, storage)
  
  const metadata = options.includeMetadata ? `
    <div class="metadata">
      <h1>${book.title}</h1>
      ${book.subtitle ? `<h2>${book.subtitle}</h2>` : ''}
      <p class="author">by ${book.author}</p>
      ${book.metadata.genre ? `<p class="genre">Genre: ${book.metadata.genre}</p>` : ''}
      ${book.metadata.description ? `<div class="description">${book.metadata.description}</div>` : ''}
    </div>
  ` : ''

  // Process images and page breaks for PDF - full page images
  const processImagesForPDF = (content: string): string => {
    let processedContent = content;
    
    // Handle custom page breaks from Quill editor
    processedContent = processedContent.replace(
      /<div class="ql-page-break-container">[\s\S]*?<\/div>/g, 
      '<div style="page-break-after: always; margin: 0; padding: 0;"></div>'
    );
    
    const parts = processedContent.split(/(<img[^>]*>)/g);
    processedContent = '';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (part.match(/<img[^>]*>/)) {
        // This is an image - put it on its own page
        const srcMatch = part.match(/src\s*=\s*["']([^"']*)["']/i);
        const src = srcMatch ? srcMatch[1] : '';
        const altMatch = part.match(/alt\s*=\s*["']([^"']*)["']/i);
        const alt = altMatch ? altMatch[1] : '';
        
        processedContent += `
          <div style="page-break-before: always; page-break-after: always; text-align: center; padding: 1rem 0; min-height: 8in; display: flex; align-items: center; justify-content: center;">
            <img src="${src}"${alt ? ` alt="${alt}"` : ''} style="max-width: 80%; max-height: 80%; height: auto; border: none;">
          </div>
        `;
      } else if (part.trim()) {
        // This is text content
        processedContent += part;
      }
    }
    
    return processedContent;
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

// Enhanced DOCX export with Word-optimized formatting
const exportToDOCX = async (book: Book, options: ExportOptions, storage: any): Promise<string> => {
  const { title, content, chapters } = await generateBookContent(book, storage)
  
  const metadata = options.includeMetadata ? `
    <div class="metadata">
      <h1>${book.title}</h1>
      ${book.subtitle ? `<h2>${book.subtitle}</h2>` : ''}
      <p class="author">by ${book.author}</p>
      ${book.metadata.genre ? `<p class="genre">Genre: ${book.metadata.genre}</p>` : ''}
      ${book.metadata.description ? `<div class="description">${book.metadata.description}</div>` : ''}
    </div>
  ` : ''

  // Ultra Word-friendly image processing
  const processImagesForWord = (content: string): string => {
    let processedContent = content;
    
    // Handle page breaks
    processedContent = processedContent.replace(
      /<div class="ql-page-break-container">[\s\S]*?<\/div>/g, 
      '<div style="page-break-after: always;"></div>'
    );
    
    // Ultra-optimized image handling for Word
    const parts = processedContent.split(/(<img[^>]*>)/g);
    processedContent = '';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (part.match(/<img[^>]*>/)) {
        const srcMatch = part.match(/src\s*=\s*["']([^"']*)["']/i);
        const src = srcMatch ? srcMatch[1] : '';
        const altMatch = part.match(/alt\s*=\s*["']([^"']*)["']/i);
        const alt = altMatch ? altMatch[1] : '';
        
        // Enhanced image structure for DOCX with better page break control
        if (options.imagePageBreaks === true) {
          // Full page layout for images in DOCX with guaranteed page isolation
          processedContent += `
            <div style="page-break-before: always; page-break-after: always; page-break-inside: avoid; min-height: 90vh;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; height: 90vh; margin: 0; padding: 0; border: none; border-collapse: collapse;">
                <tr>
                  <td align="center" valign="middle" style="text-align: center; vertical-align: middle; padding: 5vh; border: none; height: 90vh;">
                    <img src="${src}"${alt ? ` alt="${alt}"` : ''} 
                         width="432" height="auto"
                         style="width: 432px; height: auto; max-height: 70vh; display: block; margin-left: auto; margin-right: auto; border: 0px;" />
                  </td>
                </tr>
              </table>
            </div>
          `;
        } else {
          // Inline layout for images in DOCX
          processedContent += `
            <div style="margin: 24pt 0; text-align: center; page-break-inside: avoid;">
              <p style="text-align: center; margin: 0; padding: 36pt;">
                <img src="${src}"${alt ? ` alt="${alt}"` : ''} 
                     width="432" height="auto"
                     style="width: 432px; height: auto; max-height: 500px; display: block; margin-left: auto; margin-right: auto; border: 0px;" />
              </p>
            </div>
          `;
        }
      } else if (part.trim()) {
        processedContent += part;
      }
    }
    
    return processedContent;
  };

  const chaptersHTML = chapters.map(chapter => `
    <div class="chapter">
      <h2 style="page-break-after: avoid;">${chapter.title}</h2>
      <div class="chapter-content">${processImagesForWord(chapter.content)}</div>
    </div>
  `).join('')

  return `
<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:m="http://schemas.microsoft.com/office/2004/12/omml" xmlns="http://www.w3.org/TR/REC-html40" lang="${book.metadata.language}">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="Microsoft Word 15">
  <meta name="Originator" content="Microsoft Word 15">
  <meta name="Author" content="${book.author}">
  <meta name="Title" content="${book.title}">
  <meta name="Subject" content="${book.metadata.description || ''}">
  <meta name="Keywords" content="${book.metadata.genre || ''}">
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotPromptForConvert/>
      <w:DoNotShowInsertionsAndDeletions/>
      <w:DoNotMarkInsertionsAndDeletions/>
      <w:ValidateAgainstSchemas/>
      <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
      <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
      <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
    </w:WordDocument>
    <o:DocumentProperties>
      <o:Author>${book.author}</o:Author>
      <o:LastAuthor>${book.author}</o:LastAuthor>
      <o:Title>${book.title}</o:Title>
      <o:Subject>${book.metadata.description || ''}</o:Subject>
      <o:Keywords>${book.metadata.genre || ''}</o:Keywords>
      <o:Description>Generated book document</o:Description>
    </o:DocumentProperties>
    <o:OfficeDocumentSettings>
      <o:RelyOnVML/>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <!--[if gte mso 9]>
  <xml>
    <w:LatentStyles DefLockedState="false" DefUnhideWhenUsed="false" DefSemiHidden="false" DefQFormat="false" DefPriority="99" LatentStyleCount="371">
      <w:LsdException Locked="false" Priority="0" QFormat="true" Name="Normal"/>
      <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 1"/>
      <w:LsdException Locked="false" Priority="9" SemiHidden="false" QFormat="true" Name="heading 2"/>
      <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 3"/>
    </w:LatentStyles>
  </xml>
  <![endif]-->
  <title>${title}</title>
  <style>
    /* Word-optimized styles */
    @page {
      size: 8.5in 11in;
      margin: ${book.formatting.marginTop}in ${book.formatting.marginRight}in ${book.formatting.marginBottom}in ${book.formatting.marginLeft}in;
    }
    
    body {
      font-family: "${book.formatting.fontFamily}", "Times New Roman", serif;
      font-size: ${book.formatting.fontSize}pt;
      line-height: ${book.formatting.lineHeight};
      margin: 0;
      padding: 0;
      background: white;
      color: black;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    h1 { 
      font-size: 24pt; 
      margin: 0pt 0pt 12pt 0pt; 
      text-align: center;
      page-break-before: always;
      page-break-after: avoid;
      font-weight: bold;
      font-family: "${book.formatting.fontFamily}", "Times New Roman", serif;
    }
    
    h2 { 
      font-size: 18pt; 
      margin: 24pt 0pt 12pt 0pt;
      font-weight: bold;
      font-family: "${book.formatting.fontFamily}", "Times New Roman", serif;
      page-break-after: avoid;
      ${book.formatting.chapterBreakStyle === 'page-break' ? 'page-break-before: always;' : ''}
      ${book.formatting.chapterBreakStyle === 'spacing' ? 'margin-top: 48pt;' : ''}
    }
    
    p {
      margin: ${(book.formatting.paragraphSpacing || 0.5) * 12}pt 0pt;
      ${book.formatting.firstLineIndent && book.formatting.firstLineIndent > 0 ? `text-indent: ${book.formatting.firstLineIndent * 12}pt;` : ''}
      text-align: ${book.formatting.textAlignment === 'justify' ? 'left' : book.formatting.textAlignment};
      orphans: 3;
      widows: 3;
      line-height: ${book.formatting.lineHeight};
    }
    
    .metadata {
      text-align: center;
      margin-bottom: 36pt;
      border-bottom: 1pt solid black;
      padding-bottom: 24pt;
      page-break-after: always;
    }
    
    .author {
      font-size: 14pt;
      font-style: italic;
      margin: 12pt 0pt;
    }
    
    .genre, .description {
      color: #666666;
      margin: 6pt 0pt;
    }
    
    .chapter {
      page-break-inside: avoid;
      margin-bottom: 24pt;
    }
    
    .chapter-content p {
      text-align: ${book.formatting.textAlignment === 'justify' ? 'left' : book.formatting.textAlignment};
    }
    
    /* Word-optimized image styles with explicit sizing */
    img {
      width: 432px !important;
      height: auto !important;
      max-height: 500px !important;
      display: block !important;
      margin-left: auto !important;
      margin-right: auto !important;
      border: 0px !important;
      page-break-inside: avoid !important;
    }
    
    /* VML styles for better Word compatibility */
    v\\:shape {
      behavior: url(#default#VML);
    }
    
    v\\:imagedata {
      behavior: url(#default#VML);
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

export const exportBook = async (book: Book, options: ExportOptions, storage: any): Promise<string> => {
  switch (options.format) {
    case 'html':
      return await exportToHTML(book, options, storage)
    case 'pdf':
      return await exportToPDFPreview(book, options, storage)
    case 'epub':
      // For now, return HTML - in a real app, you'd use a library like epub-gen
      return await exportToHTML(book, options, storage)
    case 'docx':
      // Enhanced Word-optimized export
      return await exportToDOCX(book, options, storage)
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