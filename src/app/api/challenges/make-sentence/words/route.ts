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
      
      // Use expanded fallback data with 10 unique words
      return NextResponse.json({
        words: [
          { id: 'bata', word: 'Bata', grade: 'G1_2', imageUrl: '/Bata.gif', sentences: ['Ang bata ay mahilig mag laro sa ulan.'] },
          { id: 'aklat', word: 'Aklat', grade: 'G1_2', imageUrl: '/images/aklat.png', sentences: ['May bagong aklat sa silid-aklatan.'] },
          { id: 'timpalak', word: 'Timpalak', grade: 'G3_4', imageUrl: '/images/timpalak.png', sentences: ['Sumali sila sa timpalak sa paaralan.'] }
        ],
        count: 3,
        source: 'fallback'
      });
    }
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}