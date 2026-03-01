// js/modules/auth.js
import * as state from './state.js';
import { showToast } from './utils.js';
import { renderStaffTable } from './profesionales.js';
import { renderMessagesTable } from './mensajes.js';
import { renderBoxesTable, renderBoxOccupancy } from './boxes.js';
import { updatePaymentMethodsInfo, loadMyConfig } from './personalizacion.js';
import { renderPatients } from './pacientes.js';
import { renderPendingRequests } from './citas.js';
import { actualizarContadoresReinicio } from './admin.js';

// ============================================
// FUNCIÓN SWITCH TAB - CORREGIDA Y MEJORADA
// ============================================
export function switchTab(tabName) {
    console.log('🔄 Cambiando a pestaña:', tabName);
    
    // Desactivar todas las pestañas
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    
    // Activar la pestaña clickeada
    const activeTab = Array.from(document.querySelectorAll('.tab')).find(t => 
        t.textContent.trim().toLowerCase().includes(tabName.toLowerCase())
    );
    if (activeTab) {
        activeTab.classList.add('active');
        console.log('✅ Pestaña activada:', activeTab.textContent.trim());
    }
    
    // Ocultar todos los contenidos
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
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
        'agendar': 'tabAgendar'
    };
    
    const tabId = tabMap[tabName];
    if (tabId) {
        const tabElement = document.getElementById(tabId);
        if (tabElement) {
            tabElement.classList.add('active');
            console.log('✅ Contenido activado:', tabId);
        } else {
            console.warn('⚠️ No se encontró el elemento:', tabId);
        }
    }
    
    // Cargar datos según la pestaña
    setTimeout(() => {
        try {
            if (tabName === 'pacientes') {
                if (typeof renderPatients === 'function') {
                    console.log('📊 Renderizando pacientes...');
                    renderPatients();
                } else {
                    console.warn('⚠️ renderPatients no está disponible');
                }
            }
            else if (tabName === 'profesionales' && state.currentUser?.role === 'admin') {
                if (typeof renderStaffTable === 'function') renderStaffTable();
            }
            else if (tabName === 'mensajes' && state.currentUser?.role === 'admin') {
                if (typeof renderMessagesTable === 'function') renderMessagesTable();
            }
            else if (tabName === 'boxes') {
                if (typeof renderBoxesTable === 'function') renderBoxesTable();
                if (typeof renderBoxOccupancy === 'function') renderBoxOccupancy();
            }
            else if (tabName === 'disponibilidad' && state.currentUser?.role === 'psych') {
                if (typeof loadTimeSlots === 'function') loadTimeSlots();
            }
            else if (tabName === 'configuracion' && state.currentUser?.role === 'psych') {
                if (typeof loadMyConfig === 'function') loadMyConfig();
            }
            else if (tabName === 'pagos' && state.currentUser?.role === 'admin') {
                if (typeof updatePaymentMethodsInfo === 'function') updatePaymentMethodsInfo();
            }
            else if (tabName === 'reinicio' && state.currentUser?.role === 'admin') {
                if (typeof actualizarContadoresReinicio === 'function') actualizarContadoresReinicio();
            }
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
        }
    }, 100);
}

// ============================================
// FUNCIONES DE LOGIN
// ============================================
export function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'flex';
    
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
        
        // Guardar sesión
        localStorage.setItem('vinculoCurrentUser', JSON.stringify({ role: 'admin', data: adminUser }));
        
        // Cargar dashboard
        cargarDashboard('admin');
        
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
        state.setCurrentUser({ role, data: foundUser });
        closeLoginModal();
        
        // Guardar sesión
        localStorage.setItem('vinculoCurrentUser', JSON.stringify({ role, data: foundUser }));
        
        // Cargar dashboard
        cargarDashboard(role);
        
    } else {
        showToast('Usuario o contraseña incorrectos', 'error');
    }
    
    if (btn) {
        btn.innerHTML = 'Ingresar al Panel';
        btn.disabled = false;
    }
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
    console.log('🔄 Cargando dashboard como:', role);
    
    // Ocultar vista pública
    const clientView = document.getElementById('clientView');
    const bookingPanel = document.getElementById('bookingPanel');
    const dashboard = document.getElementById('dashboard');
    
    if (clientView) clientView.style.display = 'none';
    if (bookingPanel) bookingPanel.style.display = 'none';
    if (dashboard) dashboard.style.display = 'block';

    const isAdmin = role === 'admin';
    const isPsych = role === 'psych';

    // Título
    const dashTitle = document.getElementById('dashTitle');
    if (dashTitle) {
        dashTitle.innerText = isAdmin ? "Panel Administrador" : `Panel de ${state.currentUser.data.name}`;
    }

    // Mostrar/ocultar tabs según el rol
    const adminTabs = [
        'adminTabProfesionales', 'adminTabEspecialidades', 'adminTabPagos',
        'adminTabFondo', 'adminTabTextos', 'adminTabLogo', 'adminTabReinicio',
        'messagesTab', 'boxesTab'
    ];
    adminTabs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = isAdmin ? 'block' : 'none';
    });

    const psychTabs = ['psychTab', 'configTab', 'agendarTab'];
    psychTabs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = isPsych ? 'block' : 'none';
    });

    // Activar pestaña de citas
    switchTab('citas');
}

// ============================================
// FUNCIÓN UPDATE STATS (FALTABA)
// ============================================
export function updateStats() {
    console.log('📊 Actualizando estadísticas...');
    // Esta función debe ser implementada según tu lógica
    // Por ahora solo mostramos un log
}

// ============================================
// EXPONER FUNCIONES GLOBALMENTE (VERSIÓN MEJORADA)
// ============================================
// Asegurar que switchTab esté disponible globalmente
window.switchTab = function(tabName) {
    console.log('🔄 switchTab llamado desde window con:', tabName);
    // Llamar a la función interna
    switchTab(tabName);
};

window.showLoginModal = showLoginModal;
window.closeLoginModal = closeLoginModal;
window.processLogin = processLogin;
window.logout = logout;

// Verificar que se asignó correctamente
console.log('✅ Funciones de auth asignadas a window:', {
    switchTab: typeof window.switchTab,
    showLoginModal: typeof window.showLoginModal,
    processLogin: typeof window.processLogin,
    logout: typeof window.logout
});