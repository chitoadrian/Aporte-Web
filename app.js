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
  es: {
    selectedLanguage: 'Español',
    btnEnterAppText: 'Comenzar ahora',
    landingTagline: 'Herramientas Profesionales de Gestión',
    navFeatures: 'Funciones',
    navSolutions: 'Soluciones',
    navBenefits: 'Beneficios',
    heroBadge: 'Solución Técnica Profesional',
    heroTitle: 'Gestiona cotizaciones con precisión y diseño corporativo',
    heroDescription: 'AC Manager es una herramienta pensada para talleres técnicos que necesitan cotizar servicios, controlar costos de repuestos y mantener un historial ordenado y fácil de consultar.',
    whyTitle: '¿Por qué elegir AC Manager?',
    costPrecisionTitle: 'Precisión de Costos',
    costPrecisionDesc: 'Suma automáticamente los repuestos y mano de obra para evitar errores manuales de cálculo.',
    taxCalcTitle: 'Cálculo de Impuestos',
    taxCalcDesc: 'Aplica instantáneamente la tasa del IVA del 15% sobre el subtotal de los servicios.',
    internalDatabaseTitle: 'Base de Datos Interna',
    internalDatabaseDesc: 'Guarda y persiste los registros del historial mediante el uso inteligente de localStorage.',
    usageGuideTitle: 'Guía de Uso Rápido',
    guideStep1Title: 'Accede de forma segura',
    guideStep1Desc: 'Inicia sesión para ingresar al panel exclusivo de técnicos y trabajar con datos protegidos.',
    guideStep2Title: 'Ingresa los Datos',
    guideStep2Desc: 'Escribe el nombre del cliente, dispositivo y costos del servicio técnico.',
    guideStep3Title: 'Guarda e Historial',
    guideStep3Desc: 'Visualiza el desglose en tiempo real y guarda la cotización en el historial persistente.',
    featuresLabel: 'Funciones',
    featuresHeader: 'Automatiza cada paso de tu flujo de trabajo',
    feature1Title: 'Registro instantáneo',
    feature1Desc: 'Guarda presupuestos y consulta el historial con un solo clic.',
    feature2Title: 'Desglose claro',
    feature2Desc: 'Visualiza subtotal, IVA y total de forma ordenada.',
    feature3Title: 'Reportes rápidos',
    feature3Desc: 'Genera cotizaciones con formato profesional para tus clientes.',
    feature4Title: 'Control de acceso',
    feature4Desc: 'La sesión y el historial quedan vinculados al técnico que ingresa.',
    solutionsLabel: 'Soluciones',
    solutionsHeader: 'Resuelve problemas reales de tu taller',
    solutionsDescription: 'AC Manager centraliza tus presupuestos, evita cálculos manuales y reduce tiempos de respuesta al cliente.',
    solutionItem1: 'Control de inventario básico y costos de repuestos.',
    solutionItem2: 'Historial accesible para cada presupuesto guardado.',
    solutionItem3: 'Interfaz clara para técnicos y gerentes.',
    benefitsLabel: 'Beneficios',
    benefitsHeader: 'Qué ganas al usar AC Manager'
  },

  en: {
    selectedLanguage: 'English',
    btnEnterAppText: 'Get Started',
    landingTagline: 'Professional Management Tools',
    navFeatures: 'Features',
    navSolutions: 'Solutions',
    navBenefits: 'Benefits',
    heroBadge: 'Professional Technical Solution',
    heroTitle: 'Manage quotes with accuracy and corporate design',
    heroDescription: 'AC Manager is a tool designed for technical workshops that need to quote services, control spare-part costs, and keep an organized history.',
    whyTitle: 'Why choose AC Manager?',
    costPrecisionTitle: 'Cost Accuracy',
    costPrecisionDesc: 'Automatically adds spare parts and labor costs to avoid manual calculation mistakes.',
    taxCalcTitle: 'Tax Calculation',
    taxCalcDesc: 'Instantly applies the 15% VAT rate to the service subtotal.',
    internalDatabaseTitle: 'Internal Database',
    internalDatabaseDesc: 'Saves and keeps the quote history using localStorage.',
    usageGuideTitle: 'Quick Use Guide',
    guideStep1Title: 'Access securely',
    guideStep1Desc: 'Log in to enter the technician panel and work with protected data.',
    guideStep2Title: 'Enter the Data',
    guideStep2Desc: 'Enter the customer name, device, and technical service costs.',
    guideStep3Title: 'Save and History',
    guideStep3Desc: 'View the breakdown in real time and save the quote in the history.',
    featuresLabel: 'Features',
    featuresHeader: 'Automate every step of your workflow',
    feature1Title: 'Instant Record',
    feature1Desc: 'Save quotes and check the history with one click.',
    feature2Title: 'Clear Breakdown',
    feature2Desc: 'View subtotal, VAT, and total in an organized way.',
    feature3Title: 'Quick Reports',
    feature3Desc: 'Generate professional quotes for your clients.',
    feature4Title: 'Access Control',
    feature4Desc: 'The session and history are linked to the technician who logs in.',
    solutionsLabel: 'Solutions',
    solutionsHeader: 'Solve real problems in your workshop',
    solutionsDescription: 'AC Manager centralizes your quotes, avoids manual calculations, and reduces customer response time.',
    solutionItem1: 'Basic inventory control and spare-part costs.',
    solutionItem2: 'Accessible history for every saved quote.',
    solutionItem3: 'Clear interface for technicians and managers.',
    benefitsLabel: 'Benefits',
    benefitsHeader: 'What you gain by using AC Manager'
  },

  pt: {
    selectedLanguage: 'Português',
    btnEnterAppText: 'Começar agora',
    landingTagline: 'Ferramentas Profissionais de Gestão',
    navFeatures: 'Funções',
    navSolutions: 'Soluções',
    navBenefits: 'Benefícios',
    heroBadge: 'Solução Técnica Profissional',
    heroTitle: 'Gerencie orçamentos com precisão e design corporativo',
    heroDescription: 'AC Manager é uma ferramenta criada para oficinas técnicas que precisam fazer orçamentos, controlar custos de peças e manter um histórico organizado.',
    whyTitle: 'Por que escolher o AC Manager?',
    costPrecisionTitle: 'Precisão de Custos',
    costPrecisionDesc: 'Soma automaticamente peças e mão de obra para evitar erros de cálculo manual.',
    taxCalcTitle: 'Cálculo de Impostos',
    taxCalcDesc: 'Aplica instantaneamente a taxa de IVA de 15% sobre o subtotal dos serviços.',
    internalDatabaseTitle: 'Banco de Dados Interno',
    internalDatabaseDesc: 'Salva e mantém o histórico usando localStorage.',
    usageGuideTitle: 'Guia Rápido de Uso',
    guideStep1Title: 'Acesse com segurança',
    guideStep1Desc: 'Faça login para entrar no painel de técnicos e trabalhar com dados protegidos.',
    guideStep2Title: 'Insira os Dados',
    guideStep2Desc: 'Digite o nome do cliente, equipamento e custos do serviço técnico.',
    guideStep3Title: 'Salve e veja o histórico',
    guideStep3Desc: 'Veja o detalhamento em tempo real e salve o orçamento no histórico.',
    featuresLabel: 'Funções',
    featuresHeader: 'Automatize cada etapa do seu fluxo de trabalho',
    feature1Title: 'Registro instantâneo',
    feature1Desc: 'Salve orçamentos e consulte o histórico com um clique.',
    feature2Title: 'Detalhamento claro',
    feature2Desc: 'Veja subtotal, IVA e total de forma organizada.',
    feature3Title: 'Relatórios rápidos',
    feature3Desc: 'Gere orçamentos profissionais para seus clientes.',
    feature4Title: 'Controle de acesso',
    feature4Desc: 'A sessão e o histórico ficam ligados ao técnico que entra.',
    solutionsLabel: 'Soluções',
    solutionsHeader: 'Resolva problemas reais da sua oficina',
    solutionsDescription: 'AC Manager centraliza seus orçamentos, evita cálculos manuais e reduz o tempo de resposta ao cliente.',
    solutionItem1: 'Controle básico de estoque e custos de peças.',
    solutionItem2: 'Histórico acessível para cada orçamento salvo.',
    solutionItem3: 'Interface clara para técnicos e gerentes.',
    benefitsLabel: 'Benefícios',
    benefitsHeader: 'O que você ganha ao usar AC Manager'
  }
};

function updateLanguageDisplay() {
  const data = translations[currentLanguage] || translations.es;

  if (selectedLanguageSpan) selectedLanguageSpan.textContent = data.selectedLanguage;

  const btnText = $('btnEnterAppText');
  if (btnText) btnText.textContent = data.btnEnterAppText;

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n;
    if (data[key]) {
      element.textContent = data[key];
    }
  });

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

  showToast('Cotización guardada correctamente.', 'success');
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
  doc.text('A', 22, 25, { align: 'center' });

  doc.setTextColor(130, 235, 255);
  doc.setFontSize(8);
  doc.text('A', 22, 19.5, { align: 'center' });
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
  doc.text('Datos del cliente', 18, 58);
  doc.setDrawColor(0, 198, 255);
  doc.line(18, 62, 86, 62);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Nombre: ${item.clientName}`, 18, 74);
  doc.text(`Equipo / Producto: ${item.deviceModel}`, 18, 84);
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
    ['Repuestos / productos', item.partsCost],
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
  doc.text('Cotización generada automáticamente por AC Manager.', 18, pageHeight - 24);
  doc.text('Gracias por confiar en nuestro servicio técnico.', 18, pageHeight - 17);

  doc.save(`cotizacion-${item.id}.pdf`);
}

function init() {
  loadLocalMirror();
  updateLanguageDisplay();
  setAuthMode('login');

  if (currentUser && inputEmail) inputEmail.value = currentUser;
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
  console.log('AC Manager iniciado correctamente.');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
