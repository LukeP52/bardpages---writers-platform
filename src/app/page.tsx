'use client'

import Link from 'next/link'
import { useState } from 'react'
import QuillEditor from '@/components/QuillEditor'

export default function Home() {
  const [content, setContent] = useState('<p>Start writing your next excerpt...</p>')

  return (
    <>
      {/* Hero Section */}
      <section className="section bg-white">
        <div className="container">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-8xl font-bold text-black mb-8 tracking-tight">
              BARD PAGES
            </h1>
            <p className="text-xl text-secondary mb-12 max-w-2xl mx-auto">
              A minimalist platform for writers to craft excerpts, build storyboards, and create books with precision.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/excerpts" className="btn btn-primary">
                Start Writing
              </Link>
              <Link href="/storyboards" className="btn btn-secondary">
                View Storyboards
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* Features Grid */}
      <section className="section-sm bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            <Link href="/excerpts" className="group">
              <div className="card p-12 text-center border-r-0 md:border-r">
                <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-bold">01</span>
                </div>
                <h3 className="text-2xl font-bold text-black mb-4 uppercase tracking-wide">
                  Excerpts
                </h3>
                <p className="text-secondary">
                  Write and organize your story fragments with our powerful rich text editor.
                </p>
              </div>
            </Link>

            <Link href="/storyboards" className="group">
              <div className="card p-12 text-center border-r-0 md:border-r">
                <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-bold">02</span>
                </div>
                <h3 className="text-2xl font-bold text-black mb-4 uppercase tracking-wide">
                  Storyboards
                </h3>
                <p className="text-secondary">
                  Structure your narratives by arranging excerpts into coherent storylines.
                </p>
              </div>
            </Link>

            <Link href="/books" className="group">
              <div className="card p-12 text-center">
                <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-bold">03</span>
                </div>
                <h3 className="text-2xl font-bold text-black mb-4 uppercase tracking-wide">
                  Books
                </h3>
                <p className="text-secondary">
                  Transform storyboards into formatted manuscripts ready for publication.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* Workflow */}
      <section className="section-sm bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-4 uppercase tracking-wide">
              Your Workflow
            </h2>
            <p className="text-secondary max-w-2xl mx-auto">
              A streamlined process designed for serious writers who demand clarity and focus.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-24 h-24 border-2 border-black flex items-center justify-center mx-auto mb-6">
                <span className="text-black text-xl font-bold">WRITE</span>
              </div>
              <h3 className="text-lg font-bold text-black mb-2 uppercase tracking-wide">Create</h3>
              <p className="text-sm text-secondary">Draft excerpts with focus</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 border-2 border-black flex items-center justify-center mx-auto mb-6">
                <span className="text-black text-xl font-bold">BUILD</span>
              </div>
              <h3 className="text-lg font-bold text-black mb-2 uppercase tracking-wide">Organize</h3>
              <p className="text-sm text-secondary">Structure into storyboards</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 border-2 border-black flex items-center justify-center mx-auto mb-6">
                <span className="text-black text-xl font-bold">SHIP</span>
              </div>
              <h3 className="text-lg font-bold text-black mb-2 uppercase tracking-wide">Publish</h3>
              <p className="text-sm text-secondary">Export finished books</p>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* Editor Demo */}
      <section className="section bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-black mb-6 uppercase tracking-wide">
                Live Editor
              </h2>
              <p className="text-secondary mb-8">
                Experience our writing environment. Every keystroke is captured with precision, 
                every format preserved with intention.
              </p>
              <QuillEditor
                value={content}
                onChange={setContent}
                placeholder="Begin your story here..."
                className="min-h-[400px] border-2 border-black"
              />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-black mb-6 uppercase tracking-wide">
                Preview
              </h3>
              <p className="text-secondary mb-8">
                See your work as readers will. Clean, distraction-free, exactly as intended.
              </p>
              <div className="border-2 border-black p-8 min-h-[400px] bg-white">
                <div
                  className="prose prose-lg max-w-none text-black"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}