//
//  ContentView.swift
//  JARVIS
//
//  Created by GitHub Copilot
//

import SwiftUI
import Speech
import AVFoundation

struct ContentView: View {
    @State private var isListening = false
    @State private var userInput = ""
    @State private var jarvisResponse = ""
    @State private var synthesizer = AVSpeechSynthesizer()
    
    private let speechRecognizer = SFSpeechRecognizer()
    private let audioEngine = AVAudioEngine()
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    
    var body: some View {
        VStack(spacing: 20) {
            Text("JARVIS AI Assistant")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text(jarvisResponse)
                .font(.body)
                .multilineTextAlignment(.center)
                .padding()
                .frame(height: 100)
            
            HStack {
                TextField("Type your command", text: $userInput)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding(.horizontal)
                
                Button(action: sendTextInput) {
                    Text("Send")
                }
                .padding(.horizontal)
            }
            
            Button(action: toggleListening) {
                Text(isListening ? "Stop Listening" : "Start Voice")
                    .foregroundColor(.white)
                    .padding()
                    .background(isListening ? Color.red : Color.blue)
                    .cornerRadius(10)
            }
            
            Spacer()
        }
        .padding()
        .onAppear {
            requestPermissions()
        }
    }
    
    private func requestPermissions() {
        SFSpeechRecognizer.requestAuthorization { status in
            // Handle authorization
        }
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
            // Handle permission
        }
    }
    
    private func toggleListening() {
        if isListening {
            stopListening()
        } else {
            startListening()
        }
    }
    
    private func startListening() {
        guard let recognizer = speechRecognizer, recognizer.isAvailable else { return }
        
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else { return }
        
        let inputNode = audioEngine.inputNode
        recognitionRequest.shouldReportPartialResults = true
        
        recognitionTask = recognizer.recognitionTask(with: recognitionRequest) { result, error in
            if let result = result {
                userInput = result.bestTranscription.formattedString
            }
            if error != nil || result?.isFinal == true {
                stopListening()
                sendTextInput()
            }
        }
        
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            recognitionRequest.append(buffer)
        }
        
        audioEngine.prepare()
        do {
            try audioEngine.start()
            isListening = true
        } catch {
            print("Audio engine failed to start")
        }
    }
    
    private func stopListening() {
        audioEngine.stop()
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionTask = nil
        isListening = false
    }
    
    private func sendTextInput() {
        guard !userInput.isEmpty else { return }
        
        if userInput.lowercased().contains("exit") || userInput.lowercased().contains("quit") {
            jarvisResponse = "Goodbye, Sir."
            speak(text: jarvisResponse)
            return
        }
        
        // Call Gemini API
        getAIResponse(for: "Respond as JARVIS, the AI assistant: \(userInput)") { response in
            DispatchQueue.main.async {
                jarvisResponse = response ?? "Error getting response"
                speak(text: jarvisResponse)
            }
        }
        
        userInput = ""
    }
    
    private func speak(text: String) {
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
        utterance.rate = 0.5
        synthesizer.speak(utterance)
    }
    
    private func getAIResponse(for prompt: String, completion: @escaping (String?) -> Void) {
        let apiKey = "[REDACTED_API_KEY]" // Replace with your key
        let url = URL(string: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=\(apiKey)")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "contents": [
                [
                    "parts": [
                        ["text": prompt]
                    ]
                ]
            ]
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let data = data,
               let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let candidates = json["candidates"] as? [[String: Any]],
               let firstCandidate = candidates.first,
               let content = firstCandidate["content"] as? [String: Any],
               let parts = content["parts"] as? [[String: Any]],
               let firstPart = parts.first,
               let text = firstPart["text"] as? String {
                completion(text)
            } else {
                completion("Error: Unable to get response")
            }
        }.resume()
    }
}
