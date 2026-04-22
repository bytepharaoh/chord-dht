from flask import Flask, render_template, request, jsonify
from xmlrpc.client import ServerProxy

app = Flask(__name__)

# Configuration - must match Chord node settings
M = 6
RING_SIZE = 2 ** M

# Dictionary: node_id -> XML-RPC port
node_ports = {}

def get_active_nodes():
    return sorted(node_ports.keys())

def find_successor(start_node, key):

    # Find the node responsible for a given key.
    # Starts from start_node and follows Chord routing.

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
    # Main page
    nodes = get_active_nodes()
    return render_template('ring.html', nodes=nodes, ring_size=RING_SIZE)

@app.route('/api/ring')
def api_ring():
    # Return list of active nodes as json
    return jsonify({'nodes': get_active_nodes()})

@app.route('/api/lookup')
def api_lookup():
    # Key lookup and return responsible node and routing path
    key = request.args.get('key', type=int)
    start = request.args.get('start', type=int)
    if key is None or start is None:
        return jsonify({'error': 'Missing key or start node'}), 400
    if start not in node_ports:
        return jsonify({'error': 'Invalid start node'}), 400

    responsible, path = find_successor(start, key)
    if responsible is None:
        return jsonify({'error': 'Lookup failed', 'path': path}), 500
    return jsonify({
        'responsible_node': responsible,
        'path': path,
        'hops': len(path) - 1
    })

@app.route('/api/finger_table')
def api_finger_table():
    # Retrieve finger table of a given node
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
    # Start the Flask web server
    # ports_dict: mapping node_id -> port where its XML-RPC server listens

    global node_ports
    node_ports.update(ports_dict)
    app.run(host='0.0.0.0', port=5000, debug=False)

if __name__ == '__main__':
    # Standalone testing with fake ports
    sample_ports = {0: 8000, 7: 8001, 21: 8002, 34: 8003, 45: 8004, 58: 8005}
    start_visualizer(sample_ports)