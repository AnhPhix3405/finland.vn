import { customAlphabet } from 'nanoid';

/**
 * Remove Vietnamese diacritics from a string
 */
export function removeVietnameseTones(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^\x00-\x7F]/g, '') // Remove remaining non-ASCII
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Trim hyphens
    .substring(0, 100); // Limit length
}

/**
 * Generate a unique slug with random nanoid suffix
 */
export function generateSlug(title: string): string {
  const baseSlug = removeVietnameseTones(title);
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);
  return `${baseSlug}-${nanoid()}`;
}
