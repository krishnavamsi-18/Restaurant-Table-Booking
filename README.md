# 🍽️ Agentic AI - Restaurant Reservation System# AI Table Reservation System



A comprehensive, AI-powered restaurant reservation system with voice bot integration, enabling users to discover restaurants, make reservations, and manage bookings through both voice commands and manual interactions.A comprehensive restaurant reservation system with AI-powered voicebot integration.



## ✨ Features## Features



- **🔐 Authentication**: JWT-based user login/registration with secure password hashing- **Authentication**: JWT-based user login/registration

- **📍 Location Services**: Geolocation-based restaurant discovery and city selection- **Location Access**: Geolocation-based restaurant discovery

- **🎤 Voice Navigation**: AI-powered voicebot for hands-free restaurant search and reservation- **Voice Navigation**: AI voicebot for hands-free interaction

- **🔍 Smart Restaurant Discovery**: Browse and filter restaurants by cuisine, ratings, and availability- **Restaurant Discovery**: Browse restaurants with images and details

- **⏰ Intelligent Reservations**: Check real-time restaurant hours and availability- **Smart Reservations**: Voice and manual booking system

- **📧 Email Notifications**: Confirmation emails for bookings and reservations- **User Dashboard**: Manage current and past reservations

- **👤 User Dashboard**: Manage current and past reservations with detailed booking history

- **🗣️ Natural Language Processing**: Gemini AI for understanding voice commands## Tech Stack



## 🛠️ Tech Stack- **Frontend**: React with modern UI components

- **Backend**: Python with FastAPI

### Frontend- **Database**: Vector database for efficient data storage

- **Framework**: React 18.2 with TypeScript- **Authentication**: JWT tokens

- **Styling**: Styled Components & Framer Motion- **Voice Integration**: Web Speech API

- **State Management**: React Context API

- **HTTP Client**: Axios## Project Structure

- **Routing**: React Router v6

- **Voice Integration**: Web Speech API```

├── frontend/          # React application

### Backend├── backend/           # Python FastAPI server

- **Framework**: FastAPI (Python)├── database/          # Vector database configuration

- **Database**: MongoDB with Motor (async driver)└── docs/             # Documentation

- **Authentication**: JWT tokens with python-jose```

- **Password Security**: Bcrypt hashing

- **AI Integration**: Google Generative AI (Gemini)## Getting Started

- **Email Service**: SendGrid

- **Task Queue**: Celery with Redis### Backend Setup

- **Testing**: Pytest with pytest-asyncio```bash

cd backend

### Database & Servicespip install -r requirements.txt

- **Database**: MongoDB Atlaspython main.py

- **Vector Database**: ChromaDB (for semantic search)```

- **Cache**: Redis

- **Email**: SendGrid### Frontend Setup

- **AI Model**: Google Gemini API```bash

cd frontend

## 📁 Project Structurenpm install

npm start

``````

Agentic_AI/

├── frontend/                          # React TypeScript Application## API Endpoints

│   ├── src/

│   │   ├── components/- `POST /auth/register` - User registration

│   │   │   ├── auth/                 # Login, Register pages- `POST /auth/login` - User login

│   │   │   ├── restaurants/          # Restaurant list and details- `GET /restaurants` - Get restaurants by location

│   │   │   ├── reservations/         # Booking and reservation management- `POST /reservations` - Create reservation

│   │   │   ├── voicebot/             # Voice bot interface- `GET /reservations/user/{user_id}` - Get user reservations

│   │   │   ├── profile/              # User profile and settings

│   │   │   └── LocationAccess.tsx    # Geolocation handler## Security

│   │   ├── contexts/                 # React Context (Auth, Location)

│   │   ├── services/                 # API service layer- JWT token authentication

│   │   ├── types/                    # TypeScript interfaces- Input validation and sanitization

│   │   └── utils/                    # Helper utilities- Secure API communications

│   ├── package.json- Session management
│   └── tsconfig.json
├── backend/                           # FastAPI Application
│   ├── main.py                       # FastAPI app and routes
│   ├── jwt_auth.py                   # JWT authentication logic
│   ├── gemini_service.py             # AI/NLP service
│   ├── email_service.py              # Email notifications
│   ├── restaurant_hours_utils.py     # Restaurant status utilities
│   ├── reservation_utils.py          # Reservation validation
│   ├── requirements.txt              # Python dependencies
│   └── __pycache__/
├── database/                          # Database configuration
│   ├── __init__.py
│   └── vector_db.py                  # Vector database setup
└── docs/                              # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (local or Atlas)
- Redis server
- API Keys: Google Generative AI, SendGrid

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the backend directory:
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=restaurant_reservation_db
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
REDIS_URL=redis://localhost:6379
```

Start the backend server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000`

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh JWT token

### Restaurants
- `GET /restaurants` - Get restaurants (with optional filters)
- `GET /restaurants/{id}` - Get restaurant details
- `GET /restaurants/search` - Search restaurants by name/cuisine
- `GET /restaurants/nearby` - Get nearby restaurants by coordinates

### Reservations
- `POST /reservations` - Create a new reservation
- `GET /reservations/user/{user_id}` - Get user's reservations
- `GET /reservations/{id}` - Get reservation details
- `PUT /reservations/{id}` - Update reservation
- `DELETE /reservations/{id}` - Cancel reservation

### User Profile
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `POST /users/change-password` - Change password

## 🔐 Security Features

- ✅ JWT token-based authentication
- ✅ Bcrypt password hashing
- ✅ CORS middleware configuration
- ✅ Input validation and sanitization
- ✅ Secure API communications (HTTPS ready)
- ✅ Session management with token expiration
- ✅ Protected routes with authentication guards

## 📝 Environment Variables

Create `.env` files in both `backend` and `frontend` directories:

**Backend (.env)**
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=restaurant_reservation_db
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_google_gemini_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
REDIS_URL=redis://localhost:6379
```

**Frontend (.env)**
```env
REACT_APP_API_BASE_URL=http://localhost:8000
```

## 🧪 Testing

Run backend tests:
```bash
cd backend
pytest
```

Run frontend tests:
```bash
cd frontend
npm test
```

## 📚 Additional Resources

- [Frontend README](./frontend/README.md) - Frontend-specific documentation
- [Voice Bot Guide](./VOICEBOT_GUIDE.md) - Voice bot setup and usage
- API Documentation available at `http://localhost:8000/docs` (Swagger UI)

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

Krishna - Agentic AI Project

## 🙏 Acknowledgments

- Google Generative AI (Gemini) for AI capabilities
- FastAPI for the robust backend framework
- React for the responsive frontend
- MongoDB for flexible data storage