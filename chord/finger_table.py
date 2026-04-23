from bisect import bisect_left

def build_finger_table(node, sorted_nodes):
    node.finger_table = []
    ring_ids = [n.node_id for n in sorted_nodes]
    
    for i in range(node.m):
        target_id = (node.node_id + 2**i) % (2**node.m)
        
        idx = bisect_left(ring_ids, target_id)
        
        if idx == len(sorted_nodes):
            successor_node = sorted_nodes[0]
        else:
            successor_node = sorted_nodes[idx]
        
        node.finger_table.append(successor_node.node_id)
    
    # print(f"DEBUG: Node {node.node_id} finger table -> {node.finger_table}")