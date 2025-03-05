#!/usr/bin/env python3
"""
Test script to verify connectivity between NLP API and frontend.
Tests all possible connection paths to ensure they work correctly.
"""

import requests
import json
import time
import sys

def print_header(msg):
    """Print formatted header message"""
    print("\n" + "="*50)
    print(f"  {msg}")
    print("="*50)

def print_success(msg):
    """Print success message"""
    print(f"✅ {msg}")

def print_error(msg):
    """Print error message"""
    print(f"❌ {msg}")

def test_health_endpoint():
    """Test the health endpoint of the NLP API"""
    print_header("Testing NLP API Health Endpoint")
    
    try:
        response = requests.get("http://localhost:5000/health")
        if response.status_code == 200:
            data = response.json()
            print_success("Health endpoint is responding")
            print(f"  Model status: {data.get('model_status', 'unknown')}")
            print(f"  POS tags available: {', '.join(data.get('pos_tags_available', []))}")
            return True
        else:
            print_error(f"Health check failed with status code: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error connecting to health endpoint: {str(e)}")
        return False

def test_pos_game_endpoint():
    """Test the POS game endpoint"""
    print_header("Testing POS Game Endpoint")
    
    # Test the main endpoint at /api/pos-game
    try:
        response = requests.get("http://localhost:5000/api/pos-game?difficulty=easy")
        if response.status_code == 200:
            data = response.json()
            print_success("POS game endpoint (/api/pos-game) is responding")
            print(f"  Sentence: \"{data.get('sentence', '')}\"")
            print(f"  Questions: {len(data.get('questions', []))}")
            print(f"  Source: {data.get('source', 'unknown')}")
        else:
            print_error(f"POS game endpoint (/api/pos-game) failed: {response.status_code}")
    except Exception as e:
        print_error(f"Error connecting to POS game endpoint: {str(e)}")
    
    # Test the compatibility endpoint at /api/challenges/pos-game
    try:
        response = requests.get("http://localhost:5000/api/challenges/pos-game?difficulty=easy")
        if response.status_code == 200:
            data = response.json()
            print_success("Compatibility endpoint (/api/challenges/pos-game) is responding")
            print(f"  Sentence: \"{data.get('sentence', '')}\"")
        else:
            print_error(f"Compatibility endpoint (/api/challenges/pos-game) failed: {response.status_code}")
    except Exception as e:
        print_error(f"Error connecting to compatibility endpoint: {str(e)}")

def test_analyze_endpoint():
    """Test the analyze endpoint"""
    print_header("Testing Analyze Endpoint")
    
    sentence = "Kumain ako ng mansanas."
    
    # Test the main /api/analyze endpoint
    try:
        response = requests.post(
            "http://localhost:5000/api/analyze",
            json={"sentence": sentence},
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            data = response.json()
            print_success("Analyze endpoint (/api/analyze) is responding")
            print(f"  Tokens: {len(data.get('tokens', []))}")
            for token in data.get('tokens', []):
                print(f"    {token.get('text')}: {token.get('pos')} - {token.get('description')}")
        else:
            print_error(f"Analyze endpoint (/api/analyze) failed: {response.status_code}")
    except Exception as e:
        print_error(f"Error connecting to analyze endpoint: {str(e)}")
    
    # Test the compatibility /api/test-pos endpoint
    try:
        response = requests.post(
            "http://localhost:5000/api/test-pos",
            json={"sentence": sentence},
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            data = response.json()
            print_success("Compatibility endpoint (/api/test-pos) is responding")
            print(f"  Tokens: {len(data.get('tokens', []))}")
        else:
            print_error(f"Compatibility endpoint (/api/test-pos) failed: {response.status_code}")
    except Exception as e:
        print_error(f"Error connecting to compatibility endpoint: {str(e)}")

def main():
    """Main function to run all tests"""
    print("\n🔍 Testing NLP API Integration")
    print("This script tests connectivity to the NLP API endpoints")
    
    # First check if the API is running
    if not test_health_endpoint():
        print("\n❌ The NLP API doesn't appear to be running.")
        print("Please start it with: ./start-nlp.sh")
        return
    
    # Test the game endpoint
    test_pos_game_endpoint()
    
    # Test the analyze endpoint
    test_analyze_endpoint()
    
    print("\n✨ Testing complete!")

if __name__ == "__main__":
    main()