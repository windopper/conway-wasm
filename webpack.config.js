const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');

module.exports = (env, argv) => {
    const isDevelopment = argv.mode === 'development';
    
    return {
        mode: isDevelopment ? 'development' : 'production',
        entry: './src/index.jsx',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'bundle.js',
        },
        module: {
            rules: [
                {
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env', '@babel/preset-react']
                        }
                    }
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader', 'postcss-loader']
                }
            ]
        },
        resolve: {
            extensions: ['.js', '.jsx']
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: './index.html'
            }),
            new WasmPackPlugin({
                crateDirectory: path.resolve(__dirname, '.'),
                watchDirectories: isDevelopment ? [
                    path.resolve(__dirname, 'src'),
                    path.resolve(__dirname, 'Cargo.toml'),
                    path.resolve(__dirname, 'Cargo.lock')
                ] : [],
                forceMode: isDevelopment ? 'development' : 'production'
            })
        ],
        experiments: {
            asyncWebAssembly: true
        },
        devServer: {
            static: {
                directory: path.join(__dirname, 'dist'),
            },
            compress: true,
            port: 8080,
            hot: true,
            watchFiles: {
                paths: ['src/**/*', 'Cargo.toml', 'Cargo.lock'],
                options: {
                    usePolling: true,
                    interval: 1000,
                }
            }
        },
        watch: isDevelopment,
        watchOptions: {
            ignored: /node_modules/,
            poll: 1000,
        }
    };
};