// src/app/api/challenges/make-sentence/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/config';

/**
 * API endpoint to verify sentences in the Make a Sentence game
 */
export async function POST(request: NextRequest) {
  try {
    // Get data from request body
    const body = await request.json();
    
    if (!body || !body.word || !body.sentence) {
      return NextResponse.json(
        { success: false, error: 'Please provide both word and sentence' },
        { status: 400 }
      );
    }
    
    const { word, sentence } = body;
    console.log(`Verifying sentence for word "${word}": "${sentence}"`);
    
    // Create a URL for the API request
    const url = `${API_ENDPOINTS.API_BASE_URL}/api/make-sentence/verify`;
    
    // Set a timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      // Make the request to the Python backend
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ word, sentence }),
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Try to get error information from the response
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to verify sentence (Status: ${response.status})`);
        } catch (jsonError) {
          throw new Error(`Failed to verify sentence (Status: ${response.status})`);
        }
      }
      
      const data = await response.json();
      console.log(`Verification result for "${word}": isCorrect=${data.isCorrect}, confidence=${data.confidence}`);
      
      // Add success flag to response
      return NextResponse.json({
        success: true,
        ...data
      });
    } catch (fetchError) {
      console.error('Error fetching from Python API:', fetchError);
      
      // No fallback implementation as verification must use the NLP model
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to connect to NLP service. Please ensure the server is running.',
          isCorrect: false,
          feedback: 'Hindi ma-verify ang iyong pangungusap. Pakitiyak na gumagana ang NLP server.'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}