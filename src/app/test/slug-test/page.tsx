"use client";

import { useState } from "react";
import { customAlphabet } from "nanoid";
import { removeVietnameseTones } from "@/src/lib/slug-utils";

export default function SlugTestPage() {
  const [title, setTitle] = useState("Việt Nam đẩy mạnh kiểm soát đầu cơ bất động sản trong năm 2026");
  const [slug, setSlug] = useState("");

  const handleGenerateSlug = () => {
    const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);
    const baseSlug = removeVietnameseTones(title);
    const randomSuffix = nanoid();
    const finalSlug = `${baseSlug}-${randomSuffix}`;
    setSlug(finalSlug);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(slug);
    alert("Đã copy slug: " + slug);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Slug Generation Test</h1>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title Input
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter title..."
          />
        </div>

        <button
          onClick={handleGenerateSlug}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 mb-6"
        >
          Generate Slug
        </button>

        {slug && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Generated Slug
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={slug}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
              <button
                onClick={handleCopyToClipboard}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-50 rounded-md">
          <h2 className="font-semibold mb-2">Test Results:</h2>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap">
            {`Title: ${title}
Base slug: ${removeVietnameseTones(title)}
Final slug: ${slug}

Format: {base-slug}-{random-string}`}
          </pre>
        </div>
      </div>
    </div>
  );
}