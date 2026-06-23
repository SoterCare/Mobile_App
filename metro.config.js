// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Allow importing 3D model assets (GLB/GLTF) via require() so expo-asset can bundle them.
config.resolver.assetExts.push('glb', 'gltf', 'bin');

module.exports = config;
