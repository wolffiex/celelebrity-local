const entryIdentifier = (id, name) => id + "|" + name;
const indexIdentifier = (name, refId) => name + "*" + refId;

export default function Trackers() {
    let allTrackers = [];
    return {
        entryIdentifier,
        indexIdentifier,
        tracker(invalidate) {
            let tracker = {access: new Set(), invalidate};
            allTrackers.push(tracker);
            return identifier => tracker.access.add(identifier);
        },
        notify(identifiers) {
            allTrackers = allTrackers.reduce((trackers, tracker) => {
                if (identifiers.some(ident => tracker.access.has(ident))) {
                    tracker.invalidate();
                    return trackers
                }

                return [...trackers, tracker];
            }, []);
        }
    }
}

Trackers.entryIdentifier = entryIdentifier;
Trackers.indexIdentifier = indexIdentifier;
