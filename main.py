from chord.node import Ring, hash_key
from chord.finger_table import build_finger_table
from chord.routing import lookup
from chord.logger import Logger
from chord.visualizer import print_ring

# ─── Setup ───────────────────────────────────────────
logger = Logger(log_file="logs/chord.log")
ring = Ring()

# ─── Add 5 nodes ─────────────────────────────────────
node_names = ["Alice", "Bob", "Charlie", "Diana", "Eve"]
for name in node_names:
    node = ring.add_node(name)
    logger.log_join(node.node_id)

# ─── Build finger tables ──────────────────────────────


def rebuild_finger_tables(ring):
    sorted_nodes = ring.get_sorted_nodes()
    for node in sorted_nodes:
        build_finger_table(node, sorted_nodes)


rebuild_finger_tables(ring)

# ─── Show the ring ────────────────────────────────────
sorted_nodes = ring.get_sorted_nodes()
print("\n=== Ring Structure ===")
print_ring([n.node_id for n in sorted_nodes])

# ─── Insert 10 keys ───────────────────────────────────
keys = ["file1.txt", "photo.jpg", "video.mp4", "music.mp3",
        "doc.pdf", "data.csv", "index.html", "app.py",
        "readme.md", "config.json"]

print("\n=== Inserting Keys ===")
for key in keys:
    k = hash_key(key)
    responsible = sorted_nodes[-1]
    for node in sorted_nodes:
        if node.node_id >= k:
            responsible = node
            break
    responsible.store_key(key, f"value_of_{key}")
    logger.log_insert(key, responsible.node_id)

# ─── Lookups BEFORE churn ─────────────────────────────
print("\n=== Key Lookups (BEFORE churn) ===")
start_node = ring.get_sorted_nodes()[0]
before_hops = []
for key in keys:
    k = hash_key(key)
    responsible_id, hops = lookup(start_node, k, ring.nodes)
    logger.log_lookup(key, hops, len(hops))
    before_hops.append(len(hops))
    print(f"Key '{key}' (hash={k}) → node {responsible_id} | hops: {hops}")

# ─── Churn: remove a node ─────────────────────────────
print("\n=== Churn: Removing Charlie ===")
ring.remove_node("Charlie")
logger.log_leave(hash_key("Charlie"))
rebuild_finger_tables(ring)  # rebuild after churn
print(ring)

# ─── Lookups AFTER churn ──────────────────────────────
print("\n=== Key Lookups (AFTER churn) ===")
start_node = ring.get_sorted_nodes()[0]
after_hops = []
for key in keys:
    k = hash_key(key)
    responsible_id, hops = lookup(start_node, k, ring.nodes)
    after_hops.append(len(hops))
    print(f"Key '{key}' (hash={k}) → node {responsible_id} | hops: {hops}")

# ─── Edge case 1: key not inserted ────────────────────
print("\n=== Edge case: lookup for key never inserted ===")
k = hash_key("ghost.txt")
responsible_id, hops = lookup(start_node, k, ring.nodes)
print(f"Key 'ghost.txt' (hash={k}) → node {responsible_id} | hops: {hops}")

# ─── Edge case 2: single node ring ────────────────────
print("\n=== Edge case: single node ring ===")
small_ring = Ring()
solo = small_ring.add_node("Solo")
rebuild_finger_tables(small_ring)
responsible_id, hops = lookup(solo, hash_key("test"), small_ring.nodes)
print(f"Single node lookup → node {responsible_id} | hops: {hops}")

# ─── Stats ────────────────────────────────────────────
avg_before = sum(before_hops) / len(before_hops)
avg_after = sum(after_hops) / len(after_hops)
print(f"\n=== Routing Stats ===")
print(f"Avg hops BEFORE churn: {avg_before:.2f}")
print(f"Avg hops AFTER churn:  {avg_after:.2f}")
print(f"Total lookups logged:  {len(before_hops)}")
print(f"Full log saved to:     logs/chord.log")
