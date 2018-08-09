import { inject } from 'njct';

const channels: { [name: string]: BroadcastChannel } = {};
let events: Array<{ event: string, property: string, type: FunctionConstructor }> = [];
const instancesByConstructor = new WeakMap<FunctionConstructor, any[]>();
const listenersByEvent = new Map<string, Function[]>();

export function on(event: string) {
    let value: any;
    const listener = (e: MessageEvent) => {
        value = e.data;
    };
    updateCollection(listenersByEvent, event, listener);
    channel(event).addEventListener('message', listener);
    const get = () => value;
    const set = (newValue: any) => {
        value = newValue;
    };
    return function(prototype: any, property: string, descriptor: PropertyDescriptor = {}) {
        if (descriptor.get) {
            off(event);
            throw new TypeError(`Getter cannot be decoratorated by on`);
        }
        descriptor.get = get;
        descriptor.set = set;
        Object.defineProperty(prototype, property, descriptor);
        // Collect event for reactLifeCyclable
        events.push({ event, property, type: prototype.constructor });
    };
}

export function emit<T = any>(event: string, data: T) {
    channel(event).postMessage(data);
    for (const { event: name, property, type } of events) {
        if (name !== event) {
            continue;
        }
        const instances = instancesByConstructor.get(type);
        if (!instances) {
            continue;
        }
        for (const instance of instances) {
            instance.setState({ [property]: instance[property] });
        }
    }
}

export function off(event: string) {
    const ch = channel(event);
    const listeners = listenersByEvent.get(event);
    if (listeners) {
        listeners.forEach((listener: any) => ch.removeEventListener('message', listener));
    }
    ch.close();
    delete channels[event];
    const index = events.findIndex(item => item.event === event);
    if (index !== -1) {
        events.splice(index, 1);
    }
}

export function reactLifeCyclable(): ClassDecorator {
    return function(type: any) {
        const componentDidMount = type.componentDidMount;
        const componentWillUnMount = type.componentWillUnMount;

        type.prototype.componentDidMount = function() {
            // Original componentDidMount
            if (componentDidMount) {
                componentDidMount.apply(this, arguments);
            }
            updateCollection(instancesByConstructor, type, this);
        };

        type.prototype.componentWillUnmount = function() {
            const instances = instancesByConstructor.get(type);
            if (instances) {
                const index = instances.indexOf(this);
                if (index !== -1) {
                    instances.splice(index, 1);
                }
                if (instances.length > 0) {
                    instancesByConstructor.set(type, instances);
                } else {
                    instancesByConstructor.delete(type);
                    // Remove all events associated with this prototype
                    events = events.filter(item => {
                        if (item.type === type) {
                            off(item.event);
                            return false;
                        }
                        return true;
                    });
                }
            }
            // Original componentWillUnMount
            if (componentWillUnMount) {
                componentWillUnMount.apply(this, arguments);
            }
        };
    };
}

function channel(name: string) {
    const BroadcastChannelCtor = inject('BroadcastChannel', () => BroadcastChannel);
    if (!channels[name]) {
        channels[name] = new BroadcastChannelCtor(name);
    }
    return channels[name];
}

function updateCollection(map: any, key: any, item: any) {
    let collection = map.get(key);
    if (!collection) {
        collection = [];
    }
    collection.push(item);
    map.set(key, collection);
}

export function testGetData() {
    return { events, channels };
}
