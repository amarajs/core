// @flow

import * as Types from './types';
import Connection from './connection';
import { attempt, getAction, throwError, overEvery, debounce } from './utils';

let featureCount = 0; // ensures unique feature ids

// helpers

function createEmptySetForKey(key) {
    this.set(key, new Set());
}

function isAlsoTrue(predicate) {
    this.result = this.result && predicate(this.arg);
}

function every(predicates: Set<Types.Filter>, arg: Types.Feature): boolean {
    const context = {result: true, arg};
    predicates.forEach(isAlsoTrue, context);
    return context.result;
}

function isNonEmptyString(obj) {
    return !!obj && typeof obj === 'string' && obj.trim().length > 0;
}

function validate(feature) {
    if (!feature || !('type' in feature) || !('targets' in feature) || !('apply' in feature)) {
        throwError('Features require "type", "targets", and "apply" members.');
    } else if (typeof feature.apply !== 'function') {
        throwError('Member "apply" must be a function.');
    } else if (!isNonEmptyString(feature.type)) {
        throwError('Member "type" must be a non-empty string.');
    } else if (!Array.isArray(feature.targets) || !feature.targets.length || !feature.targets.every(isNonEmptyString)) {
        throwError('Member "targets" must be a non-empty array of non-empty strings.');
    }
}

function validateConfig(key, callback) {
    if (!isNonEmptyString(key) || typeof callback !== 'function') {
        throwError('Method `config` expects a non-empty string and a function.');
    }
}

function copy(key) {
    this.result.set(key, this.map.get(key));
}

function sort(sorter: Types.Sorter) {
    if (this.result !== 0) return;
    this.result = sorter(this.a, this.b);
}

function addToMap(target) {
    const arr = this.map.get(target);
    const result = this.invoke(target);
    if (!arr) {
        this.map.set(target, [result]);
    } else {
        arr[arr.length] = result;
    }
}

export default function Amara(middleware: Types.Middleware[] = []): Types.Amara {

    let bootstrapped = false;

    // the collection of arg keys that have been changed this frame
    const changedKeys: Set<string> = new Set();

    // the features added to amara in this frame
    const addedFeatures: Set<Types.Feature> = new Set();

    // all the features added to amara with connected apply methods
    const features: Array<Types.Feature> = [];

    // any configured filter and sorter utility methods
    const helpers: Map<string, Set<Function>> = new Map();

    // the features which need to be re-applied
    const applyQueue: Map<Types.Feature, Set<any>> = new Map();

    // arg keys and their corresponding selector function
    const argProviders: Map<string, Types.ArgSelectorFunction> = new Map();

    // the instantiated middleware pipeline
    const interceptors = [handler].concat(middleware.map(createInterceptor));

    // keeps track of which features accessed each arg key
    const keyFeatures: Map<string, Set<Types.Feature>> = new Map();

    const featureConnections: Map<Types.Feature, Types.ApplyFunction> = new Map();
    const createFeatureConnection = Connection({featureConnections, argProviders, keyFeatures});
    const addAndConnectFeature = overEvery(Array.prototype.push.bind(features), createFeatureConnection);

    function dispatch(action) {
        let result,
            interceptor,
            index = interceptors.length;
        while (interceptor = interceptors[--index]) {
            result = attempt(interceptor, action);
            if (result instanceof Error) {
                dispatch(getAction('error', result));
                break;
            }
        }
    }

    function createInterceptor(mw: Types.Middleware): Types.ActionHandler {
        return mw(dispatch);
    }

    function register(key, paramProvider) {
        argProviders.set(key, paramProvider);
        return () => argProviders.delete(key);
    }

    function setDefaults(feature) {
        feature.id = featureCount++;
        feature.args = feature.args || {};
    }

    function processFeatureTargets(targets, feature) {
        targets && targets.size && enqueueApply(feature, targets);
    }

    function addFeatureToMap(key) {
        const set = keyFeatures.get(key);
        set && set.forEach(createEmptySetForKey, this);
    }

    function onChangeOccurred(key: string) {
        if (!argProviders.has(key)) {
            throwError(`No value provider has been specified for '${key}'.`)
        }
        changedKeys.add(key);
        scheduleKeyChangeHandler();
    }

    function onFeaturesAdded(added: Set<Types.Feature>) {
        added.forEach(addAndConnectFeature);
    }

    function onEnqueueApply(items: Array<{feature: Types.Feature, targets: any[]}>) {
        let item, index = 0;
        while (item = items[index++]) {
            enqueueApply(item.feature, item.targets);
        }
    }

    function onClearFeatureTargetsCache({feature, targets}: {
        targets: Set<any>,
        feature: Types.Feature
    }) {
        const connection = featureConnections.get(feature);
        connection && connection.clearCache(targets);
    }

    function addFeature(feature) {
        if (!features.includes(feature)) {
            validate(feature);
            setDefaults(feature);
            addedFeatures.add(feature);
            scheduleFeaturesAdded();
        }
    }

    function onAddFeatures(features) {
        features.forEach(addFeature);
    }

    function handler(action) {
        const payload: any = action.payload;
        switch (action.type) {
        case 'core:change-occurred':
            onChangeOccurred(payload);
            break;
        case 'core:features-added':
            onFeaturesAdded(payload);
            break;
        case 'core:enqueue-apply':
            onEnqueueApply(payload);
            break;
        case 'core:clear-cache':
            onClearFeatureTargetsCache(payload);
            break;
        case 'core:add-features':
            onAddFeatures(payload);
            break;
        }
    }

    function isAllowed(feature) {
        const filters: void|Set<Types.Filter> = helpers.get('filter');
        return !filters || every(filters, feature);
    }

    function enqueueApply(feature, targets) {
        if (!isAllowed(feature)) return;
        const targetSet = applyQueue.get(feature)
        if (!targetSet) {
            applyQueue.set(feature, new Set(targets));
        } else {
            targets.forEach(targetSet.add, targetSet);
        }
        scheduleQueueFlush();
    }

    function invokeConnection(targets, feature) {
        const invoke = featureConnections.get(feature);
        const map = this[feature.type] = this[feature.type] || new Map();
        targets.forEach(addToMap, {map, invoke, type: feature.type});
    }

    function masterSort(a: Types.Feature, b: Types.Feature): number {
        const context = {result: 0, a, b};
        const sorters: void|Set<Types.Sorter> = helpers.get('sorter');
        if (!sorters)
            return 0;
        sorters.forEach(sort, context);
        return context.result;
    }

    function byId(a: Types.Feature, b: Types.Feature): number {
        return a.id - b.id;
    }

    function sortByKeys(map: Map<Types.Feature, Set<any>>) {
        const keys = Array.from(map.keys());
        const context = {
            map,
            result: new Map()
        }
        keys.sort(byId);
        keys.sort(masterSort);
        keys.forEach(copy, context);
        return context.result;
    }

    function isChanged(result) {
        return result.changed;
    }

    function getValue(result) {
        return result.value;
    }

    function mapOrRemoveUnchanged(results, target) {
        if (!results.some(isChanged)) {
            return this.delete(target);
        }
        this.set(target, results.map(getValue));
    }

    function prune(type) {
        const targetResults = this[type];
        targetResults.forEach(mapOrRemoveUnchanged, targetResults);
        targetResults.size || delete this[type];
    }

    function removeUnchangedResults(payload: {[key: string]: Map<any, any[]>}) {
        Object.keys(payload).forEach(prune, payload);
    }

    const scheduleKeyChangeHandler = debounce(function keyChangeHandler() {
        const map: Map<Types.Feature, Set<any>> = new Map();
        changedKeys.forEach(addFeatureToMap, map);
        dispatch(getAction('core:populate-feature-targets', map))
        sortByKeys(map).forEach(processFeatureTargets);
        changedKeys.clear();
    }, setTimeout);

    const scheduleQueueFlush = debounce(function flushApplyQueue() {
        const payload:{[key: string]: Map<any, any[]>} = {};
        sortByKeys(applyQueue).forEach(invokeConnection, payload)
        removeUnchangedResults(payload);
        applyQueue.clear();
        Object.keys(payload).length && dispatch(getAction('core:apply-target-results', payload));
    });

    const scheduleBootstrap = debounce(function announceBootstrap(payload) {
        dispatch(getAction('core:bootstrap', payload))
    });

    const scheduleFeaturesAdded = debounce(function announceAddedFeatures() {
        const added: Set<Types.Feature> = new Set(addedFeatures);
        addedFeatures.clear();
        dispatch(getAction('core:features-added', added));
    });

    const api = {

        bootstrap: function bootstrap(target) {
            bootstrapped && throwError('Amara already bootstrapped.');
            bootstrapped = true;
            scheduleBootstrap({target, register});
            return api;
        },

        add: function add(feature) {
            validate(feature);
            dispatch(getAction('core:add-features', [feature]));
            return api;
        },

        config: function config(key, method) {
            validateConfig(key, method);
            const set = helpers.get(key);
            set && set.add(method) || helpers.set(key, new Set([method]));
            return api;
        }

    };

    return api;

}
