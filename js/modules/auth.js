// js/modules/auth.js
import * as state from './state.js';
import { showToast } from './utils.js';

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

    // Admin por defecto (sin Firebase Auth)
    if (user === "Admin" && pass === "Nina2026") {
        console.log("✅ Acceso Admin concedido (local)");
        
        // Crear usuario admin
        const adminUser = {
            id: 9999,
            name: 'Administrador',
            spec: ['ADMIN_HIDDEN'],
            usuario: 'Admin',
            pass: 'Nina2026',
            isHiddenAdmin: true
        };
        
        state.setCurrentUser({ role: 'admin', data: adminUser });
        closeLoginModal();
        
        // FORZAR recarga de la página para mostrar el dashboard
        window.location.href = 'https://vinculosalud.cl/#dashboard';
        
        if (btn) {
            btn.innerHTML = 'Ingresar al Panel';
            btn.disabled = false;
        }
        return;
    }

    // Buscar otros usuarios en staff
    const foundUser = state.staff.find(s => 
        (s.usuario === user || s.name === user) && s.pass === pass
    );

    if (foundUser) {
        console.log("✅ Acceso profesional concedido:", foundUser.name);
        
        if (foundUser.spec && foundUser.spec.includes('ADMIN_HIDDEN') || foundUser.isHiddenAdmin) {
            state.setCurrentUser({ role: 'admin', data: foundUser });
        } else {
            state.setCurrentUser({ role: 'psych', data: foundUser });
        }
        
        closeLoginModal();
        window.location.href = 'https://vinculosalud.cl/#dashboard';
        
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
    window.location.href = 'https://vinculosalud.cl';
}

// ============================================
// DASHBOARD SIMPLIFICADO
// ============================================

// Esta función se ejecutará cuando la página tenga #dashboard en la URL
export function initDashboard() {
    console.log("🔄 Inicializando dashboard");
    
    // Ocultar vista pública
    const clientView = document.getElementById('clientView');
    const bookingPanel = document.getElementById('bookingPanel');
    const dashboard = document.getElementById('dashboard');
    
    if (clientView) clientView.style.display = 'none';
    if (bookingPanel) bookingPanel.style.display = 'none';
    if (dashboard) dashboard.style.display = 'block';

    if (!state.currentUser) {
        console.log("No hay usuario, redirigiendo...");
        window.location.href = 'https://vinculosalud.cl';
        return;
    }

    const isAdmin = state.currentUser.role === 'admin';
    const isPsych = state.currentUser.role === 'psych';

    // Título
    const dashTitle = document.getElementById('dashTitle');
    if (dashTitle) {
        dashTitle.innerText = isAdmin ? "Panel Administrador" : `Panel de ${state.currentUser.data.name}`;
    }

    // Mostrar tabs según rol
    const adminTabs = [
        'adminTabProfesionales', 'adminTabEspecialidades', 'adminTabPagos',
        'adminTabFondo', 'adminTabTextos', 'adminTabLogo', 'adminTabReinicio'
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

    // Tabs comunes para admin
    const commonAdminTabs = ['messagesTab', 'boxesTab'];
    commonAdminTabs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = isAdmin ? 'block' : 'none';
    });

    // Activar pestaña de citas
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.classList.remove('active'));
    
    const citasTab = Array.from(tabs).find(t => t.textContent.trim() === 'Citas');
    if (citasTab) citasTab.classList.add('active');

    // Mostrar contenido de citas
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(c => c.classList.remove('active'));
    
    const tabCitas = document.getElementById('tabCitas');
    if (tabCitas) tabCitas.classList.add('active');

    console.log("✅ Dashboard inicializado");
}

// Verificar si estamos en el dashboard al cargar la página
if (window.location.hash === '#dashboard') {
    setTimeout(initDashboard, 500);
}