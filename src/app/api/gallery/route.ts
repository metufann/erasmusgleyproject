import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const countryId = searchParams.get('countryId')

    if (!countryId) {
      return NextResponse.json(
        { error: 'Country ID is required' },
        { status: 400 }
      )
    }

    // Get approved submissions for the country from database
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('id, country_id, image_path, caption, author_name, approved, created_at, story')
      .eq('country_id', countryId)
      .eq('approved', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Gallery fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch gallery' },
        { status: 500 }
      )
    }

    // Get public URLs for all images
    const submissionsWithUrls = submissions?.map(submission => {
      const { data: { publicUrl } } = supabase.storage
        .from('submissions')
        .getPublicUrl(submission.image_path)
      
      return {
        ...submission,
        publicUrl
      }
    }) || []

    return NextResponse.json({
      success: true,
      submissions: submissionsWithUrls
    })

  } catch (error) {
    console.error('Gallery error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 