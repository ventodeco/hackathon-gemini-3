import type { Annotation } from '@/lib/types'
import { BookmarkCard } from './BookmarkCard'

interface BookmarkListProps {
  annotations: Annotation[]
  onDelete: (id: string) => void
}

export function BookmarkList({ annotations, onDelete }: BookmarkListProps) {
  const sortedAnnotations = [...annotations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="space-y-3">
      {sortedAnnotations.map((annotation) => (
        <BookmarkCard
          key={annotation.id}
          annotation={annotation}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
