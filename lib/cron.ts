import cron from 'node-cron'
// import { getItems } from './db'

export const startCronJobs = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      await fetch('/api/send-notifications', {
        method: 'POST'
      })
    } catch (error) {
      console.error('Failed to run notification cron job:', error)
    }
  })
} 