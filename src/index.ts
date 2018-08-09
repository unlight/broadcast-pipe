import { inject } from 'njct';

const channels: { [name: string]: BroadcastChannel } = {};
const events: Array<{ event: string, property: string, type: FunctionConstructor }> = [];
const instancesByConstructor = new WeakMap<FunctionConstructor, any[]>();

function channel(name: string) {
    const BroadcastChannelCtor = inject('BroadcastChannel', () => BroadcastChannel);
    if (!channels[name]) {
        channels[name] = new BroadcastChannelCtor(name);
    }
    return channels[name];
}

export function on(event: string) {
    let value: any;
    channel(event).addEventListener('message', (e: MessageEvent) => {
        value = e.data;
    });
    const get = () => value;
    const set = (newValue: any) => {
        value = newValue;
    };
    return function(prototype: any, property: string, descriptor: PropertyDescriptor = {}) {
        if (descriptor.get) {
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
    events.filter(x => x.event === event)
        .forEach(x => {
            const instances = instancesByConstructor.get(x.type) || [];
            // const state = {};
            instances.forEach(instance => {
                // state[x.property] = instance[x.property];
                instance.setState({ [x.property]: instance[x.property] });
            });
        });
}

export function off(name: string) {
    channel(name).close();
    delete channels[name];
}

export function reactLifeCyclable(): ClassDecorator {
    return function(type: any) {
        const componentDidMount = type.componentDidMount;
        const componentWillUnMount = type.componentWillUnMount;

        type.prototype.componentDidMount = function() {
            if (componentDidMount) {
                componentDidMount.apply(this, arguments);
            }
            updateCollection(instancesByConstructor, type, this);
        };

        type.componentWillUnmount = function() {
            if (componentWillUnMount) {
                componentWillUnMount.apply(this, arguments);
            }
        };
    };
}

function updateCollection<K>(map: any, key: K, newValue: any) {
    let value = map.get(key);
    if (!value) {
        value = [];
    }
    value.push(newValue);
    map.set(key, value);
}
