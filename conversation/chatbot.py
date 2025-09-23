import spacy
import random

# Load ToCylog model
tocylog_nlp = spacy.load("./tl_tocylog_trf")

# Gamification
user_points = 0
user_level = 1

# Response templates for variety
greetings = [
    "Mabuti! Ikaw, kamusta?",
    "Ayos lang ako. Salamat sa pagtatanong! Ikaw, kamusta?",
    "Maayos naman ako ngayon. Kamusta ka rin?"
]

fallbacks = [
    "Pasensya, hindi ko masyadong naintindihan. Pwede mong ikwento nang mas malinaw?",
    "Hmm... maaari mo bang ipaliwanag pa?",
    "Medyo nalito ako. Ano ang ibig mong sabihin?"
]

def get_bot_response(user_input):
    global user_points, user_level
    doc = tocylog_nlp(user_input)

    # 1. Greeting detection (simple heuristic)
    if any(word in user_input.lower() for word in ["kamusta", "kumusta", "musta"]):
        return random.choice(greetings)

    # 2. Entity-based responses
    if doc.ents:
        responses = []
        for ent in doc.ents:
            if ent.label_ == "PER":
                responses.append(f"Nabanggit mo si '{ent.text}'. Magaling! Sino siya sa'yo?")
                user_points += 1
            elif ent.label_ == "LOC":
                responses.append(f"Binanggit mo ang lugar na '{ent.text}'. Ano ang madalas mong gawin doon?")
                user_points += 1
            elif ent.label_ == "ORG":
                responses.append(f"Ay, nabanggit mo ang '{ent.text}'. Anong karanasan mo rito?")
                user_points += 1
            else:
                responses.append(f"Nabanggit mo ang '{ent.text}' ({ent.label_}).")

        # Gamification feedback
        if user_points >= user_level * 5:
            user_level += 1
            responses.append(f"🏆 Level Up! Nasa Level {user_level} ka na. Magaling!")
        else:
            responses.append(f"🎉 Puntos: {user_points}")

        return " ".join(responses)

    # 3. Default fallback
    return random.choice(fallbacks)
