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
    this.writeConstants = (id, writeEntry)  => {
        Object.keys(schemaDef)
            .map(name =>({name, propDef: this.get(name)}))
            .filter(({propDef}) => propDef.type === PropDef.Types.Constant)
            //gross
            .forEach(({name, propDef}) => writeEntry(id, this, name, propDef.schemaPropValue.args[0]))
    }

    this.getValue = (id, name, snapshot) => {
        const propDef = get(name);
        const schemaPropValue = schemaDef[name];
        const isAssoc = propDef.isAssoc;
        const subSchema = propDef.subSchema;
        if (propDef.type === PropDef.Types.Constant) {
            // this creates an index that points back to every node with this schema
            return wrapIndex(snapshot.index(name, [schemaPropValue.args[0]]),
                refId => getResult(refId, subSchema, snapshot), snapshot, subSchema);
        } else if (isAssoc) {
            const toResult = () => snapshot.getRefs([id], name)
                .map(refId => getResult(refId, subSchema, snapshot));
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

export function makeSchema(schemaOr_schema) {
    if (schemaOr_schema instanceof Schema) return schemaOr_schema;
    else return new Schema(schemaOr_schema);
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

function wrapIndex(index, getter, snapshot, subSchema) {
    const result = index.map(getter);
    result.select = n => snapshot.getRefs(index, n)
        .map(id => getResult(id, subSchema.get(n).subSchema, snapshot))
    return result;
}

SchemaType.Last = Symbol('SchemaType.Last');
SchemaType.Constant = Symbol('SchemaType.Constant');
