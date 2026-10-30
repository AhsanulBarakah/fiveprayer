const defaultConfig = require('@wordpress/scripts/config/webpack.config.js');
const DependencyExtractionWebpackPlugin = require('@wordpress/dependency-extraction-webpack-plugin');
const path = require('path');

// The admin app is the only build that runs react-router v8, which needs React 19.
// WordPress still ships React 18, so the admin bundle carries its own React instead
// of treating `react`/`react-dom` as externals. The app uses no @wordpress React
// packages (only api-fetch, i18n and url), so the two React copies never interact.
const isAdminBuild = process.env.WP_SOURCE_PATH === 'src';

const wpExternals = {
	'@wordpress/api-fetch': ['wp', 'apiFetch'],
	'@wordpress/i18n': ['wp', 'i18n'],
	'@wordpress/url': ['wp', 'url'],
};

const wpHandles = {
	'@wordpress/api-fetch': 'wp-api-fetch',
	'@wordpress/i18n': 'wp-i18n',
	'@wordpress/url': 'wp-url',
};

const adminDependencyExtraction = new DependencyExtractionWebpackPlugin({
	useDefaults: false,
	requestToExternal: (request) => wpExternals[request],
	requestToHandle: (request) => wpHandles[request],
});

module.exports = {
    ...defaultConfig,
    resolve: {
        ...defaultConfig.resolve,
        alias: {
            ...defaultConfig.resolve?.alias,
        },
        fallback: {
            ...defaultConfig.resolve?.fallback,
        },
    },
    module: {
        ...defaultConfig.module,
        rules: [
            ...(defaultConfig.module?.rules || []),
        ],
    },
    optimization: {
        ...defaultConfig.optimization,
        splitChunks: {
            ...(defaultConfig.optimization?.splitChunks || {}),
            chunks: 'all',
            cacheGroups: {
                ...(defaultConfig.optimization?.splitChunks?.cacheGroups || {}),
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true,
                },
                // React is pinned by the framework, not by app code, so keep it in
                // its own chunk: the app rebuilds often, React (and its scheduler)
                // rarely changes and stays cached in the browser across releases.
                react: {
                    test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                    name: 'react',
                    priority: 30,
                    chunks: 'all',
                    enforce: true,
                },
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    priority: -10,
                },
                reactIcons: {
                    test: /[\\/]node_modules[\\/]react-icons[\\/]/,
                    name: 'react-icons',
                    priority: 20,
                    chunks: 'all',
                },
                styledComponents: {
                    test: /[\\/]node_modules[\\/]styled-components[\\/]/,
                    name: 'styled-components',
                    priority: 15,
                    chunks: 'all',
                },
                reactColorful: {
                    test: /[\\/]node_modules[\\/]react-colorful[\\/]/,
                    name: 'react-colorful',
                    priority: 15,
                    chunks: 'all',
                },
                wordpress: {
                    test: /[\\/]node_modules[\\/]@wordpress[\\/]/,
                    name: 'wordpress',
                    priority: 15,
                    chunks: 'all',
                },
                pages: {
                    test: /[\\/]src[\\/]admin[\\/]components[\\/]pages[\\/]/,
                    name: 'pages',
                    priority: 10,
                    chunks: 'all',
                },
                // Route folders (e.g. customizing/pages/SettingsPage) grow into
                // large single chunks. Hoist their code into shared chunks capped
                // at 190 KB so no route asset can outgrow the per-asset budget.
                routePages: {
                    test: /[\\/]src[\\/]admin[\\/]components[\\/][^\\/]+[\\/]pages[\\/]/,
                    priority: 9,
                    chunks: 'all',
                    minChunks: 1,
                    maxSize: 190000,
                    reuseExistingChunk: true,
                },
                components: {
                    test: /[\\/]src[\\/]admin[\\/]components[\\/](?!pages)[\\/]/,
                    name: 'components',
                    priority: 5,
                    chunks: 'all',
                },
            },
        },
        runtimeChunk: {
            name: 'runtime',
        },
    },
    performance: {
        ...defaultConfig.performance,
        // The admin app bundles its own React 19 (react-router 8 needs it), so a
        // 195 KiB per-asset / 391 KiB per-entrypoint budget can never be met: the
        // React chunk alone is ~214 KiB minified. React and ReactDOM live in their
        // own long-lived `react` chunk, so these budgets stay at webpack's default
        // 244 KiB per asset plus the measured initial payload (~549 KiB) rounded up.
        // Regressions in app code still show up as new warnings.
        maxAssetSize: 250000, // 244KB per chunk (webpack default)
        maxEntrypointSize: 600000, // ~586KB for the initial admin payload
    },
    plugins: [
        ...(defaultConfig.plugins || []).filter(
            (plugin) => !(isAdminBuild && plugin instanceof DependencyExtractionWebpackPlugin)
        ),
        ...(isAdminBuild ? [adminDependencyExtraction] : []),
        // Suppress React warnings in production
        {
            apply: (compiler) => {
                compiler.hooks.beforeCompile.tap('SuppressReactWarnings', () => {
                    const originalConsoleError = console.error;
                    console.error = (...args) => {
                        if (typeof args[0] === 'string' && 
                            args[0].includes('Each child in a list should have a unique "key" prop')) {
                            return; // Suppress React key warnings
                        }
                        originalConsoleError.apply(console, args);
                    };
                });
            },
        },
    ],
};
