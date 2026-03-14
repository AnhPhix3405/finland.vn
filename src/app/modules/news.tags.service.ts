// Server-side news tags service - handles tag processing for news articles

import { prisma } from '@/src/lib/prisma';

export interface NewsTag {
  id: string;
  name: string;
  slug: string;
}

/**
 * Generate slug from tag name
 */
function generateTagSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Find existing tag by name (case insensitive)
 */
async function findTagByName(name: string): Promise<NewsTag | null> {
  try {
    const tag = await prisma.tags.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        slug: true
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
async function createTag(name: string): Promise<NewsTag | null> {
  try {
    const slug = generateTagSlug(name);
    
    // Check if slug already exists
    const existingTag = await prisma.tags.findUnique({
      where: { slug }
    });
    
    if (existingTag) {
      return {
        id: existingTag.id,
        name: existingTag.name,
        slug: existingTag.slug
      };
    }
    
    const tag = await prisma.tags.create({
      data: {
        name,
        slug
      },
      select: {
        id: true,
        name: true,
        slug: true
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
 */
async function findOrCreateTag(name: string): Promise<NewsTag | null> {
  try {
    // First try to find existing tag
    const tag = await findTagByName(name);
    
    if (tag) {
      return tag;
    }

    // Create new tag if not found
    return await createTag(name);
  } catch (error) {
    console.error('Error in findOrCreateTag:', error);
    return null;
  }
}

/**
 * Process tags for a news article
 * - Accepts tag names (strings)
 * - Finds or creates tags
 * - Creates news_tags junction records
 * - Returns processed tags
 */
export async function processNewsTagsForCreation(
  tagNames: string[],
  newsId: string
): Promise<NewsTag[]> {
  const processedTags: NewsTag[] = [];

  for (const tagName of tagNames) {
    if (tagName.trim()) {
      const tag = await findOrCreateTag(tagName.trim());
      if (tag) {
        try {
          // Create junction record in news_tags
          await prisma.news_tags.create({
            data: {
              news_id: newsId,
              tag_id: tag.id
            }
          });
          processedTags.push(tag);
        } catch (error) {
          console.error(`Error creating news_tags record for tag ${tag.id}:`, error);
        }
      }
    }
  }

  return processedTags;
}

/**
 * Update tags for an existing news article
 * - Deletes old news_tags records
 * - Creates new ones for provided tag names
 */
export async function updateNewsTags(
  newsId: string,
  tagNames: string[]
): Promise<NewsTag[]> {
  try {
    // Delete existing news_tags records for this news
    await prisma.news_tags.deleteMany({
      where: {
        news_id: newsId
      }
    });

    // Process and create new tags
    const processedTags: NewsTag[] = [];

    for (const tagName of tagNames) {
      if (tagName.trim()) {
        const tag = await findOrCreateTag(tagName.trim());
        if (tag) {
          try {
            await prisma.news_tags.create({
              data: {
                news_id: newsId,
                tag_id: tag.id
              }
            });
            processedTags.push(tag);
          } catch (error) {
            console.error(`Error creating news_tags record for tag ${tag.id}:`, error);
          }
        }
      }
    }

    return processedTags;
  } catch (error) {
    console.error('Error updating news tags:', error);
    return [];
  }
}
