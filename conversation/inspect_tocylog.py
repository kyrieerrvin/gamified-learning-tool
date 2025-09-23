import spacy
import os

# Load your Tagalog model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TOCYLOG_MODEL_PATH = os.path.join(BASE_DIR, "tl_tocylog_trf")
nlp = spacy.load(TOCYLOG_MODEL_PATH)

# Sample Tagalog sentences
examples = [
    "Kamusta, anong pangalan mo?",
    "Salamat sa tulong mo!",
    "Paalam na, kita tayo bukas sa Maynila.",
    "Magkano ang tuition sa DLSU ngayong taon?"
]

for text in examples:
    print(f"\n🔹 Input: {text}")
    doc = nlp(text)

    # Tokens + POS
    print("Tokens + POS:")
    for token in doc:
        print(f"  {token.text:<15} {token.pos_}")

    # Entities
    print("Entities:")
    for ent in doc.ents:
        print(f"  {ent.text:<15} {ent.label_}")

    # Check vectors (if available)
    if doc.has_vector:
        print("✅ This model supports vectors (can use similarity).")
    else:
        print("❌ No vectors in this model.")
