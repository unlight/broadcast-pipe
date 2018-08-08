/* eslint-disable import/no-duplicates, tslint/config */
import * as assert from 'assert';
import { on, emit, reactLifeCyclable } from './index';
import * as lib from './index';
import { injector } from 'njct';

class MockBroadcastChannel implements BroadcastChannel {

    constructor(public readonly name: string) { }
    onmessage() { }
    onmessageerror() { }
    close() { }
    postMessage() { }
    addEventListener() { }
    removeEventListener() { }
    dispatchEvent() {
        return true;
    }
}

injector.mock('BroadcastChannel', () => MockBroadcastChannel);

it('smoke', () => {
    assert(lib);
});

it('on regular property', () => {
    class C {
        @on('event')
        property;
    }
    const c = new C();
    emit('event', 42);
    assert.strictEqual(c.property, 42);
});


it('reactLifeCyclable decorator dummy', () => {
    @reactLifeCyclable()
    class Component {
        @on('event')
        property;
    }
    const c = new Component();
    emit('event', 42);
    assert.strictEqual(c.property, 42);
});
