'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Search,
  Map as MapIcon,
  Info,
  X,
  ArrowLeft,
  MapPin,
  Loader2,
  LocateFixed,
  Settings2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

const LAND_USE_COLORS: Record<string, { color: string; name: string }> = {
  // Đất ở (Residential) - Tông Đỏ / Cam đậm
  'ODT': { color: '#FF6666', name: 'Đất ở đô thị' },
  'ONT': { color: '#FF9966', name: 'Đất ở nông thôn' },
  'OTC': { color: '#FF6A6A', name: 'Đất ở' }, // Combined Residential

  // Đất nông nghiệp (Agriculture) - Tông Vàng / Xanh lá mạ
  'LUC': { color: '#FFFF64', name: 'Đất chuyên trồng lúa nước' },
  'LUA': { color: '#FFF282', name: 'Đất trồng lúa' },
  'LUK': { color: '#FFF296', name: 'Đất trồng lúa nước còn lại' },
  'CLN': { color: '#FFD2A0', name: 'Đất trồng cây lâu năm' },
  'HNK': { color: '#FFF0B4', name: 'Đất trồng cây hàng năm khác' },
  'BHK': { color: '#FFF0B4', name: 'Đất bằng trồng cây hàng năm khác' },
  'NTS': { color: '#00FFFF', name: 'Đất nuôi trồng thủy sản' },
  'RSX': { color: '#B4FFB4', name: 'Đất rừng sản xuất' },
  'RPH': { color: '#BEFF1E', name: 'Đất rừng phòng hộ' },
  'RDD': { color: '#6EFF64', name: 'Đất rừng đặc dụng' },

  // Đất phi nông nghiệp (Non-Agriculture) - Tông Hồng / Tím / Xanh biển
  'TMD': { color: '#FF99FF', name: 'Đất thương mại, dịch vụ' },
  'SKC': { color: '#C8A2C8', name: 'Đất sản xuất phi nông nghiệp' },
  'SKS': { color: '#A020F0', name: 'Đất khai thác khoáng sản' },
  'DGT': { color: '#CCCCCC', name: 'Đất giao thông' },
  'DTL': { color: '#3399FF', name: 'Đất thủy lợi' },
  'DNL': { color: '#FFCC00', name: 'Đất công trình năng lượng' },
  'DKV': { color: '#00CCFF', name: 'Đất khu vui chơi, giải trí' },
  'DTT': { color: '#00FFFF', name: 'Đất thể dục, thao' },
  'DYT': { color: '#EE82EE', name: 'Đất y tế' }, // Distinct Violet/Pink
  'DGD': { color: '#1E90FF', name: 'Đất giáo dục, đào tạo' },
  'DCH': { color: '#FF8C00', name: 'Đất chợ' },
  'CQP': { color: '#BB0000', name: 'Đất quốc phòng' },
  'CAN': { color: '#880000', name: 'Đất an ninh' },
  'TON': { color: '#A9A9A9', name: 'Đất tôn giáo' },
  'NTD': { color: '#808080', name: 'Đất nghĩa trang, nghĩa địa' },
  'DSH': { color: '#E6E6FA', name: 'Đất sinh hoạt cộng đồng' },
  'DVH': { color: '#DDA0DD', name: 'Đất xây dựng cơ sở văn hóa' },
};

export function PlanningMap() {
  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [lng, setLng] = useState(106.660172); // HCM center
  const [lat, setLat] = useState(10.762622);
  const [zoom, setZoom] = useState(13);
  const [loading, setLoading] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [mapStyle, setMapStyle] = useState<'satellite-streets-v12' | 'streets-v12' | 'dark-v11'>('satellite-streets-v12');
  const [historyFeatures, setHistoryFeatures] = useState<any[]>([]);
  const [showSelectedHighlight, setShowSelectedHighlight] = useState(true);
  const [isStyleSwitching, setIsStyleSwitching] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [listings, setListings] = useState<any[]>([]);
  const [hoveredListing, setHoveredListing] = useState<any>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number, y: number } | null>(null);

  // Admin Search Data
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('79'); // HCM default
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');

  const [reconcileTrigger, setReconcileTrigger] = useState(0);
  const [revGeocodeAddr, setRevGeocodeAddr] = useState<string>('');

  const fetchReverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxgl.accessToken}&country=vn&limit=1&types=neighborhood,address,poi,locality,place`
      );
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        // Mapbox usually returns "[Name], [Ward], [District], [City], [Country]"
        // We want to extract the part from Ward onwards
        const context = data.features[0].context || [];
        const parts = data.features[0].place_name.split(', ');
        // If the first part is a house number or name, we might want to skip it if we already have it from Registry
        setRevGeocodeAddr(data.features[0].place_name);
      } else {
        setRevGeocodeAddr('');
      }
    } catch (err) {
      console.error('DEBUG: Reverse geocoding error:', err);
      setRevGeocodeAddr('');
    }
  }, []);

  const getNormalizedInfo = useCallback(() => {
    if (!selectedInfo) return null;
    const attr = selectedInfo.attributes || {};
    const props = selectedInfo.geo_data?.properties || {};

    return {
      address: (() => {
        const rawAddr = selectedInfo.address || selectedInfo.full_address || selectedInfo.dia_chi || attr.dia_chi || props.full_address;

        let displayAddr = 'Đang cập nhật';

        if (rawAddr && rawAddr !== 'Unknown') {
          displayAddr = rawAddr;
          // If address is just a number/short/no-commas, and we have revGeocodeAddr, combine them
          const isProbablyPartial = rawAddr.toString().length < 25 && !rawAddr.toString().includes(',');

          if (isProbablyPartial && revGeocodeAddr) {
            // Check if revGeocodeAddr already contains the number to avoid "384/30/3, 384/30/3, Phường..."
            const cleanRaw = rawAddr.toString().trim().toLowerCase();
            const cleanRev = revGeocodeAddr.toLowerCase();

            if (!cleanRev.includes(cleanRaw)) {
              displayAddr = `${rawAddr}, ${revGeocodeAddr}`;
            } else {
              displayAddr = revGeocodeAddr;
            }
          }
        } else if (revGeocodeAddr) {
          displayAddr = revGeocodeAddr;
        }

        // Final cleanup: 
        let cleaned = displayAddr
          .replace(/, (Vietnam|Việt Nam)$/i, '') // Remove country
          .replace(/\b\d{5,6}\b/g, '') // Remove postal codes (5-6 digits)
          .replace(/, /g, ',') // Standardize commas for dedupe
          .split(',')
          .map(s => s.trim())
          .filter((val, idx, arr) => {
            const v = val.toLowerCase().replace(/\./g, '').trim();
            // Expanded city variants
            const hcmVariants = ['hồ chí minh', 'thành phố hồ chí minh', 'tp hồ chí minh', 'tp. hồ chí minh', 'saigon', 'sài gòn', 'sai gon'];

            if (hcmVariants.includes(v)) {
              // If this is a city variant, but another city variant is already present earlier in the list, skip it
              const firstCityIdx = arr.findIndex(item => hcmVariants.includes(item.toLowerCase().replace(/\./g, '').trim()));
              if (idx !== firstCityIdx) return false;
              // Normalize the displayed city name to "Hồ Chí Minh"
              arr[idx] = "Hồ Chí Minh";
            }

            // General dedupe
            return arr.indexOf(val) === idx;
          })
          .join(', ')
          .replace(/, ,/g, ',')
          .replace(/^, |, $/g, '')
          .replace(/\s+/g, ' ') // Clean up extra spaces
          .trim();

        return cleaned;
      })(),
      mapSheet: selectedInfo.map_number || selectedInfo.land_sheet || selectedInfo.so_to_ban_do || attr.so_to_ban_do || props.map_sheet || '--',
      plotNumber: selectedInfo.lot_number || selectedInfo.land_plot || selectedInfo.so_hieu_thua || attr.so_hieu_thua || props.map_plot || '--',
      area: selectedInfo.area || selectedInfo.dien_tich_thua || attr.dien_tich_thua || props.area || selectedInfo.total_area,
      landType: (() => {
        const raw = selectedInfo.land_type || selectedInfo.loai_dat_quy_hoach || attr.loai_dat_quy_hoach || props.land_type;
        if (!raw || raw === 'Unknown') return null;

        const rawStr = raw.toString();

        // Helper to get name from code or return same if not a code
        const getName = (str: string) => {
          // Strip area suffix like ": 100.5 m2" or ":100.5m2"
          const cleanName = str.replace(/:\s*[\d.]+\s*m2/i, '').trim();

          // Check if it's strictly a code (3-4 uppercase chars)
          const codeMatch = cleanName.match(/^\s*([A-Z]{3,4})\s*$/);
          const code = codeMatch ? codeMatch[1] : cleanName;
          return LAND_USE_COLORS[code]?.name || cleanName;
        };

        // Parse "Đất A: 100 m2; Đất B: 200 m2"
        if (rawStr.includes(';')) {
          const parts = rawStr.split(';').map((p: string) => p.trim()).filter(Boolean);
          const typesWithArea = parts.map((p: string) => {
            const match = p.match(/(.*?):\s*([\d.]+)\s*m2/);
            if (match) {
              return { name: match[1].trim(), area: parseFloat(match[2]) };
            }
            return { name: p.trim(), area: 0 };
          });

          // Sort by area descending
          typesWithArea.sort((a: any, b: any) => b.area - a.area);
          return getName(typesWithArea[0].name);
        }

        return getName(rawStr);
      })(),
      fullLandType: (() => {
        const raw = selectedInfo.land_type || selectedInfo.loai_dat_quy_hoach || attr.loai_dat_quy_hoach || props.land_type;
        if (!raw || raw === 'Unknown') return null;

        const rawStr = raw.toString();
        // If it's a multi-line/complex type, clean it up but keep the context
        if (rawStr.includes(';')) {
          return rawStr.split(';').map((s: string) => s.trim()).join(' | ');
        }
        return rawStr;
      })()
    };
  }, [selectedInfo]);

  // Atomic Map Reconciliation: Sources, Layers, and Visibility
  useEffect(() => {
    const m = map.current;
    if (!m || !m.isStyleLoaded()) {
      console.log('DEBUG: Map not ready for reconcile', { hasMap: !!m, isStyleLoaded: m?.isStyleLoaded() });
      return;
    }

    console.log('DEBUG: Running Map Reconcile', {
      features: historyFeatures.length,
      hasSelected: !!selectedInfo,
      visible: showSelectedHighlight
    });

    try {
      const visibility = showSelectedHighlight ? 'visible' : 'none';

      // Define marker handlers for re-use
      const handleMouseEnter = (e: any) => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        m.getCanvas().style.cursor = 'pointer';
        const feature = e.features?.[0];
        if (feature) {
          setHoveredListing(feature.properties);
          setHoverPosition(e.point);
        }
      };

      const handleMouseLeave = () => {
        m.getCanvas().style.cursor = '';
        hoverTimeoutRef.current = setTimeout(() => {
          setHoveredListing(null);
          setHoverPosition(null);
        }, 200);
      };

      const handleMarkerClick = (e: any) => {
        const feature = e.features?.[0];
        if (feature) {
          const props = feature.properties;
          const prefix = props?.transaction_type_hashtag === 'cho-thue' ? 'cho-thue' : 'mua-ban';
          router.push(`/${prefix}/bai-dang/${props?.slug}`);
        }
      };

      // 1. Update Planning Source
      if (!m.getSource('planning-source')) {
        m.addSource('planning-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: historyFeatures }
        });
      } else {
        (m.getSource('planning-source') as mapboxgl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: historyFeatures
        });
      }

      // 2. Ensure Planning Layers
      if (!m.getLayer('planning-fill')) {
        const colorMatch: any[] = ['match', ['get', 'land_type']];
        Object.entries(LAND_USE_COLORS).forEach(([code, info]) => {
          colorMatch.push(code, info.color);
        });
        colorMatch.push('#f97316');

        m.addLayer({
          id: 'planning-fill',
          type: 'fill',
          source: 'planning-source',
          paint: {
            'fill-color': colorMatch as any,
            'fill-opacity': 0.3
          }
        });
      }

      if (!m.getLayer('planning-outline')) {
        m.addLayer({
          id: 'planning-outline',
          type: 'line',
          source: 'planning-source',
          paint: {
            'line-color': '#fff',
            'line-width': 1
          }
        });
      }

      // 3. Update Selected Source
      const selectedGeo = selectedInfo?.geo_data || selectedInfo?.segment;
      if (!m.getSource('selected-source')) {
        m.addSource('selected-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: selectedGeo ? [selectedGeo] : [] }
        });
      } else {
        (m.getSource('selected-source') as mapboxgl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: selectedGeo ? [selectedGeo] : []
        });
      }

      // 4. Ensure Selected Layers
      if (!m.getLayer('selected-fill')) {
        m.addLayer({
          id: 'selected-fill',
          type: 'fill',
          source: 'selected-source',
          paint: {
            'fill-color': '#FF3300',
            'fill-opacity': 0.7
          }
        });
      }

      if (!m.getLayer('selected-outline')) {
        m.addLayer({
          id: 'selected-outline',
          type: 'line',
          source: 'selected-source',
          paint: {
            'line-color': '#ffff00',
            'line-width': 4
          }
        });
      }

      // 5. Synchronize Visibility & Order (THE FIX)
      const layers = ['planning-fill', 'planning-outline', 'selected-fill', 'selected-outline'];
      layers.forEach(id => {
        if (m.getLayer(id)) {
          m.setLayoutProperty(id, 'visibility', visibility);
          m.moveLayer(id);
        }
      });

      // 6. Update Listings Source (NEW)
      const mapFeatures = listings.map(l => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [l.longitude, l.latitude]
        },
        properties: {
          ...l,
          transaction_type_hashtag: l.transaction_types?.hashtag || 'mua-ban',
          price_label: (() => {
            const p = l.price_per_m2 ? Number(l.price_per_m2) : (l.price && l.area ? Number(l.price) / Number(l.area) : null);
            return p ? `${(p / 1000000).toFixed(1)} tr/m²` : '';
          })()
        }
      }));

      if (!m.getSource('listings-source')) {
        m.addSource('listings-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: mapFeatures
          }
        });
      } else {
        (m.getSource('listings-source') as mapboxgl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: mapFeatures
        });
      }

      // Check and add layers if they don't exist
      if (!m.getLayer('listings-dots')) {
        // 1. Dot layer (The "chấm vị trí")
        m.addLayer({
          id: 'listings-dots',
          type: 'circle',
          source: 'listings-source',
          paint: {
            'circle-radius': 6,
            'circle-color': '#f97316',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        });

        // Hover & Click events for dots
        m.on('mouseenter', 'listings-dots', handleMouseEnter);
        m.on('mouseleave', 'listings-dots', handleMouseLeave);
        m.on('click', 'listings-dots', handleMarkerClick);
      }

      if (!m.getLayer('listings-labels')) {
        // 2. Label layer (The "chú thích giá")
        m.addLayer({
          id: 'listings-labels',
          type: 'symbol',
          source: 'listings-source',
          filter: ['!=', ['get', 'price_label'], ''],
          layout: {
            'text-field': ['get', 'price_label'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-offset': [0, 1.5],
            'text-anchor': 'top',
            'text-size': 11
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#f97316',
            'text-halo-width': 2
          }
        });

        m.on('mouseenter', 'listings-labels', handleMouseEnter);
        m.on('mouseleave', 'listings-labels', handleMouseLeave);
      }

    } catch (err) {
      console.error('DEBUG: Reconcile error:', err);
    }
  }, [historyFeatures, selectedInfo, showSelectedHighlight, mapStyle, reconcileTrigger, listings]);

  // Special effect to catch edge cases where map is ready but reconcile didn't run for listings
  useEffect(() => {
    if (map.current?.isStyleLoaded() && listings.length > 0) {
      setReconcileTrigger(prev => prev + 1);
    }
  }, [listings.length]);

  // Fetch admin data on load
  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProvinces(data);
          // Initial districts fetch for HCM (79)
          fetch('https://provinces.open-api.vn/api/p/79?depth=2')
            .then(res => res.json())
            .then(pData => {
              if (pData.districts) setDistricts(pData.districts);
            });
        }
      })
      .catch(err => console.error('Failed to load provinces', err));
  }, []);

  useEffect(() => {
    if (selectedProvince && provinces.length > 0) {
      fetch(`https://provinces.open-api.vn/api/p/${selectedProvince}?depth=2`)
        .then(res => res.json())
        .then(data => {
          setDistricts(data.districts || []);
          setSelectedDistrict('');
          setWards([]);
          setSelectedWard('');
        })
        .catch(err => console.error('Failed to load districts', err));
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedDistrict) {
      fetch(`https://provinces.open-api.vn/api/d/${selectedDistrict}?depth=2`)
        .then(res => res.json())
        .then(data => {
          setWards(data.wards || []);
          setSelectedWard('');
        })
        .catch(err => console.error('Failed to load wards', err));
    }
  }, [selectedDistrict]);

  // Fetch listings for the map
  useEffect(() => {
    const fetchMapListings = async () => {
      try {
        const response = await fetch('/api/listings?onMap=true&limit=100');
        const result = await response.json();
        if (result.success) {
          setListings(result.data);
        }
      } catch (err) {
        console.error('Error fetching map listings:', err);
      }
    };
    fetchMapListings();
  }, []);


  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `mapbox://styles/mapbox/${mapStyle}`,
      center: [lng, lat],
      zoom: zoom
    });
    // Use both 'style.load' and 'styledata' for maximum reliability in Mapbox v3
    const triggerReconcile = () => {
      console.log('DEBUG: Map event triggered reconcile - style loaded:', map.current?.isStyleLoaded());
      setReconcileTrigger(prev => prev + 1);
    };

    map.current.on('style.load', () => {
      console.log('DEBUG: Map style.load event fired');
      setIsStyleSwitching(false);
      triggerReconcile();
    });

    map.current.on('styledata', () => {
      console.log('DEBUG: Map styledata event fired');
      // Some styles might take longer, but we keep checking
      triggerReconcile();
    });

    map.current.on('idle', () => {
      console.log('DEBUG: Map idle event fired');
      triggerReconcile();
    });

    map.current.on('click', (e) => {
      console.log('DEBUG: Map click event caught at:', e.lngLat);
      searchHandlerRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showZoom: false }), 'bottom-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const handleSearchByCoord = useCallback(async (latitude: number, longitude: number) => {
    console.log('DEBUG: handleSearchByCoord triggered with:', { latitude, longitude });
    setLoading(true);
    setSelectedInfo(null);
    setShowInfo(false);
    setHistoryFeatures([]);
    setRevGeocodeAddr('');
    fetchReverseGeocode(latitude, longitude);

    try {
      console.log('DEBUG: Fetching planning for coord:', { latitude, longitude });
      const res = await fetch('/api/bestimate/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'coord', lat: latitude, lng: longitude })
      });
      const response = await res.json();
      console.log('DEBUG: Planning API Response received:', response);

      const data = response.data || response;
      if (data && (data.geo_data || data.segment)) {
        updateMapWithData(data);
      } else {
        console.warn('DEBUG: No geo_data or segment in response data:', data);
      }
    } catch (err) {
      console.error('DEBUG: Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchHandlerRef = useRef(handleSearchByCoord);
  useEffect(() => {
    searchHandlerRef.current = handleSearchByCoord;
  }, [handleSearchByCoord]);

  const geocodeAndMove = async () => {
    const provinceObj = provinces.find(p => p.code == selectedProvince);
    const districtObj = districts.find(d => d.code == selectedDistrict);
    const wardObj = wards.find(w => w.code == selectedWard);

    const provinceName = provinceObj?.name || '';
    const districtName = districtObj?.name || '';
    const wardName = wardObj?.name || '';

    const query = [wardName, districtName, provinceName].filter(Boolean).join(', ');
    console.log(`DEBUG: geocodeAndMove query: "${query}"`);

    if (!query) {
      console.warn('DEBUG: Empty query, skipping geocode');
      return;
    }

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&country=vn&limit=1`
      );
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const [targetLng, targetLat] = data.features[0].center;
        console.log(`DEBUG: Geocoding success: ${targetLng}, ${targetLat}`);
        map.current?.flyTo({ center: [targetLng, targetLat], zoom: 15 });
      } else {
        console.warn('DEBUG: No geocoding features found for:', query);
      }
    } catch (err) {
      console.error('DEBUG: Geocoding error:', err);
    }
  };



  const updateMapWithData = (data: any) => {
    console.log('DEBUG: updateMapWithData receiving:', data);
    setSelectedInfo(data);
    setShowInfo(true);

    const geo = data.geo_data || data.segment;
    if (!geo) return;

    // Robust land type extraction for highlighting
    const rawLandType = data.land_type ||
      data.loai_dat_quy_hoach ||
      data.attributes?.loai_dat_quy_hoach ||
      geo.properties?.land_type ||
      'Unknown';

    // Create new feature with properties
    const newFeature = {
      ...geo,
      properties: {
        ...geo.properties,
        land_type: rawLandType,
        map_number: data.map_number || data.land_sheet || data.so_to_ban_do || data.attributes?.so_to_ban_do || geo.properties?.map_sheet,
        lot_number: data.lot_number || data.land_plot || data.so_hieu_thua || data.attributes?.so_hieu_thua || geo.properties?.map_plot,
        id: `${data.map_number || data.land_sheet || data.so_to_ban_do || 'S'}-${data.lot_number || data.land_plot || data.so_hieu_thua || 'P'}-${Date.now()}`
      }
    };

    // Clear history and set current (per user request to show only active)
    setHistoryFeatures([newFeature]);
  };

  // Handle style changes separately with logging and loading state
  useEffect(() => {
    if (!map.current) return;
    const nextStyle = `mapbox://styles/mapbox/${mapStyle}`;
    console.log('DEBUG: Switching map style to:', nextStyle);

    setIsStyleSwitching(true);
    map.current.setStyle(nextStyle);

    // Fallback timer to clear loading state if events fail
    const timer = setTimeout(() => setIsStyleSwitching(false), 2000);
    return () => clearTimeout(timer);
  }, [mapStyle]);



  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Floating Toolbar */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-50 flex items-start gap-4">
        <div className="glass-morphism rounded-2xl border border-white/10 p-2 flex flex-col gap-2 shadow-2xl">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={cn("p-3 rounded-xl transition-all", showSearch ? "bg-orange-500 text-white shadow-lg" : "text-white/60 hover:bg-white/5 hover:text-white")}
            title="Tìm kiếm"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn("p-3 rounded-xl transition-all", showSettings ? "bg-orange-500 text-white shadow-lg" : "text-white/60 hover:bg-white/5 hover:text-white")}
            title="Cài đặt bản đồ"
          >
            <Settings2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowInfo(!showInfo)}
            className={cn("p-3 rounded-xl transition-all", showInfo && selectedInfo ? "bg-orange-500 text-white shadow-lg" : "text-white/60 hover:bg-white/5 hover:text-white")}
            disabled={!selectedInfo}
            title="Thông tin thửa đất"
          >
            <Info className="w-5 h-5" />
          </button>

          <div className="w-full h-px bg-white/10 my-1" />

          <button
            onClick={() => {
              navigator.geolocation.getCurrentPosition((pos) => {
                map.current?.flyTo({
                  center: [pos.coords.longitude, pos.coords.latitude],
                  zoom: 17
                });
              });
            }}
            className="p-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all"
            title="Vị trí của tôi"
          >
            <LocateFixed className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Flyout - Styles only */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              drag
              dragMomentum={false}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-morphism rounded-2xl border border-white/10 p-5 w-64 shadow-2xl space-y-4 cursor-default"
              style={{ zIndex: 100 }}
            >
              <div className="flex items-center justify-between cursor-move pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-white font-bold text-[10px] uppercase tracking-widest opacity-80">Kiểu bản đồ</span>
                </div>
                <button onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'satellite-streets-v12', name: 'Vệ tinh', img: 'mapbox/satellite-v9' },
                  { id: 'streets-v12', name: 'Địa giới', img: 'mapbox/streets-v12' },
                  { id: 'dark-v11', name: 'Nền tối', img: 'mapbox/dark-v11' }
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setMapStyle(style.id as any)}
                    className={cn(
                      "flex items-center gap-4 p-2.5 rounded-xl border transition-all group",
                      mapStyle === style.id ? "border-orange-500 bg-orange-500/10" : "border-white/5 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <div className="w-12 h-12 rounded-lg border border-white/10 overflow-hidden relative flex-shrink-0">
                      <img
                        src={`https://api.mapbox.com/styles/v1/${style.img}/static/${lng},${lat},${Math.max(0, zoom - 2)}/100x100?access_token=${mapboxgl.accessToken}`}
                        alt={style.name}
                        className={cn("w-full h-full object-cover transition-opacity duration-300", mapStyle === style.id ? "opacity-100" : "opacity-40 group-hover:opacity-100")}
                      />
                    </div>
                    <span className={cn("text-xs font-bold transition-colors", mapStyle === style.id ? "text-orange-500" : "text-white/60")}>{style.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Administrative Search Panel */}
      {showSearch && (
        <motion.div
          drag
          dragMomentum={false}
          dragConstraints={mapContainer}
          initial={{ x: 0, y: 0 }}
          className="absolute top-6 left-24 z-50 w-[350px] cursor-default"
        >
          <div className="glass-morphism rounded-3xl border border-white/10 shadow-3xl p-6 space-y-5 animate-in slide-in-from-left-4 duration-300">
            <div className="flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-white/5 pb-3 -mt-2 -mx-2 px-2 hover:bg-white/5 rounded-t-2xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-xl">
                  <MapIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold leading-tight text-sm">Tra cứu địa bàn</h2>
                  <p className="text-white/40 text-[9px] uppercase tracking-widest font-bold">Finland Planning</p>
                </div>
              </div>
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/30 uppercase px-1 font-bold tracking-wider">Tỉnh / Thành phố</label>
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-1 focus:ring-orange-500 transition-all text-sm appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900">-- Chọn Tỉnh/TP --</option>
                  {provinces.map((p: any) => (
                    <option key={p.code} value={p.code} className="bg-slate-900">{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 uppercase px-1 font-bold tracking-wider">Quận / Huyện</label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-1 focus:ring-orange-500 transition-all text-sm appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-slate-900">-- Quận/Huyện --</option>
                    {districts.map((d: any) => (
                      <option key={d.code} value={d.code} className="bg-slate-900">{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 uppercase px-1 font-bold tracking-wider">Phường / Xã</label>
                  <select
                    value={selectedWard}
                    onChange={(e) => setSelectedWard(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-1 focus:ring-orange-500 transition-all text-sm appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-slate-900">-- Phường/Xã --</option>
                    {wards.map((w: any) => (
                      <option key={w.code} value={w.code} className="bg-slate-900">{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>


              <Button
                onClick={geocodeAndMove}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-12 shadow-xl shadow-orange-500/20 font-bold transition-all active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Search className="w-5 h-5 mr-3" />}
                Tìm kiếm quy hoạch
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      <div ref={mapContainer} className="w-full h-full" />

      {/* Style Switching Overlay */}
      <AnimatePresence>
        {isStyleSwitching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-3 bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="text-white font-medium text-sm">Đang tải kiểu bản đồ...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <AnimatePresence mode="wait">
        {selectedInfo && showInfo && (
          <motion.div
            key={`info-${selectedInfo.id || selectedInfo.map_number}-${selectedInfo.lot_number}-${selectedInfo.lat}-${selectedInfo.lng}`}
            drag
            dragMomentum={false}
            dragConstraints={mapContainer}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-4 w-full md:w-[450px] z-50 lg:block hidden flex flex-col"
          >
            {(() => {
              const info = getNormalizedInfo();
              if (!info) return null;

              return (
                <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
                  <div className="p-4 space-y-4 flex-shrink-0">
                    <div className="flex justify-between items-start transition-colors">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-orange-500" />
                          <h3 className="text-lg font-bold text-white tracking-tight">Thông tin thửa đất</h3>
                        </div>
                        <p className="text-white/40 text-[13px] leading-relaxed line-clamp-2 pl-6">
                          {info.address}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowSelectedHighlight(prev => !prev)}
                          className={cn(
                            "p-2 rounded-xl transition-all border",
                            showSelectedHighlight ? "bg-orange-500/10 border-orange-500/50 text-orange-400" : "bg-white/5 border-white/10 text-white/40"
                          )}
                          title={showSelectedHighlight ? "Ẩn bôi màu" : "Hiện bôi màu"}
                        >
                          {showSelectedHighlight ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                        <button onClick={() => setShowInfo(false)} className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all"><X className="w-5 h-5 text-white/40" /></button>
                      </div>
                    </div>

                    <div className="h-px bg-white/5" />
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 pt-0 custom-scrollbar space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] p-4 rounded-2xl border border-white/10 shadow-inner">
                        <div className="flex items-center gap-2 mb-2">
                          <Settings2 className="w-3 h-3 text-orange-500" />
                          <span className="text-white/30 text-[9px] uppercase font-bold tracking-widest block">Tờ / Thửa</span>
                        </div>
                        <p className="text-white font-black text-xl tracking-tight">
                          {info.mapSheet} <span className="text-white/20 font-light mx-1">/</span> {info.plotNumber}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] p-4 rounded-2xl border border-white/10 shadow-inner">
                        <div className="flex items-center gap-2 mb-2">
                          <LocateFixed className="w-3 h-3 text-orange-500" />
                          <span className="text-white/30 text-[9px] uppercase font-bold tracking-widest block">Diện tích</span>
                        </div>
                        <p className="text-white font-black text-xl tracking-tight">
                          {info.area?.toLocaleString() || '--'} <span className="text-xs font-bold text-white/40 ml-1 uppercase">m²</span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-orange-500/20 transition-all duration-700" />
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                          <span className="text-orange-500 font-black text-[10px] uppercase tracking-[0.2em]">Quy hoạch sử dụng đất</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 relative z-10 w-full">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-lg font-black leading-tight tracking-tight mb-1 truncate">
                            {info.landType || 'Thông tin quy hoạch'}
                          </p>
                          <div className="flex items-center gap-2">
                            {info.fullLandType && info.fullLandType !== info.landType && (
                              <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/40 text-[9px] font-bold border border-white/5">
                                {info.fullLandType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>


                    <div className="pt-4 border-t border-white/5">
                      <div className="flex items-start gap-3 text-white/40 p-3 bg-orange-500/[0.03] rounded-xl border border-orange-500/10">
                        <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-relaxed font-medium">Thông tin chỉ mang tính chất tham khảo. Vui lòng kiểm tra lại tại cơ quan chức năng địa phương.</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
      {loading && !selectedInfo && (
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[100] flex items-center justify-center">
          <div className="bg-slate-900 border border-white/10 px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-4 animate-in fade-in zoom-in duration-300">
            <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
            <span className="text-white font-medium tracking-wide">Đang xử lý dữ liệu quy hoạch...</span>
          </div>
        </div>
      )}

      <style jsx global>{`
        .glass-morphism {
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
      <AnimatePresence>
        {hoveredListing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: 'absolute',
              left: hoverPosition?.x || 0,
              top: (hoverPosition?.y || 0) - 10,
              transform: 'translate(-50%, -100%)',
              zIndex: 60,
              pointerEvents: 'auto'
            }}
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
              }
            }}
            onMouseLeave={() => {
              hoverTimeoutRef.current = setTimeout(() => {
                setHoveredListing(null);
                setHoverPosition(null);
              }, 200);
            }}
            onClick={() => {
              const prefix = hoveredListing.transaction_type_hashtag === 'cho-thue' ? 'cho-thue' : 'mua-ban';
              router.push(`/${prefix}/bai-dang/${hoveredListing.slug}`);
            }}
            className="w-[300px] cursor-pointer"
          >
            <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col">
              {hoveredListing.thumbnail_url && (
                <div className="relative aspect-video w-full">
                  <img src={hoveredListing.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider">
                    {hoveredListing.transaction_type_hashtag === 'cho-thue' ? 'Cho thuê' : 'Đang bán'}
                  </div>
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-red-600">
                    {(() => {
                      const price = Number(hoveredListing.price);
                      if (price >= 1000000000) return `${(price / 1000000000).toFixed(2)} Tỷ`;
                      if (price >= 1000000) return `${(price / 1000000).toFixed(0)} Triệu`;
                      return `${price.toLocaleString()} đ`;
                    })()}
                  </span>
                  <span className="text-slate-500 font-bold text-xs">• {hoveredListing.area}m²</span>
                </div>
                <h3 className="text-slate-900 dark:text-white font-bold text-sm line-clamp-2 leading-tight">
                  {hoveredListing.title}
                </h3>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                    <MapPin className="size-3 text-emerald-500" />
                    <span className="truncate">{hoveredListing.address}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-orange-600 dark:text-orange-400 font-black text-[10px] uppercase">
                      {hoveredListing.price_label}
                    </span>
                    <span className="text-slate-400 text-[9px] font-medium italic">
                      {hoveredListing.listing_code}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}