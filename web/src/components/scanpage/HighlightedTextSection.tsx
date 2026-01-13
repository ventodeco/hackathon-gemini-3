interface HighlightedTextSectionProps {
  text: string
}

export function HighlightedTextSection({ text }: HighlightedTextSectionProps) {
  return (
    <div className="flex flex-col gap-4 bg-[#EFF6FF] rounded-lg p-3">
      <span className="text-sm italic text-gray-600">Highlighted:</span>
      <span className="text-sm font-normal text-gray-900 leading-relaxed">{text}</span>
    </div>
  )
}
