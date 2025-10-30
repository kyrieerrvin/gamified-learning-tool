# NLP Connection Issue Debug Session

## Error
```
Failed to connect to NLP service at http://localhost:6000/analyze
Error: ECONNREFUSED
```

## Context
- Date: 2025-03-10
- Component: NLP Service
- File: src/services/nlpService.ts

## Analysis
The frontend was unable to connect to the Python NLP backend service. The error indicates that either:
1. The Python server wasn't running
2. The server was running on a different port
3. There was a network issue preventing the connection

## Debugging Steps

### 1. Verifying Python Server Status
```bash
ps aux | grep python
```
Result: No Python process was running for the NLP server

### 2. Attempting to Start the Server
```bash
./start-nlp.sh
```
Result: Error - "spacy module not found"

### 3. Checking Python Dependencies
```bash
pip list | grep spacy
```
Result: No spacy package installed

## Solution
1. Installed the missing Python dependencies:
```bash
pip install spacy flask flask-cors
```

2. Started the NLP server:
```bash
./start-nlp.sh
```

3. Verified the connection:
```bash
curl http://localhost:6000/health
```
Result: {"status": "ok", "message": "NLP service is running"}

## Root Cause
The Python dependencies were not installed, specifically the spacy NLP model package which is essential for the backend functionality.

## Prevention
- Added clear dependency installation instructions to README.md
- Updated CLAUDE.md to include the Python dependencies
- Created a requirements.txt file for easier dependency management

## Related Issues
- Error ID: nlp-001
- Files: src/services/nlpService.ts, app.py, start-nlp.sh