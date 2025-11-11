import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
          Welcome to{' '}
          <span className="text-blue-600">Bard Pages</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          A comprehensive platform for writers to manage excerpts, create storyboards, and publish books.
        </p>
      </div>

      <div className="mt-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/excerpts" className="group">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Manage Excerpts
              </h3>
              <p className="text-gray-500">
                Write, edit, and organize your story excerpts with rich text editing and tagging.
              </p>
            </div>
          </Link>

          <Link href="/storyboards" className="group">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Create Storyboards
              </h3>
              <p className="text-gray-500">
                Organize your excerpts into structured storyboards to plan your books.
              </p>
            </div>
          </Link>

          <Link href="/books" className="group">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Publish Books
              </h3>
              <p className="text-gray-500">
                Transform your storyboards into formatted books ready for publication.
              </p>
            </div>
          </Link>
        </div>
      </div>

      <div className="mt-16 bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Writing Workflow</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h3 className="font-semibold text-gray-900">Write Excerpts</h3>
            <p className="text-sm text-gray-500 mt-1">Create and tag your story pieces</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">2</span>
            </div>
            <h3 className="font-semibold text-gray-900">Build Storyboards</h3>
            <p className="text-sm text-gray-500 mt-1">Organize excerpts into book structure</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">3</span>
            </div>
            <h3 className="font-semibold text-gray-900">Create Books</h3>
            <p className="text-sm text-gray-500 mt-1">Format and export your final work</p>
          </div>
        </div>
      </div>
    </div>
  )
}