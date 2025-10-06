// src/app/api/challenges/make-sentence/words/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/config';

/**
 * API endpoint to get words for Make a Sentence game
 */
export async function GET(request: NextRequest) {
  try {
    // Forward user's grade level if provided
    const grade = request.nextUrl.searchParams.get('grade') || '';
    // Create a URL for the API request with optional grade
    const url = `${API_ENDPOINTS.API_BASE_URL}/api/make-sentence/words${grade ? `?grade=${encodeURIComponent(grade)}` : ''}`;
    console.log(`Fetching Make a Sentence words from: ${url}`);
    
    // Set a timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      // Make the request to the Python backend
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch words (Status: ${response.status})`);
      }
      
      const data = await response.json();
      console.log(`Successfully received ${data.count} words for Make a Sentence game`);
      
      return NextResponse.json(data);
    } catch (fetchError) {
      console.error('Error fetching from Python API:', fetchError);
      
      // Do not return fallback data; surface the error so issues are visible
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch words from the JSON word bank. Ensure the backend is reachable and the word files exist.'
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}