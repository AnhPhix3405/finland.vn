"use client";

import { useAuthStore } from "@/src/store/authStore";
import { useUserStore } from "@/src/store/userStore";
import { updateBroker } from "@/src/app/modules/broker.service";
import { uploadBrokerAvatar } from "@/src/app/modules/upload.service";
import { useEffect, useState } from "react";

export default function DebugBrokerPage() {
  const { isAuthenticated } = useAuthStore();
  const { user } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  const testUpdateBroker = async () => {
    if (!user?.phone) return;
    
    const testData = {
      full_name: user.full_name + " (Updated)",
      email: user.email || "test@example.com",
      province: "Test Province",
    };

    const result = await updateBroker(user.phone, testData);
    setTestResult(result);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Debug Broker Updates</h1>
      
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Current User State</h2>
          {user ? (
            <div className="space-y-2 text-sm">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Phone:</strong> {user.phone}</p>
              <p><strong>Full Name:</strong> {user.full_name}</p>
              <p><strong>Phone:</strong> {user.phone}</p>
              <p><strong>Email:</strong> {user.email || "N/A"}</p>
              <p><strong>Province:</strong> {user.province || "N/A"}</p>
              <p><strong>Avatar URL:</strong> {user.avatar_url || "N/A"}</p>
            </div>
          ) : (
            <p>❌ No user data</p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Test Update Broker</h2>
          
          <button
            onClick={testUpdateBroker}
            disabled={!user?.phone}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Test Update Broker
          </button>

          {testResult && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <h3 className="font-semibold mb-2">Test Result:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Test Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
            <li>Make sure you&apos;re logged in</li>
            <li>Click &quot;Test Update Broker&quot;</li>
            <li>Check if broker data gets updated in the user store</li>
            <li>Go to <a href="/tai-khoan" className="underline">account page</a> to test full form</li>
            <li>Try uploading an avatar</li>
          </ol>
        </div>
      </div>
    </div>
  );
}