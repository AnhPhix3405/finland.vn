'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation, Search } from 'lucide-react';
import { cn } from '@/src/lib/utils';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (lat: number, lng: number) => void;
  className?: string;
}

export default function MapPicker({ initialLat, initialLng, onLocationChange, className }: MapPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [isReady, setIsReady] = useState(false);

  // HCM center default
  const defaultLng = 106.660172;
  const defaultLat = 10.762622;

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    const startLng = initialLng || defaultLng;
    const startLat = initialLat || defaultLat;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [startLng, startLat],
      zoom: 14
    });

    marker.current = new mapboxgl.Marker({
      draggable: true,
      color: "#f97316"
    })
      .setLngLat([startLng, startLat])
      .addTo(map.current);

    marker.current.on('dragend', () => {
      if (marker.current) {
        const lngLat = marker.current.getLngLat();
        onLocationChange(lngLat.lat, lngLat.lng);
      }
    });

    map.current.on('click', (e) => {
      if (marker.current) {
        marker.current.setLngLat(e.lngLat);
        onLocationChange(e.lngLat.lat, e.lngLat.lng);
      }
    });

    map.current.on('load', () => {
      setIsReady(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update map and marker when initial coordinates change from outside (geocoding)
  useEffect(() => {
    if (!map.current || !marker.current || !initialLat || !initialLng) return;
    
    // Only move if the difference is significant to avoid infinite loops or jitter
    const currentLoc = marker.current.getLngLat();
    const dist = Math.sqrt(Math.pow(currentLoc.lat - initialLat, 2) + Math.pow(currentLoc.lng - initialLng, 2));
    
    if (dist > 0.0001) {
      marker.current.setLngLat([initialLng, initialLat]);
      map.current.flyTo({ center: [initialLng, initialLat], zoom: 16 });
    }
  }, [initialLat, initialLng]);

  return (
    <div className={cn("relative w-full h-[300px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800", className)}>
      <div ref={mapContainer} className="w-full h-full" />
      <div className="absolute top-3 left-3 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm pointer-events-none">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <MapPin className="w-3 h-3 text-orange-500" />
          Kéo ghim để chọn vị trí chính xác
        </p>
      </div>
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <Navigation className="w-6 h-6 text-orange-500 animate-pulse" />
        </div>
      )}
    </div>
  );
}
