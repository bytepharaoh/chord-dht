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

async function lookupKey() {
    const key = document.getElementById('keyInput').value;
    if (key === "") return;
    const startNode = nodes.length > 0 ? nodes[0] : null;
    if (!startNode) {
        document.getElementById('result').innerText = "No active nodes";
        return;
    }

    const response = await fetch(`/api/lookup?key=${key}&start=${startNode}`);
    const data = await response.json();

    if (data.error) {
        document.getElementById('result').innerHTML = `Error: ${data.error}`;
        document.getElementById('path').innerHTML = "";
        return;
    }

    document.getElementById('result').innerHTML = `Responsible node: <strong>${data.responsible_node}</strong>`;
    document.getElementById('path').innerHTML = `Routing path: <span class="path">${data.path.join(' → ')}</span> (${data.hops} hops)`;
    highlightNode(data.responsible_node);
}

async function loadFingerTable(nodeId) {
    const response = await fetch(`/api/finger_table?node=${nodeId}`);
    const data = await response.json();
    if (data.finger_table) {
        document.getElementById('fingerInfo').innerHTML = `<strong>Node ${nodeId} finger table:</strong> [${data.finger_table.join(', ')}]`;
    } else {
        document.getElementById('fingerInfo').innerHTML = `<span style="color:red">${data.error}</span>`;
    }
}

function updateNodeList() {
    const ul = document.getElementById('nodeList');
    ul.innerHTML = nodes.map(n => `
        <li>
            <strong>Node ${n}</strong>
            <span class="finger-table" onclick="loadFingerTable(${n})">[show fingers]</span>
        </li>
    `).join('');
}

async function refreshRing() {
    const response = await fetch('/api/ring');
    const data = await response.json();
    nodes = data.nodes;
    drawRing();
    updateNodeList();
}

document.getElementById('lookupBtn').addEventListener('click', lookupKey);

// Load initial nodes when page loads
refreshRing();

// Auto-refresh every 3 seconds
setInterval(refreshRing, 3000);