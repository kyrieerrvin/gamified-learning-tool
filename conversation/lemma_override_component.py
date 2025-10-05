from typing import Dict, Optional
from pathlib import Path
import json
from spacy.language import Language
from spacy.tokens import Doc

# You can extend these defaults; they’ll be merged with JSON + config maps.
DEFAULT_RULES: Dict[str, str] = {
    "masarap": "sarap", "Masarap": "sarap",
    "sarap": "sarap",
    "maganda": "ganda", "Maganda": "ganda",
    "marami": "dami", "Marami": "dami",
    "wala": "wala", "Wala": "wala",
    "ewan": "ewan",
    "sana": "sana",
    "hapag-kainan": "hapag-kainan",
}

@Language.factory(
    "lemma_override",
    default_config={
        "lemma_map": {},          # free-form map in config.cfg if you want
        "json_path": None,        # (optional) explicit JSON path
    },
)
def create_lemma_override(
    nlp: Language,
    name: str,
    lemma_map: Dict[str, str],
    json_path: Optional[str],
):
    # Start with defaults
    rules: Dict[str, str] = dict(DEFAULT_RULES)

    # 1) Load rules from JSON (either explicit path, or auto-detect in model dir)
    json_file: Optional[Path] = None
    if json_path:
        json_file = Path(json_path)
    else:
        try:
            # When loading from a directory, nlp.path points to that model dir
            base = getattr(nlp, "path", None)
            if base:
                json_file = Path(base) / "lemma_override" / "lemma_override.json"
        except Exception:
            json_file = None

    if json_file and json_file.exists():
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                file_rules = json.load(f)
            if isinstance(file_rules, dict):
                rules.update(file_rules)
        except Exception:
            # Ignore malformed/absent file silently
            pass

    # 2) Merge any rules from the config's lemma_map
    for k, v in (lemma_map or {}).items():
        rules[k] = v
        kl = k.lower()
        if kl not in rules:
            rules[kl] = v

    def component(doc: Doc) -> Doc:
        for token in doc:
            t = token.text
            lemma = rules.get(t) or rules.get(t.lower())
            if lemma:
                token.lemma_ = lemma
        return doc

    return component
