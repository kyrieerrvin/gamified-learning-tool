// src/app/api/challenges/pos-game/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/config';

// Define timeout for external API calls
const API_TIMEOUT = 20000; // 20 seconds - increased for NLP model loading and network latency

// Debug function to log detailed connection info
function logConnectionInfo(apiUrl: string) {
  console.log(`----- API CONNECTION DEBUG INFO -----`);
  console.log(`Target URL: ${apiUrl}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`API Base URL: ${API_ENDPOINTS.API_BASE_URL}`);
  console.log(`Headers: ${{
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }}`);
  console.log(`Timeout: ${API_TIMEOUT}ms`);
  console.log(`-----------------------------------`);
}

export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const difficulty = searchParams.get('difficulty') || 'medium';
  
  try {
    console.log(`Attempting to connect to Flask backend at: ${API_ENDPOINTS.CALAMANCY_API}`);
    
    // First check if the API is available with a health check
    try {
      const healthResponse = await fetch(API_ENDPOINTS.HEALTH_ENDPOINT, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log(`Flask API health check successful: ${JSON.stringify(healthData)}`);
      } else {
        console.warn(`Flask API health check failed with status: ${healthResponse.status}`);
      }
    } catch (healthError) {
      console.error(`Flask API health check failed: ${healthError}`);
    }
    
    // Create an abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    // Make request to the Flask backend with CalamanCy NLP
    // Use the correct endpoint path for the Flask API
    const apiUrl = `${API_ENDPOINTS.API_BASE_URL}/api/pos-game?difficulty=${difficulty}`;
    console.log(`Making request to: ${apiUrl}`);
    
    // Log detailed connection info for debugging
    logConnectionInfo(apiUrl);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
        cache: 'no-store', // Don't cache responses
      });
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      // Check if the request was successful
      if (!response.ok) {
        let errorMessage = `Failed to fetch from CalamanCy API (${response.status}: ${response.statusText})`;
        
        try {
          const errorData = await response.json();
          console.error(`Error from CalamanCy API: ${JSON.stringify(errorData)}`);
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // If we can't parse JSON, try to get the text
          const errorText = await response.text().catch(() => '');
          console.error(`Error response from CalamanCy API (not JSON): ${errorText}`);
          errorMessage = errorText || errorMessage;
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: response.status }
        );
      }
      
      // Get the data from the response and validate it
      try {
        const data = await response.json();
        console.log(`Successfully received data from Flask API: ${Object.keys(data).join(', ')}`);
        
        // Basic validation to ensure the data has the expected structure
        if (!data || !data.sentence || !data.questions || !Array.isArray(data.questions)) {
          console.error('Invalid data structure received:', data);
          throw new Error('Invalid data structure received from CalamanCy API');
        }
        
        return NextResponse.json(data);
      } catch (parseError) {
        console.error('Error parsing response from CalamanCy API:', parseError);
        return NextResponse.json(
          { error: 'Invalid response format from CalamanCy API' },
          { status: 502 }
        );
      }
    } catch (fetchError: any) {
      console.error('Error fetching from CalamanCy API:', fetchError);
      
      // Specific error for timeout
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'CalamanCy API request timed out. Please try again later.' },
          { status: 504 }
        );
      }
      
      // Provide more specific error details to help with debugging
      const errorMessage = fetchError.message || 'Unknown error';
      return NextResponse.json(
        { 
          error: 'Failed to connect to CalamanCy service. Please try again later.',
          details: errorMessage,
          apiUrl: apiUrl 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error connecting to CalamanCy API:', error);
    
    // Provide more specific error details to help with debugging
    const errorMessage = error.message || 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to connect to CalamanCy service. Please try again later.',
        details: errorMessage,
        apiUrl: API_ENDPOINTS.CALAMANCY_API 
      },
      { status: 500 }
    );
  }
}