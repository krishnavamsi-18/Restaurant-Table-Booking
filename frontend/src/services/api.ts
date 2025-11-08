import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AuthResponse, LoginCredentials, RegisterCredentials, User } from '../types/auth';
import { Restaurant, ReservationCreate, Reservation } from '../types/restaurant';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8001',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Only redirect if we're not already on login/register pages
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', credentials);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/auth/me');
    return response.data;
  }

  async changePassword(passwordData: { current_password: string; new_password: string }): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.post('/auth/change-password', passwordData);
    return response.data;
  }

  async updateProfile(profileData: { full_name: string; phone: string }): Promise<{ message: string; user: User }> {
    const response: AxiosResponse<{ message: string; user: User }> = await this.api.put('/auth/profile', profileData);
    return response.data;
  }

  async getRestaurants(latitude?: number, longitude?: number, radius?: number, state?: string, city?: string): Promise<Restaurant[]> {
    if (latitude !== undefined && longitude !== undefined) {
      const params = new URLSearchParams();
      params.append('latitude', latitude.toString());
      params.append('longitude', longitude.toString());
      if (radius !== undefined) params.append('radius', radius.toString());
      const response: AxiosResponse<Restaurant[]> = await this.api.get(`/restaurants/search/nearby?${params}`);
      return response.data;
    } else {
      const params = new URLSearchParams();
      if (state) params.append('state', state);
      if (city) params.append('city', city);
      const response: AxiosResponse<Restaurant[]> = await this.api.get(`/restaurants?${params}`);
      return response.data;
    }
  }

  async getRestaurantById(id: number | string): Promise<Restaurant> {
    const response: AxiosResponse<Restaurant> = await this.api.get(`/restaurants/${id}`);
    return response.data;
  }

  async createReservation(reservation: ReservationCreate): Promise<Reservation> {
    const response = await this.api.post('/reservations', reservation);
    return response.data;
  }

  async getCuisines(): Promise<string[]> {
    const response: AxiosResponse<string[]> = await this.api.get('/cuisines');
    return response.data;
  }

  async getUserReservations(): Promise<Reservation[]> {
    const response: AxiosResponse<Reservation[]> = await this.api.get('/reservations');
    return response.data;
  }

  async cancelReservation(reservationId: number | string): Promise<Reservation> {
    const response: AxiosResponse<Reservation> = await this.api.put(`/reservations/${reservationId}/cancel`);
    return response.data;
  }

  async getStates(): Promise<string[]> {
    const response: AxiosResponse<string[]> = await this.api.get('/locations/states');
    return response.data;
  }

  async getCitiesByState(state: string): Promise<string[]> {
    const response: AxiosResponse<string[]> = await this.api.get(`/locations/cities?state=${encodeURIComponent(state)}`);
    return response.data;
  }

  setAuthToken(token: string): void {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.api.defaults.headers.common['Authorization'];
  }
}

export const apiService = new ApiService();
export default apiService;