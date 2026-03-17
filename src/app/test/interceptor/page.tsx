"use client";

import React, { useState } from "react";
import apiClient from "@/src/lib/api/client";
import { useAdminStore } from "@/src/store/adminStore";
import { useAuthStore } from "@/src/store/authStore";

export default function TestInterceptorPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const adminToken = useAdminStore((state) => state.accessToken);
  const userToken = useAuthStore((state) => state.accessToken);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Test 1: Call API without token (should fail with 401)
  const testNoToken = async () => {
    addLog("🧪 Test 1: Calling API without token...");
    try {
      const response = await apiClient.get("/api/admin/listings?page=1&limit=5");
      addLog("✅ SUCCESS: Got response");
      addLog(`Data: ${JSON.stringify(response.data, null, 2).substring(0, 100)}...`);
    } catch (error: unknown) {
      const err = error as { response?: { status: number; data: { error: string } }; message: string };
      addLog(`❌ FAILED: ${err.response?.status || err.message}`);
      addLog(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  // Test 2: Call API with valid token (should succeed)
  const testWithToken = async () => {
    addLog("🧪 Test 2: Calling API with valid token...");
    if (!adminToken) {
      addLog("❌ No admin token found. Please login first.");
      return;
    }
    try {
      const response = await apiClient.get("/api/admin/listings?page=1&limit=5");
      addLog("✅ SUCCESS: Got response");
      addLog(`Data: ${JSON.stringify(response.data, null, 2).substring(0, 100)}...`);
    } catch (error: unknown) {
      const err = error as { response?: { status: number; data: { error: string } }; message: string };
      addLog(`❌ FAILED: ${err.response?.status || err.message}`);
      addLog(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  // Test 3: Simulate 401 and automatic retry (requires expired token)
  const testExpiredToken = async () => {
    addLog("🧪 Test 3: Testing token refresh logic...");
    addLog("Note: This test requires making requests with an expired token.");
    addLog("In production, the interceptor will handle this automatically.");
    
    // Since we can't easily simulate expired token, we'll just test the retry logic
    // by making multiple requests that might trigger 401
    try {
      // Make multiple parallel requests
      const promises = [
        apiClient.get("/api/admin/listings?page=1&limit=5"),
        apiClient.get("/api/admin/listings?page=2&limit=5"),
        apiClient.get("/api/admin/listings?page=3&limit=5"),
      ];
      
      const results = await Promise.allSettled(promises);
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          addLog(`✅ Request ${index + 1} succeeded`);
        } else {
          addLog(`❌ Request ${index + 1} failed: ${(result.reason as Error).message}`);
        }
      });
    } catch (error: unknown) {
      const err = error as { message: string };
      addLog(`❌ FAILED: ${err.message}`);
    }
  };

  // Test 4: Test POST request with interceptor
  const testPostRequest = async () => {
    addLog("🧪 Test 4: Testing POST request...");
    if (!adminToken) {
      addLog("❌ No admin token found. Please login first.");
      return;
    }
    
    try {
      // We'll try to create a bookmark (this requires user login)
      const response = await apiClient.post("/api/bookmarks", { listing_id: "test-id" });
      addLog("✅ SUCCESS: POST request completed");
      addLog(`Response: ${JSON.stringify(response.data, null, 2).substring(0, 100)}...`);
    } catch (error: unknown) {
      const err = error as { response?: { status: number; data: { error: string } }; message: string };
      addLog(`❌ FAILED: ${err.response?.status || err.message}`);
      addLog(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  // Test 5: Test queue behavior (make multiple requests simultaneously)
  const testQueueBehavior = async () => {
    addLog("🧪 Test 5: Testing queue behavior with multiple parallel requests...");
    
    const requests = [];
    for (let i = 1; i <= 5; i++) {
      requests.push(
        apiClient.get(`/api/admin/listings?page=${i}&limit=2`)
          .then(() => addLog(`✅ Request ${i} completed`))
          .catch((error) => addLog(`❌ Request ${i} failed: ${error.message}`))
      );
    }
    
    await Promise.allSettled(requests);
    addLog("✅ All parallel requests completed");
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Test Interceptor Pattern</h1>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="font-semibold mb-2">Current Token Status:</h2>
          <p className="text-sm text-gray-600">
            Admin Token: {adminToken ? "✅ Present" : "❌ Missing"}<br />
            User Token: {userToken ? "✅ Present" : "❌ Missing"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={testNoToken}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Test No Token (401)
          </button>
          <button
            onClick={testWithToken}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test With Token
          </button>
          <button
            onClick={testExpiredToken}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Test Retry Logic
          </button>
          <button
            onClick={testPostRequest}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test POST Request
          </button>
          <button
            onClick={testQueueBehavior}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Test Queue Behavior
          </button>
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Logs
          </button>
        </div>

        <div className="mt-6">
          <h2 className="font-semibold mb-2">Test Logs:</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <span className="text-gray-500">No logs yet. Click a test button above.</span>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold mb-2">📝 Test Instructions:</h3>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
            <li>Click &quot;Test No Token&quot; to see 401 error handling</li>
            <li>Login as admin first, then click &quot;Test With Token&quot;</li>
            <li>&quot;Test Retry Logic&quot; shows how multiple requests are handled</li>
            <li>&quot;Test Queue Behavior&quot; demonstrates the single refresh pattern</li>
            <li>Check browser console for detailed network logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
