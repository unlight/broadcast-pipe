/* eslint-disable import/no-duplicates, tslint/config */
import * as assert from 'assert';
import { on, emit, reactLifeCyclable } from './index';
import * as lib from './index';
import { injector } from 'njct';
import { EventEmitter } from 'events';

class MockBroadcastChannel extends EventEmitter implements BroadcastChannel {

    constructor(public readonly name: string) {
        super();
    }
    onmessage() { }
    onmessageerror() { }
    close() { }
    postMessage(data: any) {
        const event: MessageEvent = {
            data,
            origin: null,
            ports: null,
            source: null,
            initMessageEvent() { },
            bubbles: true,
            cancelBubble: true,
            cancelable: true,
            composed: true,
            currentTarget: null,
            defaultPrevented: true,
            eventPhase: 1,
            isTrusted: true,
            returnValue: true,
            srcElement: null,
            target: null,
            timeStamp: 1,
            type: 'message',
            deepPath() { return []; },
            initEvent(type: string, bubbles?: boolean, cancelable?: boolean) { },
            preventDefault() { },
            stopImmediatePropagation() { },
            stopPropagation() { },
            AT_TARGET: 1,
            BUBBLING_PHASE: 1,
            CAPTURING_PHASE: 1,
            NONE: 1,
        };
        this.emit('message', event);
    }
    addEventListener(name: string, listener: (...args: any[]) => void) {
        assert(name === 'message');
        this.on('message', listener);
    }
    removeEventListener() { }
    dispatchEvent() {
        return true;
    }
}

class BaseComponent {
    state: any;
    componentDidMount() { }
    setState(state: any) { this.state = state; }
}

injector.mock('BroadcastChannel', () => MockBroadcastChannel);

it('smoke', () => {
    assert(lib);
});

it('on field', () => {
    class Dummy {
        @on('event') field = 1;
    }
    const c = new Dummy();
    emit('event', 42);
    assert.strictEqual(c.field, 42);
});

it('on get property', () => {
    assert.throws(() => {
        class Panchama {
            @on('event') get getProp() { }
        }
    });
});

it('on set property', () => {
    class Repeat {
        @on('event') set setProp(value: any) { }
    }
    const c = new Repeat();
    emit('event', 42);
    assert.strictEqual(c.setProp, 42);
});

it('reactLifeCyclable decorator', () => {
    @reactLifeCyclable()
    class Component extends BaseComponent {
        @on('event') property;
    }
    const c = new Component();
    c.componentDidMount();
    emit('event', 42);
    assert.deepEqual(c.state, { property: 42 });
});

it.only('reactLifeCyclable decorator with one event for several components ', () => {
    @reactLifeCyclable()
    class Component1 extends BaseComponent {
        @on('event') property;
    }
    @reactLifeCyclable()
    class Component2 extends BaseComponent {
        @on('event') property;
    }
    const c1 = new Component1();
    const c2 = new Component2();
    c1.componentDidMount();
    c2.componentDidMount();
    emit('event', 42);
    assert.deepEqual(c1.state, { property: 42 });
    assert.deepEqual(c2.state, { property: 42 });
});
