// MongoDB initialization script
// Creates initial database and collections

print("Initializing MongoDB database...");

// Switch to the target database
use('restaurant_reservation_db');

// Create collections with proper indexing
db.createCollection("restaurants");
db.createCollection("users"); 
db.createCollection("reservations");

// Create indexes for better performance
db.restaurants.createIndex({ "location": "2dsphere" });
db.restaurants.createIndex({ "city": 1, "state": 1 });
db.restaurants.createIndex({ "name": "text", "cuisine": "text" });

db.users.createIndex({ "email": 1 }, { unique: true });

db.reservations.createIndex({ "user_id": 1 });
db.reservations.createIndex({ "restaurant_id": 1 });
db.reservations.createIndex({ "reservation_date": 1 });

print("Database initialization completed successfully!");