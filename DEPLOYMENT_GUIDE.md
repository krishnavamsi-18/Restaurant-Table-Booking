# 🚀 Deployment Guide - Agentic AI Restaurant Reservation System

This guide provides multiple deployment options for your full-stack application.

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Setup
Create production environment files:

**Backend (.env)**
```env
# Database
MONGODB_URL=your_production_mongodb_url
DATABASE_NAME=restaurant_reservation_db

# JWT Security
JWT_SECRET_KEY=your_super_secure_jwt_secret_key_for_production

# AI Services
GEMINI_API_KEY=your_google_gemini_api_key

# Email Service
SENDGRID_API_KEY=your_sendgrid_api_key

# CORS (update with your frontend domain)
ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:3000
```

**Frontend (.env.production)**
```env
REACT_APP_API_URL=https://your-backend-domain.com
```

### 2. Update CORS Settings
In `backend/main.py`, update CORS origins:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-domain.com",
        "http://localhost:3000"  # Keep for local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🌟 Deployment Option 1: Vercel + Railway (Recommended)

### Frontend Deployment (Vercel)

1. **Prepare for Deployment**
   ```bash
   cd frontend
   npm install
   npm run build  # Test local build
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Connect your GitHub repository
   - Select the `frontend` folder as root directory
   - Add environment variables:
     - `REACT_APP_API_URL`: Your backend URL
   - Deploy

3. **Configure Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

### Backend Deployment (Railway)

1. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Select the `backend` folder as root directory
   - Add environment variables (all from .env file above)

2. **Configure Railway Settings**
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Add MongoDB service or use MongoDB Atlas

### Database Setup (MongoDB Atlas)

1. **Create MongoDB Atlas Cluster**
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create free cluster
   - Get connection string
   - Update `MONGODB_URL` in environment variables

## 🐳 Deployment Option 2: Docker + VPS

### 1. Create Docker Files

**Backend Dockerfile**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile**
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf for Frontend**
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

### 2. Docker Compose
```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://localhost:8000

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URL=mongodb://mongo:27017
      - DATABASE_NAME=restaurant_reservation_db
      - JWT_SECRET_KEY=your_jwt_secret
      - GEMINI_API_KEY=your_gemini_key
      - SENDGRID_API_KEY=your_sendgrid_key
    depends_on:
      - mongo

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

### 3. Deploy to VPS
```bash
# On your VPS
git clone https://github.com/krishnavamsi-18/Restaurant-Table-Booking.git
cd Restaurant-Table-Booking
docker-compose up -d
```

## ☁️ Deployment Option 3: Cloud Platform (AWS/GCP/Azure)

### AWS Deployment

**Frontend (S3 + CloudFront)**
1. Build the React app: `npm run build`
2. Upload to S3 bucket
3. Configure CloudFront distribution
4. Update DNS records

**Backend (Elastic Beanstalk or ECS)**
1. Create application.py wrapper for WSGI
2. Deploy using EB CLI or Docker on ECS
3. Configure RDS or use MongoDB Atlas

**Database (MongoDB Atlas or DocumentDB)**
- Use MongoDB Atlas (recommended)
- Or AWS DocumentDB for AWS-native solution

## 🔧 Additional Configuration Files

### 1. Create Procfile (for Heroku-style deployments)
```
web: uvicorn main:app --host=0.0.0.0 --port=${PORT:-8000}
```

### 2. Create requirements-dev.txt (for development)
```
-r requirements.txt
pytest-cov==4.1.0
black==23.7.0
flake8==6.0.0
```

### 3. Update .gitignore
```
# Environment files
.env
.env.production
.env.local

# Build files
frontend/build/
backend/__pycache__/

# Logs
*.log

# Dependencies
node_modules/
```

## 🔒 Security Considerations

### 1. Environment Variables
- Never commit API keys to Git
- Use different keys for production
- Rotate keys regularly

### 2. Database Security
- Use MongoDB Atlas with authentication
- Enable IP whitelist
- Use connection string with credentials

### 3. HTTPS Configuration
- Use SSL certificates
- Configure HTTPS redirects
- Update CORS for HTTPS URLs

### 4. API Security
- Implement rate limiting
- Add input validation
- Use secure headers

## 🚀 Quick Start Deployment (Vercel + Railway)

1. **Push your code to GitHub** (already done!)

2. **Deploy Backend on Railway**
   - Visit [railway.app](https://railway.app)
   - Click "Deploy from GitHub repo"
   - Select your repository
   - Choose the `backend` folder
   - Add environment variables
   - Deploy

3. **Deploy Frontend on Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import from GitHub
   - Select your repository
   - Set root directory to `frontend`
   - Add `REACT_APP_API_URL` environment variable
   - Deploy

4. **Setup MongoDB Atlas**
   - Create account at [mongodb.com](https://www.mongodb.com)
   - Create free cluster
   - Get connection string
   - Update Railway environment variables

## 📱 Domain Setup

1. **Custom Domains**
   - Frontend: `your-restaurant-app.com`
   - Backend API: `api.your-restaurant-app.com`

2. **DNS Configuration**
   - Point domain to Vercel/Railway
   - Configure CNAME records
   - Enable SSL

## 🔍 Post-Deployment Testing

1. **Frontend Tests**
   - Test authentication flow
   - Test restaurant search
   - Test voice bot functionality
   - Test reservation system

2. **Backend Tests**
   - Test all API endpoints
   - Check database connections
   - Verify email notifications
   - Test AI integration

3. **End-to-End Tests**
   - Complete user journey
   - Mobile responsiveness
   - Performance optimization

## 📊 Monitoring and Analytics

1. **Add Monitoring**
   - Use Vercel Analytics
   - Railway monitoring
   - MongoDB monitoring

2. **Error Tracking**
   - Sentry for error reporting
   - Log aggregation
   - Performance monitoring

Choose the deployment option that best fits your needs! The Vercel + Railway option is recommended for beginners due to its simplicity and free tiers.