#!/usr/bin/env python3
"""
Dedicated NLP API for Tagalog Learning POS Game.
This is a focused implementation that handles:
1. Parts of speech tagging with ToCylog model
2. Multiple choice question generation
3. Answer verification
"""

from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
import random
import logging
import sys
import os
import socket
import time
import spacy
import json
import re
from typing import Optional
from conversation.chatbot import get_bot_response as conv_get_bot_response, get_summary as conv_get_summary, get_bot_response_parts as conv_get_bot_response_parts, reset_conversation as conv_reset

# Optional memory measurement tools
try:
    import psutil  # type: ignore
    _HAVE_PSUTIL = True
except Exception:
    _HAVE_PSUTIL = False

try:
    import resource  # type: ignore
    _HAVE_RESOURCE = True
except Exception:
    _HAVE_RESOURCE = False

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
    # Core POS tags
    "PRON": "Panghalip (Pronoun)",
    "VERB": "Pandiwa (Verb)",
    "ADV": "Pang-Abay (Adverb)",
    "ADJ": "Pang-Uri (Adjective)",
    "NOUN": "Pangngalan (Noun)",
    "ADP": "Pang-ukol (Preposition)",
    "DET": "Pantukoy (Determiner)",
    "PART": "Panghikayat (Particle)",
    # Extended POS tags from ToCylog model
    "PROPN": "Pangngalang Pantangi (Proper Noun)",
    "NUM": "Numero (Number)",
    "CCONJ": "Pangatnig na Nagtutugma (Coordinating Conjunction)",
    "SCONJ": "Pangatnig na Nagpapailalim (Subordinating Conjunction)",
    "INTJ": "Pandamdam (Interjection)",
    "PUNCT": "Bantas (Punctuation)",
    "SYM": "Simbolo (Symbol)",
}

# Prefer model tag over coarse POS when available
def resolve_pos(token):
    """Return a stable POS key for a spaCy token based on model outputs.
    Uses fine-grained tag (token.tag_) if it exists in POS_OPTIONS; otherwise
    falls back to coarse tag (token.pos_)."""
    try:
        if hasattr(token, 'tag_') and token.tag_ in POS_OPTIONS:
            return token.tag_
        if token.pos_ in POS_OPTIONS:
            return token.pos_
        # Some models store POS in token.tag_ only
        if hasattr(token, 'tag_') and token.tag_:
            return token.tag_
    except Exception:
        pass
    return token.pos_ or "X"

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
# MAKE_SENTENCE_WORDS = [
#     {"word": "Bayanihan", "description": "Pagtulong ng maraming tao sa isa't isa upang matapos ang isang gawain"},
#     {"word": "Pagmamahal", "description": "Malalim na pakiramdam ng malasakit at pagpapahalaga"},
#     {"word": "Kalayaan", "description": "Katayuan ng pagiging malaya o hindi nakatali sa limitasyon"},
#     {"word": "Matatag", "description": "Malakas at hindi madaling masira o matumba"},
#     {"word": "Kalikasan", "description": "Ang natural na kapaligiran at lahat ng buhay na nilalang"},
#     {"word": "Kasiyahan", "description": "Masayang pakiramdam o kalagayan"},
#     {"word": "Pakikipagkapwa", "description": "Pakikitungo sa ibang tao bilang kapantay"},
#     {"word": "Pagtitiwala", "description": "Pananalig sa kakayahan o katapatan ng ibang tao"},
#     {"word": "Kahusayan", "description": "Kagalingan o kahigitan sa isang larangan"},
#     {"word": "Katatagan", "description": "Lakas ng loob sa harap ng mga hamon"},
#     {"word": "Mapagkumbaba", "description": "Walang kayabangan; mahinahon"},
#     {"word": "Mapagbigay", "description": "Bukas-palad o handang tumulong"}
# ]

# Hardcoded grade-based word pools (from grade text files)
# GRADE_WORDS = {
#     'G1_2': [
#         { "id": "bata",       "word": "Bata",       "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "aklat",      "word": "Aklat",      "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "saging",     "word": "Saging",     "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "kabayo",     "word": "Kabayo",     "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "bote",       "word": "Bote",       "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "lolo",       "word": "Lolo",       "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "puno",       "word": "Puno",       "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "pera",       "word": "Pera",       "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "ako",        "word": "Ako",        "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "ikaw",       "word": "Ikaw",       "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "siya",       "word": "Siya",       "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "baka",       "word": "Baka",       "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "aso",        "word": "Aso",        "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "pusa",       "word": "Pusa",       "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "umaga",      "word": "Umaga",      "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "tubig",      "word": "Tubig",      "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "malungkot",  "word": "Malungkot",  "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "tatay",      "word": "Tatay",      "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "nanay",      "word": "Nanay",      "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "lapis",      "word": "Lapis",      "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "papel",      "word": "Papel",      "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "upuan",      "word": "Upuan",      "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "damit",      "word": "Damit",      "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "bola",       "word": "Bola",       "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "mansanas",   "word": "Mansanas",   "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "pantasa",    "word": "Pantasa",    "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "bulaklak",   "word": "Bulaklak",   "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "kutsara",    "word": "Kutsara",    "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "unan",       "word": "Unan",       "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "tinidor",    "word": "Tinidor",    "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "mundo",      "word": "Mundo",      "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "klima",      "word": "Klima",      "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "basura",     "word": "Basura",     "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "pamaypay",   "word": "Pamaypay",   "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "salamin",    "word": "Salamin",    "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "payong",     "word": "Payong",     "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "balat",      "word": "Balat",      "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "nagbabasa",  "word": "Nagbabasa",  "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "nagsusulat", "word": "Nagsusulat", "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "naglalaro",  "word": "Naglalaro",  "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "nagsusuklay","word": "Nagsusuklay","description": "", "imageUrl": "", "sentences": [] },
#         { "id": "nagsasayaw", "word": "Nagsasayaw", "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "naghihilamos","word": "Naghihilamos","description": "", "imageUrl": "", "sentences": [] },
#         { "id": "nagsisipilyo","word": "Nagsisipilyo","description": "", "imageUrl": "", "sentences": [] },
#         { "id": "naglilinis", "word": "Naglilinis", "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "umiiyak",    "word": "Umiiyak",    "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "tumatawa",   "word": "Tumatawa",   "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "lumalakad",  "word": "Lumalakad",  "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "kaibigan",   "word": "Kaibigan",   "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "paaralan",   "word": "Paaralan",   "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "mangga",     "word": "Mangga",     "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "sapatos",    "word": "Sapatos",    "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "palayan",    "word": "Palayan",    "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "dagat",      "word": "Dagat",      "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "ilog",       "word": "Ilog",       "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "halamanan",  "word": "Halamanan",  "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "palaruan",   "word": "Palaruan",   "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "eskuyla",    "word": "Eskuwela",   "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "ulam",       "word": "Ulam",       "description": "", "imageUrl": "", "sentences": [] },
#     ],
#     'G3_4': [
#         { "id": "timpalak",   "word": "Timpalak",   "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "saklolo",    "word": "Saklolo",    "description": "", "imageUrl": "", "sentences": [] },
#         {"word": "Kudong", "description": ""},
#         {"word": "Sumukob", "description": ""},
#         {"word": "Paglalako", "description": ""},
#         {"word": "Matalik", "description": ""},
#         {"word": "Mamamayan", "description": ""},
#         {"word": "Lungsod", "description": ""},
#         {"word": "Angkan", "description": ""},
#         {"word": "Simbolo", "description": ""},
#         {"word": "Aktibo", "description": ""},
#         {"word": "Lalawigan", "description": ""},
#         {"word": "Salat", "description": ""},
#         {"word": "Nagtatalo", "description": ""},
#         {"word": "Alkalde", "description": ""},
#         {"word": "Mapagmataas", "description": ""},
#         {"word": "Lawa", "description": ""},
#         {"word": "Katamtaman", "description": ""},
#         {"word": "Bukod-tangi", "description": ""},
#         {"word": "Mithiin", "description": ""},
#         {"word": "Lihim", "description": ""},
#         {"word": "Punyagi", "description": ""},
#         {"word": "Taboy", "description": ""},
#         {"word": "Gusali", "description": ""},
#         {"word": "Sambit", "description": ""},
#         {"word": "Silid-Aralan", "description": ""},
#         {"word": "Taob", "description": ""},
#         {"word": "Kumpas", "description": ""},
#         {"word": "Modelo", "description": ""},
#         {"word": "Hudyat", "description": ""},
#         {"word": "Anunsyo", "description": ""},
#         {"word": "Entablado", "description": ""},
#         {"word": "Estudyante", "description": ""},
#         {"word": "Pinuno", "description": ""},
#         {"word": "Disenyo", "description": ""},
#         {"word": "Mungkahi", "description": ""},
#         {"word": "Kultura", "description": ""},
#         {"word": "Siyudad", "description": ""},
#         {"word": "Paksa", "description": ""},
#         {"word": "Sining", "description": ""},
#         {"word": "Estilo", "description": ""},
#         {"word": "Lansangan", "description": ""},
#         {"word": "Kagubatan", "description": ""},
#         {"word": "Ektarya", "description": ""},
#         {"word": "Pamayanan", "description": ""},
#         {"word": "Pahayagan", "description": ""},
#         {"word": "Kalamidad", "description": ""},
#         {"word": "Troso", "description": ""},
#         {"word": "Alintana", "description": ""},
#         {"word": "Prusisyon", "description": ""},
#         {"word": "Marupok", "description": ""},
#         {"word": "Kusang-loob", "description": ""},
#         {"word": "Malasakit", "description": ""},
#         {"word": "Istasyon", "description": ""},
#         {"word": "Tanaw", "description": ""},
#         {"word": "Pulo", "description": ""},
#         {"word": "Kanluran", "description": ""},
#         {"word": "Timog", "description": ""},
#         {"word": "Silangan", "description": ""},
#     ],
#     'G5_6': [
#         { "id": "diwang",     "word": "Diwang",     "description": "", "imageUrl": "", "sentences": [] },
#         { "id": "deboto",     "word": "Deboto",     "description": "", "imageUrl": "", "sentences": [] },
#         {"word": "Patalastas", "description": ""},
#         {"word": "Kastigo", "description": ""},
#         {"word": "Paligsahan", "description": ""},
#         {"word": "Imbestiga", "description": ""},
#         {"word": "Anomalya", "description": ""},
#         {"word": "Nayon", "description": ""},
#         {"word": "Dalampasigan", "description": ""},
#         {"word": "Kuwardeno", "description": ""},
#         {"word": "Kalawakan", "description": ""},
#         {"word": "Bestida", "description": ""},
#         {"word": "Lungga", "description": ""},
#         {"word": "Liksik", "description": ""},
#         {"word": "Takipsilim", "description": ""},
#         {"word": "Madaling-araw", "description": ""},
#         {"word": "Guniguni", "description": ""},
#         {"word": "Malumanay", "description": ""},
#         {"word": "Wagas", "description": ""},
#         {"word": "Balabal", "description": ""},
#         {"word": "Taas-noo", "description": ""},
#         {"word": "Alsa", "description": ""},
#         {"word": "Pinsala", "description": ""},
#         {"word": "Pabrika", "description": ""},
#         {"word": "Daigdig", "description": ""},
#         {"word": "Probisyon", "description": ""},
#         {"word": "Dinamita", "description": ""},
#         {"word": "Pamahalaan", "description": ""},
#         {"word": "Suliranin", "description": ""},
#         {"word": "Tungkulin", "description": ""},
#         {"word": "Sarat", "description": ""},
#         {"word": "Bihira", "description": ""},
#         {"word": "Kayumanggi", "description": ""},
#         {"word": "Resistensiya", "description": ""},
#         {"word": "Temperatura", "description": ""},
#         {"word": "Himlay", "description": ""},
#         {"word": "Bayanihan", "description": ""},
#         {"word": "Biyaya", "description": ""},
#         {"word": "Sangkap", "description": ""},
#         {"word": "Tutol", "description": ""},
#         {"word": "Parokya", "description": ""},
#         {"word": "Dambana", "description": ""},
#         {"word": "Paroroonan", "description": ""},
#         {"word": "Liblib", "description": ""},
#         {"word": "Payak", "description": ""},
#         {"word": "Bantog", "description": ""},
#         {"word": "Salamuha", "description": ""},
#         {"word": "Daungan", "description": ""},
#         {"word": "Bansag", "description": ""},
#         {"word": "Epidemenya", "description": ""},
#         {"word": "Bahagdan", "description": ""},
#     ],
# }

# Optional external JSON sources for grade-based word pools
# You can override these paths with environment variables G1_2_JSON_PATH, G3_4_JSON_PATH, G5_6_JSON_PATH
# Default to repo-relative paths; allow override via env vars
DEFAULT_G1_2_JSON = os.path.join(os.path.dirname(__file__), 'words', 'grade_level_1-2_words.json')
DEFAULT_G3_4_JSON = os.path.join(os.path.dirname(__file__), 'words', 'grade_level_3-4_words.json')
DEFAULT_G5_6_JSON = os.path.join(os.path.dirname(__file__), 'words', 'grade_level_5-6_words.json')
G1_2_JSON_PATH = os.environ.get('G1_2_JSON_PATH', DEFAULT_G1_2_JSON)
G3_4_JSON_PATH = os.environ.get('G3_4_JSON_PATH', DEFAULT_G3_4_JSON)
G5_6_JSON_PATH = os.environ.get('G5_6_JSON_PATH', DEFAULT_G5_6_JSON)

def load_g1_2_words_from_json():
    """Load Grade 1-2 words from external JSON file if available.

    Expected JSON format (array of objects):
    {
      "word": "Bata",
      "easy": "...",
      "difficult": "..."
    }

    Returns list of normalized-like raw entries to be normalized later.
    """
    try:
        if not os.path.isfile(G1_2_JSON_PATH):
            raise FileNotFoundError(f"G1_2 JSON not found at {G1_2_JSON_PATH}")

        with open(G1_2_JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)

        words = []
        for item in data:
            try:
                word_text = (item.get('word') or '').strip()
                easy_sentence = (item.get('easy') or '').strip()
                difficult_sentence = (item.get('difficult') or '').strip()
                sentences = [s for s in [easy_sentence, difficult_sentence] if s]
                if not word_text:
                    continue
                words.append({
                    "id": word_text.lower().replace(' ', '-'),
                    "word": word_text,
                    "description": "",
                    "imageUrl": "",
                    "sentences": sentences,
                    "easy": easy_sentence,
                    "difficult": difficult_sentence,
                    "grade": 'G1_2'
                })
            except Exception:
                continue

        logger.info(f"Loaded {len(words)} G1_2 words from JSON file")
        return words
    except Exception as e:
        logger.warning(f"Failed to load G1_2 words from JSON: {str(e)}")
        return None

def load_g3_4_words_from_json():
    """Load Grade 3-4 words from external JSON file if available."""
    try:
        if not os.path.isfile(G3_4_JSON_PATH):
            raise FileNotFoundError(f"G3_4 JSON not found at {G3_4_JSON_PATH}")

        with open(G3_4_JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)

        words = []
        for item in data:
            try:
                word_text = (item.get('word') or '').strip()
                easy_sentence = (item.get('easy') or '').strip()
                difficult_sentence = (item.get('difficult') or '').strip()
                sentences = [s for s in [easy_sentence, difficult_sentence] if s]
                if not word_text:
                    continue
                words.append({
                    "id": word_text.lower().replace(' ', '-'),
                    "word": word_text,
                    "description": item.get('description') or "",
                    "imageUrl": item.get('imageUrl') or "",
                    "sentences": sentences,
                    "easy": easy_sentence,
                    "difficult": difficult_sentence,
                    "grade": 'G3_4'
                })
            except Exception:
                continue

        logger.info(f"Loaded {len(words)} G3_4 words from JSON file")
        return words
    except Exception as e:
        logger.warning(f"Failed to load G3_4 words from JSON: {str(e)}")
        return None

def load_g5_6_words_from_json():
    """Load Grade 5-6 words from external JSON file if available."""
    try:
        if not os.path.isfile(G5_6_JSON_PATH):
            raise FileNotFoundError(f"G5_6 JSON not found at {G5_6_JSON_PATH}")

        with open(G5_6_JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)

        words = []
        for item in data:
            try:
                word_text = (item.get('word') or '').strip()
                easy_sentence = (item.get('easy') or '').strip()
                difficult_sentence = (item.get('difficult') or '').strip()
                sentences = [s for s in [easy_sentence, difficult_sentence] if s]
                if not word_text:
                    continue
                words.append({
                    "id": word_text.lower().replace(' ', '-'),
                    "word": word_text,
                    "description": item.get('description') or "",
                    "imageUrl": item.get('imageUrl') or "",
                    "sentences": sentences,
                    "easy": easy_sentence,
                    "difficult": difficult_sentence,
                    "grade": 'G5_6'
                })
            except Exception:
                continue

        logger.info(f"Loaded {len(words)} G5_6 words from JSON file")
        return words
    except Exception as e:
        logger.warning(f"Failed to load G5_6 words from JSON: {str(e)}")
        return None

# Normalize word entries to a consistent schema used by the frontend
# Ensures every item has (in order): id, word, description, imageUrl, sentences
def normalize_word_item(raw, grade_key):
    try:
        item = dict(raw) if isinstance(raw, dict) else {"word": str(raw)}
    except Exception:
        item = {"word": str(raw)}

    word_text = (item.get("word") or "").strip()
    slug = (item.get("id") or word_text.lower().replace(" ", "-")).strip()
    description = item.get("description") or ""
    # We default to empty string because images will be provided as GIFs later
    image_url = item.get("imageUrl") or ""
    sentences = item.get("sentences") or []

    return {
        "id": slug or word_text.lower(),
        "word": word_text,
        "description": description,
        "imageUrl": image_url,
        "sentences": sentences,
    }

# Load the ToCylog NLP model
try:
    logger.info("Loading toCylog model...")
    # Try to load local model if folder exists; otherwise skip
    if os.path.isdir("./tl_tocylog_trf"):
        nlp = spacy.load("./tl_tocylog_trf")
        logger.info("✅ ToCylog model loaded successfully!")
        MODEL_STATUS = "loaded"
    else:
        raise FileNotFoundError("tl_tocylog_trf model folder not found")
except Exception as e:
    logger.error(f"Error loading model with specified version: {str(e)}")
    logger.error("❌ Failed to load ToCylog model. Using fallback POS tagging logic.")
    nlp = None
    MODEL_STATUS = "unavailable"

def generate_pos_questions(sentence, num_questions=5):
    """Generate multiple choice questions about parts of speech in the given sentence."""
    if not sentence:
        logger.error("Empty sentence provided to generate_pos_questions")
        return []
        
    questions = []
    
    if nlp:  # If ToCylog model is loaded, use it
        try:
            # Process the sentence with ToCylog
            doc = nlp(sentence)
            logger.info(f"ToCylog tokens for '{sentence}': {[(token.text, resolve_pos(token)) for token in doc]}")
            
            # Get tokens with relevant POS tags
            tokens = [token for token in doc if resolve_pos(token) in POS_OPTIONS]
            
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
                correct_pos = resolve_pos(token)
                correct_answer = POS_OPTIONS[correct_pos]
                
                # Enhanced explanation using morphological features if available
                explanation = f"Ang '{token.text}' ay isang {correct_answer.lower()}."
                
                # Add morphological information if available
                if hasattr(token, 'morph') and len(token.morph) > 0:
                    morph_features = []
                    for feature, value in token.morph.to_dict().items():
                        if feature == 'Case':
                            if value == 'Nom':
                                morph_features.append("nasa pangunahing anyo")
                            elif value == 'Gen':
                                morph_features.append("nagpapakita ng pagmamay-ari")
                            elif value == 'Loc':
                                morph_features.append("nagpapakita ng lokasyon")
                            elif value == 'Dat':
                                morph_features.append("nagpapakita ng tagatanggap ng kilos")
                        elif feature == 'Aspect':
                            if value == 'Imp':
                                morph_features.append("di-ganap na aspekto")
                            elif value == 'Perf':
                                morph_features.append("ganap na aspekto")
                        elif feature == 'Voice':
                            if value == 'Act':
                                morph_features.append("aktibong tinig")
                            elif value == 'Pass':
                                morph_features.append("pasibong tinig")
                    
                    if morph_features:
                        explanation += f" Ito ay {', '.join(morph_features)}."
                
                # Add syntactic role information if available
                if token.dep_ and token.dep_ != '':
                    if token.dep_ == 'ROOT':
                        explanation += " Ito ang pangunahing salita sa pangungusap."
                    elif token.dep_ == 'nsubj':
                        explanation += " Ito ang paksa ng pangungusap."
                    elif token.dep_ == 'obj':
                        explanation += " Ito ang layon ng pangungusap."
                    elif token.dep_ == 'iobj':
                        explanation += " Ito ang di-tuwirang layon."
                    elif token.dep_ == 'obl':
                        explanation += " Ito ay nagbibigay ng karagdagang impormasyon."
                
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
                    "explanation": explanation
                })
                
            logger.info(f"Generated {len(questions)} questions using ToCylog")
            return questions
            
        except Exception as e:
            logger.error(f"Error using ToCylog for POS tagging: {str(e)}")
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
        "lamang": "PART", "lang": "PART", "din": "PART", "rin": "PART", "pala": "PART",
        # Conjunctions (Pangatnig)
        "at": "CCONJ", "o": "CCONJ", "ngunit": "CCONJ", "pero": "CCONJ", "subalit": "CCONJ",
        "dahil": "SCONJ", "sapagkat": "SCONJ", "upang": "SCONJ", "kung": "SCONJ", "kapag": "SCONJ",
        # Numbers (Numero)
        "isa": "NUM", "dalawa": "NUM", "tatlo": "NUM", "sampu": "NUM", "isang": "NUM", "unang": "NUM"
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
        logger.warning("ToCylog model not available for sentence verification")
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
            
        # Process the sentence with ToCylog
        doc = nlp(sentence)
        
        # Check if the target word is in the sentence
        target_tokens = []
        for token in doc:
            # Perform stemming or lemmatization to find variations of the word
            if (token.text.lower() == target_word or 
                (hasattr(token, 'lemma_') and token.lemma_.lower() == target_word)):
                target_tokens.append(token)
        
        if not target_tokens:
            return {
                "isCorrect": False,
                "feedback": f"Hindi mo ginamit ang salitang '{target_word}' sa iyong pangungusap."
            }
        
        # For a valid sentence, we need at least one verb and noun
        pos_counts = {}
        for token in doc:
            key = resolve_pos(token)
            pos_counts[key] = pos_counts.get(key, 0) + 1
        
        # Enhanced checking for sentence structural completeness
        has_verb = pos_counts.get('VERB', 0) > 0
        has_noun = pos_counts.get('NOUN', 0) > 0 or pos_counts.get('PROPN', 0) > 0
        has_subject = any(token.dep_ == 'nsubj' for token in doc)
        has_predicate = has_verb or any(token.dep_ == 'ROOT' for token in doc)
        
        # Check if target word plays a significant role in the sentence
        target_token = target_tokens[0]  # Use the first occurrence if multiple
        target_has_dep = target_token.dep_ != ''
        target_has_children = len(list(target_token.children)) > 0
        
        # Evaluate the correctness of the sentence
        structural_completeness = has_verb and has_noun
        target_significance = target_has_dep or target_has_children
        
        isCorrect = structural_completeness and target_significance
        
        # Generate more detailed feedback
        if isCorrect:
            # Create more specific positive feedback
            if target_token.dep_ == 'ROOT':
                feedback = f"Mahusay! Ang salitang '{target_word}' ay ginagamit bilang pangunahing pandiwa ng pangungusap."
            elif target_token.dep_ == 'nsubj':
                feedback = f"Mahusay! Ang salitang '{target_word}' ay ginagamit bilang paksa ng pangungusap."
            elif target_token.dep_ == 'obj':
                feedback = f"Mahusay! Ang salitang '{target_word}' ay ginagamit bilang layon ng pangungusap."
            else:
                feedback = f"Mahusay! Tama ang paggamit mo ng salitang '{target_word}' sa pangungusap."
        else:
            # Create more specific negative feedback
            if not has_verb:
                feedback = "Kulang ang pangungusap ng pandiwa (verb)."
            elif not has_noun:
                feedback = "Kulang ang pangungusap ng pangngalan (noun)."
            elif not target_significance:
                feedback = f"Ang salitang '{target_word}' ay hindi maayos na naiugnay sa pangungusap."
            else:
                feedback = "Hindi sapat ang pagkakabuo ng pangungusap."
        
        return {
            "isCorrect": isCorrect,
            "feedback": feedback,
            "analysis": {
                "hasVerb": has_verb,
                "hasNoun": has_noun,
                "hasSubject": has_subject,
                "hasPredicate": has_predicate,
                "targetWordRole": target_token.dep_ if target_has_dep else "unknown"
            }
        }
        
    except Exception as e:
        logger.error(f"Error verifying sentence: {str(e)}")
        return {
            "isCorrect": False,
            "error": str(e),
            "feedback": "May naganap na error sa pagsuri ng pangungusap."
        }

def verify_pos_answer(word, sentence, selected_answer):
    """Verify if the selected answer is correct for the word in the sentence."""
    if not nlp:
        logger.warning("ToCylog model not available for answer verification")
        return None
        
    try:
        # Process the sentence with ToCylog
        doc = nlp(sentence)
        
        # Find the target word in the processed tokens
        matching_tokens = []
        for token in doc:
            if token.text.lower() == word.lower():
                matching_tokens.append(token)
        
        if not matching_tokens:
            logger.warning(f"Word '{word}' not found in sentence during verification")
            return None
        
        # Use the first matching token
        token = matching_tokens[0]
        correct_pos = resolve_pos(token)
        correct_answer = POS_OPTIONS.get(correct_pos)
                
        if correct_answer:
            is_correct = (selected_answer == correct_answer)
            
            # Create enhanced explanation with morphological features
            explanation = f"Ang '{word}' ay isang {correct_answer.lower()}."
            
            # Add morphological information if available
            if hasattr(token, 'morph') and len(token.morph) > 0:
                morph_features = []
                for feature, value in token.morph.to_dict().items():
                    if feature == 'Case':
                        if value == 'Nom':
                            morph_features.append("nasa pangunahing anyo")
                        elif value == 'Gen':
                            morph_features.append("nagpapakita ng pagmamay-ari")
                        elif value == 'Loc':
                            morph_features.append("nagpapakita ng lokasyon")
                        elif value == 'Dat':
                            morph_features.append("nagpapakita ng tagatanggap ng kilos")
                    elif feature == 'Aspect':
                        if value == 'Imp':
                            morph_features.append("di-ganap na aspekto")
                        elif value == 'Perf':
                            morph_features.append("ganap na aspekto")
                    elif feature == 'Voice':
                        if value == 'Act':
                            morph_features.append("aktibong tinig")
                        elif value == 'Pass':
                            morph_features.append("pasibong tinig")
                
                if morph_features:
                    explanation += f" Ito ay {', '.join(morph_features)}."
            
            # Add syntactic role information if available
            if token.dep_ and token.dep_ != '':
                if token.dep_ == 'ROOT':
                    explanation += " Ito ang pangunahing salita sa pangungusap."
                elif token.dep_ == 'nsubj':
                    explanation += " Ito ang paksa ng pangungusap."
                elif token.dep_ == 'obj':
                    explanation += " Ito ang layon ng pangungusap."
                elif token.dep_ == 'iobj':
                    explanation += " Ito ang di-tuwirang layon."
                elif token.dep_ == 'obl':
                    explanation += " Ito ay nagbibigay ng karagdagang impormasyon."
            
            return {
                "word": word,
                "selected": selected_answer,
                "correct": correct_answer,
                "is_correct": is_correct,
                "explanation": explanation,
                "pos": correct_pos
            }
        
        logger.warning(f"POS '{correct_pos}' for word '{word}' not found in POS_OPTIONS")
        return None
    except Exception as e:
        logger.error(f"Error verifying answer: {str(e)}")
        return None

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
        grade = request.args.get('grade')
        difficulty = request.args.get('difficulty', 'medium')  # kept for backward compat
        custom_sentence = request.args.get('sentence')
        
        # Use custom sentence if provided, otherwise select from samples
        if custom_sentence:
            sentence = custom_sentence
            logger.info(f"Using custom sentence: '{sentence}'")
        else:
            # Placeholder: map grade to sentence pools (replace later)
            if grade in ['G1_2', 'G3_4', 'G5_6']:
                # Simple mapping: use easy/medium/hard as proxy for now
                diff_map = {
                    'G1_2': 'easy',
                    'G3_4': 'medium',
                    'G5_6': 'hard'
                }
                mapped = diff_map.get(grade, 'medium')
                sentences = SAMPLE_SENTENCES.get(mapped, SAMPLE_SENTENCES['medium'])
            else:
                sentences = SAMPLE_SENTENCES.get(difficulty, SAMPLE_SENTENCES['medium'])
            sentence = random.choice(sentences)
            logger.info(f"Selected random sentence (grade={grade or 'n/a'}, diff={difficulty}): '{sentence}'")
        
        # Generate questions for the sentence
        questions = generate_pos_questions(sentence, num_questions=10)
        
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
            "source": "ToCylog" if nlp else "fallback",
            "difficulty": difficulty,
            "grade": grade,
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
                "error": "ToCylog model is not loaded. Using fallback POS tagging."
            }), 500
        
        # --- Measure performance and memory ---
        def _get_rss_mb() -> Optional[float]:
            try:
                if _HAVE_PSUTIL:
                    proc = psutil.Process(os.getpid())
                    return float(proc.memory_info().rss) / (1024.0 * 1024.0)
                if _HAVE_RESOURCE:
                    usage = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
                    # ru_maxrss is bytes on macOS, kilobytes on Linux
                    if sys.platform == 'darwin':
                        rss_bytes = float(usage)
                    else:
                        rss_bytes = float(usage) * 1024.0
                    return rss_bytes / (1024.0 * 1024.0)
            except Exception:
                return None
            return None

        rss_before_mb = _get_rss_mb()
        start_ts = time.perf_counter()

        # Process the sentence
        doc = nlp(sentence)
        tokens = []
        
        # Extract tokens with POS and enhanced information
        for token in doc:
            pos = resolve_pos(token)
            description = POS_OPTIONS.get(pos, pos)
            
            token_info = {
                "text": token.text,
                "pos": pos,
                "description": description
            }
            
            # Add morphological features if available
            if hasattr(token, 'morph') and len(token.morph) > 0:
                token_info["morph"] = token.morph.to_dict()
            
            # Add dependency parsing information if available
            if token.dep_ and token.dep_ != '':
                token_info["dep"] = token.dep_
                if token.head.text != token.text:  # If not the root
                    token_info["head"] = token.head.text
            
            # Add lemma if available
            if hasattr(token, 'lemma_') and token.lemma_ != '':
                token_info["lemma"] = token.lemma_
                
            tokens.append(token_info)
        
        # Add sentence-level analysis
        # Build POS counts using resolved POS
        pos_counts = {}
        for token in doc:
            key = resolve_pos(token)
            pos_counts[key] = pos_counts.get(key, 0) + 1

        sentence_analysis = {
            "has_subject": any(token.dep_ == 'nsubj' for token in doc),
            "has_predicate": any(token.dep_ == 'ROOT' for token in doc),
            "pos_counts": pos_counts
        }
        
        end_ts = time.perf_counter()
        rss_after_mb = _get_rss_mb()
        processing_ms = int((end_ts - start_ts) * 1000)
        memory_metrics = None
        try:
            if rss_before_mb is not None and rss_after_mb is not None:
                memory_metrics = {
                    "rss_before_mb": round(rss_before_mb, 2),
                    "rss_after_mb": round(rss_after_mb, 2),
                    "delta_mb": round(rss_after_mb - rss_before_mb, 2)
                }
        except Exception:
            memory_metrics = None

        response_payload = {
            "sentence": sentence,
            "tokens": tokens,
            "analysis": sentence_analysis,
            "method": "ToCylog",
            "metrics": {
                "processing_ms": processing_ms,
                "memory": memory_metrics
            }
        }

        return create_cors_response(response_payload)
    
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
            "model": "tl_tocylog_trf",
            "model_status": model_status,
            "pos_tags_available": list(POS_OPTIONS.keys()),
            "python_version": sys.version,
            "spacy_version": spacy.__version__,
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
        questions = generate_pos_questions(sentence, num_questions=10)
        
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
            "source": "ToCylog" if nlp else "fallback",
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
        # Optional grade level filter (real pools loaded from files)
        grade = request.args.get('grade')

        # Select pool based on grade or default to full list
        if grade == 'G1_2':
            # Prefer external JSON source for Grade 1-2
            json_words = load_g1_2_words_from_json()
            if json_words and len(json_words) > 0:
                words = json_words
            else:
                words = GRADE_WORDS.get('G1_2', []).copy()
        elif grade == 'G3_4':
            json_words = load_g3_4_words_from_json()
            if json_words and len(json_words) > 0:
                words = json_words
            else:
                words = GRADE_WORDS.get('G3_4', []).copy()
        elif grade == 'G5_6':
            json_words = load_g5_6_words_from_json()
            if json_words and len(json_words) > 0:
                words = json_words
            else:
                words = GRADE_WORDS.get('G5_6', []).copy()
        elif grade in GRADE_WORDS and len(GRADE_WORDS[grade]) > 0:
            words = GRADE_WORDS[grade].copy()
        else:
            # If no grade provided, default to G3_4 to avoid old pool
            default_grade = 'G3_4'
            grade = default_grade
            words = GRADE_WORDS.get(default_grade, [])[:]

        # Normalize all entries to a consistent schema
        normalized = [normalize_word_item(w, grade) for w in words]
        random.shuffle(normalized)
        
        # Return the words
        return create_cors_response({
            "words": normalized,
            "count": len(normalized)
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


# --- Conversation challenge endpoints ---
@app.route('/api/conversation/chat', methods=['POST', 'OPTIONS'])
@cross_origin()
def conversation_chat():
    """Proxy endpoint for conversation challenge chat messages."""
    if request.method == 'OPTIONS':
        return handle_preflight_request()

    try:
        data = request.json or {}
        message = data.get('message')
        if not message or not isinstance(message, str):
            return jsonify({"error": "message is required"}), 400

        # Compute score delta by comparing points before/after
        # Use parts-aware response for multi-entity separation
        parts_payload = conv_get_bot_response_parts(message)
        reply_text = parts_payload.get('reply') if isinstance(parts_payload, dict) else str(parts_payload)
        reply_parts = parts_payload.get('parts') if isinstance(parts_payload, dict) else None

        # Remove any inline points text from reply (multiple formats/newlines)
        # Keep other gamification messages like level-ups and streak bonuses
        # First, drop any line containing the word 'Puntos' or 'Level Up' (case-insensitive)
        try:
            lines = [
                ln for ln in reply_text.splitlines()
                if ('puntos' not in ln.lower() and 'level up' not in ln.lower())
            ]
            cleaned_reply = ' '.join([ln.strip() for ln in lines if ln.strip()])
        except Exception:
            cleaned_reply = reply_text
        # As a secondary safety, strip remaining inline occurrences like "... Puntos: 9" or "Level Up! ..."
        try:
            cleaned_reply = re.sub(r"(?i)\bPuntos\b\s*:\s*\d+", "", cleaned_reply).strip()
            cleaned_reply = re.sub(r"(?i)🏆?\s*Level\s*Up!.*?(?=$|[.?!])", "", cleaned_reply).strip()
        except Exception:
            pass

        # Determine points delta by counting recognized entity mentions in the reply
        # Patterns like: "'John' (PER)", "'DLSU' (ORG)", "'Manila' (GPE)"
        try:
            entity_hits = re.findall(r"'[^']+'\s*\([A-Z]{2,}\)", reply_text)
            delta = max(0, len(entity_hits))
        except Exception:
            delta = 0
        return create_cors_response({
            "reply": cleaned_reply,
            "replyParts": reply_parts,
            "scoreDelta": delta
        })
    except Exception as e:
        logger.error(f"Error in conversation chat: {str(e)}", exc_info=True)
        return jsonify({"error": "Error handling conversation chat"}), 500


@app.route('/api/conversation/summary', methods=['GET', 'OPTIONS'])
@cross_origin()
def conversation_summary():
    """Return current conversation summary (points, level, entities, log)."""
    if request.method == 'OPTIONS':
        return handle_preflight_request()
    try:
        return create_cors_response(conv_get_summary())
    except Exception as e:
        logger.error(f"Error fetching conversation summary: {str(e)}", exc_info=True)
        return jsonify({"error": "Error fetching summary"}), 500

@app.route('/api/conversation/reset', methods=['POST', 'OPTIONS'])
@cross_origin()
def conversation_reset():
    """Reset the conversation session (entities/log/points) to start fresh."""
    if request.method == 'OPTIONS':
        return handle_preflight_request()
    try:
        conv_reset()
        return create_cors_response({"status": "reset"})
    except Exception as e:
        logger.error(f"Error resetting conversation: {str(e)}", exc_info=True)
        return jsonify({"error": "Error resetting conversation"}), 500

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
    # Respect platform-provided PORT (Render/Railway/Fly), default to 5000 locally
    port = int(os.environ.get('PORT', '5000'))

    # Log startup information
    logger.info(f"Using Python {sys.version}")
    logger.info(f"Model status: {MODEL_STATUS}")
    logger.info(f"Starting NLP API server on port {port}")
    print(f"NLP API server running at: http://0.0.0.0:{port}")

    # Run the Flask app (no reloader in containers)
    app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)