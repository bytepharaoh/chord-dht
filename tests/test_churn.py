from chord.node import Ring
from chord.logger import log
from chord.node import hash_key


def test_churn_add_5_remove_1_ring_still_works():
    log.clear()
    ring = Ring()

    names = ["node1", "node2", "node4", "node5", "node6"]

    ids = [hash_key(name) for name in names]
    assert len(ids) == len(set(ids))  # make sure test data has no collisions

    for name in names:
        ring.add_node(name)

    assert len(ring.nodes) == 5

    removed = ring.remove_node("node4")
    assert removed is True
    assert len(ring.nodes) == 4

    nodes = ring.get_sorted_nodes()
    assert len(nodes) == 4

    for node in nodes:
        assert node.successor is not None
        assert node.predecessor is not None

    logs = log.get_logs()
    join_logs = [entry for entry in logs if entry["event"] == "JOIN"]
    leave_logs = [entry for entry in logs if entry["event"] == "LEAVE"]

    assert len(join_logs) == 5
    assert len(leave_logs) == 1