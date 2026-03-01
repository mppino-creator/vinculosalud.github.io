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
// FUNCIÓN SWITCH TAB
// ============================================
export function switchTab(tabName) {
    console.log('🔄 Cambiando a pestaña:', tabName);
    
    // Desactivar todas las pestañas
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    
    // Activar la pestaña clickeada
    const activeTab = Array.from(document.querySelectorAll('.tab')).find(t => 
        t.textContent.trim().toLowerCase().includes(tabName.toLowerCase())
    );
    if (activeTab) activeTab.classList.add('active');
    
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
            
            // Cargar datos según la pestaña
            setTimeout(() => {
                try {
                    if (tabName === 'pacientes') {
                        if (typeof renderPatients === 'function') {
                            renderPatients();
                        }
                    }
                    else if (tabName === 'citas' || tabName === 'solicitudes') {
                        if (typeof updateStats === 'function') {
                            updateStats();
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
    }
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
        
        localStorage.setItem('vinculoCurrentUser', JSON.stringify({ role: 'admin', data: adminUser }));
        cargarDashboard('admin');
        
        if (btn) {
            btn.innerHTML = 'Ingresar al Panel';
            btn.disabled = false;
        }
        return;
    }

    const foundUser = state.staff.find(s => 
        (s.usuario === user || s.name === user) && s.pass === pass
    );

    if (foundUser) {
        console.log("✅ Acceso profesional concedido:", foundUser.name);
        
        const role = foundUser.isAdmin ? 'admin' : 'psych';
        state.setCurrentUser({ role, data: foundUser });
        closeLoginModal();
        
        localStorage.setItem('vinculoCurrentUser', JSON.stringify({ role, data: foundUser }));
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
    
    const clientView = document.getElementById('clientView');
    const bookingPanel = document.getElementById('bookingPanel');
    const dashboard = document.getElementById('dashboard');
    
    if (clientView) clientView.style.display = 'none';
    if (bookingPanel) bookingPanel.style.display = 'none';
    if (dashboard) dashboard.style.display = 'block';

    const isAdmin = role === 'admin';
    const isPsych = role === 'psych';

    const dashTitle = document.getElementById('dashTitle');
    if (dashTitle) {
        dashTitle.innerText = isAdmin ? "Panel Administrador" : `Panel de ${state.currentUser.data.name}`;
    }

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

    // Actualizar estadísticas inmediatamente
    setTimeout(() => {
        updateStats();
    }, 500);
    
    switchTab('citas');
}

// ============================================
// FUNCIÓN UPDATE STATS (CORREGIDA)
// ============================================
export function updateStats() {
    console.log('📊 Actualizando estadísticas...');
    
    if (!state.currentUser) {
        console.log('⚠️ No hay usuario logueado');
        return;
    }

    const miId = state.currentUser.data?.id;
    const esAdmin = state.currentUser.role === 'admin';
    
    // Filtrar citas
    let misCitas = [];
    if (esAdmin) {
        misCitas = state.appointments || [];
    } else {
        misCitas = (state.appointments || []).filter(a => a.psychId == miId);
    }
    
    console.log(`📅 Total citas encontradas: ${misCitas.length}`);
    
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
    
    if (statIncome) {
        statIncome.innerText = `$${ingresosPagados.toLocaleString()}`;
        console.log(`💰 Ingresos mostrados: $${ingresosPagados}`);
    }
    if (statCitas) {
        statCitas.innerText = misCitas.length;
        console.log(`📅 Citas mostradas: ${misCitas.length}`);
    }
    if (statPatients) {
        statPatients.innerText = pacientesUnicos.size;
        console.log(`👥 Pacientes mostrados: ${pacientesUnicos.size}`);
    }
    
    // Renderizar tabla de citas
    renderAppointmentsTable(misCitas);
}

// ============================================
// RENDERIZAR TABLA DE CITAS
// ============================================
function renderAppointmentsTable(apps) {
    const tb = document.getElementById('tableBody');
    if (!tb) {
        console.warn('⚠️ Tabla de citas no encontrada');
        return;
    }
    
    if (!apps || apps.length === 0) {
        tb.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:40px;">No hay citas</td></tr>';
        console.log('📋 Tabla vacía');
        return;
    }
    
    // Ordenar por fecha (más recientes primero)
    const sortedApps = [...apps].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tb.innerHTML = sortedApps.map(a => {
        const fechaHora = new Date(a.date + 'T' + a.time);
        const isPast = fechaHora < new Date();
        const paymentStatusColor = a.paymentStatus === 'pagado' ? '#34c759' : '#ff9500';
        const paymentStatusText = a.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente';
        const statusColor = isPast ? '#86868b' : '#34c759';
        const statusText = isPast ? 'Completada' : (a.status === 'confirmada' ? 'Confirmada' : 'Pendiente');
        
        return `
            <tr>
                <td><strong>${a.patient || '—'}</strong><br><small>${a.patientRut || ''}</small></td>
                <td>${a.psych || '—'}</td>
                <td>${a.date || '—'} <br><small>${a.time || '—'}</small></td>
                <td><span style="background:${a.type === 'online' ? '#34c759' : '#0071e3'}; color:white; padding:4px 8px; border-radius:6px; font-size:0.7rem;">${a.type === 'online' ? 'Online' : 'Presencial'}</span></td>
                <td>${a.boxName ? `<span style="background:#af52de; color:white; padding:4px 8px; border-radius:6px;">${a.boxName}</span>` : '—'}</td>
                <td><span style="color:${paymentStatusColor};">${paymentStatusText}<br><small>$${(a.price || 0).toLocaleString()}</small></span></td>
                <td><span style="color:${statusColor};">${statusText}</span></td>
                <td>
                    ${state.currentUser?.role === 'admin' ? `
                        <button onclick="editAppointment('${a.id}')" style="background:#0071e3; color:white; border:none; padding:5px 10px; border-radius:6px; margin:2px; cursor:pointer;">
                            <i class="fa fa-edit"></i>
                        </button>
                        <button onclick="cancelAppointment('${a.id}')" style="background:#ff3b30; color:white; border:none; padding:5px 10px; border-radius:6px; margin:2px; cursor:pointer;">
                            <i class="fa fa-times"></i>
                        </button>
                    ` : ''}
                    ${a.paymentStatus !== 'pagado' && state.currentUser?.role === 'admin' ? `
                        <button onclick="markAsPaid('${a.id}')" style="background:#34c759; color:white; border:none; padding:5px 10px; border-radius:6px; margin:2px; cursor:pointer;">
                            <i class="fa fa-check"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
    
    console.log(`✅ Tabla de citas actualizada con ${apps.length} registros`);
}

// ============================================
// EXPONER FUNCIONES GLOBALMENTE
// ============================================
window.switchTab = switchTab;
window.showLoginModal = showLoginModal;
window.closeLoginModal = closeLoginModal;
window.processLogin = processLogin;
window.logout = logout;
window.updateStats = updateStats;