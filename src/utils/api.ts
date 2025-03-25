/**
 * Central API client for communicating with backend services
 * This file consolidates all API calls to reduce duplication
 */

import { API_ENDPOINTS } from '@/lib/config';

/**
 * Base options for all API requests
 */
interface ApiRequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * Make a GET request to an API endpoint
 * @param endpoint The API endpoint to request
 * @param options Optional request configuration
 * @returns Promise with response data
 */
export async function apiGet<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const { headers = {}, timeout = 8000, signal } = options;
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      signal: signal || controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error ${response.status} for endpoint ${endpoint}:`);
      console.error(`Response body: ${errorText.substring(0, 500)}${errorText.length > 500 ? '...' : ''}`);
      
      if (endpoint.includes('/api/challenges/')) {
        console.error(`API endpoint ${endpoint} not found. Check that the API routes are properly set up.`);
      }
      
      throw new Error(`API error ${response.status}: ${errorText.substring(0, 200)}...`);
    }
    
    return await response.json() as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Make a POST request to an API endpoint
 * @param endpoint The API endpoint to request
 * @param data Data to send in the request body
 * @param options Optional request configuration
 * @returns Promise with response data
 */
export async function apiPost<T, U = any>(endpoint: string, data: U, options: ApiRequestOptions = {}): Promise<T> {
  const { headers = {}, timeout = 8000, signal } = options;
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data),
      signal: signal || controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Check the health of the NLP API
 * @returns Promise with health status
 */
export async function checkApiHealth() {
  try {
    return await apiGet<{
      status: string;
      model: string;
      model_status: string;
      pos_tags_available: string[];
    }>(`${API_ENDPOINTS.API_BASE_URL}/health`);
  } catch (error) {
    return {
      status: 'error',
      model: 'unknown',
      model_status: 'offline',
      pos_tags_available: []
    };
  }
}
