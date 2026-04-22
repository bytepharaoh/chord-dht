from bisect import bisect_left


def build_finger_table(node, ring):
    node.finger_table = []

    # Extract sorted IDs for bisect to work
    ring_ids = [n.node_id for n in ring]

    for i in range(node.m):
        target_id = (node.node_id + 2**i) % (2**node.m)

        idx = bisect_left(ring_ids, target_id)

        if idx == len(ring):
            successor_node = ring[0]
        else:
            successor_node = ring[idx]

        node.finger_table.append(successor_node.node_id)
