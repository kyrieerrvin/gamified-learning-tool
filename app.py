#!/usr/bin/env python3
"""
Dedicated NLP API for Tagalog Learning POS Game.
This is a focused implementation that handles:
1. Parts of speech tagging with CalamanCy
2. Multiple choice question generation
3. Answer verification
"""

from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
import calamancy
import random
import logging
import sys
import os
import socket
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {
    "origins": "*",
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization", "Accept"]
}})

# Predefined POS options and their Filipino translations
POS_OPTIONS = {
    "PRON": "Panghalip (Pronoun)",
    "VERB": "Pandiwa (Verb)",
    "ADV": "Pang-Abay (Adverb)",
    "ADJ": "Pang-Uri (Adjective)",
    "NOUN": "Pangngalan (Noun)",
    "ADP": "Pang-ukol (Preposition)",
    "DET": "Pantukoy (Determiner)",
    "PART": "Panghikayat (Particle)",
}

# Sample sentences for different difficulty levels
SAMPLE_SENTENCES = {
    "easy": [
        "Ako ay masaya ngayon.",
        "Kumain siya ng mansanas.",
        "Maganda ang bulaklak sa hardin.",
        "Mabilis tumakbo ang bata.",
        "Malaki ang bahay nila."
    ],
    "medium": [
        "Ang batang lalaki ay nag-aaral ng mabuti para sa kanyang pagsusulit.",
        "Inilagay ko ang mga libro sa ibabaw ng mesa.",
        "Ang mga manggagawa ay nagprotesta dahil sa mababang sahod.",
        "Binili niya ang bagong kotse mula sa tindahan kahapon.",
        "Hindi namin alam kung saan nagpunta ang aming mga kaibigan."
    ],
    "hard": [
        "Ako si Thomas Edison, at ako ay nag-aaral ng agham sa paaralan.",
        "Ang mga estudyante na nagtapos nang may karangalan ay tumanggap ng mga parangal mula sa pangulo ng unibersidad.",
        "Kahit na malakas ang ulan, nagpatuloy pa rin sila sa kanilang paglalakbay patungo sa malayong probinsya.",
        "Maraming turista ang bumabalik taun-taon sa magandang isla dahil sa mababait na mga tao at masasarap na pagkain.",
        "Bagaman maliit lamang ang kaniyang negosyo, nakapagbigay pa rin siya ng trabaho sa maraming tao sa kanilang komunidad."
    ]
}

# Sample words for Make a Sentence game
MAKE_SENTENCE_WORDS = [
    {"word": "Bayanihan", "description": "Pagtulong ng maraming tao sa isa't isa upang matapos ang isang gawain"},
    {"word": "Pagmamahal", "description": "Malalim na pakiramdam ng malasakit at pagpapahalaga"},
    {"word": "Kalayaan", "description": "Katayuan ng pagiging malaya o hindi nakatali sa limitasyon"},
    {"word": "Matatag", "description": "Malakas at hindi madaling masira o matumba"},
    {"word": "Kalikasan", "description": "Ang natural na kapaligiran at lahat ng buhay na nilalang"},
    {"word": "Kasiyahan", "description": "Masayang pakiramdam o kalagayan"},
    {"word": "Pakikipagkapwa", "description": "Pakikitungo sa ibang tao bilang kapantay"},
    {"word": "Pagtitiwala", "description": "Pananalig sa kakayahan o katapatan ng ibang tao"},
    {"word": "Kahusayan", "description": "Kagalingan o kahigitan sa isang larangan"},
    {"word": "Katatagan", "description": "Lakas ng loob sa harap ng mga hamon"},
    {"word": "Mapagkumbaba", "description": "Walang kayabangan; mahinahon"},
    {"word": "Mapagbigay", "description": "Bukas-palad o handang tumulong"}
]

# Load the CalamanCy NLP model
try:
    logger.info("Loading CalamanCy NLP model (tl_calamancy_md-0.2.0)...")
    nlp = calamancy.load("tl_calamancy_md-0.2.0")
    logger.info("✅ CalamanCy model loaded successfully!")
    MODEL_STATUS = "loaded"
except Exception as e:
    logger.error(f"Error loading model with specified version: {str(e)}")
    try:
        # Try loading with a simpler name - sometimes package patterns change
        logger.info("Trying to load model with generic name (tl_calamancy_md)...")
        nlp = calamancy.load("tl_calamancy_md")
        logger.info("✅ CalamanCy model loaded successfully with generic name!")
        MODEL_STATUS = "loaded"
    except Exception as e:
        logger.error(f"Error loading model with generic name: {str(e)}")
        logger.error("❌ Failed to load CalamanCy model. Using fallback POS tagging logic.")
        nlp = None
        MODEL_STATUS = "unavailable"

def generate_pos_questions(sentence, num_questions=5):
    """Generate multiple choice questions about parts of speech in the given sentence."""
    if not sentence:
        logger.error("Empty sentence provided to generate_pos_questions")
        return []
        
    questions = []
    
    if nlp:  # If CalamanCy model is loaded, use it
        try:
            # Process the sentence with CalamanCy
            doc = nlp(sentence)
            logger.info(f"CalamanCy tokens for '{sentence}': {[(token.text, token.pos_) for token in doc]}")
            
            # Get tokens with relevant POS tags
            tokens = [token for token in doc if token.pos_ in POS_OPTIONS]
            
            # If we don't have enough tokens, return what we have
            if not tokens:
                logger.warning(f"No tokens with known POS tags found in: '{sentence}'")
                return []
                
            # Select random tokens for questions (ensure uniqueness)
            if len(tokens) < num_questions:
                selected_tokens = tokens
            else:
                selected_tokens = random.sample(tokens, min(num_questions, len(tokens)))
            
            for i, token in enumerate(selected_tokens, 1):
                correct_pos = token.pos_
                correct_answer = POS_OPTIONS[correct_pos]
                
                # Generate distractors: randomly select 3 other POS options
                available_distractors = [opt for opt in POS_OPTIONS.values() if opt != correct_answer]
                distractors = random.sample(available_distractors, min(3, len(available_distractors)))
                
                # Create options and shuffle
                options = [correct_answer] + distractors
                random.shuffle(options)
                
                questions.append({
                    "id": i,
                    "question": f"Anong parte ng pangungusap ang '{token.text}' sa '{sentence}'?",
                    "options": options,
                    "correctAnswer": correct_answer,
                    "explanation": f"Ang '{token.text}' ay isang {correct_answer.lower()}."
                })
                
            logger.info(f"Generated {len(questions)} questions using CalamanCy")
            return questions
            
        except Exception as e:
            logger.error(f"Error using CalamanCy for POS tagging: {str(e)}")
            # Fall back to dictionary-based approach
            
    # Dictionary-based fallback approach
    logger.info(f"Using fallback POS tagging for '{sentence}'")
    
    # Dictionary mapping common Tagalog words to their POS
    TAGALOG_POS_MAP = {
        # Pronouns (Panghalip)
        "ako": "PRON", "ikaw": "PRON", "ka": "PRON", "siya": "PRON", "kami": "PRON", 
        "tayo": "PRON", "kayo": "PRON", "sila": "PRON", "niya": "PRON", "nila": "PRON",
        "ko": "PRON", "mo": "PRON", "namin": "PRON", "natin": "PRON", "ninyo": "PRON",
        # Verbs (Pandiwa)
        "kumain": "VERB", "kumakain": "VERB", "kakain": "VERB", "kinain": "VERB",
        "uminom": "VERB", "umiinom": "VERB", "iinom": "VERB", "ininom": "VERB",
        "magluto": "VERB", "nagluluto": "VERB", "magluluto": "VERB", "niluto": "VERB",
        "bumili": "VERB", "bumibili": "VERB", "bibili": "VERB", "binili": "VERB",
        "tumakbo": "VERB", "tumatakbo": "VERB", "tatakbo": "VERB", "tumakbo": "VERB",
        "magbasa": "VERB", "nagbabasa": "VERB", "magbabasa": "VERB", "binasa": "VERB",
        # Nouns (Pangngalan)
        "bahay": "NOUN", "paaralan": "NOUN", "kotse": "NOUN", "mesa": "NOUN",
        "silya": "NOUN", "libro": "NOUN", "pagkain": "NOUN", "tubig": "NOUN",
        "lalaki": "NOUN", "babae": "NOUN", "bata": "NOUN", "magulang": "NOUN",
        "guro": "NOUN", "kaibigan": "NOUN", "lungsod": "NOUN", "bansa": "NOUN",
        "mansanas": "NOUN", "pera": "NOUN", "oras": "NOUN", "araw": "NOUN",
        # Adjectives (Pang-uri)
        "maganda": "ADJ", "mabait": "ADJ", "masaya": "ADJ", "malungkot": "ADJ",
        "mataas": "ADJ", "mababa": "ADJ", "malaki": "ADJ", "maliit": "ADJ",
        "masarap": "ADJ", "mainit": "ADJ", "malamig": "ADJ", "mabilis": "ADJ",
        "mabagal": "ADJ", "matalino": "ADJ", "matamis": "ADJ", "bagong": "ADJ",
        # Adverbs (Pang-abay)
        "mabilis": "ADV", "mabagal": "ADV", "kanina": "ADV", "bukas": "ADV",
        "kahapon": "ADV", "ngayon": "ADV", "palagi": "ADV", "minsan": "ADV",
        "tuwing": "ADV", "lagi": "ADV", "dito": "ADV", "doon": "ADV", 
        "agad": "ADV", "taun-taon": "ADV", "araw-araw": "ADV", "madalas": "ADV",
        # Determiners (Pantukoy)
        "ang": "DET", "mga": "DET", "ito": "DET", "iyon": "DET", "yung": "DET",
        # Prepositions (Pang-ukol)
        "sa": "ADP", "ng": "ADP", "para": "ADP", "mula": "ADP", "tungkol": "ADP",
        "hanggang": "ADP", "dahil": "ADP",
        # Particles (Panghikayat)
        "ay": "PART", "ba": "PART", "na": "PART", "pa": "PART", "raw": "PART", "daw": "PART",
        "lamang": "PART", "lang": "PART", "din": "PART", "rin": "PART", "pala": "PART"
    }
    
    # Split the sentence into words and clean them
    words = sentence.lower().replace('.', '').replace(',', '').replace('!', '').replace('?', '').split()
    
    # Find words with known POS tags
    tagged_words = []
    for word in words:
        clean_word = word.lower().strip()
        if clean_word in TAGALOG_POS_MAP:
            pos = TAGALOG_POS_MAP[clean_word]
            if pos in POS_OPTIONS:
                tagged_words.append({"text": word, "pos": pos})
    
    # If we don't have enough words with known POS tags, add some common ones
    if len(tagged_words) < num_questions:
        logger.warning(f"Not enough words with known POS tags in '{sentence}'. Using only {len(tagged_words)} words.")
    
    # Select random words for questions (ensure uniqueness)
    if len(tagged_words) < num_questions:
        selected_words = tagged_words
    else:
        selected_words = random.sample(tagged_words, min(num_questions, len(tagged_words)))
    
    for i, word_data in enumerate(selected_words, 1):
        correct_pos = word_data["pos"]
        correct_answer = POS_OPTIONS[correct_pos]
        
        # Generate distractors: randomly select 3 other POS options
        available_distractors = [opt for opt in POS_OPTIONS.values() if opt != correct_answer]
        distractors = random.sample(available_distractors, min(3, len(available_distractors)))
        
        # Create options and shuffle
        options = [correct_answer] + distractors
        random.shuffle(options)
        
        questions.append({
            "id": i,
            "question": f"Anong parte ng pangungusap ang '{word_data['text']}' sa '{sentence}'?",
            "options": options,
            "correctAnswer": correct_answer,
            "explanation": f"Ang '{word_data['text']}' ay isang {correct_answer.lower()}."
        })
    
    logger.info(f"Generated {len(questions)} questions using fallback dictionary")
    return questions

def verify_pos_answer(word, sentence, selected_answer):
    """Verify if the selected answer is correct for the word in the sentence."""
    if not nlp:
        logger.warning("CalamanCy model not available for answer verification")
        return None
        
    try:
        # Process the sentence with CalamanCy
        doc = nlp(sentence)
        
        # Find the target word in the processed tokens
        for token in doc:
            if token.text.lower() == word.lower():
                correct_pos = token.pos_
                correct_answer = POS_OPTIONS.get(correct_pos)
                
                if correct_answer:
                    is_correct = (selected_answer == correct_answer)
                    return {
                        "word": word,
                        "selected": selected_answer,
                        "correct": correct_answer,
                        "is_correct": is_correct,
                        "explanation": f"Ang '{word}' ay isang {correct_answer.lower()}."
                    }
        
        logger.warning(f"Word '{word}' not found in sentence during verification")
        return None
    except Exception as e:
        logger.error(f"Error verifying answer: {str(e)}")
        return None

def verify_sentence_usage(target_word, sentence):
    """Verify if a word is used correctly in a sentence.
    
    This function uses the NLP model to verify if a word is used correctly
    in a sentence created by a user.
    
    Args:
        target_word (str): The word that should be used in the sentence
        sentence (str): The sentence created by the user
        
    Returns:
        dict: Verification result containing correctness and feedback
    """
    if not nlp:
        logger.warning("CalamanCy model not available for sentence verification")
        return {
            "isCorrect": False,
            "feedback": "Hindi magamit ang NLP model. Paki-refresh ang page at subukan ulit."
        }
    
    try:
        # Clean inputs
        target_word = target_word.strip().lower()
        sentence = sentence.strip()
        
        # Basic validation
        if len(sentence) < 5:
            return {
                "isCorrect": False,
                "feedback": "Masyadong maikli ang pangungusap. Gumawa ng kompletong pangungusap."
            }
            
        # Check if the target word is in the sentence
        words_in_sentence = [token.text.lower() for token in nlp(sentence)]
        if target_word not in words_in_sentence:
            return {
                "isCorrect": False,
                "feedback": f"Hindi mo ginamit ang salitang '{target_word}' sa iyong pangungusap."
            }
        
        # Process the sentence with CalamanCy
        doc = nlp(sentence)
        
        # For a valid sentence, we need at least one verb and noun
        pos_counts = {}
        for token in doc:
            pos_counts[token.pos_] = pos_counts.get(token.pos_, 0) + 1
        
        # Check if sentence has basic structure
        has_verb = pos_counts.get('VERB', 0) > 0
        has_noun = pos_counts.get('NOUN', 0) > 0
        
        # Simple validation: if it has verb and noun, it's correct
        isCorrect = has_verb and has_noun
        
        # Generate feedback
        if isCorrect:
            feedback = "Mahusay! Tama ang paggamit mo ng salita sa pangungusap."
        else:
            if not has_verb:
                feedback = "Kulang ang pangungusap ng pandiwa (verb)."
            elif not has_noun:
                feedback = "Kulang ang pangungusap ng pangngalan (noun)."
            else:
                feedback = "Hindi sapat ang pagkakabuo ng pangungusap."
        
        return {
            "isCorrect": isCorrect,
            "feedback": feedback
        }
        
    except Exception as e:
        logger.error(f"Error verifying sentence: {str(e)}")
        return {
            "isCorrect": False,
            "error": str(e),
            "feedback": "May naganap na error sa pagsuri ng pangungusap."
        }

@app.route('/', methods=['GET'])
def home():
    """Simple home endpoint to check if server is running"""
    return jsonify({
        "status": "healthy",
        "message": "NLP Test Server Running",
        "model_status": MODEL_STATUS
    })

@app.route('/api/pos-game', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_pos_game():
    """API endpoint to get POS tagging game data"""
    if request.method == 'OPTIONS':
        return handle_preflight_request()
    
    try:
        # Get query parameters
        difficulty = request.args.get('difficulty', 'medium')
        custom_sentence = request.args.get('sentence')
        
        # Use custom sentence if provided, otherwise select from samples
        if custom_sentence:
            sentence = custom_sentence
            logger.info(f"Using custom sentence: '{sentence}'")
        else:
            sentences = SAMPLE_SENTENCES.get(difficulty, SAMPLE_SENTENCES['medium'])
            sentence = random.choice(sentences)
            logger.info(f"Selected random {difficulty} sentence: '{sentence}'")
        
        # Generate questions for the sentence
        questions = generate_pos_questions(sentence, num_questions=5)
        
        if not questions:
            logger.warning(f"No questions generated for sentence: '{sentence}'")
            return jsonify({
                "error": "Unable to generate questions from this sentence. Please try another sentence."
            }), 400
        
        # Ensure the correct answer isn't always in the same position
        for question in questions:
            random.shuffle(question["options"])
        
        # Create response data
        response_data = {
            "sentence": sentence,
            "questions": questions,
            "source": "calamancy" if nlp else "fallback",
            "difficulty": difficulty,
            "timestamp": int(time.time())
        }
        
        return create_cors_response(response_data)
    
    except Exception as e:
        logger.error(f"Error generating game data: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Error generating game data. Please try again."
        }), 500

@app.route('/api/analyze', methods=['POST', 'OPTIONS'])
@cross_origin()
def analyze_text():
    """API endpoint to analyze a Tagalog sentence for POS tagging"""
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return handle_preflight_request()
    
    try:
        # Get data from request
        data = request.json
        if not data or 'sentence' not in data:
            return jsonify({"error": "Please provide a sentence"}), 400
        
        sentence = data['sentence']
        logger.info(f"Analyzing sentence: '{sentence}'")
        
        if not nlp:
            return jsonify({
                "error": "CalamanCy model is not loaded. Using fallback POS tagging."
            }), 500
        
        # Process the sentence
        doc = nlp(sentence)
        tokens = []
        
        # Extract tokens with POS
        for token in doc:
            pos = token.pos_
            description = POS_OPTIONS.get(pos, pos)
            tokens.append({
                "text": token.text,
                "pos": pos,
                "description": description
            })
        
        return create_cors_response({
            "sentence": sentence,
            "tokens": tokens,
            "method": "calamancy"
        })
    
    except Exception as e:
        logger.error(f"Error analyzing text: {str(e)}", exc_info=True)
        return jsonify({
            "error": f"Error analyzing text: {str(e)}"
        }), 500

@app.route('/api/verify', methods=['POST', 'OPTIONS'])
@cross_origin()
def verify_answer():
    """API endpoint to verify if a selected answer is correct"""
    if request.method == 'OPTIONS':
        return handle_preflight_request()
    
    try:
        # Get data from request
        data = request.json
        if not data or 'word' not in data or 'sentence' not in data or 'selected' not in data:
            return jsonify({
                "error": "Please provide word, sentence, and selected answer"
            }), 400
        
        word = data['word']
        sentence = data['sentence']
        selected = data['selected']
        
        logger.info(f"Verifying answer for word '{word}' in sentence '{sentence}'")
        
        # Verify the answer
        result = verify_pos_answer(word, sentence, selected)
        
        if not result:
            return jsonify({
                "error": "Unable to verify answer. Please try again."
            }), 400
        
        return create_cors_response(result)
    
    except Exception as e:
        logger.error(f"Error verifying answer: {str(e)}", exc_info=True)
        return jsonify({
            "error": f"Error verifying answer: {str(e)}"
        }), 500

@app.route('/health', methods=['GET'])
@cross_origin()
def health_check():
    """Health check endpoint for the API"""
    try:
        model_status = "loaded" if nlp else "fallback"
        
        return create_cors_response({
            "status": "healthy",
            "model": "tl_calamancy_md-0.2.0",
            "model_status": model_status,
            "pos_tags_available": list(POS_OPTIONS.keys()),
            "python_version": sys.version,
            "calamancy_version": calamancy.__version__ if hasattr(calamancy, "__version__") else "unknown",
            "memory_info": {
                "nlp_model_loaded": nlp is not None
            }
        })
    except Exception as e:
        logger.error(f"Error in health check: {str(e)}")
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500

@app.route('/api/custom-game', methods=['POST', 'OPTIONS'])
@cross_origin()
def custom_game():
    """Create a game with a custom sentence"""
    if request.method == 'OPTIONS':
        return handle_preflight_request()
    
    try:
        # Get data from request
        data = request.json
        if not data or 'sentence' not in data:
            return jsonify({"error": "Please provide a sentence"}), 400
        
        sentence = data['sentence']
        logger.info(f"Creating custom game with sentence: '{sentence}'")
        
        # Generate questions for the custom sentence
        questions = generate_pos_questions(sentence, num_questions=5)
        
        if not questions:
            return jsonify({
                "error": "Unable to generate questions from this sentence. Please try another sentence."
            }), 400
        
        # Ensure the correct answer isn't always in the same position
        for question in questions:
            random.shuffle(question["options"])
        
        # Create response data
        response_data = {
            "sentence": sentence,
            "questions": questions,
            "source": "calamancy" if nlp else "fallback",
            "custom": True,
            "timestamp": int(time.time())
        }
        
        return create_cors_response(response_data)
    
    except Exception as e:
        logger.error(f"Error creating custom game: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Error creating custom game. Please try again."
        }), 500

@app.route('/api/make-sentence/words', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_sentence_words():
    """API endpoint to get words for Make a Sentence game"""
    if request.method == 'OPTIONS':
        return handle_preflight_request()
    
    try:
        # Get all words and shuffle them
        words = MAKE_SENTENCE_WORDS.copy()
        random.shuffle(words)
        
        # Return the words
        return create_cors_response({
            "words": words,
            "count": len(words)
        })
        
    except Exception as e:
        logger.error(f"Error getting words for Make a Sentence game: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Error getting words. Please try again."
        }), 500

@app.route('/api/make-sentence/verify', methods=['POST', 'OPTIONS'])
@cross_origin()
def verify_make_sentence():
    """API endpoint to verify a sentence created by a user"""
    if request.method == 'OPTIONS':
        return handle_preflight_request()
    
    try:
        # Get data from request
        data = request.json
        if not data or 'word' not in data or 'sentence' not in data:
            return jsonify({
                "error": "Please provide both word and sentence"
            }), 400
        
        word = data['word']
        sentence = data['sentence']
        
        logger.info(f"Verifying sentence for word '{word}': '{sentence}'")
        
        # Verify the sentence
        result = verify_sentence_usage(word, sentence)
        
        # Add request info to result
        result["word"] = word
        result["sentence"] = sentence
        
        return create_cors_response(result)
        
    except Exception as e:
        logger.error(f"Error verifying sentence: {str(e)}", exc_info=True)
        return jsonify({
            "error": f"Error verifying sentence: {str(e)}"
        }), 500

# --- Helper functions ---

def handle_preflight_request():
    """Handle CORS preflight requests"""
    response = jsonify({"status": "ok"})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
    response.headers.add('Access-Control-Max-Age', '3600')
    return response

def create_cors_response(data):
    """Create a JSON response with CORS headers"""
    response = jsonify(data)
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
    return response

if __name__ == '__main__':
    # Use exactly port 5000 - frontend expects this port
    port = 5000
    
    # Check if port 5000 is in use
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    port_available = False
    try:
        sock.bind(('0.0.0.0', port))
        port_available = True
    except OSError:
        logger.error(f"Port {port} is already in use! Please free up this port first.")
        logger.error("You may need to kill the process using: lsof -i :5000 | grep LISTEN")
        sys.exit(1)
    finally:
        sock.close()
        
    # Log startup information
    logger.info(f"Using Python {sys.version}")
    if hasattr(calamancy, "__version__"):
        logger.info(f"CalamanCy version: {calamancy.__version__}")
    logger.info(f"Model status: {MODEL_STATUS}")
    logger.info(f"Starting NLP API server on port {port}")
    print(f"NLP API server running at: http://localhost:{port}")
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)