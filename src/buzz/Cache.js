export default function Cache(sign, storage) {
    return {
        store: function(value) {
            const str = JSON.stringify(value);
            const id = sign(str);
            if (storage.getItem(id) !== null) throw new Error("Bad sig:"+ id);
            storage.setItem(id, str);
            return id;
        },
        fetch: function(id) {
            return JSON.parse(storage.getItem(id));
        }
    }
}
