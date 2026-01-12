import type { Annotation } from './types'

const MOCK_ANNOTATIONS: Record<string, {
  context: string
  meaning: string
  usageExample: string
  whenToUse: string
  wordBreakdown: string
  alternativeMeanings: string
}> = {
  default: {
    context: "This phrase appears in a monthly report email to a manager discussing KPI movements and performance trends.",
    meaning: "This month, CVR (Conversion Rate) has improved by +1.2 percentage points compared to last month, indicating better quality of incoming traffic.",
    usageExample: "今月はCVRが前月比+1.2pt改善し、流入品質の向上が示唆されます。",
    whenToUse: "Use when reporting KPI movements in monthly or quarterly summaries. Appropriate for professional email updates to managers or stakeholders.",
    wordBreakdown: "• 今月 (こんげつ): this month\n• は: topic marker\n• 前月比 (ぜんげつひ): compared to last month\n• 改善 (かいぜん): improvement\n• 示唆される (しさされる): to be indicated/suggested",
    alternativeMeanings: "In analytics contexts, 'pt' typically refers to 'percentage points' rather than just 'points'. In finance, this phrasing could also apply to interest rate changes.",
  },
  greeting: {
    context: "This phrase appears at the beginning of a formal business email in Japanese correspondence.",
    meaning: "I hope this email finds you well and that you are having a productive day.",
    usageExample: "お忙しい中申し訳ありませんが、本件につきましてご検討いただけますと幸いです。",
    whenToUse: "Use in formal Japanese business emails when making a request. This shows politeness and respect for the recipient's time.",
    wordBreakdown: "• お忙しい中 (お忙しいなか): while busy\n• 申し訳ありません: I'm sorry/excuse me\n• 本件 (ほんけん): this matter\n• ご検討 (ごけんとう): consideration\n• 幸いです: would be appreciated",
    alternativeMeanings: "This phrase can also be used to politely introduce a sensitive topic or make a request that may inconvenience the recipient.",
  },
  conclusion: {
    context: "This phrase appears at the end of a business proposal or project summary document.",
    meaning: "We look forward to your favorable consideration and hope to have the opportunity to work together.",
    usageExample: "ご検討のほど、何卒よろしくお願い申し上げます。",
    whenToUse: "Use at the conclusion of formal business proposals, quotations, or partnership proposals. Common in Japanese business correspondence.",
    wordBreakdown: "• ご検討 (ごけんとう): consideration\n• のほど: approximately/roughly (polite emphasis)\n• 何卒 (なにとぞ): please (formal)\n• よろしくお願い申し上げます: humbly request your favor",
    alternativeMeanings: "Similar expressions include ご査収ください (please review) or ご確認お願いします (please confirm), but this is more general and polite.",
  },
}

export function getMockAnnotation(selectedText: string): Annotation {
  const normalizedText = selectedText.toLowerCase().trim()
  
  let mockData = MOCK_ANNOTATIONS.default
  
  if (normalizedText.includes('ヶ月') || normalizedText.includes('月')) {
    mockData = MOCK_ANNOTATIONS.default
  } else if (normalizedText.includes('忙しい') || normalizedText.includes('申し訳')) {
    mockData = MOCK_ANNOTATIONS.greeting
  } else if (normalizedText.includes('検討') || normalizedText.includes('ようお願い')) {
    mockData = MOCK_ANNOTATIONS.conclusion
  }
  
  const now = new Date().toISOString()
  
  return {
    id: crypto.randomUUID(),
    scanID: 'mock-scan-id',
    ocrResultID: 'mock-ocr-result-id',
    selectedText: selectedText,
    context: mockData.context,
    meaning: mockData.meaning,
    usageExample: mockData.usageExample,
    whenToUse: mockData.whenToUse,
    wordBreakdown: mockData.wordBreakdown,
    alternativeMeanings: mockData.alternativeMeanings,
    model: 'gemini-1.5-flash',
    promptVersion: '1.0',
    createdAt: now,
  }
}
