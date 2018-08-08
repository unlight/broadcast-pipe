const channels: { [name: string]: BroadcastChannel } = {};

function channel(name: string) {
    if (!channels[name]) {
        channels[name] = new BroadcastChannel(name);
    }
    return channels[name];
}

export function on(name: string) {
    let value: any;
    channel(name).addEventListener('message', (e: MessageEvent) => {
        value = e.data;
    });
    return function(target: any, property: string | symbol, descriptor: PropertyDescriptor) {
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
