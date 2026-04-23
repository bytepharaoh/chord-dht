from chord.node import Node, Ring


def _is_between_exclusive(a: int, b: int, x: int, m: int) -> bool:
    if a == b:
        return False
    if a < b:
        return a < x < b
    return x > a or x < b


def _is_between_inclusive_right(a: int, b: int, x: int, m: int) -> bool:
    if a == b:
        return True
    if a < b:
        return a < x <= b
    return x > a or x <= b


def lookup(start_node, key: int, nodes: dict) -> tuple:
    # Guard: fall back to successor if finger table not built yet
    if not start_node.finger_table:
        return start_node.successor.node_id, [start_node.node_id]

    hops_list = [start_node.node_id]
    current = start_node

    while True:
        successor_id = current.finger_table[0]

        # Check if key belongs to current node (wrap around case)
        if _is_between_inclusive_right(current.predecessor.node_id, current.node_id, key, current.m):
            return current.node_id, hops_list

        # Check if key belongs to successor
        if _is_between_inclusive_right(current.node_id, successor_id, key, current.m):
            return successor_id, hops_list

        # Forward to closest preceding node
        next_id = _closest_preceding_node(current, key)
        if next_id == current.node_id:
            return current.node_id, hops_list

        current = nodes[next_id]
        hops_list.append(current.node_id)


def _closest_preceding_node(node, key: int) -> int:
    for finger_id in reversed(node.finger_table):
        if _is_between_exclusive(node.node_id, key, finger_id, node.m):
            return finger_id
    return node.node_id
