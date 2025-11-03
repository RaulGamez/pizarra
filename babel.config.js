module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['./'],
        alias: { '@': './src' }, // o './src' si moviste
        extensions: ['.tsx', '.ts', '.js', '.json'],
      }],
      'react-native-reanimated/plugin', // <-- siempre el último
    ],
  };
};
