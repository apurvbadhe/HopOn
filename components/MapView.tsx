
import React, { useEffect, useRef } from 'react';
import { RouteInfo } from '../types';

declare global {
  interface Window {
    L: any;
  }
}

interface MapViewProps {
  route: RouteInfo;
  isCompleted?: boolean;
}

const MapView: React.FC<MapViewProps> = ({ route, isCompleted }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    if (!mapInstance.current) {
      mapInstance.current = window.L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([route.from.lat, route.from.lng], 13);

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(mapInstance.current);

      window.L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);
    }

    const L = window.L;
    const map = mapInstance.current;

    // Clear existing layers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Icons
    const startIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-8 h-8 bg-emerald-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">A</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const endIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-8 h-8 bg-indigo-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">B</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // Main route polyline
    const allPoints = [
      [route.from.lat, route.from.lng],
      ...route.intermediatePoints.map(p => [p.lat, p.lng]),
      [route.to.lat, route.to.lng]
    ];

    const polyline = L.polyline(allPoints, {
      color: '#4f46e5',
      weight: 5,
      opacity: 0.8,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Subtle dashed line for visual flair
    L.polyline(allPoints, {
      color: 'white',
      weight: 1,
      opacity: 0.5,
      dashArray: '5, 10'
    }).addTo(map);

    // Markers
    L.marker([route.from.lat, route.from.lng], { icon: startIcon }).addTo(map);
    L.marker([route.to.lat, route.to.lng], { icon: endIcon }).addTo(map);

    // Interactive Intermediate Points
    route.intermediatePoints.forEach(point => {
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: 6,
        fillColor: 'white',
        color: '#4f46e5',
        weight: 3,
        opacity: 1,
        fillOpacity: 1
      }).addTo(map);

      const popupContent = `
        <div class="p-1 min-w-[120px]">
          <p class="text-[10px] font-black uppercase text-indigo-600 tracking-wider mb-0.5">Key Point</p>
          <p class="text-sm font-bold text-slate-900 leading-tight">${point.name}</p>
          <div class="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100">
            <span class="text-xs">🕒</span>
            <span class="text-xs font-semibold text-slate-500">Reach in ${point.etaMinutes} mins</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        className: 'hopon-map-popup'
      });

      // Hover effect
      marker.on('mouseover', () => {
        marker.setStyle({ radius: 8, weight: 4 });
      });
      marker.on('mouseout', () => {
        marker.setStyle({ radius: 6, weight: 3 });
      });
    });

    const bounds = L.latLngBounds(allPoints as [number, number][]);
    map.fitBounds(bounds, { padding: [50, 50] });

  }, [route]);

  return (
    <div className="relative w-full h-[320px] bg-slate-100 overflow-hidden shadow-inner group">
      <div ref={mapRef} className="w-full h-full" />
      
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-700 shadow-sm border border-white/50 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'}`}></span>
          {isCompleted ? 'Trip Finished' : 'Route Active'}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-indigo-600/90 backdrop-blur-md px-3 py-2 rounded-xl text-[10px] font-bold text-white shadow-lg">
          Click the white dots for ETAs
        </div>
      </div>

      <style>{`
        .hopon-map-popup .leaflet-popup-content-wrapper {
          border-radius: 1rem;
          padding: 4px;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
          border: 1px solid #f1f5f9;
        }
        .hopon-map-popup .leaflet-popup-tip {
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        }
      `}</style>
    </div>
  );
};

export default MapView;
