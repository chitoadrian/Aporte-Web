// ============================================================
// CotizaAPI Global - Sistema de cotizaciones con integración de 3 APIs
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://qvnbvfwcodjtqhbczxar.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__qQmLTITfpuVePH67M2dCw_CF8kmosN';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STORAGE_BUDGETS_KEY = 'cotizaapi_global_budgets';
const STORAGE_USERS_KEY = 'cotizaapi_global_users';
const STORAGE_SESSION_KEY = 'cotizaapi_global_session';
const LEGACY_STORAGE_BUDGETS_KEY = ['ac', 'manager', 'budgets'].join('_');
const LEGACY_STORAGE_USERS_KEY = ['ac', 'manager', 'users'].join('_');
const LEGACY_STORAGE_SESSION_KEY = ['ac', 'manager', 'session'].join('_');
const IVA_RATE = 0.15;
const REST_COUNTRIES_API_KEY = 'rc_live_demo';
const WEATHER_API_KEY = "PEGA_AQUI_TU_API_KEY_REAL";
const EXCHANGE_RATE_API_URL = 'https://open.er-api.com/v6/latest/USD';

const COUNTRY_CATALOG = [
  { es: 'España', en: 'Spain', code: 'ES', currency: 'EUR - Euro', language: 'Español', aliases: ['espana', 'españa', 'spain'], flag: 'https://flagcdn.com/w80/es.png' },
  { es: 'Egipto', en: 'Egypt', code: 'EG', currency: 'EGP - Libra egipcia', language: 'Árabe', aliases: ['egipto', 'egypt', 'egi'], flag: 'https://flagcdn.com/w80/eg.png' },
  { es: 'Ecuador', en: 'Ecuador', code: 'EC', currency: 'USD - Dólar estadounidense', language: 'Español', aliases: ['ecuador'], flag: 'https://flagcdn.com/w80/ec.png' },
  { es: 'Colombia', en: 'Colombia', code: 'CO', currency: 'COP - Peso colombiano', language: 'Español', aliases: ['colombia'], flag: 'https://flagcdn.com/w80/co.png' },
  { es: 'Perú', en: 'Peru', code: 'PE', currency: 'PEN - Sol peruano', language: 'Español', aliases: ['peru', 'perú'], flag: 'https://flagcdn.com/w80/pe.png' },
  { es: 'México', en: 'Mexico', code: 'MX', currency: 'MXN - Peso mexicano', language: 'Español', aliases: ['mexico', 'méxico'], flag: 'https://flagcdn.com/w80/mx.png' },
  { es: 'Estados Unidos', en: 'United States', code: 'US', currency: 'USD - Dólar estadounidense', language: 'Inglés', aliases: ['estados unidos', 'usa', 'united states'], flag: 'https://flagcdn.com/w80/us.png' },
  { es: 'Canadá', en: 'Canada', code: 'CA', currency: 'CAD - Dólar canadiense', language: 'Inglés, Francés', aliases: ['canada', 'canadá'], flag: 'https://flagcdn.com/w80/ca.png' },
  { es: 'Brasil', en: 'Brazil', code: 'BR', currency: 'BRL - Real brasileño', language: 'Portugués', aliases: ['brasil', 'brazil'], flag: 'https://flagcdn.com/w80/br.png' },
  { es: 'Argentina', en: 'Argentina', code: 'AR', currency: 'ARS - Peso argentino', language: 'Español', aliases: ['argentina'], flag: 'https://flagcdn.com/w80/ar.png' },
  { es: 'Chile', en: 'Chile', code: 'CL', currency: 'CLP - Peso chileno', language: 'Español', aliases: ['chile'], flag: 'https://flagcdn.com/w80/cl.png' },
  { es: 'Francia', en: 'France', code: 'FR', currency: 'EUR - Euro', language: 'Francés', aliases: ['francia', 'france'], flag: 'https://flagcdn.com/w80/fr.png' },
  { es: 'Alemania', en: 'Germany', code: 'DE', currency: 'EUR - Euro', language: 'Alemán', aliases: ['alemania', 'germany'], flag: 'https://flagcdn.com/w80/de.png' },
  { es: 'Italia', en: 'Italy', code: 'IT', currency: 'EUR - Euro', language: 'Italiano', aliases: ['italia', 'italy'], flag: 'https://flagcdn.com/w80/it.png' },
  { es: 'Reino Unido', en: 'United Kingdom', code: 'GB', currency: 'GBP - Libra esterlina', language: 'Inglés', aliases: ['reino unido', 'uk', 'united kingdom'], flag: 'https://flagcdn.com/w80/gb.png' },
  { es: 'Portugal', en: 'Portugal', code: 'PT', currency: 'EUR - Euro', language: 'Portugués', aliases: ['portugal'], flag: 'https://flagcdn.com/w80/pt.png' }
];
const CITY_SUGGESTIONS = ['Quito', 'Guayaquil', 'Cuenca', 'Madrid', 'Bogotá', 'Lima'];
const COMMON_CURRENCIES = ['USD', 'EUR', 'COP', 'MXN', 'PEN', 'CLP', 'ARS', 'BRL', 'GBP', 'CAD', 'JPY'];

let budgetList = [];
let authMode = 'login';
let currentCountryInfo = null;
let currentWeatherInfo = null;
let currentExchangeInfo = null;
let latestQuoteTotals = { subtotal: 0, iva: 0, total: 0 };
let exchangeRatesCache = null;
let countrySuggestionTimer = null;

const $ = (id) => document.getElementById(id);

function migrateLegacyStorage() {
  [[LEGACY_STORAGE_SESSION_KEY, STORAGE_SESSION_KEY], [LEGACY_STORAGE_USERS_KEY, STORAGE_USERS_KEY]].forEach(([oldKey, newKey]) => {
    if (!localStorage.getItem(newKey) && localStorage.getItem(oldKey)) localStorage.setItem(newKey, localStorage.getItem(oldKey));
  });
  Object.keys(localStorage).forEach((key) => {
    if (!key.startsWith(`${LEGACY_STORAGE_BUDGETS_KEY}_`)) return;
    const suffix = key.slice(LEGACY_STORAGE_BUDGETS_KEY.length);
    const newKey = `${STORAGE_BUDGETS_KEY}${suffix}`;
    if (!localStorage.getItem(newKey)) localStorage.setItem(newKey, localStorage.getItem(key));
  });
}

migrateLegacyStorage();
let currentUser = localStorage.getItem(STORAGE_SESSION_KEY) || '';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
}
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function normalizeText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
function setText(id, value) { const element = $(id); if (element) element.textContent = value; }
function showToast(message, type = 'info') {
  const container = $('toastContainer');
  if (!container) { console.log(`[${type}] ${message}`); return; }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 20);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 250); }, 3200);
}
function getCurrentFormattedDate() { return new Date().toLocaleString('es-ES'); }

function updateProjectBranding() {
  document.title = 'CotizaAPI Global - Sistema de cotizaciones con integración de 3 APIs';
  document.querySelectorAll('.logo-text h1').forEach((title) => { title.innerHTML = 'CotizaAPI <span>Global</span>'; });
  const texts = {
    landingTagline: 'Sistema de cotizaciones con integración de 3 APIs', calculatorTagline: 'Sistema de cotizaciones con integración de 3 APIs',
    heroBadge: 'Integración de APIs públicas', heroTitle: 'CotizaAPI Global - Sistema de cotizaciones con integración de 3 APIs',
    heroDescription: 'Crea cotizaciones con subtotal, IVA, total, datos de país, clima por ciudad y conversión del total en USD a otras monedas mediante APIs reales.',
    whyTitle: 'Por qué elegir CotizaAPI Global', costPrecisionTitle: 'Cotizaciones claras', costPrecisionDesc: 'Calcula precio, mano de obra, IVA, subtotal y total para productos o servicios.',
    taxCalcTitle: 'IVA automatizado', taxCalcDesc: 'Aplica automáticamente la tasa del IVA del 15% sobre el subtotal.', internalDatabaseTitle: '3 APIs conectadas', internalDatabaseDesc: 'Consulta países, clima y tasas de cambio con fetch, async/await y try/catch.',
    usageGuideTitle: 'Guía rápida de CotizaAPI Global', guideStep1Title: 'Accede al sistema', guideStep1Desc: 'Inicia sesión para crear cotizaciones y mantener tu historial.',
    guideStep2Title: 'Ingresa los valores', guideStep2Desc: 'Escribe cliente, producto o servicio, precio y mano de obra.', guideStep3Title: 'Conecta datos globales', guideStep3Desc: 'Consulta país, clima y convierte el total USD a otra moneda antes de guardar o descargar PDF.',
    featuresHeader: 'Automatiza cotizaciones con integración de APIs', feature1Title: 'Registro instantáneo', feature1Desc: 'Guarda cotizaciones y consulta el historial con un solo clic.', feature2Title: 'Desglose claro', feature2Desc: 'Visualiza subtotal, IVA y total de forma ordenada.', feature3Title: 'PDF de cotización', feature3Desc: 'Descarga cotizaciones con formato profesional para tus clientes.', feature4Title: 'Datos globales', feature4Desc: 'Integra país, clima y conversión monetaria con APIs públicas reales.',
    solutionsHeader: 'Cotizaciones listas para productos y servicios', solutionsDescription: 'CotizaAPI Global centraliza tus cotizaciones y las complementa con información internacional útil.', solutionItem1: 'Ingreso de precio del producto o servicio.', solutionItem2: 'Ingreso de mano de obra y cálculo automático de IVA.', solutionItem3: 'Historial, descarga PDF y datos obtenidos por APIs.',
    benefitsHeader: 'Qué ganas al usar CotizaAPI Global', benefit1Title: 'Más rapidez', benefit1Desc: 'Reduce el tiempo necesario para calcular y guardar una cotización.', benefit2Title: 'Menos errores', benefit2Desc: 'Los cálculos automáticos evitan fallos en impuestos, subtotales y totales.', benefit3Title: 'Mayor confianza', benefit3Desc: 'Presenta cotizaciones profesionales y consistentes a tus clientes.', benefit4Title: 'Más contexto', benefit4Desc: 'Agrega bandera, moneda, idioma, clima y conversión de divisas a tus cotizaciones.',
    quoteFormTitle: 'Nueva Cotización Global', deviceModelLabel: 'Producto / Servicio', deviceInputNote: 'Escribe el producto o servicio que deseas cotizar.', partsCostLabel: 'Precio producto/servicio ($)', btnCalculateText: 'Calcular y Guardar', livePreviewBadge: 'Vista previa en vivo', breakdownTitle: 'Desglose de la Cotización', subtotalLabel: 'Subtotal (Precio + Mano de Obra)', chartTitle: 'Gráfico de la cotización', partsLabel: 'Producto/servicio', historyEmptyText: 'No hay cotizaciones registradas en el historial.', footerLine1: '2026 CotizaAPI Global. Sistema de cotizaciones con integración de 3 APIs.', footerLine2: 'REST Countries | OpenWeather | ExchangeRate API'
  };
  Object.entries(texts).forEach(([id, value]) => setText(id, value));
  document.querySelectorAll('.visual-header').forEach((element) => { element.textContent = 'CotizaAPI Global'; });
}

function injectGlobalApiStyles() {
  if ($('globalApisStyles')) return;
  const style = document.createElement('style');
  style.id = 'globalApisStyles';
  style.textContent = `.global-apis-card{margin-top:1.5rem}.api-grid{display:grid;gap:1rem}.api-tool{position:relative;padding:1rem;border:1px solid rgba(0,198,255,.14);border-radius:var(--radius-md);background:linear-gradient(135deg,rgba(0,242,254,.055),rgba(255,255,255,.025));box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}.api-tool h3{font-size:1rem;margin-bottom:.35rem}.api-tool p{color:var(--text-muted);font-size:.84rem;margin-bottom:.8rem}.api-input-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.65rem;align-items:center;position:relative}.api-input-row input{width:100%;padding:.8rem .95rem;background:var(--bg-input);border:1.5px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;font-size:.9rem}.api-input-row input:focus{outline:none;border-color:rgba(0,242,254,.68);box-shadow:0 0 0 4px rgba(0,242,254,.08)}.btn-api{border:0;border-radius:var(--radius-md);background:var(--cyan-gradient);color:#000;cursor:pointer;font-family:inherit;font-size:.82rem;font-weight:800;padding:.8rem .95rem;white-space:nowrap}.btn-api:hover{filter:brightness(1.06);transform:translateY(-1px)}.api-result{display:grid;gap:.2rem;margin-top:.85rem;padding:.85rem;border-radius:var(--radius-md);background:rgba(255,255,255,.04);color:var(--text-muted);font-size:.84rem;line-height:1.5}.api-result strong,.api-result span{display:block}.api-result-success{border:1px solid rgba(0,198,255,.22);color:var(--text-primary)}.api-result-error{border:1px solid rgba(255,106,0,.34);background:rgba(255,106,0,.08);color:#ffc08a}.api-result-info{border:1px solid rgba(0,198,255,.18);color:var(--text-muted)}.api-result-loading{border:1px solid rgba(0,198,255,.26);color:var(--accent-cyan);position:relative;overflow:hidden}.api-result-loading:after{content:"";height:2px;width:44%;position:absolute;left:-44%;bottom:0;background:var(--cyan-gradient);animation:apiLoading 1.1s ease-in-out infinite}@keyframes apiLoading{to{left:100%}}.country-result{display:grid;grid-template-columns:54px 1fr;gap:.75rem;align-items:center}.country-result img{width:54px;height:36px;object-fit:cover;border-radius:6px;border:1px solid rgba(255,255,255,.16)}.api-suggestions{display:none;position:absolute;z-index:25;left:0;right:0;top:calc(100% + 6px);max-height:230px;overflow:auto;padding:.35rem;border:1px solid rgba(0,198,255,.22);border-radius:var(--radius-md);background:#181818;box-shadow:0 18px 42px rgba(0,0,0,.38)}.api-suggestions.show{display:grid;gap:.25rem}.suggestion-item{display:grid;grid-template-columns:auto 1fr auto;gap:.65rem;align-items:center;width:100%;border:0;border-radius:8px;padding:.58rem .65rem;background:transparent;color:var(--text-primary);font-family:inherit;text-align:left;cursor:pointer}.suggestion-item:hover,.suggestion-item:focus{outline:none;background:rgba(0,242,254,.1)}.suggestion-flag{width:32px;height:22px;object-fit:cover;border-radius:4px;border:1px solid rgba(255,255,255,.12)}.suggestion-code{font-weight:800;color:var(--accent-cyan);font-size:.78rem}.city-chips{display:flex;flex-wrap:wrap;gap:.45rem;margin:.6rem 0 .2rem}.city-chip{border:1px solid rgba(0,198,255,.22);border-radius:999px;background:rgba(0,242,254,.06);color:var(--text-primary);cursor:pointer;font-family:inherit;font-size:.78rem;padding:.38rem .62rem}.city-chip:hover{background:rgba(0,242,254,.14);border-color:rgba(0,242,254,.48)}@media(max-width:520px){.api-input-row{grid-template-columns:1fr}.api-suggestions{top:48px}.btn-api{width:100%}}`;
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
function setApiResult(id, html, type = 'info') { const element = $(id); if (element) { element.className = `api-result api-result-${type}`; element.innerHTML = html; } }
function getLatestTotal() { latestQuoteTotals = calculateAmounts(parseFloat($('partsCost')?.value) || 0, parseFloat($('laborCost')?.value) || 0); return latestQuoteTotals.total; }

function injectGlobalApisPanel() {
  if ($('globalApisCard')) return;
  const formSection = document.querySelector('.section-form');
  if (!formSection) return;
  const card = document.createElement('div');
  card.className = 'card card-form global-apis-card';
  card.id = 'globalApisCard';
  card.innerHTML = `<div class="card-header"><h2>APIs Globales</h2></div><div class="api-grid"><section class="api-tool"><h3>País</h3><p>Consulta bandera, moneda e idioma con REST Countries. Puedes escribir nombres en español o parciales.</p><div class="api-input-row"><input type="text" id="countryInput" placeholder="Ej. España o egi" autocomplete="off"><button type="button" id="btnCountryApi" class="btn-api">Buscar</button><div id="countrySuggestions" class="api-suggestions"></div></div><div id="countryResult" class="api-result api-result-info">Escribe 2 o más letras para ver sugerencias.</div></section><section class="api-tool"><h3>Clima</h3><p>Consulta temperatura, humedad y descripción con OpenWeather.</p><div class="api-input-row"><input type="text" id="weatherCityInput" placeholder="Ej. Quito" autocomplete="off"><button type="button" id="btnWeatherApi" class="btn-api">Ver clima</button><div id="citySuggestions" class="api-suggestions"></div></div><div id="cityChips" class="city-chips"></div><div id="weatherResult" class="api-result api-result-info">Configura WEATHER_API_KEY para consultar el clima.</div></section><section class="api-tool"><h3>Moneda</h3><p>Convierte el total de USD a otra moneda con ExchangeRate API.</p><div class="api-input-row"><input type="text" id="currencyInput" placeholder="EUR, COP, MXN" maxlength="3" autocomplete="off"><button type="button" id="btnExchangeApi" class="btn-api">Convertir</button><div id="currencySuggestions" class="api-suggestions"></div></div><div id="exchangeResult" class="api-result api-result-info">Primero calcula una cotización para convertir el total.</div></section></div>`;
  formSection.appendChild(card);
}

function catalogMatches(query) {
  const normalized = normalizeText(query);
  if (normalized.length < 2) return [];
  return COUNTRY_CATALOG.filter((country) => [country.es, country.en, country.code, ...(country.aliases || [])].map(normalizeText).some((value) => value.includes(normalized)));
}
function mapCountryFromCatalog(country) { return { name: country.es, officialName: country.en, code: country.code, flag: country.flag, currencies: country.currency, languages: country.language }; }
function mapCountryFromApi(country, fallbackName = '') {
  const code = country.codes?.cca2 || country.codes?.cca3 || country.cca2 || '';
  const currencies = Object.entries(country.currencies || {}).map(([codeKey, item]) => `${codeKey} - ${item.name || 'Moneda'}`).join(', ') || 'No disponible';
  const languages = Object.values(country.languages || {}).map((item) => item.name || item).join(', ') || 'No disponible';
  return { name: country.names?.common || country.name?.common || fallbackName, officialName: country.names?.official || country.name?.official || '', code, flag: country.assets?.flag_png || country.assets?.flag_svg || country.flags?.png || country.flags?.svg || '', currencies, languages };
}
async function fetchCountryCandidates(query) {
  try {
    const response = await fetch(`https://api.restcountries.com/countries/v5/name?q=${encodeURIComponent(query)}&api-key=${REST_COUNTRIES_API_KEY}`);
    if (!response.ok) throw new Error('api');
    const data = await response.json();
    const objects = data?.data?.objects || data || [];
    if (!Array.isArray(objects)) return [];
    const normalized = normalizeText(query);
    return objects.map((country) => mapCountryFromApi(country, query)).filter((country) => [country.name, country.officialName, country.code].map(normalizeText).some((value) => value.includes(normalized)));
  } catch { return []; }
}
function renderCountrySuggestions(items) {
  const list = $('countrySuggestions');
  if (!list) return;
  if (!items.length) { list.classList.remove('show'); list.innerHTML = ''; return; }
  list.innerHTML = items.slice(0, 8).map((country) => `<button type="button" class="suggestion-item" data-country="${escapeHTML(country.name)}"><img class="suggestion-flag" src="${escapeHTML(country.flag)}" alt=""><span>${escapeHTML(country.name)}</span><span class="suggestion-code">${escapeHTML(country.code)}</span></button>`).join('');
  list.classList.add('show');
  list.querySelectorAll('.suggestion-item').forEach((button) => button.addEventListener('click', () => selectCountrySuggestion(button.dataset.country || '')));
}
function hideSuggestions(id) { const list = $(id); if (list) list.classList.remove('show'); }
async function updateCountryAutocomplete() {
  const query = ($('countryInput')?.value || '').trim();
  if (query.length < 2) return renderCountrySuggestions([]);
  const local = catalogMatches(query).map(mapCountryFromCatalog);
  renderCountrySuggestions(local);
  const remote = await fetchCountryCandidates(query);
  const merged = [...local];
  remote.forEach((country) => { if (!merged.some((item) => item.code && item.code === country.code)) merged.push(country); });
  renderCountrySuggestions(merged);
}
async function selectCountrySuggestion(countryName) { const input = $('countryInput'); if (input) input.value = countryName; hideSuggestions('countrySuggestions'); await fetchCountryInfo(); }
function renderCountryInfo(info) {
  currentCountryInfo = info;
  const flagMarkup = info.flag ? `<img src="${escapeHTML(info.flag)}" alt="Bandera de ${escapeHTML(info.name)}">` : '';
  setApiResult('countryResult', `<div class="country-result">${flagMarkup}<div><strong>${escapeHTML(info.name)} ${info.code ? `(${escapeHTML(info.code)})` : ''}</strong><span>Moneda: ${escapeHTML(info.currencies)}</span><span>Idioma: ${escapeHTML(info.languages)}</span></div></div>`, 'success');
}
async function fetchCountryInfo() {
  const query = ($('countryInput')?.value || '').trim();
  if (!query) return showToast('Escribe un país para consultar.', 'error');
  setApiResult('countryResult', 'Consultando país...', 'loading');
  try {
    const localExact = catalogMatches(query).find((country) => [country.es, country.en, country.code, ...(country.aliases || [])].map(normalizeText).includes(normalizeText(query)));
    const localMatch = localExact || catalogMatches(query)[0];
    if (localMatch) { renderCountryInfo(mapCountryFromCatalog(localMatch)); showToast('Datos del país cargados.', 'success'); return; }
    const remote = await fetchCountryCandidates(query);
    if (remote.length) { renderCountryInfo(remote[0]); showToast('Datos del país cargados.', 'success'); return; }
    currentCountryInfo = null;
    setApiResult('countryResult', 'No se encontró ese país. Prueba con otro nombre.', 'error');
  } catch {
    currentCountryInfo = null;
    setApiResult('countryResult', 'No se pudo conectar con la API. Revisa tu internet o intenta con otro nombre.', 'error');
  }
}

function renderCityChips() {
  const container = $('cityChips');
  if (!container) return;
  container.innerHTML = CITY_SUGGESTIONS.map((city) => `<button type="button" class="city-chip" data-city="${escapeHTML(city)}">${escapeHTML(city)}</button>`).join('');
  container.querySelectorAll('.city-chip').forEach((button) => button.addEventListener('click', () => { const input = $('weatherCityInput'); if (input) input.value = button.dataset.city || ''; hideSuggestions('citySuggestions'); }));
}
function renderCitySuggestions() {
  const query = normalizeText($('weatherCityInput')?.value || '');
  const list = $('citySuggestions');
  if (!list || query.length < 2) return hideSuggestions('citySuggestions');
  const matches = CITY_SUGGESTIONS.filter((city) => normalizeText(city).includes(query));
  if (!matches.length) return hideSuggestions('citySuggestions');
  list.innerHTML = matches.map((city) => `<button type="button" class="suggestion-item" data-city="${escapeHTML(city)}"><span></span><span>${escapeHTML(city)}</span><span class="suggestion-code">CIUDAD</span></button>`).join('');
  list.classList.add('show');
  list.querySelectorAll('.suggestion-item').forEach((button) => button.addEventListener('click', () => { const input = $('weatherCityInput'); if (input) input.value = button.dataset.city || ''; hideSuggestions('citySuggestions'); }));
}
async function fetchWeatherInfo() {
  const city = ($('weatherCityInput')?.value || '').trim();
  if (!city) return showToast('Escribe una ciudad para consultar el clima.', 'error');
  if (!WEATHER_API_KEY || WEATHER_API_KEY === 'PEGA_AQUI_TU_API_KEY_REAL') {
    setApiResult('weatherResult', 'Configura WEATHER_API_KEY para consultar el clima.', 'info');
    showToast('Configura WEATHER_API_KEY para consultar el clima.', 'info');
    return;
  }
  setApiResult('weatherResult', 'Consultando clima...', 'loading');
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${WEATHER_API_KEY}&units=metric&lang=es`);
    if (!response.ok) throw new Error('No se pudo conectar con la API. Revisa tu internet o intenta con otro nombre.');
    const data = await response.json();
    currentWeatherInfo = { city: data.name || city, temperature: Math.round(data.main?.temp ?? 0), humidity: data.main?.humidity ?? 0, description: data.weather?.[0]?.description || 'No disponible' };
    setApiResult('weatherResult', `<strong>${escapeHTML(currentWeatherInfo.city)}</strong><span>Temperatura: ${currentWeatherInfo.temperature} C</span><span>Humedad: ${currentWeatherInfo.humidity}%</span><span>Descripción: ${escapeHTML(currentWeatherInfo.description)}</span>`, 'success');
  } catch (error) {
    currentWeatherInfo = null;
    setApiResult('weatherResult', escapeHTML(error.message || 'No se pudo conectar con la API. Revisa tu internet o intenta con otro nombre.'), 'error');
  }
}

function renderCurrencySuggestions() {
  const input = $('currencyInput');
  const list = $('currencySuggestions');
  if (!input || !list) return;
  input.value = input.value.toUpperCase();
  const query = normalizeText(input.value);
  if (!query.length) return hideSuggestions('currencySuggestions');
  const matches = COMMON_CURRENCIES.filter((code) => code.toLowerCase().includes(query)).slice(0, 8);
  if (!matches.length) return hideSuggestions('currencySuggestions');
  list.innerHTML = matches.map((code) => `<button type="button" class="suggestion-item" data-currency="${code}"><span></span><span>${code}</span><span class="suggestion-code">MONEDA</span></button>`).join('');
  list.classList.add('show');
  list.querySelectorAll('.suggestion-item').forEach((button) => button.addEventListener('click', () => { input.value = (button.dataset.currency || '').toUpperCase(); hideSuggestions('currencySuggestions'); }));
}
async function getExchangeRates() {
  if (exchangeRatesCache?.rates) return exchangeRatesCache.rates;
  const response = await fetch(EXCHANGE_RATE_API_URL);
  if (!response.ok) throw new Error('No se pudo conectar con la API. Revisa tu internet o intenta con otro nombre.');
  const data = await response.json();
  exchangeRatesCache = data;
  return data?.rates || {};
}
async function convertTotalCurrency() {
  const input = $('currencyInput');
  const currency = (input?.value || '').trim().toUpperCase();
  if (input) input.value = currency;
  if (!currency || currency.length !== 3) return showToast('Escribe un código de moneda de 3 letras, por ejemplo EUR.', 'error');
  const total = getLatestTotal();
  if (!total) { setApiResult('exchangeResult', 'Primero calcula una cotización para convertir el total.', 'info'); return showToast('Primero calcula una cotización para convertir el total.', 'info'); }
  setApiResult('exchangeResult', 'Consultando tasa de cambio...', 'loading');
  try {
    const rates = await getExchangeRates();
    const rate = rates?.[currency];
    if (!rate) throw new Error(`No se encontró tasa para ${currency}.`);
    const convertedTotal = +(total * rate).toFixed(2);
    currentExchangeInfo = { base: 'USD', currency, rate, totalUSD: total, convertedTotal };
    setApiResult('exchangeResult', `<strong>${formatCurrency(total)} USD = ${convertedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}</strong><span>Tasa usada: 1 USD = ${rate} ${currency}</span>`, 'success');
  } catch (error) {
    currentExchangeInfo = null;
    setApiResult('exchangeResult', escapeHTML(error.message || 'No se pudo conectar con la API. Revisa tu internet o intenta con otro nombre.'), 'error');
  }
}

function bindGlobalApiEvents() {
  $('btnCountryApi')?.addEventListener('click', fetchCountryInfo);
  $('countryInput')?.addEventListener('input', () => { clearTimeout(countrySuggestionTimer); countrySuggestionTimer = setTimeout(updateCountryAutocomplete, 180); });
  $('btnWeatherApi')?.addEventListener('click', fetchWeatherInfo);
  $('weatherCityInput')?.addEventListener('input', renderCitySuggestions);
  $('btnExchangeApi')?.addEventListener('click', convertTotalCurrency);
  $('currencyInput')?.addEventListener('input', renderCurrencySuggestions);
  renderCityChips();
  document.addEventListener('click', (event) => { if (!event.target.closest?.('.api-tool')) ['countrySuggestions', 'citySuggestions', 'currencySuggestions'].forEach(hideSuggestions); });
}

function navigateTo(sectionId) {
  ['landingSection', 'authSection', 'calculatorSection'].forEach((id) => { const section = $(id); if (section) section.classList.toggle('hidden', id !== sectionId); });
}
function getBudgetStorageKey() { return currentUser ? `${STORAGE_BUDGETS_KEY}_${currentUser.toLowerCase()}` : `${STORAGE_BUDGETS_KEY}_guest`; }
function loadLocalMirror() { try { budgetList = JSON.parse(localStorage.getItem(getBudgetStorageKey()) || '[]'); } catch { budgetList = []; } }
function saveLocalMirror() { localStorage.setItem(getBudgetStorageKey(), JSON.stringify(budgetList)); }
function getUsers() { try { return JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '[]'); } catch { return []; } }
function saveUsers(users) { localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users)); }
function setAuthMode(mode) {
  authMode = mode === 'register' ? 'register' : 'login';
  $('tabLogin')?.classList.toggle('active', authMode === 'login');
  $('tabRegister')?.classList.toggle('active', authMode === 'register');
  $('confirmPasswordGroup')?.classList.toggle('hidden', authMode === 'login');
  $('btnForgotPassword')?.classList.toggle('hidden', authMode === 'register');
  setText('authTitle', authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta');
  setText('authSubtitle', authMode === 'login' ? 'Accede para crear y guardar tus cotizaciones.' : 'Registra una cuenta para usar el sistema.');
  setText('btnAuthSubmitText', authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta');
}
function handleSuccessfulLogin(email) {
  currentUser = email;
  localStorage.setItem(STORAGE_SESSION_KEY, email);
  loadLocalMirror();
  if ($('email')) $('email').value = email;
  setText('dbStatusLabel', '3 APIs + Local');
  $('authForm')?.reset();
  navigateTo('calculatorSection');
  renderHistory();
  showToast(`Bienvenido: ${email}`, 'success');
}
function handleAuthSubmit(event) {
  event.preventDefault();
  const email = ($('authEmail')?.value || '').trim().toLowerCase();
  const password = $('authPassword')?.value || '';
  const confirmPassword = $('authConfirmPassword')?.value || '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showToast('Escribe un correo válido.', 'error');
  if (password.length < 6) return showToast('La contraseña debe tener mínimo 6 caracteres.', 'error');
  const users = getUsers();
  if (authMode === 'register') {
    if (password !== confirmPassword) return showToast('Las contraseñas no coinciden.', 'error');
    if (users.some((user) => user.email === email)) { setAuthMode('login'); return showToast('Ese correo ya está registrado. Inicia sesión.', 'error'); }
    users.push({ email, password });
    saveUsers(users);
    setAuthMode('login');
    if ($('authEmail')) $('authEmail').value = email;
    if ($('authPassword')) $('authPassword').value = '';
    if ($('authConfirmPassword')) $('authConfirmPassword').value = '';
    return showToast('Cuenta creada. Ahora inicia sesión.', 'success');
  }
  const user = users.find((item) => item.email === email && item.password === password);
  if (!user) return showToast('Correo o contraseña incorrectos. Si no tienes cuenta, regístrate.', 'error');
  handleSuccessfulLogin(email);
}
async function insertToSupabase(payload) {
  try {
    const { data, error } = await supabase.from('presupuestos').insert([payload]).select();
    if (error) throw error;
    return { success: true, row: data?.[0] || null };
  } catch (error) { console.error('Error al guardar en Supabase:', error); return { success: false, error }; }
}
function renderHistory(filter = '') {
  const bodyHistory = $('bodyHistory');
  if (!bodyHistory) return;
  const q = filter.toLowerCase().trim();
  const items = budgetList.filter((item) => String(item.id).includes(q) || String(item.clientName || '').toLowerCase().includes(q) || String(item.deviceModel || '').toLowerCase().includes(q));
  setText('recordsBadge', `${budgetList.length} Cotizaciones`);
  if ($('btnClearHistory')) $('btnClearHistory').disabled = budgetList.length === 0;
  if (!items.length) { bodyHistory.innerHTML = '<tr><td colspan="6">No hay cotizaciones registradas.</td></tr>'; return; }
  bodyHistory.innerHTML = '';
  items.slice().reverse().forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>#${items.length - index}</td><td>${escapeHTML(item.clientName)}</td><td>${escapeHTML(item.deviceModel)}</td><td>${formatCurrency(item.total)}</td><td>${escapeHTML(item.date)}</td><td class="action-buttons"><button type="button" class="btn-delete icon-btn" data-id="${escapeHTML(item.id)}" title="Borrar cotización">X</button><button type="button" class="btn-pdf icon-btn" data-id="${escapeHTML(item.id)}" title="Descargar PDF">PDF</button></td>`;
    bodyHistory.appendChild(tr);
  });
  bodyHistory.querySelectorAll('.btn-delete').forEach((btn) => btn.addEventListener('click', () => { budgetList = budgetList.filter((item) => String(item.id) !== String(btn.dataset.id)); saveLocalMirror(); renderHistory($('searchHistory')?.value || ''); showToast('Registro eliminado.', 'success'); }));
  bodyHistory.querySelectorAll('.btn-pdf').forEach((btn) => btn.addEventListener('click', () => { const item = budgetList.find((budget) => String(budget.id) === String(btn.dataset.id)); if (item) generatePDF(item); }));
}
function updatePreviewDisplay() {
  const parts = parseFloat($('partsCost')?.value) || 0;
  const labor = parseFloat($('laborCost')?.value) || 0;
  const { subtotal, iva, total } = calculateAmounts(parts, labor);
  latestQuoteTotals = { subtotal, iva, total };
  setText('lblSubtotal', formatCurrency(subtotal));
  setText('lblIva', formatCurrency(iva));
  setText('lblTotal', formatCurrency(total));
  const base = total || 1;
  const partPct = total ? Math.round((parts / base) * 100) : 0;
  const laborPct = total ? Math.round((labor / base) * 100) : 0;
  const ivaPct = total ? Math.round((iva / base) * 100) : 0;
  if ($('barParts')) $('barParts').style.width = `${partPct}%`;
  if ($('barLabor')) $('barLabor').style.width = `${laborPct}%`;
  if ($('barIva')) $('barIva').style.width = `${ivaPct}%`;
  setText('partsPercent', `${partPct}%`);
  setText('laborPercent', `${laborPct}%`);
  setText('ivaPercent', `${ivaPct}%`);
}
async function handleBudgetFormSubmit(event) {
  event.preventDefault();
  const clientName = ($('clientName')?.value || '').trim();
  const deviceModel = ($('deviceModel')?.value || '').trim();
  const partsCost = parseFloat($('partsCost')?.value) || 0;
  const laborCost = parseFloat($('laborCost')?.value) || 0;
  const email = currentUser || $('email')?.value || 'sin-correo@local.com';
  if (!clientName || !deviceModel) return showToast('Completa cliente y producto o servicio.', 'error');
  const { subtotal, iva, total } = calculateAmounts(partsCost, laborCost);
  const payload = { cliente: clientName, dispositivo: deviceModel, repuestos: partsCost, mano_obra: laborCost, iva, total, email, fecha_creacion: new Date().toISOString() };
  const result = await insertToSupabase(payload);
  const row = result.row || {};
  const record = { id: row.id || Date.now(), clientName: row.cliente || clientName, deviceModel: row.dispositivo || deviceModel, partsCost: row.repuestos ?? partsCost, laborCost: row.mano_obra ?? laborCost, subtotal, iva: row.iva ?? iva, total: row.total ?? total, countryInfo: currentCountryInfo, weatherInfo: currentWeatherInfo, exchangeInfo: currentExchangeInfo, email: row.email || email, date: row.fecha_creacion ? new Date(row.fecha_creacion).toLocaleString('es-ES') : getCurrentFormattedDate() };
  budgetList.push(record);
  saveLocalMirror();
  renderHistory($('searchHistory')?.value || '');
  $('budgetForm')?.reset();
  if ($('email') && currentUser) $('email').value = currentUser;
  updatePreviewDisplay();
  showToast('Cotización guardada correctamente.', 'success');
}
function drawPdfLogo(doc) {
  doc.setFillColor(0, 94, 170);
  doc.roundedRect(14, 10, 26, 18, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('API', 27, 22, { align: 'center' });
}
function apiText(value) { return value || 'No consultado'; }
function splitPdfText(doc, text, maxWidth) { return doc.splitTextToSize(String(text), maxWidth); }
async function generatePDF(item) {
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) return showToast('No se pudo cargar jsPDF.', 'error');
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(10, 18, 32); doc.rect(0, 0, pageWidth, 42, 'F'); drawPdfLogo(doc);
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.text('CotizaAPI Global', 46, 19);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text('Sistema de cotizaciones con integración de 3 APIs', 46, 27);
  doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text('Datos de cotización', 18, 54); doc.setDrawColor(0, 198, 255); doc.line(18, 58, 78, 58);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.text(`Cliente: ${apiText(item.clientName)}`, 18, 70); doc.text(`Producto / Servicio: ${apiText(item.deviceModel)}`, 18, 80); doc.text(`Usuario: ${apiText(item.email || currentUser)}`, 18, 90); doc.text(`Fecha: ${apiText(item.date)}`, 18, 100);
  doc.setFillColor(241, 245, 249); doc.roundedRect(122, 54, 68, 46, 4, 4, 'F'); doc.setTextColor(51, 65, 85); doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('TOTAL A PAGAR', 156, 66, { align: 'center' }); doc.setTextColor(0, 94, 170); doc.setFontSize(19); doc.text(formatCurrency(item.total), 156, 82, { align: 'center' }); doc.setTextColor(100, 116, 139); doc.setFontSize(8.5); doc.text('IVA 15% incluido', 156, 92, { align: 'center' });
  let y = 118;
  doc.setFillColor(15, 23, 42); doc.roundedRect(18, y, 174, 12, 3, 3, 'F'); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('Descripción', 25, y + 8); doc.text('Valor', 183, y + 8, { align: 'right' }); y += 24;
  [['Producto / servicio', item.partsCost], ['Mano de obra', item.laborCost], ['Subtotal', item.subtotal], ['IVA 15%', item.iva], ['Total', item.total]].forEach((row, index) => { if (index % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(18, y - 8, 174, 12, 'F'); } doc.setTextColor(30, 41, 59); doc.setFont('helvetica', index >= 2 ? 'bold' : 'normal'); doc.setFontSize(10.5); doc.text(row[0], 25, y); doc.text(formatCurrency(row[1]), 183, y, { align: 'right' }); y += 13; });
  y += 8; doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Datos de APIs integradas', 18, y); y += 10; doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(51, 65, 85);
  const countryText = item.countryInfo ? `REST Countries: País ${item.countryInfo.name}. Moneda: ${item.countryInfo.currencies}. Idioma: ${item.countryInfo.languages}.` : 'REST Countries: No consultado.';
  const weatherText = item.weatherInfo ? `OpenWeather: Clima en ${item.weatherInfo.city}. Temperatura: ${item.weatherInfo.temperature} C. Humedad: ${item.weatherInfo.humidity}%. Descripción: ${item.weatherInfo.description}.` : 'OpenWeather: No consultado.';
  const exchangeText = item.exchangeInfo ? `ExchangeRate: ${formatCurrency(item.exchangeInfo.totalUSD)} USD = ${item.exchangeInfo.convertedTotal} ${item.exchangeInfo.currency}. Tasa: 1 USD = ${item.exchangeInfo.rate} ${item.exchangeInfo.currency}.` : 'ExchangeRate: No consultado.';
  [countryText, weatherText, exchangeText].forEach((text) => { const lines = splitPdfText(doc, text, 166); doc.text(lines, 25, y); y += lines.length * 5 + 5; });
  if (y > pageHeight - 42) { doc.addPage(); y = 24; }
  doc.setFillColor(0, 94, 170); doc.roundedRect(112, y, 80, 18, 4, 4, 'F'); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Total general', 119, y + 12); doc.text(formatCurrency(item.total), 185, y + 12, { align: 'right' });
  doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setDrawColor(226, 232, 240); doc.line(18, pageHeight - 32, 192, pageHeight - 32); doc.text('CotizaAPI Global - Sistema de cotizaciones con integración de 3 APIs.', 18, pageHeight - 24); doc.text('REST Countries | OpenWeather | ExchangeRate API', 18, pageHeight - 17); doc.save(`cotizacion-${item.id}.pdf`);
}

function init() {
  updateProjectBranding(); injectGlobalApiStyles(); injectGlobalApisPanel(); loadLocalMirror(); bindGlobalApiEvents(); setAuthMode('login');
  if (currentUser && $('email')) $('email').value = currentUser;
  setText('dbStatusLabel', '3 APIs + Local');
  navigateTo('landingSection');
  $('btnEnterApp')?.addEventListener('click', (event) => { event.preventDefault(); navigateTo('authSection'); });
  $('btnBackToLanding')?.addEventListener('click', (event) => { event.preventDefault(); navigateTo('landingSection'); });
  $('btnLogout')?.addEventListener('click', (event) => { event.preventDefault(); currentUser = ''; budgetList = []; localStorage.removeItem(STORAGE_SESSION_KEY); renderHistory(); navigateTo('landingSection'); showToast('Sesión cerrada.', 'success'); });
  $('tabLogin')?.addEventListener('click', () => setAuthMode('login'));
  $('tabRegister')?.addEventListener('click', () => setAuthMode('register'));
  $('authForm')?.addEventListener('submit', handleAuthSubmit);
  $('btnForgotPassword')?.addEventListener('click', () => showToast('En esta versión local debes crear una cuenta nueva o revisar tus datos guardados.', 'info'));
  $('budgetForm')?.addEventListener('submit', handleBudgetFormSubmit);
  $('searchHistory')?.addEventListener('input', (event) => renderHistory(event.target.value));
  $('btnClearHistory')?.addEventListener('click', () => { if (!budgetList.length) return; if (!confirm('¿Seguro que quieres limpiar todo el historial?')) return; budgetList = []; saveLocalMirror(); renderHistory(); showToast('Historial limpiado.', 'success'); });
  $('partsCost')?.addEventListener('input', updatePreviewDisplay);
  $('laborCost')?.addEventListener('input', updatePreviewDisplay);
  renderHistory(); updatePreviewDisplay(); console.log('CotizaAPI Global iniciado correctamente.');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
