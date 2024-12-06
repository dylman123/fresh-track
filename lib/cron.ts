import cron from 'node-cron'

export function startCronJobs() {
  console.log('Starting cron jobs')
  if (!process.env.NEXT_PUBLIC_API_URL) {
    console.error('NEXT_PUBLIC_API_URL is not set')
    return
  }
  // Run every day at midday 0 12 * * *
  cron.schedule('0 12 * * *', async () => {
    console.log('Running cron job')
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/send-notifications`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('Failed to run notification cron job:', error)
    }
  })
}

export function stopCronJobs() {
  cron.getTasks().forEach(task => task.stop())
}
  