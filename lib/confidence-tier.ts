export type ConfidenceTier = 'high' | 'medium' | 'low'

export function confidenceTier(score: number | undefined): ConfidenceTier {
  if (score == null || Number.isNaN(score)) return 'low'
  if (score >= 0.75) return 'high'
  if (score >= 0.5) return 'medium'
  return 'low'
}
