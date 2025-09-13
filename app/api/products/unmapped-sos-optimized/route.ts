import { NextResponse } from 'next/server'
import { getUnmappedSosItems } from '@/lib/cache'

// Enable edge runtime for better performance (if dependencies support it)
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const startTime = performance.now()
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '0')
  const limit = parseInt(searchParams.get('limit') || '100')
  
  try {
    // Use the cached function
    const data = await getUnmappedSosItems(page, limit, 'default')
    
    const dbTime = data.queryTime || 0
    const totalTime = performance.now() - startTime
    const cacheStatus = dbTime < 10 ? 'hit' : 'miss'
    
    // Create response with CDN caching headers
    const response = NextResponse.json(data, {
      headers: {
        // CDN cache for 5 minutes, serve stale for 1 minute while revalidating
        'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
        // Server timing for monitoring
        'Server-Timing': `db;dur=${dbTime}, total;dur=${totalTime}, cache;desc="${cacheStatus}"`,
        // Custom headers for debugging
        'X-Cache-Status': cacheStatus,
        'X-Query-Time': `${dbTime}ms`,
        'X-Total-Time': `${totalTime}ms`
      }
    })
    
    return response
  } catch (error) {
    console.error('Error fetching unmapped SOS items:', error)
    const errorTime = performance.now() - startTime
    
    return NextResponse.json(
      { error: 'Failed to fetch unmapped SOS items' }, 
      { 
        status: 500,
        headers: {
          'Server-Timing': `error;dur=${errorTime}`,
          'Cache-Control': 'no-cache'
        }
      }
    )
  }
}