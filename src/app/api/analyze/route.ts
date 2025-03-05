// src/app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/config';

// Fallback function for sentence analysis when Flask API is unavailable
function simpleFallbackTagging(sentence: string) {
  // Dictionary mapping common Tagalog words to their POS
  const TAGALOG_POS_MAP: Record<string, string> = {
    // Pronouns (Panghalip)
    "ako": "PRON", "ikaw": "PRON", "ka": "PRON", "siya": "PRON", "kami": "PRON", 
    "tayo": "PRON", "kayo": "PRON", "sila": "PRON", "niya": "PRON", "nila": "PRON",
    "ko": "PRON", "mo": "PRON", "namin": "PRON", "natin": "PRON", "ninyo": "PRON",
    // Verbs (Pandiwa)
    "kumain": "VERB", "kumakain": "VERB", "kakain": "VERB", "kinain": "VERB",
    "uminom": "VERB", "umiinom": "VERB", "iinom": "VERB", "ininom": "VERB",
    "magluto": "VERB", "nagluluto": "VERB", "magluluto": "VERB", "niluto": "VERB",
    "bumili": "VERB", "bumibili": "VERB", "bibili": "VERB", "binili": "VERB",
    "tumakbo": "VERB", "tumatakbo": "VERB", "tatakbo": "VERB",
    "magbasa": "VERB", "nagbabasa": "VERB", "magbabasa": "VERB", "binasa": "VERB",
    // Nouns (Pangngalan)
    "bahay": "NOUN", "paaralan": "NOUN", "kotse": "NOUN", "mesa": "NOUN",
    "silya": "NOUN", "libro": "NOUN", "pagkain": "NOUN", "tubig": "NOUN",
    "lalaki": "NOUN", "babae": "NOUN", "bata": "NOUN", "magulang": "NOUN",
    "guro": "NOUN", "kaibigan": "NOUN", "lungsod": "NOUN", "bansa": "NOUN",
    "mansanas": "NOUN", "pera": "NOUN", "oras": "NOUN", "araw": "NOUN",
    // Adjectives (Pang-uri)
    "maganda": "ADJ", "mabait": "ADJ", "masaya": "ADJ", "malungkot": "ADJ",
    "mataas": "ADJ", "mababa": "ADJ", "malaki": "ADJ", "maliit": "ADJ",
    "masarap": "ADJ", "mainit": "ADJ", "malamig": "ADJ",
    "matalino": "ADJ", "matamis": "ADJ", "bagong": "ADJ",
    // Adverbs (Pang-abay)
    "mabilis_adv": "ADV", "mabagal_adv": "ADV", "kanina": "ADV", "bukas": "ADV",
    "kahapon": "ADV", "ngayon": "ADV", "palagi": "ADV", "minsan": "ADV",
    "tuwing": "ADV", "lagi": "ADV", "dito": "ADV", "doon": "ADV", 
    "agad": "ADV", "taun-taon": "ADV", "araw-araw": "ADV", "madalas": "ADV",
    // Determiners (Pantukoy)
    "ang": "DET", "mga": "DET", "ito": "DET", "iyon": "DET", "yung": "DET",
    // Prepositions (Pang-ukol)
    "sa": "ADP", "ng": "ADP", "para": "ADP", "mula": "ADP", "tungkol": "ADP",
    "hanggang": "ADP", "dahil": "ADP",
    // Particles (Panghikayat)
    "ay": "PART", "ba": "PART", "na": "PART", "pa": "PART", "raw": "PART", "daw": "PART",
    "lamang": "PART", "lang": "PART", "din": "PART", "rin": "PART", "pala": "PART"
  };
  
  // POS descriptions
  const POS_DESCRIPTIONS: Record<string, string> = {
    "PRON": "Panghalip (Pronoun)",
    "VERB": "Pandiwa (Verb)",
    "ADV": "Pang-Abay (Adverb)",
    "ADJ": "Pang-Uri (Adjective)",
    "NOUN": "Pangngalan (Noun)",
    "ADP": "Pang-ukol (Preposition)",
    "DET": "Pantukoy (Determiner)",
    "PART": "Panghikayat (Particle)"
  };
  
  // Split sentence into words
  const words = sentence.toLowerCase().replace(/[.,!?]/g, '').split(/\s+/);
  
  // Tag each word
  const tokens = words.map(word => {
    const cleanWord = word.toLowerCase().trim();
    const pos = TAGALOG_POS_MAP[cleanWord] || "UNKNOWN";
    return {
      text: word,
      pos: pos,
      description: POS_DESCRIPTIONS[pos] || "Unknown"
    };
  });
  
  return {
    sentence: sentence,
    tokens: tokens,
    method: "js-fallback"
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get the sentence from the request body
    const body = await request.json();
    const { sentence } = body;
    
    if (!sentence) {
      return NextResponse.json(
        { error: 'Sentence is required' },
        { status: 400 }
      );
    }
    
    // Create an abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
    
    console.log(`Proxying analyze request to Flask API at: ${API_ENDPOINTS.ANALYZE_ENDPOINT}`);
    
    try {
      // Forward the request to the Flask API
      const response = await fetch(API_ENDPOINTS.ANALYZE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ sentence }),
        signal: controller.signal,
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Check if request was successful
      if (!response.ok) {
        let errorMessage = `Failed to analyze sentence (Status: ${response.status})`;
        
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
        
        // If Flask API fails, use JS fallback instead of returning an error
        console.log("Flask API failed, using JavaScript fallback for POS tagging");
        const fallbackResult = simpleFallbackTagging(sentence);
        return NextResponse.json(fallbackResult);
      }
      
      // Get the data from the response
      const data = await response.json();
      console.log(`Successfully analyzed sentence with ${data.tokens?.length || 0} tokens`);
      
      return NextResponse.json(data);
    } catch (fetchError: any) {
      console.error('Error fetching from Flask API:', fetchError);
      clearTimeout(timeoutId);
      
      // If Flask API is unavailable, use JS fallback
      console.log("Flask API unavailable, using JavaScript fallback for POS tagging");
      const fallbackResult = simpleFallbackTagging(sentence);
      return NextResponse.json(fallbackResult);
    }
  } catch (error: any) {
    console.error('Error in analyze endpoint:', error);
    
    // If there's a general error, still try to use JS fallback
    try {
      if (request.body) {
        const body = await request.json();
        if (body.sentence) {
          console.log("Using JavaScript fallback for POS tagging due to general error");
          const fallbackResult = simpleFallbackTagging(body.sentence);
          return NextResponse.json(fallbackResult);
        }
      }
    } catch (e) {
      // If fallback fails too, return an error response
    }
    
    return NextResponse.json(
      { error: 'Error analyzing sentence: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}