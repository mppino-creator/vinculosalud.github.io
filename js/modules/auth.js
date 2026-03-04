// js/modules/auth.js
import * as state from './state.js';
import { showToast } from './utils.js';
import { renderStaffTable } from './profesionales.js';
import { renderMessagesTable } from './mensajes.js';
import { renderBoxesTable, renderBoxOccupancy } from './boxes.js';
import { updatePaymentMethodsInfo, loadMyConfig } from './personalizacion.js';
import { renderPatients } from './pacientes.js';
import { renderPendingRequests, renderAppointments } from './citas.js';
import { actualizarContadoresReinicio } from './admin.js';

// ============================================
// FUNCIONES DE LOGIN
// ============================================

export function showLoginModal() {
    console.log('🔓 Mostrando modal de login');
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'flex';
    
    // Limpiar campos
    const userInput = document.getElementById('loginUser');
    const passInput = document.getElementById('loginPass');
    const btn = document.getElementById('loginBtn');
    
    if (userInput) userInput.value = '';
    if (passInput) passInput.value = '';
    if (btn) {
        btn.innerHTML = 'Ingresar al Panel';
        btn.disabled = false;
    }
}

export function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';
}

export function processLogin() {
    const user = document.getElementById('loginUser')?.value;
    const pass = document.getElementById('loginPass')?.value;
    const btn = document.getElementById('loginBtn');

    if (!user || !pass) {
        showToast('Ingresa usuario y contraseña', 'error');
        return;
    }

    if (btn) {
        btn.innerHTML = '<span class="spinner"></span> Verificando...';
        btn.disabled = true;
    }

    // Admin por defecto
    if (user === "Admin" && pass === "Nina2026") {
        console.log("✅ Acceso Admin concedido");
        
        const adminUser = {
            id: 9999,
            name: 'Administrador',
            usuario: 'Admin',
            pass: 'Nina2026',
            email: 'admin@vinculosalud.cl',
            isAdmin: true
        };
        
        state.setCurrentUser({ role: 'admin', data: adminUser });
        closeLoginModal();
        
        // Guardar en localStorage
        localStorage.setItem('vinculoCurrentUser', JSON.stringify({ role: 'admin', data: adminUser }));
        
        // Mostrar dashboard directamente
        mostrarDashboardInmediato('admin', adminUser);
        
        if (btn) {
            btn.innerHTML = 'Ingresar al Panel';
            btn.disabled = false;
        }
        return;
    }

    // Buscar en staff
    const foundUser = state.staff.find(s => 
        (s.usuario === user || s.name === user) && s.pass === pass
    );

    if (foundUser) {
        console.log("✅ Acceso profesional concedido:", foundUser.name);
        
        const role = foundUser.isAdmin ? 'admin' : 'psych';
        
        // 🔥 IMPORTANTE: Buscar datos COMPLETOS del profesional en staff
        const psychFullData = state.staff.find(s => s.id == foundUser.id) || foundUser;
        
        // Guardar usuario con TODOS los datos
        state.setCurrentUser({ 
            role, 
            data: psychFullData
        });
        
        closeLoginModal();
        
        // Guardar en localStorage
        const userToStore = {
            role: role,
            data: {
                id: psychFullData.id,
                name: psychFullData.name,
                email: psychFullData.email,
                isAdmin: psychFullData.isAdmin || false,
                usuario: psychFullData.usuario || '',
                genero: psychFullData.genero || ''
            }
        };
        localStorage.setItem('vinculoCurrentUser', JSON.stringify(userToStore));
        
        // Mostrar dashboard directamente
        mostrarDashboardInmediato(role, psychFullData);
        
        // Mostrar mensaje de bienvenida
        const generoEmoji = psychFullData.genero === 'M' ? '♂️' : psychFullData.genero === 'F' ? '♀️' : '';
        showToast(`Bienvenido ${psychFullData.name} ${generoEmoji}`, 'success');
        
    } else {
        showToast('Usuario o contraseña incorrectos', 'error');
    }
    
    if (btn) {
        btn.innerHTML = 'Ingresar al Panel';
        btn.disabled = false;
    }
}

// 🔥 VERSIÓN CORREGIDA - Mostrar dashboard inmediatamente con !important
function mostrarDashboardInmediato(role, userData) {
    console.log('🔄 Mostrando dashboard inmediatamente como:', role);
    
    // Obtener elementos
    const clientView = document.getElementById('clientView');
    const bookingPanel = document.getElementById('bookingPanel');
    const dashboard = document.getElementById('dashboard');
    
    // Verificar que los elementos existen
    if (!dashboard) {
        console.error('❌ Elemento dashboard no encontrado');
        return;
    }
    
    // FORZAR estilos con !important
    if (clientView) {
        clientView.style.setProperty('display', 'none', 'important');
    }
    
    if (bookingPanel) {
        bookingPanel.style.setProperty('display', 'none', 'important');
    }
    
    // Forzar dashboard visible con !important
    dashboard.style.setProperty('display', 'block', 'important');
    dashboard.style.setProperty('visibility', 'visible', 'important');
    dashboard.style.setProperty('opacity', '1', 'important');
    dashboard.style.setProperty('z-index', '1000', 'important');
    
    // Actualizar títulos
    const dashTitle = document.getElementById('dashTitle');
    const dashSubtitle = document.getElementById('dashSubtitle');
    
    if (dashTitle) {
        dashTitle.innerText = role === 'admin' ? 'Panel Administrador' : 'Mi Panel Profesional';
    }
    
    if (dashSubtitle && userData) {
        const generoEmoji = userData.genero === 'M' ? '♂️' : userData.genero === 'F' ? '♀️' : '';
        dashSubtitle.innerText = `Bienvenido, ${userData.name} ${generoEmoji}`;
    }
    
    // Configurar visibilidad de pestañas
    const adminTabs = [
        'adminTabProfesionales', 'adminTabEspecialidades', 'adminTabPagos',
        'adminTabFondo', 'adminTabTextos', 'adminTabLogo', 'adminTabReinicio',
        'messagesTab', 'boxesTab', 'adminTabEstadisticas'
    ];
    
    adminTabs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = role === 'admin' ? 'inline-block' : 'none';
    });
    
    const psychTabs = ['psychTab', 'configTab', 'agendarTab'];
    psychTabs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = role === 'psych' ? 'inline-block' : 'none';
    });
    
    // Mostrar/ocultar botón de edición de perfil
    const profileBtn = document.getElementById('editProfileButton');
    if (profileBtn) {
        if (role === 'psych') {
            profileBtn.style.display = 'inline-flex';
            profileBtn.onclick = window.openMyProfileModal;
            profileBtn.innerHTML = '<i class="fa fa-user-edit"></i> Editar Mi Perfil';
        } else {
            profileBtn.style.display = 'none';
        }
    }
    
    // Actualizar estadísticas
    setTimeout(() => {
        updateStats();
    }, 500);
    
    // Cambiar a pestaña de citas
    switchTab('citas');
    
    console.log('✅ Dashboard forzado a visible con !important');
}

export function logout() {
    state.setCurrentUser(null);
    localStorage.removeItem('vinculoCurrentUser');
    location.reload();
}

// ============================================
// FUNCIÓN PARA CARGAR EL DASHBOARD
// ============================================

export function cargarDashboard(role) {
    // Esta función ahora llama a mostrarDashboardInmediato
    const userData = state.currentUser?.data;
    if (userData) {
        mostrarDashboardInmediato(role, userData);
    } else {
        console.error('❌ No hay datos de usuario para cargar dashboard');
    }
}

// ============================================
// FUNCIÓN SWITCH TAB
// ============================================

export function switchTab(tabName) {
    console.log('🔄 Cambiando a pestaña:', tabName);
    
    // Desactivar todas las pestañas
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Activar la pestaña clickeada
    const activeTab = Array.from(document.querySelectorAll('.tab')).find(t => 
        t.textContent.toLowerCase().includes(tabName.toLowerCase())
    );
    if (activeTab) activeTab.classList.add('active');
    
    // Mostrar el contenido seleccionado
    const tabMap = {
        'citas': 'tabCitas',
        'solicitudes': 'tabSolicitudes',
        'pacientes': 'tabPacientes',
        'profesionales': 'tabProfesionales',
        'especialidades': 'tabEspecialidades',
        'pagos': 'tabPagos',
        'fondo': 'tabFondo',
        'textos': 'tabTextos',
        'logo': 'tabLogo',
        'reinicio': 'tabReinicio',
        'disponibilidad': 'tabDisponibilidad',
        'configuracion': 'tabConfiguracion',
        'mensajes': 'tabMensajes',
        'boxes': 'tabBoxes',
        'agendar': 'tabAgendar',
        'estadisticas': 'tabEstadisticas'
    };
    
    const tabId = tabMap[tabName];
    if (tabId) {
        const tabElement = document.getElementById(tabId);
        if (tabElement) {
            tabElement.classList.add('active');
            
            // Cargar datos según la pestaña
            setTimeout(() => {
                try {
                    if (tabName === 'pacientes' && typeof renderPatients === 'function') {
                        renderPatients();
                    }
                    else if (tabName === 'citas' && typeof renderAppointments === 'function') {
                        renderAppointments();
                    }
                    else if (tabName === 'solicitudes' && typeof renderPendingRequests === 'function') {
                        renderPendingRequests();
                    }
                    else if (tabName === 'profesionales' && isAdmin() && typeof renderStaffTable === 'function') {
                        renderStaffTable();
                    }
                    else if (tabName === 'mensajes' && isAdmin() && typeof renderMessagesTable === 'function') {
                        renderMessagesTable();
                    }
                    else if (tabName === 'boxes') {
                        if (typeof renderBoxesTable === 'function') renderBoxesTable();
                        if (typeof renderBoxOccupancy === 'function') renderBoxOccupancy();
                    }
                    else if (tabName === 'disponibilidad' && isPsych()) {
                        // Verificar si existe la función loadTimeSlots
                        if (typeof window.loadTimeSlots === 'function') {
                            window.loadTimeSlots();
                        }
                    }
                    else if (tabName === 'configuracion' && isPsych()) {
                        if (typeof loadMyConfig === 'function') loadMyConfig();
                    }
                    else if (tabName === 'pagos' && isAdmin()) {
                        if (typeof updatePaymentMethodsInfo === 'function') updatePaymentMethodsInfo();
                    }
                    else if (tabName === 'reinicio' && isAdmin()) {
                        if (typeof actualizarContadoresReinicio === 'function') actualizarContadoresReinicio();
                    }
                    else if (tabName === 'estadisticas' && isAdmin()) {
                        if (window.estadisticas && typeof window.estadisticas.renderPanelEstadisticas === 'function') {
                            window.estadisticas.renderPanelEstadisticas();
                        }
                    }
                } catch (error) {
                    console.error('❌ Error cargando datos:', error);
                }
            }, 100);
        }
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function isAdmin() {
    return state.currentUser?.role === 'admin';
}

function isPsych() {
    return state.currentUser?.role === 'psych';
}

// ============================================
// FUNCIÓN UPDATE STATS
// ============================================

export function updateStats() {
    console.log('📊 Actualizando estadísticas...');
    
    if (!state.currentUser) {
        console.log('⚠️ No hay usuario logueado');
        return;
    }

    const miId = state.currentUser.data?.id;
    const esAdmin = isAdmin();
    
    // Filtrar citas
    let misCitas = [];
    if (esAdmin) {
        misCitas = state.appointments || [];
    } else {
        misCitas = (state.appointments || []).filter(a => a.psychId == miId);
    }
    
    // Calcular ingresos (solo pagadas)
    const ingresosPagados = misCitas
        .filter(a => a.paymentStatus === 'pagado')
        .reduce((sum, a) => sum + (a.price || 0), 0);
    
    // Contar pacientes únicos
    const pacientesUnicos = new Set();
    misCitas.forEach(a => {
        if (a.patientId) pacientesUnicos.add(a.patientId);
    });
    
    // Actualizar UI
    const statIncome = document.getElementById('statIncome');
    const statCitas = document.getElementById('statCitas');
    const statPatients = document.getElementById('statPatients');
    
    if (statIncome) statIncome.innerText = `$${ingresosPagados.toLocaleString()}`;
    if (statCitas) statCitas.innerText = misCitas.length;
    if (statPatients) statPatients.innerText = pacientesUnicos.size;
}

// ============================================
// 🆕 FUNCIÓN PARA ACTUALIZAR BOTÓN DE PERFIL
// ============================================

export function updateProfileButton() {
    const profileBtn = document.getElementById('editProfileButton');
    if (!profileBtn) return;
    
    if (isPsych()) {
        profileBtn.style.display = 'inline-flex';
        profileBtn.onclick = window.openMyProfileModal;
        profileBtn.innerHTML = '<i class="fa fa-user-edit"></i> Editar Mi Perfil';
    } else {
        profileBtn.style.display = 'none';
    }
}

// ============================================
// 🆕 VERIFICAR SESIÓN GUARDADA
// ============================================

export function verificarSesionGuardada() {
    console.log('🔍 Verificando sesión guardada...');
    
    const savedUser = localStorage.getItem('vinculoCurrentUser');
    if (!savedUser) {
        console.log('ℹ️ No hay sesión guardada');
        return false;
    }
    
    try {
        const userData = JSON.parse(savedUser);
        console.log('📦 Sesión encontrada:', userData);
        
        // Verificar que el usuario aún existe en staff (excepto admin)
        if (userData.role === 'admin') {
            state.setCurrentUser(userData);
            mostrarDashboardInmediato('admin', userData.data);
            return true;
        } else {
            // Buscar psicólogo en staff
            const psychExists = state.staff.some(s => s.id == userData.data.id);
            if (psychExists) {
                state.setCurrentUser(userData);
                mostrarDashboardInmediato('psych', userData.data);
                return true;
            } else {
                console.log('⚠️ Psicólogo ya no existe en el sistema');
                localStorage.removeItem('vinculoCurrentUser');
                return false;
            }
        }
    } catch (error) {
        console.error('❌ Error al leer sesión guardada:', error);
        localStorage.removeItem('vinculoCurrentUser');
        return false;
    }
}

// ============================================
// EXPONER FUNCIONES GLOBALMENTE
// ============================================
if (typeof window !== 'undefined') {
    window.showLoginModal = showLoginModal;
    window.closeLoginModal = closeLoginModal;
    window.processLogin = processLogin;
    window.logout = logout;
    window.switchTab = switchTab;
    window.updateStats = updateStats;
    window.updateProfileButton = updateProfileButton;
    window.verificarSesionGuardada = verificarSesionGuardada;
}

console.log('✅ auth.js cargado correctamente con funciones de login y perfil profesional');