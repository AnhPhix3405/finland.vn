# SQL Commands for Database Updates

Execute these SQL commands on your PostgreSQL database to add the required fields and indexes.

## 1. Add views_count column to listings table (if not exists)

```sql
ALTER TABLE listings ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
```

## 2. Add index on slug column for faster lookups (if not exists)

```sql
CREATE INDEX IF NOT EXISTS idx_listings_slug ON listings(slug);
```

## 3. Add index on attachments for faster lookups by target

```sql
CREATE INDEX IF NOT EXISTS idx_attachments_target_id_type ON attachments(target_id, target_type);
```

## 4. Add index on created_at for sorting (if you want to track creation time)

```sql
ALTER TABLE listings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
```

## Verify indexes

```sql
-- Check existing indexes on listings table
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'listings';

-- Check existing indexes on attachments table
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'attachments';
```
