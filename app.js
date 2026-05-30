// ============================================================
// AC MANAGER - VERSIÓN FINAL LIMPIA Y FUNCIONAL
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ========== CONFIGURACIÓN SUPABASE ==========
const SUPABASE_URL = "https://qvnbvfwcodjtqhbczxar.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__qQmLTITfpuVePH67M2dCw_CF8kmosN";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== ESTADO GLOBAL ==========
let budgetList = [];
let currentLanguage = localStorage.getItem('selectedLanguage') || 'es';

// ========== TRADUCCIONES ==========
const translations = {
    es: {
        selectedLanguage: 'Español',
        btnEnterAppText: 'Comenzar ahora'
    },
    en: {
        selectedLanguage: 'English',
        btnEnterAppText: 'Get Started'
    },
    pt: {
        selectedLanguage: 'Português',
        btnEnterAppText: 'Começar agora'
    }
};

// ========== SELECTORES DEL DOM ==========
const landingSection = document.getElementById('landingSection');
const authSection = document.getElementById('authSection');
const calculatorSection = document.getElementById('calculatorSection');
const btnEnterApp = document.getElementById('btnEnterApp');
const btnBackToLanding = document.getElementById('btnBackToLanding');
const btnLogout = document.getElementById('btnLogout');
const languageToggle = document.getElementById('languageToggle');
const languageOptions = document.getElementById('languageOptions');
const selectedLanguageSpan = document.getElementById('selectedLanguage');

// Formulario
const budgetForm = document.getElementById('budgetForm');
const inputClientName = document.getElementById('clientName');
const inputDeviceModel = document.getElementById('deviceModel');
const inputPartsCost = document.getElementById('partsCost');
const inputLaborCost = document.getElementById('laborCost');
const inputEmail = document.getElementById('email');
const bodyHistory = document.getElementById('bodyHistory');
const searchHistory = document.getElementById('searchHistory');
const recordsBadge = document.getElementById('recordsBadge');
const btnClearHistory = document.getElementById('btnClearHistory');
const lblSubtotal = document.getElementById('lblSubtotal');
const lblIva = document.getElementById('lblIva');
const lblTotal = document.getElementById('lblTotal');

// ========== FUNCIONES UTILITARIAS ==========
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function getCurrentFormattedDate() {
    return new Date().toLocaleString('es-ES');
}

function showToast(msg, type = 'info') {
    console.log(`[${type.toUpperCase()}]`, msg);
}

function escapeHTML(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

function calculateAmounts(parts, labor) {
    const p = Number(parts) || 0;
    const l = Number(labor) || 0;
    const subtotal = +(p + l).toFixed(2);
    const iva = +((subtotal * 0.15)).toFixed(2);
    const total = +(subtotal + iva).toFixed(2);
    return { subtotal, iva, total };
}

// ========== GESTIÓN DE NAVEGACIÓN ==========
function navigateTo(sectionId) {
    [landingSection, authSection, calculatorSection].forEach(s => {
        if (!s) return;
        if (s.id === sectionId) {
            s.classList.remove('hidden');
        } else {
            s.classList.add('hidden');
        }
    });
}

// ========== GESTIÓN DE IDIOMA ==========
function updateLanguageDisplay() {
    if (selectedLanguageSpan) {
        selectedLanguageSpan.textContent = translations[currentLanguage]?.selectedLanguage || 'Español';
    }
    
    // Actualizar botones de idioma
    document.querySelectorAll('.language-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-lang') === currentLanguage) {
            btn.classList.add('active');
        }
    });
}

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('selectedLanguage', lang);
    updateLanguageDisplay();
    showToast(`Idioma cambiado a: ${translations[lang]?.selectedLanguage}`, 'info');
}

// ========== GESTIÓN DE ALMACENAMIENTO LOCAL ==========
const STORAGE_KEY = 'ac_manager_budgets';

function loadLocalMirror() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        budgetList = raw ? JSON.parse(raw) : [];
    } catch (e) {
        budgetList = [];
        console.warn('Error cargando datos locales:', e);
    }
}

function saveLocalMirror() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(budgetList));
    } catch (e) {
        console.warn('Error guardando datos locales:', e);
    }
}

// ========== GESTIÓN DE SUPABASE ==========
async function insertToSupabase(payload) {
    try {
        const { data, error } = await supabase
            .from('presupuestos')
            .insert([payload])
            .select();
        
        if (error) {
            console.error('Error Supabase:', error);
            return { success: false, error };
        }
        
        if (data && data.length > 0) {
            return { success: true, row: data[0] };
        }
        
        return { success: false, error: new Error('No data returned') };
    } catch (e) {
        console.error('Exception en insertToSupabase:', e);
        return { success: false, error: e };
    }
}

// ========== GESTIÓN DEL HISTORIAL ==========
function renderHistory(filter = '') {
    if (!bodyHistory) return;
    
    bodyHistory.innerHTML = '';
    const q = (filter || '').toLowerCase().trim();
    const items = budgetList.filter(b =>
        (b.clientName || '').toLowerCase().includes(q) ||
        (b.deviceModel || '').toLowerCase().includes(q) ||
        String(b.id).includes(q)
    );
    
    if (recordsBadge) {
        recordsBadge.textContent = `${budgetList.length} registros`;
    }
    
    if (items.length === 0) {
        bodyHistory.innerHTML = '<tr><td colspan="6">No hay registros</td></tr>';
        return;
    }
    
    items.slice().reverse().forEach(it => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${String(it.id).slice(-6)}</td>
            <td>${escapeHTML(it.clientName)}</td>
            <td>${escapeHTML(it.deviceModel)}</td>
            <td>${formatCurrency(it.total)}</td>
            <td>${it.date}</td>
            <td><button class="btn-delete" data-id="${it.id}">Borrar</button></td>
        `;
        bodyHistory.appendChild(tr);
    });
    
    bodyHistory.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            budgetList = budgetList.filter(b => b.id !== id);
            saveLocalMirror();
            renderHistory(searchHistory ? searchHistory.value : '');
            showToast('Registro eliminado', 'info');
        });
    });
}

// ========== MANEJO DEL FORMULARIO ==========
async function handleBudgetFormSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    
    const clientName = inputClientName ? inputClientName.value.trim() : '';
    const deviceModel = inputDeviceModel ? inputDeviceModel.value.trim() : '';
    const partsCost = inputPartsCost ? parseFloat(inputPartsCost.value) || 0 : 0;
    const laborCost = inputLaborCost ? parseFloat(inputLaborCost.value) || 0 : 0;
    const email = inputEmail ? inputEmail.value.trim() : 'tecnico@soporte.com';
    
    if (!clientName || !deviceModel) {
        showToast('Cliente y dispositivo son requeridos', 'error');
        return;
    }
    
    const { subtotal, iva, total } = calculateAmounts(partsCost, laborCost);
    const fecha_creacion = new Date().toISOString();
    
    const payload = {
        cliente: clientName,
        dispositivo: deviceModel,
        repuestos: partsCost,
        mano_obra: laborCost,
        iva,
        total,
        email,
        fecha_creacion
    };
    
    showToast('Enviando a Supabase...', 'info');
    
    const res = await insertToSupabase(payload);
    
    if (res.success && res.row) {
        const row = res.row;
        const record = {
            id: row.id || Date.now(),
            clientName: row.cliente || clientName,
            deviceModel: row.dispositivo || deviceModel,
            partsCost: row.repuestos ?? partsCost,
            laborCost: row.mano_obra ?? laborCost,
            subtotal: (row.repuestos ?? partsCost) + (row.mano_obra ?? laborCost),
            iva: row.iva ?? iva,
            total: row.total ?? total,
            date: row.fecha_creacion ? new Date(row.fecha_creacion).toLocaleString('es-ES') : getCurrentFormattedDate(),
            email: row.email || email
        };
        
        budgetList.push(record);
        saveLocalMirror();
        renderHistory(searchHistory ? searchHistory.value : '');
        if (budgetForm) budgetForm.reset();
        updatePreviewDisplay();
        showToast('Presupuesto guardado en Supabase ☁️', 'success');
        return;
    }
    
    // Fallback: guardar solo localmente
    const fallback = {
        id: Date.now(),
        clientName,
        deviceModel,
        partsCost,
        laborCost,
        subtotal,
        iva,
        total,
        date: getCurrentFormattedDate(),
        email
    };
    
    budgetList.push(fallback);
    saveLocalMirror();
    renderHistory(searchHistory ? searchHistory.value : '');
    if (budgetForm) budgetForm.reset();
    updatePreviewDisplay();
    showToast('Presupuesto guardado localmente (sin conexión a nube)', 'warning');
}

function updatePreviewDisplay() {
    if (!lblSubtotal || !lblIva || !lblTotal) return;
    
    const p = inputPartsCost ? parseFloat(inputPartsCost.value) || 0 : 0;
    const l = inputLaborCost ? parseFloat(inputLaborCost.value) || 0 : 0;
    const { subtotal, iva, total } = calculateAmounts(p, l);
    
    lblSubtotal.textContent = formatCurrency(subtotal);
    lblIva.textContent = formatCurrency(iva);
    lblTotal.textContent = formatCurrency(total);
}

// ========== INICIALIZACIÓN ==========
function init() {
    // Cargar datos locales
    loadLocalMirror();
    
    // Mostrar vista inicial
    if (landingSection && authSection && calculatorSection) {
        navigateTo('landingSection');
    }
    
    // Inicializar idioma
    updateLanguageDisplay();
    
    // Event listeners para navegación
    if (btnEnterApp) {
        btnEnterApp.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('authSection');
        });
    }
    
    if (btnBackToLanding) {
        btnBackToLanding.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('landingSection');
        });
    }
    
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('landingSection');
        });
    }
    
    // Event listeners para idioma
    if (languageToggle) {
        languageToggle.addEventListener('click', (e) => {
            e.preventDefault();
            if (languageOptions) {
                languageOptions.classList.toggle('hidden');
            }
        });
    }
    
    if (languageOptions) {
        languageOptions.querySelectorAll('.language-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = btn.getAttribute('data-lang');
                setLanguage(lang);
                if (languageOptions) {
                    languageOptions.classList.add('hidden');
                }
            });
        });
    }
    
    // Cerrar menú de idioma al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (languageToggle && languageOptions) {
            if (!languageToggle.contains(e.target) && !languageOptions.contains(e.target)) {
                languageOptions.classList.add('hidden');
            }
        }
    });
    
    // Formulario de presupuesto
    if (budgetForm) {
        budgetForm.addEventListener('submit', handleBudgetFormSubmit);
    }
    
    // Búsqueda de historial
    if (searchHistory) {
        searchHistory.addEventListener('input', (e) => {
            renderHistory(e.target.value);
        });
    }
    
    // Limpiar historial
    if (btnClearHistory) {
        btnClearHistory.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que deseas limpiar el historial?')) {
                budgetList = [];
                saveLocalMirror();
                renderHistory();
                showToast('Historial limpiado', 'success');
            }
        });
    }
    
    // Actualización en tiempo real de vista previa
    if (inputPartsCost || inputLaborCost) {
        const updatePreview = () => {
            updatePreviewDisplay();
        };
        
        if (inputPartsCost) inputPartsCost.addEventListener('input', updatePreview);
        if (inputLaborCost) inputLaborCost.addEventListener('input', updatePreview);
    }
    
    // Mostrar historial inicial
    renderHistory();
    updatePreviewDisplay();
    
    showToast('AC Manager - Iniciado correctamente', 'info');
}

// Ejecutar inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
const inputClientName = document.getElementById('clientName');
const inputDeviceModel = document.getElementById('deviceModel');
const inputPartsCost = document.getElementById('partsCost');
const inputLaborCost = document.getElementById('laborCost');
const inputEmail = document.getElementById('email');
const bodyHistory = document.getElementById('bodyHistory');
const searchHistory = document.getElementById('searchHistory');
const recordsBadge = document.getElementById('recordsBadge');
const btnClearHistory = document.getElementById('btnClearHistory');
const lblSubtotal = document.getElementById('lblSubtotal');
const lblIva = document.getElementById('lblIva');
const lblTotal = document.getElementById('lblTotal');

function calculateAmounts(parts, labor){ const p = Number(parts)||0; const l = Number(labor)||0; const subtotal = +(p + l).toFixed(2); const iva = +((subtotal * 0.15)).toFixed(2); const total = +(subtotal + iva).toFixed(2); return {subtotal, iva, total}; }

function renderHistory(filter=''){ if(!bodyHistory) return; bodyHistory.innerHTML=''; const q=(filter||'').toLowerCase().trim(); const items = budgetList.filter(b=> (b.clientName||'').toLowerCase().includes(q) || (b.deviceModel||'').toLowerCase().includes(q) ); if(recordsBadge) recordsBadge.textContent = `${budgetList.length} registros`; if(items.length===0){ bodyHistory.innerHTML = '<tr><td colspan="6">No hay registros</td></tr>'; return; } items.slice().reverse().forEach(it=>{ const tr = document.createElement('tr'); tr.innerHTML = `<td>#${String(it.id).slice(-6)}</td><td>${escapeHTML(it.clientName)}</td><td>${escapeHTML(it.deviceModel)}</td><td>${formatCurrency(it.total)}</td><td>${it.date}</td><td><button class="btn-delete" data-id="${it.id}">Borrar</button></td>`; bodyHistory.appendChild(tr); }); bodyHistory.querySelectorAll('.btn-delete').forEach(btn=>btn.addEventListener('click', ()=>{ const id = btn.getAttribute('data-id'); budgetList = budgetList.filter(b=>String(b.id)!==String(id)); saveLocalMirror(); renderHistory(searchHistory?searchHistory.value:''); showToast('Registro eliminado'); })); }

const STORAGE_KEY = 'ari_manager_local_mirror';
function loadLocalMirror(){ try{ const raw = localStorage.getItem(STORAGE_KEY); budgetList = raw?JSON.parse(raw):[]; }catch(e){ budgetList = []; } }
function saveLocalMirror(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(budgetList)); }catch(e){ console.warn(e); } }

async function insertToSupabase(payload){ try{ const { data, error } = await supabase.from('presupuestos').insert([payload]).select(); if(error) return { success:false, error }; if(data && data.length>0) return { success:true, row:data[0] }; return { success:false, error:new Error('No data') }; }catch(e){ return { success:false, error:e }; } }

async function handleBudgetFormSubmit(e){ if(e && e.preventDefault) e.preventDefault(); const clientName = inputClientName?inputClientName.value.trim():''; const deviceModel = inputDeviceModel?inputDeviceModel.value.trim():''; const partsCost = inputPartsCost?parseFloat(inputPartsCost.value)||0:0; const laborCost = inputLaborCost?parseFloat(inputLaborCost.value)||0:0; const email = inputEmail?inputEmail.value.trim():'desconocido@local'; if(!clientName||!deviceModel){ showToast('Cliente y dispositivo son requeridos'); return; } const {subtotal, iva, total} = calculateAmounts(partsCost, laborCost); const fecha_creacion = new Date().toISOString(); const payload = { cliente: clientName, dispositivo: deviceModel, repuestos: partsCost, mano_obra: laborCost, iva, total, email, fecha_creacion }; showToast('Enviando a Supabase...'); const res = await insertToSupabase(payload); if(res.success && res.row){ const row = res.row; const record = { id: row.id || Date.now(), clientName: row.cliente || clientName, deviceModel: row.dispositivo || deviceModel, partsCost: row.repuestos ?? partsCost, laborCost: row.mano_obra ?? laborCost, subtotal: row.iva ? +( (row.total || total) - (row.iva || iva) ).toFixed(2) : subtotal, iva: row.iva ?? iva, total: row.total ?? total, date: row.fecha_creacion? new Date(row.fecha_creacion).toLocaleString('es-ES') : getCurrentFormattedDate(), email: row.email || email }; budgetList.push(record); saveLocalMirror(); renderHistory(searchHistory?searchHistory.value:''); if(budgetForm) budgetForm.reset(); showToast('Presupuesto guardado en Supabase'); return; } const fallback = { id: Date.now(), clientName, deviceModel, partsCost, laborCost, subtotal, iva, total, date: getCurrentFormattedDate(), email }; budgetList.push(fallback); saveLocalMirror(); renderHistory(searchHistory?searchHistory.value:''); if(budgetForm) budgetForm.reset(); showToast('No se pudo guardar en la nube; guardado local'); }

function init(){ loadLocalMirror(); renderHistory(); if(budgetForm) budgetForm.addEventListener('submit', handleBudgetFormSubmit); if(searchHistory) searchHistory.addEventListener('input', e=>renderHistory(e.target.value)); if(btnClearHistory) btnClearHistory.addEventListener('click', ()=>{ budgetList=[]; saveLocalMirror(); renderHistory(); showToast('Historial limpiado'); }); if(inputPartsCost||inputLaborCost){ const updatePreview = ()=>{ const p = inputPartsCost?parseFloat(inputPartsCost.value)||0:0; const l = inputLaborCost?parseFloat(inputLaborCost.value)||0:0; const {subtotal, iva, total} = calculateAmounts(p,l); if(lblSubtotal) lblSubtotal.textContent = formatCurrency(subtotal); if(lblIva) lblIva.textContent = formatCurrency(iva); if(lblTotal) lblTotal.textContent = formatCurrency(total); }; if(inputPartsCost) inputPartsCost.addEventListener('input', updatePreview); if(inputLaborCost) inputLaborCost.addEventListener('input', updatePreview); } }

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = "https://qvnbvfwcodjtqhbczxar.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable__qQmLTITfpuVePH67M2dCw_CF8kmosN";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Ari Manager - app.js
// Conexión directa a Supabase y lógica de la calculadora

let budgetList = [];

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}
function getCurrentFormattedDate() { return new Date().toLocaleString('es-ES'); }
function showToast(msg, type='info'){ console.log('[Toast]', type, msg); }
function escapeHTML(s){ if(!s) return ''; return String(s).replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[c])); }

// DOM selectors (IDs expected in your HTML)
const landingSection = document.getElementById('landingSection');
const authSection = document.getElementById('authSection');
const calculatorSection = document.getElementById('calculatorSection');
const btnEnterApp = document.getElementById('btnEnterApp');
const btnBackToLanding = document.getElementById('btnBackToLanding');
const btnLogout = document.getElementById('btnLogout');
const budgetForm = document.getElementById('budgetForm');
const inputClientName = document.getElementById('clientName');
const inputDeviceModel = document.getElementById('deviceModel');
const inputPartsCost = document.getElementById('partsCost');
const inputLaborCost = document.getElementById('laborCost');
const inputEmail = document.getElementById('email');
const bodyHistory = document.getElementById('bodyHistory');
const searchHistory = document.getElementById('searchHistory');
const recordsBadge = document.getElementById('recordsBadge');
const btnClearHistory = document.getElementById('btnClearHistory');
const lblSubtotal = document.getElementById('lblSubtotal');
const lblIva = document.getElementById('lblIva');
const lblTotal = document.getElementById('lblTotal');

function navigateTo(sectionId){ [landingSection, authSection, calculatorSection].forEach(s => { if(!s) return; if(s.id===sectionId) s.classList.remove('hidden'); else s.classList.add('hidden'); }); }
if(btnEnterApp) btnEnterApp.addEventListener('click', ()=>navigateTo('authSection'));
if(btnBackToLanding) btnBackToLanding.addEventListener('click', ()=>navigateTo('landingSection'));
if(btnLogout) btnLogout.addEventListener('click', ()=>navigateTo('landingSection'));

function calculateAmounts(parts, labor){ const p=Number(parts)||0; const l=Number(labor)||0; const subtotal=+(p+l).toFixed(2); const iva=+((subtotal*0.15)).toFixed(2); const total=+(subtotal+iva).toFixed(2); return {subtotal,iva,total}; }

function renderHistory(filter=''){ if(!bodyHistory) return; bodyHistory.innerHTML=''; const q=(filter||'').toLowerCase().trim(); const items=budgetList.filter(b=> (b.clientName||'').toLowerCase().includes(q) || (b.deviceModel||'').toLowerCase().includes(q) || String(b.id).includes(q)); if(recordsBadge) recordsBadge.textContent=`${budgetList.length} registros`; if(items.length===0){ bodyHistory.innerHTML='<tr><td colspan="6">No hay registros</td></tr>'; return; } items.slice().reverse().forEach(it=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>#${String(it.id).slice(-6)}</td><td>${escapeHTML(it.clientName)}</td><td>${escapeHTML(it.deviceModel)}</td><td>${formatCurrency(it.total)}</td><td>${it.date}</td><td><button class="btn-delete" data-id="${it.id}">Borrar</button></td>`; bodyHistory.appendChild(tr); }); bodyHistory.querySelectorAll('.btn-delete').forEach(btn=>btn.addEventListener('click',()=>{ const id=parseInt(btn.getAttribute('data-id')); budgetList=budgetList.filter(b=>b.id!==id); saveLocalMirror(); renderHistory(searchHistory?searchHistory.value:''); showToast('Registro eliminado','info'); })); }

const STORAGE_KEY='ari_manager_local_mirror';
function loadLocalMirror(){ try{ const raw=localStorage.getItem(STORAGE_KEY); budgetList = raw?JSON.parse(raw):[]; }catch(e){ budgetList=[]; } }
function saveLocalMirror(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(budgetList)); }catch(e){console.warn(e);} }

async function insertToSupabase(payload){ try{ const { data, error } = await supabase.from('presupuestos').insert([payload]).select(); if(error) return {success:false,error}; if(data && data.length>0) return {success:true,row:data[0]}; return {success:false,error:new Error('No data')}; }catch(e){ return {success:false,error:e}; } }

async function handleBudgetFormSubmit(e){ if(e && e.preventDefault) e.preventDefault(); const clientName = inputClientName?inputClientName.value.trim():''; const deviceModel = inputDeviceModel?inputDeviceModel.value.trim():''; const partsCost = inputPartsCost?parseFloat(inputPartsCost.value)||0:0; const laborCost = inputLaborCost?parseFloat(inputLaborCost.value)||0:0; const email = inputEmail?inputEmail.value.trim():(window.currentUser||'tecnico@soporte.com'); if(!clientName||!deviceModel){ showToast('Cliente y dispositivo son requeridos','error'); return; } const {subtotal,iva,total}=calculateAmounts(partsCost,laborCost); const fecha_creacion=new Date().toISOString(); const payload={ cliente:clientName, dispositivo:deviceModel, repuestos:partsCost, mano_obra:laborCost, iva, total, email, fecha_creacion }; showToast('Enviando a Supabase...','info'); const res = await insertToSupabase(payload); if(res.success && res.row){ const row=res.row; const record={ id: row.id || Date.now(), clientName: row.cliente || clientName, deviceModel: row.dispositivo || deviceModel, partsCost: row.repuestos ?? partsCost, laborCost: row.mano_obra ?? laborCost, subtotal: (row.repuestos ?? partsCost) + (row.mano_obra ?? laborCost), iva: row.iva ?? iva, total: row.total ?? total, date: row.fecha_creacion ? new Date(row.fecha_creacion).toLocaleString('es-ES') : getCurrentFormattedDate(), email: row.email || email }; budgetList.push(record); saveLocalMirror(); renderHistory(searchHistory?searchHistory.value:''); if(budgetForm) budgetForm.reset(); showToast('Presupuesto guardado en Supabase','success'); return; } const fallback = { id: Date.now(), clientName, deviceModel, partsCost, laborCost, subtotal, iva, total, date: getCurrentFormattedDate(), email }; budgetList.push(fallback); saveLocalMirror(); renderHistory(searchHistory?searchHistory.value:''); if(budgetForm) budgetForm.reset(); showToast('No se pudo guardar en la nube; guardado local','error'); }

function init(){ loadLocalMirror(); renderHistory(); if(budgetForm) budgetForm.addEventListener('submit', handleBudgetFormSubmit); if(searchHistory) searchHistory.addEventListener('input', e=>renderHistory(e.target.value)); if(btnClearHistory) btnClearHistory.addEventListener('click', ()=>{ budgetList=[]; saveLocalMirror(); renderHistory(); showToast('Historial limpiado','success'); }); if(inputPartsCost||inputLaborCost){ const updatePreview=()=>{ const p=inputPartsCost?parseFloat(inputPartsCost.value)||0:0; const l=inputLaborCost?parseFloat(inputLaborCost.value)||0:0; const {subtotal,iva,total}=calculateAmounts(p,l); if(lblSubtotal) lblSubtotal.textContent=formatCurrency(subtotal); if(lblIva) lblIva.textContent=formatCurrency(iva); if(lblTotal) lblTotal.textContent=formatCurrency(total); }; if(inputPartsCost) inputPartsCost.addEventListener('input', updatePreview); if(inputLaborCost) inputLaborCost.addEventListener('input', updatePreview); }
    if(landingSection&&authSection&&calculatorSection) navigateTo('landingSection'); }

    // Reseteamos errores visuales de autenticación
    resetAuthErrors();

    if (mode === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        
        tabLogin.textContent = t('authTabLogin');
        tabRegister.textContent = t('authTabRegister');
        authTitle.textContent = t('authTitleLogin');
        authSubtitle.textContent = t('authSubtitleLogin');
        
        // Ocultar confirmación de contraseña y enlace de "¿Olvidaste tu contraseña?"
        confirmPasswordGroup.classList.add('hidden');
        btnForgotPassword.classList.remove('hidden');
        
        btnAuthSubmit.querySelector('span').textContent = t('btnAuthSubmitLogin');
    } else {
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
        
        tabLogin.textContent = t('authTabLogin');
        tabRegister.textContent = t('authTabRegister');
        authTitle.textContent = t('authTitleRegister');
        authSubtitle.textContent = t('authSubtitleRegister');
        
        // Mostrar confirmación de contraseña y ocultar olvido de contraseña
        confirmPasswordGroup.classList.remove('hidden');
        btnForgotPassword.classList.add('hidden');
        
        btnAuthSubmit.querySelector('span').textContent = t('btnAuthSubmitRegister');
    }
}

// Listeners para pestañas de autenticación
tabLogin.addEventListener('click', () => setAuthMode('login'));
tabRegister.addEventListener('click', () => setAuthMode('register'));

/**
 * Remueve la visualización de errores del formulario de autenticación
 */
function resetAuthErrors() {
    inputAuthEmail.closest('.form-group').classList.remove('has-error');
    inputAuthPassword.closest('.form-group').classList.remove('has-error');
    inputAuthConfirmPassword.closest('.form-group').classList.remove('has-error');
}

// ==========================================================================
// 6. CONTROLADOR DE AUTENTICACIÓN (FIREBASE O SIMULADOR LOCAL)
// ==========================================================================

/**
 * Maneja el evento submit del formulario de autenticación
 */
authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = inputAuthEmail.value.trim();
    const password = inputAuthPassword.value;
    const confirmPassword = inputAuthConfirmPassword.value;

    // 1. Validaciones del lado del cliente
    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validación del Correo
    if (!emailRegex.test(email)) {
        inputAuthEmail.closest('.form-group').classList.add('has-error');
        isValid = false;
    } else {
        inputAuthEmail.closest('.form-group').classList.remove('has-error');
    }

    // Validación de la Contraseña (Mínimo 6 caracteres según reglas estándar de Firebase)
    if (password.length < 6) {
        inputAuthPassword.closest('.form-group').classList.add('has-error');
        isValid = false;
    } else {
        inputAuthPassword.closest('.form-group').classList.remove('has-error');
    }

    // Validación extra en caso de Registro (Confirmar Contraseña)
    if (authMode === 'register') {
        if (password !== confirmPassword) {
            inputAuthConfirmPassword.closest('.form-group').classList.add('has-error');
            isValid = false;
        } else {
            inputAuthConfirmPassword.closest('.form-group').classList.remove('has-error');
        }
    }

    if (!isValid) {
        showToast(translateMessage('authFormInvalid'), 'error');
        return;
    }

    // 2. Procesamiento según el modo (Firebase Real vs Simulación)
    if (isFirebaseEnabled) {
        processFirebaseAuth(email, password);
    } else {
        processSimulatedAuth(email, password);
    }
});

/**
 * Lógica real comunicando con los servidores de Firebase Auth
 */
function processFirebaseAuth(email, password) {
    if (authMode === 'login') {
        // Método de Firebase para iniciar sesión
        authService.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                showToast(translateMessage('firebaseLoginSuccess', { email: user.email }));
                handleSuccessfulLogin(user.email);
            })
            .catch((error) => {
                console.error("Error Firebase Login: ", error.code);
                showToast(translateFirebaseError(error.code), "error");
            });
    } else {
        // Método de Firebase para registrar usuario
        authService.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                showToast(translateMessage('firebaseAccountCreated', { email: user.email }));
                handleSuccessfulLogin(user.email);
            })
            .catch((error) => {
                console.error("Error Firebase Register: ", error.code);
                showToast(translateFirebaseError(error.code), "error");
            });
    }
}

/**
 * Lógica simulada almacenando cuentas de usuarios cifradas o guardadas en el LocalStorage
 */
function processSimulatedAuth(email, password) {
    // Obtenemos los usuarios guardados en localStorage
    let users = [];
    const storedUsers = localStorage.getItem(STORAGE_USERS_KEY);
    if (storedUsers) {
        users = JSON.parse(storedUsers);
    }

    if (authMode === 'login') {
        // Buscar el usuario por email
        const userFound = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!userFound) {
            showToast(translateMessage('simulatorEmailNotRegistered'), 'error');
            inputAuthEmail.closest('.form-group').classList.add('has-error');
            return;
        }
        
        if (userFound.password !== password) {
            showToast(translateMessage('simulatorWrongPassword'), 'error');
            inputAuthPassword.closest('.form-group').classList.add('has-error');
            return;
        }

        // Éxito en el login simulado
        showToast(translateMessage('simulatorLoginSuccess'));

        // Guardamos estado de sesión en localStorage para persistencia de sesión
        localStorage.setItem(STORAGE_SESSION_KEY, userFound.email);
        handleSuccessfulLogin(userFound.email);

    } else {
        // Comprobar si el usuario ya existe
        const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (userExists) {
            showToast(translateMessage('simulatorEmailAlreadyRegistered'), 'error');
            inputAuthEmail.closest('.form-group').classList.add('has-error');
            return;
        }

        // Registrar nuevo usuario ficticio
        const newUser = { email, password };
        users.push(newUser);
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));

        // No iniciar sesión automáticamente: requerimos que el usuario inicie sesión después de crear la cuenta
        showToast(translateMessage('simulatorAccountCreated'), 'success');
        // Cambiar al modo login y rellenar el email para comodidad
        setAuthMode('login');
        inputAuthEmail.value = email;
        inputAuthPassword.value = '';
        inputAuthConfirmPassword.value = '';
        inputAuthPassword.focus();
    }
}

/**
 * Recuperación de Contraseña (Firebase real o Envío de Correo simulado)
 */
btnForgotPassword.addEventListener('click', () => {
    const email = inputAuthEmail.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validación mínima del correo antes de enviar restablecimiento
    if (!emailRegex.test(email)) {
        showToast(translateMessage('passwordResetInvalidEmail'), 'error');
        inputAuthEmail.closest('.form-group').classList.add('has-error');
        return;
    }

    if (isFirebaseEnabled) {
        // Llamada nativa a Firebase para enviar correo de restablecimiento real
        authService.sendPasswordResetEmail(email)
            .then(() => {
                showToast(translateMessage('passwordResetSentFirebase', { email }));
            })
            .catch((error) => {
                showToast(translateFirebaseError(error.code), 'error');
            });
    } else {
        // Simulación visual del correo de restablecimiento
        showToast(translateMessage('passwordResetSentSimulator', { email }));
    }
});

/**
 * Traduce códigos de error técnicos de Firebase Auth al español
 * @param {string} code - Código de error de Firebase
 * @returns {string} - Mensaje en español
 */
function translateFirebaseError(code) {
    const errorKeyMap = {
        'auth/invalid-email': 'firebaseErrorInvalidEmail',
        'auth/user-disabled': 'firebaseErrorUserDisabled',
        'auth/user-not-found': 'firebaseErrorUserNotFound',
        'auth/wrong-password': 'firebaseErrorWrongPassword',
        'auth/email-already-in-use': 'firebaseErrorEmailAlreadyInUse',
        'auth/weak-password': 'firebaseErrorWeakPassword'
    };
    const translationKey = errorKeyMap[code] || 'firebaseErrorDefault';
    return translateMessage(translationKey);
}

/**
 * Al loguearse correctamente, carga el estado y redirige a la calculadora principal
 * @param {string} email - Correo del usuario activo
 */
function handleSuccessfulLogin(email) {
    currentUser = email;
    
    // Cambiar la etiqueta de la base de datos según si está Firebase activo o local
    dbStatusLabel.textContent = translateMessage(isFirebaseEnabled ? 'dbStatusFirebase' : 'dbStatusLocal');
    
    // Limpiamos los inputs del formulario de acceso
    authForm.reset();
    resetAuthErrors();
    
    // Carga los datos de presupuestos del usuario actual
    loadBudgetsFromLocalStorage();
    
    // Navegación
    navigateTo('calculatorSection');
}

/**
 * Restaura la sesión en el fondo sin forzar navegación (se usa al cargar la página)
 * @param {string} email - Correo del usuario a restaurar
 */
/**
 * Restaura la sesión del usuario: carga email, historial local y sincroniza con Supabase
 * @param {string} email - Email del usuario logueado
 */
async function restoreSession(email) {
    currentUser = email;
    dbStatusLabel.textContent = translateMessage(isFirebaseEnabled ? 'dbStatusFirebase' : 'dbStatusLocal');
    loadBudgetsFromLocalStorage();
    
    // Sincronizar con Supabase si está disponible
    if (isSupabaseEnabled && supabase) {
        console.log("🔄 Sincronizando datos con Supabase para usuario:", email);
        await sincronizarDesdeSupabase(email);
    }
}

/**
 * Cierre de sesión (Limpieza de estados y retorno a auth)
 */
btnLogout.addEventListener('click', () => {
    if (isFirebaseEnabled) {
        authService.signOut()
            .then(() => {
                currentUser = null;
                navigateTo('authSection');
                showToast(translateMessage('firebaseSessionClosed'));
            });
    } else {
        currentUser = null;
        localStorage.removeItem(STORAGE_SESSION_KEY);
        navigateTo('authSection');
        showToast(translateMessage('localSessionClosed'));
    }
});

// ==========================================================================
// 7. LÓGICA DE PRESUPUESTOS Y CÁLCULOS (MANTENIDO Y OPTIMIZADO)
// ==========================================================================

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}

function getCurrentFormattedDate() {
    const now = new Date();
    const options = { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    };
    return now.toLocaleDateString('es-ES', options);
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
    
    const iconSvg = type === 'success' 
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="toast-icon"><polyline points="20 6 9 17 4 12"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="toast-icon"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

    toast.innerHTML = `${iconSvg}<span class="toast-message">${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 450);
    }, 5000);
}

/**
 * Actualiza la tarjeta de previsualización en vivo
 */
function updateBreakdownPreview() {
    const partsCost = parseFloat(inputPartsCost.value) || 0;
    const laborCost = parseFloat(inputLaborCost.value) || 0;

    const subtotal = partsCost + laborCost;
    const iva = subtotal * 0.15; // IVA 15%
    const total = subtotal + iva;

    lblSubtotal.textContent = formatCurrency(subtotal);
    lblIva.textContent = formatCurrency(iva);
    lblTotal.textContent = formatCurrency(total);

    const partsPercent = total > 0 ? Math.round((partsCost / total) * 100) : 0;
    const laborPercent = total > 0 ? Math.round((laborCost / total) * 100) : 0;
    const ivaPercent = total > 0 ? 100 - partsPercent - laborPercent : 0;

    barParts.style.width = `${partsPercent}%`;
    barLabor.style.width = `${laborPercent}%`;
    barIva.style.width = `${ivaPercent}%`;

    partsPercentLabel.textContent = `${partsPercent}%`;
    laborPercentLabel.textContent = `${laborPercent}%`;
    ivaPercentLabel.textContent = `${ivaPercent}%`;
}

inputPartsCost.addEventListener('input', updateBreakdownPreview);
inputLaborCost.addEventListener('input', updateBreakdownPreview);

const deviceCatalog = [
    { name: 'PS5', category: 'Videojuegos' },
    { name: 'Xbox Series X', category: 'Videojuegos' },
    { name: 'Nintendo Switch', category: 'Videojuegos' },
    { name: 'Laptop Gamer Asus ROG', category: 'Computadoras' },
    { name: 'Laptop HP Pavilion', category: 'Computadoras' },
    { name: 'Laptop Lenovo ThinkPad', category: 'Computadoras' },
    { name: 'Laptop Dell Inspiron', category: 'Computadoras' },
    { name: 'Laptop Acer Nitro', category: 'Computadoras' },
    { name: 'Laptop MSI GF63', category: 'Computadoras' },
    { name: 'Laptop Apple MacBook Pro', category: 'Computadoras' },
    { name: 'iMac 24"', category: 'Computadoras' },
    { name: 'PC Gamer Completa', category: 'Computadoras' },
    { name: 'Desktop Empresarial Dell', category: 'Computadoras' },
    { name: 'Workstation HP ZBook', category: 'Computadoras' },
    { name: 'All-in-One Lenovo', category: 'Computadoras' },
    { name: 'Procesador Intel Core i7', category: 'Componentes' },
    { name: 'Procesador AMD Ryzen 7', category: 'Componentes' },
    { name: 'Tarjeta Gráfica NVIDIA RTX 4070', category: 'Componentes' },
    { name: 'Tarjeta Gráfica AMD Radeon RX 6800', category: 'Componentes' },
    { name: 'Placa Madre ASUS', category: 'Componentes' },
    { name: 'Placa Madre Gigabyte', category: 'Componentes' },
    { name: 'Memoria RAM 16GB', category: 'Componentes' },
    { name: 'Memoria RAM 32GB', category: 'Componentes' },
    { name: 'SSD 1TB', category: 'Componentes' },
    { name: 'HDD 2TB', category: 'Componentes' },
    { name: 'Monitor 27"', category: 'Componentes' },
    { name: 'Monitor Curvo Samsung', category: 'Componentes' },
    { name: 'Fuente 650W', category: 'Componentes' },
    { name: 'Fuente 750W', category: 'Componentes' }
];

function renderDeviceSuggestions(query = '') {
    const normalized = query.toLowerCase().trim();
    const filtered = deviceCatalog.filter(device => device.name.toLowerCase().includes(normalized) || device.category.toLowerCase().includes(normalized));
    const items = filtered.slice(0, 8);

    if (items.length === 0) {
        deviceSuggestions.innerHTML = `<div class="device-suggestion-item">${t('deviceNoResults')}</div>`;
        deviceSuggestions.classList.remove('hidden');
        return;
    }

    deviceSuggestions.innerHTML = items.map(device => `
        <button type="button" class="device-suggestion-item" data-device="${device.name}" title="${translateMessage('deviceSelectTitle', { device: device.name })}">
            <span>${device.name}</span>
            <span>${device.category}</span>
        </button>
    `).join('');

    deviceSuggestions.classList.remove('hidden');

    const suggestionButtons = deviceSuggestions.querySelectorAll('.device-suggestion-item');
    suggestionButtons.forEach(button => {
        button.addEventListener('mousedown', () => {
            inputDeviceModel.value = button.dataset.device;
            deviceSuggestions.classList.add('hidden');
            inputDeviceModel.closest('.form-group').classList.remove('has-error');
        });
    });
}

inputDeviceModel.addEventListener('input', () => {
    inputDeviceModel.closest('.form-group').classList.remove('has-error');
    renderDeviceSuggestions(inputDeviceModel.value);
});

inputDeviceModel.addEventListener('focus', () => {
    renderDeviceSuggestions(inputDeviceModel.value);
});

window.addEventListener('click', (event) => {
    if (!event.target.closest('.device-search-group')) {
        deviceSuggestions.classList.add('hidden');
    }
});

// Validadores de entrada
function validateTextField(inputElement) {
    const parent = inputElement.closest('.form-group');
    if (inputElement.value.trim() === '') {
        parent.classList.add('has-error');
        return false;
    } else {
        parent.classList.remove('has-error');
        return true;
    }
}

function validateNumericField(inputElement, errorElement) {
    const parent = inputElement.closest('.form-group');
    const value = parseFloat(inputElement.value);
    
    if (inputElement.value === '' || isNaN(value)) {
        errorElement.textContent = 'Este costo es obligatorio';
        parent.classList.add('has-error');
        return false;
    } else if (value < 0) {
        errorElement.textContent = 'El costo no puede ser negativo';
        parent.classList.add('has-error');
        return false;
    } else {
        parent.classList.remove('has-error');
        return true;
    }
}

inputClientName.addEventListener('blur', () => validateTextField(inputClientName));
inputDeviceModel.addEventListener('blur', () => validateTextField(inputDeviceModel));
inputPartsCost.addEventListener('blur', () => validateNumericField(inputPartsCost, errorPartsCost));
inputLaborCost.addEventListener('blur', () => validateNumericField(inputLaborCost, errorLaborCost));

// Limpieza de errores en inputs
inputClientName.addEventListener('input', () => inputClientName.closest('.form-group').classList.remove('has-error'));
inputDeviceModel.addEventListener('input', () => inputDeviceModel.closest('.form-group').classList.remove('has-error'));
inputPartsCost.addEventListener('input', () => inputPartsCost.closest('.form-group').classList.remove('has-error'));
inputLaborCost.addEventListener('input', () => inputLaborCost.closest('.form-group').classList.remove('has-error'));

/**
 * Carga los presupuestos desde el localStorage correspondientes al usuario actual
 */
function loadBudgetsFromLocalStorage() {
    const storedData = localStorage.getItem(STORAGE_BUDGET_KEY);
    if (storedData) {
        try {
            const allBudgets = JSON.parse(storedData);
            // Filtramos los presupuestos para mostrar únicamente los que correspondan al usuario autenticado
            budgetList = allBudgets.filter(item => item.ownerEmail === currentUser);
        } catch (e) {
            console.error(e);
            budgetList = [];
        }
    } else {
        budgetList = [];
    }

    selectedBudgetId = null;
    if (quoteFormTitle) {
        quoteFormTitle.textContent = 'Nueva Cotización';
    }
    if (budgetForm) {
        budgetForm.reset();
        updateBreakdownPreview();
    }

    renderHistoryTable();
}

/**
 * Guarda los presupuestos del usuario actual en el localStorage manteniendo los de otros usuarios
 */
function saveBudgetsToLocalStorage() {
    const storedData = localStorage.getItem(STORAGE_BUDGET_KEY);
    let allBudgets = [];
    if (storedData) {
        try {
            allBudgets = JSON.parse(storedData);
        } catch (e) {
            allBudgets = [];
        }
    }
    
    // Quitamos los presupuestos anteriores del usuario actual en el arreglo general
    allBudgets = allBudgets.filter(item => item.ownerEmail !== currentUser);
    
    // Insertamos la lista actualizada del usuario actual
    allBudgets = allBudgets.concat(budgetList);
    
    localStorage.setItem(STORAGE_BUDGET_KEY, JSON.stringify(allBudgets));
}

/**
 * Renderiza el listado histórico en la tabla
 */
function renderHistoryTable(filterText = '') {
    bodyHistory.innerHTML = '';
    const query = filterText.toLowerCase().trim();

    const filteredList = budgetList.filter(item => {
        return item.clientName.toLowerCase().includes(query) || 
               item.deviceModel.toLowerCase().includes(query) ||
               String(item.id).includes(query);
    });

    recordsBadge.textContent = translateMessage('recordsBadge', { count: budgetList.length });
    btnClearHistory.disabled = budgetList.length === 0;

    if (filteredList.length === 0) {
        const trEmpty = document.createElement('tr');
        trEmpty.className = 'empty-row-placeholder';
        
        let emptyMessage = t('historyEmptyText');
        if (query !== '') {
            emptyMessage = translateMessage('historyNoResults', { query: filterText });
        }

        trEmpty.innerHTML = `
            <td colspan="6">
                <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="empty-icon">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="9" y1="9" x2="15" y2="9"/>
                        <line x1="9" y1="13" x2="15" y2="13"/>
                        <line x1="9" y1="17" x2="11" y2="17"/>
                    </svg>
                    <p>${emptyMessage}</p>
                </div>
            </td>
        `;
        bodyHistory.appendChild(trEmpty);
        return;
    }

    filteredList.slice().reverse().forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'history-row';
        tr.dataset.id = item.id;
        const displayId = `#${String(item.id).slice(-6)}`;

        tr.innerHTML = `
            <td class="col-id" title="${translateMessage('fullIdTitle', { id: item.id })}">${displayId}</td>
            <td>${escapeHTML(item.clientName)}</td>
            <td>${escapeHTML(item.deviceModel)}</td>
            <td class="col-total">${formatCurrency(item.total)}</td>
            <td>${item.date}</td>
            <td class="col-actions">
                <button type="button" class="btn-download-row" data-id="${item.id}" title="Descargar PDF">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                </button>
                <button type="button" class="btn-delete-row" data-id="${item.id}" title="${t('deleteRowTitle')}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </td>
        `;

        tr.addEventListener('click', (event) => {
            if (event.target.closest('button')) return;
            selectBudget(item.id);
        });

        bodyHistory.appendChild(tr);
    });

    const deleteButtons = bodyHistory.querySelectorAll('.btn-delete-row');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const budgetId = parseInt(btn.getAttribute('data-id'));
            deleteSingleBudget(budgetId);
        });
    });

    const downloadButtons = bodyHistory.querySelectorAll('.btn-download-row');
    downloadButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const budgetId = parseInt(btn.getAttribute('data-id'));
            const budget = budgetList.find(item => item.id === budgetId);
            if (budget) {
                downloadPdfForBudget(budget);
            }
        });
    });


    highlightSelectedBudgetRow();
}

/**
 * RenderBudgetsTrendChart removido: no se usa ningún gráfico ahora.
 */
function renderBudgetsTrendChart() {
    return;
}

// Convierte un elemento SVG en DataURL PNG para incluirlo en el PDF
function svgToPngDataUrl(svgEl, width = 120, height = 120) {
    return new Promise((resolve) => {
        if (!svgEl) return resolve(null);
        const clone = svgEl.cloneNode(true);
        clone.setAttribute('width', width);
        clone.setAttribute('height', height);
        const svgString = new XMLSerializer().serializeToString(clone);
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/png');
            URL.revokeObjectURL(url);
            resolve(dataUrl);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
        };

        img.src = url;
    });
}

async function downloadPdfForBudget(budget) {
    try {
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) {
            showToast('jsPDF no está cargado', 'error');
            return;
        }

        const svgLogo = document.querySelector('.header-logo .icon-logo') || document.querySelector('svg.icon-logo');
        const logoDataUrl = await svgToPngDataUrl(svgLogo, 120, 120);

        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const margin = 40;
        let y = margin;
        const pageWidth = doc.internal.pageSize.getWidth();

        if (logoDataUrl) {
            doc.addImage(logoDataUrl, 'PNG', margin, y, 60, 60);
        }

        doc.setFontSize(20);
        doc.setTextColor(34, 34, 34);
        doc.text('AC Manager', margin + 75, y + 24);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Gestor Profesional de Presupuestos', margin + 75, y + 42);

        y += 80;
        doc.setLineWidth(0.5);
        doc.setDrawColor(200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 20;

        doc.setFontSize(12);
        doc.setTextColor(34, 34, 34);
        doc.text(`ID: ${budget.id}`, margin, y);
        doc.text(`Fecha: ${budget.date}`, pageWidth - margin - 180, y);
        y += 18;
        doc.text(`Cliente: ${budget.clientName}`, margin, y);
        doc.text(`Equipo: ${budget.deviceModel}`, pageWidth - margin - 180, y);
        y += 24;

        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text('Detalle', margin, y);
        doc.text('Valor', pageWidth - margin - 120, y);
        y += 14;

        doc.setTextColor(34, 34, 34);
        doc.text('Repuestos', margin, y);
        doc.text(formatCurrency(budget.partsCost), pageWidth - margin - 120, y);
        y += 16;
        doc.text('Mano de obra', margin, y);
        doc.text(formatCurrency(budget.laborCost), pageWidth - margin - 120, y);
        y += 16;
        doc.text('Subtotal', margin, y);
        doc.text(formatCurrency(budget.subtotal), pageWidth - margin - 120, y);
        y += 16;
        doc.text('IVA (15%)', margin, y);
        doc.text(formatCurrency(budget.iva), pageWidth - margin - 120, y);
        y += 18;

        doc.setFontSize(14);
        doc.setTextColor(0, 121, 191);
        doc.text('TOTAL', margin, y);
        doc.text(formatCurrency(budget.total), pageWidth - margin - 120, y);
        y += 32;

        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('AC Manager — Gestión profesional de presupuestos', margin, doc.internal.pageSize.getHeight() - 40);

        const filename = `cotizacion_${budget.id}.pdf`;
        doc.save(filename);
    } catch (error) {
        console.error(error);
        showToast('Error al generar PDF', 'error');
    }
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

/**
 * Agrega el presupuesto asociado al propietario activo
 * Guarda en localStorage e intenta sincronizar con Supabase
 */
async function addNewBudget() {
    const partsCost = parseFloat(inputPartsCost.value) || 0;
    const laborCost = parseFloat(inputLaborCost.value) || 0;
    
    const subtotal = partsCost + laborCost;
    const iva = subtotal * 0.15;
    const total = subtotal + iva;
    const newBudget = {
        // id será sustituido por el id de Supabase cuando se persista en la nube
        id: Date.now(),
        ownerEmail: currentUser,
        clientName: inputClientName.value.trim(),
        deviceModel: inputDeviceModel.value.trim(),
        partsCost: partsCost,
        laborCost: laborCost,
        subtotal: subtotal,
        iva: iva,
        total: total,
        date: getCurrentFormattedDate()
    };

    // Intentar guardar DIRECTAMENTE en Supabase usando el cliente global `supabase`
    if (isSupabaseEnabled && typeof supabase !== 'undefined' && supabase) {
        try {
            const resultSupabase = await guardarPresupuestoSupabase(
                newBudget.clientName,
                newBudget.deviceModel,
                newBudget.partsCost,
                newBudget.laborCost,
                newBudget.ownerEmail
            );

            if (resultSupabase) {
                // Usar el ID y fecha retornados por Supabase para el historial local
                const saved = {
                    id: resultSupabase.id || Date.now(),
                    ownerEmail: resultSupabase.email || newBudget.ownerEmail,
                    clientName: resultSupabase.cliente || newBudget.clientName,
                    deviceModel: resultSupabase.dispositivo || newBudget.deviceModel,
                    partsCost: resultSupabase.repuestos ?? newBudget.partsCost,
                    laborCost: resultSupabase.mano_obra ?? newBudget.laborCost,
                    subtotal: (resultSupabase.repuestos ?? newBudget.partsCost) + (resultSupabase.mano_obra ?? newBudget.laborCost),
                    iva: resultSupabase.iva ?? newBudget.iva,
                    total: resultSupabase.total ?? newBudget.total,
                    date: resultSupabase.fecha_creacion ? new Date(resultSupabase.fecha_creacion).toLocaleDateString('es-ES') : newBudget.date
                };

                // Guardar en historial local como reflejo de lo que hay en la nube
                budgetList.push(saved);
                saveBudgetsToLocalStorage();
                renderHistoryTable(searchHistory.value);
                budgetForm.reset();
                updateBreakdownPreview();

                showToast(
                    translateMessage('quoteSaved', { clientName: saved.clientName }) +
                    ' (Sincronizado en la nube ☁️)',
                    'success'
                );
                console.log('✓ Presupuesto guardado y sincronizado a Supabase con ID:', saved.id);
                return;
            }
        } catch (error) {
            console.error('❌ Error guardando directamente en Supabase:', error);
            // En caso de error de red/servidor, caeremos al flujo de guardado local
        }
    }

    // Si no se pudo guardar en Supabase, guardar localmente SIN marcarlo como "pendiente"
    budgetList.push(newBudget);
    saveBudgetsToLocalStorage();
    renderHistoryTable(searchHistory.value);
    budgetForm.reset();
    updateBreakdownPreview();
    showToast(translateMessage('quoteSaved', { clientName: newBudget.clientName }), 'warning');
}

function selectBudget(budgetId) {
    const budget = budgetList.find(item => item.id === budgetId);
    if (!budget) return;

    selectedBudgetId = budgetId;
    inputClientName.value = budget.clientName;
    inputDeviceModel.value = budget.deviceModel;
    inputPartsCost.value = budget.partsCost.toFixed(2);
    inputLaborCost.value = budget.laborCost.toFixed(2);
    updateBreakdownPreview();
    highlightSelectedBudgetRow();
}

function highlightSelectedBudgetRow() {
    bodyHistory.querySelectorAll('tr.history-row').forEach(row => {
        const rowBudgetId = parseInt(row.dataset.id, 10);
        if (selectedBudgetId && rowBudgetId === selectedBudgetId) {
            row.classList.add('selected-row');
        } else {
            row.classList.remove('selected-row');
        }
    });
}


function deleteSingleBudget(id) {
    const budgetToDelete = budgetList.find(item => item.id === id);
    const clientName = budgetToDelete ? budgetToDelete.clientName : 'Cliente';

    budgetList = budgetList.filter(item => item.id !== id);
    if (selectedBudgetId === id) {
        selectedBudgetId = null;
        if (quoteFormTitle) {
            quoteFormTitle.textContent = 'Nueva Cotización';
        }
    }
    
    // Guardar cambios en localStorage
    saveBudgetsToLocalStorage();
    
    // También eliminar de Supabase si está disponible (de forma asincrónica)
    if (isSupabaseEnabled && supabase && budgetToDelete) {
        eliminarPresupuestoSupabase(id).then((success) => {
            if (success) {
                console.log("✅ Presupuesto sincronizado: eliminado de Supabase");
            } else {
                console.warn("⚠️ No se pudo eliminar de Supabase, pero se quitó del historial local");
            }
        }).catch((error) => {
            console.error("❌ Error al intentar eliminar de Supabase:", error);
        });
    }
    
    renderHistoryTable(searchHistory.value);
    showToast(translateMessage('quoteDeleted', { clientName }), 'error');
}

function clearAllHistory() {
    budgetList = [];
    selectedBudgetId = null;
    saveBudgetsToLocalStorage();
    renderHistoryTable();
    showToast(translateMessage('historyCleared'), 'error');
}

// Modal de limpieza
btnClearHistory.addEventListener('click', () => {
    if (budgetList.length === 0) return;
    modalConfirm.classList.add('open');
});

modalBtnCancel.addEventListener('click', () => modalConfirm.classList.remove('open'));
modalBtnConfirm.addEventListener('click', () => {
    clearAllHistory();
    modalConfirm.classList.remove('open');
});

modalConfirm.addEventListener('click', (e) => {
    if (e.target === modalConfirm) modalConfirm.classList.remove('open');
});

searchHistory.addEventListener('input', (e) => {
    renderHistoryTable(e.target.value);
});

budgetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const isClientValid = validateTextField(inputClientName);
    const isDeviceValid = validateTextField(inputDeviceModel);
    const isPartsValid = validateNumericField(inputPartsCost, errorPartsCost);
    const isLaborValid = validateNumericField(inputLaborCost, errorLaborCost);

    if (isClientValid && isDeviceValid && isPartsValid && isLaborValid) {
        addNewBudget();
    } else {
        showToast(translateMessage('formIncompleteBudget'), 'error');
    }
});

// ==========================================================================
// 8. ESCUCHA DE CAMBIO DE ESTADO DE SESIÓN (PERSISTENCIA AL CARGAR)
// ==========================================================================

window.addEventListener('DOMContentLoaded', () => {
    updateBreakdownPreview();

    if (isFirebaseEnabled) {
        // Listener nativo de sesión de Firebase
        authService.onAuthStateChanged((user) => {
            if (user) {
                // Hay sesión de Firebase activa: restauramos datos pero SIN navegar automáticamente
                restoreSession(user.email);
            } else {
                // No hay sesión activa en Firebase, redirigimos a la landing
                currentUser = null;
                navigateTo('landingSection');
                setAuthMode('login');
            }
        });
    } else {
        // Validación de sesión activa simulada al recargar página
        const simulatedSession = localStorage.getItem(STORAGE_SESSION_KEY);
        if (simulatedSession) {
            // Restauramos datos de sesión sin forzar la navegación
            restoreSession(simulatedSession);
            navigateTo('landingSection');
            setAuthMode('login');
        } else {
            currentUser = null;
            navigateTo('landingSection');
            setAuthMode('login');
        }
    }

    initLanguageSwitcher();

    const savedLanguage = localStorage.getItem('acManagerLanguage');
    if (savedLanguage && TRANSLATIONS[savedLanguage]) {
        currentLanguage = savedLanguage;
    }
    translatePage(currentLanguage);

    initSectionLoaderLinks();
});
