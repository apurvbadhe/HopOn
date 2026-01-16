
import { UserProfile, TransportMode, RideRole } from '../types';

const STORAGE_KEY = 'hopon_users';
const SESSION_KEY = 'hopon_active_session';

const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.toLowerCase());
};

export const authService = {
  getUsers: (): Record<string, UserProfile> => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  },

  saveUser: (user: UserProfile) => {
    const users = authService.getUsers();
    users[user.email] = user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  },

  register: (name: string, email: string, bio: string, isRider: boolean, vehicleDetails?: string, plateNumber?: string): UserProfile => {
    if (!validateEmail(email)) {
      throw new Error("Please enter a valid email address (e.g., user@example.com).");
    }

    const users = authService.getUsers();
    if (users[email]) throw new Error("User already exists");

    const newUser: UserProfile = {
      name,
      email,
      avatar: `https://i.pravatar.cc/150?u=${email}`,
      bio,
      isRider,
      vehicleDetails,
      plateNumber,
      ratings: [],
      rideHistory: []
    };
    
    authService.saveUser(newUser);
    return newUser;
  },

  login: (email: string): UserProfile => {
    if (!validateEmail(email)) {
      throw new Error("Invalid email format.");
    }

    const users = authService.getUsers();
    const user = users[email];
    if (!user) throw new Error("User not found. Please register.");
    
    localStorage.setItem(SESSION_KEY, email);
    return user;
  },

  getCurrentSession: (): UserProfile | null => {
    const email = localStorage.getItem(SESSION_KEY);
    if (!email) return null;
    return authService.getUsers()[email] || null;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  }
};
