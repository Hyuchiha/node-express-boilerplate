module.exports = function (api) {
  api.cache(true);

  const config = {
    presets: ['@babel/preset-env'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        '@babel/plugin-transform-modules-commonjs',
      ],
    ],
  };
  return config;
};
