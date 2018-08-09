/* eslint-disable import/no-duplicates, tslint/config */
import * as assert from 'assert';
import { on, emit, reactLifeCyclable, testGetData, off } from './index';
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
    state: any = {};
    setState(state: any) { this.state = { ...this.state, ...state }; }
    componentDidMount() { }
    componentWillUnmount() { }
}

injector.mock('BroadcastChannel', () => MockBroadcastChannel);

let component, component1, component11, component2;

afterEach(() => {
    const { events, channels } = testGetData();
    assert.equal(events.length, 0, 'events are not empty');
    assert.equal(Object.keys(channels).length, 0, 'channels are not empty');
});

it('smoke', () => {
    assert(lib);
});

it('on field', () => {
    class Dummy {
        @on('event') field = 1;
    }
    const dummy = new Dummy();
    emit('event', 42);
    off('event');
    assert.strictEqual(dummy.field, 42);
});

it('on get property', () => {
    assert.throws(() => {
        class Panchama {
            @on('event') get getProp() { return 1; }
        }
    });
});

it('on set property', () => {
    class TestClass {
        @on('event') set setProp(value: any) { }
    }
    const test = new TestClass();
    emit('event', 42);
    off('event');
    assert.strictEqual(test.setProp, 42);
});

it('reactLifeCyclable decorator', () => {
    @reactLifeCyclable()
    class Component extends BaseComponent {
        @on('event') property;
    }
    component = new Component();
    component.componentDidMount();
    emit('event', 42);
    assert.deepEqual(component.state, { property: 42 });
    component.componentWillUnmount();
});

it('reactLifeCyclable decorator with one event for several components ', () => {
    @reactLifeCyclable()
    class Component1 extends BaseComponent {
        @on('event') property;
    }
    @reactLifeCyclable()
    class Component2 extends BaseComponent {
        @on('event') property;
    }
    component1 = new Component1();
    component2 = new Component2();
    component1.componentDidMount();
    component2.componentDidMount();
    emit('event', 42);
    assert.deepEqual(component1.state, { property: 42 });
    assert.deepEqual(component2.state, { property: 42 });
    component1.componentWillUnmount();
    component2.componentWillUnmount();
});

it.only('reactLifeCyclable decorator several events', () => {
    @reactLifeCyclable()
    class Component extends BaseComponent {
        @on('event1') property1;
        @on('event2') property2;
    }
    component = new Component();
    component.componentDidMount();
    emit('event1', 42);
    emit('event2', 'XLII');
    assert.deepEqual(component.state, { property1: 42, property2: 'XLII' });
    component.componentWillUnmount();
});

it('reactLifeCyclable decorator several components with one event ', () => {
    @reactLifeCyclable()
    class Component1 extends BaseComponent {
        @on('event') property;
    }
    @reactLifeCyclable()
    class Component2 extends BaseComponent {
        @on('event') property;
    }
    component1 = new Component1();
    component11 = new Component1();
    component2 = new Component2();
    component1.componentDidMount();
    component11.componentDidMount();
    component2.componentDidMount();
    emit('event', 42);
    component1.componentWillUnmount();
    component11.componentWillUnmount();
    component2.componentWillUnmount();
});
