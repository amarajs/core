// @flow

export type Feature = {
    id: number,
    type: string,
    targets: string[],
    apply: ApplyFunction,
    args: FeatureArgsMap
}

export type FeatureArgsMap = {
    [name: string]: ArgSelectorFunction
}

export type ArgMap = {
    [name: string]: any
}

export type MetaData = {
    value: any,
    logged: boolean,
    lastArgs: {}
}

export type Action = {
    type: string,
    payload?: any,
    meta?: {},
}

export type ApplyFunction = (arg?: ArgMap) => any;
export type ArgSelectorFunction = (target: any) => any;
export type ActionHandler = (action: Action) => void;
export type Middleware = (dispatch: ActionHandler) => ActionHandler;

export type Filter = (feature: Feature) => boolean;
export type Sorter = (lhs: Feature, rhs: Feature) => number;

export type Bootstrap = (target: any) => Amara;
export type Add = (feature: Feature) => Amara;
export type Config = (key: string, method: Filter|Sorter) => Amara;

export type Amara = {
    add: Add,
    bootstrap: Bootstrap,
    config: Config
}
