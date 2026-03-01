// js/modules/auth.js
import * as state from './state.js';
import { showToast } from './utils.js';
import { renderStaffTable } from './profesionales.js';
import { renderMessagesTable } from './mensajes.js';
import { renderBoxesTable, renderBoxOccupancy } from './boxes.js';
import { updatePaymentMethodsInfo, loadMyConfig } from './personalizacion.js';
import { renderPatients } from './pacientes.js';
import { renderPendingRequests } from './citas.js';

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
            isAdmin: true
        };
        
        state.setCurrentUser({ role: 'admin', data: adminUser });
        closeLoginModal();
        
        // Redirigir con parámetro admin
        window.location.href = 'https://vinculosalud.cl?dashboard=admin';
        
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
        
        window.location.href = `https://vinculosalud.cl?dashboard=${role}`;
        
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