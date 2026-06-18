// ============================================================
// COTIZAAPI - app.js limpio y funcional
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

// En un proyecto real, la API_KEY sirve para autenticar la conexion
// con una API externa de calculo, facturacion o cotizaciones.
const API_KEY = "TU_API_KEY_AQUI";

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

function setText(id, value) {
  const element = $(id);
  if (element) element.textContent = value;
}

function updateProjectBranding() {
  document.title = 'CotizaAPI - Sistema web de cotizaciones con cálculo mediante API';

  document.querySelectorAll('.logo-text h1').forEach((title) => {
    title.innerHTML = 'Cotiza<span>API</span>';
  });

  setText('landingTagline', 'Sistema web de cotizaciones con cálculo mediante API');
  setText('calculatorTagline', 'Sistema web de cotizaciones con cálculo mediante API');
  setText('heroBadge', 'Cotizaciones con API simulada');
  setText('heroTitle', 'CotizaAPI - Sistema web de cotizaciones con cálculo mediante API');
  setText('heroDescription', 'CotizaAPI permite ingresar precio del producto o servicio, mano de obra e IVA para generar cotizaciones con subtotal, impuesto y total mediante una función API simulada.');
  setText('whyTitle', '¿Por qué elegir CotizaAPI?');
  setText('costPrecisionTitle', 'Cálculo mediante API');
  setText('costPrecisionDesc', 'El subtotal, IVA y total se calculan pasando los datos por una función que simula una API de cotizaciones.');
  setText('taxCalcTitle', 'IVA automatizado');
  setText('taxCalcDesc', 'Aplica automáticamente la tasa del IVA del 15% sobre el subtotal del producto o servicio y la mano de obra.');
  setText('internalDatabaseTitle', 'Historial local y Supabase');
  setText('internalDatabaseDesc', 'Guarda las cotizaciones generadas y conserva un respaldo local para consulta rápida.');
  setText('usageGuideTitle', 'Guía rápida de CotizaAPI');
  setText('guideStep1Title', 'Accede al sistema');
  setText('guideStep1Desc', 'Inicia sesión para entrar al panel de cotizaciones y trabajar con tu historial.');
  setText('guideStep2Title', 'Ingresa los valores');
  setText('guideStep2Desc', 'Escribe cliente, producto o servicio, precio y mano de obra.');
  setText('guideStep3Title', 'Calcula con API');
  setText('guideStep3Desc', 'El sistema muestra subtotal, IVA y total usando la función calcularCotizacionAPI.');
  setText('featuresHeader', 'Automatiza cotizaciones con cálculo tipo API');
  setText('feature1Title', 'Registro instantáneo');
  setText('feature1Desc', 'Guarda cotizaciones y consulta el historial con un solo clic.');
  setText('feature2Title', 'Desglose claro');
  setText('feature2Desc', 'Visualiza subtotal, IVA y total de forma ordenada.');
  setText('feature3Title', 'PDF de cotización');
  setText('feature3Desc', 'Descarga cotizaciones con formato profesional para tus clientes.');
  setText('feature4Title', 'Conexión API simulada');
  setText('feature4Desc', 'La lógica está preparada para integrarse con una API externa real.');
  setText('solutionsHeader', 'Cotizaciones listas para productos y servicios');
  setText('solutionsDescription', 'CotizaAPI centraliza tus cotizaciones, evita cálculos manuales y prepara el proyecto para una integración API real.');
  setText('solutionItem1', 'Ingreso de precio del producto o servicio.');
  setText('solutionItem2', 'Ingreso de mano de obra y cálculo automático de IVA.');
  setText('solutionItem3', 'Historial y descarga de PDF para cada cotización.');
  setText('benefitsHeader', 'Qué ganas al usar CotizaAPI');
  setText('benefit1Title', 'Más rapidez');
  setText('benefit1Desc', 'Reduce el tiempo necesario para calcular y guardar una cotización.');
  setText('benefit2Title', 'Menos errores');
  setText('benefit2Desc', 'Los cálculos automáticos evitan fallos en impuestos, subtotales y totales.');
  setText('benefit3Title', 'Mayor confianza');
  setText('benefit3Desc', 'Presenta cotizaciones profesionales y consistentes a tus clientes.');
  setText('benefit4Title', 'Preparado para API');
  setText('benefit4Desc', 'La estructura puede conectarse luego a un servicio externo real de cotizaciones.');
  setText('quoteFormTitle', 'Nueva Cotización API');
  setText('deviceModelLabel', 'Producto / Servicio');
  setText('deviceInputNote', 'Escribe el producto o servicio que deseas cotizar.');
  setText('partsCostLabel', 'Precio producto/servicio ($)');
  setText('btnCalculateText', 'Calcular por API y Guardar');
  setText('livePreviewBadge', 'API simulada en vivo');
  setText('breakdownTitle', 'Desglose de la Cotización');
  setText('subtotalLabel', 'Subtotal (Precio + Mano de Obra)');
  setText('chartTitle', 'Gráfico de la cotización');
  setText('partsLabel', 'Producto/servicio');
  setText('historyEmptyText', 'No hay cotizaciones registradas en el historial.');
  setText('footerLine1', '© 2026 CotizaAPI. Sistema web de cotizaciones con cálculo mediante API.');
  setText('footerLine2', 'Demostración funcional | Cotizaciones, IVA, historial y PDF');

  document.querySelectorAll('.visual-header').forEach((element) => {
    element.textContent = 'CotizaAPI';
  });
}

function calcularCotizacionAPI(precio, manoObra, iva = IVA_RATE) {
  // Esta funcion simula la respuesta de una API externa.
  // En produccion se enviarian precio, manoObra, iva y API_KEY mediante fetch
  // para autenticar y recibir los calculos desde un servicio real.
  const apiKey = API_KEY;
  const precioSeguro = Math.max(0, Number(precio) || 0);
  const manoObraSegura = Math.max(0, Number(manoObra) || 0);
  const ivaSeguro = Math.max(0, Number(iva) || 0);

  console.log('Simulando conexion a API de cotizaciones con API_KEY:', apiKey);

  const subtotal = +(precioSeguro + manoObraSegura).toFixed(2);
  const valorIVA = +(subtotal * ivaSeguro).toFixed(2);
  const total = +(subtotal + valorIVA).toFixed(2);

  return { subtotal, valorIVA, total };
}

function calculateAmounts(parts, labor) {
  const { subtotal, valorIVA, total } = calcularCotizacionAPI(parts, labor, IVA_RATE);
  return { subtotal, iva: valorIVA, total };
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

function getBudgetStorageKey() {
  return currentUser
    ? `${STORAGE_BUDGETS_KEY}_${currentUser.toLowerCase()}`
    : `${STORAGE_BUDGETS_KEY}_guest`;
}

function loadLocalMirror() {
  try {
    budgetList = JSON.parse(localStorage.getItem(getBudgetStorageKey()) || '[]');
  } catch {
    budgetList = [];
  }
}

function saveLocalMirror() {
  localStorage.setItem(getBudgetStorageKey(), JSON.stringify(budgetList));
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
  loadLocalMirror();

  if (inputEmail) inputEmail.value = email;
  if (dbStatusLabel) dbStatusLabel.textContent = 'API + Supabase';
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

  if (recordsBadge) recordsBadge.textContent = `${budgetList.length} Cotizaciones`;
  if (btnClearHistory) btnClearHistory.disabled = budgetList.length === 0;

  if (!items.length) {
    bodyHistory.innerHTML = '<tr><td colspan="6">No hay cotizaciones registradas.</td></tr>';
    return;
  }

  bodyHistory.innerHTML = '';
  items.slice().reverse().forEach((item, index) => {
    const displayId = items.length - index;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${displayId}</td>
      <td>${escapeHTML(item.clientName)}</td>
      <td>${escapeHTML(item.deviceModel)}</td>
      <td>${formatCurrency(item.total)}</td>
      <td>${escapeHTML(item.date)}</td>
      <td class="action-buttons">
        <button type="button" class="btn-delete icon-btn" data-id="${escapeHTML(item.id)}" title="Borrar cotización">🗑️</button>
        <button type="button" class="btn-pdf icon-btn" data-id="${escapeHTML(item.id)}" title="Descargar PDF">📄</button>
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
    showToast('Completa cliente y producto o servicio.', 'error');
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

  showToast('Calculando por API y guardando cotización...', 'info');
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

  showToast('Cotización API guardada correctamente.', 'success');
}

function drawPdfLogo(doc) {
  // Logo estilo página: círculo oscuro con A celeste
  doc.setFillColor(5, 12, 20);
  doc.circle(22, 21, 9.5, 'F');

  doc.setFillColor(0, 72, 95);
  doc.circle(22, 21, 8.2, 'F');

  doc.setTextColor(0, 198, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('C', 22, 25, { align: 'center' });

  doc.setTextColor(130, 235, 255);
  doc.setFontSize(8);
  doc.text('API', 22, 19.5, { align: 'center' });
}

function loadLogoForPDF() {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => resolve(null);
    img.src = 'logo.png';
  });
}

async function generatePDF(item) {
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) {
    showToast('No se pudo cargar jsPDF.', 'error');
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(10, 18, 32);
  doc.rect(0, 0, pageWidth, 42, 'F');
  const logoBase64 = await loadLogoForPDF();

if (logoBase64) {
  doc.addImage(logoBase64, 'PNG', 12, 8, 96, 22);
} else {
  drawPdfLogo(doc);
}
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('CotizaAPI - Sistema web de cotizaciones con cálculo mediante API', 18, 48);
  doc.text('Datos del cliente', 18, 58);
  doc.setDrawColor(0, 198, 255);
  doc.line(18, 62, 86, 62);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Nombre: ${item.clientName}`, 18, 74);
  doc.text(`Producto / Servicio: ${item.deviceModel}`, 18, 84);
  doc.text(`Usuario: ${item.email || currentUser || 'No registrado'}`, 18, 94);

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(122, 52, 68, 47, 4, 4, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL A PAGAR', 156, 65, { align: 'center' });
  doc.setTextColor(0, 94, 170);
  doc.setFontSize(20);
  doc.text(formatCurrency(item.total), 156, 82, { align: 'center' });
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text('IVA 15% incluido', 156, 92, { align: 'center' });

  const startY = 120;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(18, startY, 174, 12, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Descripción', 25, startY + 8);
  doc.text('Precio', 183, startY + 8, { align: 'right' });

  const rows = [
    ['Producto / servicio', item.partsCost],
    ['Mano de obra', item.laborCost],
    ['Subtotal', item.subtotal],
    ['IVA 15%', item.iva]
  ];

  let y = startY + 24;
  rows.forEach((row, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(18, y - 8, 174, 12, 'F');
    }
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', index >= 2 ? 'bold' : 'normal');
    doc.setFontSize(11);
    doc.text(row[0], 25, y);
    doc.text(formatCurrency(row[1]), 183, y, { align: 'right' });
    y += 14;
  });

  doc.setFillColor(0, 94, 170);
  doc.roundedRect(112, y, 80, 18, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total general', 119, y + 12);
  doc.text(formatCurrency(item.total), 185, y + 12, { align: 'right' });

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setDrawColor(226, 232, 240);
  doc.line(18, pageHeight - 32, 192, pageHeight - 32);
  doc.text('Cotización generada automáticamente por CotizaAPI mediante cálculo API simulado.', 18, pageHeight - 24);
  doc.text('Gracias por confiar en nuestro sistema de cotizaciones.', 18, pageHeight - 17);

  doc.save(`cotizacion-${item.id}.pdf`);
}

function init() {
  updateProjectBranding();
  loadLocalMirror();
  updateLanguageDisplay();
  updateProjectBranding();
  setAuthMode('login');

  if (currentUser && inputEmail) inputEmail.value = currentUser;
  if (dbStatusLabel) dbStatusLabel.textContent = 'API + Local';
  navigateTo('landingSection');

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
    budgetList = [];
    localStorage.removeItem(STORAGE_SESSION_KEY);
    renderHistory();
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
  console.log('CotizaAPI iniciado correctamente.');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
