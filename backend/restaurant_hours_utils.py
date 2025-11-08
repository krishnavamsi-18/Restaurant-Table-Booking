#!/usr/bin/env python3
"""
Restaurant operating hours utilities
"""

from datetime import datetime, time, timedelta
import pytz

def is_restaurant_open(operating_hours, timezone_str="Asia/Kolkata"):
    """
    Check if a restaurant is currently open based on operating hours
    
    Args:
        operating_hours (dict): Restaurant operating hours for each day
        timezone_str (str): Timezone string (default: Asia/Kolkata)
    
    Returns:
        dict: Status information including is_open, current_day, next_opening
    """
    try:
        # Get current time in restaurant's timezone
        tz = pytz.timezone(timezone_str)
        now = datetime.now(tz)
        current_day = now.strftime('%A').lower()
        current_time = now.time()
        
        # Get today's operating hours
        today_hours = operating_hours.get(current_day)
        
        if not today_hours or today_hours.get('is_closed', True):
            # Restaurant is closed today, find next opening
            next_opening = find_next_opening(operating_hours, now, tz)
            return {
                "is_open": False,
                "status": "closed_today",
                "current_day": current_day,
                "current_time": now.strftime("%H:%M"),
                "next_opening": next_opening
            }
        
        # Parse opening and closing times
        open_time = datetime.strptime(today_hours['open'], "%H:%M").time()
        close_time_str = today_hours['close']
        
        # Handle midnight closing (24:00 or 00:00)
        if close_time_str == "24:00":
            close_time_str = "23:59"
        elif close_time_str == "00:00":
            # Closing at midnight means next day
            close_time = time(23, 59)  # Use 11:59 PM as practical closing
        else:
            close_time = datetime.strptime(close_time_str, "%H:%M").time()
        
        # Check if currently open
        if close_time_str == "00:00" or close_time < open_time:
            # Restaurant closes after midnight
            is_open = current_time >= open_time or current_time <= close_time
        else:
            # Normal hours (same day)
            is_open = open_time <= current_time <= close_time
        
        status = "open" if is_open else "closed"
        
        # Calculate next opening/closing time
        if is_open:
            next_change = f"Closes at {today_hours['close']}"
        else:
            if current_time < open_time:
                next_change = f"Opens at {today_hours['open']}"
            else:
                next_opening = find_next_opening(operating_hours, now, tz)
                next_change = next_opening
        
        return {
            "is_open": is_open,
            "status": status,
            "current_day": current_day,
            "current_time": now.strftime("%H:%M"),
            "today_hours": today_hours,
            "next_change": next_change
        }
        
    except Exception as e:
        # Return safe default if parsing fails
        return {
            "is_open": None,
            "status": "unknown",
            "error": str(e)
        }

def find_next_opening(operating_hours, current_datetime, tz):
    """Find the next opening time for a restaurant"""
    days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    current_day_index = current_datetime.weekday()  # Monday = 0
    
    # Check next 7 days
    for i in range(1, 8):
        next_day_index = (current_day_index + i) % 7
        next_day = days[next_day_index]
        next_hours = operating_hours.get(next_day)
        
        if next_hours and not next_hours.get('is_closed', True):
            next_date = current_datetime + timedelta(days=i)
            return f"Opens {next_day.capitalize()} at {next_hours['open']}"
    
    return "Opening hours not available"

def format_operating_hours(operating_hours):
    """
    Format operating hours for display
    
    Args:
        operating_hours (dict): Restaurant operating hours
    
    Returns:
        dict: Formatted hours for each day
    """
    formatted = {}
    days_order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    for day in days_order:
        hours = operating_hours.get(day, {})
        if hours.get('is_closed', True):
            formatted[day] = {
                "display": "Closed",
                "is_closed": True
            }
        else:
            open_time = hours.get('open', '')
            close_time = hours.get('close', '')
            
            # Format 24-hour to 12-hour display
            try:
                open_12 = datetime.strptime(open_time, "%H:%M").strftime("%I:%M %p")
                if close_time == "00:00":
                    close_12 = "12:00 AM (next day)"
                elif close_time == "24:00":
                    close_12 = "12:00 AM (next day)"
                else:
                    close_12 = datetime.strptime(close_time, "%H:%M").strftime("%I:%M %p")
                
                formatted[day] = {
                    "display": f"{open_12} - {close_12}",
                    "is_closed": False,
                    "open": open_time,
                    "close": close_time
                }
            except:
                formatted[day] = {
                    "display": f"{open_time} - {close_time}",
                    "is_closed": False,
                    "open": open_time,
                    "close": close_time
                }
    
    return formatted

def get_restaurant_status_summary(restaurant_data):
    """
    Get a complete status summary for a restaurant
    
    Args:
        restaurant_data (dict): Complete restaurant document from MongoDB
    
    Returns:
        dict: Complete restaurant data with status information
    """
    operating_hours = restaurant_data.get('operating_hours', {})
    timezone_str = restaurant_data.get('timezone', 'Asia/Kolkata')
    
    if not operating_hours:
        return {
            **restaurant_data,
            "status": {
                "is_open": None,
                "status": "hours_not_available"
            },
            "formatted_hours": {}
        }
    
    # Get current status
    status = is_restaurant_open(operating_hours, timezone_str)
    
    # Format hours for display
    formatted_hours = format_operating_hours(operating_hours)
    
    return {
        **restaurant_data,
        "status": status,
        "formatted_hours": formatted_hours
    }

# For testing
if __name__ == "__main__":
    # Test with sample operating hours
    sample_hours = {
        "monday": {"open": "", "close": "", "is_closed": True},
        "tuesday": {"open": "17:00", "close": "23:00", "is_closed": False},
        "wednesday": {"open": "17:00", "close": "23:00", "is_closed": False},
        "thursday": {"open": "17:00", "close": "23:00", "is_closed": False},
        "friday": {"open": "17:00", "close": "00:00", "is_closed": False},
        "saturday": {"open": "17:00", "close": "00:00", "is_closed": False},
        "sunday": {"open": "17:00", "close": "22:00", "is_closed": False}
    }
    
    result = is_restaurant_open(sample_hours)
    print("Restaurant Status:", result)
    
    formatted = format_operating_hours(sample_hours)
    print("\nFormatted Hours:")
    for day, hours in formatted.items():
        print(f"{day.capitalize()}: {hours['display']}")