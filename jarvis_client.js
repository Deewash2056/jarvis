const output = document.getElementById("output");
const textInput = document.getElementById("textInput");
let recognition;

// Check for Web Speech API support
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    textInput.value = transcript;
    sendText();
  };

  recognition.onerror = function (event) {
    if (event.error === "network") {
      output.textContent =
        "Voice recognition failed due to network issues. Please check your internet connection or use text input.";
    } else {
      output.textContent = "Voice recognition error: " + event.error;
    }
  };
} else {
  output.textContent = "Web Speech API not supported in this browser.";
}

function startVoice() {
  if (recognition) {
    recognition.start();
    output.textContent = "Listening...";
  }
}

function stopVoice() {
  if (recognition) {
    recognition.stop();
    output.textContent = "Voice stopped.";
  }
}

function sendText() {
  const query = textInput.value.trim();
  if (!query) return;

  if (query.toLowerCase().includes("exit") || query.toLowerCase().includes("quit")) {
    output.textContent = "Goodbye!";
    speak("Goodbye!");
    return;
  }

  output.textContent = "Thinking...";
  getAIResponse(query);
  textInput.value = "";
}

function getAIResponse(prompt) {
  fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  })
    .then(async (response) => {
      let data;
      try {
        data = await response.json();
      } catch (error) {
        throw new Error("Invalid server response");
      }
      if (!response.ok) {
        const message = data.error || "Unable to get response";
        throw new Error(message);
      }
      return data;
    })
    .then((data) => {
      const responseText = data.text;
      if (!responseText) {
        output.textContent = "Error: Unable to get response";
        return;
      }
      output.textContent = responseText;
      speak(responseText);
    })
    .catch((error) => {
      output.textContent = "Error: " + error.message;
    });
}

function speak(text) {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  }
}

// Initial greeting
speak("Hello, I am JARVIS. How can I assist you today?");
