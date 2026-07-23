import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { submissionId, groupKey } = await request.json()

    if (!submissionId && !groupKey) {
      return NextResponse.json(
        { error: 'Submission ID or groupKey is required' },
        { status: 400 }
      )
    }

    if (groupKey) {
      const prefix = `${groupKey}/`

      const { data: rows, error: listError } = await supabase
        .from('submissions')
        .select('id, image_path')
        .like('image_path', `${prefix}%`)

      if (listError) {
        return NextResponse.json(
          { error: listError.message || 'Failed to find group submissions' },
          { status: 500 }
        )
      }

      if (!rows?.length) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        )
      }

      const paths = rows.map(r => r.image_path).filter(Boolean)
      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('submissions')
          .remove(paths)
        if (storageError) {
          console.error('Storage deletion error:', storageError)
        }
      }

      const { data: deletedRows, error: dbError } = await supabase
        .from('submissions')
        .delete()
        .like('image_path', `${prefix}%`)
        .select('id')

      if (dbError) {
        console.error('Database deletion error:', dbError)
        return NextResponse.json(
          { error: dbError.message || 'Failed to delete group' },
          { status: 500 }
        )
      }

      if (!deletedRows?.length) {
        return NextResponse.json(
          {
            error:
              'Delete was blocked by database permissions. Run supabase-policies.sql in the Supabase SQL Editor.',
          },
          { status: 403 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Post deleted successfully',
        deletedCount: deletedRows.length,
      })
    }

    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    if (submission.image_path) {
      const { error: storageError } = await supabase.storage
        .from('submissions')
        .remove([submission.image_path])
      if (storageError) {
        console.error('Storage deletion error:', storageError)
      }
    }

    const { data: deletedRows, error: dbError } = await supabase
      .from('submissions')
      .delete()
      .eq('id', submissionId)
      .select('id')

    if (dbError) {
      console.error('Database deletion error:', dbError)
      return NextResponse.json(
        { error: dbError.message || 'Failed to delete submission' },
        { status: 500 }
      )
    }

    if (!deletedRows?.length) {
      return NextResponse.json(
        {
          error:
            'Delete was blocked by database permissions. Run supabase-policies.sql in the Supabase SQL Editor.',
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Submission deleted successfully',
      deletedCount: deletedRows.length,
    })
  } catch (error) {
    console.error('Delete submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
