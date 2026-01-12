import { useParams } from 'react-router-dom'
import { useScan } from '@/hooks/useScan'
import ScanImage from '@/components/scanpage/ScanImage'
import TextPreview from '@/components/scanpage/TextPreview'
import LoadingSpinner from '@/components/scanpage/LoadingSpinner'
import ErrorAlert from '@/components/scanpage/ErrorAlert'
import { Card, CardContent } from '@/components/ui/card'

export default function ScanPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, error, refetch } = useScan(id, !!id)

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <LoadingSpinner message="Loading scan..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <ErrorAlert
            title="Error"
            message={error instanceof Error ? error.message : 'Failed to load scan'}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <ErrorAlert title="Not Found" message="Scan not found" />
        </div>
      </div>
    )
  }

  const { scan, ocrResult, status } = data

  if (status === 'failed_overloaded') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <ErrorAlert
            title="Service Temporarily Unavailable"
            message="The OCR service is currently overloaded. Please wait a moment and try uploading the image again."
            onRetry={() => refetch()}
            retryLabel="Retry Now"
          />
        </div>
      </div>
    )
  }

  if (status === 'failed_auth') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <ErrorAlert
            title="Authentication Error"
            message="There was an issue with the API key. Please check your GEMINI_API_KEY configuration."
          />
        </div>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <ErrorAlert
            title="OCR Processing Failed"
            message="The OCR service encountered an error. Please try uploading the image again."
            onRetry={() => refetch()}
          />
        </div>
      </div>
    )
  }

  if (status === 'uploaded' || !ocrResult) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <Card>
            <CardContent className="pt-6">
              <LoadingSpinner message="OCR processing in progress..." />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Extracted Text</h1>
        
        <ScanImage scanID={scan.id} />
        
        <TextPreview text={ocrResult.rawText} scanID={scan.id} />
      </div>
    </div>
  )
}
