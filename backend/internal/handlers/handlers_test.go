package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/textproto"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/gemini-hackathon/app/internal/config"
	"github.com/gemini-hackathon/app/internal/gemini"
	"github.com/gemini-hackathon/app/internal/models"
	"github.com/gemini-hackathon/app/internal/testutil"
)

func TestHealthz(t *testing.T) {
	mockDB := &testutil.MockDB{}
	mockFileStorage := &testutil.MockFileStorage{}
	mockGeminiClient := &testutil.MockGeminiClient{}
	cfg := &config.Config{
		MaxUploadSize: 10 * 1024 * 1024,
	}

	h, err := NewHandlers(mockDB, mockFileStorage, mockGeminiClient, cfg)
	if err != nil {
		t.Fatalf("Failed to create handlers: %v", err)
	}

	req := httptest.NewRequest("GET", "/healthz", nil)
	rr := httptest.NewRecorder()

	h.Healthz(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rr.Code)
	}

	if rr.Body.String() != "ok" {
		t.Errorf("Expected body 'ok', got %s", rr.Body.String())
	}
}

func TestHome(t *testing.T) {
	mockDB := &testutil.MockDB{}
	mockFileStorage := &testutil.MockFileStorage{}
	mockGeminiClient := &testutil.MockGeminiClient{}
	cfg := &config.Config{
		MaxUploadSize: 10 * 1024 * 1024,
	}

	h, err := NewHandlers(mockDB, mockFileStorage, mockGeminiClient, cfg)
	if err != nil {
		t.Fatalf("Failed to create handlers: %v", err)
	}

	req := httptest.NewRequest("GET", "/", nil)
	rr := httptest.NewRecorder()

	h.Home(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rr.Code)
	}

	body := rr.Body.String()
	if !bytes.Contains([]byte(body), []byte("htmx")) && !bytes.Contains([]byte(body), []byte("tailwind")) {
		t.Log("Warning: Template may not include HTMX or Tailwind markers")
	}
}

func TestGetScan_HTMXReturnsFragment(t *testing.T) {
	scanID := "scan123"
	mockDB := &testutil.MockDB{
		GetScanWithOCRFunc: func(ctx context.Context, id string) (*models.Scan, *models.OCRResult, error) {
			if id != scanID {
				t.Fatalf("expected scanID %q, got %q", scanID, id)
			}
			return &models.Scan{
				ID:        scanID,
				SessionID: "session1",
				Source:    "upload",
				Status:    "uploaded",
				CreatedAt: time.Now(),
			}, nil, nil
		},
	}
	mockFileStorage := &testutil.MockFileStorage{}
	mockGeminiClient := &testutil.MockGeminiClient{}
	cfg := &config.Config{
		MaxUploadSize: 10 * 1024 * 1024,
	}

	h, err := NewHandlers(mockDB, mockFileStorage, mockGeminiClient, cfg)
	if err != nil {
		t.Fatalf("Failed to create handlers: %v", err)
	}

	req := httptest.NewRequest("GET", "/scans/"+scanID, nil)
	req.Header.Set("HX-Request", "true")
	rr := httptest.NewRecorder()

	h.GetScan(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d", rr.Code)
	}

	body := rr.Body.String()
	if strings.Contains(body, "<!DOCTYPE html>") {
		t.Fatalf("Expected fragment HTML, got full page HTML")
	}
	if !strings.Contains(body, "id=\"ocr-status-container\"") {
		t.Fatalf("Expected ocr status container fragment, got: %s", body)
	}
}

func loadTestImage() ([]byte, error) {
	wd, _ := os.Getwd()
	imagePath := filepath.Join(wd, "..", "..", "..", "image", "japanese-text1.jpg")
	return os.ReadFile(imagePath)
}

func TestCreateScanV1_Success_ReturnsContractShape(t *testing.T) {
	imageData, err := loadTestImage()
	if err != nil {
		t.Fatalf("Failed to load test image: %v", err)
	}

	var createdScan *models.V1Scan

	mockDB := &testutil.MockDB{
		CreateV1ScanFunc: func(ctx context.Context, scan *models.V1Scan) error {
			createdScan = scan
			return nil
		},
	}

	mockFileStorage := &testutil.MockFileStorage{
		SaveImageFunc: func(scanID string, data []byte, mimeType string) (string, *string, error) {
			return "/mock/storage/path", nil, nil
		},
	}

	mockGeminiClient := &testutil.MockGeminiClient{
		OCRFunc: func(ctx context.Context, imageData []byte, mimeType string) (*gemini.OCRResponse, error) {
			return &gemini.OCRResponse{
				RawText:        "テスト用の日本語テキスト",
				StructuredJSON: `{"raw_text":"テスト用の日本語テキスト","language":"ja"}`,
				Language:       "ja",
			}, nil
		},
	}

	cfg := &config.Config{
		MaxUploadSize: 10 * 1024 * 1024,
	}

	h, err := NewHandlers(mockDB, mockFileStorage, mockGeminiClient, cfg)
	if err != nil {
		t.Fatalf("Failed to create handlers: %v", err)
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	
	header := make(textproto.MIMEHeader)
	header.Set("Content-Disposition", `form-data; name="image"; filename="japanese-text1.jpg"`)
	header.Set("Content-Type", "image/jpeg")
	
	part, err := writer.CreatePart(header)
	if err != nil {
		t.Fatalf("Failed to create form file: %v", err)
	}
	if _, err := part.Write(imageData); err != nil {
		t.Fatalf("Failed to write image data: %v", err)
	}
	writer.Close()

	req := httptest.NewRequest("POST", "/v1/scans", &body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	rr := httptest.NewRecorder()

	h.CreateScanV1(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("Expected status 201, got %d. Body: %s", rr.Code, rr.Body.String())
	}

	var response CreateScanV1Response
	if err := json.NewDecoder(rr.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if response.ScanID == "" {
		t.Error("Expected scanId to be set")
	}
	if response.FullText == "" {
		t.Error("Expected fullText to be set")
	}
	if !strings.HasPrefix(response.ImageURL, "/v1/scans/") {
		t.Errorf("Expected imageUrl to start with /v1/scans/, got %s", response.ImageURL)
	}
	if !strings.HasSuffix(response.ImageURL, "/image") {
		t.Errorf("Expected imageUrl to end with /image, got %s", response.ImageURL)
	}

	if createdScan == nil {
		t.Fatal("Expected CreateV1Scan to be called")
	}
	if createdScan.ID != response.ScanID {
		t.Errorf("Expected scan ID %s, got %s", response.ScanID, createdScan.ID)
	}
}

func TestCreateScanV1_InvalidMime_400(t *testing.T) {
	mockDB := &testutil.MockDB{}
	mockFileStorage := &testutil.MockFileStorage{}
	mockGeminiClient := &testutil.MockGeminiClient{}
	cfg := &config.Config{
		MaxUploadSize: 10 * 1024 * 1024,
	}

	h, err := NewHandlers(mockDB, mockFileStorage, mockGeminiClient, cfg)
	if err != nil {
		t.Fatalf("Failed to create handlers: %v", err)
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, _ := writer.CreateFormFile("image", "test.txt")
	part.Write([]byte("not an image"))
	writer.Close()

	req := httptest.NewRequest("POST", "/v1/scans", &body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	rr := httptest.NewRecorder()

	h.CreateScanV1(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("Expected status 400, got %d. Body: %s", rr.Code, rr.Body.String())
	}

	var errorResp ErrorAPIResponse
	if err := json.NewDecoder(rr.Body).Decode(&errorResp); err != nil {
		t.Fatalf("Failed to decode error response: %v", err)
	}

	if !strings.Contains(strings.ToLower(errorResp.Message), "image") {
		t.Errorf("Expected error message about image type, got: %s", errorResp.Message)
	}
}

func TestGetScanV1_Success_ReturnsContractShape(t *testing.T) {
	scanID := "test-scan-uuid-5678"
	fullText := "テスト用の日本語テキスト"
	imageURL := "/v1/scans/" + scanID + "/image"

	mockDB := &testutil.MockDB{
		GetV1ScanFunc: func(ctx context.Context, id string) (*models.V1Scan, error) {
			if id != scanID {
				t.Fatalf("expected scanID %q, got %q", scanID, id)
			}
			return &models.V1Scan{
				ID:              scanID,
				UserID:          nil,
				ImageURL:        imageURL,
				FullOCRText:     &fullText,
				DetectedLanguage: stringPtr("ja"),
				StoragePath:     "/mock/path",
				MimeType:        "image/jpeg",
				CreatedAt:       time.Now(),
			}, nil
		},
	}

	mockFileStorage := &testutil.MockFileStorage{}
	mockGeminiClient := &testutil.MockGeminiClient{}
	cfg := &config.Config{
		MaxUploadSize: 10 * 1024 * 1024,
	}

	h, err := NewHandlers(mockDB, mockFileStorage, mockGeminiClient, cfg)
	if err != nil {
		t.Fatalf("Failed to create handlers: %v", err)
	}

	req := httptest.NewRequest("GET", "/v1/scans/"+scanID, nil)
	rr := httptest.NewRecorder()

	h.GetScanV1(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d. Body: %s", rr.Code, rr.Body.String())
	}

	var response GetScanV1Response
	if err := json.NewDecoder(rr.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if response.ID != scanID {
		t.Errorf("Expected id %s, got %s", scanID, response.ID)
	}
	if response.FullText != fullText {
		t.Errorf("Expected fullText %s, got %s", fullText, response.FullText)
	}
	if response.ImageURL != imageURL {
		t.Errorf("Expected imageUrl %s, got %s", imageURL, response.ImageURL)
	}
}

func TestGetScanV1Image_ServesBytesAndContentType(t *testing.T) {
	imageData, err := loadTestImage()
	if err != nil {
		t.Fatalf("Failed to load test image: %v", err)
	}

	scanID := "test-scan-uuid-9012"
	mimeType := "image/jpeg"

	mockDB := &testutil.MockDB{
		GetV1ScanFunc: func(ctx context.Context, id string) (*models.V1Scan, error) {
			if id != scanID {
				t.Fatalf("expected scanID %q, got %q", scanID, id)
			}
			return &models.V1Scan{
				ID:              scanID,
				StoragePath:     "/mock/path",
				MimeType:        mimeType,
				CreatedAt:       time.Now(),
			}, nil
		},
	}

	mockFileStorage := &testutil.MockFileStorage{
		OpenImageFunc: func(path string) ([]byte, error) {
			return imageData, nil
		},
	}

	mockGeminiClient := &testutil.MockGeminiClient{}
	cfg := &config.Config{
		MaxUploadSize: 10 * 1024 * 1024,
	}

	h, err := NewHandlers(mockDB, mockFileStorage, mockGeminiClient, cfg)
	if err != nil {
		t.Fatalf("Failed to create handlers: %v", err)
	}

	req := httptest.NewRequest("GET", "/v1/scans/"+scanID+"/image", nil)
	rr := httptest.NewRecorder()

	h.GetScanV1Image(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d", rr.Code)
	}

	if rr.Header().Get("Content-Type") != mimeType {
		t.Errorf("Expected Content-Type %s, got %s", mimeType, rr.Header().Get("Content-Type"))
	}

	if !bytes.Equal(rr.Body.Bytes(), imageData) {
		t.Error("Response body does not match expected image data")
	}
}

func stringPtr(s string) *string {
	return &s
}
