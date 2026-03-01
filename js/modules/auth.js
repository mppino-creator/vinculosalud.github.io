// js/modules/auth.js
import * as state from './state.js';
import { showToast } from './utils.js';

export function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    document.getElementById('loginBtn').innerHTML = 'Ingresar al Panel';
    document.getElementById('loginBtn').disabled = false;
}

export function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

export function processLogin() {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    const btn = document.getElementById('loginBtn');

    if (!user || !pass) {
        showToast('Ingresa usuario y contraseña', 'error');
        return;
    }

    btn.innerHTML = '<span class="spinner"></span> Verificando...';
    btn.disabled = true;

    // Admin por defecto (SIN FIREBASE)
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
        
        // FORZAR RECARGA TOTAL - ESTO SIEMPRE FUNCIONA
        window.location.href = 'https://vinculosalud.cl?dashboard=admin';
        
        btn.innerHTML = 'Ingresar al Panel';
        btn.disabled = false;
        return;
    }

    // Buscar en staff
    const foundUser = state.staff.find(s => 
        (s.usuario === user || s.name === user) && s.pass === pass
    );

    if (foundUser) {
        console.log("✅ Acceso profesional concedido:", foundUser.name);
        
        if (foundUser.isAdmin) {
            state.setCurrentUser({ role: 'admin', data: foundUser });
            window.location.href = 'https://vinculosalud.cl?dashboard=admin';
        } else {
            state.setCurrentUser({ role: 'psych', data: foundUser });
            window.location.href = 'https://vinculosalud.cl?dashboard=psych';
        }
        
    } else {
        showToast('Usuario o contraseña incorrectos', 'error');
    }
    
    btn.innerHTML = 'Ingresar al Panel';
    btn.disabled = false;
}

export function logout() {
    state.setCurrentUser(null);
    window.location.href = 'https://vinculosalud.cl';
}