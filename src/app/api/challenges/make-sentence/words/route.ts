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
          { word: "Bayanihan", description: "Pagtulong ng maraming tao sa isa't isa upang matapos ang isang gawain" },
          { word: "Pagmamahal", description: "Malalim na pakiramdam ng malasakit at pagpapahalaga" },
          { word: "Kalayaan", description: "Katayuan ng pagiging malaya o hindi nakatali sa limitasyon" },
          { word: "Matatag", description: "Malakas at hindi madaling masira o matumba" },
          { word: "Kalikasan", description: "Ang natural na kapaligiran at lahat ng buhay na nilalang" },
          { word: "Kasiyahan", description: "Masayang pakiramdam o kalagayan" },
          { word: "Pakikipagkapwa", description: "Pakikitungo sa ibang tao bilang kapantay" },
          { word: "Pagtitiwala", description: "Pananalig sa kakayahan o katapatan ng ibang tao" },
          { word: "Kahusayan", description: "Kagalingan o kahigitan sa isang larangan" },
          { word: "Katatagan", description: "Lakas ng loob sa harap ng mga hamon" },
          { word: "Mapagkumbaba", description: "Walang kayabangan; mahinahon" },
          { word: "Mapagbigay", description: "Bukas-palad o handang tumulong" }
        ],
        count: 12,
        source: "fallback"
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