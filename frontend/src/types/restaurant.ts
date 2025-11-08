export interface OperatingHours {
  open: string;
  close: string;
  is_closed: boolean;
}

export interface Restaurant {
  id: string; // Changed to string for MongoDB ObjectId
  name: string;
  cuisine: string;
  cuisine_type?: string; // For backward compatibility
  address: string;
  city?: string;
  state?: string;
  country?: string;
  phone: string;
  rating: number;
  image_url: string;
  latitude: number;
  longitude: number;
  description?: string;
  price_range?: string;
  features?: string[];
  opening_hours?: string; // For backward compatibility
  operating_hours?: {
    monday: OperatingHours;
    tuesday: OperatingHours;
    wednesday: OperatingHours;
    thursday: OperatingHours;
    friday: OperatingHours;
    saturday: OperatingHours;
    sunday: OperatingHours;
  };
  is_open?: boolean;
  current_status?: string;
  website?: string;
  email?: string;
}

export interface ReservationCreate {
  restaurant_id: string; // Changed to string for MongoDB ObjectId
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  special_requests?: string;
  // Additional fields for backend compatibility
  date?: string;
  time?: string;
  guests?: number;
}

export interface Reservation {
  id: string; // Changed to string for MongoDB ObjectId
  user_id: number;
  restaurant_id: string; // Changed to string for MongoDB ObjectId
  restaurant_name: string;
  reservation_date?: string;
  reservation_time?: string;
  party_size?: number;
  status: string;
  special_requests?: string;
  created_at?: string;
  // Additional fields that might come from backend
  date?: string;
  time?: string;
  guests?: number;
}

export interface LocationData {
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
  isManualSelection?: boolean; // Flag to distinguish manual city selection from GPS
}