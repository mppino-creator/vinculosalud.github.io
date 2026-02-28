// js/modules/auth.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast } from './utils.js';

// ============================================
// FUNCIONES DE LOGIN Y DASHBOARD
// ============================================

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

    // Admin por defecto
    if (user === "Admin" && pass === "Nina2026") {
        console.log("✅ Acceso Admin concedido");
        
        const adminUser = {
            id: '9999',
            name: 'Administrador',
            spec: ['ADMIN_HIDDEN'],
            usuario: 'Admin',
            pass: 'Nina2026',
            isHiddenAdmin: true
        };
        
        state.currentUser = { role: 'admin', data: adminUser };
        localStorage.setItem('vinculoCurrentUser', JSON.stringify(state.currentUser));
        
        closeLoginModal();
        showDashboard();
        showToast('Acceso administrador concedido', 'success');
        
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
        
        if (foundUser.spec && foundUser.spec.includes('ADMIN_HIDDEN') || foundUser.isHiddenAdmin) {
            state.currentUser = { role: 'admin', data: foundUser };
        } else {
            state.currentUser = { role: 'psych', data: foundUser };
        }
        
        localStorage.setItem('vinculoCurrentUser', JSON.stringify(state.currentUser));
        
        closeLoginModal();
        showDashboard();
        showToast(`Bienvenido ${foundUser.name}`, 'success');
    } else { 
        console.log("❌ Login fallido para:", user);
        showToast('Usuario o contraseña incorrectos', 'error');
    }
    
    btn.innerHTML = 'Ingresar al Panel';
    btn.disabled = false;
}

export function logout() {
    localStorage.removeItem('vinculoCurrentUser');
    state.currentUser = null;
    location.reload();
}

export function showDashboard() {
    document.getElementById('clientView').style.display = 'none';
    document.getElementById('bookingPanel').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    
    const isAdmin = state.currentUser.role === 'admin';
    const isPsych = state.currentUser.role === 'psych';
    
    document.getElementById('adminTabProfesionales').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('adminTabEspecialidades').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('adminTabPagos').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('adminTabFondo').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('adminTabTextos').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('adminTabLogo').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('psychTab').style.display = isPsych ? 'block' : 'none';
    document.getElementById('configTab').style.display = isPsych ? 'block' : 'none';
    document.getElementById('messagesTab').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('boxesTab').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('agendarTab').style.display = isPsych ? 'block' : 'none';
    
    if (isAdmin) {
        document.getElementById('dashTitle').innerText = "Panel Administrador";
        // Estas funciones deben venir de otros módulos
        import('./profesionales.js').then(mod => mod.renderStaffTable());
        import('./mensajes.js').then(mod => mod.renderMessagesTable());
        import('./boxes.js').then(mod => mod.renderBoxesTable());
        import('./personalizacion.js').then(mod => mod.updatePaymentMethodsInfo());
    } else {
        document.getElementById('dashTitle').innerText = `Panel de ${state.currentUser.data.name}`;
        document.getElementById('availDate').min = new Date().toISOString().split('T')[0];
        // Cargar configuración personal y ocupación de boxes
        import('./personalizacion.js').then(mod => mod.loadMyConfig());
        import('./boxes.js').then(mod => mod.renderBoxOccupancy());
    }
    
    updateStats();
    import('./pacientes.js').then(mod => mod.renderPatients());
    import('./citas.js').then(mod => mod.renderPendingRequests());
    switchTab('citas');
}

export function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.classList.remove('active'));
    
    // Buscar el tab por el texto y activarlo
    tabs.forEach(t => {
        if (t.textContent.trim().toLowerCase().includes(tabName.toLowerCase()) || 
            (tabName === 'citas' && t.textContent.trim() === 'Citas') ||
            (tabName === 'solicitudes' && t.textContent.trim() === 'Solicitudes Pendientes') ||
            (tabName === 'pacientes' && t.textContent.trim() === 'Pacientes') ||
            (tabName === 'profesionales' && t.textContent.trim() === 'Profesionales') ||
            (tabName === 'especialidades' && t.textContent.trim() === 'Especialidades') ||
            (tabName === 'pagos' && t.textContent.trim() === 'Métodos de Pago') ||
            (tabName === 'fondo' && t.textContent.trim() === 'Fondo') ||
            (tabName === 'logo' && t.textContent.trim() === 'Logo') ||
            (tabName === 'textos' && t.textContent.trim() === 'Textos') ||
            (tabName === 'disponibilidad' && t.textContent.trim() === 'Disponibilidad') ||
            (tabName === 'configuracion' && t.textContent.trim() === 'Mi Config') ||
            (tabName === 'mensajes' && t.textContent.trim() === 'Mensajes') ||
            (tabName === 'boxes' && t.textContent.trim() === 'Boxes') ||
            (tabName === 'agendar' && t.textContent.trim() === 'Agendar Cita')) {
            t.classList.add('active');
        }
    });
    
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const tabId = 'tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1);
    const element = document.getElementById(tabId);
    if (element) element.classList.add('active');
    
    // Cargar contenido según la pestaña
    if (tabName === 'pacientes') {
        import('./pacientes.js').then(mod => mod.renderPatients());
    }
    if (tabName === 'disponibilidad' && state.currentUser?.role === 'psych') {
        import('./disponibilidad.js').then(mod => mod.loadTimeSlots());
    }
    if (tabName === 'configuracion' && state.currentUser?.role === 'psych') {
        import('./personalizacion.js').then(mod => mod.loadMyConfig());
    }
    if (tabName === 'mensajes' && state.currentUser?.role === 'admin') {
        import('./mensajes.js').then(mod => mod.renderMessagesTable());
    }
    if (tabName === 'boxes' && state.currentUser?.role === 'admin') {
        import('./boxes.js').then(mod => mod.renderBoxesTable());
    }
    if (tabName === 'boxes' && state.currentUser?.role === 'psych') {
        import('./boxes.js').then(mod => mod.renderBoxOccupancy());
    }
    if (tabName === 'solicitudes') {
        import('./citas.js').then(mod => mod.renderPendingRequests());
    }
}

function updateStats() {
    const myApps = state.currentUser.role === 'admin' ? state.appointments : state.appointments.filter(a => a.psychId == state.currentUser.data.id);
    const myPatients = state.currentUser.role === 'admin' ? state.patients : state.patients.filter(p => p.psychId == state.currentUser.data.id);
    const totalIncome = myApps.reduce((s, a) => s + a.price, 0);
    
    document.getElementById('statIncome').innerText = `$${totalIncome.toLocaleString()}`;
    document.getElementById('statCitas').innerText = myApps.length;
    document.getElementById('statPatients').innerText = myPatients.length;
    renderAppointmentsTable(myApps);
}

function renderAppointmentsTable(apps) {
    const tb = document.getElementById('tableBody');
    tb.innerHTML = "";
    
    const confirmedApps = apps.filter(a => a.status === 'confirmada');
    
    if (confirmedApps.length === 0) {
        tb.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:40px;">No hay citas confirmadas</td></tr>';
        return;
    }

    [...confirmedApps].reverse().forEach(a => {
        const appDate = new Date(a.date + 'T' + a.time);
        const isPast = appDate < new Date();
        const canEdit = state.currentUser.role === 'admin' || 
                       (state.currentUser.role === 'psych' && new Date() < new Date(a.editableUntil));
        
        let paymentStatusText = a.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente';
        let paymentStatusColor = a.paymentStatus === 'pagado' ? 'var(--verde-exito)' : 'var(--naranja-aviso)';
        
        tb.innerHTML += `
            <tr>
                <td><strong>${a.patient}</strong><br><small>${a.patientRut || ''}</small></td>
                <td>${a.psych}</td>
                <td>${a.date} <br><small>${a.time}</small></td>
                <td><span class="badge ${a.type}">${a.type === 'online' ? 'Online' : 'Presencial'}</span></td>
                <td>${a.boxName ? `<span class="history-box">${a.boxName}</span>` : '—'}</td>
                <td><span style="color:${paymentStatusColor};">${paymentStatusText}<br><small>$${a.price.toLocaleString()}</small></span></td>
                <td><span style="color:${isPast ? 'var(--text-light)' : 'var(--verde-exito)'};">${isPast ? 'Completada' : 'Confirmada'}</span></td>
                <td>
                    ${canEdit ? `
                        <button onclick="editAppointment(${a.id})" class="btn-icon" style="background:var(--azul-medico); color:white;">
                            <i class="fa fa-edit"></i>
                        </button>
                    ` : ''}
                    ${(state.currentUser.role === 'admin' || canEdit) ? `
                        <button onclick="cancelAppointment(${a.id})" class="btn-icon" style="background:var(--rojo-alerta); color:white;">
                            <i class="fa fa-times"></i>
                        </button>
                    ` : ''}
                    ${a.paymentStatus === 'pendiente' && state.currentUser.role === 'admin' ? `
                        <button onclick="markAsPaid(${a.id})" class="btn-icon" style="background:var(--verde-exito); color:white;">
                            <i class="fa fa-check"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });
}

// Nota: Las funciones editAppointment, cancelAppointment, markAsPaid deberían estar en citas.js
// Las importaremos dinámicamente cuando se llamen desde el HTML, pero por ahora las dejamos aquí
// para que el código sea autocontenido. Luego las moveremos.
window.editAppointment = (id) => {
    import('./citas.js').then(mod => mod.editAppointment(id));
};
window.cancelAppointment = (id) => {
    import('./citas.js').then(mod => mod.cancelAppointment(id));
};
window.markAsPaid = (id) => {
    import('./citas.js').then(mod => mod.markAsPaid(id));
};