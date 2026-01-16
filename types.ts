
export enum TransportMode {
  PERSONAL = 'Personal Vehicle',
  CAB = 'Cab',
  AUTO = 'Auto-Rickshaw'
}

export enum RideRole {
  SEEKER = 'SEEKER',
  PUBLISHER = 'PUBLISHER'
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface KeyPoint extends Coordinates {
  name: string;
  etaMinutes: number;
}

export interface RouteInfo {
  from: Coordinates;
  to: Coordinates;
  intermediatePoints: KeyPoint[];
}

export interface UserMatch {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  mode: TransportMode;
  pickupLocation: string;
  dropOffLocation?: string;
  eta: string;
  priceEstimate?: string;
  vehicleDetails?: string;
  plateNumber?: string;
  routeFit?: string;
  routeFitScore?: number;
}

export interface RideRequest {
  from: string;
  to: string;
  role: RideRole;
}

export interface UserRating {
  stars: number;
  comment?: string;
  timestamp: number;
}

export interface RideHistoryEntry {
  id: string;
  from: string;
  to: string;
  date: number;
  partnerName: string;
  mode: TransportMode;
  role: RideRole;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  bio: string;
  isRider: boolean;
  vehicleDetails?: string;
  plateNumber?: string;
  ratings: UserRating[];
  rideHistory: RideHistoryEntry[];
}
