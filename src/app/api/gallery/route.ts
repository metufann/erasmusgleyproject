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

    // Build grouped posts by batch folder in image_path: <countryId>/<batchId>/file
    const submissionsWithUrls = (submissions || []).map(submission => {
      const { data: { publicUrl } } = supabase.storage
        .from('submissions')
        .getPublicUrl(submission.image_path)

      return { ...submission, publicUrl }
    })

    type SubmissionWithUrl = typeof submissionsWithUrls[number]
    type Group = {
      groupKey: string
      caption: string | null
      author_name: string | null
      story: string | null
      created_at: string
      images: SubmissionWithUrl[]
    }

    const groupsMap = new Map<string, Group>()

    for (const sub of submissionsWithUrls) {
      const parts = sub.image_path.split('/')
      // image_path usually: countryId/batchId/filename
      // Backward compatibility: if no batch folder, use the filename as group key
      const groupKey = parts.length >= 3 ? `${parts[0]}/${parts[1]}` : `${parts[0]}/${parts[1] ?? sub.image_path}`

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          groupKey,
          caption: sub.caption,
          author_name: sub.author_name,
          story: sub.story as string | null,
          created_at: sub.created_at,
          images: []
        })
      }
      groupsMap.get(groupKey)!.images.push(sub)
    }

    // Sort images inside each group by created_at ascending
    const groups = Array.from(groupsMap.values()).map(g => ({
      ...g,
      images: g.images.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }))
    // Sort groups by most recent
    groups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({
      success: true,
      groups
    })

  } catch (error) {
    console.error('Gallery error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 