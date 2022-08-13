// ... imports or other code up here ...

/**
 * Function that mutates the original webpack config.
 * Supports asynchronous changes when a promise is returned (or it's an async function).
 *
 * @param {import('preact-cli').Config} config - original webpack config
 * @param {import('preact-cli').Env} env - current environment and options pass to the CLI
 * @param {import('preact-cli').Helpers} helpers - object with useful helpers for working with the webpack config
 * @param {Record<string, unknown>} options - this is mainly relevant for plugins (will always be empty in the config), default to an empty object
 */
export default (config, env, helpers, options) => {
    /** you can change the config here **/
    if (!env.isProd) {
        // config.devServer.proxy = [
        //     {
        //         path: '/gql',
        //         target: 'http://127.0.0.1:4000',
        //     }
        // ];
    } else {
        // 
    }
    let resolve_obj = config["resolve"] || {};
    let alias_obj = resolve_obj["alias"] || {};
    alias_obj = {
        ...alias_obj,
        react: "preact/compat",
        "react-dom/test-utils": "preact/test-utils",
        "react-dom": "preact/compat",     // Must be below test-utils
        "react/jsx-runtime": "preact/jsx-runtime",
    };
    resolve_obj["alias"] = alias_obj;
    config["resolve"] = resolve_obj;
};
