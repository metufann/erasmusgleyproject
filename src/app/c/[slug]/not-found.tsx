import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-500 text-8xl mb-8">🏳️</div>
        <h1 className="text-4xl font-bold text-white mb-6">
          Country Not Found
        </h1>
        <p className="text-gray-400 text-xl mb-10 max-w-md mx-auto leading-relaxed">
          The country you&apos;re looking for doesn&apos;t exist or is not participating in this exhibition.
        </p>
        <Link
          href="/"
          className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
} 