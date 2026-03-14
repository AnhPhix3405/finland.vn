// Server-side tags service - uses prisma directly, only for server-side usage

import { prisma } from '@/src/lib/prisma';

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
 * Generate slug from tag name
 */
export function generateTagSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Find existing tag by name (case insensitive)
 */
export async function findTagByName(name: string): Promise<Tag | null> {
  try {
    const tag = await prisma.tags.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });
    return tag;
  } catch (error) {
    console.error('Error finding tag by name:', error);
    return null;
  }
}

/**
 * Create new tag
 */
export async function createTag(data: CreateTagData): Promise<Tag | null> {
  try {
    const tag = await prisma.tags.create({
      data: {
        name: data.name,
        slug: data.slug,
        listing_id: data.listing_id || null
      }
    });
    return tag;
  } catch (error) {
    console.error('Error creating tag:', error);
    return null;
  }
}

/**
 * Find existing tag or create new one if not exists
 * If listing_id is provided, it will be associated with the tag
 */
export async function findOrCreateTag(name: string, listing_id?: string): Promise<Tag | null> {
  try {
    // First try to find existing tag
    let existingTag = await findTagByName(name);
    
    if (existingTag) {
      // If we have a listing_id and the tag doesn't have one, update it
      if (listing_id && !existingTag.listing_id) {
        existingTag = await prisma.tags.update({
          where: { id: existingTag.id },
          data: { listing_id }
        });
      }
      return existingTag;
    }

    // Create new tag if not found
    const slug = generateTagSlug(name);
    return await createTag({
      name,
      slug,
      listing_id
    });
    
  } catch (error) {
    console.error('Error in findOrCreateTag:', error);
    return null;
  }
}

/**
 * Process multiple tags - find existing or create new ones
 */
export async function processTagsForListing(tagNames: string[], listing_id: string): Promise<Tag[]> {
  const processedTags: Tag[] = [];
  
  for (const tagName of tagNames) {
    if (tagName.trim()) {
      const tag = await findOrCreateTag(tagName.trim(), listing_id);
      if (tag) {
        processedTags.push(tag);
      }
    }
  }
  
  return processedTags;
}

/**
 * Get all tags for a listing
 */
export async function getTagsForListing(listing_id: string): Promise<Tag[]> {
  try {
    const tags = await prisma.tags.findMany({
      where: {
        listing_id: listing_id
      },
      orderBy: {
        created_at: 'asc'
      }
    });
    return tags;
  } catch (error) {
    console.error('Error getting tags for listing:', error);
    return [];
  }
}

/**
 * Get all unique tag names (for autocomplete/suggestions) - Direct version for server-side
 */
export async function getAllTagNames(): Promise<string[]> {
  try {
    const tags = await prisma.tags.findMany({
      select: {
        name: true
      },
      distinct: ['name'],
      orderBy: {
        name: 'asc'
      }
    });
    return tags.map(tag => tag.name);
  } catch (error) {
    console.error('Error getting all tag names:', error);
    return [];
  }
}

/**
 * Remove tags associated with a listing
 */
export async function removeTagsForListing(listing_id: string): Promise<boolean> {
  try {
    await prisma.tags.deleteMany({
      where: {
        listing_id: listing_id
      }
    });
    return true;
  } catch (error) {
    console.error('Error removing tags for listing:', error);
    return false;
  }
}