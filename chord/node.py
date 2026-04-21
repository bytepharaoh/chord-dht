
import hashlib

# Ring size = 2^M = 64 slots (use 160 for real SHA-1, 6 is fine for simulation)
M = 6
RING_SIZE = 2 ** M


def hash_key(value: str) -> int:
    """Consistent hash: maps any string to a position on the ring (0 to RING_SIZE-1)"""
    raw = hashlib.sha1(value.encode()).hexdigest()
    return int(raw, 16) % RING_SIZE


class Node:
    def __init__(self, node_id: str):
        self.node_id = hash_key(node_id)  # rename from self.id
        self.name = node_id           # human-readable name
        self.keys = {}                # keys this node is responsible for: {key_hash: value}
        # next node on the ring (Egor sets this up)
        self.successor = None
        self.predecessor = None       # previous node on the ring   
        self.finger_table = []  # Egor fills this with .append()
        self.m = M                        # add this line

    def store_key(self, key: str, value: str):
            k = hash_key(key)
            self.keys[k] = value
            print(f"[Node {self.node_id}] Stored key '{key}' (hash={k}) = '{value}'")



    def __repr__(self):
         return f"Node(id={self.node_id}, name='{self.name}')"



class Ring:
    def __init__(self):
        self.nodes = {}  # node_id (int) -> Node object

    def add_node(self, name: str) -> Node:
        node = Node(name)
        self.nodes[node.node_id] = node
        self._update_successors()
        print(f"[Ring] Added {node}")
        return node

    def _update_successors(self):
        """After any node joins, fix successor/predecessor pointers"""
        sorted_ids = sorted(self.nodes.keys())
        n = len(sorted_ids)
        for i, node_id in enumerate(sorted_ids):
            node = self.nodes[node_id]
            node.successor = self.nodes[sorted_ids[(i + 1) % n]]
            node.predecessor = self.nodes[sorted_ids[(i - 1) % n]]

    def get_sorted_nodes(self):
        return [self.nodes[k] for k in sorted(self.nodes.keys())]

    def __repr__(self):
        return " -> ".join(str(n.node_id) for n in self.get_sorted_nodes()) + " -> (wrap)"


    def remove_node(self, name: str):
        node_id = hash_key(name)
        if node_id in self.nodes:
            del self.nodes[node_id]
            self._update_successors()
            print(f"[Ring] Removed node {node_id}")
