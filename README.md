# Chord DHT Simulation

A Python simulation of the **Chord Distributed Hash Table** — a peer-to-peer system where nodes organize themselves into a logical ring and can find any stored key in **O(log N) hops**, with no central server.

Built as a 6-day university project by a team of 5. Includes a full CLI demo and a live web interface.

---

## What is this, actually?

Imagine you have 5 computers and want to store 1000 files across them — without any central server telling everyone where everything is. How does computer A find a file stored on computer D?

**Chord solves this.** Every node gets a position on an imaginary circle numbered 0–63. Every key (file, data) also gets a position via hashing. A key lives on the **first node clockwise** from its hash position.

<br>

![Ring Structure](docs/ring.svg)

*Five nodes sit on a 64-slot ring. Keys are hashed to a position and stored on the nearest clockwise node.*

---

## The Magic — Finger Tables

Without shortcuts, finding a key means asking every node one by one. Slow.

Each node keeps a **finger table** — 6 shortcuts pointing to nodes at positions `+1, +2, +4, +8, +16, +32` ahead on the ring. This means any lookup takes at most **O(log N) hops**.

<br>

![Finger Table](docs/finger_table.svg)

*Node 15 has 6 finger table entries. Each entry skips further ahead, so a single node can reach any other node in a few jumps.*

---

## How a Lookup Works

Looking up `"file1.txt"` (hashes to `43`) starting from node `15`:

<br>

![Lookup Path](docs/lookup.svg)

*3 hops to find the responsible node out of 5. As the ring grows to hundreds of nodes, it stays O(log N).*

---

## Churn — Nodes Joining & Leaving

When a node leaves the ring, its keys are inherited by the next clockwise node. Finger tables rebuild automatically.

<br>

![Churn](docs/churn.svg)

*Charlie (node 15) leaves. Node 30 inherits its keys. The ring keeps working.*

---

## Project Structure

```
chord-dht/
├── chord/
│   ├── node.py           # Ring + Node + consistent hashing (SHA-1)
│   ├── finger_table.py   # Builds 6-entry finger table for each node
│   ├── routing.py        # Chord lookup algorithm — the core
│   ├── logger.py         # Logs inserts, lookups, joins, leaves to file
│   ├── visualizer.py     # Text/ASCII ring display
│   ├── templates/
│   │   └── ring.html     # Web interface
│   └── static/
│       ├── script.js     # Frontend logic (add/remove nodes, lookup)
│       └── style.css     # Styling
├── main.py               # Full CLI demo with stats
├── server.py             # Flask web interface
└── tests/
    └── test_ring.py      # Unit tests
```

---

## How to Run

### 1. Clone & install

```bash
git clone https://github.com/bytepharaoh/chord-dht.git
cd chord-dht
pip3 install flask
pip3 install -e .
```

### 2. CLI demo

```bash
PYTHONPATH=. python3 main.py
```

### 3. Web interface

```bash
PYTHONPATH=. python3 server.py
```

Open **http://127.0.0.1:8010** in your browser.

---

## Web Interface Features

| Feature | What it does |
|---------|-------------|
| **Key Lookup** | Type any string (e.g. `hello.txt`) — see which node stores it and the full hop path |
| **Add Node** | Type a name — node appears on the ring instantly |
| **Remove Node** | Pick a node to remove — ring rebalances automatically |
| **Show Fingers** | Click any active node to see its finger table |

---

## Sample Output

```
=== Ring Structure ===
 [.] -- [.] -- [15] -- [.] -- [30] -- [.] -- [37] -- [42] -- [49] -- [.]

=== Key Lookups (BEFORE churn) ===
Key 'file1.txt'  (hash=43) → node 49 | hops: [15, 37, 42]
Key 'photo.jpg'  (hash=25) → node 30 | hops: [15]
Key 'data.csv'   (hash=12) → node 15 | hops: [15]

=== Churn: Removing Charlie (node 15) ===
30 -> 37 -> 42 -> 49 -> (wrap)

=== Routing Stats ===
Avg hops BEFORE churn: 1.80
Avg hops AFTER  churn: 1.30
```

---

## Key Concepts

| Term | Meaning |
|------|---------|
| **Consistent hashing** | Maps both nodes and keys to the same 0–63 ID space using SHA-1 |
| **Finger table** | Each node's 6 routing shortcuts, enabling O(log N) lookup |
| **Successor** | The first node clockwise from any position on the ring |
| **Churn** | Nodes joining or leaving; finger tables rebuild to maintain correctness |

---

## Team

| Name | Role |
|------|------|
| **ZiZO** | Project lead · Ring core · Consistent hashing · Integration |
| **Egor** | Finger table construction |
| **Михаил** | Routing algorithm · Lookup logic |
| **Камиль** | Logger · Tests · Churn simulation |
| **Артём** | Visualizer · Web interface · Report & slides |

---

*Distributed Network Systems — University course project*
