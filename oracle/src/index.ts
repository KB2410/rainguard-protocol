import { CronJob } from 'cron';
import { processActivePolicies } from './stellar';

// Run every 30 minutes
const job = new CronJob('*/30 * * * *', async () => {
    console.log(`[${new Date().toISOString()}] INFO: Starting Oracle cron execution...`);
    try {
        await processActivePolicies();
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ERROR: Oracle execution failed:`, error);
    }
});

job.start();
console.log('Oracle service started. Waiting for next cron trigger...');
