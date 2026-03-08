import { useState, useEffect, useCallback } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { State } from 'react-native-ble-plx';
import { bleService } from '../services/bleService';
import { BLE_CONFIG } from '../constants/bleConfig';
import { useVitals } from '../contexts/VitalsContext';
import { Buffer } from 'buffer';
import { insertLog } from '../database/db';

export interface BluetoothDevice {
    id: string;
    name: string;
    rssi: number;
}

export function useBLE() {
    const [isScanning, setIsScanning] = useState(false);
    const [devices, setDevices] = useState<BluetoothDevice[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState<string | null>(null);
    const [bluetoothState, setBluetoothState] = useState<State>(State.Unknown);
    const { updateVitals, resetVitals } = useVitals();

    const requestBluetoothPermissions = async () => {
        if (Platform.OS === 'android') {
            if (Platform.Version >= 31) {
                try {
                    const granted = await PermissionsAndroid.requestMultiple([
                        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    ]);

                    const allGranted = Object.values(granted).every(
                        (status) => status === PermissionsAndroid.RESULTS.GRANTED
                    );

                    if (!allGranted) {
                        Alert.alert(
                            'Permissions Required',
                            'Bluetooth and Location permissions are required to scan for devices.'
                        );
                        return false;
                    }
                    return true;
                } catch (err) {
                    console.warn('Permission error:', err);
                    return false;
                }
            } else {
                try {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                        {
                            title: 'Location Permission',
                            message: 'Bluetooth requires location permission to scan for devices.',
                            buttonNeutral: 'Ask Me Later',
                            buttonNegative: 'Cancel',
                            buttonPositive: 'OK',
                        }
                    );

                    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                        Alert.alert(
                            'Permission Denied',
                            'Location permission is required to scan for Bluetooth devices.'
                        );
                        return false;
                    }
                    return true;
                } catch (err) {
                    console.warn('Permission error:', err);
                    return false;
                }
            }
        }
        return true;
    };

    useEffect(() => {
        const subscription = bleService.onStateChange((state) => {
            console.log('Bluetooth state changed:', state);
            setBluetoothState(state);
            if (state === State.PoweredOff) {
                Alert.alert('Bluetooth Off', 'Please enable Bluetooth to scan for devices');
            }
        });

        if (Platform.OS === 'android') {
            requestBluetoothPermissions();
        }

        return () => {
            subscription.remove();
            bleService.stopScan();
        };
    }, []);

    const startScan = async () => {
        console.log('Start Scan pressed. Current State:', bluetoothState);
        if (bluetoothState !== State.PoweredOn) {
            Alert.alert(
                'Bluetooth Off',
                'Please enable Bluetooth in your device settings to scan for devices.',
                [{ text: 'OK' }]
            );
            return;
        }

        const hasPermissions = await requestBluetoothPermissions();
        if (!hasPermissions) {
            return;
        }

        setIsScanning(true);
        setDevices([]);

        bleService.startScan((error, device) => {
            if (error) {
                console.error('Scan error:', error);
                setIsScanning(false);
                Alert.alert('Scan Error', error.message || 'Failed to scan for devices');
                return;
            }

            if (device && device.name) {
                setDevices((prevDevices) => {
                    const deviceExists = prevDevices.find((d) => d.id === device.id);
                    if (!deviceExists) {
                        const newDevice: BluetoothDevice = {
                            id: device.id,
                            name: device.name || 'Unknown Device',
                            rssi: device.rssi || -100,
                        };
                        
                        // Optional: Filter only devices matching our prefix
                        // if (newDevice.name.startsWith(BLE_CONFIG.DEVICE_NAME_PREFIX)) {
                        return [...prevDevices, newDevice].sort((a, b) => b.rssi - a.rssi);
                        // }
                        // return prevDevices;
                    } else {
                        return prevDevices
                            .map((d) =>
                                d.id === device.id ? { ...d, rssi: device.rssi || d.rssi } : d
                            )
                            .sort((a, b) => b.rssi - a.rssi);
                    }
                });
            }
        });

        setTimeout(() => {
            bleService.stopScan();
            setIsScanning(false);
            console.log('Scan stopped');
        }, 10000);
    };

    const connectToDevice = async (deviceId: string, deviceName: string) => {
        if (isConnecting) return;

        setIsConnecting(deviceId);

        try {
            bleService.stopScan();
            setIsScanning(false);

            await bleService.connectToDevice(deviceId);

            setConnectedDevice(deviceId);
            setIsConnecting(null);
            
            // Start streaming data once connected
            startStreamingData(deviceId);

            Alert.alert(
                'Connected',
                `Successfully connected to ${deviceName}`,
                [{ text: 'OK' }]
            );
        } catch (error: any) {
            console.error('Connection error:', error);
            setIsConnecting(null);
            Alert.alert(
                'Connection Failed',
                error.message || `Unable to connect to ${deviceName}. Please try again.`,
                [{ text: 'OK' }]
            );
        }
    };

    const disconnectDevice = async (deviceId: string, deviceName: string) => {
        try {
            await bleService.disconnectDevice(deviceId);
            setConnectedDevice(null);
            resetVitals(); // Reset vitals when disconnected
            Alert.alert('Disconnected', `Disconnected from ${deviceName}`);
        } catch (error: any) {
            console.error('Disconnect error:', error);
            Alert.alert('Error', 'Failed to disconnect. The device may already be disconnected.');
        }
    };

    const startStreamingData = async (deviceId: string) => {
        try {
            // Heart Rate Streaming Example
            bleService.monitorCharacteristic(
                deviceId,
                BLE_CONFIG.SERVICES.HEALTH_DATA_SERVICE,
                BLE_CONFIG.CHARACTERISTICS.HEART_RATE_MEASUREMENT,
                (error, characteristic) => {
                    if (error) {
                        console.error('Heart Rate monitor error:', error);
                        return;
                    }
                    if (characteristic?.value) {
                        // Decode base64 value depending on your ESP32 data format
                        // This assumes a simple 8-bit integer for heart rate as an example
                        const decodedValue = Buffer.from(characteristic.value, 'base64');
                        const heartRate = decodedValue.readUInt8(0);
                        updateVitals({ heartRate });
                        insertLog({ type: 'heartRate', value: heartRate, deviceId });
                    }
                }
            );

            // SpO2 Streaming Example
            bleService.monitorCharacteristic(
                deviceId,
                BLE_CONFIG.SERVICES.HEALTH_DATA_SERVICE,
                BLE_CONFIG.CHARACTERISTICS.SPO2_MEASUREMENT,
                (error, characteristic) => {
                    if (error) {
                        console.error('SpO2 monitor error:', error);
                        return;
                    }
                    if (characteristic?.value) {
                        const decodedValue = Buffer.from(characteristic.value, 'base64');
                        const spO2 = decodedValue.readUInt8(0);
                        updateVitals({ spO2 });
                        insertLog({ type: 'spO2', value: spO2, deviceId });
                    }
                }
            );
            
            // Note: You can add more monitors here for Fall Detection, Battery etc.
            // following the same pattern with bleService.monitorCharacteristic(...)

        } catch (error) {
            console.error('Failed to start streaming:', error);
        }
    };

    return {
        isScanning,
        devices,
        connectedDevice,
        isConnecting,
        bluetoothState,
        startScan,
        connectToDevice,
        disconnectDevice,
    };
}
