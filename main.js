const depMap = new WeakMap();
const track = (object, key, effect) => {
    if (!depMap.has(object)) {
        depMap.set(object, new Map());
    }

    const objectMap = depMap.get(object);

    if (!objectMap.has(key)) {
        objectMap.set(key, new Set());
    }

    const dependencies = objectMap.get(key);

    dependencies.add(effect);
};
const trigger = (object, key) => {
    if (!depMap.has(object)) {
        return;
    }

    const objectMap = depMap.get(object);

    if (!objectMap.has(key)) {
        return;
    }

    const dependencies = objectMap.get(key);

    for (const dependency of dependencies) {
        dependency();
    }
};
const reactive = (obj) => {
    if (!obj || (!Array.isArray(obj) && !(obj instanceof Object))) {
        throw new Error('Please pass an object or an array with objects');
    }

    if (Array.isArray(obj)) {
        return obj.map(arrObj => reactive(arrObj));
    }

    let copyObj = { ...obj };
    for (const key of Object.keys(obj)) {
        if (obj[key] instanceof Object) {
            copyObj[key] = reactive(obj[key]);
        } else {
            copyObj[key] = obj[key];
        }
    }

    return new Proxy(copyObj, {
        get(target, key, receiver) {
            if (activeEffect) {
                track(target, key, activeEffect);
            }

            return Reflect.get(target, key, receiver);
        },
        set(target, key, value, receiver) {
            const oldValue = Reflect.get(target, key, receiver);
            Reflect.set(target, key, value, receiver);

            if (oldValue !== value) {
                trigger(target, key);
            }
        },
    });
};
let activeEffect = null;
const effect = (computeCallback) => {
    activeEffect = computeCallback;
    activeEffect();
    activeEffect = null;
};
let productCount = 0;
const products = reactive([
    {
        name: 'Test',
        quantity: 6,
        test: {
            pet: 12,
        },
    },
    {
        name: 'Xaba',
        quantity: 3,
        test: {
            pet: 3,
        },
    },
]);
effect(() => {
    productCount = products.reduce((prevValue, nextValue) => {
        return prevValue + nextValue.quantity + nextValue.test.pet;
    }, 0);
});

console.log(productCount);
products[0].test.pet = 11;
console.log(productCount);
