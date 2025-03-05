#!/usr/bin/env python3
"""Simple test script to verify CalamanCy model loading and POS tagging."""

import calamancy
import sys

print(f"CalamanCy version: {calamancy.__version__}")
print(f"Python version: {sys.version}")

print("\nTrying to load CalamanCy model for Tagalog...")

try:
    # Try loading with explicit version
    print("Attempt 1: Loading tl_calamancy_md-0.2.0...")
    nlp = calamancy.load("tl_calamancy_md-0.2.0")
    print("✅ Success! Model loaded.")
except Exception as e:
    print(f"❌ Error: {str(e)}")
    try:
        # Try loading with a simpler name
        print("\nAttempt 2: Loading tl_calamancy_md...")
        nlp = calamancy.load("tl_calamancy_md")
        print("✅ Success! Model loaded.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)

# Test a simple sentence
test_sentence = "Kumain ako ng kanin."
print(f"\nTesting POS tagging on: '{test_sentence}'")

doc = nlp(test_sentence)
for token in doc:
    print(f"- {token.text}: {token.pos_}")

print("\nTest complete!")