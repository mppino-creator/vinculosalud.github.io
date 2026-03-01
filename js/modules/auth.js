// js/modules/auth.js
import * as state from './state.js';
import { showToast } from './utils.js';

// ============================================
// FUNCIONES DE LOGIN SIMPLIFICADAS
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

    // Verificación manual para Admin
    if (user === "Admin" && pass === "Nina2026") {
        console.log("✅ Acceso Admin concedido");
        
        // Crear usuario admin en el estado
        const adminUser = {
            id: 9999,
            name: 'Administrador',
            usuario: 'Admin',
            pass: 'Nina2026',
            isAdmin: true
        };
        
        state.setCurrentUser({ role: 'admin', data: adminUser });
        closeLoginModal();
        
        // FORZAR la visualización del dashboard
        setTimeout(() => {
            // Ocultar vista pública
            const clientView = document.getElementById('clientView');
            const bookingPanel = document.getElementById('bookingPanel');
            const dashboard = document.getElementById('dashboard');
            
            if (clientView) clientView.style.display = 'none';
            if (bookingPanel) bookingPanel.style.display = 'none';
            if (dashboard) dashboard.style.display = 'block';
            
            // Cambiar título
            const dashTitle = document.getElementById('dashTitle');
            if (dashTitle) dashTitle.innerText = "Panel Administrador";
            
            // Mostrar tabs de admin
            const adminTabs = [
                'adminTabProfesionales', 'adminTabEspecialidades', 
                'adminTabPagos', 'adminTabFondo', 'adminTabTextos', 
                'adminTabLogo', 'adminTabReinicio', 'messagesTab', 'boxesTab'
            ];
            
            adminTabs.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'block';
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
            
            showToast('Bienvenido Administrador', 'success');
        }, 500);
        
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
        
        const role = foundUser.isAdmin ? 'admin' : 'psych';
        state.setCurrentUser({ role, data: foundUser });
        closeLoginModal();
        
        setTimeout(() => {
            // Ocultar vista pública
            const clientView = document.getElementById('clientView');
            const bookingPanel = document.getElementById('bookingPanel');
            const dashboard = document.getElementById('dashboard');
            
            if (clientView) clientView.style.display = 'none';
            if (bookingPanel) bookingPanel.style.display = 'none';
            if (dashboard) dashboard.style.display = 'block';
            
            // Cambiar título
            const dashTitle = document.getElementById('dashTitle');
            if (dashTitle) dashTitle.innerText = `Panel de ${foundUser.name}`;
            
            // Mostrar tabs según rol
            const isAdmin = role === 'admin';
            const isPsych = role === 'psych';
            
            // Tabs de admin
            const adminTabs = [
                'adminTabProfesionales', 'adminTabEspecialidades', 'adminTabPagos',
                'adminTabFondo', 'adminTabTextos', 'adminTabLogo', 'adminTabReinicio',
                'messagesTab', 'boxesTab'
            ];
            adminTabs.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = isAdmin ? 'block' : 'none';
            });
            
            // Tabs de psicólogo
            const psychTabs = ['psychTab', 'configTab', 'agendarTab'];
            psychTabs.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = isPsych ? 'block' : 'none';
            });
            
            // Activar pestaña de citas
            const tabs = document.querySelectorAll('.tab');
            tabs.forEach(t => t.classList.remove('active'));
            
            const citasTab = Array.from(tabs).find(t => t.textContent.trim() === 'Citas');
            if (citasTab) citasTab.classList.add('active');
            
            const tabCitas = document.getElementById('tabCitas');
            if (tabCitas) tabCitas.classList.add('active');
            
            showToast(`Bienvenido ${foundUser.name}`, 'success');
        }, 500);
        
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