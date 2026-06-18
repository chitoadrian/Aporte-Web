// ============================================================
// CotizaAPI Global - cotizaciones con integracion de 3 APIs
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://qvnbvfwcodjtqhbczxar.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__qQmLTITfpuVePH67M2dCw_CF8kmosN';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STORAGE_BUDGETS_KEY = 'ac_manager_budgets';
const STORAGE_USERS_KEY = 'ac_manager_users';
const STORAGE_SESSION_KEY = 'ac_manager_session';
const IVA_RATE = 0.15;
const REST_COUNTRIES_API_KEY = "rc_live_demo";
const WEATHER_API_KEY = "TU_API_KEY_AQUI";
const EXCHANGE_RATE_API_URL = 'https://open.er-api.com/v6/latest/USD';

let budgetList = [];
let authMode = 'login';
let currentUser = localStorage.getItem(STORAGE_SESSION_KEY) || '';
let currentCountryInfo = null;
let currentWeatherInfo = null;
let currentExchangeInfo = null;
let latestQuoteTotals = { subtotal: 0, iva: 0, total: 0 };

const $ = (id) => document.getElementById(id);

const landingSection = $('landingSection');
const authSection = $('authSection');
const calculatorSection = $('calculatorSection');
const btnEnterApp = $('btnEnterApp');
const btnBackToLanding = $('btnBackToLanding');
const btnLogout = $('btnLogout');
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

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
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

function setText(id, value) {
  const element = $(id);
  if (element) element.textContent = value;
}

function getCurrentFormattedDate() {
  return new Date().toLocaleString('es-ES');
}

function updateProjectBranding() {
  document.title = 'CotizaAPI Global - Sistema de cotizaciones con integracion de 3 APIs';
  document.querySelectorAll('.logo-text h1').forEach((title) => {
    title.innerHTML = 'Cotiza<span>API Global</span>';
  });
  setText('landingTagline', 'Sistema de cotizaciones con integracion de 3 APIs');
  setText('calculatorTagline', 'Cotizaciones, pais, clima y conversion de moneda');
  setText('heroBadge', 'Integracion de APIs publicas');
  setText('heroTitle', 'CotizaAPI Global - Sistema de cotizaciones con integracion de 3 APIs');
  setText('heroDescription', 'Crea cotizaciones con subtotal, IVA, total, datos de pais, clima por ciudad y conversion del total en USD a otras monedas mediante APIs reales.');
  setText('whyTitle', 'Por que elegir CotizaAPI Global');
  setText('costPrecisionTitle', 'Cotizaciones claras');
  setText('costPrecisionDesc', 'Calcula precio, mano de obra, IVA, subtotal y total para productos o servicios.');
  setText('taxCalcTitle', 'IVA automatizado');
  setText('taxCalcDesc', 'Aplica automaticamente la tasa del IVA del 15% sobre el subtotal.');
  setText('internalDatabaseTitle', '3 APIs conectadas');
  setText('internalDatabaseDesc', 'Consulta paises, clima y tasas de cambio con fetch, async/await y try/catch.');
  setText('usageGuideTitle', 'Guia rapida de CotizaAPI Global');
  setText('guideStep1Title', 'Accede al sistema');
  setText('guideStep1Desc', 'Inicia sesion para entrar al panel de cotizaciones y trabajar con tu historial.');
  setText('guideStep2Title', 'Ingresa los valores');
  setText('guideStep2Desc', 'Escribe cliente, producto o servicio, precio y mano de obra.');
  setText('guideStep3Title', 'Conecta datos globales');
  setText('guideStep3Desc', 'Consulta pais, clima y convierte el total USD a otra moneda antes de guardar o descargar PDF.');
  setText('featuresHeader', 'Automatiza cotizaciones con integracion de APIs');
  setText('feature1Title', 'Registro instantaneo');
  setText('feature1Desc', 'Guarda cotizaciones y consulta el historial con un solo clic.');
  setText('feature2Title', 'Desglose claro');
  setText('feature2Desc', 'Visualiza subtotal, IVA y total de forma ordenada.');
  setText('feature3Title', 'PDF de cotizacion');
  setText('feature3Desc', 'Descarga cotizaciones con formato profesional para tus clientes.');
  setText('feature4Title', 'Datos globales');
  setText('feature4Desc', 'Integra pais, clima y conversion monetaria con APIs publicas reales.');
  setText('solutionsHeader', 'Cotizaciones listas para productos y servicios');
  setText('solutionsDescription', 'CotizaAPI Global centraliza tus cotizaciones y las complementa con informacion internacional util.');
  setText('solutionItem1', 'Ingreso de precio del producto o servicio.');
  setText('solutionItem2', 'Ingreso de mano de obra y calculo automatico de IVA.');
  setText('solutionItem3', 'Historial, descarga PDF y datos obtenidos por APIs.');
  setText('benefitsHeader', 'Que ganas al usar CotizaAPI Global');
  setText('benefit1Title', 'Mas rapidez');
  setText('benefit1Desc', 'Reduce el tiempo necesario para calcular y guardar una cotizacion.');
  setText('benefit2Title', 'Menos errores');
  setText('benefit2Desc', 'Los calculos automaticos evitan fallos en impuestos, subtotales y totales.');
  setText('benefit3Title', 'Mayor confianza');
  setText('benefit3Desc', 'Presenta cotizaciones profesionales y consistentes a tus clientes.');
  setText('benefit4Title', 'Mas contexto');
  setText('benefit4Desc', 'Agrega bandera, moneda, idioma, clima y conversion de divisas a tus cotizaciones.');
  setText('quoteFormTitle', 'Nueva Cotizacion Global');
  setText('deviceModelLabel', 'Producto / Servicio');
  setText('deviceInputNote', 'Escribe el producto o servicio que deseas cotizar.');
  setText('partsCostLabel', 'Precio producto/servicio ($)');
  setText('btnCalculateText', 'Calcular y Guardar');
  setText('livePreviewBadge', 'Vista previa en vivo');
  setText('breakdownTitle', 'Desglose de la Cotizacion');
  setText('subtotalLabel', 'Subtotal (Precio + Mano de Obra)');
  setText('chartTitle', 'Grafico de la cotizacion');
  setText('partsLabel', 'Producto/servicio');
  setText('historyEmptyText', 'No hay cotizaciones registradas en el historial.');
  setText('footerLine1', '2026 CotizaAPI Global. Sistema de cotizaciones con integracion de 3 APIs.');
  setText('footerLine2', 'REST Countries | OpenWeather | ExchangeRate API');
  document.querySelectorAll('.visual-header').forEach((element) => {
    element.textContent = 'CotizaAPI Global';
  });
}

function injectGlobalApiStyles() {
  if ($('globalApisStyles')) return;
  const style = document.createElement('style');
  style.id = 'globalApisStyles';
  style.textContent = `.global-apis-card{margin-top:1.5rem}.api-grid{display:grid;gap:1rem}.api-tool{padding:1rem;border:1px solid rgba(0,198,255,.14);border-radius:var(--radius-md);background:rgba(0,242,254,.04)}.api-tool h3{font-size:1rem;margin-bottom:.35rem}.api-tool p{color:var(--text-muted);font-size:.84rem;margin-bottom:.8rem}.api-input-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.65rem;align-items:center}.api-input-row input{width:100%;padding:.8rem .95rem;background:var(--bg-input);border:1.5px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;font-size:.9rem}.btn-api{border:0;border-radius:var(--radius-md);background:var(--cyan-gradient);color:#000;cursor:pointer;font-family:inherit;font-size:.82rem;font-weight:800;padding:.8rem .95rem;white-space:nowrap}.btn-api:hover{filter:brightness(1.06);transform:translateY(-1px)}.api-result{display:grid;gap:.2rem;margin-top:.85rem;padding:.85rem;border-radius:var(--radius-md);background:rgba(255,255,255,.04);color:var(--text-muted);font-size:.84rem}.api-result strong,.api-result span{display:block}.api-result-success{border:1px solid rgba(0,198,255,.22);color:var(--text-primary)}.api-result-error{border:1px solid rgba(255,106,0,.28);color:var(--accent-orange)}.api-result-loading{border:1px solid rgba(0,198,255,.2);color:var(--accent-cyan)}.country-result{display:grid;grid-template-columns:54px 1fr;gap:.75rem;align-items:center}.country-result img{width:54px;height:36px;object-fit:cover;border-radius:6px;border:1px solid rgba(15,23,42,.12)}@media(max-width:520px){.api-input-row{grid-template-columns:1fr}}`;
  document.head.appendChild(style);
}

function calculateAmounts(parts, labor) {
  const price = Math.max(0, Number(parts) || 0);
  const work = Math.max(0, Number(labor) || 0);
  const subtotal = +(price + work).toFixed(2);
  const iva = +(subtotal * IVA_RATE).toFixed(2);
  const total = +(subtotal + iva).toFixed(2);
  return { subtotal, iva, total };
}

function setApiResult(id, html, type = 'info') {
  const element = $(id);
  if (!element) return;
  element.className = `api-result api-result-${type}`;
  element.innerHTML = html;
}

function getLatestTotal() {
  const parts = parseFloat(inputPartsCost?.value) || 0;
  const labor = parseFloat(inputLaborCost?.value) || 0;
  latestQuoteTotals = calculateAmounts(parts, labor);
  return latestQuoteTotals.total;
}

function injectGlobalApisPanel() {
  if ($('globalApisCard')) return;
  const formSection = document.querySelector('.section-form');
  if (!formSection) return;
  const card = document.createElement('div');
  card.className = 'card card-form global-apis-card';
  card.id = 'globalApisCard';
  card.innerHTML = `<div class="card-header"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="card-header-icon"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 0 20"></path><path d="M12 2a15.3 15.3 0 0 0 0 20"></path></svg><h2>APIs Globales</h2></div><div class="api-grid"><section class="api-tool"><h3>Pais</h3><p>Consulta bandera, moneda e idioma con REST Countries.</p><div class="api-input-row"><input type="text" id="countryInput" placeholder="Ej. Ecuador"><button type="button" id="btnCountryApi" class="btn-api">Buscar</button></div><div id="countryResult" class="api-result">Sin consulta.</div></section><section class="api-tool"><h3>Clima</h3><p>Consulta temperatura, humedad y descripcion con OpenWeather.</p><div class="api-input-row"><input type="text" id="weatherCityInput" placeholder="Ej. Quito"><button type="button" id="btnWeatherApi" class="btn-api">Ver clima</button></div><div id="weatherResult" class="api-result">Configura WEATHER_API_KEY para consultar.</div></section><section class="api-tool"><h3>Moneda</h3><p>Convierte el total de USD a otra moneda con ExchangeRate API.</p><div class="api-input-row"><input type="text" id="currencyInput" placeholder="EUR, COP, MXN" maxlength="3"><button type="button" id="btnExchangeApi" class="btn-api">Convertir</button></div><div id="exchangeResult" class="api-result">Ingresa una moneda para convertir.</div></section></div>`;
  formSection.appendChild(card);
}

async function fetchCountryInfo() {
  const query = ($('countryInput')?.value || '').trim();
  if (!query) return showToast('Escribe un pais para consultar.', 'error');
  setApiResult('countryResult', 'Consultando pais...', 'loading');
  try {
    const url = `https://api.restcountries.com/countries/v5/name?q=${encodeURIComponent(query)}&api-key=${REST_COUNTRIES_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('No se encontro informacion del pais.');
    const data = await response.json();
    const country = data?.data?.objects?.[0];
    if (!country) throw new Error('No se encontro informacion del pais.');
    const currencies = Object.entries(country.currencies || {}).map(([code, item]) => `${code} - ${item.name || 'Moneda'}`).join(', ') || 'No disponible';
    const languages = Object.values(country.languages || {}).map((item) => item.name || item).join(', ') || 'No disponible';
    currentCountryInfo = {
      name: country.names?.common || query,
      officialName: country.names?.official || '',
      flag: country.assets?.flag_png || country.assets?.flag_svg || '',
      currencies,
      languages
    };
    const flagMarkup = currentCountryInfo.flag ? `<img src="${currentCountryInfo.flag}" alt="Bandera de ${escapeHTML(currentCountryInfo.name)}">` : '';
    setApiResult('countryResult', `<div class="country-result">${flagMarkup}<div><strong>${escapeHTML(currentCountryInfo.name)}</strong><span>Moneda: ${escapeHTML(currentCountryInfo.currencies)}</span><span>Idioma: ${escapeHTML(currentCountryInfo.languages)}</span></div></div>`, 'success');
    showToast('Datos del pais cargados.', 'success');
  } catch (error) {
    currentCountryInfo = null;
    setApiResult('countryResult', escapeHTML(error.message || 'Error al consultar REST Countries.'), 'error');
    showToast('No se pudo consultar el pais.', 'error');
  }
}

async function fetchWeatherInfo() {
  const city = ($('weatherCityInput')?.value || '').trim();
  if (!city) return showToast('Escribe una ciudad para consultar el clima.', 'error');
  if (!WEATHER_API_KEY || WEATHER_API_KEY === 'TU_API_KEY_AQUI') {
    setApiResult('weatherResult', 'Configura WEATHER_API_KEY en app.js para usar OpenWeather.', 'error');
    return showToast('Falta configurar WEATHER_API_KEY.', 'error');
  }
  setApiResult('weatherResult', 'Consultando clima...', 'loading');
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${WEATHER_API_KEY}&units=metric&lang=es`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('No se pudo obtener el clima de esa ciudad.');
    const data = await response.json();
    currentWeatherInfo = { city: data.name || city, temperature: Math.round(data.main?.temp ?? 0), humidity: data.main?.humidity ?? 0, description: data.weather?.[0]?.description || 'No disponible' };
    setApiResult('weatherResult', `<strong>${escapeHTML(currentWeatherInfo.city)}</strong><span>Temperatura: ${currentWeatherInfo.temperature} C</span><span>Humedad: ${currentWeatherInfo.humidity}%</span><span>Clima: ${escapeHTML(currentWeatherInfo.description)}</span>`, 'success');
    showToast('Datos del clima cargados.', 'success');
  } catch (error) {
    currentWeatherInfo = null;
    setApiResult('weatherResult', escapeHTML(error.message || 'Error al consultar OpenWeather.'), 'error');
    showToast('No se pudo consultar el clima.', 'error');
  }
}

async function convertTotalCurrency() {
  const currency = ($('currencyInput')?.value || '').trim().toUpperCase();
  if (!currency || currency.length !== 3) return showToast('Escribe un codigo de moneda de 3 letras, por ejemplo EUR.', 'error');
  const total = getLatestTotal();
  setApiResult('exchangeResult', 'Consultando tasa de cambio...', 'loading');
  try {
    const response = await fetch(EXCHANGE_RATE_API_URL);
    if (!response.ok) throw new Error('No se pudo consultar ExchangeRate API.');
    const data = await response.json();
    const rate = data?.rates?.[currency];
    if (!rate) throw new Error(`No se encontro tasa para ${currency}.`);
    const convertedTotal = +(total * rate).toFixed(2);
    currentExchangeInfo = { base: 'USD', currency, rate, totalUSD: total, convertedTotal };
    setApiResult('exchangeResult', `<strong>${formatCurrency(total)} USD = ${convertedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}</strong><span>Tasa usada: 1 USD = ${rate} ${currency}</span>`, 'success');
    showToast('Total convertido correctamente.', 'success');
  } catch (error) {
    currentExchangeInfo = null;
    setApiResult('exchangeResult', escapeHTML(error.message || 'Error al consultar ExchangeRate API.'), 'error');
    showToast('No se pudo convertir la moneda.', 'error');
  }
}

function bindGlobalApiEvents() {
  $('btnCountryApi')?.addEventListener('click', fetchCountryInfo);
  $('btnWeatherApi')?.addEventListener('click', fetchWeatherInfo);
  $('btnExchangeApi')?.addEventListener('click', convertTotalCurrency);
}

function navigateTo(sectionId) {
  [landingSection, authSection, calculatorSection].forEach((section) => {
    if (!section) return;
    section.classList.toggle('hidden', section.id !== sectionId);
  });
}

function getBudgetStorageKey() {
  return currentUser ? `${STORAGE_BUDGETS_KEY}_${currentUser.toLowerCase()}` : `${STORAGE_BUDGETS_KEY}_guest`;
}

function loadLocalMirror() {
  try { budgetList = JSON.parse(localStorage.getItem(getBudgetStorageKey()) || '[]'); } catch { budgetList = []; }
}
function saveLocalMirror() { localStorage.setItem(getBudgetStorageKey(), JSON.stringify(budgetList)); }
function getUsers() { try { return JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '[]'); } catch { return []; } }
function saveUsers(users) { localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users)); }

function setAuthMode(mode) {
  authMode = mode === 'register' ? 'register' : 'login';
  tabLogin?.classList.toggle('active', authMode === 'login');
  tabRegister?.classList.toggle('active', authMode === 'register');
  confirmPasswordGroup?.classList.toggle('hidden', authMode === 'login');
  btnForgotPassword?.classList.toggle('hidden', authMode === 'register');
  if (authTitle) authTitle.textContent = authMode === 'login' ? 'Iniciar Sesion' : 'Crear Cuenta';
  if (authSubtitle) authSubtitle.textContent = authMode === 'login' ? 'Accede para crear y guardar tus cotizaciones.' : 'Registra una cuenta para usar el sistema.';
  if (btnAuthSubmitText) btnAuthSubmitText.textContent = authMode === 'login' ? 'Iniciar Sesion' : 'Crear Cuenta';
}

function handleSuccessfulLogin(email) {
  currentUser = email;
  localStorage.setItem(STORAGE_SESSION_KEY, email);
  loadLocalMirror();
  if (inputEmail) inputEmail.value = email;
  if (dbStatusLabel) dbStatusLabel.textContent = '3 APIs + Local';
  authForm?.reset();
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
  if (!emailRegex.test(email)) return showToast('Escribe un correo valido.', 'error');
  if (password.length < 6) return showToast('La contrasena debe tener minimo 6 caracteres.', 'error');
  const users = getUsers();
  if (authMode === 'register') {
    if (password !== confirmPassword) return showToast('Las contrasenas no coinciden.', 'error');
    if (users.some((user) => user.email === email)) { setAuthMode('login'); return showToast('Ese correo ya esta registrado. Inicia sesion.', 'error'); }
    users.push({ email, password });
    saveUsers(users);
    setAuthMode('login');
    if (inputAuthEmail) inputAuthEmail.value = email;
    if (inputAuthPassword) inputAuthPassword.value = '';
    if (inputAuthConfirmPassword) inputAuthConfirmPassword.value = '';
    return showToast('Cuenta creada. Ahora inicia sesion.', 'success');
  }
  const user = users.find((item) => item.email === email && item.password === password);
  if (!user) return showToast('Correo o contrasena incorrectos. Si no tienes cuenta, registrate.', 'error');
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
  const items = budgetList.filter((item) => String(item.id).includes(q) || String(item.clientName || '').toLowerCase().includes(q) || String(item.deviceModel || '').toLowerCase().includes(q));
  if (recordsBadge) recordsBadge.textContent = `${budgetList.length} Cotizaciones`;
  if (btnClearHistory) btnClearHistory.disabled = budgetList.length === 0;
  if (!items.length) { bodyHistory.innerHTML = '<tr><td colspan="6">No hay cotizaciones registradas.</td></tr>'; return; }
  bodyHistory.innerHTML = '';
  items.slice().reverse().forEach((item, index) => {
    const displayId = items.length - index;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>#${displayId}</td><td>${escapeHTML(item.clientName)}</td><td>${escapeHTML(item.deviceModel)}</td><td>${formatCurrency(item.total)}</td><td>${escapeHTML(item.date)}</td><td class="action-buttons"><button type="button" class="btn-delete icon-btn" data-id="${escapeHTML(item.id)}" title="Borrar cotizacion">X</button><button type="button" class="btn-pdf icon-btn" data-id="${escapeHTML(item.id)}" title="Descargar PDF">PDF</button></td>`;
    bodyHistory.appendChild(tr);
  });
  bodyHistory.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', () => {
      budgetList = budgetList.filter((item) => String(item.id) !== String(btn.dataset.id));
      saveLocalMirror();
      renderHistory(searchHistory?.value || '');
      showToast('Registro eliminado.', 'success');
    });
  });
  bodyHistory.querySelectorAll('.btn-pdf').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = budgetList.find((budget) => String(budget.id) === String(btn.dataset.id));
      if (item) generatePDF(item);
    });
  });
}

function updatePreviewDisplay() {
  const parts = parseFloat(inputPartsCost?.value) || 0;
  const labor = parseFloat(inputLaborCost?.value) || 0;
  const { subtotal, iva, total } = calculateAmounts(parts, labor);
  latestQuoteTotals = { subtotal, iva, total };
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
  if (!clientName || !deviceModel) return showToast('Completa cliente y producto o servicio.', 'error');
  const { subtotal, iva, total } = calculateAmounts(partsCost, laborCost);
  const payload = { cliente: clientName, dispositivo: deviceModel, repuestos: partsCost, mano_obra: laborCost, iva, total, email, fecha_creacion: new Date().toISOString() };
  showToast('Guardando cotizacion...', 'info');
  const result = await insertToSupabase(payload);
  const row = result.row || {};
  const record = { id: row.id || Date.now(), clientName: row.cliente || clientName, deviceModel: row.dispositivo || deviceModel, partsCost: row.repuestos ?? partsCost, laborCost: row.mano_obra ?? laborCost, subtotal, iva: row.iva ?? iva, total: row.total ?? total, countryInfo: currentCountryInfo, weatherInfo: currentWeatherInfo, exchangeInfo: currentExchangeInfo, email: row.email || email, date: row.fecha_creacion ? new Date(row.fecha_creacion).toLocaleString('es-ES') : getCurrentFormattedDate() };
  budgetList.push(record);
  saveLocalMirror();
  renderHistory(searchHistory?.value || '');
  budgetForm.reset();
  if (inputEmail && currentUser) inputEmail.value = currentUser;
  updatePreviewDisplay();
  showToast('Cotizacion guardada correctamente.', 'success');
}

function drawPdfLogo(doc) {
  doc.setFillColor(5, 12, 20); doc.circle(22, 21, 9.5, 'F');
  doc.setFillColor(0, 72, 95); doc.circle(22, 21, 8.2, 'F');
  doc.setTextColor(0, 198, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text('C', 22, 25, { align: 'center' });
  doc.setTextColor(130, 235, 255); doc.setFontSize(8); doc.text('API', 22, 19.5, { align: 'center' });
}

function loadLogoForPDF() {
  return new Promise((resolve) => {
    const img = new Image(); img.crossOrigin = 'anonymous';
    img.onload = () => { const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight; canvas.getContext('2d').drawImage(img, 0, 0); resolve(canvas.toDataURL('image/png')); };
    img.onerror = () => resolve(null); img.src = 'logo.png';
  });
}

async function generatePDF(item) {
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) return showToast('No se pudo cargar jsPDF.', 'error');
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(10, 18, 32); doc.rect(0, 0, pageWidth, 42, 'F');
  const logoBase64 = await loadLogoForPDF();
  if (logoBase64) doc.addImage(logoBase64, 'PNG', 12, 8, 96, 22); else drawPdfLogo(doc);
  doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text('CotizaAPI Global - Sistema de cotizaciones con integracion de 3 APIs', 18, 48);
  doc.text('Datos del cliente', 18, 58); doc.setDrawColor(0, 198, 255); doc.line(18, 62, 86, 62);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
  doc.text(`Nombre: ${item.clientName}`, 18, 74); doc.text(`Producto / Servicio: ${item.deviceModel}`, 18, 84); doc.text(`Usuario: ${item.email || currentUser || 'No registrado'}`, 18, 94);
  doc.setFillColor(241, 245, 249); doc.roundedRect(122, 52, 68, 47, 4, 4, 'F'); doc.setTextColor(51, 65, 85); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('TOTAL A PAGAR', 156, 65, { align: 'center' }); doc.setTextColor(0, 94, 170); doc.setFontSize(20); doc.text(formatCurrency(item.total), 156, 82, { align: 'center' }); doc.setTextColor(100, 116, 139); doc.setFontSize(9); doc.text('IVA 15% incluido', 156, 92, { align: 'center' });
  const startY = 120; doc.setFillColor(15, 23, 42); doc.roundedRect(18, startY, 174, 12, 3, 3, 'F'); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('Descripcion', 25, startY + 8); doc.text('Precio', 183, startY + 8, { align: 'right' });
  const rows = [['Producto / servicio', item.partsCost], ['Mano de obra', item.laborCost], ['Subtotal', item.subtotal], ['IVA 15%', item.iva]];
  let y = startY + 24;
  rows.forEach((row, index) => { if (index % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(18, y - 8, 174, 12, 'F'); } doc.setTextColor(30, 41, 59); doc.setFont('helvetica', index >= 2 ? 'bold' : 'normal'); doc.setFontSize(11); doc.text(row[0], 25, y); doc.text(formatCurrency(row[1]), 183, y, { align: 'right' }); y += 14; });
  if (item.countryInfo || item.weatherInfo || item.exchangeInfo) {
    y += 6; doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Datos de APIs integradas', 18, y); y += 10; doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(51, 65, 85);
    if (item.countryInfo) { doc.text(`Pais: ${item.countryInfo.name} | Moneda: ${item.countryInfo.currencies}`, 25, y); y += 7; doc.text(`Idioma: ${item.countryInfo.languages}`, 25, y); y += 8; }
    if (item.weatherInfo) { doc.text(`Clima en ${item.weatherInfo.city}: ${item.weatherInfo.temperature} C, humedad ${item.weatherInfo.humidity}%, ${item.weatherInfo.description}`, 25, y); y += 8; }
    if (item.exchangeInfo) { doc.text(`Conversion: ${formatCurrency(item.exchangeInfo.totalUSD)} USD = ${item.exchangeInfo.convertedTotal} ${item.exchangeInfo.currency}`, 25, y); y += 8; }
  }
  doc.setFillColor(0, 94, 170); doc.roundedRect(112, y, 80, 18, 4, 4, 'F'); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Total general', 119, y + 12); doc.text(formatCurrency(item.total), 185, y + 12, { align: 'right' });
  doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setDrawColor(226, 232, 240); doc.line(18, pageHeight - 32, 192, pageHeight - 32); doc.text('Cotizacion generada por CotizaAPI Global con REST Countries, OpenWeather y ExchangeRate API.', 18, pageHeight - 24); doc.text('Gracias por confiar en nuestro sistema de cotizaciones.', 18, pageHeight - 17); doc.save(`cotizacion-${item.id}.pdf`);
}

function init() {
  updateProjectBranding(); injectGlobalApiStyles(); injectGlobalApisPanel(); loadLocalMirror(); bindGlobalApiEvents(); setAuthMode('login');
  if (currentUser && inputEmail) inputEmail.value = currentUser;
  if (dbStatusLabel) dbStatusLabel.textContent = '3 APIs + Local';
  navigateTo('landingSection');
  btnEnterApp?.addEventListener('click', (event) => { event.preventDefault(); navigateTo('authSection'); });
  btnBackToLanding?.addEventListener('click', (event) => { event.preventDefault(); navigateTo('landingSection'); });
  btnLogout?.addEventListener('click', (event) => { event.preventDefault(); currentUser = ''; budgetList = []; localStorage.removeItem(STORAGE_SESSION_KEY); renderHistory(); navigateTo('landingSection'); showToast('Sesion cerrada.', 'success'); });
  tabLogin?.addEventListener('click', () => setAuthMode('login'));
  tabRegister?.addEventListener('click', () => setAuthMode('register'));
  authForm?.addEventListener('submit', handleAuthSubmit);
  btnForgotPassword?.addEventListener('click', () => showToast('En esta version local debes crear una cuenta nueva o revisar tus datos guardados.', 'info'));
  budgetForm?.addEventListener('submit', handleBudgetFormSubmit);
  searchHistory?.addEventListener('input', (event) => renderHistory(event.target.value));
  btnClearHistory?.addEventListener('click', () => { if (!budgetList.length) return; if (!confirm('Seguro que quieres limpiar todo el historial?')) return; budgetList = []; saveLocalMirror(); renderHistory(); showToast('Historial limpiado.', 'success'); });
  inputPartsCost?.addEventListener('input', updatePreviewDisplay);
  inputLaborCost?.addEventListener('input', updatePreviewDisplay);
  renderHistory(); updatePreviewDisplay(); console.log('CotizaAPI Global iniciado correctamente.');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
