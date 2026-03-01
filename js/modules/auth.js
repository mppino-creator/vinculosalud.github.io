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
            showDashboard();
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
                        showDashboard();
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
// FUNCIONES DEL DASHBOARD (VERSIÓN CORREGIDA)
// ============================================

export function showDashboard() {
    // Verificar que los elementos existen antes de usarlos
    const clientView = document.getElementById('clientView');
    const bookingPanel = document.getElementById('bookingPanel');
    const dashboard = document.getElementById('dashboard');
    
    if (clientView) clientView.style.display = 'none';
    if (bookingPanel) bookingPanel.style.display = 'none';
    if (dashboard) dashboard.style.display = 'block';

    const isAdmin = state.currentUser.role === 'admin';
    const isPsych = state.currentUser.role === 'psych';

    // Función auxiliar para mostrar/ocultar tabs de forma segura
    const setTabDisplay = (id, show) => {
        const el = document.getElementById(id);
        if (el) el.style.display = show ? 'block' : 'none';
    };

    // Mostrar/ocultar pestañas según el rol
    setTabDisplay('adminTabProfesionales', isAdmin);
    setTabDisplay('adminTabEspecialidades', isAdmin);
    setTabDisplay('adminTabPagos', isAdmin);
    setTabDisplay('adminTabFondo', isAdmin);
    setTabDisplay('adminTabTextos', isAdmin);
    setTabDisplay('adminTabLogo', isAdmin);
    setTabDisplay('adminTabReinicio', isAdmin);
    setTabDisplay('psychTab', isPsych);
    setTabDisplay('configTab', isPsych);
    setTabDisplay('messagesTab', isAdmin);
    setTabDisplay('boxesTab', isAdmin);
    setTabDisplay('agendarTab', isPsych);

    if (isAdmin) {
        const dashTitle = document.getElementById('dashTitle');
        if (dashTitle) dashTitle.innerText = "Panel Administrador";
        
        // Verificar que estas funciones existan antes de llamarlas
        if (typeof renderStaffTable === 'function') renderStaffTable();
        if (typeof renderMessagesTable === 'function') renderMessagesTable();
        if (typeof renderBoxesTable === 'function') renderBoxesTable();
        if (typeof updatePaymentMethodsInfo === 'function') updatePaymentMethodsInfo();
        
        setTimeout(() => {
            import('./admin.js').then(mod => {
                if (mod && typeof mod.actualizarContadoresReinicio === 'function') {
                    mod.actualizarContadoresReinicio();
                }
            }).catch(err => console.log('Admin module not available'));
        }, 1000);
    } else {
        const dashTitle = document.getElementById('dashTitle');
        if (dashTitle) dashTitle.innerText = `Panel de ${state.currentUser.data.name}`;
        
        const availDate = document.getElementById('availDate');
        if (availDate) availDate.min = new Date().toISOString().split('T')[0];
        
        if (typeof loadMyConfig === 'function') loadMyConfig();
        if (typeof renderBoxOccupancy === 'function') renderBoxOccupancy();
    }

    if (typeof updateStats === 'function') updateStats();
    if (typeof renderPatients === 'function') renderPatients();
    if (typeof renderPendingRequests === 'function') renderPendingRequests();
    
    // Cambiar a la pestaña de citas
    if (typeof switchTab === 'function') switchTab('citas');
}

export function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    if (!tabs) return;
    
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

    if (tabName === 'pacientes' && typeof renderPatients === 'function') renderPatients();
    if (tabName === 'disponibilidad' && state.currentUser?.role === 'psych') {
        import('./disponibilidad.js').then(mod => {
            if (mod && typeof mod.loadTimeSlots === 'function') mod.loadTimeSlots();
        });
    }
    if (tabName === 'configuracion' && state.currentUser?.role === 'psych') {
        if (typeof loadMyConfig === 'function') loadMyConfig();
    }
    if (tabName === 'mensajes' && state.currentUser?.role === 'admin') {
        if (typeof renderMessagesTable === 'function') renderMessagesTable();
    }
    if (tabName === 'boxes' && state.currentUser?.role === 'admin') {
        if (typeof renderBoxesTable === 'function') renderBoxesTable();
    }
    if (tabName === 'boxes' && state.currentUser?.role === 'psych') {
        if (typeof renderBoxOccupancy === 'function') renderBoxOccupancy();
    }
    if (tabName === 'solicitudes' && typeof renderPendingRequests === 'function') {
        renderPendingRequests();
    }
    if (tabName === 'reinicio' && state.currentUser?.role === 'admin') {
        import('./admin.js').then(mod => {
            if (mod && typeof mod.actualizarContadoresReinicio === 'function') {
                mod.actualizarContadoresReinicio();
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