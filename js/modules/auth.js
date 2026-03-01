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

    // VERIFICACIÓN SIMPLE
    if (user === "Admin" && pass === "Nina2026") {
        console.log("✅ Acceso Admin concedido");
        
        closeLoginModal();
        
        // FORZAR VISIBILIDAD DEL DASHBOARD DIRECTAMENTE
        const clientView = document.getElementById('clientView');
        const dashboard = document.getElementById('dashboard');
        
        if (clientView) clientView.style.display = 'none';
        if (dashboard) {
            dashboard.style.display = 'block';
            console.log("✅ Dashboard visible");
        } else {
            console.error("❌ Dashboard no encontrado");
        }
        
        // Cambiar título
        const dashTitle = document.getElementById('dashTitle');
        if (dashTitle) dashTitle.innerText = "Panel Administrador";
        
        showToast('Bienvenido Administrador', 'success');
        
        if (btn) {
            btn.innerHTML = 'Ingresar al Panel';
            btn.disabled = false;
        }
        return;
    }

    showToast('Usuario o contraseña incorrectos', 'error');
    if (btn) {
        btn.innerHTML = 'Ingresar al Panel';
        btn.disabled = false;
    }
}