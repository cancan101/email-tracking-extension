var webpack = require('webpack'),
  path = require('path'),
  fileSystem = require('fs-extra'),
  env = require('./utils/env'),
  CopyWebpackPlugin = require('copy-webpack-plugin'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  TerserPlugin = require('terser-webpack-plugin');
var { CleanWebpackPlugin } = require('clean-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const dotenv = require('dotenv');
const child_process = require('child_process');

// -------------------------------------------------

dotenv.config();

// -------------------------------------------------

const ASSET_PATH = process.env.ASSET_PATH || '/';

var alias = {
  'react-dom': '@hot-loader/react-dom',
};

// load the secrets
var secretsPath = path.join(__dirname, 'secrets.' + env.NODE_ENV + '.js');

var fileExtensions = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'eot',
  'otf',
  'svg',
  'ttf',
  'woff',
  'woff2',
];

if (fileSystem.existsSync(secretsPath)) {
  alias['secrets'] = secretsPath;
}

var options = {
  mode: env.NODE_ENV,
  entry: {
    options: path.join(__dirname, 'src', 'pages', 'Options', 'index.jsx'),
    popup: path.join(__dirname, 'src', 'pages', 'Popup', 'index.jsx'),
    background: path.join(__dirname, 'src', 'pages', 'Background', 'index.ts'),
    contentScript: path.join(__dirname, 'src', 'pages', 'Content', 'index.ts'),
    gmailJsLoader: path.join(__dirname, 'src', 'gmailJsLoader.ts'),
    login: path.join(__dirname, 'src', 'login.ts'),
  },
  chromeExtensionBoilerplate: {
    notHotReload: ['background', 'contentScript', 'gmailJsLoader', 'login'],
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'build'),
    clean: true,
    publicPath: ASSET_PATH,
  },
  module: {
    rules: [
      {
        // look for .css or .scss files
        test: /\.(css|scss)$/,
        // in the `src` directory
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: new RegExp('.(' + fileExtensions.join('|') + ')$'),
        type: 'asset/resource',
        exclude: /node_modules/,
        // loader: 'file-loader',
        // options: {
        //   name: '[name].[ext]',
        // },
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
        exclude: /node_modules/,
      },
      { test: /\.(ts|tsx)$/, loader: 'ts-loader', exclude: /node_modules/ },
      {
        test: /\.(js|jsx)$/,
        use: [
          {
            loader: 'source-map-loader',
          },
          {
            loader: 'babel-loader',
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias: alias,
    extensions: fileExtensions
      .map((extension) => '.' + extension)
      .concat(['.js', '.jsx', '.ts', '.tsx', '.css']),
  },
  plugins: [
    new Dotenv({ safe: true, systemvars: true }),
    new CleanWebpackPlugin({ verbose: false }),
    new webpack.ProgressPlugin(),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.EnvironmentPlugin(['NODE_ENV']),
    new webpack.DefinePlugin({
      SENTRY_RELEASE: webpack.DefinePlugin.runtimeValue(
        () =>
          `"${child_process
            .execSync('npx sentry-cli releases propose-version', {
              encoding: 'utf8',
            })
            .trim()}"`
      ),
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/manifest.json',
          to: path.join(__dirname, 'build'),
          force: true,
          transform: function (content, path) {
            // generates the manifest file using the package.json information
            const manifestContents = content
              .toString()
              .replaceAll(
                '__EMAIL_TRACKING_BACKEND_URL__',
                process.env.EMAIL_TRACKING_BACKEND_URL
              );

            const manifestObj = {
              description: process.env.npm_package_description,
              version: process.env.npm_package_version,
              ...JSON.parse(manifestContents),
            };

            if (env.NODE_ENV !== 'development') {
              // host_permissions is used for reloading
              // which we use both for login and for extension updates
              // For now this does seem helpful on login
              // delete manifestObj['host_permissions'];

              // remove the source maps
              manifestObj['web_accessible_resources'] = manifestObj[
                'web_accessible_resources'
              ].map((web_accessible_resource) => {
                return {
                  ...web_accessible_resource,
                  resources: web_accessible_resource['resources'].filter(
                    (resource) => !resource.endsWith('js.map')
                  ),
                };
              });
            }

            return Buffer.from(JSON.stringify(manifestObj));
          },
        },
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/pages/Content/content.styles.css',
          to: path.join(__dirname, 'build'),
          force: true,
          transform: function (content, path) {
            return Buffer.from(
              content
                .toString()
                .replaceAll(
                  '__EMAIL_TRACKING_BACKEND_URL__',
                  process.env.EMAIL_TRACKING_BACKEND_URL
                )
                .replaceAll(
                  '__EMAIL_TRACKING_BACKEND_URL_OLD__',
                  process.env.EMAIL_TRACKING_BACKEND_URL_OLD ||
                    process.env.EMAIL_TRACKING_BACKEND_URL
                )
            );
          },
        },
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/assets/img/icon-128.png',
          to: path.join(__dirname, 'build'),
          force: true,
        },
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/assets/img/icon-34.png',
          to: path.join(__dirname, 'build'),
          force: true,
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'pages', 'Options', 'index.html'),
      filename: 'options.html',
      chunks: ['options'],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'pages', 'Popup', 'index.html'),
      filename: 'popup.html',
      chunks: ['popup'],
      cache: false,
    }),
  ],
  infrastructureLogging: {
    level: 'info',
  },
};

if (env.NODE_ENV === 'development') {
  options.devtool = 'cheap-module-source-map';
} else {
  // https://docs.sentry.io/platforms/javascript/sourcemaps/generating/#webpack
  options.devtool = 'source-map';
  options.optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  };
}

module.exports = options;
