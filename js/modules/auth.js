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

    // Buscar el usuario en STAFF (para saber si es admin o psicólogo)
    const foundUser = state.staff.find(s => 
        (s.usuario === user || s.name === user) && s.pass === pass
    );

    if (!foundUser) {
        showToast('Usuario o contraseña incorrectos', 'error');
        btn.innerHTML = 'Ingresar al Panel';
        btn.disabled = false;
        return;
    }

    // Iniciar sesión en Firebase Auth con email/contraseña
    // Nota: Firebase Auth requiere email, así que usamos el email del profesional
    const email = foundUser.email || `${user}@vinculosalud.cl`;
    
    firebase.auth().signInWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            // Usuario autenticado correctamente
            const firebaseUser = userCredential.user;
            console.log("✅ Autenticación exitosa en Firebase:", firebaseUser.uid);
            
            // Configurar el usuario en el estado de la app
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
            // Si el usuario no existe en Firebase Auth, lo creamos automáticamente
            if (error.code === 'auth/user-not-found') {
                // Crear usuario en Firebase Auth
                firebase.auth().createUserWithEmailAndPassword(email, pass)
                    .then((userCredential) => {
                        console.log("✅ Usuario creado en Firebase Auth:", userCredential.user.uid);
                        
                        // Iniciar sesión nuevamente
                        return firebase.auth().signInWithEmailAndPassword(email, pass);
                    })
                    .then(() => {
                        // Configurar el usuario en el estado de la app
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
            btn.innerHTML = 'Ingresar al Panel';
            btn.disabled = false;
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
// FUNCIONES DEL DASHBOARD (se mantienen igual)
// ============================================

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
    document.getElementById('adminTabReinicio').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('psychTab').style.display = isPsych ? 'block' : 'none';
    document.getElementById('configTab').style.display = isPsych ? 'block' : 'none';
    document.getElementById('messagesTab').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('boxesTab').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('agendarTab').style.display = isPsych ? 'block' : 'none';

    if (isAdmin) {
        document.getElementById('dashTitle').innerText = "Panel Administrador";
        renderStaffTable();
        renderMessagesTable();
        renderBoxesTable();
        updatePaymentMethodsInfo();
        
        setTimeout(() => {
            import('./admin.js').then(mod => {
                if (mod.actualizarContadoresReinicio) {
                    mod.actualizarContadoresReinicio();
                }
            });
        }, 1000);
    } else {
        document.getElementById('dashTitle').innerText = `Panel de ${state.currentUser.data.name}`;
        document.getElementById('availDate').min = new Date().toISOString().split('T')[0];
        loadMyConfig();
        renderBoxOccupancy();
    }

    updateStats();
    renderPatients();
    renderPendingRequests();
    switchTab('citas');
}

export function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
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

    if (tabName === 'pacientes') renderPatients();
    if (tabName === 'disponibilidad' && state.currentUser?.role === 'psych') {
        import('./disponibilidad.js').then(mod => mod.loadTimeSlots());
    }
    if (tabName === 'configuracion' && state.currentUser?.role === 'psych') {
        loadMyConfig();
    }
    if (tabName === 'mensajes' && state.currentUser?.role === 'admin') {
        renderMessagesTable();
    }
    if (tabName === 'boxes' && state.currentUser?.role === 'admin') {
        renderBoxesTable();
    }
    if (tabName === 'boxes' && state.currentUser?.role === 'psych') {
        renderBoxOccupancy();
    }
    if (tabName === 'solicitudes') {
        renderPendingRequests();
    }
    if (tabName === 'reinicio' && state.currentUser?.role === 'admin') {
        import('./admin.js').then(mod => {
            if (mod.actualizarContadoresReinicio) {
                mod.actualizarContadoresReinicio();
            }
        });
    }
}

export function updateStats() {
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

// Funciones de edición de citas (se llaman desde el HTML)
window.editAppointment = (id) => {
    import('./citas.js').then(mod => mod.editAppointment(id));
};

window.cancelAppointment = (id) => {
    import('./citas.js').then(mod => mod.cancelAppointment(id));
};

window.markAsPaid = (id) => {
    import('./citas.js').then(mod => mod.markAsPaid(id));
};