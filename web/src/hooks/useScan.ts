import { useQuery } from '@tanstack/react-query'
import { getScan } from '@/lib/api'

export function useScan(scanID: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['scan', scanID],
    queryFn: () => {
      if (!scanID) throw new Error('Scan ID is required')
      return getScan(scanID)
    },
    enabled: enabled && !!scanID,
  })
}
