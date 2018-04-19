const sinon = require('sinon');
const expect = require('chai').expect;
const Amara = require('../dist/amara-core');

describe('Amara', function() {

    beforeEach(function() {
        this.actions = [];
        this.mw = () => [(dispatch) => (action) => {
            this.dispatch = dispatch;
            this.actions.push(action);
        }];
    });

    it('has expected API', function() {
        const amara = Amara();
        expect(amara.add).is.a('function');
        expect(amara.config).is.a('function');
        expect(amara.bootstrap).is.a('function');
    });

    describe('add', function() {

        it('throws if invalid feature provided', function() {
            const amara = Amara();
            [
                {feature: null, msg: 'Features require "type", "targets", and "apply" members.'},
                {feature: {}, msg: 'Features require "type", "targets", and "apply" members.'},
                {feature: {type: 'type'}, msg: 'Features require "type", "targets", and "apply" members.'},
                {feature: {type: 'type', targets: ['targets']}, msg: 'Features require "type", "targets", and "apply" members.'},
                {feature: {type: 'type', apply: () => {}}, msg: 'Features require "type", "targets", and "apply" members.'},
                {feature: {type: 'type', targets: ['targets'], apply: null}, msg: 'Member "apply" must be a function.'},
                {feature: {type: '', targets: ['targets'], apply: ()=>{}}, msg: 'Member "type" must be a non-empty string.'},
                {feature: {type: 'type', targets: null, apply: ()=>{}}, msg: 'Member "targets" must be a non-empty array of non-empty strings.'},
                {feature: {type: 'type', targets: [], apply: ()=>{}}, msg: 'Member "targets" must be a non-empty array of non-empty strings.'},
                {feature: {type: 'type', targets: [''], apply: ()=>{}}, msg: 'Member "targets" must be a non-empty array of non-empty strings.'},
                {feature: {type: 'type', targets: ['abc', ''], apply: ()=>{}}, msg: 'Member "targets" must be a non-empty array of non-empty strings.'}
            ].forEach(({feature, msg}) => {
                expect(() => amara.add(feature)).to.throw(msg);
            });
        });

        it('schedules core:features-added', function(done) {
            Amara(this.mw()).add({type: 'type', targets: ['target'], apply: () => {}});
            setTimeout(() => {
                const result = this.actions.find(action => action.type === 'core:features-added');
                expect(result).defined;
                done();
            });
        });

        it('core:features-added payload is Set of all features added this frame', function(done) {
            const feature1 = {type: 'type', targets: ['target'], apply: () => {}};
            const feature2 = {type: 'type', targets: ['different'], apply: () => {}};
            Amara(this.mw())
                .add(feature1)
                .add(feature2);
            setTimeout(() => {
                const {payload} = this.actions.find(action => action.type === 'core:features-added');
                expect(payload.size).equals(2);
                expect(payload.has(feature1)).true;
                expect(payload.has(feature2)).true;
                done();
            });
        });

        it('empty args map set if not provided', function(done) {
            const feature = {type: 'type', targets: ['target'], apply: () => {}};
            Amara(this.mw()).add(feature);
            setTimeout(() => {
                expect(feature.args).defined;
                expect(feature.args).eql({});
                done();
            });
        });

    });

    describe('config', function() {

        it('returns same instance', function() {
            const amara = Amara();
            expect(amara.config('key', () => {})).equals(amara);
        });

        it('throws if invalid key provided', function() {
            const amara = Amara();
            [null, NaN, 123, '', {}, [], /rx/, ()=>{}].forEach(key => {
                expect(() => amara.config(key, () => {}))
                    .to.throw('Method `config` expects a non-empty string and a function.');
            });
        });

        it('throws if invalid method provided', function() {
            const amara = Amara();
            [null, NaN, 123, '', {}, [], /rx/].forEach(fn => {
                expect(() => amara.config('key', fn))
                    .to.throw('Method `config` expects a non-empty string and a function.');
            });
        });

        it('allows multiple methods for same key', function() {
            const amara = Amara();
            amara.config('key', () => {});
            expect(() => amara.config('key', () => {})).not.to.throw();
        });

    });

    describe('bootstrap', function() {

        it('returns same instance', function() {
            const amara = Amara();
            expect(amara.bootstrap()).equals(amara);
        });

        it('throws if already bootstrapped', function() {
            const amara = Amara();
            amara.bootstrap();
            expect(amara.bootstrap).to.throw('Amara already bootstrapped.');
        });

        it('schedules core:bootstrap', function(done) {
            Amara(this.mw()).bootstrap();
            setTimeout(() => {
                expect(this.actions[0].type).equals('core:bootstrap');
                done();
            });
        });

        it('core:bootstrap has expected payload', function(done) {
            Amara(this.mw()).bootstrap('target');
            setTimeout(() => {
                const {payload} = this.actions[0];
                expect(payload.target).equals('target');
                expect(payload.register).is.a('function');
                done();
            });
        });

    });

    describe('actions sent', function() {

        describe('error', function() {

            it('when middleware throws', function(done) {
                const actions = [];
                const err = new Error('test');
                Amara([() => (action) => {
                    if (actions.push(action) === 1)
                        throw err;
                }]).bootstrap();
                setTimeout(() => {
                    const last = actions.pop();
                    expect(last.type).equals('error');
                    expect(last.payload).equals(err);
                    done();
                });
            });

            it('when middleware returns Error', function(done) {
                const actions = [];
                const err = new Error('test');
                Amara([() => (action) => {
                    if (actions.push(action) === 1)
                        return err;
                }]).bootstrap();
                setTimeout(() => {
                    const last = actions.pop();
                    expect(last.type).equals('error');
                    expect(last.payload).equals(err);
                    done();
                });
            });

        });

        describe('core:populate-feature-targets', function() {

            it('fires after core:change-occurred', function(done) {
                const actions = [];
                const feature = {type: 'type', args: {key: () => {}}, targets: ['target'], apply: () => {}};
                Amara([(dispatch) => {
                    return (action) => {
                        actions.push(action);
                        if (action.type === 'core:bootstrap') {
                            action.payload.register('key', () => {});
                            dispatch({
                                type: 'core:change-occurred',
                                payload: 'key'
                            });
                        }
                    };
                }])
                    .add(feature)
                    .bootstrap();
                setTimeout(() => {
                    const action = actions.find(({type}) =>
                        type === 'core:populate-feature-targets');
                    expect(action).defined;
                    expect(action.payload).is.a('map');
                    done();
                }, 10);
            })

        });

        describe('core:apply-target-results', function() {

            it('fired in response to core:enqueue-apply', function(done) {
                let dispatch;
                const feature = {type: 'type', targets: ['target'], apply: () => 'abc'};
                const handler = sinon.stub();
                Amara([(dispatcher) => {
                    dispatch = dispatcher;
                    return handler;
                }]).add(feature);
                const token = setInterval(() => {
                    const action = handler.lastCall.args[0];
                    if(action.type === 'core:apply-target-results') {
                        clearInterval(token);
                        done();
                    }
                }, 10);
                setTimeout(() => {
                    dispatch({
                        type: 'core:enqueue-apply',
                        payload: [{feature, targets: [{}]}]
                    });
                });
            });

            it('has expected payload', function(done) {
                let dispatch;
                const target = {};
                const feature = {type: 'type', targets: ['target'], apply: () => 'abc'};
                const handler = sinon.stub();
                Amara([(dispatcher) => {
                    dispatch = dispatcher;
                    return handler;
                }]).add(feature);
                setTimeout(() => {
                    dispatch({
                        type: 'core:enqueue-apply',
                        payload: [{feature, targets: [target]}]
                    });
                    setTimeout(() => {
                        const action = handler.lastCall.args[0];
                        expect(action.payload).to.have.keys('type');
                        expect(action.payload.type.size).equals(1);
                        expect(action.payload.type.get(target)).is.a('array');
                        expect(action.payload.type.get(target)[0]).equals('abc');
                        done();
                    }, 2);
                });
            });

        });

    });

    describe('apply connection', function() {

        it('arg selectors accessed on first apply', function(done) {
            let dispatch;
            const target = {};
            const handler = sinon.stub();
            const provider = sinon.stub();
            const apply = sinon.spy();
            const feature = {
                type: 'type',
                targets: ['target'],
                args: {key: ({a}) => a.toString()},
                apply
            };
            handler.callsFake((action) => {
                if (action.type === 'core:bootstrap')
                    action.payload.register('a', provider);
            });
            provider.onFirstCall().returns(123);
            provider.onSecondCall().returns(456);
            Amara([(dispatcher) => {
                dispatch = dispatcher;
                return handler;
            }])
                .add(feature)
                .bootstrap();
            setTimeout(() => {
                dispatch({type: 'core:enqueue-apply', payload: [
                    {feature, targets: [target]}
                ]});
                setTimeout(() => {
                    expect(apply.calledWith({key: '123'})).true;
                    done();
                });
            });
        });

        it('arg selectors accessed on change-occurred', function(done) {
            let dispatch, applyCount = 0;
            const target = {};
            const handler = sinon.stub();
            const provider = sinon.stub();
            const apply = sinon.spy();
            const feature = {
                type: 'type',
                targets: ['target'],
                args: {key: ({a}) => a.toString()},
                apply
            };
            handler.callsFake((action) => {
                if (action.type === 'core:bootstrap')
                    action.payload.register('a', provider);
                else if (action.type === 'core:populate-feature-targets') {
                    action.payload.get(feature).add(target);
                } else if (action.type === 'core:apply-target-results') {
                    if (++applyCount === 2) {
                        expect(apply.calledWith({key: '123'})).true;
                        expect(apply.calledWith({key: '456'})).true;
                        done();
                    }
                }
            });
            provider.onFirstCall().returns(123);
            provider.onSecondCall().returns(456);
            Amara([(dispatcher) => {
                dispatch = dispatcher;
                return handler;
            }])
                .add(feature)
                .bootstrap();
            setTimeout(() => {
                dispatch({type: 'core:enqueue-apply', payload: [
                    {feature, targets: [target]}
                ]});
                dispatch({type: 'core:change-occurred', payload: 'a'});
            }, 10);
        });

        it('no args returns first apply result', function(done) {
            let dispatch;
            const target = {};
            const handler = sinon.stub();
            const apply = sinon.stub();
            const feature = {
                type: 'type',
                targets: ['target'],
                apply
            };
            handler.callsFake((action) => {
                if (action.type === 'core:populate-feature-targets') {
                    action.payload.get(feature).add(target);
                } else if (action.type === 'core:apply-target-results') {
                    expect(apply.calledWith({key: '123'})).true;
                    done();
                }
            });
            Amara([(dispatcher) => {
                dispatch = dispatcher;
                return handler;
            }])
                .add(feature)
                .bootstrap();
            setTimeout(() => {
                dispatch({type: 'core:enqueue-apply', payload: [
                    {feature, targets: [target]}
                ]});
                setTimeout(() => {
                    dispatch({type: 'core:enqueue-apply', payload: [
                        {feature, targets: [target]}
                    ]});
                    setTimeout(() => {
                        expect(apply.callCount).equals(1);
                        done();
                    });
                });
            }, 10);
        });

    });

});
