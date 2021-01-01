export default function Network(peek, receive) {
    let peers = new Map();
    function addPeer(nodeId) {
        peers.set(nodeId, null);
    }

    function poll() {
        peers.forEach(function (nodeId, oldVersion) {
            const version = peek(nodeId);
            if (oldVersion !== version) {
                receive(nodeId, version)
            }
        });
    }
    return {addPeer, poll};
}
