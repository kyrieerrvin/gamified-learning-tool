from flask import Flask, render_template, request, jsonify
from chatbot import get_bot_response   # <-- Import from chatbot.py

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.json.get("message")
    response = get_bot_response(user_input)  # <-- Use ToCylog-powered response
    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(debug=True)
