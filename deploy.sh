#!/bin/bash

# Agentic AI Restaurant Reservation System - Deployment Script
# This script helps automate the deployment process

echo "🚀 Starting deployment process for Agentic AI Restaurant System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required commands are available
check_requirements() {
    print_status "Checking requirements..."
    
    commands=("git" "node" "npm" "python" "pip")
    
    for cmd in "${commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            print_error "$cmd is not installed. Please install it first."
            exit 1
        fi
    done
    
    print_success "All requirements are available!"
}

# Function to build frontend
build_frontend() {
    print_status "Building frontend..."
    
    cd frontend
    
    if [ ! -f ".env.production" ]; then
        print_warning ".env.production not found. Creating from example..."
        cp .env.example .env.production
        print_warning "Please update .env.production with your backend URL"
    fi
    
    npm install
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Frontend build completed successfully!"
    else
        print_error "Frontend build failed!"
        exit 1
    fi
    
    cd ..
}

# Function to prepare backend
prepare_backend() {
    print_status "Preparing backend..."
    
    cd backend
    
    if [ ! -f ".env" ]; then
        print_warning ".env not found. Creating from example..."
        cp .env.example .env
        print_warning "Please update .env with your configuration"
    fi
    
    pip install -r requirements.txt
    
    if [ $? -eq 0 ]; then
        print_success "Backend dependencies installed successfully!"
    else
        print_error "Backend dependency installation failed!"
        exit 1
    fi
    
    cd ..
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Frontend tests
    cd frontend
    npm test -- --coverage --watchAll=false
    cd ..
    
    # Backend tests
    cd backend
    python -m pytest
    cd ..
    
    print_success "Tests completed!"
}

# Function to deploy with Docker
deploy_docker() {
    print_status "Deploying with Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Build and run with docker-compose
    docker-compose down
    docker-compose build
    docker-compose up -d
    
    print_success "Docker deployment completed!"
    print_status "Your application is running at:"
    echo "  - Frontend: http://localhost"
    echo "  - Backend API: http://localhost:8000"
    echo "  - MongoDB: mongodb://localhost:27017"
}

# Function to show deployment options
show_deployment_options() {
    echo ""
    echo "🚀 Deployment Options:"
    echo "1. Vercel + Railway (Recommended for beginners)"
    echo "2. Docker + VPS"
    echo "3. AWS/GCP/Azure"
    echo "4. Heroku"
    echo ""
    
    read -p "Choose deployment option (1-4): " choice
    
    case $choice in
        1)
            deploy_vercel_railway
            ;;
        2)
            deploy_docker
            ;;
        3)
            deploy_cloud
            ;;
        4)
            deploy_heroku
            ;;
        *)
            print_error "Invalid option selected"
            exit 1
            ;;
    esac
}

# Function for Vercel + Railway deployment
deploy_vercel_railway() {
    print_status "Setting up Vercel + Railway deployment..."
    
    echo ""
    echo "📋 Manual steps for Vercel + Railway deployment:"
    echo ""
    echo "🔵 Backend (Railway):"
    echo "1. Go to https://railway.app"
    echo "2. Connect your GitHub repository"
    echo "3. Select the 'backend' folder as root"
    echo "4. Add environment variables from backend/.env.example"
    echo "5. Deploy"
    echo ""
    echo "🔵 Frontend (Vercel):"
    echo "1. Go to https://vercel.com"
    echo "2. Import from GitHub"
    echo "3. Select the 'frontend' folder as root"
    echo "4. Add REACT_APP_API_URL environment variable"
    echo "5. Deploy"
    echo ""
    echo "🔵 Database (MongoDB Atlas):"
    echo "1. Go to https://mongodb.com/cloud/atlas"
    echo "2. Create free cluster"
    echo "3. Get connection string"
    echo "4. Update Railway environment variables"
    echo ""
}

# Function for cloud deployment
deploy_cloud() {
    print_status "Cloud deployment setup..."
    
    echo ""
    echo "📋 Cloud Deployment Options:"
    echo ""
    echo "🔵 AWS:"
    echo "- Frontend: S3 + CloudFront"
    echo "- Backend: Elastic Beanstalk or ECS"
    echo "- Database: DocumentDB or MongoDB Atlas"
    echo ""
    echo "🔵 Google Cloud:"
    echo "- Frontend: Firebase Hosting or Cloud Storage"
    echo "- Backend: Cloud Run or App Engine"
    echo "- Database: Firestore or MongoDB Atlas"
    echo ""
    echo "🔵 Azure:"
    echo "- Frontend: Static Web Apps"
    echo "- Backend: App Service or Container Instances"
    echo "- Database: Cosmos DB or MongoDB Atlas"
    echo ""
    echo "Please refer to DEPLOYMENT_GUIDE.md for detailed instructions."
}

# Function for Heroku deployment
deploy_heroku() {
    print_status "Setting up Heroku deployment..."
    
    if ! command -v heroku &> /dev/null; then
        print_error "Heroku CLI is not installed. Please install it first."
        echo "Visit: https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    echo ""
    echo "📋 Heroku Deployment Steps:"
    echo "1. Create two Heroku apps (frontend and backend)"
    echo "2. Add MongoDB addon or use MongoDB Atlas"
    echo "3. Configure environment variables"
    echo "4. Deploy using git subtree"
    echo ""
    echo "Commands:"
    echo "heroku create your-app-backend"
    echo "heroku create your-app-frontend"
    echo "git subtree push --prefix backend heroku-backend master"
    echo "git subtree push --prefix frontend heroku-frontend master"
}

# Function to commit and push changes
commit_and_push() {
    print_status "Committing deployment configuration..."
    
    git add .
    git commit -m "Add deployment configuration files

- Added Docker files for containerization
- Added deployment guide and scripts
- Added environment file examples
- Added nginx configuration
- Ready for production deployment"
    
    git push origin main
    
    print_success "Changes committed and pushed to repository!"
}

# Main deployment flow
main() {
    echo "🏪 Agentic AI Restaurant Reservation System"
    echo "==========================================="
    
    check_requirements
    build_frontend
    prepare_backend
    
    read -p "Do you want to run tests? (y/n): " run_test_choice
    if [[ $run_test_choice =~ ^[Yy]$ ]]; then
        run_tests
    fi
    
    read -p "Do you want to commit deployment files? (y/n): " commit_choice
    if [[ $commit_choice =~ ^[Yy]$ ]]; then
        commit_and_push
    fi
    
    show_deployment_options
    
    echo ""
    print_success "Deployment setup completed!"
    echo ""
    echo "📚 Next steps:"
    echo "1. Review and update environment variables"
    echo "2. Choose your preferred deployment platform"
    echo "3. Follow the specific deployment instructions"
    echo "4. Test your deployed application"
    echo ""
    echo "📖 For detailed instructions, see DEPLOYMENT_GUIDE.md"
}

# Run main function
main