import axios from 'axios';

/**
 * Fetch rainfall data for the past 6 hours from Open-Meteo
 */
export async function fetchRecentRainfall(lat: number, lng: number): Promise<number> {
    try {
        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
                latitude: lat,
                longitude: lng,
                hourly: 'precipitation',
                timezone: 'Asia/Kolkata',
                past_days: 1
            }
        });

        // The data is hourly. We need the sum of the last 6 hours of precipitation.
        const hourlyData = response.data.hourly;
        
        const times = hourlyData.time as string[];
        const precipitations = hourlyData.precipitation as number[];
        
        const now = new Date();
        now.setMinutes(0, 0, 0); // truncate to hour
        
        // Find index of current hour
        const currentIndex = times.findIndex(t => new Date(t).getTime() === now.getTime());
        
        if (currentIndex === -1 || currentIndex < 6) {
            // fallback if hour not perfectly matched
            return precipitations.slice(-6).reduce((a, b) => a + b, 0);
        }

        // Sum precipitation for the preceding 6 hours
        const last6Hours = precipitations.slice(currentIndex - 6, currentIndex);
        const sum = last6Hours.reduce((acc, val) => acc + val, 0);
        
        return sum;
    } catch (error) {
        console.error('Error fetching Open-Meteo data:', error);
        throw error;
    }
}
