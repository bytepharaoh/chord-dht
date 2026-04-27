from flask import Flask, render_template, request, jsonify, session
from flask_session import Session
from chord.node import Ring, hash_key
from chord.finger_table import build_finger_table
from chord.routing import lookup

app = Flask(__name__,
            template_folder='chord/templates',
            static_folder='chord/static')

app.config['SECRET_KEY'] = 'dnp-project-chord-dht-inno'
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = './flask_sessions'
Session(app)

M = 6

def rebuild_finger_tables(ring):
    sorted_nodes = ring.get_sorted_nodes()
    for node in sorted_nodes:
        build_finger_table(node, sorted_nodes)

def get_user_ring():
    if 'node_names' not in session:
        ring = Ring()
        for name in ["Alice", "Bob", "Charlie", "Diana", "Eve"]:
            ring.add_node(name)
        rebuild_finger_tables(ring)
        session['node_names'] = [node.name for node in ring.get_sorted_nodes()]
        session.modified = True
        return ring
    else:
        ring = Ring()
        for name in session['node_names']:
            ring.add_node(name)
        rebuild_finger_tables(ring)
        return ring

def save_ring_state(ring):
    session['node_names'] = [node.name for node in ring.get_sorted_nodes()]
    session.modified = True

@app.route('/')
def index():
    ring = get_user_ring()
    nodes = [n.node_id for n in ring.get_sorted_nodes()]
    return render_template('ring.html', nodes=nodes, ring_size=2**M)

@app.route('/api/ring')
def api_ring():
    ring = get_user_ring()
    nodes = [n.node_id for n in ring.get_sorted_nodes()]
    return jsonify({'nodes': nodes})

@app.route('/api/lookup')
def api_lookup():
    key = request.args.get('key', type=int)
    if key is None:
        return jsonify({'error': 'Missing key'}), 400
    ring = get_user_ring()
    start_node = ring.get_sorted_nodes()[0]
    responsible_id, hops = lookup(start_node, key, ring.nodes)
    return jsonify({'responsible_node': responsible_id, 'path': hops, 'hops': len(hops)})

@app.route('/api/lookup_key')
def lookup_key():
    key_str = request.args.get('key', type=str)
    if not key_str:
        return jsonify({'error': 'Missing key'}), 400
    k = hash_key(key_str)
    ring = get_user_ring()
    start_node = ring.get_sorted_nodes()[0]
    responsible_id, hops = lookup(start_node, k, ring.nodes)
    return jsonify({'key': key_str, 'hash': k, 'responsible_node': responsible_id, 'path': hops, 'hops': len(hops)})

@app.route('/api/add_node', methods=['POST'])
def add_node():
    name = request.json.get('name')
    if not name:
        return jsonify({'error': 'Missing name'}), 400
    ring = get_user_ring()
    node = ring.add_node(name)
    rebuild_finger_tables(ring)
    save_ring_state(ring)
    return jsonify({'node_id': node.node_id, 'name': name})

@app.route('/api/remove_node', methods=['POST'])
def remove_node():
    node_id = request.json.get('node_id')
    if node_id is None:
        return jsonify({'error': 'Missing node_id'}), 400
    ring = get_user_ring()
    node = ring.nodes.get(node_id)
    if node is None:
        return jsonify({'error': 'Node not found'}), 404
    ring.remove_node(node.name)
    rebuild_finger_tables(ring)
    save_ring_state(ring)
    return jsonify({'success': True, 'removed': node_id})

@app.route('/api/finger_table')
def api_finger_table():
    node_id = request.args.get('node', type=int)
    ring = get_user_ring()
    node = ring.nodes.get(node_id)
    if node is None:
        return jsonify({'error': 'Node not found'}), 404
    return jsonify({'finger_table': node.finger_table})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8010, debug=True)