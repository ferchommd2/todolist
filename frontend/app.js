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
    if (btn.dataset.section === 'sec-users')      loadUsers();
    if (btn.dataset.section === 'sec-categories') loadCategories();
    if (btn.dataset.section === 'sec-tasks')      loadTasks();
  });
});

// ============================================================
// USUARIOS
// ============================================================
async function loadUsers() {
  const grid = document.getElementById('users-grid');
  try {
    const users = await api('GET', '/users');
    if (!users.length) { grid.innerHTML = '<p class="empty">No hay usuarios registrados.</p>'; return; }
    grid.innerHTML = users.map(u => `
      <div class="card">
        <h3>${u.name}</h3>
        <p>📧 ${u.email}</p>
        <p style="font-size:0.78rem;color:#a0aec0">Registrado: ${new Date(u.created_at).toLocaleDateString('es-MX')}</p>
        <div class="actions">
          <button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id})">Eliminar</button>
        </div>
      </div>`).join('');
  } catch (e) { grid.innerHTML = `<p class="empty">Error: ${e.message}</p>`; }
}

async function createUser() {
  const name = val('user-name'), email = val('user-email');
  if (!name || !email) { toast('Nombre y correo son obligatorios', 'err'); return; }
  try {
    await api('POST', '/users', { name, email });
    document.getElementById('user-name').value = '';
    document.getElementById('user-email').value = '';
    toast('Usuario creado');
    loadUsers();
    loadTaskSelects();
  } catch (e) { toast(e.message, 'err'); }
}

async function deleteUser(id) {
  if (!confirm('¿Eliminar usuario? Se eliminarán también todas sus tareas.')) return;
  try {
    await api('DELETE', `/users/${id}`);
    toast('Usuario eliminado');
    loadUsers();
  } catch (e) { toast(e.message, 'err'); }
}

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
  const [users, cats] = await Promise.all([
    api('GET', '/users').catch(() => []),
    api('GET', '/categories').catch(() => []),
  ]);

  const uSel = document.getElementById('task-user');
  const cSel = document.getElementById('task-category');
  const fSel = document.getElementById('filter-user');

  uSel.innerHTML = '<option value="">-- Usuario --</option>' +
    users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
  cSel.innerHTML = '<option value="">Sin categoría</option>' +
    cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  fSel.innerHTML = '<option value="">Todos los usuarios</option>' +
    users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
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
    const color = t.category?.color ?? '#cbd5e0';
    const catName = t.category?.name ?? 'Sin categoría';
    return `
      <div class="card" style="border-left-color:${color}">
        <h3>${t.title}</h3>
        <p><span class="badge ${t.status}">${statusLabel(t.status)}</span></p>
        ${t.description ? `<p style="margin-top:0.4rem">${t.description}</p>` : ''}
        <p>👤 ${t.user?.name ?? '—'}</p>
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
  const userId = document.getElementById('filter-user').value;
  const status = document.getElementById('filter-status').value;
  let filtered = allTasks;
  if (userId) filtered = filtered.filter(t => String(t.user?.id) === userId);
  if (status) filtered = filtered.filter(t => t.status === status);
  renderTasks(filtered);
}

async function createTask() {
  const title = val('task-title');
  const description = val('task-desc');
  const due_date = val('task-due');
  const user_id = parseInt(document.getElementById('task-user').value);
  const category_id = parseInt(document.getElementById('task-category').value) || undefined;

  if (!title) { toast('El título es obligatorio', 'err'); return; }
  if (!user_id) { toast('Selecciona un usuario', 'err'); return; }

  try {
    await api('POST', '/tasks', { title, description: description || undefined, due_date: due_date || undefined, user_id, category_id });
    document.getElementById('task-title').value = '';
    document.getElementById('task-desc').value = '';
    document.getElementById('task-due').value = '';
    document.getElementById('task-user').value = '';
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
loadUsers();
