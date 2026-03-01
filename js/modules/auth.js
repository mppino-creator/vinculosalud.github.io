// js/modules/auth.js
import * as state from './state.js';
import { showToast, getPublicStaff } from './utils.js';
import { renderStaffTable } from './profesionales.js';
import { renderMessagesTable } from './mensajes.js';
import { renderBoxesTable, renderBoxOccupancy } from './boxes.js';
import { updatePaymentMethodsInfo, loadMyConfig } from './personalizacion.js';
import { renderPatients } from './pacientes.js';
import { renderPendingRequests } from './citas.js';

// ============================================
// FUNCIONES DE LOGIN CON FIREBASE AUTH
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
    const userInput = document.getElementById('loginUser');
    const passInput = document.getElementById('loginPass');
    const btn = document.getElementById('loginBtn');
    
    const user = userInput?.value;
    const pass = passInput?.value;

    if (!user || !pass) {
        showToast('Ingresa usuario y contraseña', 'error');
        return;
    }

    if (btn) {
        btn.innerHTML = '<span class="spinner"></span> Verificando...';
        btn.disabled = true;
    }

    // Buscar el usuario en STAFF
    const foundUser = state.staff.find(s => 
        (s.usuario === user || s.name === user) && s.pass === pass
    );

    if (!foundUser) {
        showToast('Usuario o contraseña incorrectos', 'error');
        if (btn) {
            btn.innerHTML = 'Ingresar al Panel';
            btn.disabled = false;
        }
        return;
    }

    // Iniciar sesión en Firebase Auth
    const email = foundUser.email || `${user}@vinculosalud.cl`;
    
    firebase.auth().signInWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            console.log("✅ Autenticación exitosa en Firebase:", userCredential.user.uid);
            
            if (foundUser.spec && foundUser.spec.includes('ADMIN_HIDDEN') || foundUser.isHiddenAdmin) {
                state.setCurrentUser({ role: 'admin', data: foundUser });
            } else {
                state.setCurrentUser({ role: 'psych', data: foundUser });
            }
            
            closeLoginModal();
            // Pequeño retraso para asegurar que el DOM esté listo
            setTimeout(() => {
                try {
                    showDashboard();
                } catch (error) {
                    console.error("Error en showDashboard:", error);
                    // Si falla, recargamos la página
                    location.reload();
                }
            }, 100);
            
            showToast(`Bienvenido ${foundUser.name}`, 'success');
        })
        .catch((error) => {
            if (error.code === 'auth/user-not-found') {
                firebase.auth().createUserWithEmailAndPassword(email, pass)
                    .then((userCredential) => {
                        console.log("✅ Usuario creado en Firebase Auth:", userCredential.user.uid);
                        return firebase.auth().signInWithEmailAndPassword(email, pass);
                    })
                    .then(() => {
                        if (foundUser.spec && foundUser.spec.includes('ADMIN_HIDDEN') || foundUser.isHiddenAdmin) {
                            state.setCurrentUser({ role: 'admin', data: foundUser });
                        } else {
                            state.setCurrentUser({ role: 'psych', data: foundUser });
                        }
                        
                        closeLoginModal();
                        setTimeout(() => {
                            try {
                                showDashboard();
                            } catch (error) {
                                console.error("Error en showDashboard:", error);
                                location.reload();
                            }
                        }, 100);
                        showToast(`Bienvenido ${foundUser.name}`, 'success');
                    })
                    .catch((createError) => {
                        console.error("❌ Error al crear usuario:", createError);
                        showToast('Error al crear usuario en Firebase', 'error');
                    });
            } else {
                console.error("❌ Error de autenticación:", error);
                showToast('Error de autenticación', 'error');
            }
        })
        .finally(() => {
            if (btn) {
                btn.innerHTML = 'Ingresar al Panel';
                btn.disabled = false;
            }
        });
}

export function logout() {
    firebase.auth().signOut()
        .then(() => {
            console.log("✅ Sesión cerrada");
            state.setCurrentUser(null);
            location.reload();
        })
        .catch((error) => {
            console.error("❌ Error al cerrar sesión:", error);
            state.setCurrentUser(null);
            location.reload();
        });
}

// ============================================
// FUNCIONES DEL DASHBOARD (VERSIÓN ULTRA-SEGURA)
// ============================================

export function showDashboard() {
    console.log("🔄 Ejecutando showDashboard");
    
    // Verificar que los elementos existen ANTES de usarlos
    const safeSetStyle = (id, property, value) => {
        const el = document.getElementById(id);
        if (el && el.style) {
            el.style[property] = value;
            return true;
        }
        console.log(`⚠️ Elemento no encontrado: ${id}`);
        return false;
    };

    const safeSetText = (id, text) => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = text;
            return true;
        }
        return false;
    };

    // Ocultar vistas previas
    safeSetStyle('clientView', 'display', 'none');
    safeSetStyle('bookingPanel', 'display', 'none');
    safeSetStyle('dashboard', 'display', 'block');

    if (!state.currentUser) {
        console.error("❌ No hay usuario actual");
        return;
    }

    const isAdmin = state.currentUser.role === 'admin';
    const isPsych = state.currentUser.role === 'psych';

    // Mostrar/ocultar pestañas según el rol
    const tabs = [
        'adminTabProfesionales', 'adminTabEspecialidades', 'adminTabPagos',
        'adminTabFondo', 'adminTabTextos', 'adminTabLogo', 'adminTabReinicio',
        'psychTab', 'configTab', 'messagesTab', 'boxesTab', 'agendarTab'
    ];
    
    tabs.forEach(id => {
        const show = id.includes('admin') ? isAdmin : 
                    (id === 'psychTab' || id === 'configTab' || id === 'agendarTab') ? isPsych : 
                    (id === 'messagesTab' || id === 'boxesTab') ? isAdmin : false;
        safeSetStyle(id, 'display', show ? 'block' : 'none');
    });

    if (isAdmin) {
        safeSetText('dashTitle', "Panel Administrador");
        
        // Llamar funciones de admin con try-catch
        try { if (typeof renderStaffTable === 'function') renderStaffTable(); } catch (e) { console.error("Error en renderStaffTable:", e); }
        try { if (typeof renderMessagesTable === 'function') renderMessagesTable(); } catch (e) { console.error("Error en renderMessagesTable:", e); }
        try { if (typeof renderBoxesTable === 'function') renderBoxesTable(); } catch (e) { console.error("Error en renderBoxesTable:", e); }
        try { if (typeof updatePaymentMethodsInfo === 'function') updatePaymentMethodsInfo(); } catch (e) { console.error("Error en updatePaymentMethodsInfo:", e); }
        
        setTimeout(() => {
            import('./admin.js').then(mod => {
                if (mod && typeof mod.actualizarContadoresReinicio === 'function') {
                    try { mod.actualizarContadoresReinicio(); } catch (e) { console.error("Error en actualizarContadoresReinicio:", e); }
                }
            }).catch(err => console.log('Admin module not available'));
        }, 1000);
    } else if (isPsych) {
        safeSetText('dashTitle', `Panel de ${state.currentUser.data?.name || 'Psicólogo'}`);
        
        const availDate = document.getElementById('availDate');
        if (availDate) availDate.min = new Date().toISOString().split('T')[0];
        
        try { if (typeof loadMyConfig === 'function') loadMyConfig(); } catch (e) { console.error("Error en loadMyConfig:", e); }
        try { if (typeof renderBoxOccupancy === 'function') renderBoxOccupancy(); } catch (e) { console.error("Error en renderBoxOccupancy:", e); }
    }

    try { if (typeof updateStats === 'function') updateStats(); } catch (e) { console.error("Error en updateStats:", e); }
    try { if (typeof renderPatients === 'function') renderPatients(); } catch (e) { console.error("Error en renderPatients:", e); }
    try { if (typeof renderPendingRequests === 'function') renderPendingRequests(); } catch (e) { console.error("Error en renderPendingRequests:", e); }
    
    // Cambiar a la pestaña de citas
    try { if (typeof switchTab === 'function') switchTab('citas'); } catch (e) { console.error("Error en switchTab:", e); }
    
    console.log("✅ showDashboard completado");
}

export function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    if (!tabs || tabs.length === 0) return;
    
    tabs.forEach(t => t.classList.remove('active'));
    
    tabs.forEach(t => {
        const text = t.textContent.trim();
        if (text.toLowerCase().includes(tabName.toLowerCase()) || 
            (tabName === 'citas' && text === 'Citas') ||
            (tabName === 'solicitudes' && text === 'Solicitudes Pendientes') ||
            (tabName === 'pacientes' && text === 'Pacientes') ||
            (tabName === 'profesionales' && text === 'Profesionales') ||
            (tabName === 'especialidades' && text === 'Especialidades') ||
            (tabName === 'pagos' && text === 'Métodos de Pago') ||
            (tabName === 'fondo' && text === 'Fondo') ||
            (tabName === 'logo' && text === 'Logo') ||
            (tabName === 'textos' && text === 'Textos') ||
            (tabName === 'disponibilidad' && text === 'Disponibilidad') ||
            (tabName === 'configuracion' && text === 'Mi Config') ||
            (tabName === 'mensajes' && text === 'Mensajes') ||
            (tabName === 'boxes' && text === 'Boxes') ||
            (tabName === 'agendar' && text === 'Agendar Cita') ||
            (tabName === 'reinicio' && text === '🔄 Reinicio')) {
            t.classList.add('active');
        }
    });

    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const tabId = 'tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1);
    const element = document.getElementById(tabId);
    if (element) element.classList.add('active');

    // Cargar contenido según la pestaña
    if (tabName === 'pacientes' && typeof renderPatients === 'function') {
        try { renderPatients(); } catch (e) { console.error("Error en renderPatients:", e); }
    }
    if (tabName === 'disponibilidad' && state.currentUser?.role === 'psych') {
        import('./disponibilidad.js').then(mod => {
            if (mod && typeof mod.loadTimeSlots === 'function') {
                try { mod.loadTimeSlots(); } catch (e) { console.error("Error en loadTimeSlots:", e); }
            }
        });
    }
    if (tabName === 'configuracion' && state.currentUser?.role === 'psych') {
        if (typeof loadMyConfig === 'function') {
            try { loadMyConfig(); } catch (e) { console.error("Error en loadMyConfig:", e); }
        }
    }
    if (tabName === 'mensajes' && state.currentUser?.role === 'admin') {
        if (typeof renderMessagesTable === 'function') {
            try { renderMessagesTable(); } catch (e) { console.error("Error en renderMessagesTable:", e); }
        }
    }
    if (tabName === 'boxes' && state.currentUser?.role === 'admin') {
        if (typeof renderBoxesTable === 'function') {
            try { renderBoxesTable(); } catch (e) { console.error("Error en renderBoxesTable:", e); }
        }
    }
    if (tabName === 'boxes' && state.currentUser?.role === 'psych') {
        if (typeof renderBoxOccupancy === 'function') {
            try { renderBoxOccupancy(); } catch (e) { console.error("Error en renderBoxOccupancy:", e); }
        }
    }
    if (tabName === 'solicitudes' && typeof renderPendingRequests === 'function') {
        try { renderPendingRequests(); } catch (e) { console.error("Error en renderPendingRequests:", e); }
    }
    if (tabName === 'reinicio' && state.currentUser?.role === 'admin') {
        import('./admin.js').then(mod => {
            if (mod && typeof mod.actualizarContadoresReinicio === 'function') {
                try { mod.actualizarContadoresReinicio(); } catch (e) { console.error("Error en actualizarContadoresReinicio:", e); }
            }
        });
    }
}

export function updateStats() {
    if (!state.currentUser) return;
    
    const myApps = state.currentUser.role === 'admin' 
        ? state.appointments 
        : state.appointments.filter(a => a.psychId == state.currentUser.data.id);
    const myPatients = state.currentUser.role === 'admin' 
        ? state.patients 
        : state.patients.filter(p => p.psychId == state.currentUser.data.id);
    const totalIncome = myApps.reduce((s, a) => s + a.price, 0);

    const statIncome = document.getElementById('statIncome');
    const statCitas = document.getElementById('statCitas');
    const statPatients = document.getElementById('statPatients');
    
    if (statIncome) statIncome.innerText = `$${totalIncome.toLocaleString()}`;
    if (statCitas) statCitas.innerText = myApps.length;
    if (statPatients) statPatients.innerText = myPatients.length;
    
    renderAppointmentsTable(myApps);
}

function renderAppointmentsTable(apps) {
    const tb = document.getElementById('tableBody');
    if (!tb) return;
    
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

// Funciones de edición de citas (se llaman desde el HTML)
window.editAppointment = (id) => {
    import('./citas.js').then(mod => {
        if (mod && typeof mod.editAppointment === 'function') mod.editAppointment(id);
    });
};

window.cancelAppointment = (id) => {
    import('./citas.js').then(mod => {
        if (mod && typeof mod.cancelAppointment === 'function') mod.cancelAppointment(id);
    });
};

window.markAsPaid = (id) => {
    import('./citas.js').then(mod => {
        if (mod && typeof mod.markAsPaid === 'function') mod.markAsPaid(id);
    });
};