// src/lib/config.ts

// Helper function to determine the correct API base URL with dynamic port detection
let API_SERVER_PORT = 5000;  // Default port, should match Flask app.py's port

// Read dynamic port from file system (server-side only)
function readDynamicPort() {
  try {
    if (typeof window === 'undefined' && typeof process !== 'undefined') {
      // Only run in server-side environment
      const fs = require('fs');
      const path = '/tmp/nlp_api_port.txt';
      
      if (fs.existsSync(path)) {
        const port = parseInt(fs.readFileSync(path, 'utf8').trim(), 10);
        if (!isNaN(port) && port > 0) {
          console.log(`Found dynamic NLP API port: ${port}`);
          return port;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to read dynamic port file:', e);
  }
  
  // Check environment variable
  if (typeof process !== 'undefined' && process.env.CALAMANCY_API_PORT) {
    const envPort = parseInt(process.env.CALAMANCY_API_PORT, 10);
    if (!isNaN(envPort) && envPort > 0) {
      console.log(`Using CalamanCy API port from env: ${envPort}`);
      return envPort;
    }
  }
  
  return API_SERVER_PORT; // Fall back to default
}

// Initialize the port
API_SERVER_PORT = readDynamicPort();

// This function gets executed both in server-side rendering and browser
function getApiBaseUrl() {
  // If we're in the browser, check if there's a port override in localStorage
  if (typeof window !== 'undefined') {
    try {
      // Extra check to ensure localStorage is available
      if (typeof localStorage !== 'undefined') {
        const savedPort = localStorage.getItem('nlp_api_port');
        if (savedPort) {
          const port = parseInt(savedPort, 10);
          if (!isNaN(port) && port > 0) {
            return `http://localhost:${port}`;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to read port from localStorage:', e);
    }
    
    // Use default port if no override
    return `http://localhost:${API_SERVER_PORT}`;
  }
  
  // Server-side rendering case
  return process.env.NEXT_PUBLIC_NLP_API_URL || `http://localhost:${API_SERVER_PORT}`;
}

// API Endpoints
export const API_ENDPOINTS = {
    // The base URL for the NLP Flask API
    API_BASE_URL: getApiBaseUrl(),
    
    // Full endpoint URLs for direct API access
    CALAMANCY_API: `${getApiBaseUrl()}/api/pos-game`,
    HEALTH_ENDPOINT: `${getApiBaseUrl()}/health`,
    ANALYZE_ENDPOINT: `${getApiBaseUrl()}/api/analyze`,
    VERIFY_ENDPOINT: `${getApiBaseUrl()}/api/verify`,
    MAKE_SENTENCE_WORDS_ENDPOINT: `${getApiBaseUrl()}/api/make-sentence/words`,
    MAKE_SENTENCE_VERIFY_ENDPOINT: `${getApiBaseUrl()}/api/make-sentence/verify`,
    
    // Internal Next.js API routes that proxy to the Flask backend
    POS_GAME_PROXY: '/api/challenges/pos-game',
    NLP_TEST_PROXY: '/api/analyze',  // Point to our analyze endpoint
    MAKE_SENTENCE_WORDS_PROXY: '/api/challenges/make-sentence/words',
    MAKE_SENTENCE_VERIFY_PROXY: '/api/challenges/make-sentence/verify'
};

// App Configuration
export const APP_CONFIG = {
    // Default game settings
    GAME: {
        DEFAULT_POINTS_PER_CORRECT: 10,
        COMPLETION_BONUS: 20,
        PERFECT_SCORE_BONUS: 50
    },
    
    // Feature flags
    FEATURES: {
        ENABLE_STREAK_MULTIPLIER: true,
        SHOW_EXPLANATIONS: true
    }
};