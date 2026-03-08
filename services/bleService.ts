import { BleManager, Device, State } from 'react-native-ble-plx';

class BleService {
    manager: BleManager | null;

    constructor() {
        try {
            this.manager = new BleManager();
        } catch (error) {
            console.warn("BleManager not supported in this environment");
            this.manager = null;
        }
    }

    onStateChange(listener: (state: State) => void) {
        if (!this.manager) {
            listener(State.Unknown);
            return { remove: () => { } };
        }
        return this.manager.onStateChange(listener, true);
    }

    startScan(listener: (error: any, device: Device | null) => void) {
        if (!this.manager) {
            listener(new Error("BLE is not supported here"), null);
            return;
        }
        this.manager.startDeviceScan(null, null, listener);
    }

    stopScan() {
        if (!this.manager) return;
        this.manager.stopDeviceScan();
    }

    async connectToDevice(deviceId: string) {
        if (!this.manager) throw new Error("BLE is not supported here");
        const device = await this.manager.connectToDevice(deviceId);
        await device.discoverAllServicesAndCharacteristics();
        return device;
    }

    async disconnectDevice(deviceId: string) {
        if (!this.manager) return;
        await this.manager.cancelDeviceConnection(deviceId);
    }

    async getServices(device: Device) {
        return await device.services();
    }

    async readCharacteristic(deviceId: string, serviceUUID: string, characteristicUUID: string) {
        if (!this.manager) throw new Error("BLE is not supported here");
        const characteristic = await this.manager.readCharacteristicForDevice(deviceId, serviceUUID, characteristicUUID);
        return characteristic.value;
    }

    monitorCharacteristic(
        deviceId: string,
        serviceUUID: string,
        characteristicUUID: string,
        listener: (error: Error | null, characteristic: any | null) => void
    ) {
        if (!this.manager) return { remove: () => { } };
        return this.manager.monitorCharacteristicForDevice(
            deviceId,
            serviceUUID,
            characteristicUUID,
            listener
        );
    }
}

export const bleService = new BleService();
