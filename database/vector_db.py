import json
from typing import List, Dict, Optional
from datetime import datetime
import os

class VectorDatabase:
    def __init__(self, persist_directory: str = "./simple_db"):
        """Initialize simple file-based database"""
        self.persist_directory = persist_directory
        
        # Create directory if it doesn't exist
        os.makedirs(persist_directory, exist_ok=True)
        
        # File paths for different collections
        self.restaurants_file = os.path.join(persist_directory, "restaurants.json")
        self.users_file = os.path.join(persist_directory, "users.json")
        self.reservations_file = os.path.join(persist_directory, "reservations.json")
        
        # Initialize with sample data if files don't exist
        if not os.path.exists(self.restaurants_file):
            self._initialize_sample_data()
    
    def _load_data(self, file_path: str) -> List[Dict]:
        """Load data from JSON file"""
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    
    def _save_data(self, file_path: str, data: List[Dict]):
        """Save data to JSON file"""
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def _initialize_sample_data(self):
        """Initialize with sample restaurant data"""
        sample_restaurants = [
            {
                "id": "1",
                "name": "The Golden Spoon",
                "cuisine_type": "Italian",
                "location": "Downtown",
                "rating": 4.5,
                "price_range": "$$",
                "opening_hours": "11:00 AM - 10:00 PM",
                "description": "Authentic Italian cuisine with a modern twist",
                "website": "https://goldenspooon.com",
                "email": "info@goldenspoon.com",
                "features": "outdoor_seating, wine_bar, romantic",
                "address": "123 Main St, Downtown",
                "phone": "(555) 123-4567",
                "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
                "latitude": 40.7128,
                "longitude": -74.0060
            },
            {
                "id": "2", 
                "name": "Sakura Sushi",
                "cuisine_type": "Japanese",
                "location": "Midtown",
                "rating": 4.8,
                "price_range": "$$$",
                "opening_hours": "5:00 PM - 11:00 PM",
                "description": "Fresh sushi and traditional Japanese dishes",
                "website": "https://sakurasushi.com",
                "email": "contact@sakurasushi.com",
                "features": "sushi_bar, sake_selection, authentic",
                "address": "456 Oak Ave, Midtown",
                "phone": "(555) 987-6543",
                "image_url": "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400",
                "latitude": 40.7589,
                "longitude": -73.9851
            },
            {
                "id": "3",
                "name": "Burger Palace",
                "cuisine_type": "American",
                "location": "Uptown",
                "rating": 4.2,
                "price_range": "$",
                "opening_hours": "10:00 AM - 12:00 AM",
                "description": "Gourmet burgers and craft beer",
                "website": "https://burgerpalace.com",
                "email": "hello@burgerpalace.com",
                "features": "craft_beer, casual_dining, family_friendly",
                "address": "789 Pine St, Uptown",
                "phone": "(555) 456-7890",
                "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
                "latitude": 40.7831,
                "longitude": -73.9712
            }
        ]
        
        self._save_data(self.restaurants_file, sample_restaurants)
        self._save_data(self.users_file, [])
        self._save_data(self.reservations_file, [])
    
    # Restaurant methods
    def add_restaurant(self, restaurant_data: Dict) -> str:
        """Add a new restaurant"""
        restaurants = self._load_data(self.restaurants_file)
        restaurant_id = str(len(restaurants) + 1)
        restaurant_data["id"] = restaurant_id
        restaurants.append(restaurant_data)
        self._save_data(self.restaurants_file, restaurants)
        return restaurant_id
    
    def get_all_restaurants(self) -> List[Dict]:
        """Get all restaurants"""
        return self._load_data(self.restaurants_file)
    
    def get_restaurant_by_id(self, restaurant_id: str) -> Optional[Dict]:
        """Get restaurant by ID"""
        restaurants = self._load_data(self.restaurants_file)
        for restaurant in restaurants:
            if restaurant.get("id") == restaurant_id:
                return restaurant
        return None
    
    def search_restaurants(self, query: str, limit: int = 10) -> List[Dict]:
        """Search restaurants by name, cuisine, or location"""
        restaurants = self._load_data(self.restaurants_file)
        query_lower = query.lower()
        
        results = []
        for restaurant in restaurants:
            # Search in name, cuisine_type, location, and description
            searchable_text = f"{restaurant.get('name', '')} {restaurant.get('cuisine_type', '')} {restaurant.get('location', '')} {restaurant.get('description', '')}"
            if query_lower in searchable_text.lower():
                results.append(restaurant)
        
        return results[:limit]
    
    # User methods
    def add_user(self, user_data: Dict) -> str:
        """Add a new user"""
        users = self._load_data(self.users_file)
        user_id = str(len(users) + 1)
        user_data["id"] = user_id
        users.append(user_data)
        self._save_data(self.users_file, users)
        return user_id
    
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        users = self._load_data(self.users_file)
        for user in users:
            if user.get("email") == email:
                return user
        return None
    
    # Reservation methods
    def add_reservation(self, reservation_data: Dict) -> str:
        """Add a new reservation"""
        reservations = self._load_data(self.reservations_file)
        reservation_id = str(len(reservations) + 1)
        reservation_data["id"] = reservation_id
        reservation_data["created_at"] = datetime.now().isoformat()
        reservations.append(reservation_data)
        self._save_data(self.reservations_file, reservations)
        return reservation_id
    
    def get_user_reservations(self, user_id: str) -> List[Dict]:
        """Get all reservations for a user"""
        reservations = self._load_data(self.reservations_file)
        return [r for r in reservations if r.get("user_id") == user_id]
    
    def get_reservation_by_id(self, reservation_id: str) -> Optional[Dict]:
        """Get reservation by ID"""
        reservations = self._load_data(self.reservations_file)
        for reservation in reservations:
            if reservation.get("id") == reservation_id:
                return reservation
        return None

# Global instance
_vector_db = None

def get_vector_db() -> VectorDatabase:
    """Get or create the global vector database instance"""
    global _vector_db
    if _vector_db is None:
        _vector_db = VectorDatabase()
    return _vector_db