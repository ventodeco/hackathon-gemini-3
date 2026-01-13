import { Link } from 'react-router-dom'
import { Bookmark } from 'lucide-react'

export function EmptyHistory() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Bookmark className="w-8 h-8 text-gray-400" aria-label="bookmark icon" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No saved annotations
      </h3>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">
        When you save annotations from your scans, they will appear here for easy access.
      </p>
      <Link
        to="/welcome"
        className="px-6 py-3 bg-[#0F172A] text-white text-sm font-medium rounded-lg hover:bg-[#1E293B] transition-colors"
      >
        Start Scanning
      </Link>
    </div>
  )
}
