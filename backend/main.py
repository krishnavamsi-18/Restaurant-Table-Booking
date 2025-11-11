"""
Simple FastAPI Restaurant System with MongoDB
"""
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta
import logging
import re
import os
from difflib import SequenceMatcher
from restaurant_hours_utils import get_restaurant_status_summary, is_restaurant_open, format_operating_hours
from reservation_utils import validate_reservation_time, generate_available_time_slots
from dotenv import load_dotenv
from jwt_auth import JWTManager, get_current_user_from_token, get_current_user_optional
from gemini_service import gemini_service
from email_service import get_email_service

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "restaurant_reservation_db")

# Create FastAPI app
app = FastAPI(
    title="Restaurant Reservation System",
    description="A restaurant reservation system with MongoDB backend",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global MongoDB client
mongo_client = None
database = None

def get_database():
    """Get MongoDB database instance"""
    global mongo_client, database
    if mongo_client is None:
        mongo_client = MongoClient(MONGODB_URL)
        database = mongo_client[DATABASE_NAME]
    return database

def convert_objectid(doc):
    """Convert ObjectId to string for JSON serialization and add id field"""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
        doc["id"] = doc["_id"]  # Add id field for frontend compatibility
    return doc

@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    try:
        db = get_database()
        # Test connection
        mongo_client.admin.command('ping')
        logger.info("MongoDB connection established")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    if mongo_client:
        mongo_client.close()
        logger.info("MongoDB connection closed")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Restaurant Reservation System API with MongoDB",
        "version": "2.0.0",
        "database": "MongoDB"
    }

def find_specific_restaurant(command_text, restaurant_list):
    """
    Find a specific restaurant from the command using enhanced matching techniques.
    Returns the matched restaurant or None if no good match is found.
    """
    def _normalize(text: str) -> str:
        import re as _re
        text = text.lower()
        text = _re.sub(r"[^\w\s]", " ", text)
        text = _re.sub(r"\s+", " ", text).strip()
        return text
    
    # Extract potential restaurant names from command
    # Common restaurant-related keywords to ignore
    stop_words = {'restaurant', 'hotel', 'the', 'at', 'in', 'for', 'a', 'an', 'book', 'table', 'reservation'}
    
    # Clean the command text
    cleaned_command = _normalize(command_text)
    words = [word for word in cleaned_command.split() if word not in stop_words and len(word) > 1]
    
    # Pattern-based extraction (e.g., "at [name]", "book [name]")
    import re
    potential_names = []
    for pattern in [r"at\s+([\w\s]{3,})", r"book\s+([\w\s]{3,})", r"reserve\s+([\w\s]{3,})"]:
        m = re.search(pattern, cleaned_command)
        if m:
            potential_names.append(m.group(1).strip())
    # Add sliding windows of up to 4 words
    for i in range(len(words)):
        for j in range(i + 1, min(i + 4, len(words) + 1)):
            potential_names.append(' '.join(words[i:j]))
    
    best_match = None
    best_score = 0.0
    threshold = 0.65  # Lower threshold for tolerance
    
    for restaurant in restaurant_list:
        restaurant_name_raw = restaurant.get('name', '')
        restaurant_name = _normalize(restaurant_name_raw)
        rest_tokens = restaurant_name.split()
        
        # Method 0: Direct pattern candidates (token-aware)
        for candidate in potential_names:
            cand_norm = _normalize(candidate)
            if not cand_norm:
                continue
            cand_tokens = cand_norm.split()
            if len(cand_tokens) == 1:
                # Single token must match whole token, not substring inside another token
                if cand_tokens[0] in rest_tokens:
                    score = 0.75
                    if score > best_score:
                        best_match = restaurant
                        best_score = score
            else:
                # Multi-token candidate should have all tokens present as whole tokens
                if set(cand_tokens).issubset(set(rest_tokens)):
                    score = 0.85
                    if score > best_score:
                        best_match = restaurant
                        best_score = score
        
        # Method 1: Exact token match using word boundaries (avoid substring like 'sai' in 'nagasai')
        for word in words:
            if re.search(rf"\\b{re.escape(word)}\\b", restaurant_name):
                score = 0.75
                if score > best_score:
                    best_match = restaurant
                    best_score = score
        
        # Method 2: Word-by-word fuzzy matching (ignore short-token fuzzy matches)
        restaurant_words = rest_tokens
        for cmd_word in words:
            for rest_word in restaurant_words:
                if len(cmd_word) <= 3:
                    similarity = 0.8 if cmd_word == rest_word else 0.0
                else:
                    from difflib import SequenceMatcher
                    similarity = SequenceMatcher(None, cmd_word, rest_word).ratio()
                if similarity > threshold and similarity > best_score:
                    best_match = restaurant
                    best_score = similarity
        
        # Method 3: Full name similarity
        from difflib import SequenceMatcher
        full_similarity = SequenceMatcher(None, cleaned_command, restaurant_name).ratio()
        if full_similarity > threshold and full_similarity > best_score:
            best_match = restaurant
            best_score = full_similarity
    
    # Only return match if confidence is high enough
    if best_score > threshold:
        logging.info(f"Found restaurant match: {restaurant.get('name')} with confidence {best_score:.2f}")
        return best_match
    
    logging.info(f"No suitable restaurant match found for: {command_text}")
    return None

# Voicebot endpoints with Gemini AI
@app.post("/voicebot/process")
async def process_voice_command(
    command_data: dict, 
    current_user: dict = Depends(get_current_user_optional)
):
    """Process voice command using Gemini AI"""
    try:
        command = command_data.get("command", "").strip()
        user_context = command_data.get("context", {})
        
        if not command:
            raise HTTPException(status_code=400, detail="Command is required")
        
        # Get available restaurants
        db = get_database()
        restaurants_collection = db["restaurants"]
        restaurants = list(restaurants_collection.find(
            {"is_active": True}, 
            {"name": 1, "city": 1, "state": 1, "cuisine": 1, "operating_hours": 1}
        ).sort("name", 1))  # Sort by name for consistent ordering
        
        # Convert ObjectIds to strings
        restaurant_list = []
        for restaurant in restaurants:
            restaurant_list.append({
                "id": str(restaurant["_id"]),
                "name": restaurant.get("name", "Unknown"),
                "city": restaurant.get("city", "Unknown"),
                "state": restaurant.get("state", "Unknown"),
                "cuisine": restaurant.get("cuisine", "Unknown"),
                "operating_hours": restaurant.get("operating_hours", {})
            })
        
        # Check if user mentioned a specific restaurant name
        command_lower = command.lower()
        specific_restaurant = None
        mentioned_restaurant_name = None
        
        # First, check if command contains restaurant booking patterns
        restaurant_keywords = ['at ', 'restaurant', 'hotel', 'cafe', 'bistro', 'bar', 'grill']
        contains_restaurant_reference = any(keyword in command_lower for keyword in restaurant_keywords)
        
        if contains_restaurant_reference:
            # Extract potential restaurant name from patterns like "at [restaurant name]"
            words = command_lower.split()
            for i, word in enumerate(words):
                if word == 'at' and i + 1 < len(words):
                    # Get the next words until we hit common stop words
                    stop_words = ['for', 'on', 'at', 'with', 'around', 'tomorrow', 'today', 'tonight']
                    restaurant_words = []
                    for j in range(i+1, min(len(words), i+4)):  # Check up to 3 words after 'at'
                        if words[j] in stop_words:
                            break
                        restaurant_words.append(words[j])
                    if restaurant_words:
                        mentioned_restaurant_name = ' '.join(restaurant_words)
                    break
            
            # If no "at" pattern, look for restaurant/hotel keywords
            if not mentioned_restaurant_name:
                for keyword in ['restaurant', 'hotel']:
                    if keyword in command_lower:
                        # Find words around the keyword
                        words = command_lower.split()
                        for i, word in enumerate(words):
                            if keyword in word:
                                # Get surrounding words
                                start = max(0, i-2)
                                end = min(len(words), i+3)
                                potential_name = ' '.join(words[start:end])
                                mentioned_restaurant_name = potential_name
                                break
                        break
        
        # Enhanced restaurant matching with full database access
        specific_restaurant = find_specific_restaurant(command_lower, restaurant_list)
        
        # If user mentioned a specific restaurant name but we couldn't find it
        if mentioned_restaurant_name and not specific_restaurant:
            logger.warning(f"User mentioned restaurant '{mentioned_restaurant_name}' but it was not found in database")
            return {
                "intent": "reservation",
                "confidence": 0.8,
                "restaurant_match": {
                    "found": False,
                    "name": mentioned_restaurant_name,
                    "confidence": 0.0,
                    "alternatives": []
                },
                "response_message": f"I couldn't find a restaurant named '{mentioned_restaurant_name}'. Please check the name and try again, or ask me to show available restaurants.",
                "action_required": "ask_clarification"
            }
        
        # If user mentioned a specific restaurant, only send that restaurant to AI
        if specific_restaurant:
            restaurant_list = [specific_restaurant]
            logger.info(f"Processing command for specific restaurant: {specific_restaurant['name']}")
        else:
            # If no specific restaurant mentioned, prioritize restaurants that match keywords
            command_words = command.lower().split()
            priority_restaurants = []
            other_restaurants = []
            
            for restaurant in restaurant_list:
                restaurant_name_lower = restaurant["name"].lower()
                # Check if any word from command appears in restaurant name
                if any(word in restaurant_name_lower for word in command_words if len(word) > 2):
                    priority_restaurants.append(restaurant)
                else:
                    other_restaurants.append(restaurant)
            
            # Combine lists with priority restaurants first
            restaurant_list = priority_restaurants + other_restaurants
        
        # Add user context if available
        if current_user:
            user_context.update({
                "user_email": current_user.get("email"),
                "user_id": current_user.get("user_id")
            })
        
        # Debug: Log the restaurants being sent to AI
        logger.info(f"Sending {len(restaurant_list)} restaurants to AI")
        pizza_restaurants = [r for r in restaurant_list if 'pizza' in r['name'].lower()]
        if pizza_restaurants:
            logger.info(f"Pizza restaurants found: {[r['name'] for r in pizza_restaurants]}")
        else:
            logger.info("No pizza restaurants found in the list")
        
        # Process command with Gemini AI
        result = await gemini_service.process_voice_command(
            command, restaurant_list, user_context
        )
        
        logger.info(f"Processed voice command: '{command}' -> {result.get('intent')}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing voice command: {e}")
        raise HTTPException(status_code=500, detail="Failed to process voice command")

@app.post("/voicebot/chat")
async def voicebot_chat(chat_data: dict):
    """General chat endpoint for voicebot conversations"""
    try:
        message = chat_data.get("message", "").strip()
        context = chat_data.get("context", {})
        
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        # Generate conversational response
        response = await gemini_service.generate_conversation_response(message, context)
        
        return {
            "response": response,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in voicebot chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to process chat message")

@app.post("/voicebot/book-reservation")
async def book_reservation_via_voice(
    booking_data: dict,
    current_user: dict = Depends(get_current_user_from_token)
):
    """Book a reservation based on voice command processing results"""
    try:
        restaurant_id = booking_data.get("restaurant_id")
        date = booking_data.get("date")
        time = booking_data.get("time")
        guests = booking_data.get("guests", 2)
        special_requests = booking_data.get("special_requests", "")
        
        if not all([restaurant_id, date, time]):
            raise HTTPException(status_code=400, detail="Restaurant ID, date, and time are required")
        
        # Validate restaurant exists
        db = get_database()
        restaurants_collection = db["restaurants"]
        restaurant = restaurants_collection.find_one({"_id": ObjectId(restaurant_id)})
        
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        # Validate reservation time against restaurant operating hours
        logger.info(f"Validating reservation for {restaurant.get('name')}: date={date}, time={time}")
        is_valid, error_message = validate_reservation_time(restaurant, date, time)
        logger.info(f"Validation result: valid={is_valid}, message='{error_message}'")
        if not is_valid:
            logger.warning(f"Reservation validation failed: {error_message}")
            raise HTTPException(status_code=400, detail=error_message)
        
        # Create reservation
        reservations_collection = db["reservations"]
        reservation_data = {
            "restaurant_id": restaurant_id,
            "restaurant_name": restaurant.get("name", "Unknown"),
            "date": date,
            "time": time,
            "guests": guests,
            "special_requests": special_requests,
            "user_email": current_user["email"],
            "user_id": current_user["user_id"],
            "status": "confirmed",
            "created_at": datetime.utcnow(),
            "booking_method": "voice_command"
        }
        
        result = reservations_collection.insert_one(reservation_data)
        
        # Get created reservation
        created_reservation = reservations_collection.find_one({"_id": result.inserted_id})
        created_reservation = convert_objectid(created_reservation)
        created_reservation["id"] = created_reservation["_id"]
        
        logger.info(f"Voice booking created: {created_reservation['id']}")
        
        # Send reservation confirmation email for voice booking (non-blocking)
        try:
            email_service = get_email_service()
            
            # Prepare reservation details for email
            reservation_details = {
                'restaurant_name': restaurant.get('name', 'Restaurant'),
                'date': date,
                'time': time,
                'party_size': guests,
                'reservation_id': created_reservation['id']
            }
            
            # Get user details
            user_email = current_user.get('email')
            
            if user_email:
                # Get user name from database using the user's email
                users_collection = db["users"]
                user_doc = users_collection.find_one({"email": user_email})
                user_name = user_doc.get('full_name', 'Customer') if user_doc else 'Customer'
                
                email_sent = email_service.send_reservation_confirmation(
                    user_email, user_name, reservation_details
                )
                
                if email_sent:
                    logger.info(f"Voice booking confirmation email sent to {user_email}")
                else:
                    logger.warning(f"Failed to send voice booking confirmation email to {user_email}")
            else:
                logger.warning("No email address found for voice booking confirmation")
                
        except Exception as e:
            logger.error(f"Error sending voice booking confirmation email: {str(e)}")
            # Don't fail reservation if email fails
        
        return {
            "success": True,
            "reservation": created_reservation,
            "message": f"Successfully booked table at {restaurant.get('name')} for {guests} people on {date} at {time}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error booking reservation via voice: {e}")
        raise HTTPException(status_code=500, detail="Failed to book reservation")

@app.get("/voicebot/status")
async def get_voicebot_status():
    """Get voicebot service status"""
    return {
        "gemini_enabled": gemini_service.is_enabled(),
        "voice_recognition": "browser_dependent",
        "features": {
            "intelligent_processing": gemini_service.is_enabled(),
            "restaurant_matching": True,
            "reservation_booking": True,
            "conversation": gemini_service.is_enabled()
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/debug/users")
async def debug_users():
    """Debug endpoint to check users in database"""
    try:
        db = get_database()
        users_collection = db["users"]
        
        # Get all users (just email and creation date for privacy)
        users = list(users_collection.find({}, {"email": 1, "created_at": 1, "_id": 0}))
        
        return {
            "total_users": len(users),
            "users": users
        }
    except Exception as e:
        logger.error(f"Debug users error: {e}")
        return {"error": str(e)}
mongo_client = None
database = None

def get_database():
    """Get MongoDB database instance"""
    global mongo_client, database
    if mongo_client is None:
        mongo_client = MongoClient(MONGODB_URL)
        database = mongo_client[DATABASE_NAME]
    return database

def convert_objectid(doc):
    """Convert ObjectId to string for JSON serialization and add id field"""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
        doc["id"] = doc["_id"]  # Add id field for frontend compatibility
    return doc

@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    try:
        db = get_database()
        # Test connection
        mongo_client.admin.command('ping')
        logger.info("MongoDB connection established")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    if mongo_client:
        mongo_client.close()
        logger.info("MongoDB connection closed")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Restaurant Reservation System API with MongoDB",
        "version": "2.0.0",
        "database": "MongoDB"
    }

@app.get("/restaurants")
async def get_restaurants(
    city: Optional[str] = Query(None, description="Filter by city"),
    state: Optional[str] = Query(None, description="Filter by state"),
    cuisine: Optional[str] = Query(None, description="Filter by cuisine"),
    search: Optional[str] = Query(None, description="Search in restaurant names"),
    limit: int = Query(50, description="Number of restaurants to return"),
    offset: int = Query(0, description="Number of restaurants to skip")
):
    """Get restaurants with optional filtering and pagination"""
    try:
        db = get_database()
        collection = db["restaurants"]
        
        # Build filter query
        filter_query = {"is_active": True}
        
        if city:
            filter_query["city"] = {"$regex": city, "$options": "i"}
        if state:
            filter_query["state"] = {"$regex": state, "$options": "i"}
        if cuisine:
            filter_query["cuisine"] = {"$regex": cuisine, "$options": "i"}
        if search:
            filter_query["name"] = {"$regex": search, "$options": "i"}
        
        # Get restaurants with pagination
        cursor = collection.find(filter_query).skip(offset).limit(limit)
        restaurants = []
        
        for restaurant in cursor:
            restaurant = convert_objectid(restaurant)
            # Add operating hours status information
            restaurant_with_status = get_restaurant_status_summary(restaurant)
            restaurants.append(restaurant_with_status)
        
        logger.info(f"Retrieved {len(restaurants)} restaurants")
        return restaurants
        
    except Exception as e:
        logger.error(f"Error fetching restaurants: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch restaurants")

@app.get("/restaurants/{restaurant_id}")
async def get_restaurant_by_id(restaurant_id: str):
    """Get a specific restaurant by ID"""
    try:
        if not ObjectId.is_valid(restaurant_id):
            raise HTTPException(status_code=400, detail="Invalid restaurant ID")
        
        db = get_database()
        collection = db["restaurants"]
        
        restaurant = collection.find_one({"_id": ObjectId(restaurant_id), "is_active": True})
        
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        restaurant = convert_objectid(restaurant)
        # Add operating hours status information
        restaurant_with_status = get_restaurant_status_summary(restaurant)
        logger.info(f"Retrieved restaurant: {restaurant_id}")
        return restaurant_with_status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching restaurant {restaurant_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch restaurant")

@app.get("/restaurants/search/nearby")
async def search_nearby_restaurants(
    latitude: float = Query(..., description="User's latitude"),
    longitude: float = Query(..., description="User's longitude"),
    radius: float = Query(10.0, description="Search radius in kilometers"),
    limit: int = Query(20, description="Number of restaurants to return")
):
    """Search for restaurants within a specific radius"""
    try:
        db = get_database()
        collection = db["restaurants"]
        
        # Find restaurants within radius using basic distance calculation
        restaurants = []
        cursor = collection.find({"is_active": True})  # Get ALL restaurants to check distance
        
        for restaurant in cursor:
            if "latitude" in restaurant and "longitude" in restaurant:
                rest_lat = float(restaurant["latitude"])
                rest_lng = float(restaurant["longitude"])
                
                # Calculate distance using haversine formula (simplified)
                distance = calculate_distance(latitude, longitude, rest_lat, rest_lng)
                
                if distance <= radius:
                    restaurant = convert_objectid(restaurant)
                    restaurant["distance"] = round(distance, 2)
                    restaurants.append(restaurant)
        
        # Sort by distance and limit results
        restaurants.sort(key=lambda x: x.get("distance", 999))
        restaurants = restaurants[:limit]
        
        logger.info(f"Found {len(restaurants)} restaurants within {radius}km")
        return restaurants
        
    except Exception as e:
        logger.error(f"Error searching nearby restaurants: {e}")
        raise HTTPException(status_code=500, detail="Failed to search nearby restaurants")

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using haversine formula"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    distance = R * c
    
    return distance

@app.get("/cuisines")
async def get_cuisines():
    """Get list of unique cuisines"""
    try:
        db = get_database()
        collection = db["restaurants"]
        
        # Get unique cuisines
        cuisines = collection.distinct("cuisine", {"is_active": True})
        cuisines = [cuisine for cuisine in cuisines if cuisine]  # Filter out empty values
        cuisines.sort()
        
        logger.info(f"Found {len(cuisines)} cuisine types")
        return cuisines
        
    except Exception as e:
        logger.error(f"Error fetching cuisines: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch cuisines")

@app.get("/locations/states")
async def get_states():
    """Get list of unique states from restaurants"""
    try:
        db = get_database()
        collection = db["restaurants"]
        
        # Get unique states
        states = collection.distinct("state", {"is_active": True})
        states = [state for state in states if state]  # Filter out empty values
        states.sort()
        
        logger.info(f"Found {len(states)} unique states")
        return states
        
    except Exception as e:
        logger.error(f"Error fetching states: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch states")

@app.get("/locations/cities")
async def get_cities(state: Optional[str] = Query(None, description="Filter by state")):
    """Get list of unique cities, optionally filtered by state"""
    try:
        db = get_database()
        collection = db["restaurants"]
        
        # Build filter
        filter_query = {"is_active": True}
        if state:
            filter_query["state"] = state
        
        # Get unique cities
        cities = collection.distinct("city", filter_query)
        cities = [city for city in cities if city]  # Filter out empty values
        cities.sort()
        
        if state:
            logger.info(f"Found {len(cities)} cities in {state}")
        else:
            logger.info(f"Found {len(cities)} total cities")
        return cities
        
    except Exception as e:
        if state:
            logger.error(f"Error fetching cities for state {state}: {e}")
        else:
            logger.error(f"Error fetching cities: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch cities")

@app.get("/restaurants/debug/all-names")
async def get_all_restaurant_names():
    """Debug endpoint: Get ALL restaurant names without any filtering"""
    try:
        db = get_database()
        collection = db["restaurants"]
        
        # Get ALL restaurants names for voice bot debugging
        restaurants = list(collection.find(
            {"is_active": True}, 
            {"name": 1, "city": 1, "state": 1}
        ))
        
        restaurant_list = []
        for restaurant in restaurants:
            restaurant_list.append({
                "id": str(restaurant["_id"]),
                "name": restaurant.get("name", "Unknown"),
                "city": restaurant.get("city", "Unknown"),
                "state": restaurant.get("state", "Unknown")
            })
        
        logger.info(f"Debug: Retrieved ALL {len(restaurant_list)} restaurant names")
        return {
            "total_count": len(restaurant_list),
            "restaurants": restaurant_list
        }
        
    except Exception as e:
        logger.error(f"Error fetching all restaurant names: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch restaurant names")

@app.get("/stats")
async def get_stats():
    """Get basic statistics about the database"""
    try:
        db = get_database()
        restaurants_collection = db["restaurants"]
        reservations_collection = db["reservations"]
        
        stats = {
            "total_restaurants": restaurants_collection.count_documents({"is_active": True}),
            "total_reservations": reservations_collection.count_documents({}),
            "cities_count": len(restaurants_collection.distinct("city", {"is_active": True})),
            "cuisines_count": len(restaurants_collection.distinct("cuisine", {"is_active": True})),
            "states_count": len(restaurants_collection.distinct("state", {"is_active": True}))
        }
        
        return stats
        
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch statistics")

# Auth endpoints
@app.post("/auth/login")
async def login(credentials: dict):
    """Login endpoint with MongoDB validation"""
    try:
        email = credentials.get("email")
        password = credentials.get("password")
        
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password required")
        
        # Get database connection
        db = get_database()
        users_collection = db["users"]
        
        # Find user by email
        user = users_collection.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password using JWT manager
        stored_password = user.get("password")
        if stored_password is None:
            logger.error(f"User {email} has no password set")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        if stored_password.startswith("$"):  # Hashed password
            if not JWTManager.verify_password(password, stored_password):
                logger.error(f"Password mismatch for user {email}")
                raise HTTPException(status_code=401, detail="Invalid email or password")
        else:  # Plain text password (legacy)
            if stored_password != password:
                logger.error(f"Password mismatch for user {email}")
                raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user_id = str(user["_id"])
        
        # Create JWT token
        access_token_expires = timedelta(minutes=30 * 24 * 60)  # 30 days
        access_token = JWTManager.create_access_token(
            data={"sub": email, "user_id": user_id},
            expires_delta=access_token_expires
        )
        
        logger.info(f"User logged in with JWT: {email} (ID: {user_id})")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "email": user.get("email"),
                "full_name": user.get("full_name"),
                "phone": user.get("phone", "")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.post("/auth/register")
async def register(credentials: dict):
    """Register new user and store in MongoDB"""
    try:
        email = credentials.get("email")
        password = credentials.get("password")
        full_name = credentials.get("full_name")
        phone = credentials.get("phone", "")
        
        logger.info(f"Registration attempt for email: {email}")
        
        if not email or not password or not full_name:
            logger.error(f"Missing required fields: email={bool(email)}, password={bool(password)}, full_name={bool(full_name)}")
            raise HTTPException(status_code=400, detail="Email, password, and full name required")
        
        # Basic phone number validation (if provided)
        if phone and phone.strip():
            # Remove spaces and common separators for validation
            clean_phone = ''.join(filter(str.isdigit, phone.strip()))

            if len(clean_phone) < 10:
                raise HTTPException(status_code=400, detail="Phone number must be at least 10 digits")
        
        # Get database connection
        db = get_database()
        users_collection = db["users"]
        
        # Check if user already exists (email)
        existing_user = users_collection.find_one({"email": email})
        if existing_user:
            logger.warning(f"User registration failed - email already exists: {email}")
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        # Check if phone number already exists (if provided)
        if phone and phone.strip():
            # Normalize phone number for comparison (digits only)
            clean_phone = ''.join(filter(str.isdigit, phone.strip()))
            if clean_phone:
                # Check all users with phones for normalized match
                all_users_with_phones = users_collection.find({"phone": {"$exists": True, "$ne": "", "$ne": None}})
                for user in all_users_with_phones:
                    existing_phone = user.get("phone", "")
                    existing_clean = ''.join(filter(str.isdigit, existing_phone))
                    
                    if existing_clean == clean_phone:
                        logger.warning(f"User registration failed - phone number already exists: {phone}")
                        raise HTTPException(status_code=400, detail="User with this phone number already exists")
        
        # Hash password before storing
        hashed_password = JWTManager.get_password_hash(password)
        
        # Create new user document
        user_doc = {
            "email": email,
            "password": hashed_password,
            "full_name": full_name,
            "phone": phone.strip() if phone else "",
            "created_at": datetime.now(),
            "is_active": True
        }
        
        # Insert user into database
        result = users_collection.insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        # Create JWT token for new user
        access_token_expires = timedelta(minutes=30 * 24 * 60)  # 30 days
        access_token = JWTManager.create_access_token(
            data={"sub": email, "user_id": user_id},
            expires_delta=access_token_expires
        )
        
        logger.info(f"New user registered with JWT: {email} (ID: {user_id})")
        
        # Send welcome email (non-blocking)
        try:
            email_service = get_email_service()
            email_sent = email_service.send_welcome_email(email, full_name)
            if email_sent:
                logger.info(f"Welcome email sent to {email}")
            else:
                logger.warning(f"Failed to send welcome email to {email}")
        except Exception as e:
            logger.error(f"Error sending welcome email to {email}: {str(e)}")
            # Don't fail registration if email fails
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "email": email,
                "full_name": full_name,
                "phone": phone
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")

@app.get("/auth/me")
async def get_current_user(current_user: dict = Depends(get_current_user_from_token)):
    """Get current user info from JWT token"""
    try:
        # Get user info from database using JWT payload
        db = get_database()
        users_collection = db["users"]
        
        user = users_collection.find_one({"email": current_user["email"]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "id": str(user["_id"]),
            "email": user.get("email"),
            "full_name": user.get("full_name"),
            "phone": user.get("phone", "")
        }
        
    except Exception as e:
        logger.error(f"Get user error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user info")

@app.post("/auth/change-password")
async def change_password(password_data: dict, current_user: dict = Depends(get_current_user_from_token)):
    """Change user password using JWT authentication"""
    try:
        current_password = password_data.get("current_password")
        new_password = password_data.get("new_password")
        email = current_user["email"]  # Get email from JWT token
        
        if not current_password or not new_password:
            raise HTTPException(status_code=400, detail="Current password and new password required")
        
        if len(new_password) < 6:
            raise HTTPException(status_code=400, detail="New password must be at least 6 characters long")
        
        # Get database connection
        db = get_database()
        users_collection = db["users"]
        
        # Find user by email
        user = users_collection.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify current password (works with both hashed and plain text)
        stored_password = user.get("password")
        if stored_password.startswith("$"):  # Hashed password
            if not JWTManager.verify_password(current_password, stored_password):
                raise HTTPException(status_code=400, detail="Current password is incorrect")
        else:  # Plain text password (legacy)
            if stored_password != current_password:
                raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Hash new password
        hashed_new_password = JWTManager.get_password_hash(new_password)
        
        # Update password
        result = users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "password": hashed_new_password,
                    "updated_at": datetime.now()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Failed to update password")
        
        logger.info(f"Password changed for user: {email}")
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Change password error: {e}")
        raise HTTPException(status_code=500, detail="Failed to change password")

@app.put("/auth/profile")
async def update_profile(profile_data: dict, current_user: dict = Depends(get_current_user_from_token)):
    """Update user profile information using JWT authentication"""
    try:
        email = current_user["email"]  # Get email from JWT token
        full_name = profile_data.get("full_name")
        phone = profile_data.get("phone", "")
        
        if not full_name:
            raise HTTPException(status_code=400, detail="Full name required")
        
        # Get database connection
        db = get_database()
        users_collection = db["users"]
        
        # Find user by email
        user = users_collection.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update profile
        result = users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "full_name": full_name.strip(),
                    "phone": phone.strip(),
                    "updated_at": datetime.now()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes made to profile")
        
        # Get updated user
        updated_user = users_collection.find_one({"email": email})
        
        logger.info(f"Profile updated for user: {email}")
        return {
            "message": "Profile updated successfully",
            "user": {
                "id": str(updated_user["_id"]),
                "email": updated_user.get("email"),
                "full_name": updated_user.get("full_name"),
                "phone": updated_user.get("phone", "")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update profile error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

# Reservation endpoints
@app.post("/reservations")
async def create_reservation(reservation_data: dict, current_user: dict = Depends(get_current_user_from_token)):
    """Create a new reservation with JWT authentication"""
    try:
        db = get_database()
        reservations_collection = db["reservations"]
        
        # Add timestamp and default values
        reservation_data["created_at"] = datetime.utcnow()
        reservation_data["status"] = "confirmed"
        
        # Convert restaurant_id to string if needed for MongoDB
        if "restaurant_id" in reservation_data:
            reservation_data["restaurant_id"] = str(reservation_data["restaurant_id"])
        
        # Use email from JWT token for proper user association
        user_email = current_user["email"]
        user_id = current_user["user_id"]
        # Add user information to reservation
        reservation_data["user_email"] = user_email
        reservation_data["user_id"] = user_id
        # Require restaurant_id for reservation
        if not reservation_data.get("restaurant_id"):
            logger.error("Reservation creation failed: Missing restaurant_id")
            raise HTTPException(status_code=400, detail="Restaurant ID is required for reservation")
        # Ensure we have the required fields with fallbacks

        if "date" not in reservation_data and "reservation_date" in reservation_data:
            reservation_data["date"] = reservation_data["reservation_date"]
        if "time" not in reservation_data and "reservation_time" in reservation_data:
            reservation_data["time"] = reservation_data["reservation_time"]
        if "guests" not in reservation_data and "party_size" in reservation_data:
            reservation_data["guests"] = reservation_data["party_size"]

        # Require date and time for validation
        if not reservation_data.get("date") or not reservation_data.get("time"):
            logger.error("Reservation creation failed: Missing reservation date or time")
            raise HTTPException(status_code=400, detail="Reservation date and time are required")

        # Get restaurant and validate operating hours
        if "restaurant_id" in reservation_data:
            restaurants_collection = db["restaurants"]
            try:
                # Convert restaurant_id to ObjectId
                restaurant_obj_id = ObjectId(reservation_data["restaurant_id"])
                restaurant = restaurants_collection.find_one({"_id": restaurant_obj_id})
                if restaurant:
                    reservation_data["restaurant_name"] = restaurant.get("name", "Unknown Restaurant")
                    
                    # Validate operating hours
                    if "date" in reservation_data and "time" in reservation_data:
                        logger.info(f"Validating reservation for {restaurant.get('name')}: {reservation_data['date']} at {reservation_data['time']}")
                        is_valid, error_message = validate_reservation_time(
                            restaurant, 
                            reservation_data["date"], 
                            reservation_data["time"]
                        )
                        if not is_valid:
                            logger.error(f"Reservation validation failed: {error_message}")
                            raise HTTPException(status_code=400, detail=error_message)
                        logger.info("Reservation validation passed")
                else:
                    raise HTTPException(status_code=404, detail="Restaurant not found")
            except Exception as oid_error:
                if isinstance(oid_error, HTTPException):
                    raise oid_error
                logger.error(f"Invalid restaurant_id format: {reservation_data['restaurant_id']}, error: {oid_error}")
                raise HTTPException(status_code=400, detail="Invalid restaurant ID format")
        
        # Insert the reservation
        result = reservations_collection.insert_one(reservation_data)
        
        # Return the created reservation
        created_reservation = reservations_collection.find_one({"_id": result.inserted_id})
        created_reservation = convert_objectid(created_reservation)
        created_reservation["id"] = created_reservation["_id"]  # Add id field for frontend compatibility
        
        logger.info(f"Created reservation: {created_reservation['id']}")
        
        # Send reservation confirmation email (non-blocking)
        try:
            email_service = get_email_service()
            
            # Get restaurant name for the email
            restaurants_collection = db["restaurants"]
            restaurant = restaurants_collection.find_one({"_id": ObjectId(created_reservation['restaurant_id'])})
            restaurant_name = restaurant.get("name", "Restaurant") if restaurant else "Restaurant"
            
            # Prepare reservation details for email
            reservation_details = {
                'restaurant_name': restaurant_name,
                'date': created_reservation.get('date', created_reservation.get('reservation_date', 'TBD')),
                'time': created_reservation.get('time', created_reservation.get('reservation_time', 'TBD')),
                'party_size': created_reservation.get('party_size', created_reservation.get('guests', 1)),
                'reservation_id': created_reservation['id']
            }
            
            # Get user name from database using the user's email
            users_collection = db["users"]
            user_doc = users_collection.find_one({"email": user_email})
            user_name = user_doc.get('full_name', 'Customer') if user_doc else 'Customer'
            
            email_sent = email_service.send_reservation_confirmation(
                user_email, user_name, reservation_details
            )
            
            if email_sent:
                logger.info(f"Reservation confirmation email sent to {user_email}")
            else:
                logger.warning(f"Failed to send reservation confirmation email to {user_email}")
                
        except Exception as e:
            logger.error(f"Error sending reservation confirmation email: {str(e)}")
            # Don't fail reservation if email fails
        
        return created_reservation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating reservation: {e}")
        raise HTTPException(status_code=500, detail="Failed to create reservation")

@app.get("/reservations")
async def get_user_reservations(current_user: dict = Depends(get_current_user_from_token)):
    """Get all reservations for the authenticated user using JWT"""
    try:
        user_email = current_user["email"]
        
        db = get_database()
        reservations_collection = db["reservations"]
        
        # Find reservations for the specific user by email
        cursor = reservations_collection.find({"user_email": user_email}).sort("created_at", -1)
        reservations = []
        
        for reservation in cursor:
            reservation = convert_objectid(reservation)
            reservation["id"] = reservation["_id"]  # Add id field for frontend compatibility
            reservations.append(reservation)
        
        logger.info(f"Retrieved {len(reservations)} reservations for user {user_email}")
        return reservations
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching reservations: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch reservations")

@app.put("/reservations/{reservation_id}/cancel")
async def cancel_reservation(reservation_id: str):
    """Cancel a reservation"""
    try:
        if not ObjectId.is_valid(reservation_id):
            raise HTTPException(status_code=400, detail="Invalid reservation ID")
        
        db = get_database()
        reservations_collection = db["reservations"]
        
        # Update reservation status to cancelled
        result = reservations_collection.update_one(
            {"_id": ObjectId(reservation_id)},
            {"$set": {"status": "cancelled", "cancelled_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Reservation not found")
        
        # Get updated reservation
        reservation = reservations_collection.find_one({"_id": ObjectId(reservation_id)})
        reservation = convert_objectid(reservation)
        reservation["id"] = reservation["_id"]
        
        logger.info(f"Cancelled reservation: {reservation_id}")
        return reservation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling reservation: {e}")
        raise HTTPException(status_code=500, detail="Failed to cancel reservation")

@app.get("/reservations/{reservation_id}")
async def get_reservation_by_id(reservation_id: str):
    """Get a specific reservation by ID"""
    try:
        if not ObjectId.is_valid(reservation_id):
            raise HTTPException(status_code=400, detail="Invalid reservation ID")
        
        db = get_database()
        reservations_collection = db["reservations"]
        
        reservation = reservations_collection.find_one({"_id": ObjectId(reservation_id)})
        
        if not reservation:
            raise HTTPException(status_code=404, detail="Reservation not found")
        
        reservation = convert_objectid(reservation)
        reservation["id"] = reservation["_id"]
        
        logger.info(f"Retrieved reservation: {reservation_id}")
        return reservation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching reservation: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch reservation")

# Email Testing Endpoints
@app.post("/test-email/welcome")
async def test_welcome_email(email_data: dict):
    """Test endpoint to send welcome email"""
    try:
        email_address = email_data.get("email")
        name = email_data.get("name", "Test User")
        
        if not email_address:
            raise HTTPException(status_code=400, detail="Email address is required")
        
        email_service = get_email_service()
        result = email_service.send_welcome_email(email_address, name)
        
        if result:
            return {"success": True, "message": f"Welcome email sent to {email_address}"}
        else:
            return {"success": False, "message": "Failed to send welcome email"}
            
    except Exception as e:
        logger.error(f"Error testing welcome email: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/test-email/reservation")
async def test_reservation_email(email_data: dict):
    """Test endpoint to send reservation confirmation email"""
    try:
        email_address = email_data.get("email")
        name = email_data.get("name", "Test User")
        
        if not email_address:
            raise HTTPException(status_code=400, detail="Email address is required")
        
        # Sample reservation details
        reservation_details = {
            'restaurant_name': email_data.get('restaurant_name', 'Test Restaurant'),
            'date': email_data.get('date', '2025-10-15'),
            'time': email_data.get('time', '7:00 PM'),
            'party_size': email_data.get('party_size', 4),
            'reservation_id': email_data.get('reservation_id', 'TEST123')
        }
        
        email_service = get_email_service()
        result = email_service.send_reservation_confirmation(email_address, name, reservation_details)
        
        if result:
            return {"success": True, "message": f"Reservation confirmation email sent to {email_address}"}
        else:
            return {"success": False, "message": "Failed to send reservation confirmation email"}
            
    except Exception as e:
        logger.error(f"Error testing reservation email: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("Starting MongoDB FastAPI Server...")
    print("Server running at: http://localhost:8001")
    print("API Documentation: http://localhost:8001/docs")
    print("Press Ctrl+C to stop the server")
    uvicorn.run(app, host="0.0.0.0", port=8001)