"""
Restaurant validation utilities
"""
from datetime import datetime, timedelta
import logging

# Add timezone support (Python 3.9+)
try:
    from zoneinfo import ZoneInfo  # type: ignore
except Exception:
    ZoneInfo = None  # Fallback if zoneinfo is unavailable

logger = logging.getLogger(__name__)

def validate_reservation_time(restaurant: dict, reservation_date: str, reservation_time: str) -> tuple[bool, str]:
    """Validate that reservation time is within restaurant operating hours"""
    try:
        logger.info(f"Validating reservation: date={reservation_date}, time={reservation_time}")
        # Parse the reservation date to get the day of week
        date_obj = datetime.strptime(reservation_date, '%Y-%m-%d')
        day_name = date_obj.strftime('%A').lower()
        
        # Get operating hours for the day
        operating_hours = restaurant.get('operating_hours', {})
        day_hours = operating_hours.get(day_name)
        
        if not day_hours:
            return False, f"Operating hours not available for {day_name.capitalize()}"
        
        if day_hours.get('is_closed', False):
            return False, f"Restaurant is closed on {day_name.capitalize()}s"
        
        # Parse reservation time - handle both 12-hour and 24-hour formats
        try:
            # Try 24-hour format first
            reservation_time_obj = datetime.strptime(reservation_time, '%H:%M').time()
        except ValueError:
            try:
                # Try 12-hour format
                reservation_time_obj = datetime.strptime(reservation_time, '%I:%M %p').time()
            except ValueError:
                return False, "Invalid time format. Please use HH:MM or HH:MM AM/PM format"
        
        # Reject past times (ensure reservation is in the future relative to restaurant timezone)
        reservation_dt = datetime.combine(date_obj.date(), reservation_time_obj)
        zone_name = restaurant.get('timezone')
        if ZoneInfo and isinstance(zone_name, str) and zone_name:
            try:
                tz = ZoneInfo(zone_name)
                now_tz = datetime.now(tz)
                reservation_dt = reservation_dt.replace(tzinfo=tz)
            except Exception:
                now_tz = datetime.now()
        else:
            now_tz = datetime.now()
        
        if reservation_dt < now_tz:
            return False, "Reservation time has already passed. Please select a future time."
        
        # Parse operating hours
        open_time = datetime.strptime(day_hours['open'], '%H:%M').time()
        close_time = datetime.strptime(day_hours['close'], '%H:%M').time()
        
        # Check if reservation time is within operating hours
        if reservation_time_obj < open_time:
            return False, f"Restaurant opens at {day_hours['open']}. Please select a time after opening."
        
        # Last reservation should be at least 1 hour before closing
        close_datetime = datetime.combine(date_obj.date(), close_time)
        last_reservation_time = (close_datetime - timedelta(hours=1)).time()
        
        if reservation_time_obj > last_reservation_time:
            last_booking_str = last_reservation_time.strftime('%H:%M')
            logger.warning(f"Reservation time {reservation_time} is too late. Last booking: {last_booking_str}")
            return False, f"Last reservation is at {last_booking_str} (1 hour before closing at {day_hours['close']})"
        
        logger.info(f"Reservation time validation passed for {reservation_time}")
        return True, ""
        
    except Exception as e:
        logger.error(f"Error validating reservation time: {e}")
        return False, "Error validating reservation time"

def generate_available_time_slots(restaurant: dict, reservation_date: str) -> list[str]:
    """Generate available time slots for a given date"""
    try:
        # Parse the reservation date to get the day of week
        date_obj = datetime.strptime(reservation_date, '%Y-%m-%d')
        day_name = date_obj.strftime('%A').lower()
        
        # Get operating hours for the day
        operating_hours = restaurant.get('operating_hours', {})
        day_hours = operating_hours.get(day_name)
        
        if not day_hours or day_hours.get('is_closed', False):
            return []
        
        # Parse operating hours
        open_time = datetime.strptime(day_hours['open'], '%H:%M')
        close_time = datetime.strptime(day_hours['close'], '%H:%M')
        
        # Generate 30-minute slots from opening to 1 hour before closing
        slots = []
        current_time = open_time
        last_slot_time = close_time - timedelta(hours=1)
        
        while current_time <= last_slot_time:
            slots.append(current_time.strftime('%H:%M'))
            current_time += timedelta(minutes=30)
        
        return slots
        
    except Exception as e:
        logger.error(f"Error generating time slots: {e}")
        return []