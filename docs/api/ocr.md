# OCR Scanning Flow

## Scan Image API

| Action | POST |  |
| --- | --- | --- |
| Endpoint | /v1/scans |  |
| Headers | x-token: {jwt} |  |

Request Body

- Multipart/Form-Data

Response Body
```json
{
	"scanId": "uuid", 
	"fullText": "...", 
	"imageUrl": "..." 
}
```
## Get Scan Details API

| Action | GET |
| --- | --- |
| Endpoint | /v1/scans/{id} |
| Headers | x-token: {jwt} |

Response Body
```json
{ 
	"id": "uuid", 
	"fullText": "...", 
	"imageUrl": "..." 
}
```