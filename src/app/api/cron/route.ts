import { startCronJobs, stopCronJobs } from '../../../../lib/cron'

// Initialize cron jobs when the server starts
startCronJobs()

export async function GET() {
  return new Response('Cron jobs initialized')
}

export async function POST() {
  stopCronJobs();
  return new Response('Cron jobs stopped')
}