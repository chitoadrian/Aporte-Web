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

let currentLanguage = 'es';
let loaderTimeoutId = null;

const TRANSLATIONS = {
    es: {
        languageName: 'Español',
        pageTitle: 'AC Manager - Gestor Profesional de Presupuestos',
        metaDescription: 'Gestor de presupuestos para talleres técnicos: cotiza, guarda y consulta servicios con una interfaz profesional.',
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
        benefitsHeader: 'Qué ganas al usar AC Manager',
        benefit1Title: 'Más eficiencia',
        benefit1Desc: 'Reduce el tiempo en formular una cotización y atiende más clientes por día.',
        benefit2Title: 'Menos errores',
        benefit2Desc: 'Los cálculos automáticos evitan fallos en impuestos y totales.',
        benefit3Title: 'Mayor confianza',
        benefit3Desc: 'Presenta presupuestos profesionales que generan seguridad en tus clientes.',
        benefit4Title: 'Historial organizado',
        benefit4Desc: 'Mantén todos tus trabajos guardados y listos para consulta futura.',
        btnEnterAppText: 'Comenzar ahora',
        authTabLogin: 'Iniciar Sesión',
        authTabRegister: 'Crear Cuenta',
        authTitleLogin: 'Bienvenido de Nuevo',
        authSubtitleLogin: 'Ingresa tus credenciales para acceder a la calculadora.',
        authTitleRegister: 'Crea tu Cuenta',
        authSubtitleRegister: 'Regístrate como técnico autorizado de SoporteTec.',
        authEmailLabel: 'Correo Electrónico',
        authEmailPlaceholder: 'correo@ejemplo.com',
        authEmailError: 'Escribe un correo electrónico válido',
        authPasswordLabel: 'Contraseña',
        authPasswordPlaceholder: '••••••••',
        authPasswordError: 'La contraseña debe tener al menos 6 caracteres',
        authConfirmPasswordLabel: 'Confirmar Contraseña',
        authConfirmPasswordPlaceholder: '••••••••',
        authConfirmPasswordError: 'Las contraseñas no coinciden',
        btnForgotPassword: '¿Olvidaste tu contraseña?',
        btnAuthSubmitLogin: 'Iniciar Sesión',
        btnAuthSubmitRegister: 'Crear Cuenta',
        btnBackToLandingText: 'Volver al Inicio',
        btnBackToLandingTitle: 'Volver al Inicio',
        btnLogoutText: 'Cerrar Sesión',
        btnLogoutTitle: 'Cerrar Sesión',
        landingTagline: 'Herramientas Profesionales de Gestión',
        calculatorTagline: 'Calculadora de Presupuestos y Servicios Técnicos',
        quoteFormTitle: 'Nueva Cotización',
        clientNameLabel: 'Nombre del Cliente',
        clientNamePlaceholder: 'Ej. Juan Pérez',
        clientNameError: 'Este campo es obligatorio',
        deviceModelLabel: 'Dispositivo / Equipo',
        deviceModelPlaceholder: 'Buscar o seleccionar dispositivo...',
        deviceInputNote: 'Escribe para filtrar laptops, computadoras, componentes y marcas como Asus, HP, Dell, Lenovo, MSI.',
        deviceModelError: 'Este campo es obligatorio',
        partsCostLabel: 'Costo Repuestos ($)',
        partsCostPlaceholder: '0.00',
        partsCostError: 'Mínimo 0',
        laborCostLabel: 'Mano de Obra ($)',
        laborCostPlaceholder: '0.00',
        laborCostError: 'Mínimo 0',
        btnCalculateText: 'Calcular y Guardar',
        dbStatusLabel: 'Local DB',
        livePreviewBadge: 'Vista Previa En Vivo',
        breakdownTitle: 'Desglose del Presupuesto',
        subtotalLabel: 'Subtotal (Repuestos + Mano de Obra)',
        ivaLabel: 'IVA (15%)',
        totalLabel: 'Total General',
        chartTitle: 'Gráfico de costos',
        partsLabel: 'Repuestos',
        laborLabel: 'Mano de obra',
        ivaChartLabel: 'IVA',
        historyTitle: 'Historial de Cotizaciones',
        searchHistoryPlaceholder: 'Buscar por cliente o equipo...',
        historyEmptyText: 'No hay presupuestos registrados en el historial.',
        btnClearHistoryText: 'Limpiar Todo el Historial',
        footerLine1: '© 2026 AC Manager. Gestión profesional de presupuestos para servicios técnicos.',
        footerLine2: 'Demostración funcional | Taller y proyecto técnico',
        modalTitle: '¿Estás seguro de continuar?',
        modalDescription: 'Esta acción eliminará de forma permanente todas las cotizaciones guardadas en el historial. Esta operación no se puede deshacer.',
        modalBtnCancel: 'Cancelar',
        modalBtnConfirm: 'Sí, borrar todo',
        authFormInvalid: 'Por favor, corrige los errores en el formulario de acceso.',
        firebaseLoginSuccess: 'Sesión iniciada con Firebase: {email}',
        firebaseAccountCreated: 'Cuenta de Firebase creada: {email}',
        simulatorEmailNotRegistered: 'El correo electrónico no está registrado en el simulador.',
        simulatorWrongPassword: 'Contraseña incorrecta.',
        simulatorLoginSuccess: 'Se inició correctamente.',
        simulatorEmailAlreadyRegistered: 'Este correo electrónico ya está registrado.',
        simulatorAccountCreated: 'Cuenta creada correctamente. Por favor, inicie sesión.',
        passwordResetInvalidEmail: 'Por favor, ingresa un correo electrónico válido en el campo superior.',
        passwordResetSentFirebase: 'Se ha enviado un correo real de restablecimiento de contraseña a: {email}. Revisa tu bandeja de entrada.',
        passwordResetSentSimulator: '[SIMULACIÓN] Correo enviado con éxito a: {email}. En un entorno real con Firebase, el método \"sendPasswordResetEmail\" enviaría un enlace de recuperación.',
        firebaseSessionClosed: 'Sesión de Firebase cerrada.',
        localSessionClosed: 'Sesión local finalizada.',
        quoteSaved: 'Presupuesto para {clientName} guardado.',
        quoteDeleted: 'Presupuesto de {clientName} eliminado.',
        historyCleared: 'El historial del técnico ha sido vaciado.',
        historyNoResults: 'No se encontraron resultados para "{query}".',
        firebaseErrorInvalidEmail: 'Formato de correo electrónico inválido.',
        firebaseErrorUserDisabled: 'Esta cuenta ha sido inhabilitada.',
        firebaseErrorUserNotFound: 'No existe ningún usuario registrado con este correo.',
        firebaseErrorWrongPassword: 'Contraseña incorrecta.',
        firebaseErrorEmailAlreadyInUse: 'Este correo ya está asociado a otra cuenta.',
        firebaseErrorWeakPassword: 'La contraseña debe tener mínimo 6 caracteres.',
        firebaseErrorDefault: 'Ocurrió un error en el servidor de autenticación.',
        formIncompleteBudget: 'Por favor, completa los campos del presupuesto.',
        recordsBadge: '{count} cotizaciones',
        deleteRowTitle: 'Eliminar este presupuesto',
        deviceNoResults: 'No se encontraron dispositivos',
        deviceSelectTitle: 'Seleccionar {device}',
        fullIdTitle: 'ID completo: {id}',
        dbStatusFirebase: 'Firebase Cloud',
        dbStatusLocal: 'BD Local',
        languageChanged: 'Idioma cambiado a {lang}.',
    },
    en: {
        languageName: 'English',
        pageTitle: 'AC Manager - Professional Quotation Manager',
        metaDescription: 'Quotation manager for technical workshops: quote, save and review service budgets with a professional interface.',
        navFeatures: 'Features',
        navSolutions: 'Solutions',
        navBenefits: 'Benefits',
        heroBadge: 'Professional Technical Solution',
        heroTitle: 'Manage quotes with accuracy and corporate design',
        heroDescription: 'AC Manager is a tool designed for technical workshops that need to quote services, control parts costs, and keep an organized history that is easy to consult.',
        whyTitle: 'Why choose AC Manager?',
        costPrecisionTitle: 'Cost Accuracy',
        costPrecisionDesc: 'Automatically adds parts and labor to prevent manual calculation errors.',
        taxCalcTitle: 'Tax Calculation',
        taxCalcDesc: 'Instantly applies the 15% VAT rate on the service subtotal.',
        internalDatabaseTitle: 'Internal Database',
        internalDatabaseDesc: 'Saves and persists history records using localStorage intelligently.',
        usageGuideTitle: 'Quick Start Guide',
        guideStep1Title: 'Sign in securely',
        guideStep1Desc: 'Log in to access the technician-only panel and work with protected data.',
        guideStep2Title: 'Enter the Data',
        guideStep2Desc: 'Type the client name, device and service costs.',
        guideStep3Title: 'Save and History',
        guideStep3Desc: 'See the breakdown in real time and save the quote to persistent history.',
        featuresLabel: 'Features',
        featuresHeader: 'Automate every step of your workflow',
        feature1Title: 'Instant record',
        feature1Desc: 'Save quotes and check history with a single click.',
        feature2Title: 'Clear breakdown',
        feature2Desc: 'View subtotal, VAT and total in an organized way.',
        feature3Title: 'Fast reports',
        feature3Desc: 'Generate professional-looking quotes for your clients.',
        feature4Title: 'Access control',
        feature4Desc: 'Session and history are linked to the technician who logs in.',
        solutionsLabel: 'Solutions',
        solutionsHeader: 'Solve real problems in your workshop',
        solutionsDescription: 'AC Manager centralizes your quotes, avoids manual calculations and reduces customer response times.',
        solutionItem1: 'Basic inventory control and parts cost tracking.',
        solutionItem2: 'Accessible history for every saved quote.',
        solutionItem3: 'Clear interface for technicians and managers.',
        benefitsLabel: 'Benefits',
        benefitsHeader: 'What you gain by using AC Manager',
        benefit1Title: 'More efficiency',
        benefit1Desc: 'Reduce the time needed to create a quote and serve more customers per day.',
        benefit2Title: 'Fewer errors',
        benefit2Desc: 'Automatic calculations prevent mistakes in taxes and totals.',
        benefit3Title: 'More confidence',
        benefit3Desc: 'Present professional quotes that build customer trust.',
        benefit4Title: 'Organized history',
        benefit4Desc: 'Keep all your jobs saved and ready for future review.',
        btnEnterAppText: 'Start now',
        authTabLogin: 'Log In',
        authTabRegister: 'Sign Up',
        authTitleLogin: 'Welcome Back',
        authSubtitleLogin: 'Enter your credentials to access the calculator.',
        authTitleRegister: 'Create Your Account',
        authSubtitleRegister: 'Register as an authorized SuporteTec technician.',
        authEmailLabel: 'Email Address',
        authEmailPlaceholder: 'email@example.com',
        authEmailError: 'Enter a valid email address',
        authPasswordLabel: 'Password',
        authPasswordPlaceholder: '••••••••',
        authPasswordError: 'Password must be at least 6 characters',
        authConfirmPasswordLabel: 'Confirm Password',
        authConfirmPasswordPlaceholder: '••••••••',
        authConfirmPasswordError: 'Passwords do not match',
        btnForgotPassword: 'Forgot your password?',
        btnAuthSubmitLogin: 'Log In',
        btnAuthSubmitRegister: 'Sign Up',
        btnBackToLandingText: 'Back to Home',
        btnBackToLandingTitle: 'Back to Home',
        btnLogoutText: 'Log Out',
        btnLogoutTitle: 'Log Out',
        landingTagline: 'Professional Management Tools',
        calculatorTagline: 'Budget and Service Calculator',
        quoteFormTitle: 'New Quote',
        clientNameLabel: 'Client Name',
        clientNamePlaceholder: 'Ex. John Doe',
        clientNameError: 'This field is required',
        deviceModelLabel: 'Device / Equipment',
        deviceModelPlaceholder: 'Search or select a device...',
        deviceInputNote: 'Type to filter laptops, computers, components and brands like Asus, HP, Dell, Lenovo, MSI.',
        deviceModelError: 'This field is required',
        partsCostLabel: 'Parts Cost ($)',
        partsCostPlaceholder: '0.00',
        partsCostError: 'Minimum 0',
        laborCostLabel: 'Labor Cost ($)',
        laborCostPlaceholder: '0.00',
        laborCostError: 'Minimum 0',
        btnCalculateText: 'Calculate and Save',
        dbStatusLabel: 'Local DB',
        livePreviewBadge: 'Live Preview',
        breakdownTitle: 'Budget Breakdown',
        subtotalLabel: 'Subtotal (Parts + Labor)',
        ivaLabel: 'VAT (15%)',
        totalLabel: 'Total Amount',
        chartTitle: 'Cost chart',
        partsLabel: 'Parts',
        laborLabel: 'Labor',
        ivaChartLabel: 'VAT',
        historyTitle: 'Quotes History',
        searchHistoryPlaceholder: 'Search by client or device...',
        historyEmptyText: 'No quotes recorded in history.',
        btnClearHistoryText: 'Clear Full History',
        footerLine1: '© 2026 AC Manager. Professional budget management for technical services.',
        footerLine2: 'Working demo | Workshop and technical project',
        modalTitle: 'Are you sure you want to continue?',
        modalDescription: 'This action will permanently remove all saved quotes from history. This operation cannot be undone.',
        modalBtnCancel: 'Cancel',
        modalBtnConfirm: 'Yes, delete all',
        authFormInvalid: 'Please fix the errors in the login form.',
        firebaseLoginSuccess: 'Logged in with Firebase: {email}',
        firebaseAccountCreated: 'Firebase account created: {email}',
        simulatorEmailNotRegistered: 'The email address is not registered in the simulator.',
        simulatorWrongPassword: 'Incorrect password.',
        simulatorLoginSuccess: 'Logged in successfully.',
        simulatorEmailAlreadyRegistered: 'This email address is already registered.',
        simulatorAccountCreated: 'Account created successfully. Please log in.',
        passwordResetInvalidEmail: 'Please enter a valid email address in the top field.',
        passwordResetSentFirebase: 'A real password reset email has been sent to: {email}. Check your inbox.',
        passwordResetSentSimulator: '[SIMULATION] Email successfully sent to: {email}. In a real Firebase setup, sendPasswordResetEmail would send a recovery link.',
        firebaseSessionClosed: 'Firebase session closed.',
        localSessionClosed: 'Local session ended.',
        quoteSaved: 'Quote for {clientName} saved.',
        quoteDeleted: 'Quote for {clientName} deleted.',
        historyCleared: 'Technician history has been cleared.',
        historyNoResults: 'No results found for "{query}".',
        firebaseErrorInvalidEmail: 'Invalid email format.',
        firebaseErrorUserDisabled: 'This account has been disabled.',
        firebaseErrorUserNotFound: 'No registered user found with that email.',
        firebaseErrorWrongPassword: 'Incorrect password.',
        firebaseErrorEmailAlreadyInUse: 'This email is already associated with another account.',
        firebaseErrorWeakPassword: 'Password must be at least 6 characters.',
        firebaseErrorDefault: 'An authentication server error occurred.',
        formIncompleteBudget: 'Please complete the quote fields.',
        recordsBadge: '{count} quotes',
        deleteRowTitle: 'Delete this quote',
        deviceNoResults: 'No devices found',
        deviceSelectTitle: 'Select {device}',
        fullIdTitle: 'Full ID: {id}',
        dbStatusFirebase: 'Firebase Cloud',
        dbStatusLocal: 'Local DB',
        languageChanged: 'Language changed to {lang}.',
    },
    pt: {
        languageName: 'Português',
        pageTitle: 'AC Manager - Gerenciador Profissional de Orçamentos',
        metaDescription: 'Gerenciador de orçamentos para oficinas técnicas: orce, salve e consulte serviços com uma interface profissional.',
        navFeatures: 'Funcionalidades',
        navSolutions: 'Soluções',
        navBenefits: 'Benefícios',
        heroBadge: 'Solução Técnica Profissional',
        heroTitle: 'Gerencie orçamentos com precisão e design corporativo',
        heroDescription: 'O AC Manager é uma ferramenta para oficinas técnicas que precisam orçar serviços, controlar custos de peças e manter um histórico organizado e fácil de consultar.',
        whyTitle: 'Por que escolher o AC Manager?',
        costPrecisionTitle: 'Precisão de Custos',
        costPrecisionDesc: 'Soma automaticamente peças e mão de obra para evitar erros manuais de cálculo.',
        taxCalcTitle: 'Cálculo de Impostos',
        taxCalcDesc: 'Aplica instantaneamente a taxa de IVA de 15% sobre o subtotal dos serviços.',
        internalDatabaseTitle: 'Banco de Dados Interno',
        internalDatabaseDesc: 'Salva e persiste os registros do histórico usando localStorage de forma inteligente.',
        usageGuideTitle: 'Guia de Uso Rápido',
        guideStep1Title: 'Acesse com segurança',
        guideStep1Desc: 'Faça login para acessar o painel exclusivo para técnicos e trabalhar com dados protegidos.',
        guideStep2Title: 'Insira os Dados',
        guideStep2Desc: 'Digite o nome do cliente, dispositivo e custos do serviço técnico.',
        guideStep3Title: 'Salve e Histórico',
        guideStep3Desc: 'Veja o detalhamento em tempo real e salve o orçamento no histórico persistente.',
        featuresLabel: 'Funcionalidades',
        featuresHeader: 'Automatize cada etapa do seu fluxo de trabalho',
        feature1Title: 'Registro instantâneo',
        feature1Desc: 'Salve orçamentos e consulte o histórico com um único clique.',
        feature2Title: 'Detalhamento claro',
        feature2Desc: 'Visualize subtotal, IVA e total de forma organizada.',
        feature3Title: 'Relatórios rápidos',
        feature3Desc: 'Gere orçamentos com layout profissional para seus clientes.',
        feature4Title: 'Controle de acesso',
        feature4Desc: 'Sessão e histórico ficam vinculados ao técnico que entra.',
        solutionsLabel: 'Soluções',
        solutionsHeader: 'Resolva problemas reais da sua oficina',
        solutionsDescription: 'O AC Manager centraliza seus orçamentos, evita cálculos manuais e reduz o tempo de resposta ao cliente.',
        solutionItem1: 'Controle básico de estoque e custos de peças.',
        solutionItem2: 'Histórico acessível para cada orçamento salvo.',
        solutionItem3: 'Interface clara para técnicos e gerentes.',
        benefitsLabel: 'Benefícios',
        benefitsHeader: 'O que você ganha usando o AC Manager',
        benefit1Title: 'Mais eficiência',
        benefit1Desc: 'Reduza o tempo para elaborar um orçamento e atenda mais clientes por dia.',
        benefit2Title: 'Menos erros',
        benefit2Desc: 'Cálculos automáticos evitam falhas em impostos e totais.',
        benefit3Title: 'Mais confiança',
        benefit3Desc: 'Apresente orçamentos profissionais que inspiram confiança aos clientes.',
        benefit4Title: 'Histórico organizado',
        benefit4Desc: 'Mantenha todos os seus trabalhos salvos e prontos para consulta futura.',
        btnEnterAppText: 'Começar agora',
        authTabLogin: 'Entrar',
        authTabRegister: 'Criar Conta',
        authTitleLogin: 'Bem-vindo de volta',
        authSubtitleLogin: 'Digite suas credenciais para acessar a calculadora.',
        authTitleRegister: 'Crie sua conta',
        authSubtitleRegister: 'Cadastre-se como técnico autorizado do SuporteTec.',
        authEmailLabel: 'E-mail',
        authEmailPlaceholder: 'email@exemplo.com',
        authEmailError: 'Digite um e-mail válido',
        authPasswordLabel: 'Senha',
        authPasswordPlaceholder: '••••••••',
        authPasswordError: 'A senha deve ter pelo menos 6 caracteres',
        authConfirmPasswordLabel: 'Confirmar Senha',
        authConfirmPasswordPlaceholder: '••••••••',
        authConfirmPasswordError: 'As senhas não coincidem',
        btnForgotPassword: 'Esqueceu sua senha?',
        btnAuthSubmitLogin: 'Entrar',
        btnAuthSubmitRegister: 'Criar Conta',
        btnBackToLandingText: 'Voltar ao Início',
        btnBackToLandingTitle: 'Voltar ao Início',
        btnLogoutText: 'Sair',
        btnLogoutTitle: 'Sair',
        landingTagline: 'Ferramentas Profissionais de Gestão',
        calculatorTagline: 'Calculadora de Orçamentos e Serviços Técnicos',
        quoteFormTitle: 'Novo Orçamento',
        clientNameLabel: 'Nome do Cliente',
        clientNamePlaceholder: 'Ex. João Silva',
        clientNameError: 'Este campo é obrigatório',
        deviceModelLabel: 'Dispositivo / Equipamento',
        deviceModelPlaceholder: 'Buscar ou selecionar dispositivo...',
        deviceInputNote: 'Digite para filtrar laptops, computadores, componentes e marcas como Asus, HP, Dell, Lenovo, MSI.',
        deviceModelError: 'Este campo é obrigatório',
        partsCostLabel: 'Custo de Peças ($)',
        partsCostPlaceholder: '0,00',
        partsCostError: 'Mínimo 0',
        laborCostLabel: 'Mão de Obra ($)',
        laborCostPlaceholder: '0,00',
        laborCostError: 'Mínimo 0',
        btnCalculateText: 'Calcular e Salvar',
        dbStatusLabel: 'BD Local',
        livePreviewBadge: 'Prévia ao Vivo',
        breakdownTitle: 'Detalhamento do Orçamento',
        subtotalLabel: 'Subtotal (Peças + Mão de Obra)',
        ivaLabel: 'IVA (15%)',
        totalLabel: 'Total Geral',
        chartTitle: 'Gráfico de custos',
        partsLabel: 'Peças',
        laborLabel: 'Mão de obra',
        ivaChartLabel: 'IVA',
        historyTitle: 'Histórico de Orçamentos',
        searchHistoryPlaceholder: 'Buscar por cliente ou equipamento...',
        historyEmptyText: 'Não há orçamentos registrados no histórico.',
        btnClearHistoryText: 'Limpar Todo o Histórico',
        footerLine1: '© 2026 AC Manager. Gestão profissional de orçamentos para serviços técnicos.',
        footerLine2: 'Demonstração funcional | Oficina e projeto técnico',
        modalTitle: 'Tem certeza de que deseja continuar?',
        modalDescription: 'Esta ação excluirá permanentemente todos os orçamentos salvos no histórico. Esta operação não pode ser desfeita.',
        modalBtnCancel: 'Cancelar',
        modalBtnConfirm: 'Sim, apagar tudo',
        authFormInvalid: 'Por favor, corrija os erros no formulário de acesso.',
        firebaseLoginSuccess: 'Sessão iniciada no Firebase: {email}',
        firebaseAccountCreated: 'Conta do Firebase criada: {email}',
        simulatorEmailNotRegistered: 'O e-mail não está registrado no simulador.',
        simulatorWrongPassword: 'Senha incorreta.',
        simulatorLoginSuccess: 'Entrou com sucesso.',
        simulatorEmailAlreadyRegistered: 'Este e-mail já está registrado.',
        simulatorAccountCreated: 'Conta criada com sucesso. Por favor, faça login.',
        passwordResetInvalidEmail: 'Por favor, insira um e-mail válido no campo acima.',
        passwordResetSentFirebase: 'Um e-mail real de redefinição de senha foi enviado para: {email}. Verifique sua caixa de entrada.',
        passwordResetSentSimulator: '[SIMULAÇÃO] E-mail enviado com sucesso para: {email}. Em um ambiente real com Firebase, o método sendPasswordResetEmail enviaria um link de recuperação.',
        firebaseSessionClosed: 'Sessão do Firebase encerrada.',
        localSessionClosed: 'Sessão local finalizada.',
        quoteSaved: 'Orçamento para {clientName} salvo.',
        quoteDeleted: 'Orçamento de {clientName} excluído.',
        historyCleared: 'O histórico do técnico foi limpo.',
        historyNoResults: 'Não foram encontrados resultados para "{query}".',
        firebaseErrorInvalidEmail: 'Formato de e-mail inválido.',
        firebaseErrorUserDisabled: 'Esta conta foi desativada.',
        firebaseErrorUserNotFound: 'Nenhum usuário registrado com este e-mail.',
        firebaseErrorWrongPassword: 'Senha incorreta.',
        firebaseErrorEmailAlreadyInUse: 'Este e-mail já está associado a outra conta.',
        firebaseErrorWeakPassword: 'A senha deve ter pelo menos 6 caracteres.',
        firebaseErrorDefault: 'Ocorreu um erro no servidor de autenticação.',
        formIncompleteBudget: 'Por favor, complete os campos do orçamento.',
        recordsBadge: '{count} orçamentos',
        deleteRowTitle: 'Excluir este orçamento',
        deviceNoResults: 'Nenhum dispositivo encontrado',
        deviceSelectTitle: 'Selecionar {device}',
        fullIdTitle: 'ID completo: {id}',
        dbStatusFirebase: 'Firebase Cloud',
        dbStatusLocal: 'BD Local',
        languageChanged: 'Idioma alterado para {lang}.',
    }
};

function t(key) {
    return TRANSLATIONS[currentLanguage] && TRANSLATIONS[currentLanguage][key] ? TRANSLATIONS[currentLanguage][key] : '';
}

function translateMessage(key, params = {}) {
    const template = t(key);
    return template.replace(/\{(\w+)\}/g, (_, paramName) => params[paramName] != null ? params[paramName] : '');
}

function translatePage(lang) {
    if (!TRANSLATIONS[lang]) {
        lang = 'es';
    }

    currentLanguage = lang;
    document.documentElement.lang = lang;
    document.title = TRANSLATIONS[lang].pageTitle;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.setAttribute('content', TRANSLATIONS[lang].metaDescription);
    }

    document.querySelectorAll('[data-i18n]').forEach((element) => {
        const key = element.dataset.i18n;
        if (key && TRANSLATIONS[lang][key] != null) {
            element.textContent = TRANSLATIONS[lang][key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
        const key = element.dataset.i18nPlaceholder;
        if (key && TRANSLATIONS[lang][key] != null) {
            element.placeholder = TRANSLATIONS[lang][key];
        }
    });

    document.querySelectorAll('[data-i18n-title]').forEach((element) => {
        const key = element.dataset.i18nTitle;
        if (key && TRANSLATIONS[lang][key] != null) {
            element.title = TRANSLATIONS[lang][key];
        }
    });

    if (selectedLanguage) {
        selectedLanguage.textContent = TRANSLATIONS[lang].languageName;
    }

    languageOptionButtons.forEach((option) => {
        if (option.dataset.lang === lang) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });

    setAuthMode(authMode);
}

function getCurrentLanguageLabel() {
    return TRANSLATIONS[currentLanguage] ? TRANSLATIONS[currentLanguage].languageName : 'Español';
}

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
            const lang = button.dataset.lang;
            if (!TRANSLATIONS[lang]) return;

            translatePage(lang);
            localStorage.setItem('acManagerLanguage', lang);
            closeLanguageMenu();

            if (typeof showToast === 'function') {
                const message = TRANSLATIONS[lang].languageChanged.replace('{lang}', TRANSLATIONS[lang].languageName);
                showToast(message, 'success');
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
function restoreSession(email) {
    currentUser = email;
    dbStatusLabel.textContent = translateMessage(isFirebaseEnabled ? 'dbStatusFirebase' : 'dbStatusLocal');
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
        const displayId = `#${String(item.id).slice(-6)}`;

        tr.innerHTML = `
            <td class="col-id" title="${translateMessage('fullIdTitle', { id: item.id })}">${displayId}</td>
            <td>${escapeHTML(item.clientName)}</td>
            <td>${escapeHTML(item.deviceModel)}</td>
            <td class="col-total">${formatCurrency(item.total)}</td>
            <td>${item.date}</td>
            <td class="col-actions">
                <button class="btn-delete-row" data-id="${item.id}" title="${t('deleteRowTitle')}">
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
    showToast(translateMessage('quoteSaved', { clientName: newBudget.clientName }));

    budgetForm.reset();
    updateBreakdownPreview();
}

function deleteSingleBudget(id) {
    const budgetToDelete = budgetList.find(item => item.id === id);
    const clientName = budgetToDelete ? budgetToDelete.clientName : 'Cliente';

    budgetList = budgetList.filter(item => item.id !== id);
    saveBudgetsToLocalStorage();
    renderHistoryTable(searchHistory.value);
    showToast(translateMessage('quoteDeleted', { clientName }), 'error');
}

function clearAllHistory() {
    budgetList = [];
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
