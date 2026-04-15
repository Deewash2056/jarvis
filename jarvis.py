import speech_recognition as sr
import pyttsx3
from google import genai
import os

# Initialize Google Generative AI
client = genai.Client(api_key=os.getenv(''))

# Initialize text-to-speech engine
engine = pyttsx3.init()
engine.setProperty('rate', 180)  # Speed of speech

def speak(text):
    """Convert text to speech."""
    engine.say(text)
    engine.runAndWait()

def listen():
    """Listen for voice input and return text."""
    # For now, using text input due to PyAudio issues on macOS
    query = input("You: ")
    print(f"You said: {query}")
    return query.lower()

def get_ai_response(prompt):
    """Get response from Google Gemini."""
    try:
        response = client.models.generate_content(
            model='gemini-pro-latest',
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        return f"Error: {str(e)}"

def main():
    speak("Hello Diwash, I am JARVIS. How can I assist you today?")
    while True:
        query = listen()
        if query:
            if "exit" in query or "quit" in query:
                speak("Goodbye!")
                break
            # Add custom commands here, e.g., if "open browser" in query: os.system("open /Applications/Safari.app")
            response = get_ai_response(f"Respond as JARVIS, the AI assistant: {query}")
            speak(response)

if __name__ == "__main__":
    main()
