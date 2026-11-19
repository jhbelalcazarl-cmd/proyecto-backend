import './style.css';
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const COUNTRIES_URL = `${API_BASE}/countries`;

const elements = {
  body: document.querySelector('#countries-body'),
  total: document.querySelector('#total-count'),
  continents: document.querySelector('#continent-count'),
  population: document.querySelector('#population-total'),
  results: document.querySelector('#results-count'),
  footer: document.querySelector('#footer-count'),
  search: document.querySelector('#search-input'),
  modal: document.querySelector('#country-modal'),
  form: document.querySelector('#country-form'),
  modalTitle: document.querySelector('#modal-title'),
  modalDescription: document.querySelector('#modal-description'),
  save: document.querySelector('#save-country-btn'),
  toast: document.querySelector('#toast-region')
};

let countries = [];
let editingId = null;

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[char]);
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-CO').format(Number(value) || 0);
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
  });
  if (response.status === 204) return { response, data: null };
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { error: text || 'Respuesta no válida del servidor.' }; }
  if (!response.ok) {
    const error = new Error(data?.error || `Error HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return { response, data };
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-symbol">${type === 'success' ? '✓' : '!'}</span><span>${escapeHtml(message)}</span>`;
  elements.toast.append(toast);
  window.setTimeout(() => toast.remove(), 4300);
}

function showError(error) {
  const messages = {
    400: 'Datos inválidos. Revisa los campos del formulario.',
    404: 'El país ya no existe o no fue encontrado.',
    409: 'Ya existe un país con alguno de esos códigos o nombre.',
    403: 'El navegador bloqueó la petición por configuración CORS.'
  };
  showToast(messages[error.status] || error.message || 'No fue posible conectar con el servidor.', 'error');
}

function renderStats() {
  elements.total.textContent = formatNumber(countries.length);
  elements.continents.textContent = formatNumber(new Set(countries.map(c => c.continent)).size);
  const population = countries.reduce((sum, country) => sum + (Number(country.population) || 0), 0);
  elements.population.textContent = new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 }).format(population);
}

function renderCountries() {
  const query = elements.search.value.trim().toLocaleLowerCase('es');
  const filtered = countries.filter(country =>
    [country.name, country.alpha2, country.alpha3, country.numeric_code, country.continent]
      .some(value => String(value ?? '').toLocaleLowerCase('es').includes(query))
  );
  elements.results.textContent = `${filtered.length} resultado${filtered.length === 1 ? '' : 's'}`;
  elements.footer.textContent = `Mostrando ${filtered.length} de ${countries.length} países`;

  if (!filtered.length) {
    elements.body.innerHTML = `<tr><td colspan="5" class="table-message">${countries.length ? 'No hay coincidencias para tu búsqueda.' : 'No hay países registrados.'}</td></tr>`;
    return;
  }

  elements.body.innerHTML = filtered.map(country => `
    <tr>
      <td><div class="country-cell"><span class="country-avatar">${escapeHtml(country.alpha2)}</span><div><strong>${escapeHtml(country.name)}</strong><small>${escapeHtml(country.alpha3)}</small></div></div></td>
      <td><span class="code-pill">${escapeHtml(country.alpha2)} · ${escapeHtml(country.numeric_code)}</span></td>
      <td><span class="continent-label">${escapeHtml(country.continent)}</span></td>
      <td class="number-cell">${formatNumber(country.population)}</td>
      <td class="actions-cell">
        <button class="row-action edit-action" data-action="edit" data-id="${escapeHtml(country.alpha2)}" aria-label="Editar ${escapeHtml(country.name)}" title="Editar">✎</button>
        <button class="row-action delete-action" data-action="delete" data-id="${escapeHtml(country.alpha2)}" aria-label="Eliminar ${escapeHtml(country.name)}" title="Eliminar">⌫</button>
      </td>
    </tr>`).join('');
}

async function loadCountries() {
  elements.body.innerHTML = '<tr><td colspan="5" class="table-message">Consultando la API...</td></tr>';
  try {
    const { data } = await apiRequest(COUNTRIES_URL);
    if (!Array.isArray(data)) throw new Error('La API no devolvió una lista de países.');
    countries = data;
    renderStats();
    renderCountries();
  } catch (error) {
    elements.body.innerHTML = '<tr><td colspan="5" class="table-message error-text">No se pudieron cargar los países. Verifica que el backend esté ejecutándose.</td></tr>';
    elements.results.textContent = 'Sin conexión';
    showError(error);
  }
}

function openModal(country = null) {
  editingId = country?.alpha2 ?? null;
  elements.form.reset();
  elements.modalTitle.textContent = country ? 'Editar país' : 'Nuevo país';
  elements.modalDescription.textContent = country
    ? `Actualiza la información de ${country.name}.`
    : 'Completa la información para registrar un país.';
  elements.save.textContent = country ? 'Guardar cambios' : 'Guardar país';

  if (country) {
    for (const [key, value] of Object.entries(country)) {
      const input = elements.form.elements.namedItem(key);
      if (input) input.value = value ?? '';
    }
    elements.form.elements.alpha2.readOnly = true;
    elements.form.elements.alpha2.classList.add('readonly-field');
  } else {
    elements.form.elements.alpha2.readOnly = false;
    elements.form.elements.alpha2.classList.remove('readonly-field');
  }

  elements.modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  elements.form.elements.alpha2.focus();
}

function closeModal() {
  elements.modal.classList.add('hidden');
  document.body.classList.remove('modal-open');
  editingId = null;
}

function validateForm(values) {
  const required = ['alpha2', 'alpha3', 'numeric_code', 'name', 'continent', 'population'];
  for (const field of required) {
    if (String(values[field] ?? '').trim() === '') return `El campo ${field} es obligatorio.`;
  }
  if (!/^[A-Za-z]{2}$/.test(values.alpha2)) return 'El código Alfa-2 debe contener exactamente 2 letras.';
  if (!/^[A-Za-z]{3}$/.test(values.alpha3)) return 'El código Alfa-3 debe contener exactamente 3 letras.';
  if (!/^\d{3}$/.test(values.numeric_code)) return 'El código numérico debe contener exactamente 3 dígitos.';
  if (values.name.length > 100) return 'El nombre no puede superar 100 caracteres.';
  if (!Number.isSafeInteger(Number(values.population)) || Number(values.population) < 0) {
    return 'La población debe ser un número entero igual o mayor que cero.';
  }
  return null;
}

async function saveCountry(event) {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const payload = Object.fromEntries(formData.entries());
  payload.alpha2 = payload.alpha2.trim().toUpperCase();
  payload.alpha3 = payload.alpha3.trim().toUpperCase();
  payload.numeric_code = payload.numeric_code.trim();
  payload.name = payload.name.trim();
  payload.population = Number(payload.population);

  const validationError = validateForm(payload);
  if (validationError) {
    showToast(validationError, 'error');
    return;
  }

  elements.save.disabled = true;
  elements.save.textContent = 'Guardando...';
  try {
    const isEdit = Boolean(editingId);
    const url = isEdit ? `${COUNTRIES_URL}/${encodeURIComponent(editingId)}` : COUNTRIES_URL;
    const method = isEdit ? 'PUT' : 'POST';
    const { response } = await apiRequest(url, { method, body: JSON.stringify(payload) });
    closeModal();
    showToast(isEdit
      ? `País actualizado correctamente (HTTP ${response.status}).`
      : `País creado correctamente (HTTP ${response.status} Created).`, 'success');
    await loadCountries();
  } catch (error) {
    showError(error);
  } finally {
    elements.save.disabled = false;
    elements.save.textContent = editingId ? 'Guardar cambios' : 'Guardar país';
  }
}

async function deleteCountry(id) {
  const country = countries.find(item => item.alpha2 === id);
  if (!country) return;
  const confirmed = window.confirm(`¿Seguro que deseas eliminar ${country.name} (${country.alpha2})? Esta acción no se puede deshacer.`);
  if (!confirmed) return;

  try {
    const { response } = await apiRequest(`${COUNTRIES_URL}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    showToast(`País eliminado correctamente (HTTP ${response.status}).`, 'success');
    await loadCountries();
  } catch (error) {
    showError(error);
  }
}

document.querySelector('#add-country-btn').addEventListener('click', () => openModal());
document.querySelector('#refresh-btn').addEventListener('click', loadCountries);
document.querySelector('#close-modal-btn').addEventListener('click', closeModal);
document.querySelector('#cancel-modal-btn').addEventListener('click', closeModal);
elements.modal.addEventListener('click', event => { if (event.target === elements.modal) closeModal(); });
elements.form.addEventListener('submit', saveCountry);
elements.search.addEventListener('input', renderCountries);
elements.body.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const country = countries.find(item => item.alpha2 === button.dataset.id);
  if (button.dataset.action === 'edit' && country) openModal(country);
  if (button.dataset.action === 'delete') deleteCountry(button.dataset.id);
});
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !elements.modal.classList.contains('hidden')) closeModal(); });

loadCountries();
