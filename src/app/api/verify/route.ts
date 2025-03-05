// src/app/api/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    // Get data from the request body
    const body = await request.json();
    const { word, sentence, selected } = body;
    
    if (!word || !sentence || !selected) {
      return NextResponse.json(
        { error: 'Word, sentence, and selected answer are required' },
        { status: 400 }
      );
    }
    
    // Create an abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
    
    console.log(`Proxying verify request to Flask API at: ${API_ENDPOINTS.VERIFY_ENDPOINT}`);
    console.log(`Verifying word "${word}" in sentence "${sentence}"`);
    
    try {
      // Forward the request to the Flask API
      const response = await fetch(API_ENDPOINTS.VERIFY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ word, sentence, selected }),
        signal: controller.signal,
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Check if request was successful
      if (!response.ok) {
        let errorMessage = `Failed to verify answer (Status: ${response.status})`;
        
        try {
          const errorData = await response.json();
          console.error(`Error from Flask API: ${JSON.stringify(errorData)}`);
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // If we can't parse JSON, try to get the text
          const errorText = await response.text().catch(() => '');
          console.error(`Error response from Flask API (not JSON): ${errorText}`);
          errorMessage = errorText || errorMessage;
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: response.status }
        );
      }
      
      // Get the data from the response
      const data = await response.json();
      console.log(`Successfully verified answer. Correct: ${data.is_correct}`);
      
      return NextResponse.json(data);
    } catch (fetchError: any) {
      console.error('Error fetching from Flask API:', fetchError);
      clearTimeout(timeoutId);
      
      return NextResponse.json(
        { 
          error: 'Failed to verify answer with NLP service',
          details: fetchError.message || 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in verify endpoint:', error);
    
    return NextResponse.json(
      { error: 'Error verifying answer: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}