import { inject } from 'njct';

const BroadcastChannelCtor = inject('BroadcastChannel', () => BroadcastChannel);
const channels: { [name: string]: BroadcastChannel } = {};

function channel(name: string) {
    if (!channels[name]) {
        channels[name] = new BroadcastChannelCtor(name);
    }
    return channels[name];
}

export function on(name: string) {
    let value: any;
    channel(name).addEventListener('message', (e: MessageEvent) => {
        value = e.data;
    });
    const get = () => value;
    const set = (newValue: any) => {
        value = newValue;
    };
    return function(prototype: any, property: string | symbol, descriptor: PropertyDescriptor = {}) {
        if (descriptor.get) {
            throw new TypeError(`Getter cannot be decoratorated by on`);
        }
        descriptor.get = get;
        descriptor.set = set;
        Object.defineProperty(prototype, property, descriptor);
    };
}

export function emit<T = any>(name: string, data: T) {
    channel(name).postMessage(data);
}

export function off(name: string) {
    channel(name).close();
    delete channels[name];
}

export function reactLifeCyclable(): ClassDecorator {
    return function(target: any) {
        const componentDidMount = target.componentDidMount;
        const componentWillUnMount = target.componentWillUnMount;

        const componentDidMount = type.prototype.componentDidMount;
        const componentWillUnmount = type.prototype.componentWillUnmount;

        reactLifeCyclables.add(type.prototype);

        type.prototype.componentDidMount = function() {
            if (componentDidMount) {
                componentDidMount.apply(this, arguments);
            }
        };

        target.componentWillUnmount = function() {
            componentWillUnMount.apply(this, arguments);
        };
    };
}
