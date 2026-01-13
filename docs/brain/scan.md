# OCR Scanning Implementation Brainstorm

## Overview & Goals

Build OCR functionality using Gemini Flash to extract Japanese text from uploaded images, integrated into the ScanPage workflow. The API contract (`docs/api/ocr.md`) specifies endpoints that return OCR results synchronously.

**Goal**: Enable users to upload images in `web/src/pages/ScanPage.tsx`, send to backend, receive extracted text, and display it for annotation.

---

## Gemini Flash OCR Research

### Capabilities

- **Model**: Gemini 2.5 Flash (or 2.0 Flash)
- **Multimodal Input**: Supports text + image input in single API call
- **OCR Performance**: Optimized for large-scale, low-latency tasks
- **SDK**: Google Gen AI Go SDK (`google.golang.org/genai`)

### Implementation Pattern (from Context7 & codebase)

```go
// Pattern from existing implementation (backend/internal/gemini/client.go)
parts := []*genai.Part{
    {Text: "Extract all Japanese text from this image..."},
    {
        InlineData: &genai.Blob{
            Data:     imageData,
            MIMEType: mimeType, // "image/jpeg", "image/png", "image/webp"
        },
    },
}

cfg := &genai.GenerateContentConfig{
    ResponseMIMEType: "application/json",
    ResponseSchema: &genai.Schema{
        Type: genai.TypeObject,
        Properties: map[string]*genai.Schema{
            "raw_text": {Type: genai.TypeString},
            "language": {Type: genai.TypeString},
        },
        Required: []string{"raw_text", "language"},
    },
}

result, err := client.Models.GenerateContent(ctx, "gemini-2.5-flash", []*genai.Content{{Parts: parts}}, cfg)
```

**Key Points**:
- Use `genai.Blob` with `InlineData` for image bytes + MIME type
- Structured JSON output via `ResponseSchema` ensures reliable parsing
- Model supports Japanese text extraction
- Existing implementation already handles retries, error normalization, JSON parsing

---

## API Contract Analysis

### POST /v1/scans

**Request**:
- Method: `POST`
- Endpoint: `/v1/scans`
- Body: `multipart/form-data` (image file)

**Response**:
```json
{
  "scanId": "uuid",
  "fullText": "...",
  "imageUrl": "..."
}
```

**Key Differences from Existing API** (`/api/scans`):
- **Synchronous OCR**: Returns `fullText` immediately (not async processing)
- **Response Format**: Simpler - just `scanId`, `fullText`, `imageUrl`
- **No Status Tracking**: No `status` or `createdAt` fields

### MVP V1 (Current): No Authentication
For development/testing - skip auth to focus on OCR functionality.

### MVP V2 (Future): Add x-token JWT Authentication
Add `x-token: {jwt}` header requirement for production security.

### GET /v1/scans/{id}

**Request**:
- Method: `GET`
- Endpoint: `/v1/scans/{id}`

**Response**:
```json
{
  "id": "uuid",
  "fullText": "...",
  "imageUrl": "..."
}
```

---

## Implementation Strategy

### 1. Synchronous vs Asynchronous OCR

**Decision: Synchronous for `/v1/scans`**

The API contract requires returning `fullText` in the POST response. This means:
- OCR processing must complete before responding
- Request may take longer (Gemini API latency: typically 1-3 seconds)
- Need timeout handling (recommend 30-60 second timeout)
- Client should show loading state during upload

**Implementation Approach**:
```go
// In handler (pseudo-code)
func (h *Handlers) CreateScanV1(w http.ResponseWriter, r *http.Request) {
    // 1. Parse multipart form
    // 2. Validate image
    // 3. Read image data
    // 4. Call OCR synchronously (with timeout)
    ocrResp, err := h.geminiClient.OCR(ctx, imageData, mimeType)
    // 5. Save scan + OCR result to DB
    // 6. Generate imageUrl
    // 7. Return {scanId, fullText, imageUrl}
}
```

### 2. Authentication

#### MVP V1 (Current): No Authentication
Skip x-token requirement to focus on OCR functionality first. This allows:
- Quick testing of OCR without auth setup
- Focus on core functionality
- Verify OCR works with Japanese text

#### MVP V2 (Future): x-token JWT Authentication
Add `x-token: {jwt}` header requirement for production security.

**Options**:
- **Option A**: Implement JWT validation middleware
  - Validate JWT signature
  - Extract user/session info from claims
  - More secure, production-ready
  - Requires JWT library (e.g., `github.com/golang-jwt/jwt/v5`)

- **Option B**: Temporary MVP - Extract token, validate against sessions
  - Extract x-token header value
  - Use it as session ID (temporary solution)
  - Quick to implement, not secure for production
  - Good for MVP/testing

**For MVP V2 Recommendation**: Start with Option B for quick implementation, migrate to Option A for production.

**Implementation (MVP V2)**:
```go
// Simple middleware for /v1/* routes
func (h *Handlers) validateToken(r *http.Request) (string, error) {
    token := r.Header.Get("x-token")
    if token == "" {
        return "", fmt.Errorf("x-token header required")
    }
    // Option B: Use token as session ID (temporary)
    // Option A: Validate JWT, extract claims
    return token, nil
}
```

### 3. Response Format Mapping

**API Contract Response** → **Database Model Mapping**:

```go
type CreateScanV1Response struct {
    ScanID   string `json:"scanId"`
    FullText string `json:"fullText"`  // From OCRResult.RawText
    ImageURL string `json:"imageUrl"`  // Generated URL: /v1/scans/{id}/image
}
```

**GET Response**:
```go
type GetScanV1Response struct {
    ID       string `json:"id"`        // scanId
    FullText string `json:"fullText"`  // From OCRResult.RawText
    ImageURL string `json:"imageUrl"`  // Generated URL
}
```

### 4. Image URL Generation

**Strategy**: Generate public URL path, not full URL (client-relative)

**Format**: `/v1/scans/{scanId}/image`

**Implementation Options**:
- **Option A**: Create new `/v1/scans/{id}/image` endpoint (separate from `/api/scans/{id}/image`)
- **Option B**: Reuse existing `/api/scans/{id}/image` endpoint
- **Option C**: Serve images directly from file storage with public paths

**Recommendation**: Option A (new endpoint) to keep API versions separate and clean.

**URL Generation**:
```go
imageURL := fmt.Sprintf("/v1/scans/%s/image", scanID)
```

---

## Technical Decisions

### Decision 1: Endpoint Path

- **Path**: `/v1/scans` (new API version)
- **Rationale**: Separates from existing `/api/scans` endpoints, allows versioning

### Decision 2: OCR Processing

- **Synchronous**: Wait for OCR to complete before responding
- **Timeout**: 30-60 seconds (configurable)
- **Error Handling**: Return 500 with error message if OCR fails
- **Rationale**: API contract requires `fullText` in response

### Decision 3: Database Storage

- **Store scan, image, OCR result** (same as existing implementation)
- **Rationale**: Enables GET endpoint and future features (history, bookmarks)

### Decision 4: Image Storage

- **Reuse existing file storage** (`storage.FileStorage`)
- **Rationale**: Consistent with current implementation, already handles persistence

### Decision 5: Authentication Strategy

#### MVP V1 (Current): No Authentication
- **Rationale**: Focus on OCR functionality first, add auth later
- **Pros**: Quick to test, simpler implementation
- **Cons**: No user tracking, no rate limiting

#### MVP V2 (Future): JWT x-token Authentication
- **Rationale**: Production-ready security
- **Pros**: User tracking, rate limiting, secure
- **Cons**: More complex implementation

---

## Implementation Plan

### Phase 1: Backend API Endpoints (MVP V1 - No Auth)

1. **Create `/v1/scans` POST handler**
   - Parse multipart form data
   - Validate image (type, size)
   - Call OCR synchronously with timeout
   - Save scan + image + OCR result to DB
   - Generate imageUrl
   - Return JSON response

2. **Create `/v1/scans/{id}` GET handler**
   - Query scan + OCR result from DB
   - Generate imageUrl
   - Return JSON response

3. **Create `/v1/scans/{id}/image` GET handler**
   - Extract scan ID from path
   - Load image from file storage
   - Return image with proper Content-Type

4. **Add routing in `cmd/server/main.go`**
   - Route `/v1/scans` to new handlers
   - Route `/v1/scans/{id}` to GET handler
   - Route `/v1/scans/{id}/image` to image handler

### Phase 2: Frontend Integration (MVP V1)

1. **Update API client** (`web/src/lib/api.ts`)
   - Add `createScanV1(imageFile: File)` function
   - Add `getScanV1(scanID: string)` function
   - No auth headers needed

2. **Update ScanPage** (`web/src/pages/ScanPage.tsx`)
   - Integrate new API endpoints
   - Handle synchronous OCR (show loading during upload)
   - Display extracted text from `fullText` field
   - Display image from `imageUrl`

3. **Type Definitions** (`web/src/lib/types.ts`)
   - Add `CreateScanV1Response` type
   - Add `GetScanV1Response` type

### Phase 3: Error Handling & Testing (MVP V1)

1. **Error Scenarios**:
   - Invalid image format → 400 Bad Request
   - Image too large → 413 Payload Too Large
   - OCR timeout → 504 Gateway Timeout
   - OCR failure → 500 Internal Server Error

2. **Testing**:
   - Unit tests for handlers
   - Integration tests for full flow
   - Test with Japanese text images

### Phase 4: MVP V2 - Add Authentication

1. **Add x-token JWT validation**
   - Implement JWT middleware or session-based validation
   - Add token extraction from header
   - Validate token before processing requests

2. **Update API client**
   - Add x-token header to requests
   - Handle 401 Unauthorized errors

3. **Update documentation**
   - Document authentication requirements
   - Add API key/JWT token setup instructions

---

## Open Questions / Decisions Needed

1. **Timeout Value**: What timeout for OCR processing? (30s, 60s, configurable?)
   - **Recommendation**: 60 seconds, configurable via env var

2. **Error Response Format**: What format for error responses?
   - **Recommendation**: Standard JSON error: `{"error": "...", "message": "..."}`

3. **CORS Headers**: Should `/v1/*` endpoints include CORS headers?
   - **Recommendation**: Yes, same as `/api/*` endpoints

4. **Rate Limiting**: Should we add rate limiting for `/v1/scans`?
   - **Recommendation**: Add in MVP V2 when adding authentication

5. **JWT Validation (MVP V2)**: Which JWT validation approach to use?
   - **Option A**: Full JWT signature validation
   - **Option B**: Session-based token validation
   - **Recommendation**: Start with Option B for MVP V2, migrate to Option A for production

---

## References

- API Contract: `docs/api/ocr.md`
- Simplified Plan: `docs/brain/scan.md` (this file)
- PRD: `docs/prd.md`
- Existing OCR Implementation: `backend/internal/gemini/client.go`
- Existing Handlers: `backend/internal/handlers/handlers.go`
- Gemini Go SDK Docs: `google.golang.org/genai`
- Context7: Gemini Flash OCR capabilities
