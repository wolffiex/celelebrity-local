import {getResult} from './Obj.js';
import {Types, getType} from './Types.js';

export function get(ids, name, snapshot, schemaDef) {
    const propDef = schemaDef[name];
    const typeDef = getType(propDef);

    const values = snapshot.get(ids, name, typeDef === Types.object ? Types.Key : typeDef);
    switch(typeDef) {
        case Types.number:
        case Types.string:
        case Types.boolean:
            return first(values, propDef);
        case Types.object:
            const [id2s, subSchemaDef] = propDef instanceof IndexClass ?
                [snapshot.index(propDef.name || name, values),  propDef.schemaDef || schemaDef] : 
                [values, propDef];
            return Assoc(id2s, subSchemaDef, snapshot)
        default:
            //Types.Key is unexpected here
            throw new Error("Unexpected type error " + propDef);
    }
}

function Assoc(id2s, schemaDef, snapshot) {
    const toObj = key => getResult(key, schemaDef, snapshot);
    id2s.last = function () {
        const maybeObj = first(id2s, null);
        return maybeObj === null ? null : toObj(maybeObj)
    }
    id2s.select = function (name) {
        return get(this, name, snapshot, schemaDef);
    }
    return id2s;
}

export function Index() {
    return new IndexClass();
}

function IndexClass(name, schemaDef) {
    this.name = name;
    this.schemaDef = schemaDef;
    Object.feeze(this);
}
