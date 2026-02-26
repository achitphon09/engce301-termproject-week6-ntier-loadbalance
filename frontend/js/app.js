// app.js — Frontend Application
const API = '/api';

// Fetch helper
async function api(path, options = {}) {
    const res = await fetch(`${API}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
    return res.json();
}

// Load health info (shows which instance served the request)
async function loadHealth() {
    try {
        const data = await api('/health');
        document.getElementById('instance-info').innerHTML =
            `🖥️ ${data.instanceId} | Cache Hit: ${data.cache.hitRate}`;
    } catch { document.getElementById('instance-info').textContent = '⚠️ Cannot reach API'; }
}

// Load all tasks
async function loadTasks() {
    try {
        const data = await api('/tasks');
        const tasks = data.data || [];

        ['todo', 'in_progress', 'done'].forEach(status => {
            const container = document.querySelector(`#${status} .tasks`);
            container.innerHTML = tasks
                .filter(t => t.status === status.toUpperCase())
                .map(t => `
                    <div class="task-card priority-${t.priority}">
                        <h3>${t.title}</h3>
                        <div class="meta">
                            <span>${t.priority}</span>
                            <span>${new Date(t.createdAt).toLocaleDateString('th-TH')}</span>
                        </div>
                        <div class="task-actions">
                            ${t.status !== 'DONE' ? `<button onclick="moveTask(${t.id},'${t.status === 'TODO' ? 'IN_PROGRESS' : 'DONE'}')">➡️ Next</button>` : ''}
                            ${t.status !== 'IN_PROGRESS' ? `<button onclick="deleteTask(${t.id})">🗑️</button>` : ''}
                        </div>
                    </div>
                `).join('');
        });

        // Load stats
        const statsData = await api('/tasks/stats');
        const s = statsData.data;
        document.getElementById('stats-panel').innerHTML = `
            <div class="stat-card"><div class="number">${s.total}</div>Total</div>
            <div class="stat-card"><div class="number">${s.byStatus.TODO}</div>TODO</div>
            <div class="stat-card"><div class="number">${s.byStatus.IN_PROGRESS}</div>In Progress</div>
            <div class="stat-card"><div class="number">${s.byStatus.DONE}</div>Done</div>
            <div class="stat-card"><div class="number">${s.completionRate}%</div>Completion</div>
        `;
    } catch (error) { console.error('Load error:', error); }
}

// Create task
document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await api('/tasks', {
        method: 'POST',
        body: JSON.stringify({
            title: document.getElementById('title').value,
            priority: document.getElementById('priority').value
        })
    });
    document.getElementById('title').value = '';
    loadTasks();
    loadHealth();
});

// Move task status
async function moveTask(id, newStatus) {
    await api(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
    loadTasks();
    loadHealth();
}

// Delete task
async function deleteTask(id) {
    if (!confirm('ลบ Task นี้?')) return;
    await api(`/tasks/${id}`, { method: 'DELETE' });
    loadTasks();
    loadHealth();
}

// Initial load
loadTasks();
loadHealth();
setInterval(loadHealth, 5000);  // Refresh instance info every 5s
