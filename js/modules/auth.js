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
        
        // Cargar dashboard directamente (sin recargar)
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
        
        // Cargar dashboard directamente (sin recargar)
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
    location.reload();
}

// ============================================
// FUNCIÓN PARA CARGAR EL DASHBOARD DIRECTAMENTE
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
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const citasTab = Array.from(document.querySelectorAll('.tab')).find(t => t.textContent.trim() === 'Citas');
    if (citasTab) citasTab.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const tabCitas = document.getElementById('tabCitas');
    if (tabCitas) tabCitas.classList.add('active');

    // Cargar datos según el rol
    setTimeout(() => {
        try {
            if (isAdmin) {
                if (typeof renderStaffTable === 'function') renderStaffTable();
                if (typeof renderMessagesTable === 'function') renderMessagesTable();
                if (typeof renderBoxesTable === 'function') renderBoxesTable();
                if (typeof updatePaymentMethodsInfo === 'function') updatePaymentMethodsInfo();
                if (typeof actualizarContadoresReinicio === 'function') actualizarContadoresReinicio();
            } else {
                const availDate = document.getElementById('availDate');
                if (availDate) availDate.min = new Date().toISOString().split('T')[0];
                
                if (typeof loadMyConfig === 'function') loadMyConfig();
                if (typeof renderBoxOccupancy === 'function') renderBoxOccupancy();
            }
            
            if (typeof renderPatients === 'function') renderPatients();
            if (typeof renderPendingRequests === 'function') renderPendingRequests();
            
            console.log('✅ Datos cargados correctamente');
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
        }
    }, 500);
}

// ============================================
// EXPONER FUNCIONES GLOBALMENTE
// ============================================
window.switchTab = function(tabName) {
    import('./auth.js').then(mod => mod.switchTab(tabName));
};
window.showLoginModal = showLoginModal;
window.closeLoginModal = closeLoginModal;
window.processLogin = processLogin;
window.logout = logout;