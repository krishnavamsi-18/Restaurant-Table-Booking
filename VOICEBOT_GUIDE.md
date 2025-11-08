# 🤖 Gemini-Powered Voice Bot Guide

## Overview
Your restaurant reservation system now includes an advanced AI-powered voice bot that uses Google's Gemini AI for intelligent conversation and command processing.

## 🚀 Features

### ✨ Enhanced AI Capabilities
- **Natural Language Processing**: Uses Gemini AI to understand complex voice commands
- **Intelligent Restaurant Matching**: Advanced matching algorithms for restaurant names
- **Conversational Interface**: Natural dialogue with context awareness
- **Smart Reservation Booking**: Automatic parsing of dates, times, and guest counts

### 🎯 Voice Commands Supported
- `"Book a table at Hotel TAJ for 4 people at 7 PM"`
- `"Reserve at nagasai for 2 tomorrow"`
- `"Make a reservation at Babai Hotel for 6 people this evening"`
- `"Show me restaurants in the area"`
- `"Help me make a reservation"`

### 📱 UI Features
- **Floating Widget**: Compact bottom-right corner placement
- **Expandable Interface**: Clean, modern design with expand/collapse
- **Real-time Processing**: Visual feedback during AI processing
- **Quick Actions**: Direct navigation to restaurants and reservations

## 🔧 Setup Instructions

### Backend Setup
1. **Install Dependencies**:
   ```bash
   cd backend
   pip install google-generativeai python-dotenv
   ```

2. **Configure Environment**:
   - Your `.env` file already contains your Gemini API key
   - The key is: `AIzaSyDtSUtqTNt0RhRmmSAE0fdVgppSJNTYgFs`

3. **Start Backend**:
   ```bash
   python main.py
   ```

### Frontend Setup
1. **Start Frontend**:
   ```bash
   cd frontend
   npm start
   ```

## 🎮 How to Use

### 1. Access the Voice Bot
- Look for the floating blue microphone icon in the bottom-right corner
- Click to expand the voice bot interface

### 2. Make Voice Commands
- Click the microphone button to start listening (turns red when active)
- Speak clearly: "Book a table at [restaurant name] for [number] people"
- The AI will process your request and provide intelligent responses

### 3. AI Processing
- Gemini AI analyzes your voice command
- Intelligently matches restaurant names (handles variations)
- Extracts booking details (guests, time, date)
- Provides conversational feedback

### 4. Reservation Booking
- If you're logged in: AI automatically books the reservation
- If not logged in: Redirects to login page
- Success: Redirects to your reservations page

## 🧠 AI Intelligence Features

### Restaurant Matching
- **Exact Match**: "Hotel TAJ" → "Hotel TAJ"
- **Partial Match**: "taj" → "Hotel TAJ"
- **Variation Handling**: "nagasai" → "Hotel Nagasai"
- **Smart Suggestions**: Offers alternatives if no exact match

### Date/Time Processing
- **Natural Language**: "tomorrow", "this evening", "next Friday"
- **Time Formats**: "7 PM", "19:00", "eight thirty"
- **Smart Defaults**: Default to 7 PM if no time specified

### Guest Count Processing
- **Numbers**: "4 people", "party of 6"
- **Words**: "two of us", "four guests"
- **Default**: 2 people if not specified

## 🔗 API Endpoints

The voice bot uses these new endpoints:

- `POST /voicebot/process` - Process voice commands with AI
- `POST /voicebot/chat` - General conversation with AI
- `POST /voicebot/book-reservation` - Book reservations via voice
- `GET /voicebot/status` - Check voice bot service status

## 🐛 Troubleshooting

### Common Issues
1. **Speech Recognition Not Working**:
   - Use Chrome or Edge browser
   - Allow microphone permissions
   - Check browser security settings

2. **AI Not Responding**:
   - Verify Gemini API key is set correctly
   - Check backend server is running
   - Look for network connectivity issues

3. **Restaurant Not Found**:
   - Try saying the exact restaurant name
   - Use "Hotel" prefix if applicable
   - Check if restaurant exists in database

### Debug Information
- Check browser console for detailed logs
- Backend logs show AI processing steps
- Use `/voicebot/status` endpoint to check service health

## 🌟 Example Interactions

### Successful Booking
```
User: "Book a table at Hotel TAJ for 4 people tomorrow at 8 PM"
AI: "Found Hotel TAJ! Processing booking details..."
AI: "🎉 Perfect! Table booked at Hotel TAJ for 4 people on 2025-10-08 at 20:00. Redirecting..."
```

### Restaurant Suggestions
```
User: "Book a table at nagasa"
AI: "I couldn't find 'nagasa'. Did you mean: Hotel Nagasai, Hotel Arina? Please try the exact name."
```

### Help Request
```
User: "Help me make a reservation"
AI: "I can help you book restaurant reservations using voice commands. Try saying: 'Book a table at [restaurant name] for [number] people at [time]'"
```

## 🎉 Enjoy Your AI-Powered Voice Bot!

Your restaurant reservation system now has cutting-edge AI capabilities. The Gemini integration provides natural, intelligent conversation while maintaining all the restaurant matching and booking functionality you need.