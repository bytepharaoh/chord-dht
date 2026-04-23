const canvas = document.getElementById('ringCanvas');
const ctx = canvas.getContext('2d');
const width = 500, height = 500;
const centerX = width / 2, centerY = height / 2;
const radius = 200;
let nodes = [];

function drawRing() {
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#f8f9fa';
    ctx.fill();
    if (nodes.length === 0) {
        ctx.fillStyle = 'red';
        ctx.fillText("No active nodes", centerX - 50, centerY);
        return;
    }
    for (let i = 0; i < nodes.length; i++) {
        let nodeId = nodes[i];
        let angle = (nodeId / 64) * 2 * Math.PI - Math.PI / 2;
        let x = centerX + radius * Math.cos(angle);
        let y = centerY + radius * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, 2 * Math.PI);
        ctx.fillStyle = '#2ecc71';
        ctx.fill();
        ctx.strokeStyle = '#27ae60';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(nodeId, x - 7, y + 5);
    }
}

function highlightNode(nodeId) {
    drawRing();
    let angle = (nodeId / 64) * 2 * Math.PI - Math.PI / 2;
    let x = centerX + radius * Math.cos(angle);
    let y = centerY + radius * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, 2 * Math.PI);
    ctx.fillStyle = '#f1c40f';
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(nodeId, x - 7, y + 5);
}

// ── Key Lookup (by string now) ──────────────────────
async function lookupKey() {
    const key = document.getElementById('keyInput').value.trim();
    if (!key) return;
    const response = await fetch(`/api/lookup_key?key=${encodeURIComponent(key)}`);
    const data = await response.json();
    if (data.error) {
        document.getElementById('result').innerHTML = `Error: ${data.error}`;
        document.getElementById('path').innerHTML = "";
        return;
    }
    document.getElementById('result').innerHTML =
        `Key: <strong>${data.key}</strong> → hash: <strong>${data.hash}</strong> → node: <strong>${data.responsible_node}</strong>`;
    document.getElementById('path').innerHTML =
        `Routing path: <span class="path">${data.path.join(' → ')}</span> (${data.hops} hops)`;
    highlightNode(data.responsible_node);
}

// ── Add Node ────────────────────────────────────────
async function addNode() {
    const name = document.getElementById('addNodeInput').value.trim();
    if (!name) return;
    const response = await fetch('/api/add_node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    const data = await response.json();
    if (data.error) {
        document.getElementById('addNodeResult').innerHTML = `Error: ${data.error}`;
    } else {
        document.getElementById('addNodeResult').innerHTML =
            `✅ Added node <strong>${data.name}</strong> (id=${data.node_id})`;
        document.getElementById('addNodeInput').value = '';
        refreshRing();
    }
}

// ── Remove Node ─────────────────────────────────────
async function removeNode() {
    const select = document.getElementById('removeNodeSelect');
    const nodeId = parseInt(select.value);
    if (!nodeId) return;
    const response = await fetch('/api/remove_node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_id: nodeId })
    });
    const data = await response.json();
    if (data.error) {
        document.getElementById('removeNodeResult').innerHTML = `Error: ${data.error}`;
    } else {
        document.getElementById('removeNodeResult').innerHTML = `✅ Removed node <strong>${nodeId}</strong>`;
        refreshRing();
    }
}

// ── Finger Table ────────────────────────────────────
async function loadFingerTable(nodeId) {
    const response = await fetch(`/api/finger_table?node=${nodeId}`);
    const data = await response.json();
    if (data.finger_table) {
        document.getElementById('fingerInfo').innerHTML =
            `<strong>Node ${nodeId} finger table:</strong> [${data.finger_table.join(', ')}]`;
    } else {
        document.getElementById('fingerInfo').innerHTML =
            `<span style="color:red">${data.error}</span>`;
    }
}

// ── Node List ───────────────────────────────────────
function updateNodeList() {
    const ul = document.getElementById('nodeList');
    ul.innerHTML = nodes.map(n => `
        <li>
            <strong>Node ${n}</strong>
            <span class="finger-table" onclick="loadFingerTable(${n})">[show fingers]</span>
        </li>
    `).join('');

    // Update remove dropdown
    const select = document.getElementById('removeNodeSelect');
    select.innerHTML = nodes.map(n => `<option value="${n}">${n}</option>`).join('');
}

// ── Refresh Ring ────────────────────────────────────
async function refreshRing() {
    const response = await fetch('/api/ring');
    const data = await response.json();
    nodes = data.nodes;
    drawRing();
    updateNodeList();
}

// ── Event Listeners ─────────────────────────────────
document.getElementById('lookupBtn').addEventListener('click', lookupKey);
document.getElementById('addNodeBtn').addEventListener('click', addNode);
document.getElementById('removeNodeBtn').addEventListener('click', removeNode);

// Initial load
refreshRing();
setInterval(refreshRing, 5000);