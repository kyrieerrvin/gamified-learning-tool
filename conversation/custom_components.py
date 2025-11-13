from spacy.language import Language
from spacy.tokens import Doc

@Language.factory("force_masarap_adj")
def create_force_masarap_adj_component(nlp: Language, name: str):
    """
    Creates a custom spaCy component to forcibly tag 'masarap' as an adjective (ADJ).
    This is a workaround for potential model misclassifications.
    """
    def force_masarap_adj_component(doc: Doc) -> Doc:
        for token in doc:
            if token.text.lower() == "masarap":
                # Override the POS tag to be ADJ
                token.pos_ = "ADJ"
        return doc
    return force_masarap_adj_component
