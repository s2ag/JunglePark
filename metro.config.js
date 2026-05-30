const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'cjs' to sourceExts to support Firebase CommonJS modules
config.resolver.sourceExts.push('cjs');

module.exports = config;
