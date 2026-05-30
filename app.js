// ============================================================
// AC MANAGER - app.js limpio y funcional
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ========== SUPABASE ==========
const SUPABASE_URL = 'https://qvnbvfwcodjtqhbczxar.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__qQmLTITfpuVePH67M2dCw_CF8kmosN';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== ESTADO ==========
const STORAGE_BUDGETS_KEY = 'ac_manager_budgets';
const STORAGE_USERS_KEY = 'ac_manager_users';
const STORAGE_SESSION_KEY = 'ac_manager_session';
const IVA_RATE = 0.15;

let budgetList = [];
let authMode = 'login';
let currentUser = localStorage.getItem(STORAGE_SESSION_KEY) || '';
let currentLanguage = localStorage.getItem('selectedLanguage') || 'es';

// ========== DOM ==========
const $ = (id) => document.getElementById(id);

const landingSection = $('landingSection');
const authSection = $('authSection');
const calculatorSection = $('calculatorSection');
const btnEnterApp = $('btnEnterApp');
const btnBackToLanding = $('btnBackToLanding');
const btnLogout = $('btnLogout');

const languageToggle = $('languageToggle');
const languageOptions = $('languageOptions');
const selectedLanguageSpan = $('selectedLanguage');

const tabLogin = $('tabLogin');
const tabRegister = $('tabRegister');
const authForm = $('authForm');
const authTitle = $('authTitle');
const authSubtitle = $('authSubtitle');
const inputAuthEmail = $('authEmail');
const inputAuthPassword = $('authPassword');
const inputAuthConfirmPassword = $('authConfirmPassword');
const confirmPasswordGroup = $('confirmPasswordGroup');
const btnForgotPassword = $('btnForgotPassword');
const btnAuthSubmitText = $('btnAuthSubmitText');

const budgetForm = $('budgetForm');
const inputClientName = $('clientName');
const inputDeviceModel = $('deviceModel');
const inputPartsCost = $('partsCost');
const inputLaborCost = $('laborCost');
const inputEmail = $('email');
const bodyHistory = $('bodyHistory');
const searchHistory = $('searchHistory');
const recordsBadge = $('recordsBadge');
const btnClearHistory = $('btnClearHistory');
const lblSubtotal = $('lblSubtotal');
const lblIva = $('lblIva');
const lblTotal = $('lblTotal');
const dbStatusLabel = $('dbStatusLabel');

const barParts = $('barParts');
const barLabor = $('barLabor');
const barIva = $('barIva');
const partsPercent = $('partsPercent');
const laborPercent = $('laborPercent');
const ivaPercent = $('ivaPercent');

// ========== TEXTOS ==========
const translations = {
  es: { selectedLanguage: 'Español', btnEnterAppText: 'Comenzar ahora' },
  en: { selectedLanguage: 'English', btnEnterAppText: 'Get Started' },
  pt: { selectedLanguage: 'Português', btnEnterAppText: 'Começar agora' }
};

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function showToast(message, type = 'info') {
  const container = $('toastContainer');
  if (!container) {
    console.log(`[${type}] ${message}`);
    return;
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 20);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

function getCurrentFormattedDate() {
  return new Date().toLocaleString('es-ES');
}

function calculateAmounts(parts, labor) {
  const p = Math.max(0, Number(parts) || 0);
  const l = Math.max(0, Number(labor) || 0);
  const subtotal = +(p + l).toFixed(2);
  const iva = +(subtotal * IVA_RATE).toFixed(2);
  const total = +(subtotal + iva).toFixed(2);
  return { subtotal, iva, total };
}

function navigateTo(sectionId) {
  [landingSection, authSection, calculatorSection].forEach((section) => {
    if (!section) return;
    section.classList.toggle('hidden', section.id !== sectionId);
  });
}

function updateLanguageDisplay() {
  const data = translations[currentLanguage] || translations.es;
  if (selectedLanguageSpan) selectedLanguageSpan.textContent = data.selectedLanguage;

  const btnText = $('btnEnterAppText');
  if (btnText) btnText.textContent = data.btnEnterAppText;

  document.querySelectorAll('.language-option').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === currentLanguage);
  });
}

function setLanguage(lang) {
  currentLanguage = translations[lang] ? lang : 'es';
  localStorage.setItem('selectedLanguage', currentLanguage);
  updateLanguageDisplay();
  showToast(`Idioma cambiado a ${translations[currentLanguage].selectedLanguage}`, 'success');
}

function loadLocalMirror() {
  try {
    budgetList = JSON.parse(localStorage.getItem(STORAGE_BUDGETS_KEY) || '[]');
  } catch {
    budgetList = [];
  }
}

function saveLocalMirror() {
  localStorage.setItem(STORAGE_BUDGETS_KEY, JSON.stringify(budgetList));
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

function setAuthMode(mode) {
  authMode = mode === 'register' ? 'register' : 'login';

  if (tabLogin) tabLogin.classList.toggle('active', authMode === 'login');
  if (tabRegister) tabRegister.classList.toggle('active', authMode === 'register');
  if (confirmPasswordGroup) confirmPasswordGroup.classList.toggle('hidden', authMode === 'login');
  if (btnForgotPassword) btnForgotPassword.classList.toggle('hidden', authMode === 'register');

  if (authTitle) authTitle.textContent = authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta';
  if (authSubtitle) authSubtitle.textContent = authMode === 'login'
    ? 'Accede para crear y guardar tus cotizaciones.'
    : 'Registra una cuenta para usar el sistema.';
  if (btnAuthSubmitText) btnAuthSubmitText.textContent = authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta';
}

function handleSuccessfulLogin(email) {
  currentUser = email;
  localStorage.setItem(STORAGE_SESSION_KEY, email);
  if (inputEmail) inputEmail.value = email;
  if (dbStatusLabel) dbStatusLabel.textContent = 'Supabase + Local';
  if (authForm) authForm.reset();
  navigateTo('calculatorSection');
  renderHistory();
  showToast(`Bienvenido: ${email}`, 'success');
}

function handleAuthSubmit(event) {
  event.preventDefault();

  const email = (inputAuthEmail?.value || '').trim().toLowerCase();
  const password = inputAuthPassword?.value || '';
  const confirmPassword = inputAuthConfirmPassword?.value || '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    showToast('Escribe un correo válido.', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('La contraseña debe tener mínimo 6 caracteres.', 'error');
    return;
  }

  const users = getUsers();

  if (authMode === 'register') {
    if (password !== confirmPassword) {
      showToast('Las contraseñas no coinciden.', 'error');
      return;
    }
    if (users.some((u) => u.email === email)) {
      showToast('Ese correo ya está registrado. Inicia sesión.', 'error');
      setAuthMode('login');
      return;
    }
    users.push({ email, password });
    saveUsers(users);
    showToast('Cuenta creada. Ahora inicia sesión.', 'success');
    setAuthMode('login');
    if (inputAuthEmail) inputAuthEmail.value = email;
    if (inputAuthPassword) inputAuthPassword.value = '';
    if (inputAuthConfirmPassword) inputAuthConfirmPassword.value = '';
    return;
  }

  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    showToast('Correo o contraseña incorrectos. Si no tienes cuenta, regístrate.', 'error');
    return;
  }

  handleSuccessfulLogin(email);
}

async function insertToSupabase(payload) {
  try {
    const { data, error } = await supabase.from('presupuestos').insert([payload]).select();
    if (error) throw error;
    return { success: true, row: data?.[0] || null };
  } catch (error) {
    console.error('Error al guardar en Supabase:', error);
    return { success: false, error };
  }
}

function renderHistory(filter = '') {
  if (!bodyHistory) return;

  const q = filter.toLowerCase().trim();
  const items = budgetList.filter((item) =>
    String(item.id).includes(q) ||
    String(item.clientName || '').toLowerCase().includes(q) ||
    String(item.deviceModel || '').toLowerCase().includes(q)
  );

  if (recordsBadge) recordsBadge.textContent = `${budgetList.length} registros`;
  if (btnClearHistory) btnClearHistory.disabled = budgetList.length === 0;

  if (!items.length) {
    bodyHistory.innerHTML = '<tr><td colspan="6">No hay presupuestos registrados.</td></tr>';
    return;
  }

  bodyHistory.innerHTML = '';
  items.slice().reverse().forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${String(item.id).slice(-6)}</td>
      <td>${escapeHTML(item.clientName)}</td>
      <td>${escapeHTML(item.deviceModel)}</td>
      <td>${formatCurrency(item.total)}</td>
      <td>${escapeHTML(item.date)}</td>
      <td>
        <button type="button" class="btn-delete" data-id="${escapeHTML(item.id)}">Borrar</button>
        <button type="button" class="btn-pdf" data-id="${escapeHTML(item.id)}">PDF</button>
      </td>
    `;
    bodyHistory.appendChild(tr);
  });

  bodyHistory.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      budgetList = budgetList.filter((item) => String(item.id) !== String(id));
      saveLocalMirror();
      renderHistory(searchHistory?.value || '');
      showToast('Registro eliminado.', 'success');
    });
  });

  bodyHistory.querySelectorAll('.btn-pdf').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = budgetList.find((b) => String(b.id) === String(btn.dataset.id));
      if (item) generatePDF(item);
    });
  });
}

function updatePreviewDisplay() {
  const parts = parseFloat(inputPartsCost?.value) || 0;
  const labor = parseFloat(inputLaborCost?.value) || 0;
  const { subtotal, iva, total } = calculateAmounts(parts, labor);

  if (lblSubtotal) lblSubtotal.textContent = formatCurrency(subtotal);
  if (lblIva) lblIva.textContent = formatCurrency(iva);
  if (lblTotal) lblTotal.textContent = formatCurrency(total);

  const base = total || 1;
  const partPct = total ? Math.round((parts / base) * 100) : 0;
  const laborPct = total ? Math.round((labor / base) * 100) : 0;
  const ivaPct = total ? Math.round((iva / base) * 100) : 0;

  if (barParts) barParts.style.width = `${partPct}%`;
  if (barLabor) barLabor.style.width = `${laborPct}%`;
  if (barIva) barIva.style.width = `${ivaPct}%`;
  if (partsPercent) partsPercent.textContent = `${partPct}%`;
  if (laborPercent) laborPercent.textContent = `${laborPct}%`;
  if (ivaPercent) ivaPercent.textContent = `${ivaPct}%`;
}

async function handleBudgetFormSubmit(event) {
  event.preventDefault();

  const clientName = (inputClientName?.value || '').trim();
  const deviceModel = (inputDeviceModel?.value || '').trim();
  const partsCost = parseFloat(inputPartsCost?.value) || 0;
  const laborCost = parseFloat(inputLaborCost?.value) || 0;
  const email = currentUser || inputEmail?.value || 'sin-correo@local.com';

  if (!clientName || !deviceModel) {
    showToast('Completa cliente y dispositivo.', 'error');
    return;
  }

  const { subtotal, iva, total } = calculateAmounts(partsCost, laborCost);
  const payload = {
    cliente: clientName,
    dispositivo: deviceModel,
    repuestos: partsCost,
    mano_obra: laborCost,
    iva,
    total,
    email,
    fecha_creacion: new Date().toISOString()
  };

  showToast('Guardando cotización...', 'info');
  const result = await insertToSupabase(payload);

  const row = result.row || {};
  const record = {
    id: row.id || Date.now(),
    clientName: row.cliente || clientName,
    deviceModel: row.dispositivo || deviceModel,
    partsCost: row.repuestos ?? partsCost,
    laborCost: row.mano_obra ?? laborCost,
    subtotal,
    iva: row.iva ?? iva,
    total: row.total ?? total,
    email: row.email || email,
    date: row.fecha_creacion ? new Date(row.fecha_creacion).toLocaleString('es-ES') : getCurrentFormattedDate()
  };

  budgetList.push(record);
  saveLocalMirror();
  renderHistory(searchHistory?.value || '');
  budgetForm.reset();
  if (inputEmail && currentUser) inputEmail.value = currentUser;
  updatePreviewDisplay();

  showToast(result.success ? 'Guardado en Supabase correctamente.' : 'Guardado localmente. Revisa Supabase/RLS si no aparece en la nube.', result.success ? 'success' : 'warning');
}

function generatePDF(item) {
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) {
    showToast('No se pudo cargar jsPDF.', 'error');
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('AC Manager - Cotización', 20, 20);
  doc.setFontSize(12);
  doc.text(`Cliente: ${item.clientName}`, 20, 40);
  doc.text(`Dispositivo: ${item.deviceModel}`, 20, 50);
  doc.text(`Fecha: ${item.date}`, 20, 60);
  doc.text(`Repuestos: ${formatCurrency(item.partsCost)}`, 20, 80);
  doc.text(`Mano de obra: ${formatCurrency(item.laborCost)}`, 20, 90);
  doc.text(`Subtotal: ${formatCurrency(item.subtotal)}`, 20, 105);
  doc.text(`IVA 15%: ${formatCurrency(item.iva)}`, 20, 115);
  doc.setFontSize(15);
  doc.text(`Total: ${formatCurrency(item.total)}`, 20, 130);
  doc.save(`cotizacion-${item.id}.pdf`);
}

function init() {
  loadLocalMirror();
  updateLanguageDisplay();
  setAuthMode('login');

  if (currentUser && inputEmail) inputEmail.value = currentUser;
  navigateTo(currentUser ? 'calculatorSection' : 'landingSection');

  btnEnterApp?.addEventListener('click', (event) => {
    event.preventDefault();
    navigateTo('authSection');
  });

  btnBackToLanding?.addEventListener('click', (event) => {
    event.preventDefault();
    navigateTo('landingSection');
  });

  btnLogout?.addEventListener('click', (event) => {
    event.preventDefault();
    currentUser = '';
    localStorage.removeItem(STORAGE_SESSION_KEY);
    navigateTo('landingSection');
    showToast('Sesión cerrada.', 'success');
  });

  tabLogin?.addEventListener('click', () => setAuthMode('login'));
  tabRegister?.addEventListener('click', () => setAuthMode('register'));
  authForm?.addEventListener('submit', handleAuthSubmit);

  btnForgotPassword?.addEventListener('click', () => {
    showToast('En esta versión local debes crear una cuenta nueva o revisar tus datos guardados.', 'info');
  });

  languageToggle?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    languageOptions?.classList.toggle('hidden');
  });

  languageOptions?.querySelectorAll('.language-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      setLanguage(btn.dataset.lang);
      languageOptions.classList.add('hidden');
    });
  });

  document.addEventListener('click', (event) => {
    if (!languageToggle?.contains(event.target) && !languageOptions?.contains(event.target)) {
      languageOptions?.classList.add('hidden');
    }
  });

  budgetForm?.addEventListener('submit', handleBudgetFormSubmit);
  searchHistory?.addEventListener('input', (event) => renderHistory(event.target.value));

  btnClearHistory?.addEventListener('click', () => {
    if (!budgetList.length) return;
    if (!confirm('¿Seguro que quieres limpiar todo el historial?')) return;
    budgetList = [];
    saveLocalMirror();
    renderHistory();
    showToast('Historial limpiado.', 'success');
  });

  inputPartsCost?.addEventListener('input', updatePreviewDisplay);
  inputLaborCost?.addEventListener('input', updatePreviewDisplay);

  renderHistory();
  updatePreviewDisplay();
  console.log('AC Manager iniciado correctamente.');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
