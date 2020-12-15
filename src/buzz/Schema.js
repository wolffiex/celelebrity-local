function Schema(_schema) {
    if (_schema instanceof Schema) console.error("FIx this");
    function get(name) {
        if (! (name in _schema)) {
            throw new Error("Property not found");
        }
        return new PropDef(name, _schema[name], _schema);
    }

    this.get = get
    this.entries = (id, snapshot) => {
        return Object.keys(_schema).map(name => 
            ({name, def: get(name).define(id, snapshot)}));
    }

    this.debug = () => _schema;
    this.writeConstants = (id, writeEntry)  => {
        Object.keys(_schema)
            .map(name =>({name, propDef: this.get(name)}))
            .filter(({propDef}) => propDef.type === PropDef.Types.Constant)
            //gross
            .forEach(({name, propDef}) => writeEntry(id, this, name, propDef.schemaPropValue.id))

    }
}

export function makeSchema(schemaOr_schema) {
    if (schemaOr_schema instanceof Schema) return schemaOr_schema;
    else return new Schema(schemaOr_schema);
}

function PropDef(name, schemaPropValue, ssschema) {
    let type = null;
    let subSchema = null;
    if (schemaPropValue instanceof BuzzLast) {
        type = PropDef.Types.Last;
        subSchema = makeSchema(schemaPropValue.schema);
    } else if (schemaPropValue instanceof Constant) {
        subSchema = makeSchema(ssschema);
        type = PropDef.Types.Constant;
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
    function wrapIndex(index, getter, snapshot) {
        //TODO: build set of index
        const result = index.map(getter);
        result.select = n => snapshot.getRefs(index, n)
            .map(id => getResult(id, subSchema.get(n).subSchema, snapshot))
        return result;
    }

    this.define = (id, snapshot) => {
        let get;
        if (type === PropDef.Types.Constant) {
            // this creates an index that points back to every node with this schema
            get = () => wrapIndex(snapshot.index(name, [schemaPropValue.id]),
                refId => getResult(refId, subSchema, snapshot), snapshot);
        } else if (isAssoc) {
            const toResult = () => snapshot.getRefs([id], name)
                .map(refId => getResult(refId, subSchema, snapshot));
            switch (type) {
                case PropDef.Types.Last:
                    get = () => first(toResult(), null);
                    break;
                case PropDef.Types.List:
                    get = () => {
                        const result = toResult();
                        result.last = () => first(result, null);
                        return result;
                    }
                    break;
                default:
                    throw new Error('Unexpected');
            }
        } else {
            get = () => {
                return first(snapshot.getValues(id, name), schemaPropValue);
            }
        }
        return {get, enumerable: true};
    }

    return typeof propDef;
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

function getResult(id, schema, snapshot) {
    let result = {
        get id() {
            return id;
        },
        get schema() {
            return schema;
        }
    };

    schema.entries(id, snapshot).forEach(({name, def}) =>
        Object.defineProperty(result, name, def));
        
    return result;
}

export class Constant {
    constructor(id) {
        this._id = id;
    }
    get id() {
        return this._id
    }
}

export function BuzzLast(schema) {
    Object.freeze(schema);
    this.schema = schema;
}

