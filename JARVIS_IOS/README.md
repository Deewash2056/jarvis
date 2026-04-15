# JARVIS iOS App

A SwiftUI-based iOS app version of JARVIS, the AI assistant inspired by Iron Man.

## Features
- Voice input using Speech framework
- Text-to-speech output using AVFoundation
- AI responses via Google Gemini Pro
- Text input fallback

## Setup
1. Open Xcode.
2. Create a new SwiftUI project named "JARVIS".
3. Replace the generated files with the ones in this folder.
4. Add the Info.plist to the project.
5. Ensure microphone and speech permissions are granted.
6. Replace the API key in ContentView.swift with your Google AI API key.
7. Run on device or simulator.

## Permissions
- Microphone access for voice input
- Speech recognition for processing voice

## API
Uses Google Gemini Pro via REST API. Ensure you have a valid API key with quota.
