import { Restaurant, OperatingHours } from '../types/restaurant';

export const formatTime = (time: string): string => {
  if (!time) return '';
  
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${displayHour}:${minutes} ${ampm}`;
};

export const getDayName = (dayIndex: number): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[dayIndex];
};

export const getTodayOperatingHours = (restaurant: Restaurant): OperatingHours | null => {
  if (!restaurant.operating_hours) return null;
  
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayName = getDayName(today);
  
  return restaurant.operating_hours[dayName as keyof typeof restaurant.operating_hours] || null;
};

export const isRestaurantOpen = (restaurant: Restaurant): boolean => {
  const todayHours = getTodayOperatingHours(restaurant);
  
  if (!todayHours || todayHours.is_closed) {
    return false;
  }
  
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
};

export const getRestaurantStatus = (restaurant: Restaurant): { status: string; color: string } => {
  const todayHours = getTodayOperatingHours(restaurant);
  
  if (!todayHours || todayHours.is_closed) {
    return { status: 'Closed Today', color: '#e74c3c' };
  }
  
  const isOpen = isRestaurantOpen(restaurant);
  
  if (isOpen) {
    return { status: 'Open Now', color: '#27ae60' };
  }
  
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  if (currentTime < todayHours.open) {
    return { status: `Opens at ${formatTime(todayHours.open)}`, color: '#f39c12' };
  } else {
    return { status: 'Closed', color: '#e74c3c' };
  }
};

export const formatOperatingHours = (restaurant: Restaurant): string => {
  const todayHours = getTodayOperatingHours(restaurant);
  
  if (!todayHours || todayHours.is_closed) {
    return 'Closed Today';
  }
  
  return `${formatTime(todayHours.open)} - ${formatTime(todayHours.close)}`;
};

export const getOperatingHoursForDay = (restaurant: Restaurant, date: Date): OperatingHours | null => {
  if (!restaurant.operating_hours) return null;
  
  const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayName = getDayName(dayIndex);
  
  return restaurant.operating_hours[dayName as keyof typeof restaurant.operating_hours] || null;
};

export const getWeeklyOperatingHours = (restaurant: Restaurant): Array<{day: string, hours: string, isToday: boolean}> => {
  if (!restaurant.operating_hours) return [];
  
  const today = new Date().getDay();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  return days.map((day, index) => {
    const dayKey = dayKeys[index] as keyof typeof restaurant.operating_hours;
    const hours = restaurant.operating_hours![dayKey];
    
    return {
      day,
      hours: hours.is_closed ? 'Closed' : `${formatTime(hours.open)} - ${formatTime(hours.close)}`,
      isToday: index === today
    };
  });
};