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
    return function(target: any, property: string | symbol, descriptor: PropertyDescriptor) {
        // todo: handle old property
        descriptor.get = () => {
            return value;
        };
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

        target.componentDidMount = function() {
            componentDidMount.apply(this, arguments);
        };

        target.componentWillUnmount = function() {
            componentWillUnMount.apply(this, arguments);
        };
    };
}
