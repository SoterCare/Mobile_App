// expo-three ships no TypeScript types; treat its exports as untyped.
declare module 'expo-three';

// Allow importing GLB model assets via require() (registered in metro.config.js).
declare module '*.glb';
