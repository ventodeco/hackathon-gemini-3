import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Hourglass } from 'lucide-react'
import BottomActionBar from '@/components/layout/BottomActionBar'
import { createScan } from '@/lib/api'

export default function LoadingPage() {
  const navigate = useNavigate()
  const hasTriggeredRef = useRef(false)

  const uploadMutation = useMutation({
    mutationFn: createScan,
    onSuccess: (data) => {
      sessionStorage.removeItem('pendingImage')
      navigate(`/scans/${data.scanId}`)
    },
    onError: (error) => {
      toast.error('Failed to process image', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
      sessionStorage.removeItem('pendingImage')
      navigate('/welcome')
    },
  })

  useEffect(() => {
    const pendingImageData = sessionStorage.getItem('pendingImage')
    if (!pendingImageData) {
      navigate('/welcome')
      return
    }

    if (hasTriggeredRef.current || uploadMutation.isPending || uploadMutation.isSuccess) {
      return
    }

    try {
      const imageData = JSON.parse(pendingImageData)
      
      const dataURL = imageData.blob
      if (!dataURL || typeof dataURL !== 'string') {
        throw new Error('Invalid image data')
      }

      if (dataURL.startsWith('data:')) {
        const arr = dataURL.split(',')
        const mimeMatch = arr[0].match(/:(.*?);/)
        const mimeType = mimeMatch?.[1] || imageData.type || 'image/jpeg'
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n)
        }
        const filename = imageData.source === 'upload' ? 'uploaded-image.jpg' : 'captured-image.jpg'
        const file = new File([u8arr], filename, { type: mimeType })
        hasTriggeredRef.current = true
        uploadMutation.mutate(file)
      } else if (dataURL.startsWith('blob:')) {
        fetch(dataURL)
          .then((res) => res.blob())
          .then((blob) => {
            const filename = imageData.source === 'upload' ? 'uploaded-image.jpg' : 'captured-image.jpg'
            const file = new File([blob], filename, { type: imageData.type || 'image/jpeg' })
            hasTriggeredRef.current = true
            uploadMutation.mutate(file)
          })
          .catch((error) => {
            console.error('Error converting image:', error)
            toast.error('Failed to process image', {
              description: 'Invalid image data',
            })
            sessionStorage.removeItem('pendingImage')
            navigate('/welcome')
          })
      } else {
        throw new Error('Invalid image data format')
      }
    } catch (error) {
      console.error('Error processing image:', error)
      toast.error('Failed to process image', {
        description: error instanceof Error ? error.message : 'Invalid image data',
      })
      sessionStorage.removeItem('pendingImage')
      navigate('/welcome')
    }
  }, [navigate, uploadMutation])

  return (
    <div className="flex min-h-screen flex-col bg-white pb-20">
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <h1 className="mb-4 text-center text-2xl font-bold text-gray-900">
          Scanning in Progress..
        </h1>
        <p className="mb-8 text-center text-sm/relaxed text-gray-600">
          Please stay on the page while the scanning in progress
        </p>
        <Hourglass className="size-16 animate-pulse text-gray-400" />
      </div>
      <BottomActionBar disabled={true} />
    </div>
  )
}
