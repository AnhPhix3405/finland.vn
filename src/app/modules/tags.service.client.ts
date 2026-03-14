// Client-side tags service - only calls API endpoints, no direct prisma usage

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at?: Date | null;
  listing_id?: string | null;
}

export interface CreateTagData {
  name: string;
  slug: string;
  listing_id?: string;
}

/**
 * Get all unique tag names for autocomplete/suggestions - API call only
 */
export async function getAllTagNamesAPI(query?: string): Promise<string[]> {
  try {
    const searchParams = query ? `?q=${encodeURIComponent(query)}` : '';
    const response = await fetch(`/api/tags${searchParams}`);
    const result = await response.json();
    
    if (result.success) {
      return result.data || [];
    } else {
      console.error('Error fetching tag names from API:', result.error);
      return [];
    }
  } catch (error) {
    console.error('Error calling getAllTagNamesAPI:', error);
    return [];
  }
}

/**
 * Process/sync tags for a listing by calling the API
 */
export async function processTagsForListingClient(tags: string[], listingId: string): Promise<Tag[]> {
  try {
    const response = await fetch('/api/tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tags,
        listing_id: listingId
      }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data || [];
    } else {
      console.error('Error processing tags from API:', result.error);
      return [];
    }
  } catch (error) {
    console.error('Error calling processTagsForListingClient:', error);
    return [];
  }
}