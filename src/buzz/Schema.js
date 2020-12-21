import {getResult} from './Obj.js';

function Schema(defOrSchema) {
    if (defOrSchema instanceof Schema) console.error("FIx this");
    const schemaDef = defOrSchema;
    function get(name) {
        if (! (name in schemaDef)) {
            throw new Error("Property not found");
        }
        return new PropDef(name, schemaDef[name], schemaDef);
    }

    this.get = get
    this.keys = () => Object.keys(schemaDef);
    this.debug = () => schemaDef;
    this.defineConstants = assoc  => {
        return Object.keys(schemaDef).reduce((props, name) => {
            const propDef = get(name);
            if (propDef.type === PropDef.Types.Constant) {
                props[name] = assoc(propDef.schemaPropValue.args[0]);
            }
            return props;
        }, {});
    }

    this.getValue = (id, name, snapshot) => {
        const propDef = get(name);
        const schemaPropValue = schemaDef[name];
        const isAssoc = propDef.isAssoc;
        const subSchema = propDef.subSchema;
        if (propDef.type === PropDef.Types.Constant) {
            // this creates an index that points back to every node with this schema
            const getIndex = () => snapshot.index(name, [schemaPropValue.args[0]]);
            const mapToResult = id2 => getResult(id2, subSchema, snapshot);
            return wrapIndex(getIndex, mapToResult, snapshot, subSchema);
        } else if (isAssoc) {
            const toResult = () => snapshot.getRefs([id], name)
                .map(id2 => getResult(id2, subSchema, snapshot));
            switch (propDef.type) {
                case PropDef.Types.Last:
                    return first(toResult(), null);
                case PropDef.Types.List:
                    const result = toResult();
                    result.last = () => first(result, null);
                    return result;
                default:
                    throw new Error('Unexpected');
            }
        } else {
            return first(snapshot.getValues(id, name), schemaPropValue);
        }
    }
}

export function makeSchema(schemaOrDef) {
    if (schemaOrDef instanceof Schema) return schemaOrDef;
    else return new Schema(schemaOrDef);
}

function PropDef(name, schemaPropValue, ssschema) {
    let type = null;
    let subSchema = null;
    if (schemaPropValue instanceof SchemaTypeClass) {
        switch (schemaPropValue.type) {
            case SchemaType.Constant:
                type = PropDef.Types.Constant;
                subSchema = makeSchema(ssschema);
                break;
            case SchemaType.Last:
                type = PropDef.Types.Last;
                subSchema = makeSchema(schemaPropValue.args[0]);
                break;
            default:
                throw new Error("Unrecognized schema type", schemaPropValue.type);
        }
    } else if (schemaPropValue instanceof Object) {
        type = PropDef.Types.List;
        subSchema = makeSchema(schemaPropValue);
    } else {
        type = PropDef.Types[typeof schemaPropValue];
    }

    if (type === undefined) {
        throw new Error("Unrecognized type for", schemaPropValue);
    }

    this.schemaPropValue = schemaPropValue;
    this.type = type;

    const isAssoc = !!subSchema
    this.subSchema = subSchema;
    this.isAssoc = isAssoc;
}

function first(it, fallback) {
    const {value, done} = it.next();
    return done && (value === undefined) ? fallback : value;
}

PropDef.Types = Object.fromEntries([
    "Constant",
    "Last",
    "List",
    "number",
    "string",
    "boolean",
].map(t => [t, Symbol(t)]));

export function SchemaType(...args) {
    const o = new SchemaTypeClass(...args);
    Object.freeze(o);
    return o;
}

function SchemaTypeClass(type, ...args) {
    this.type = type;
    this.args = args;
};

function wrapIndex(getIndex, getter, snapshot, subSchema) {
    const result = getIndex().map(getter);
    result.select = n => snapshot.getRefs(getIndex(), n)
        .map(id => getResult(id, subSchema.get(n).subSchema, snapshot))
    return result;
}

SchemaType.Last = Symbol('SchemaType.Last');
SchemaType.Constant = Symbol('SchemaType.Constant');
