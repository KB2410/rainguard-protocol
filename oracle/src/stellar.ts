import { Keypair, rpc, Networks } from '@stellar/stellar-sdk';
import { fetchRecentRainfall } from './openmeteo';
import dotenv from 'dotenv';

dotenv.config();

// Initialize environment
const ORACLE_SECRET = process.env.ORACLE_SECRET || Keypair.random().secret();
const CONTRACT_ID = process.env.CONTRACT_ID || 'CDIO6X2XBNGBSIIHFZYF5AC2REGRXNJVG6T5PIJEIX62ZTUG7RBTNEKY';
const RPC_URL = 'https://soroban-testnet.stellar.org';

const oracleKeypair = Keypair.fromSecret(ORACLE_SECRET);
const server = new rpc.Server(RPC_URL);

interface ActivePolicy {
    vendorAddress: string;
    latitude: number;
    longitude: number;
    rainfallThreshold: number;
}

export async function processActivePolicies() {
    console.log(`[${new Date().toISOString()}] INFO: Fetching active policies...`);
    
    // Simulated list for the MVP since map iteration requires indexer
    const activePolicies: ActivePolicy[] = [
        {
            vendorAddress: 'GB...',
            latitude: 18.5204, // Pune
            longitude: 73.8567,
            rainfallThreshold: 15.0 // 15mm
        }
    ];

    for (const policy of activePolicies) {
        try {
            const rainfallMm = await fetchRecentRainfall(policy.latitude, policy.longitude);
            console.log(`[${new Date().toISOString()}] INFO: Rainfall for ${policy.vendorAddress} (${policy.latitude}, ${policy.longitude}): ${rainfallMm}mm`);

            if (rainfallMm >= policy.rainfallThreshold) {
                const timestamp = Math.floor(Date.now() / 1000);
                
                // Pack payload: vendorAddress, lat, lng, rainfallMm, timestamp
                const payloadBuffer = Buffer.from(`${policy.vendorAddress}${policy.latitude}${policy.longitude}${rainfallMm}${timestamp}`);
                const signature = oracleKeypair.sign(payloadBuffer);
                
                // PRD specifies logging format
                console.log(JSON.stringify({
                    timestamp: new Date().toISOString(),
                    level: "INFO",
                    event: "ORACLE_ATTESTATION_SUBMITTED",
                    contract_target: CONTRACT_ID,
                    payload: { vendor: policy.vendorAddress, rainfall_recorded_mm: rainfallMm }
                }));

                // Simulation: In a real app we'd construct TransactionBuilder here
                // and invoke the submit_weather_report method on CONTRACT_ID.
            }
        } catch (error) {
            console.error(`[${new Date().toISOString()}] ERROR: processing policy for ${policy.vendorAddress}:`, error);
        }
    }
}
