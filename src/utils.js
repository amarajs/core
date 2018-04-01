const resolved = Promise.resolve();

function immediate(fn) {
    resolved.then(fn);
}

export function nop() {}

export function attempt(fn, ...args) {
    try {
        return fn(...args)
    } catch (e) {
        return e;
    }
}

export function throwError(message) {
    throw new Error(message);
}

export function getAction(type, payload = {}, meta = {}) {
    return {type, payload, meta};
}

export function overEvery(...fns) {
    return function iterator(item) {
        let fn, index = fns.length;
        while (fn = fns[--index]) {
            fn(item);
        }
    };
}

export function debounce(method, scheduler = immediate) {
    let called = false;
    return function scheduled(...args) {
        if (called) {
            return;
        }
        called = true;
        scheduler(() => {
            called = false;
            method(...args);
        });
    };
}
