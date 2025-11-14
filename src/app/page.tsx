'use client'

import Link from 'next/link'
import { 
  DocumentTextIcon, 
  BookOpenIcon, 
  FilmIcon, 
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center mb-6">
              <SparklesIcon className="w-8 h-8 text-blue-600 mr-3" />
              <span className="text-blue-600 font-medium">Professional Writing Platform</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Transform Your Stories into
              <span className="block text-blue-600">Published Works</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              A comprehensive platform for writers to craft excerpts, organize storyboards, and create professional manuscripts with ease.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/excerpts" className="btn btn-primary btn-lg inline-flex items-center">
                  Start Writing
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/storyboards" className="btn btn-secondary btn-lg">
                  Explore Features
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Write
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From first draft to final manuscript, our platform provides all the tools you need.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="h-full"
            >
              <Link href="/excerpts" className="block group h-full">
                <div className="card card-interactive p-8 text-center h-full flex flex-col">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <DocumentTextIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Excerpts
                  </h3>
                  <p className="text-gray-600 leading-relaxed flex-grow">
                    Write and organize your story fragments with our powerful rich text editor.
                  </p>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="h-full"
            >
              <Link href="/storyboards" className="block group h-full">
                <div className="card card-interactive p-8 text-center h-full flex flex-col">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <FilmIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Storyboards
                  </h3>
                  <p className="text-gray-600 leading-relaxed flex-grow">
                    Structure your narratives by arranging excerpts into coherent storylines.
                  </p>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="h-full"
            >
              <Link href="/books" className="block group h-full">
                <div className="card card-interactive p-8 text-center h-full flex flex-col">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <BookOpenIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Books
                  </h3>
                  <p className="text-gray-600 leading-relaxed flex-grow">
                    Transform storyboards into formatted manuscripts ready for publication.
                  </p>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Powerful Workflow
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A streamlined process designed for writers who demand clarity and focus.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Create', desc: 'Draft excerpts with focus', number: '01' },
              { title: 'Organize', desc: 'Structure into storyboards', number: '02' },
              { title: 'Publish', desc: 'Export finished books', number: '03' }
            ].map((step, index) => (
              <motion.div 
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-white border-2 border-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <span className="text-blue-600 text-lg font-bold">{step.number}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}