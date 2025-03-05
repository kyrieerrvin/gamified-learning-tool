#!/bin/bash

# Terminal colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================${NC}"
echo -e "${BLUE}  Tagalog NLP API Starter          ${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""

# Function to check for required dependencies
check_dependencies() {
  echo -e "${YELLOW}Checking dependencies...${NC}"
  
  # Check for Python
  if ! command -v python &> /dev/null; then
    echo -e "${RED}❌ Python not found. Please install Python.${NC}"
    exit 1
  fi
  
  # Check for Flask
  python -c "import flask" &> /dev/null
  if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️ Flask not found. Installing...${NC}"
    pip install flask flask-cors
  fi
  
  # Check for CalamanCy
  python -c "import calamancy" &> /dev/null
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ CalamanCy not found.${NC}"
    echo -e "${YELLOW}Installing CalamanCy (this may take a few minutes)...${NC}"
    pip install calamancy
    if [ $? -ne 0 ]; then
      echo -e "${RED}❌ Failed to install CalamanCy. Please install manually: pip install calamancy${NC}"
      exit 1
    fi
  fi
  
  echo -e "${GREEN}✅ All dependencies found!${NC}"
}

# Function to start the NLP API
start_nlp_api() {
  echo -e "${YELLOW}Starting NLP API...${NC}"
  
  # Check if something is already running on port 5000
  if lsof -i :5000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ Port 5000 is already in use. Attempting to free it...${NC}"
    # Get PID of process using port 5000
    PORT_PID=$(lsof -i :5000 -t)
    if [ -n "$PORT_PID" ]; then
      echo -e "${YELLOW}Killing process with PID: ${PORT_PID}${NC}"
      kill -9 $PORT_PID
      sleep 1
    fi
  fi
  
  # Also check for existing Python processes running app.py
  EXISTING_APP_PID=$(ps aux | grep "[p]ython.*app.py" | awk '{print $2}')
  if [ -n "$EXISTING_APP_PID" ]; then
    echo -e "${YELLOW}⚠️ Found existing app.py process. Killing PID: ${EXISTING_APP_PID}${NC}"
    kill -9 $EXISTING_APP_PID
    sleep 1
  fi
  
  # Start Python Flask server with app.py
  chmod +x app.py
  ./app.py
}

# Main execution
check_dependencies
start_nlp_api