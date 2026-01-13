CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL, 
    -- 'google', 'apple', 'github'
    provider VARCHAR(50) NOT NULL,
    -- The unique 'sub' (subject) or user ID returned by the OAuth provider
    provider_id VARCHAR(255) NOT NULL,
    -- User profile picture from OAuth (optional but nice for UI)
    avatar_url TEXT,
    
    preferred_language VARCHAR(10) DEFAULT 'ID', 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure one user record per provider identity
    UNIQUE (provider, provider_id)
);

-- 2. Scans: Represents the "Scan History" and the raw OCR result
CREATE TABLE scans (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL, -- S3/Storage link
    full_ocr_text TEXT, -- The raw text extracted from the entire image
    detected_language VARCHAR(10), -- The language detected in the image
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Annotations (Bookmarks): The specific words/sentences the user highlighted and saved
CREATE TABLE annotations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    scan_id BIGINT REFERENCES scans(id) ON DELETE SET NULL,
    
    -- The specific word/sentence highlighted
    highlighted_text TEXT NOT NULL,
    
    -- Context is crucial for LLMs. Store the surrounding sentence/paragraph.
    context_text TEXT, 
    
    -- JSONB column to store the LLM output structure strictly
    -- Expected structure: 
    -- {
    --   "meaning": "...",
    --   "usage_example": "...",
    --   "word_breakdown": "...",
    --   "alternative_meaning": "..."
    -- }
    nuance_data JSONB NOT NULL,
    
    is_bookmarked BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast retrieval of history and bookmarks
CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_annotations_user_id ON annotations(user_id);