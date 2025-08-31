// Vercel serverless function for vehicle updates
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { vehicle_id, data, timestamp, checksum } = req.body;
    
    if (!vehicle_id || !data) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate vehicle data
    if (!data.position || !data.velocity || !data.sensors || !data.security || !data.network) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle data format'
      });
    }

    if (data.position.lat === 0 && data.position.lng === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GPS coordinates'
      });
    }

    // Here you would typically:
    // 1. Validate the checksum
    // 2. Store data in a database
    // 3. Broadcast to connected WebSocket clients
    // 4. Update analytics

    // For now, we'll just acknowledge receipt
    const vehicle = {
      ...data,
      lastUpdate: new Date().toISOString(),
      iotData: {
        receivedAt: new Date().toISOString(),
        checksum: checksum,
        source: 'iot-device'
      }
    };

    // In a real implementation, you'd store this in a database
    // and broadcast to WebSocket clients

    res.status(200).json({
      success: true,
      message: 'Vehicle data received successfully',
      timestamp: new Date().toISOString(),
      vehicle_id: vehicle_id
    });

  } catch (error) {
    console.error('Error processing vehicle update:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
