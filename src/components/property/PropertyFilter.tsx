"use client";

import { ChevronDown, ArrowUpDown, Filter } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import LocationSelector from "../feature/LocationSelector";

interface PropertyFilterProps {
  hidePrice?: boolean;
  onFilterChange?: (filters: FilterState) => void;
}

export interface FilterState {
  province?: string;
  ward?: string;
  propertyType?: string;
  priceMin?: string;
  priceMax?: string;
  sortBy?: string;
}

interface PropertyType {
  id: string;
  name: string;
  hashtag: string;
}

const sortOptions = [
  { id: "newest", name: "Mới nhất", value: "newest" },
  { id: "price-asc", name: "Giá: Thấp → Cao", value: "price_asc" },
  { id: "price-desc", name: "Giá: Cao → Thấp", value: "price_desc" },
];

export function PropertyFilter({ hidePrice = false, onFilterChange }: PropertyFilterProps) {
  const [filters, setFilters] = useState<FilterState>({});
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [showPropertyTypes, setShowPropertyTypes] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const propertyTypeRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Fetch property types from API
  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const response = await fetch('/api/property_types?limit=100');
        const data = await response.json();
        if (data.success) {
          setPropertyTypes(data.data);
        }
      } catch (error) {
        console.error('Error fetching property types:', error);
      }
    };
    fetchPropertyTypes();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (propertyTypeRef.current && !propertyTypeRef.current.contains(event.target as Node)) {
        setShowPropertyTypes(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSort(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProvinceChange = (provinceName: string) => {
    setFilters(prev => ({ ...prev, province: provinceName, ward: undefined }));
  };

  const handleWardChange = (wardName: string) => {
    setFilters(prev => ({ ...prev, ward: wardName }));
  };

  const handlePropertyTypeChange = (hashtag: string) => {
    setFilters(prev => ({ ...prev, propertyType: hashtag }));
    setShowPropertyTypes(false);
  };

  const handleSortChange = (sortValue: string) => {
    setFilters(prev => ({ ...prev, sortBy: sortValue }));
    setShowSort(false);
  };

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    // Only update if value is empty or a valid positive number
    if (value === '' || !isNaN(parseFloat(value))) {
      setFilters(prev => ({ ...prev, [type === 'min' ? 'priceMin' : 'priceMax']: value }));
    }
  };

  const validatePriceRange = (): boolean => {
    if (filters.priceMin && filters.priceMax) {
      const min = parseFloat(filters.priceMin);
      const max = parseFloat(filters.priceMax);
      if (min > max) {
        alert('Giá tối thiểu không thể lớn hơn giá tối đa');
        return false;
      }
    }
    return true;
  };

  const handleSearch = () => {
    if (validatePriceRange() && onFilterChange) {
      onFilterChange(filters);
    }
  };

  const getDisplayText = (key: keyof FilterState, defaultText: string) => {
    const value = filters[key];
    if (!value) return defaultText;
    
    if (key === 'propertyType') {
      const type = propertyTypes.find(t => t.hashtag === value);
      return type ? type.name : defaultText;
    }

    if (key === 'sortBy') {
      const sort = sortOptions.find(s => s.value === value);
      return sort ? sort.name : defaultText;
    }
    
    return value || defaultText;
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-sm shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col gap-4 mb-8">
      {/* First Row - Location & Property Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Location Selector */}
        <div className="md:col-span-2">
          <LocationSelector
            selectedProvince={filters.province || ''}
            onProvinceChange={handleProvinceChange}
            selectedWard={filters.ward || ''}
            onWardChange={handleWardChange}
          />
        </div>

        {/* Property Type Dropdown */}
        <div className="flex flex-col gap-2 relative" ref={propertyTypeRef}>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Loại hình
          </label>
          <button 
            onClick={() => setShowPropertyTypes(!showPropertyTypes)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 rounded-sm text-sm font-medium transition-colors text-slate-700 dark:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            {getDisplayText('propertyType', 'Chọn loại hình')}
            <ChevronDown className="text-slate-400 w-4 h-4" aria-hidden="true" />
          </button>
          
          {showPropertyTypes && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm shadow-lg z-50 max-h-60 overflow-y-auto">
              {propertyTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handlePropertyTypeChange(type.hashtag)}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {type.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Second Row - Price & Sort */}
      <div className="flex flex-wrap gap-4 items-end">
        {!hidePrice && (
          <>
            {/* Min Price */}
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Giá tối thiểu (VND)
              </label>
              <input
                type="number"
                placeholder="Giá tối thiểu"
                value={filters.priceMin || ''}
                onChange={(e) => handlePriceChange('min', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 rounded-sm text-sm font-medium transition-colors text-slate-700 dark:text-slate-300 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>

            {/* Max Price */}
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Giá tối đa (VND)
              </label>
              <input
                type="number"
                placeholder="Giá tối đa"
                value={filters.priceMax || ''}
                onChange={(e) => handlePriceChange('max', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 rounded-sm text-sm font-medium transition-colors text-slate-700 dark:text-slate-300 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>
          </>
        )}

        {/* Sort Dropdown */}
        <div className="flex-1 min-w-[180px] relative" ref={sortRef}>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            Sắp xếp
          </label>
          <button 
            onClick={() => setShowSort(!showSort)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 rounded-sm text-sm font-medium transition-colors text-slate-700 dark:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <span className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" aria-hidden="true" />
              {getDisplayText('sortBy', 'Sắp xếp')}
            </span>
            <ChevronDown className="text-slate-400 w-4 h-4" aria-hidden="true" />
          </button>
          
          {showSort && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm shadow-lg z-50 max-h-60 overflow-y-auto">
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSortChange(option.value)}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {option.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Button */}
        <button 
          onClick={handleSearch}
          className="bg-emerald-600 text-white font-bold px-8 py-2.5 rounded-sm hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <Filter className="w-4 h-4" aria-hidden="true" />
          Lọc
        </button>
      </div>
    </div>
  );
}
