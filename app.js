/**
 * PROYECTO ESCOLAR: CALCULADORA E HISTORIAL DE PRESUPUESTOS PARA SERVICIOS TÉCNICOS
 * Tema 4 - 3ero de Bachillerato en Informática
 * 
 * ARCHIVO: app.js (FASE 2: CON EXPLICACIÓN Y AUTENTICACIÓN FIREBASE / SIMULADA)
 * Propósito: Gestionar el enrutamiento de vistas, la lógica de autenticación e inicio de sesión
 *            (tanto con Firebase real como en modo simulación local), el envío simulado de correos,
 *            así como el control total de los presupuestos y el historial con persistencia.
 */

// ==========================================================================
// 1. CONFIGURACIÓN DE FIREBASE (LISTO PARA TUS CREDENCIALES REALES)
// ==========================================================================
// Reemplaza los datos dentro del objeto si deseas conectarte a tu proyecto real de Firebase.
const firebaseConfig = {
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};

// Variable de control para saber si se usará Firebase real o el Simulador Local
let isFirebaseEnabled = false;
let authService = null; // Guardará la referencia a Firebase Auth si está activo

// Intentamos inicializar Firebase si las llaves han sido ingresadas
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "TU_API_KEY_AQUI") {
    try {
        firebase.initializeApp(firebaseConfig);
        authService = firebase.auth();
        isFirebaseEnabled = true;
        console.log("Firebase Auth: Inicializado con éxito.");
    } catch (error) {
        console.error("Firebase Auth: Fallo al inicializar con los parámetros provistos.", error);
    }
} else {
    console.log("Firebase Auth: Usando Modo de Simulación de Base de Datos Local.");
}

// ==========================================================================
// 2. SELECCIÓN DE ELEMENTOS DEL DOM
// ==========================================================================

// Secciones Principales (Vistas)
const landingSection = document.getElementById('landingSection');
const authSection = document.getElementById('authSection');
const calculatorSection = document.getElementById('calculatorSection');

// Botones de Navegación entre Vistas
const btnEnterApp = document.getElementById('btnEnterApp');
const btnBackToLanding = document.getElementById('btnBackToLanding');
const btnLogout = document.getElementById('btnLogout');

// Elementos de la Pantalla de Autenticación
const authForm = document.getElementById('authForm');
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const inputAuthEmail = document.getElementById('authEmail');
const inputAuthPassword = document.getElementById('authPassword');
const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
const inputAuthConfirmPassword = document.getElementById('authConfirmPassword');
const btnForgotPassword = document.getElementById('btnForgotPassword');
const btnAuthSubmit = document.getElementById('btnAuthSubmit');
const dbStatusLabel = document.getElementById('dbStatusLabel');

// Alertas de Error de Autenticación
const errorAuthEmail = document.getElementById('authEmailError');
const errorAuthPassword = document.getElementById('authPasswordError');
const errorAuthConfirmPassword = document.getElementById('authConfirmPasswordError');

// --- Elementos de la Calculadora (Manteniendo la estructura anterior) ---
const budgetForm = document.getElementById('budgetForm');
const inputClientName = document.getElementById('clientName');
const inputDeviceModel = document.getElementById('deviceModel');
const inputPartsCost = document.getElementById('partsCost');
const inputLaborCost = document.getElementById('laborCost');

const errorClientName = document.getElementById('clientNameError');
const errorDeviceModel = document.getElementById('deviceModelError');
const errorPartsCost = document.getElementById('partsCostError');
const errorLaborCost = document.getElementById('laborCostError');

const lblSubtotal = document.getElementById('lblSubtotal');
const lblIva = document.getElementById('lblIva');
const lblTotal = document.getElementById('lblTotal');
const barParts = document.getElementById('barParts');
const barLabor = document.getElementById('barLabor');
const barIva = document.getElementById('barIva');
const partsPercentLabel = document.getElementById('partsPercent');
const laborPercentLabel = document.getElementById('laborPercent');
const ivaPercentLabel = document.getElementById('ivaPercent');
const deviceSuggestions = document.getElementById('deviceSuggestions');

const bodyHistory = document.getElementById('bodyHistory');
const searchHistory = document.getElementById('searchHistory');
const recordsBadge = document.getElementById('recordsBadge');
const btnClearHistory = document.getElementById('btnClearHistory');

const toastContainer = document.getElementById('toastContainer');
const modalConfirm = document.getElementById('modalConfirm');
const modalBtnCancel = document.getElementById('modalBtnCancel');
const modalBtnConfirm = document.getElementById('modalBtnConfirm');
const pageLoader = document.getElementById('pageLoader');
const languageToggle = document.getElementById('languageToggle');
const selectedLanguage = document.getElementById('selectedLanguage');
const languageOptions = document.getElementById('languageOptions');
const languageOptionButtons = document.querySelectorAll('.language-option');
let loaderTimeoutId = null;

function initLanguageSwitcher() {
    if (!languageToggle || !languageOptions || !selectedLanguage) return;

    const closeLanguageMenu = () => {
        languageOptions.classList.add('hidden');
        languageToggle.setAttribute('aria-expanded', 'false');
    };

    languageToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = !languageOptions.classList.contains('hidden');
        if (isOpen) {
            closeLanguageMenu();
        } else {
            languageOptions.classList.remove('hidden');
            languageToggle.setAttribute('aria-expanded', 'true');
        }
    });

    document.addEventListener('click', (event) => {
        if (!languageToggle.contains(event.target) && !languageOptions.contains(event.target)) {
            closeLanguageMenu();
        }
    });

    languageOptionButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const selectedText = button.textContent.trim();
            selectedLanguage.textContent = selectedText;
            languageOptionButtons.forEach((option) => option.classList.remove('active'));
            button.classList.add('active');
            closeLanguageMenu();
            if (typeof showToast === 'function') {
                showToast(`Idioma cambiado a ${selectedText}.`, 'success');
            }
        });
    });
}

// ==========================================================================
// 3. ESTADOS Y ALMACENAMIENTO DE LA APP
// ==========================================================================
let budgetList = [];
let currentUser = null; // Almacenará el usuario logueado actualmente
let authMode = 'login'; // Puede ser 'login' o 'register'

// Claves únicas de LocalStorage
const STORAGE_BUDGET_KEY = 'soporteTec_presupuestos';
const STORAGE_USERS_KEY = 'soporteTec_usuarios_simulados'; // BD de usuarios simulada
const STORAGE_SESSION_KEY = 'soporteTec_sesion_activa';  // Persistencia de sesión simulada

// ==========================================================================
// 4. SISTEMA DE ENRUTAMIENTO Y TRANSICIÓN DE PANTALLAS
// ==========================================================================

/**
 * Alterna la visibilidad de las secciones añadiendo/quitando la clase '.hidden'
 * @param {string} sectionToShow - ID de la sección que se desea activar
 */
function navigateTo(sectionToShow) {
    // Lista de todas las vistas principales
    const sections = [landingSection, authSection, calculatorSection];
    
    sections.forEach(section => {
        if (section.id === sectionToShow) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });
}

// Vinculación de eventos de botones de navegación
btnEnterApp.addEventListener('click', () => {
    showLoader(500);
    setTimeout(() => navigateTo('authSection'), 200);
});

btnBackToLanding.addEventListener('click', () => {
    showLoader(500);
    setTimeout(() => navigateTo('landingSection'), 200);
});

function showLoader(duration = 500) {
    if (!pageLoader) return;
    clearTimeout(loaderTimeoutId);
    pageLoader.classList.remove('hidden');
    loaderTimeoutId = setTimeout(() => {
        hideLoader();
    }, duration);
}

function hideLoader() {
    if (!pageLoader) return;
    clearTimeout(loaderTimeoutId);
    pageLoader.classList.add('hidden');
}

function initSectionLoaderLinks() {
    document.querySelectorAll('.landing-nav a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetSection = document.querySelector(link.getAttribute('href'));
            if (!targetSection) return;

            showLoader(600);
            setTimeout(() => {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 220);
        });
    });
}

// ==========================================================================
// 5. CONTROLADOR DE TABS DE AUTENTICACIÓN (LOGIN VS REGISTRO)
// ==========================================================================

/**
 * Alterna el modo del formulario entre "Iniciar Sesión" y "Crear Cuenta"
 * @param {string} mode - El modo al que se desea cambiar ('login' o 'register')
 */
function setAuthMode(mode) {
    authMode = mode;
    
    // Reseteamos errores visuales de autenticación
    resetAuthErrors();

    if (mode === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        
        authTitle.textContent = "Bienvenido de Nuevo";
        authSubtitle.textContent = "Ingresa tus credenciales para acceder a la calculadora.";
        
        // Ocultar confirmación de contraseña y enlace de "¿Olvidaste tu contraseña?"
        confirmPasswordGroup.classList.add('hidden');
        btnForgotPassword.classList.remove('hidden');
        
        btnAuthSubmit.querySelector('span').textContent = "Iniciar Sesión";
    } else {
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
        
        authTitle.textContent = "Crea tu Cuenta";
        authSubtitle.textContent = "Regístrate como técnico autorizado de SoporteTec.";
        
        // Mostrar confirmación de contraseña y ocultar olvido de contraseña
        confirmPasswordGroup.classList.remove('hidden');
        btnForgotPassword.classList.add('hidden');
        
        btnAuthSubmit.querySelector('span').textContent = "Crear Cuenta";
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
        showToast("Por favor, corrige los errores en el formulario de acceso.", "error");
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
                showToast(`Sesión iniciada con Firebase: ${user.email}`);
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
                showToast(`Cuenta de Firebase creada: ${user.email}`);
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
            showToast("El correo electrónico no está registrado en el simulador.", "error");
            inputAuthEmail.closest('.form-group').classList.add('has-error');
            return;
        }
        
        if (userFound.password !== password) {
            showToast("Contraseña incorrecta.", "error");
            inputAuthPassword.closest('.form-group').classList.add('has-error');
            return;
        }

        // Éxito en el login simulado
        showToast('Se inició correctamente');

        // Guardamos estado de sesión en localStorage para persistencia de sesión
        localStorage.setItem(STORAGE_SESSION_KEY, userFound.email);
        handleSuccessfulLogin(userFound.email);

    } else {
        // Comprobar si el usuario ya existe
        const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (userExists) {
            showToast("Este correo electrónico ya está registrado.", "error");
            inputAuthEmail.closest('.form-group').classList.add('has-error');
            return;
        }

        // Registrar nuevo usuario ficticio
        const newUser = { email, password };
        users.push(newUser);
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));

        // No iniciar sesión automáticamente: requerimos que el usuario inicie sesión después de crear la cuenta
        showToast('Cuenta creada correctamente. Por favor, inicie sesión.', 'success');
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
        showToast("Por favor, ingresa un correo electrónico válido en el campo superior.", "error");
        inputAuthEmail.closest('.form-group').classList.add('has-error');
        return;
    }

    if (isFirebaseEnabled) {
        // Llamada nativa a Firebase para enviar correo de restablecimiento real
        authService.sendPasswordResetEmail(email)
            .then(() => {
                showToast(`Se ha enviado un correo real de restablecimiento de contraseña a: ${email}. Revisa tu bandeja de entrada.`);
            })
            .catch((error) => {
                showToast(translateFirebaseError(error.code), "error");
            });
    } else {
        // Simulación visual del correo de restablecimiento
        showToast(`[SIMULACIÓN] Correo enviado con éxito a: ${email}. En un entorno real con Firebase, el método 'sendPasswordResetEmail' enviaría un enlace de recuperación.`);
    }
});

/**
 * Traduce códigos de error técnicos de Firebase Auth al español
 * @param {string} code - Código de error de Firebase
 * @returns {string} - Mensaje en español
 */
function translateFirebaseError(code) {
    switch (code) {
        case 'auth/invalid-email': return 'Formato de correo electrónico inválido.';
        case 'auth/user-disabled': return 'Esta cuenta ha sido inhabilitada.';
        case 'auth/user-not-found': return 'No existe ningún usuario registrado con este correo.';
        case 'auth/wrong-password': return 'Contraseña incorrecta.';
        case 'auth/email-already-in-use': return 'Este correo ya está asociado a otra cuenta.';
        case 'auth/weak-password': return 'La contraseña debe tener mínimo 6 caracteres.';
        default: return 'Ocurrió un error en el servidor de autenticación.';
    }
}

/**
 * Al loguearse correctamente, carga el estado y redirige a la calculadora principal
 * @param {string} email - Correo del usuario activo
 */
function handleSuccessfulLogin(email) {
    currentUser = email;
    
    // Cambiar la etiqueta de la base de datos según si está Firebase activo o local
    dbStatusLabel.textContent = isFirebaseEnabled ? "Firebase Cloud" : "Local DB";
    
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
function restoreSession(email) {
    currentUser = email;
    dbStatusLabel.textContent = isFirebaseEnabled ? "Firebase Cloud" : "Local DB";
    loadBudgetsFromLocalStorage();
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
                showToast("Sesión de Firebase cerrada.");
            });
    } else {
        currentUser = null;
        localStorage.removeItem(STORAGE_SESSION_KEY);
        navigateTo('authSection');
        showToast("Sesión local finalizada.");
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
        deviceSuggestions.innerHTML = `<div class="device-suggestion-item">No se encontraron dispositivos</div>`;
        deviceSuggestions.classList.remove('hidden');
        return;
    }

    deviceSuggestions.innerHTML = items.map(device => `
        <button type="button" class="device-suggestion-item" data-device="${device.name}" title="Seleccionar ${device.name}">
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

    recordsBadge.textContent = `${budgetList.length} Cotizaciones`;
    btnClearHistory.disabled = budgetList.length === 0;

    if (filteredList.length === 0) {
        const trEmpty = document.createElement('tr');
        trEmpty.className = 'empty-row-placeholder';
        
        let emptyMessage = 'No hay presupuestos registrados en el historial.';
        if (query !== '') {
            emptyMessage = `No se encontraron resultados para "${filterText}".`;
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
        const displayId = `#${String(item.id).slice(-6)}`;

        tr.innerHTML = `
            <td class="col-id" title="ID completo: ${item.id}">${displayId}</td>
            <td>${escapeHTML(item.clientName)}</td>
            <td>${escapeHTML(item.deviceModel)}</td>
            <td class="col-total">${formatCurrency(item.total)}</td>
            <td>${item.date}</td>
            <td class="col-actions">
                <button class="btn-delete-row" data-id="${item.id}" title="Eliminar este presupuesto">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </td>
        `;
        bodyHistory.appendChild(tr);
    });

    const deleteButtons = bodyHistory.querySelectorAll('.btn-delete-row');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const budgetId = parseInt(btn.getAttribute('data-id'));
            deleteSingleBudget(budgetId);
        });
    });
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
 */
function addNewBudget() {
    const partsCost = parseFloat(inputPartsCost.value) || 0;
    const laborCost = parseFloat(inputLaborCost.value) || 0;
    
    const subtotal = partsCost + laborCost;
    const iva = subtotal * 0.15;
    const total = subtotal + iva;

    const newBudget = {
        id: Date.now(),
        ownerEmail: currentUser, // Registramos qué técnico guardó este presupuesto
        clientName: inputClientName.value.trim(),
        deviceModel: inputDeviceModel.value.trim(),
        partsCost: partsCost,
        laborCost: laborCost,
        subtotal: subtotal,
        iva: iva,
        total: total,
        date: getCurrentFormattedDate()
    };

    budgetList.push(newBudget);
    saveBudgetsToLocalStorage();
    renderHistoryTable(searchHistory.value);
    showToast(`Presupuesto para ${newBudget.clientName} guardado.`);

    budgetForm.reset();
    updateBreakdownPreview();
}

function deleteSingleBudget(id) {
    const budgetToDelete = budgetList.find(item => item.id === id);
    const clientName = budgetToDelete ? budgetToDelete.clientName : 'Cliente';

    budgetList = budgetList.filter(item => item.id !== id);
    saveBudgetsToLocalStorage();
    renderHistoryTable(searchHistory.value);
    showToast(`Presupuesto de ${clientName} eliminado.`, 'error');
}

function clearAllHistory() {
    budgetList = [];
    saveBudgetsToLocalStorage();
    renderHistoryTable();
    showToast('El historial del técnico ha sido vaciado.', 'error');
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
        showToast('Por favor, completa los campos del presupuesto.', 'error');
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
    initSectionLoaderLinks();
});
