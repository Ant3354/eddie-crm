// Campaign scheduler - runs campaigns automatically
import { processCampaigns } from './campaigns'

let intervalId: NodeJS.Timeout | null = null

export function startCampaignScheduler(intervalMinutes: number = 60) {
  // Stop existing scheduler if running
  stopCampaignScheduler()

  // Process campaigns immediately
  processCampaigns().catch(console.error)

  // Then process every interval
  intervalId = setInterval(() => {
    processCampaigns().catch(console.error)
  }, intervalMinutes * 60 * 1000)

  console.log(`Campaign scheduler started (runs every ${intervalMinutes} minutes)`)
}

export function stopCampaignScheduler() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
    console.log('Campaign scheduler stopped')
  }
}

// Auto-start in development (for testing)
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  // Only run on server side
  startCampaignScheduler(60) // Every hour
}

