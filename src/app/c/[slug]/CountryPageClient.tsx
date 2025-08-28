'use client'

import { useState, useEffect, useCallback } from 'react'
import { Country, Submission } from '@/lib/supabase'
import PhotoAlbum from 'react-photo-album'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { Fullscreen, Zoom, Download } from 'yet-another-react-lightbox/plugins'

interface CountryPageClientProps {
  country: Country
}

interface SubmissionWithUrl extends Submission {
  publicUrl: string
  story?: string
  original_width?: number
  original_height?: number
}

export default function CountryPageClient({ country }: CountryPageClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [submissions, setSubmissions] = useState<SubmissionWithUrl[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    image: null as File | null,
    caption: '',
    authorName: '',
    story: '',
    imageWidth: 0,
    imageHeight: 0,
    accessCode: ''
  })
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [submissionToDelete, setSubmissionToDelete] = useState<number | null>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [adminDeleteCode, setAdminDeleteCode] = useState('')

  const fetchGallery = useCallback(async () => {
    try {
      const response = await fetch(`/api/gallery?countryId=${country.id}`)
      const data = await response.json()
      
      if (data.success) {
        setSubmissions(data.submissions)
      }
    } catch (err) {
      console.error('Failed to fetch gallery:', err)
    }
  }, [country.id])

  // Load gallery immediately on mount (no authentication needed)
  useEffect(() => {
    fetchGallery()
  }, [fetchGallery])

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadForm.image || !uploadForm.accessCode) return

    setIsUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('image', uploadForm.image)
      formData.append('caption', uploadForm.caption)
      formData.append('authorName', uploadForm.authorName)
      formData.append('story', uploadForm.story)
      formData.append('accessCode', uploadForm.accessCode)
      formData.append('countrySlug', country.slug)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setUploadForm({ image: null, caption: '', authorName: '', story: '', imageWidth: 0, imageHeight: 0, accessCode: '' })
        fetchGallery() // Refresh gallery
        setError('')
        setUploadModalOpen(false) // Close modal on success
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch {
      setError('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Get image dimensions
      const img = new Image()
      img.onload = () => {
        setUploadForm(prev => ({ 
          ...prev, 
          image: file,
          imageWidth: img.width,
          imageHeight: img.height
        }))
      }
      img.src = URL.createObjectURL(file)
    }
  }

  const handleDeleteSubmission = async (submissionId: number) => {
    setSubmissionToDelete(submissionId)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!submissionToDelete || !adminDeleteCode) return

    try {
      const response = await fetch('/api/delete-submission', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          submissionId: submissionToDelete, 
          adminDeleteCode: adminDeleteCode
        })
      })

      const data = await response.json()

      if (data.success) {
        // Remove from local state
        setSubmissions(prev => prev.filter(s => s.id !== submissionToDelete))
        setError('')
        setDeleteConfirmOpen(false)
        setSubmissionToDelete(null)
        setAdminDeleteCode('')
      } else {
        setError(data.error || 'Failed to delete submission')
      }
    } catch (err) {
      setError('Failed to delete submission')
    }
  }

  const photos = submissions.map((submission) => ({
    src: submission.publicUrl,
    width: 800,
    height: 600,
    alt: submission.caption || 'Photo',
    submission
  }))

  const slides = submissions.map(submission => ({
    src: submission.publicUrl,
    alt: submission.caption || 'Photo',
    title: submission.caption,
    description: submission.author_name ? `By ${submission.author_name}` : undefined
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-100 relative">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-200/30 to-orange-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-yellow-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-orange-200/20 to-yellow-200/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 pt-6 pb-8 relative z-10">
        {/* Clean Header */}
        <div className="text-center mb-6 sm:mb-8 mt-4">
          <div className="flex flex-col sm:flex-row items-center justify-center mb-4 sm:mb-6 gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 aspect-square relative shrink-0">
              {country.flag_svg_url ? (
                <div className="w-full h-full rounded-full overflow-hidden shadow-xl sm:shadow-2xl border-2 border-rose-200 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-200/30 to-orange-200/30 rounded-full blur-lg"></div>
                  <img
                    src={country.flag_svg_url}
                    alt={`${country.name} flag`}
                    className="w-full h-full object-cover relative z-10"
                  />
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-rose-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-xl sm:shadow-2xl">
                  {country.name.charAt(0)}
                </div>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 bg-clip-text text-transparent text-center">
              {country.name} Photo Exhibition
            </h1>
          </div>
          <div className="w-32 sm:w-40 h-1 bg-gradient-to-r from-rose-400 to-orange-400 mx-auto rounded-full mb-3 sm:mb-4"></div>
          <p className="text-rose-600 font-medium text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-4">
            Welcome to the photo exhibition! View the gallery below and contribute your own photos.
          </p>
        </div>

        {/* Gallery - New Slider Layout */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-200 p-4 sm:p-6 mb-6 sm:mb-8 shadow-xl sm:shadow-2xl">
          <h2 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
            <span className="text-2xl mr-2">🖼️</span>
            Photo Gallery ({submissions.length} photos)
          </h2>
          
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-6xl mb-4">📸</div>
              <p className="text-gray-400 text-lg mb-2">No photos uploaded yet.</p>
              <p className="text-gray-500">Be the first to share a photo from {country.name}!</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {submissions.map((submission, index) => (
                <div key={submission.id} className="bg-white/90 rounded-xl p-4 sm:p-6 border border-amber-200 hover:border-amber-300 transition-all duration-300 shadow-lg max-w-4xl mx-auto">
                  {/* Photo - Responsive Size with Info */}
                  <div className="mb-4 relative">
                    <img
                      src={submission.publicUrl}
                      alt={submission.caption || 'Photo'}
                      className="w-full max-w-2xl mx-auto h-auto max-h-96 object-contain rounded-lg shadow-xl cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                      onClick={() => {
                        setLightboxIndex(index)
                        setLightboxOpen(true)
                      }}
                    />
                    
                    {/* Photo Info Overlay */}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-rose-700 font-medium border border-rose-200">
                      <div>📏 {submission.image_path ? submission.image_path.split('.').pop()?.toUpperCase() : 'JPG'}</div>
                      <div className="text-rose-600 mt-1">
                        {submission.original_width && submission.original_height ? 
                          `${submission.original_width} × ${submission.original_height}` : 
                          'Original size'
                        }
                      </div>
                    </div>
                  </div>
                  
                  {/* Short Caption - Better Colors */}
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-rose-700 bg-rose-100 px-4 py-2 rounded-xl inline-block border border-rose-200 shadow-sm max-w-full break-words">
                      {submission.caption || 'Untitled Photo'}
                    </h3>
                  </div>
                  
                  {/* Long Story - Full Content */}
                  <div className="mb-3">
                    <p className="text-rose-800 leading-relaxed text-base bg-white/60 p-4 rounded-xl border border-rose-100 break-words overflow-hidden">
                      {submission.story || 
                        `This captivating image captures the essence of ${country.name}. ${submission.caption || 'The photographer has beautifully documented a moment that tells a unique story about this remarkable place.'} Every photograph has a story, and this one invites us to explore the rich tapestry of experiences that make this country special. Through the lens of the photographer, we can see the beauty, culture, and human connection that defines ${country.name}.`
                      }
                    </p>
                  </div>
                  
                  {/* Author Info & Delete Button */}
                  <div className="flex items-center justify-between text-sm bg-white/60 p-3 rounded-xl border border-rose-100">
                    <div className="flex items-center space-x-4">
                      <span className="text-rose-700 font-medium">📸 By: {submission.author_name || 'Anonymous'}</span>
                      <span className="text-rose-600">📅 {new Date(submission.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Delete Button - Only show for authenticated users */}
                    <button
                      onClick={() => handleDeleteSubmission(submission.id)}
                      className="text-red-500 hover:text-red-600 transition-colors duration-200 px-3 py-1 rounded-lg hover:bg-red-100 border border-red-200"
                      title="Delete this photo"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Content Section - Simple button to open modal */}
        <div className="text-center mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rose-200 p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-rose-700 mb-3">Want to contribute?</h3>
            
            <button
              onClick={() => setUploadModalOpen(true)}
              className="w-full bg-gradient-to-r from-rose-500 to-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-rose-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              📸 Add Activity
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-16 pb-8">
          <p className="text-amber-500/70 text-sm font-medium">
            @ 2025 Game Based Learning For Empowered Youth (GLEY)
          </p>
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={slides}
        plugins={[Fullscreen, Zoom, Download]}
        carousel={{
          finite: true
        }}
      />

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md border border-white/50 rounded-3xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent mb-2">
                📸 Upload Your Activity
              </h3>
              <div className="w-20 h-1 bg-gradient-to-r from-rose-400 to-orange-400 mx-auto rounded-full"></div>
            </div>

            {/* Upload Form */}
            <form onSubmit={handleImageUpload} className="space-y-6">
              {/* File Upload Area */}
              <div className="text-center">
                <div className="border-2 border-dashed border-rose-200 rounded-2xl p-8 hover:border-rose-300 transition-colors duration-300">
                  <input
                    type="file"
                    id="image"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                  <label htmlFor="image" className="cursor-pointer">
                    <div className="text-6xl mb-4">📁</div>
                    <p className="text-rose-600 font-medium text-lg mb-2">
                      {uploadForm.image ? uploadForm.image.name : 'Click to select image'}
                    </p>
                    {uploadForm.image && (
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-3">
                        <p className="text-rose-700 text-sm font-medium">
                          📏 File Type: {uploadForm.image.name.split('.').pop()?.toUpperCase()}
                        </p>
                        <p className="text-rose-600 text-sm">
                          📊 File Size: {(uploadForm.image.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <p className="text-rose-600 text-sm">
                          📐 Dimensions: {uploadForm.imageWidth && uploadForm.imageHeight ? 
                            `${uploadForm.imageWidth} × ${uploadForm.imageHeight} px` : 
                            'Loading...'
                          }
                        </p>
                      </div>
                    )}
                    <p className="text-rose-400 text-sm">
                      JPG, PNG, WebP up to 5MB
                    </p>
                  </label>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-rose-700 mb-2">
                    Learning Objectives
                  </label>
                  <input
                    type="text"
                    value={uploadForm.authorName}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, authorName: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl text-rose-800 placeholder-rose-400 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-300"
                    placeholder="Enter learning objectives..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-rose-700 mb-2">
                    Activity Name
                  </label>
                  <input
                    type="text"
                    value={uploadForm.caption}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, caption: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl text-rose-800 placeholder-rose-400 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-300"
                    placeholder="Enter activity name..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-rose-700 mb-2">
                  Activity Details
                </label>
                <textarea
                  value={uploadForm.story || ''}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, story: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl text-rose-800 placeholder-rose-400 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-300 resize-none"
                  placeholder="Describe the activity details..."
                />
              </div>

              {/* Access Code Field */}
              <div>
                <label className="block text-sm font-medium text-rose-700 mb-2">
                  Access Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={uploadForm.accessCode}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, accessCode: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl text-rose-800 placeholder-rose-400 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-300"
                  placeholder="Enter your access code to upload..."
                  required
                />
                <p className="text-rose-500 text-xs mt-1">
                  Access code is required to upload content
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadForm.image || !uploadForm.accessCode}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl font-medium hover:from-rose-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {isUploading ? '📤 Uploading...' : '📤 Upload Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">🗑️ Delete Photo</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete this photo? This action cannot be undone.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Admin Delete Code <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={adminDeleteCode}
                onChange={(e) => setAdminDeleteCode(e.target.value)}
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter admin delete code..."
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false)
                  setSubmissionToDelete(null)
                  setAdminDeleteCode('')
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={!adminDeleteCode}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 