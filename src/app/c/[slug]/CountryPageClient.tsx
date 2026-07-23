'use client'

import { useState, useEffect, useCallback } from 'react'
import { Country, Submission } from '@/lib/supabase'
import OnlineUsersWrapper from '../../OnlineUsersWrapper'
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

interface GalleryGroup {
  groupKey: string
  caption: string | null
  author_name: string | null
  story: string | null
  images: SubmissionWithUrl[]
}

export default function CountryPageClient({ country }: CountryPageClientProps) {
  const [groups, setGroups] = useState<GalleryGroup[]>([])

  const fetchGallery = useCallback(async () => {
    try {
      const response = await fetch(`/api/gallery?countryId=${country.id}`)
      const data = await response.json()
      
      if (data.success) {
        setGroups(data.groups)
      }
    } catch {
      console.error('Failed to fetch gallery')
    }
  }, [country.id])

  useEffect(() => {
    fetchGallery()
  }, [fetchGallery])

  const [groupLightboxOpen, setGroupLightboxOpen] = useState(false)
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(0)
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0)

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
          {/* Online users badge - top right */}
          <div className="flex justify-end mb-4">
            <OnlineUsersWrapper />
          </div>
          
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
            Welcome to the photo exhibition! Browse the gallery below.
          </p>
        </div>

        {/* Gallery - Grouped Posts (album style) */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-200 p-4 sm:p-6 mb-6 sm:mb-8 shadow-xl sm:shadow-2xl">
          <h2 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
            <span className="text-2xl mr-2">🖼️</span>
            Photo Gallery ({groups.reduce((sum, g) => sum + g.images.length, 0)} photos, {groups.length} posts)
          </h2>
          
          {groups.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-6xl mb-4">📸</div>
              <p className="text-gray-400 text-lg mb-2">No photos uploaded yet.</p>
              <p className="text-gray-500">Check back soon for photos from {country.name}!</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {groups.map((group, gIndex) => (
                <div key={group.groupKey} className="bg-white/90 rounded-xl p-4 sm:p-6 border border-amber-200 hover:border-amber-300 transition-all duration-300 shadow-lg max-w-4xl mx-auto">
                  {/* Multi-image carousel grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {group.images.map((img, iIndex) => (
                      <div key={img.id} className="relative">
                        <img
                          src={img.publicUrl}
                          alt={group.caption || 'Photo'}
                          className="w-full h-40 object-cover rounded-lg shadow cursor-pointer hover:opacity-90"
                          onClick={() => {
                            setActiveGroupIndex(gIndex)
                            setActiveImageIndex(iIndex)
                            setGroupLightboxOpen(true)
                          }}
                        />
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-[10px] text-rose-700 border border-rose-200">
                          {img.image_path.split('.').pop()?.toUpperCase()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Caption */}
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-rose-700 bg-rose-100 px-4 py-2 rounded-xl inline-block border border-rose-200 shadow-sm max-w-full break-words">
                      {group.caption || 'Untitled Activity'}
                    </h3>
                  </div>

                  {/* Story */}
                  <div className="mb-3">
                    <p className="text-rose-800 leading-relaxed text-base bg-white/60 p-4 rounded-xl border border-rose-100 break-words overflow-hidden">
                      {group.story || `This activity showcases moments from ${country.name}.`}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center text-sm bg-white/60 p-3 rounded-xl border border-rose-100">
                    <span className="text-rose-700 font-medium">📸: {group.author_name || 'Anonymous'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="text-center mt-16 pb-8">
          <p className="text-amber-500/70 text-sm font-medium">
            @ 2025 Game Based Learning For Empowered Youth (GLEY)
          </p>
        </div>
      </div>

      {/* Group Lightbox */}
      {groupLightboxOpen && groups[activeGroupIndex] && (
        <Lightbox
          open={groupLightboxOpen}
          close={() => setGroupLightboxOpen(false)}
          index={activeImageIndex}
          slides={groups[activeGroupIndex].images.map(img => ({
            src: img.publicUrl,
            alt: groups[activeGroupIndex].caption || 'Photo',
            title: groups[activeGroupIndex].caption || undefined,
            description: groups[activeGroupIndex].author_name ? `By ${groups[activeGroupIndex].author_name}` : undefined
          }))}
          plugins={[Fullscreen, Zoom, Download]}
          carousel={{ finite: true }}
        />
      )}
    </div>
  )
}
