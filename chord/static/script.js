const canvas = document.getElementById('ringCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const cx = W / 2, cy = H / 2;
const RING_R = 200;
const RING_SIZE = 64;

let nodes = [];
let nodeData = [];
let showFingers = false;
let selectedNode = null;
let lookupPath = [];

// ── Helpers ──────────────────────────────────────────────────────
function nodePos(id) {
    const angle = (id / RING_SIZE) * 2 * Math.PI - Math.PI / 2;
    return {
        x: cx + RING_R * Math.cos(angle),
        y: cy + RING_R * Math.sin(angle),
    };
}

function drawArrow(fromX, fromY, toX, toY, color, width, curved) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = 0.55;

    const dx = toX - fromX, dy = toY - fromY;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len, uy = dy / len;

    // Shorten so arrow doesn't overlap node circles
    const pad = 20;
    const sx = fromX + ux * pad, sy = fromY + uy * pad;
    const ex = toX - ux * pad, ey = toY - uy * pad;

    ctx.beginPath();
    if (curved) {
        const mx = (sx + ex) / 2 - dy * 0.25, my = (sy + ey) / 2 + dx * 0.25;
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(mx, my, ex, ey);
    } else {
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
    }
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(ey - (curved ? (sy + ey) / 2 + dx * 0.25 : sy),
        ex - (curved ? (sx + ex) / 2 - dy * 0.25 : sx));
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - 10 * Math.cos(angle - 0.4), ey - 10 * Math.sin(angle - 0.4));
    ctx.lineTo(ex - 10 * Math.cos(angle + 0.4), ey - 10 * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

// ── Main draw ────────────────────────────────────────────────────
function drawRing() {
    ctx.clearRect(0, 0, W, H);

    // Outer decorative ring
    ctx.beginPath();
    ctx.arc(cx, cy, RING_R + 18, 0, 2 * Math.PI);
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Main ring
    ctx.beginPath();
    ctx.arc(cx, cy, RING_R, 0, 2 * Math.PI);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner fill
    ctx.beginPath();
    ctx.arc(cx, cy, RING_R, 0, 2 * Math.PI);
    ctx.fillStyle = '#f0f9ff';
    ctx.fill();

    // Slot tick marks around ring
    for (let i = 0; i < RING_SIZE; i++) {
        const angle = (i / RING_SIZE) * 2 * Math.PI - Math.PI / 2;
        const inner = RING_R - 5, outer = RING_R + 5;
        ctx.beginPath();
        ctx.moveTo(cx + inner * Math.cos(angle), cy + inner * Math.sin(angle));
        ctx.lineTo(cx + outer * Math.cos(angle), cy + outer * Math.sin(angle));
        ctx.strokeStyle = '#bfdbfe';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }

    // Position labels (0, 16, 32, 48)
    [0, 16, 32, 48].forEach(id => {
        const angle = (id / RING_SIZE) * 2 * Math.PI - Math.PI / 2;
        const lx = cx + (RING_R + 30) * Math.cos(angle);
        const ly = cy + (RING_R + 30) * Math.sin(angle);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(id, lx, ly);
    });

    if (nodes.length === 0) {
        ctx.fillStyle = '#ef4444';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No active nodes', cx, cy);
        return;
    }

    // ── Finger table arrows ──────────────────────────────────────
    if (showFingers && selectedNode !== null) {
        const nd = nodeData.find(n => n.id === selectedNode);
        if (nd && nd.finger_table) {
            const from = nodePos(nd.id);
            const colors = ['#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899'];
            nd.finger_table.forEach((targetId, i) => {
                if (targetId !== nd.id) {
                    const to = nodePos(targetId);
                    drawArrow(from.x, from.y, to.x, to.y, colors[i % colors.length], 1.8, true);
                }
            });
        }
    }

    // ── Lookup path highlight ────────────────────────────────────
    if (lookupPath.length > 1) {
        for (let i = 0; i < lookupPath.length - 1; i++) {
            const from = nodePos(lookupPath[i]);
            const to = nodePos(lookupPath[i + 1]);
            drawArrow(from.x, from.y, to.x, to.y, '#f97316', 2.5, false);
        }
    }

    // ── Draw nodes ───────────────────────────────────────────────
    nodes.forEach(nodeId => {
        const { x, y } = nodePos(nodeId);
        const isSelected = nodeId === selectedNode;
        const isInPath = lookupPath.includes(nodeId);
        const isLastHop = lookupPath.length > 0 && nodeId === lookupPath[lookupPath.length - 1];

        let fillColor = '#2ecc71';
        let strokeColor = '#27ae60';
        let radius = 20;

        if (isLastHop) { fillColor = '#f59e0b'; strokeColor = '#d97706'; radius = 24; }
        else if (isInPath) { fillColor = '#f97316'; strokeColor = '#ea580c'; radius = 22; }
        else if (isSelected) { fillColor = '#3b82f6'; strokeColor = '#1d4ed8'; radius = 22; }

        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Node ID text
        ctx.fillStyle = 'white';
        ctx.font = `bold ${radius > 20 ? 14 : 13}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(nodeId, x, y);

        // Hop number label
        if (isInPath) {
            const hopIdx = lookupPath.indexOf(nodeId);
            ctx.fillStyle = '#1e293b';
            ctx.font = '10px sans-serif';
            ctx.fillText(`hop ${hopIdx + 1}`, x, y + radius + 12);
        }
    });
}

// ── Canvas click — select node ────────────────────────────────────
canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let clicked = null;
    for (const id of nodes) {
        const { x, y } = nodePos(id);
        if (Math.sqrt((mx - x) ** 2 + (my - y) ** 2) < 24) { clicked = id; break; }
    }

    if (clicked !== null) {
        if (selectedNode === clicked && showFingers) {
            showFingers = false; selectedNode = null;
            document.getElementById('fingerInfo').innerHTML = '';
        } else {
            selectedNode = clicked;
            showFingers = true;
            loadFingerTable(clicked);
        }
    } else {
        showFingers = false; selectedNode = null;
        document.getElementById('fingerInfo').innerHTML = '';
    }
    drawRing();
});

// ── Key Lookup ────────────────────────────────────────────────────
async function lookupKey() {
    const key = document.getElementById('keyInput').value.trim();
    if (!key) return;
    const res = await fetch(`/api/lookup_key?key=${encodeURIComponent(key)}`);
    const data = await res.json();
    if (data.error) {
        document.getElementById('result').innerHTML = `<span style="color:#ef4444">Error: ${data.error}</span>`;
        document.getElementById('path').innerHTML = '';
        return;
    }
    lookupPath = data.path;
    drawRing();
    document.getElementById('result').innerHTML =
        `Key: <strong>${data.key}</strong> → hash: <strong>${data.hash}</strong> → node: <strong>${data.responsible_node}</strong>`;
    document.getElementById('path').innerHTML =
        `Routing path: <span class="path">${data.path.join(' → ')}</span> (${data.hops} hops)`;
}

// ── Add Node ──────────────────────────────────────────────────────
async function addNode() {
    const name = document.getElementById('addNodeInput').value.trim();
    if (!name) return;
    const res = await fetch('/api/add_node', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (data.error) {
        document.getElementById('addNodeResult').innerHTML = `<span style="color:#ef4444">Error: ${data.error}</span>`;
    } else {
        document.getElementById('addNodeResult').innerHTML = `✅ Added <strong>${data.name}</strong> (id=${data.node_id})`;
        document.getElementById('addNodeInput').value = '';
        lookupPath = [];
        refreshRing();
    }
}

// ── Remove Node ───────────────────────────────────────────────────
async function removeNode() {
    const select = document.getElementById('removeNodeSelect');
    const nodeId = parseInt(select.value);
    if (isNaN(nodeId)) return;
    const res = await fetch('/api/remove_node', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_id: nodeId })
    });
    const data = await res.json();
    if (data.error) {
        document.getElementById('removeNodeResult').innerHTML = `<span style="color:#ef4444">Error: ${data.error}</span>`;
    } else {
        document.getElementById('removeNodeResult').innerHTML = `✅ Removed node <strong>${nodeId}</strong>`;
        lookupPath = [];
        if (selectedNode === nodeId) { selectedNode = null; showFingers = false; }
        refreshRing();
    }
}

// ── Reset ─────────────────────────────────────────────────────────
async function resetRing() {
    await fetch('/api/reset', { method: 'POST' });
    lookupPath = []; selectedNode = null; showFingers = false;
    document.getElementById('result').innerHTML = '';
    document.getElementById('path').innerHTML = '';
    document.getElementById('fingerInfo').innerHTML = '';
    refreshRing();
}

// ── Finger Table ──────────────────────────────────────────────────
async function loadFingerTable(nodeId) {
    const res = await fetch(`/api/finger_table?node=${nodeId}`);
    const data = await res.json();
    if (data.finger_table) {
        const colors = ['🟠', '🟡', '🟢', '🔵', '🟣', '🩷'];
        const rows = data.finger_table.map((id, i) =>
            `<tr><td style="color:#64748b;padding:2px 8px">${colors[i]} i=${i}</td><td style="font-weight:600;color:#0d9488;padding:2px 8px">→ node ${id}</td></tr>`
        ).join('');
        document.getElementById('fingerInfo').innerHTML =
            `<strong>Node ${nodeId} finger table</strong><br><small style="color:#94a3b8">Click node on ring to toggle arrows</small>
       <table style="margin-top:6px;font-family:monospace;font-size:12px">${rows}</table>`;
    }
}

// ── Node list ─────────────────────────────────────────────────────
function updateNodeList() {
    const ul = document.getElementById('nodeList');
    ul.innerHTML = nodes.map(n => {
        const nd = nodeData.find(d => d.id === n);
        const name = nd ? nd.name : '';
        return `<li>
      <strong>Node ${n}</strong> <span style="color:#94a3b8;font-size:11px">${name}</span>
      <span class="finger-table" onclick="selectedNode=${n};showFingers=true;loadFingerTable(${n});drawRing()">[show fingers]</span>
    </li>`;
    }).join('');

    const sel = document.getElementById('removeNodeSelect');
    sel.innerHTML = nodes.map(n => {
        const nd = nodeData.find(d => d.id === n);
        return `<option value="${n}">${n} (${nd ? nd.name : ''})</option>`;
    }).join('');
}

// ── Refresh ───────────────────────────────────────────────────────
async function refreshRing() {
    const res = await fetch('/api/ring');
    const data = await res.json();
    nodes = data.nodes;
    nodeData = data.node_data || [];
    drawRing();
    updateNodeList();
}

// ── Event listeners ───────────────────────────────────────────────
document.getElementById('lookupBtn').addEventListener('click', lookupKey);
document.getElementById('addNodeBtn').addEventListener('click', addNode);
document.getElementById('removeNodeBtn').addEventListener('click', removeNode);
document.getElementById('keyInput').addEventListener('keydown', e => { if (e.key === 'Enter') lookupKey(); });

// Initial load
refreshRing();
setInterval(refreshRing, 8000);