# test_ring.py
from chord.node import Ring

ring = Ring()
ring.add_node("NodeA")
ring.add_node("NodeB")
ring.add_node("NodeC")
ring.add_node("NodeD")
ring.add_node("NodeE")

print(ring)
# Expected: something like: 7 -> 21 -> 34 -> 45 -> 58 -> (wrap)

n = ring.get_sorted_nodes()[0]
n.store_key("hello", "world")
