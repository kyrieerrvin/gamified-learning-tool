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

# Entity-specific response templates (randomized for variety)
PERSON_TEMPLATES = [
    "Nabanggit mo si '{ent}' ({label}). Pwede mo bang ikuwento sino siya?",
    "'{ent}' ({label})? Paano kayo nagkakilala?",
    "Si '{ent}' ({label}) pala! Ano ang pinakanatatandaan mong karanasan kasama siya?",
    "Nabanggit mo si '{ent}' ({label}). Anong papel niya sa buhay mo?",
]

LOCATION_TEMPLATES = [
    "Binanggit mo ang lugar na '{ent}' ({label}). Ano ang karanasan mo roon?",
    "Ah, sa '{ent}' ({label})! Ano ang pinakagusto mo sa lugar na 'yan?",
    "Uy, '{ent}' ({label})! May espesyal bang alaala ka ro’n?",
    "Sa '{ent}' ({label})? Ang saya siguro ro’n! Ano ang una mong naiisip kapag naririnig mo ang lugar na 'yan?",
]

ORG_TEMPLATES = [
    "Ay, '{ent}' ({label})! Ano ang ginawa mo o natutunan sa lugar na ito?",
    "Ay, '{ent}' ({label})! Anong koneksyon mo sa organisasyong ito?",
    "Uy, '{ent}' ({label})! May kwento ka ba tungkol dito?",
    "'{ent}' ({label}) — paano mo sila nakilala o nalaman?",
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
            template = random.choice(PERSON_TEMPLATES)
            responses.append(template.format(ent=ent.text, label=label))
        elif label in ["LOC", "GPE"]:
            template = random.choice(LOCATION_TEMPLATES)
            responses.append(template.format(ent=ent.text, label=label))
        elif label == "ORG":
            template = random.choice(ORG_TEMPLATES)
            responses.append(template.format(ent=ent.text, label=label))
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

# Reset conversation session data
def reset_conversation():
    global conversation_log, user_points, user_level, user_streak
    conversation_log = []
    user_points = 0
    user_level = 1
    user_streak = 0
    return True