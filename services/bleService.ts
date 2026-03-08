import { BleManager, Device, State } from 'react-native-ble-plx';

class BleService {
    manager: BleManager;

    constructor() {
        this.manager = new BleManager();
    }

    onStateChange(listener: (state: State) => void) {
        return this.manager.onStateChange(listener, true);
    }

    startScan(listener: (error: any, device: Device | null) => void) {
        this.manager.startDeviceScan(null, null, listener);
    }

    stopScan() {
        this.manager.stopDeviceScan();
    }

    async connectToDevice(deviceId: string) {
        const device = await this.manager.connectToDevice(deviceId);
        await device.discoverAllServicesAndCharacteristics();
        return device;
    }

    async disconnectDevice(deviceId: string) {
        await this.manager.cancelDeviceConnection(deviceId);
    }

    async getServices(device: Device) {
        return await device.services();
    }
}

export const bleService = new BleService();
