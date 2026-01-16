
import { GoogleGenAI, Type } from "@google/genai";
import { RideRole, TransportMode, UserMatch, Coordinates, RouteInfo, KeyPoint, UserProfile } from "../types";
import { authService } from "./authService";

export interface PlaceSuggestion {
  name: string;
  description: string;
  uri?: string;
}

export async function getPlaceSuggestions(query: string, coords?: Coordinates): Promise<PlaceSuggestion[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find place suggestions for the query: "${query}". Return the result as a list of 5 popular locations with their names and short descriptions.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: { retrievalConfig: coords ? { latLng: { latitude: coords.lat, longitude: coords.lng } } : undefined }
      },
    });
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const suggestions: PlaceSuggestion[] = [];
    const textLines = response.text?.split('\n').filter(l => l.trim().length > 0).slice(0, 5) || [];
    textLines.forEach((line, index) => {
      const chunk = chunks[index]?.maps;
      suggestions.push({
        name: line.replace(/^\d+\.\s*/, '').split(':')[0].trim(),
        description: line.includes(':') ? line.split(':')[1].trim() : "Location nearby",
        uri: chunk?.uri
      });
    });
    return suggestions;
  } catch (error) {
    console.error("Autocomplete failed:", error);
    return [];
  }
}

export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find the exact latitude and longitude for: "${address}". Return the result in the format: LAT: [number], LNG: [number].`,
      config: { tools: [{ googleMaps: {} }] },
    });
    const text = response.text || "";
    const latMatch = text.match(/LAT:\s*(-?\d+\.\d+)/i);
    const lngMatch = text.match(/LNG:\s*(-?\d+\.\d+)/i);
    if (latMatch && lngMatch) return { lat: parseFloat(latMatch[1]), lng: parseFloat(lngMatch[2]) };
    return null;
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
}

export async function getRouteDetails(from: string, to: string): Promise<RouteInfo | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const start = await geocodeAddress(from);
    const end = await geocodeAddress(to);
    if (!start || !end) return null;
    const prompt = `Given a route from "${from}" to "${to}", identify 3 significant intermediate landmarks. Return as JSON array of points.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { name: { type: Type.STRING }, etaMinutes: { type: Type.NUMBER }, lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } },
            required: ["name", "etaMinutes", "lat", "lng"]
          }
        }
      }
    });
    return { from: start, to: end, intermediatePoints: JSON.parse(response.text || "[]") };
  } catch (error) {
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Identify the precise street address for the coordinates lat: ${lat}, lng: ${lng}. Return ONLY the address.`,
      config: { tools: [{ googleMaps: {} }], toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } } },
    });
    return response.text?.trim() || "Detected Location";
  } catch (error) {
    return "Detected Location";
  }
}

/**
 * FETCH REAL USERS: This function now pulls from the "database" 
 * instead of asking Gemini to hallucinate fake ones.
 */
export async function getMatches(
  from: string, 
  to: string, 
  role: RideRole, 
  destCoords?: Coordinates | null
): Promise<UserMatch[]> {
  const allUsers = Object.values(authService.getUsers());
  const currentSession = authService.getCurrentSession();
  
  // Filter out the logged-in user themselves
  const candidates = allUsers.filter(u => u.email !== currentSession?.email);

  let filteredUsers: UserProfile[] = [];
  
  if (role === RideRole.PUBLISHER) {
    // Rider looking for Passengers: Only find real users who ARE NOT riders
    filteredUsers = candidates.filter(u => !u.isRider);
  } else {
    // Passenger looking for Riders: Only find real users who ARE riders
    filteredUsers = candidates.filter(u => u.isRider);
  }

  // Map real users to the Match interface
  return filteredUsers.map(user => {
    const avgRating = user.ratings.length > 0 
      ? Number((user.ratings.reduce((acc, r) => acc + r.stars, 0) / user.ratings.length).toFixed(1))
      : 4.5;

    return {
      id: user.email,
      name: user.name,
      avatar: user.avatar,
      rating: avgRating,
      mode: user.isRider ? TransportMode.PERSONAL : TransportMode.CAB,
      pickupLocation: `Nearby ${from.split(',')[0]}`,
      eta: `${Math.floor(Math.random() * 10) + 2} mins`,
      vehicleDetails: user.vehicleDetails || "Standard Ride",
      plateNumber: user.plateNumber,
      routeFit: "On your path",
      routeFitScore: 90 + Math.floor(Math.random() * 10)
    };
  });
}
