import {Types, getType} from './Types.js';
export function getResult(key, schemaDef, snapshot) {
    let result = {
        get key() {
            return key;
        }
    };

    Object.keys(schemaDef).forEach(name => Object.defineProperty(result, name,
        {get: () => getProp([key], name, snapshot, schemaDef)}
    ));

    Object.freeze(result);
        
    return result;
}

function getProp(ids, name, snapshot, schemaDef) {
    const propDef = schemaDef[name];
    const typeDef = getType(propDef);

    const values = snapshot.get(ids, name, typeDef === Types.object ? Types.Key : typeDef);
    switch(typeDef) {
        case Types.number:
        case Types.string:
        case Types.boolean:
            return first(values, propDef);
        case Types.object:
            const [key2s, subSchemaDef] = propDef instanceof IndexClass ?
                [snapshot.index(propDef.name || name, values),  propDef.schemaDef || schemaDef] : 
                [values, propDef];
            console.log('get', name, key2s, subSchemaDef);
            return Assoc(key2s, subSchemaDef, snapshot)
        default:
            //Types.Key is unexpected here
            console.error("Type error in getProp", typeDef, propDef)
            throw new Error("Unexpected type error " + propDef);
    }
}

function Assoc(key2s, schemaDef, snapshot) {
    const seen = new Set();
    const result = key2s
        .reject(key => seen.has(key.id))
        .tap(key => seen.add(key.id))
        .reject(key => key.isDelete)
        .map(key => getResult(key, schemaDef, snapshot));
    result.last = () => first(result, null);
    return result;
}

export function Index(name, schemaDef) {
    return new IndexClass(name, schemaDef);
}

function IndexClass(name, schemaDef) {
    this.name = name;
    this.schemaDef = schemaDef;
    Object.freeze(this);
}

function first(it, fallback) {
    const {value, done} = it.next();
    return done && (value === undefined) ? fallback : value;
}
