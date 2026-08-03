const API = 'http://localhost:3000';

// ============================================================
// Utilidades
// ============================================================
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

let toastTimer;
function toast(msg, type = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 3000);
}

function val(id) { return document.getElementById(id)?.value.trim(); }

// ============================================================
// Navegación
// ============================================================
document.querySelectorAll('nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.section).classList.add('active');
    if (btn.dataset.section === 'sec-categories') loadCategories();
    if (btn.dataset.section === 'sec-tasks')      loadTasks();
  });
});

// ============================================================
// CATEGORÍAS
// ============================================================
async function loadCategories() {
  const grid = document.getElementById('cats-grid');
  try {
    const cats = await api('GET', '/categories');
    if (!cats.length) { grid.innerHTML = '<p class="empty">No hay categorías.</p>'; return; }
    grid.innerHTML = cats.map(c => `
      <div class="card" style="border-left-color:${c.color}">
        <h3><span class="cat-dot" style="background:${c.color}"></span>${c.name}</h3>
        <p>Color: ${c.color}</p>
        <div class="actions">
          <button class="btn btn-danger btn-sm" onclick="deleteCategory(${c.id})">Eliminar</button>
        </div>
      </div>`).join('');
  } catch (e) { grid.innerHTML = `<p class="empty">Error: ${e.message}</p>`; }
}

async function createCategory() {
  const name = val('cat-name'), color = val('cat-color') || '#3498db';
  if (!name) { toast('El nombre es obligatorio', 'err'); return; }
  try {
    await api('POST', '/categories', { name, color });
    document.getElementById('cat-name').value = '';
    document.getElementById('cat-color').value = '#3498db';
    toast('Categoría creada');
    loadCategories();
    loadTaskSelects();
  } catch (e) { toast(e.message, 'err'); }
}

async function deleteCategory(id) {
  if (!confirm('¿Eliminar categoría? Las tareas quedarán sin categoría.')) return;
  try {
    await api('DELETE', `/categories/${id}`);
    toast('Categoría eliminada');
    loadCategories();
  } catch (e) { toast(e.message, 'err'); }
}

// ============================================================
// TAREAS
// ============================================================
let allTasks = [];

async function loadTaskSelects() {
  const cats = await api('GET', '/categories').catch(() => []);
  const cSel = document.getElementById('task-category');
  cSel.innerHTML = '<option value="">Sin categoría</option>' +
    cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

async function loadTasks() {
  await loadTaskSelects();
  const grid = document.getElementById('tasks-grid');
  try {
    allTasks = await api('GET', '/tasks');
    renderTasks(allTasks);
  } catch (e) { grid.innerHTML = `<p class="empty">Error: ${e.message}</p>`; }
}

function renderTasks(tasks) {
  const grid = document.getElementById('tasks-grid');
  if (!tasks.length) { grid.innerHTML = '<p class="empty">No hay tareas.</p>'; return; }
  grid.innerHTML = tasks.map(t => {
    // El backend regresa category_name / category_color como campos planos
    // (viene del LEFT JOIN), no como un objeto anidado t.category.
    const color = t.category_color ?? '#cbd5e0';
    const catName = t.category_name ?? 'Sin categoría';
    return `
      <div class="card" style="border-left-color:${color}">
        <h3>${t.title}</h3>
        <p><span class="badge ${t.status}">${statusLabel(t.status)}</span></p>
        ${t.description ? `<p style="margin-top:0.4rem">${t.description}</p>` : ''}
        <p><span class="cat-dot" style="background:${color}"></span>${catName}</p>
        ${t.due_date ? `<p>📅 ${t.due_date}</p>` : ''}
        <div class="actions">
          ${t.status !== 'done' ? `<button class="btn btn-success btn-sm" onclick="markDone(${t.id})">✓ Completar</button>` : ''}
          ${t.status === 'pending' ? `<button class="btn btn-warning btn-sm" onclick="markInProgress(${t.id})">▶ En progreso</button>` : ''}
          <button class="btn btn-danger btn-sm" onclick="deleteTask(${t.id})">Eliminar</button>
        </div>
      </div>`;
  }).join('');
}

function statusLabel(s) {
  return { pending: 'Pendiente', in_progress: 'En progreso', done: 'Completada' }[s] ?? s;
}

function filterTasks() {
  const status = document.getElementById('filter-status').value;
  let filtered = allTasks;
  if (status) filtered = filtered.filter(t => t.status === status);
  renderTasks(filtered);
}

async function createTask() {
  const title = val('task-title');
  const description = val('task-desc');
  const due_date = val('task-due');
  const category_id = parseInt(document.getElementById('task-category').value) || undefined;

  if (!title) { toast('El título es obligatorio', 'err'); return; }

  try {
    await api('POST', '/tasks', { title, description: description || undefined, due_date: due_date || undefined, category_id });
    document.getElementById('task-title').value = '';
    document.getElementById('task-desc').value = '';
    document.getElementById('task-due').value = '';
    document.getElementById('task-category').value = '';
    toast('Tarea creada');
    loadTasks();
  } catch (e) { toast(e.message, 'err'); }
}

async function markDone(id) {
  try {
    await api('PATCH', `/tasks/${id}`, { status: 'done' });
    toast('Tarea completada');
    loadTasks();
  } catch (e) { toast(e.message, 'err'); }
}

async function markInProgress(id) {
  try {
    await api('PATCH', `/tasks/${id}`, { status: 'in_progress' });
    toast('Tarea en progreso');
    loadTasks();
  } catch (e) { toast(e.message, 'err'); }
}

async function deleteTask(id) {
  if (!confirm('¿Eliminar esta tarea?')) return;
  try {
    await api('DELETE', `/tasks/${id}`);
    toast('Tarea eliminada');
    loadTasks();
  } catch (e) { toast(e.message, 'err'); }
}

// ============================================================
// Init
// ============================================================
loadCategories();
