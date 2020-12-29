import {getResult} from './Obj.js';
import {Types, getType} from './Types.js';

export function get(ids, name, snapshot, schemaDef) {
    const propDef = schemaDef[name];
    const typeDef = getType(propDef);

    const values = snapshot.get([...ids], name, typeDef === Types.object ? Types.Key : typeDef);
    switch(typeDef) {
        case Types.number:
        case Types.string:
        case Types.boolean:
            return first(values, propDef);
        case Types.object:
            const [key2s, subSchemaDef] = propDef instanceof IndexClass ?
                [snapshot.index(propDef.name || name, values),  propDef.schemaDef || schemaDef] : 
                [values, propDef];
            return Assoc(key2s, subSchemaDef, snapshot)
        default:
            //Types.Key is unexpected here
            throw new Error("Unexpected type error " + propDef);
    }
}

function Assoc(key2s, schemaDef, snapshot) {
    const toObj = key => getResult(key, schemaDef, snapshot);
    key2s.last = function () {
        const maybeObj = first(key2s, null);
        return maybeObj === null ? null : toObj(maybeObj)
    }
    key2s.select = name => get(this, name, snapshot, schemaDef);
    return key2s;
}

export function Index(name, schemaDef) {
    return new IndexClass(name, schemaDef);
}

function IndexClass(name, schemaDef) {
    this.name = name;
    this.schemaDef = schemaDef;
    Object.feeze(this);
}
