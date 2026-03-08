import { useState, useEffect, useCallback } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { State } from 'react-native-ble-plx';
import { bleService } from '../services/bleService';

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
                        return [...prevDevices, newDevice].sort((a, b) => b.rssi - a.rssi);
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
            Alert.alert('Disconnected', `Disconnected from ${deviceName}`);
        } catch (error: any) {
            console.error('Disconnect error:', error);
            Alert.alert('Error', 'Failed to disconnect. The device may already be disconnected.');
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
