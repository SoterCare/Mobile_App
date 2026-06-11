/**
 * BLE Config Constants for SoterCare Band (ESP32)
 * 
 * Update these UUIDs to match the exact Service and Characteristic UUIDs
 * programmed into your ESP32 device.
 */
export const BLE_CONFIG = {
    // SoterCare Band Device Match Name
    // Update this to exactly what your ESP32 advertises
    DEVICE_NAME_PREFIX: 'SoterCare', 

    // Primary Service UUIDs
    SERVICES: {
        DEVICE_INFORMATION: '180A',           // Standard Device Information Service
        BATTERY_SERVICE: '180F',              // Standard Battery Service
        
        // Custom SoterCare Services - replace with your actual ESP32 UUIDs
        HEALTH_DATA_SERVICE: '0000180D-0000-1000-8000-00805F9B34FB',  // Example UUID
        SENSOR_MONITOR_SERVICE: '0000181A-0000-1000-8000-00805F9B34FB' // Example UUID
    },

    // Characteristic UUIDs to read/write/subscribe
    CHARACTERISTICS: {
        // Battery
        BATTERY_LEVEL: '2A19',
        
        // Health Data Characteristics - replace with actual ESP32 Characteristic UUIDs
        FALL_DETECTION_STATUS: '00002A1C-0000-1000-8000-00805F9B34FB', // Example UUID
        
        // Raw Sensor Characteristics (if streaming directly)
        ACCELEROMETER_DATA: '00002A53-0000-1000-8000-00805F9B34FB',
    }
};
