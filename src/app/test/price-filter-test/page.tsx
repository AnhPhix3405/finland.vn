"use client";

import { useState } from "react";
import { getListings } from "@/src/app/modules/listings.service";

interface ListingData {
  id: string;
  title: string;
  price: string | number;
  area?: string | number;
  ward: string;
  province: string;
  [key: string]: unknown;
}

interface TestResults {
  data: ListingData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function PriceFilterTestPage() {
  const [results, setResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testPriceFilter = async (priceMin?: string, priceMax?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Testing price filter with:', { priceMin, priceMax });
      
      const result = await getListings({
        page: 1,
        limit: 5,
        hashtags: ['mua-ban'],
        priceMin,
        priceMax,
        sortBy: 'newest'
      });
      
      console.log('🧪 Test result:', result);
      setResults(result as TestResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('🧪 Test error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Price Filter Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => testPriceFilter('1000000', '5000000')}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test: 1M - 5M
        </button>
        
        <button
          onClick={() => testPriceFilter('5000000', '10000000')}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test: 5M - 10M
        </button>
        
        <button
          onClick={() => testPriceFilter('10000000', undefined)}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test: Min 10M (No Max)
        </button>
        
        <button
          onClick={() => testPriceFilter(undefined, '10000000')}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test: Max 10M (No Min)
        </button>
        
        <button
          onClick={() => testPriceFilter()}
          className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 md:col-span-2"
        >
          Test: No Price Filter
        </button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-lg">Loading...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-bold mb-2">Results Summary</h2>
            <p>Total Listings: {results.data.length}</p>
            <p>Pagination: Page {results.pagination.page} of {results.pagination.totalPages}</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold">Listings:</h3>
            {results.data.map((listing: ListingData, idx: number) => (
              <div key={listing.id || idx} className="bg-white p-4 border rounded shadow">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold">{listing.title}</p>
                    <p className="text-sm text-gray-600">{listing.ward}, {listing.province}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{listing.price ? String(listing.price) : "N/A"}</p>
                    <p className="text-sm text-gray-600">{listing.area || "N/A"} m²</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <details className="bg-gray-100 p-4 rounded">
            <summary className="cursor-pointer font-bold">Raw JSON Data</summary>
            <pre className="mt-4 overflow-auto text-xs bg-white p-4 rounded">
              {JSON.stringify(results.data[0], null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
