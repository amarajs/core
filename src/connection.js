// @flow

import * as Types from './types'

function addToDispatchArg(provider, arg) {
    this[arg] = provider(this.target);
}

function applyArgReducer(data: {
    args: {},
    info: Types.MetaData,
    feature: Types.Feature,
    changed: boolean
}, key) {
    const prevArgs = data.info.lastArgs;
    const selector = data.feature.args[key];
    const result = selector(data.args);
    data.changed = data.changed ||
        (!(key in prevArgs)) ||
        (result !== prevArgs[key]);
    prevArgs[key] = result;
    return data;
}

export default function Connection({ keyFeatures, argProviders, featureConnections }: {
    keyFeatures: Map<string, Set<Types.Feature>>,
    argProviders: Map<string, Types.ArgSelectorFunction>,
    featureConnections: Map<Types.Feature, Types.ApplyFunction>
}) {

    const meta: Map<Types.Feature, WeakMap<any, Types.MetaData>> = new Map();

    function logAccess(feature, prop) {
        const set = keyFeatures.get(prop);
        set && set.add(feature) || keyFeatures.set(prop, new Set([feature]));
    }

    function createPropertyDescriptor(data, key) {
        data.result[key] = {
            get: function get() {
                logAccess(data.feature, key);
                return data.obj[key];
            }
        };
        return data;
    }

    function getLoggerWrapper(feature, obj) {
        const data = {
            obj,
            feature,
            result: {}
        };
        return Object.create(null, Object.keys(obj)
            .reduce(createPropertyDescriptor, data).result);
    }

    function invoke(target) {

        let args = {target};

        const feature: Types.Feature = this;
        const map = meta.get(feature) || new WeakMap();

        const info = map.get(target) || {
            logged: false,
            value: undefined,
            lastArgs: {}
        };

        argProviders.forEach(addToDispatchArg, args);
        args = info.logged ? args : getLoggerWrapper(feature, args);

        const callData = { info, feature, args, changed: false };
        Object.keys(feature.args).reduce(applyArgReducer, callData);

        if (!map.has(target) || callData.changed) {
            const params = Object.assign({}, info.lastArgs);
            info.value = feature.apply(params);
            info.logged = true;
            callData.changed = true;
        }

        map.set(target, info);
        meta.set(feature, map);

        return {changed: callData.changed, value: info.value};

    }

    return function createFeatureConnection(feature: Types.Feature) {
        const invoker = invoke.bind(feature);
        invoker.clearCache = (targets: Set<any>) => {
            const map = meta.get(feature);
            map && targets.forEach(map.delete, map);
        };
        featureConnections.set(feature, invoker);
    };

}
