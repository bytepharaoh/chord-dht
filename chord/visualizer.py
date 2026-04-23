def print_ring(ring: list, positions: dict = None) -> None:
    if not ring:
        print("Ring is empty.")
        return
    
    sorted_ring = sorted(ring)
    max_id = 63
    
    scale = [' [.] '] * (max_id + 1)
    for node in sorted_ring:
        scale[node] = f' [{node:2d}] '
    
    for i in range(0, max_id + 1, 16):
        if i > 0:
            print('↳', end='')
        chunk = scale[i:i+16]
        print('--'.join(chunk), '🔄' if i == 48 else '')
        print('\n')
    
    print(f"Nodes: {sorted_ring}")


from flask import Flask, render_template, request, jsonify
from xmlrpc.client import ServerProxy

app = Flask(__name__)

M = 6
RING_SIZE = 2 ** M
node_ports = {}

def get_active_nodes():
    return sorted(node_ports.keys())

def find_successor(start_node, key):
    path = [start_node]
    current = start_node
    visited = set()
    while True:
        if current in visited:
            break
        visited.add(current)
        try:
            proxy = ServerProxy(f'http://localhost:{node_ports[current]}')
            successor = proxy.find_successor(key)
            path.append(successor)
            if successor == current:
                return current, path
            current = successor
        except Exception as e:
            return None, path + [f"Error: {e}"]
    return current, path

@app.route('/')
def index():
    nodes = get_active_nodes()
    return render_template('ring.html', nodes=nodes, ring_size=RING_SIZE)

@app.route('/api/ring')
def api_ring():
    return jsonify({'nodes': get_active_nodes()})

@app.route('/api/lookup')
def api_lookup():
    key = request.args.get('key', type=int)
    start = request.args.get('start', type=int)
    if key is None or start is None:
        return jsonify({'error': 'Missing key or start node'}), 400
    if start not in node_ports:
        return jsonify({'error': 'Invalid start node'}), 400
    responsible, path = find_successor(start, key)
    if responsible is None:
        return jsonify({'error': 'Lookup failed', 'path': path}), 500
    return jsonify({'responsible_node': responsible, 'path': path, 'hops': len(path) - 1})

@app.route('/api/finger_table')
def api_finger_table():
    node_id = request.args.get('node', type=int)
    if node_id not in node_ports:
        return jsonify({'error': 'Node not found'}), 404
    try:
        proxy = ServerProxy(f'http://localhost:{node_ports[node_id]}')
        ft = proxy.get_finger_table()
        return jsonify({'finger_table': ft})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def start_visualizer(ports_dict):
    global node_ports
    node_ports.update(ports_dict)
    app.run(host='0.0.0.0', port=5000, debug=False)

if __name__ == '__main__':
    sample_ports = {0: 8000, 7: 8001, 21: 8002, 34: 8003, 45: 8004, 58: 8005}
    start_visualizer(sample_ports)
