-- V1 scans table aligned with team schema (docs/brain/db-schema.md)
-- This table is separate from legacy scans/scan_images/ocr_results to avoid breaking existing endpoints
CREATE TABLE IF NOT EXISTS v1_scans (
  id TEXT PRIMARY KEY,
  user_id TEXT NULL,
  image_url TEXT NOT NULL,
  full_ocr_text TEXT NULL,
  detected_language TEXT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_v1_scans_user_id ON v1_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_v1_scans_created_at ON v1_scans(created_at);
