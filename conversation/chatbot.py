import spacy
import random

# Load ToCylog model
tocylog_nlp = spacy.load("./tl_tocylog_trf")

# Gamification state
user_points = 0
user_level = 1
user_streak = 0
conversation_log = []

# Greeting responses
greetings = [
    "Magandang araw! Kamusta ka?",
    "Kumusta! Anong balita?",
    "Mabuti, salamat. Ikaw, kamusta?",
    "Ayos lang ako. Kamusta ka rin?"
]

# Fallback prompts
fallbacks = [
    "Hmm, hindi ko masyadong nakuha. Pwede bang ulitin gamit ang mas simpleng salita?",
    "Pasensya, medyo nalito ako. Maaari mo bang ipaliwanag pa?",
    "Medyo hindi ko naintindihan. Pahingi ng halimbawa?"
]

# Gamification feedback
def get_progress_feedback():
    global user_points, user_level, user_streak
    # Gamification handled client-side; back-end returns no points/level text
    return ""

def _generate_responses(user_input):
    doc = tocylog_nlp(user_input)
    responses = []
    entities_detected = []

    # Greeting detection
    if any(greet in user_input.lower() for greet in 
           ["kamusta", "kumusta", "musta", "magandang araw",
            "magandang umaga", "magandang hapon", "magandang gabi",
            "hello", "hi"]):
        return [random.choice(greetings)], []

    # Entity-based responses
    for ent in doc.ents:
        label = ent.label_
        entities_detected.append((ent.text, label))

        if label in ["PER", "PERSON"]:
            responses.append(f"Nabanggit mo si '{ent.text}' ({label}). Pwede mo bang ikuwento sino siya?")
        elif label in ["LOC", "GPE"]:
            responses.append(f"Binanggit mo ang lugar na '{ent.text}' ({label}). Ano ang karanasan mo roon?")
        elif label == "ORG":
            responses.append(f"Ay, '{ent.text}' ({label})! Ano ang ginawa mo o natutunan sa lugar na ito?")
        else:
            responses.append(f"Nabanggit mo ang '{ent.text}' ({label}). Pwede mo bang dagdagan ang detalye?")

    if not responses:
        responses = [random.choice(fallbacks)]

    return responses, entities_detected

# Main chatbot (kept for backward compatibility: returns a single string)
def get_bot_response(user_input):
    global conversation_log
    responses, entities_detected = _generate_responses(user_input)
    bot_reply = " ".join(responses)
    conversation_log.append({
        "user": user_input,
        "bot": bot_reply,
        "entities": entities_detected,
    })
    return bot_reply

# New helper that returns split parts for the UI
def get_bot_response_parts(user_input):
    responses, entities_detected = _generate_responses(user_input)
    bot_reply = " ".join(responses)
    # Do not append to log twice; reuse same behavior as get_bot_response
    conversation_log.append({
        "user": user_input,
        "bot": bot_reply,
        "entities": entities_detected,
    })
    return {"reply": bot_reply, "parts": responses}

# Summary
def get_summary():
    global user_points, user_level, conversation_log
    entities = []
    for entry in conversation_log:
        if "entities" in entry and entry["entities"]:
            for ent_text, ent_label in entry["entities"]:
                entities.append((ent_text, ent_label))

    summary = {
        "points": user_points,
        "level": user_level,
        "entities": entities,
        "conversation": conversation_log
    }
    return summary