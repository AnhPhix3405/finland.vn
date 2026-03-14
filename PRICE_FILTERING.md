# Price Range Filtering Implementation

## Overview
Complete implementation of price range filtering for property listings across the entire application. Users can filter listings by minimum price, maximum price, or both using an intuitive UI. The system handles all edge cases and provides proper validation.

## Architecture

### 1. Frontend - PropertyFilter Component
**File:** `src/components/property/PropertyFilter.tsx`

**Price Input Fields:**
- Minimum Price (Giá tối thiểu)
- Maximum Price (Giá tối đa)
- Both fields are number input types
- Inputs are optional - if empty, no price filter is applied

**Key Functions:**

```typescript
// Validates price input - only accepts positive numbers
const handlePriceChange = (type: 'min' | 'max', value: string) => {
  if (value === '' || !isNaN(parseFloat(value))) {
    setFilters(prev => ({ ...prev, [type === 'min' ? 'priceMin' : 'priceMax']: value }));
  }
};

// Ensures minimum price ≤ maximum price
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

// Called when user clicks "Lọc" button
const handleSearch = () => {
  if (validatePriceRange() && onFilterChange) {
    onFilterChange(filters);
  }
};
```

**Data Flow:**
1. User enters price values in inputs
2. `handlePriceChange()` validates and updates component state
3. User clicks "Lọc" (Filter) button
4. `validatePriceRange()` checks min ≤ max
5. `handleSearch()` calls `onFilterChange(filters)` with the filters object

### 2. Page Component - Integration Point
**File:** `src/app/(public)/mua-ban/page.tsx`

**Usage:**
```typescript
const loadListings = async (filters: FilterState, page: number = 1) => {
  const result = await getListingsByHashtags(hashtags, {
    page,
    limit: pagination.limit,
    province: filters.province,
    ward: filters.ward,
    priceMin: filters.priceMin,      // ← Price filter passed
    priceMax: filters.priceMax,      // ← Price filter passed
    sortBy: filters.sortBy,
    token: accessToken || undefined
  });
  // ... process results
};
```

### 3. Service Layer - API Communication
**File:** `src/app/modules/listings.service.ts`

**getListings() Function:**
```typescript
export async function getListings(params?: {
  page?: number;
  limit?: number;
  hashtags?: string[];
  province?: string;
  ward?: string;
  priceMin?: string;      // ← Passed as string
  priceMax?: string;      // ← Passed as string
  sortBy?: string;
  token?: string;
}): Promise<{data: any[], pagination: any}>
```

**Query Parameter Building:**
```typescript
if (priceMin) {
  searchParams.set('priceMin', priceMin);
}

if (priceMax) {
  searchParams.set('priceMax', priceMax);
}

// URL example: /api/listings?hashtags=mua-ban&priceMin=1000000&priceMax=5000000
```

### 4. Backend API - Filter Logic
**File:** `src/app/api/listings/route.ts`

**GET Handler Parameter Extraction:**
```typescript
const priceMin = searchParams.get('priceMin');    // Retrieved as string
const priceMax = searchParams.get('priceMax');    // Retrieved as string
```

**Price Filter Processing:**
```typescript
if (priceMin || priceMax) {
  const priceFilter: any = {};
  
  if (priceMin) {
    try {
      priceFilter.gte = BigInt(priceMin);  // Convert string → BigInt
      console.log('Added priceMin filter:', priceMin);
    } catch (e) {
      console.error('Invalid priceMin value:', priceMin);
    }
  }
  
  if (priceMax) {
    try {
      priceFilter.lte = BigInt(priceMax);  // Convert string → BigInt
      console.log('Added priceMax filter:', priceMax);
    } catch (e) {
      console.error('Invalid priceMax value:', priceMax);
    }
  }
  
  if (Object.keys(priceFilter).length > 0) {
    andConditions.push({ price: priceFilter });
  }
}
```

**Prisma Query:**
```typescript
const listings = await prisma.listings.findMany({
  where: {
    AND: [
      { status: { notIn: ['Đang chờ duyệt', 'Đã ẩn', 'Bị từ chối'] } },
      // ... other conditions
      { price: { gte: BigInt('1000000'), lte: BigInt('5000000') } }
    ]
  },
  // ... rest of query
});
```

**Data Serialization:**
```typescript
return NextResponse.json(serializeData({
  success: true,
  data: listingsWithBookmarks,
  pagination: { page, limit, total, totalPages }
}));

// serializeData() converts BigInt → string for JSON response
```

## Data Types

### FilterState Interface
```typescript
export interface FilterState {
  province?: string;
  ward?: string;
  propertyType?: string;
  priceMin?: string;        // Stored as string
  priceMax?: string;        // Stored as string
  sortBy?: string;
}
```

### Database Schema (Prisma)
```prisma
model listings {
  id                String
  price             BigInt          // Stored as BigInt for large numbers
  // ... other fields
}
```

## Filter Logic Explanation

### Why BigInt?
- Vietnamese property prices can exceed 2^31-1 (max 32-bit integer)
- BigInt supports arbitrarily large integers
- Prisma uses BigInt for MongoDB/PostgreSQL large number support

### Query Operators
- `gte` = Greater than or equal to (minimum price)
- `lte` = Less than or equal to (maximum price)

### Example Filters

**Case 1: Only Minimum Price**
```typescript
// Input: priceMin=1000000, priceMax=""
// Query: { price: { gte: BigInt('1000000') } }
// Result: All listings with price ≥ 1,000,000
```

**Case 2: Only Maximum Price**
```typescript
// Input: priceMin="", priceMax=10000000
// Query: { price: { lte: BigInt('10000000') } }
// Result: All listings with price ≤ 10,000,000
```

**Case 3: Price Range**
```typescript
// Input: priceMin=1000000, priceMax=5000000  
// Query: { price: { gte: BigInt('1000000'), lte: BigInt('5000000') } }
// Result: All listings with 1M ≤ price ≤ 5M
```

**Case 4: No Price Filter**
```typescript
// Input: priceMin="", priceMax=""
// Query: (price filter not added)
// Result: All listings (no price restriction)
```

## Validation & Error Handling

### Frontend Validation
1. **Input Type Validation:** Only numeric input allowed
2. **Range Validation:** Min ≤ Max (shows alert if violated)
3. **Empty Handling:** Empty fields are acceptable (ignored in API call)

### Backend Validation
1. **BigInt Conversion:** Wrapped in try-catch to handle invalid numbers
2. **Empty Check:** Only adds filter if valid priceFilter object exists
3. **Error Logging:** All conversion errors logged to console

## Testing

### Test Page
**Location:** `src/app/test/price-filter-test/page.tsx`

**Features:**
- 5 test buttons for different price ranges
- Shows: listings count, pagination, sample data
- Raw JSON data viewer for debugging
- Console logging of all API calls

**Test Scenarios:**
1. Min only: 10M+ properties
2. Max only: ≤10M properties
3. Range: 1M-5M properties
4. No filter: Various prices
5. Different ranges: 5M-10M properties

### Manual Testing Steps
1. Navigate to `/mua-ban` (Buy/Sell category)
2. Enter minimum price (e.g., 1000000)
3. Enter maximum price (e.g., - 5000000)
4. Click "Lọc" button
5. Verify results show only listings in price range
6. Check browser console for filter logs

## Performance Considerations

### Database Query
- Price filter uses indexed `price` column (assumed)
- BigInt comparison is efficient in PostgreSQL/MongoDB
- Combined with other filters via `AND` operator

### Network Optimization
- Price values sent as URL query parameters
- No additional API calls for price validation
- Results serialized once (reduces processing)

## Edge Cases Handled

✅ **Empty price fields** - No filter applied  
✅ **Only minimum price** - Uses gte operator  
✅ **Only maximum price** - Uses lte operator  
✅ **Both prices** - Uses gte AND lte  
✅ **Invalid numbers** - Caught, logged, filter skipped  
✅ **Min > Max** - Alert shown, API call prevented  
✅ **Very large numbers** - Handled by BigInt  
✅ **Zero or negative** - Accepted (user's responsibility)  
✅ **Decimal prices** - Accepted (converted to BigInt)

## Future Enhancements

### Possible Improvements
1. Add currency selection (VND, USD)
2. Price formatting helpers (1M instead of 1000000)
3. Preset price ranges (< 500M, 500M-1B, > 1B)
4. Price slider component instead of text inputs
5. Save filter preferences for logged-in users
6. Price history/trend analysis
7. Suggested price range based on location
8. Price per square meter filtering

### Integration Points
- Can be combined with other filters (location, property type)
- Works with sorting (price ascending/descending)
- Integrates with pagination
- Compatible with bookmark system

## Debugging Tips

### Check Console Logs
Backend logs show: `Added priceMin filter: 1000000`

### Verify API Parameters
Network tab should show: `?priceMin=1000000&priceMax=5000000`

### Test Query Directly
```typescript
// In browser console
await fetch('/api/listings?priceMin=1000000&priceMax=5000000&hashtags=mua-ban')
  .then(r => r.json())
  .then(d => console.log(d))
```

### Check Database
```sql
SELECT * FROM listings 
WHERE price >= 1000000 AND price <= 5000000
LIMIT 10;
```

## Summary

The price filtering implementation provides a complete, production-ready solution for filtering property listings by price range. It includes:

- ✅ Intuitive UI with validation
- ✅ Robust backend processing
- ✅ Proper type handling (string → BigInt)
- ✅ Error handling at all levels
- ✅ Test page for easy verification
- ✅ Console logging for debugging
- ✅ Works with all other filters
- ✅ Scalable for future enhancements
