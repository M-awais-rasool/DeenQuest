const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// 3D model assets for the mascot (loaded via expo-three / GLTFLoader).
config.resolver.assetExts.push("glb", "gltf");

module.exports = config;
