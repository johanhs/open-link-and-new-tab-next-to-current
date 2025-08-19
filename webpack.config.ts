import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ESLintPlugin from 'eslint-webpack-plugin';
import type { Configuration } from 'webpack';

const require = createRequire(import.meta.url);
const ExtReloader = require('webpack-ext-reloader');

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mode: 'development' | 'production';
let devtool: 'source-map' | false;

let outputDirectory = process.env.TARGET ?? 'chrome';
const manifestPath = process.env.TARGET === 'chrome' ? 'src/manifest_chrome.json' : 'src/manifest_firefox.json';

if (process.env.NODE_ENV === 'development') {
    mode = 'development';
    devtool = 'source-map';
    outputDirectory = `${outputDirectory}/dev`;
} else {
    mode = 'production';
    devtool = false;
    outputDirectory = `${outputDirectory}/prod`;
}

let config: Configuration = {
    mode,
    target: 'web',
    devtool,
    entry: {
        serviceWorker: [path.resolve(__dirname, 'src/serviceWorker/index.ts')],
        content: [path.resolve(__dirname, 'src/content/index.ts')],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        alias: {
            serviceWorker: path.resolve(__dirname, './src/serviceWorker/'),
            content: [path.resolve(__dirname, 'src/content/')],
            assets: path.resolve(__dirname, './src/assets/'),
            utils: path.resolve(__dirname, './src/utils/'),
            types: path.resolve(__dirname, './src/types/'),
        },
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: '[name]/[name].js',
        path: path.resolve(__dirname, outputDirectory),
    },
    plugins: [
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'src/assets'),
                    to: path.resolve(__dirname, `${outputDirectory}/assets`),
                },
                {
                    from: path.resolve(__dirname, manifestPath),
                    to: path.resolve(__dirname, `${outputDirectory}/manifest.json`),
                },
                {
                    from: path.resolve(__dirname, 'src/utils'),
                    to: path.resolve(__dirname, `${outputDirectory}/utils`),
                },
            ],
        }),
    ],
};

if (mode === 'development') {
    config = {
        ...config,
        watch: true,
        plugins: [
            ...(config.plugins || []),
            new ESLintPlugin({}),
            new ExtReloader({
                port: 8883,
                reloadPage: true,
                entries: {
                    background: 'serviceWorker',
                    contentScript: ['content'],
                },
            }),
        ],
    };
}

export default config;
