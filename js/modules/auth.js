// js/modules/auth.js
import { cargarDatosPrivados } from './publico.js';
import * as state from './state.js';
import { showToast } from './utils.js';
import { renderStaffTable } from './profesionales.js';
import { renderMessagesTable } from './mensajes.js';
import { updatePaymentMethodsInfo, loadMyConfig } from './personalizacion.js';
import { renderPatients } from './pacientes.js';
import { renderPendingRequests, renderAppointments } from './citas.js';
import { actualizarContadoresReinicio, asegurarTablaProfesionales } from './admin.js';
import { syncProfileFromFirebase } from './profesionales.js';

// ============================================
// CONSTANTES
// ============================================
const ADMIN_EDIT_BUTTONS = [
    'adminHeroEditBtn', 'adminAboutEditBtn', 'adminAtencionEditBtn',
    'adminContactEditBtn', 'adminInstagramEditBtn'
];
const ADMIN_TABS = [
    'adminTabProfesionales', 'adminTabEspecialidades', 'adminTabPagos',
    'adminTabFondo', 'adminTabTextos', 'adminTabLogo', 'adminTabReinicio',
    'messagesTab', 'adminTabEstadisticas'
];
const COMMON_TABS = ['citas', 'solicitudes', 'pacientes'];

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function isAdmin() {
    return state.currentUser?.role === 'admin';
}
function isPsych() {
    return state.currentUser?.role === 'psych';
}

function getEmailFromUsername(username) {
    if (username.includes('@')) return username;
    const staff = state.staff || [];
    const found = staff.find(p =>
        (p.usuario && p.usuario.toLowerCase() === username.toLowerCase()) ||
        (p.name && p.name.toLowerCase() === username.toLowerCase())
    );
    return found?.email || null;
}

// ============================================
// LOGIN Y UI
// ============================================
export function showLoginModal() {
    console.log('🔓 Mostrando modal de login');
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

function actualizarUIAdmin(userData, role) {
    console.log('👑 Actualizando UI para:', role);

    const staffLink = document.querySelector('a[onclick*="showLoginModal"]');
    const staffIcon = staffLink?.querySelector('i');
    const staffText = staffLink?.childNodes[2];

    if (staffLink) {
        staffLink.setAttribute('onclick', 'mostrarMenuStaff(true); return false;');
        if (staffIcon) {
            staffIcon.className = 'fa fa-user-check';
            staffIcon.style.color = '#1E7A8A';
            staffIcon.style.opacity = '1';
        }
        if (staffText) staffText.textContent = userData.name || 'Admin';
    }

    if (role === 'admin') {
        ADMIN_EDIT_BUTTONS.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = 'flex';
        });
        if (window.mostrarTabsAdmin) window.mostrarTabsAdmin();
    }

    if (role === 'psych') {
        const psychFullData = state.staff.find(s => s.id == userData.id);
        if (psychFullData) {
            state.currentUser.data = psychFullData;
            console.log('✅ Datos completos del profesional cargados:', psychFullData.name);
            setTimeout(() => {
                if (document.getElementById('dashboard').style.display === 'block') {
                    if (typeof loadMyConfig === 'function') loadMyConfig();
                }
                if (typeof window.loadSpecialtiesInProfileSelects === 'function') window.loadSpecialtiesInProfileSelects();
            }, 1000);
        }
    }

    const generoEmoji = userData.genero === 'M' ? '♂️' : userData.genero === 'F' ? '♀️' : '';
    showToast(`✅ Sesión iniciada como ${userData.name} ${generoEmoji}`, 'success');
    setTimeout(() => window.mostrarMenuStaff(true), 500);
}

window.mostrarMenuStaff = function(desdeLogin = false) {
    if (!state.currentUser) {
        showLoginModal();
        return;
    }
    if (state.currentUser.role === 'psych') {
        const psychFullData = state.staff.find(s => s.id == state.currentUser.data.id);
        if (psychFullData) state.currentUser.data = psychFullData;
    }
    if (desdeLogin) console.log('👑 Mostrando menú después de login');

    const user = state.currentUser;
    const oldMenu = document.getElementById('staffMenu');
    if (oldMenu) oldMenu.remove();

    let opcionesMenu = '';
    if (user.role === 'admin') {
        opcionesMenu = `
            <button onclick="irADashboard()" class="menu-btn primary-action"><i class="fa fa-tachometer-alt"></i> Ir al Dashboard</button>
            <div class="menu-divider"></div>
            <div class="menu-section-title">ACCESOS RÁPIDOS</div>
            <button onclick="window.showSpecialtiesModal?.()" class="menu-btn"><i class="fa fa-tags"></i> Gestionar Especialidades</button>
            <button onclick="window.showPaymentMethodsModal?.()" class="menu-btn"><i class="fa fa-credit-card"></i> Métodos de Pago</button>
        `;
    } else if (user.role === 'psych') {
        opcionesMenu = `
            <button onclick="window.openMyProfileModal?.()" class="menu-btn primary-action"><i class="fa fa-user-edit"></i> Editar Mi Perfil</button>
            <button onclick="abrirGestionDisponibilidad()" class="menu-btn secondary-action"><i class="fa fa-clock"></i> Gestionar Disponibilidad</button>
            <div class="menu-divider"></div>
            <button onclick="irADashboard()" class="menu-btn"><i class="fa fa-tachometer-alt"></i> Ir al Dashboard</button>
        `;
    }

    const menuHTML = `
        <div id="staffMenu">
            <div class="menu-header">
                <div class="user-name">${user.data.name}</div>
                <div class="user-role"><span class="role-badge ${user.role}">${user.role === 'admin' ? 'Administrador' : 'Profesional'}</span></div>
            </div>
            <div class="menu-content">${opcionesMenu}</div>
            <div class="menu-footer">
                <button onclick="logout()" class="menu-btn logout-btn"><i class="fa fa-sign-out-alt"></i> <span>Cerrar Sesión</span></button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', menuHTML);

    const style = document.createElement('style');
    style.textContent = `
        #staffMenu{position:fixed;top:80px;right:20px;background:white;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,0.15);width:280px;z-index:9999;overflow:hidden;border:1px solid var(--gris-claro);animation:slideDown 0.2s ease}
        #staffMenu .menu-header{padding:16px;background:#f8f9fa;border-bottom:1px solid #eee}
        #staffMenu .user-name{font-weight:700;font-size:1rem;color:var(--texto-principal);margin-bottom:4px}
        #staffMenu .user-role{margin-top:4px}
        #staffMenu .role-badge{display:inline-block;padding:4px 10px;border-radius:30px;font-size:0.7rem;font-weight:600;text-transform:uppercase}
        #staffMenu .role-badge.admin{background:var(--primario);color:white}
        #staffMenu .role-badge.psych{background:var(--exito);color:white}
        #staffMenu .menu-content{padding:8px}
        #staffMenu .menu-footer{padding:8px;border-top:1px solid #eee}
        #staffMenu .menu-divider{height:1px;background:#eee;margin:8px 0}
        #staffMenu .menu-section-title{font-size:0.75rem;color:var(--texto-secundario);padding:4px 12px;text-transform:uppercase;letter-spacing:0.5px}
        #staffMenu .menu-btn{width:100%;padding:12px 16px;margin:2px 0;border:none;border-radius:8px;font-size:0.9rem;font-weight:500;text-align:left;display:flex;align-items:center;gap:12px;transition:all 0.2s;cursor:pointer;background:transparent;color:var(--texto-principal)}
        #staffMenu .menu-btn:hover{background:#f0f0f0;transform:translateX(4px)}
        #staffMenu .menu-btn.primary-action{background:var(--primario);color:white}
        #staffMenu .menu-btn.primary-action:hover{background:var(--primario-hover)}
        #staffMenu .menu-btn.secondary-action{background:var(--verde-azulado-claro);color:white}
        #staffMenu .menu-btn.secondary-action:hover{background:var(--primario)}
        #staffMenu .logout-btn{color:#dc2626}
        #staffMenu .logout-btn:hover{background:#fee2e2}
        #staffMenu .menu-btn i{width:20px;text-align:center}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
    `;
    document.head.appendChild(style);

    setTimeout(() => {
        function cerrarMenu(e) {
            if (!e.target.closest('#staffMenu') && !e.target.closest('a[onclick*="mostrarMenuStaff"]')) {
                const menu = document.getElementById('staffMenu');
                if (menu) menu.remove();
                document.removeEventListener('click', cerrarMenu);
            }
        }
        document.addEventListener('click', cerrarMenu);
    }, 100);
};

function abrirGestionDisponibilidad() {
    console.log('📅 Abriendo gestión de disponibilidad');
    if (state.currentUser?.role !== 'psych') {
        showToast('Solo profesionales pueden gestionar disponibilidad', 'error');
        return;
    }
    const dashboard = document.getElementById('dashboard');
    const clientView = document.getElementById('clientView');
    if (dashboard && dashboard.style.display === 'block') {
        window.switchTab('disponibilidad');
    } else {
        window.irADashboard();
        setTimeout(() => window.switchTab('disponibilidad'), 500);
    }
    const menu = document.getElementById('staffMenu');
    if (menu) menu.remove();
}

window.irADashboard = function() {
    console.log('📊 Cambiando a dashboard');
    document.getElementById('clientView').style.setProperty('display', 'none', 'important');
    document.getElementById('dashboard').style.setProperty('display', 'block', 'important');
    document.getElementById('bookingPanel').style.setProperty('display', 'none', 'important');

    const menu = document.getElementById('staffMenu');
    if (menu) menu.remove();

    if (state.currentUser) {
        const role = state.currentUser.role;
        const userData = state.currentUser.data;
        mostrarDashboardInmediato(role, userData);
        if (role === 'psych') {
            setTimeout(() => {
                if (typeof loadMyConfig === 'function') loadMyConfig();
            }, 500);
        }
        const esperarDatos = () => {
            if (state.dataLoaded) {
                console.log('✅ Datos cargados, renderizando tablas...');
                if (typeof renderAppointments === 'function') renderAppointments();
                if (typeof renderPendingRequests === 'function') renderPendingRequests();
                if (role === 'admin' && typeof renderStaffTable === 'function') renderStaffTable();
                if (role === 'admin' && typeof renderMessagesTable === 'function') renderMessagesTable();
                if (typeof window.updateStats === 'function') window.updateStats();
            } else {
                console.log('⏳ Esperando carga de datos...');
                setTimeout(esperarDatos, 200);
            }
        };
        esperarDatos();
    }
};

window.volverAVistaPublica = function() {
    console.log('👁️ Cambiando a vista pública');
    document.getElementById('clientView').style.setProperty('display', 'block', 'important');
    document.getElementById('dashboard').style.setProperty('display', 'none', 'important');
    document.getElementById('bookingPanel').style.setProperty('display', 'none', 'important');
    if (window.showSection) window.showSection('equipo');
};

export async function processLogin() {
    const userInput = document.getElementById('loginUser')?.value;
    const pass = document.getElementById('loginPass')?.value;
    const btn = document.getElementById('loginBtn');

    if (!userInput || !pass) {
        showToast('Ingresa usuario y contraseña', 'error');
        return;
    }
    if (btn) {
        btn.innerHTML = '<span class="spinner"></span> Verificando...';
        btn.disabled = true;
    }

    try {
        let email = userInput;
        if (!userInput.includes('@')) {
            const foundEmail = getEmailFromUsername(userInput);
            if (foundEmail) {
                email = foundEmail;
            } else if (userInput === "Admin") {
                email = "admin@vinculosalud.cl";
            } else {
                showToast('Usuario no encontrado. Verifica el nombre o usa tu email.', 'error');
                if (btn) {
                    btn.innerHTML = 'Ingresar al Panel';
                    btn.disabled = false;
                }
                return;
            }
        }

        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, pass);
        const uid = userCredential.user.uid;
        console.log('✅ Firebase Auth login exitoso. UID:', uid);

        // Caso especial: admin con credenciales predefinidas
        if (userInput === "Admin" && pass === "Nina2026") {
            console.log("✅ Acceso Admin concedido");
            const adminUser = {
                id: uid,
                name: 'Administrador',
                usuario: 'Admin',
                pass: 'Nina2026',
                email: email,
                isAdmin: true,
                isHiddenAdmin: true,
                spec: ['ADMIN_HIDDEN'],
                priceOnline: 0,
                pricePresencial: 0,
                img: '',
                whatsapp: '',
                instagram: '',
                genero: '',
                address: '',
                phone: '',
                title: '',
                bio: '',
                education: '',
                experience: 0,
                languages: ['Español'],
                bankDetails: {},
                paymentMethods: {},
                sessionDuration: 45,
                breakBetween: 10,
                availability: {},
                paymentLinks: { online: '', presencial: '', qrOnline: '', qrPresencial: '' }
            };
            await firebase.database().ref(`staff/${uid}`).update(adminUser);
            state.setCurrentUser({ role: 'admin', data: adminUser });
            closeLoginModal();
            localStorage.setItem('vinculoCurrentUser', JSON.stringify({ role: 'admin', data: adminUser, firebaseUid: uid }));
            localStorage.setItem('vinculo_user', JSON.stringify({ role: 'admin', data: adminUser }));
            actualizarUIAdmin(adminUser, 'admin');
            if (btn) {
                btn.innerHTML = 'Ingresar al Panel';
                btn.disabled = false;
            }
            return;
        }

        const foundUser = state.staff.find(s => s.email && s.email.toLowerCase() === email.toLowerCase());
        if (foundUser) {
            console.log("✅ Acceso profesional concedido:", foundUser.name);
            const role = foundUser.isAdmin ? 'admin' : 'psych';
            const psychFullData = state.staff.find(s => s.id == foundUser.id) || foundUser;
            state.setCurrentUser({ role, data: psychFullData });
            closeLoginModal();

            const userToStore = {
                role,
                firebaseUid: uid,
                data: {
                    id: psychFullData.id,
                    name: psychFullData.name,
                    email: psychFullData.email,
                    isAdmin: psychFullData.isAdmin || false,
                    usuario: psychFullData.usuario || '',
                    genero: psychFullData.genero || ''
                }
            };
            localStorage.setItem('vinculoCurrentUser', JSON.stringify(userToStore));
            localStorage.setItem('vinculo_user', JSON.stringify({ role, data: psychFullData }));

            actualizarUIAdmin(psychFullData, role);
            
            // 🔥 CARGAR DATOS PRIVADOS DESPUÉS DEL LOGIN
            if (typeof cargarDatosPrivados === 'function') {
                cargarDatosPrivados();
                console.log('📦 Datos privados solicitados después del login');
            }
            
            if (role === 'psych') {
                setTimeout(async () => {
                    await syncProfileFromFirebase();
                    console.log('✅ Perfil sincronizado después del login');
                }, 500);
            }
            setTimeout(() => {
                if (typeof loadMyConfig === 'function') loadMyConfig();
            }, 2000);
        } else {
            showToast('Usuario no autorizado en el sistema', 'error');
            await firebase.auth().signOut();
        }
    } catch (error) {
        console.error('❌ Error de autenticación:', error);
        let mensajeError = 'Error al iniciar sesión';
        if (error.code === 'auth/user-not-found') mensajeError = 'Usuario no encontrado en Authentication';
        else if (error.code === 'auth/wrong-password') mensajeError = 'Contraseña incorrecta';
        else if (error.code === 'auth/invalid-email') mensajeError = 'Email inválido';
        else if (error.code === 'auth/invalid-login-credentials') mensajeError = 'Credenciales inválidas. Verifica usuario y contraseña.';
        else if (error.message === 'Usuario no encontrado') mensajeError = 'Usuario no encontrado en el sistema';
        showToast(mensajeError, 'error');
    } finally {
        if (btn) {
            btn.innerHTML = 'Ingresar al Panel';
            btn.disabled = false;
        }
    }
}

export async function logout() {
    console.log('🚪 Cerrando sesión');
    try {
        await firebase.auth().signOut();
        console.log('✅ Sesión de Firebase Auth cerrada');
    } catch (error) {
        console.error('❌ Error al cerrar sesión en Firebase:', error);
    }

    state.setCurrentUser(null);
    localStorage.removeItem('vinculoCurrentUser');
    localStorage.removeItem('vinculo_user');

    const staffLink = document.querySelector('a[onclick*="mostrarMenuStaff"]');
    if (staffLink) {
        staffLink.setAttribute('onclick', 'showLoginModal(); return false;');
        const staffIcon = staffLink.querySelector('i');
        const staffText = staffLink.childNodes[2];
        if (staffIcon) {
            staffIcon.className = 'fa fa-lock';
            staffIcon.style.color = '#2D3E4F';
            staffIcon.style.opacity = '0.6';
        }
        if (staffText) staffText.textContent = ' staff';
    }

    ADMIN_EDIT_BUTTONS.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.style.display = 'none';
    });

    ADMIN_TABS.forEach(id => {
        const tab = document.getElementById(id);
        if (tab) tab.style.display = 'none';
    });

    window.volverAVistaPublica();
    const menu = document.getElementById('staffMenu');
    if (menu) menu.remove();
    showToast('Sesión cerrada', 'info');
}

// ============================================
// RESTABLECER CONTRASEÑA
// ============================================
export function showResetPasswordModal() {
    const modal = document.getElementById('resetPasswordModal');
    if (modal) modal.style.display = 'flex';
    const input = document.getElementById('resetEmail');
    if (input) input.value = '';
}

export function closeResetPasswordModal() {
    const modal = document.getElementById('resetPasswordModal');
    if (modal) modal.style.display = 'none';
}

export async function sendPasswordReset() {
    const email = document.getElementById('resetEmail')?.value.trim();
    if (!email) {
        showToast('Ingresa un correo electrónico', 'error');
        return;
    }
    try {
        await firebase.auth().sendPasswordResetEmail(email);
        showToast(`✅ Se ha enviado un correo a ${email} con instrucciones para restablecer tu contraseña.`, 'success');
        closeResetPasswordModal();
    } catch (error) {
        console.error('Error al enviar correo de restablecimiento:', error);
        let mensaje = 'Error al enviar el correo';
        if (error.code === 'auth/user-not-found') {
            mensaje = 'No existe una cuenta con ese correo electrónico.';
        } else if (error.code === 'auth/invalid-email') {
            mensaje = 'El correo electrónico no es válido.';
        }
        showToast(mensaje, 'error');
    }
}

// ============================================
// DASHBOARD INMEDIATO
// ============================================
function mostrarDashboardInmediato(role, userData) {
    console.log('🔄 Mostrando dashboard inmediatamente como:', role);

    const clientView = document.getElementById('clientView');
    const bookingPanel = document.getElementById('bookingPanel');
    const dashboard = document.getElementById('dashboard');

    if (!dashboard) {
        console.error('❌ Elemento dashboard no encontrado');
        return;
    }

    if (clientView) clientView.style.setProperty('display', 'none', 'important');
    if (bookingPanel) bookingPanel.style.setProperty('display', 'none', 'important');
    dashboard.style.setProperty('display', 'block', 'important');
    dashboard.style.setProperty('visibility', 'visible', 'important');
    dashboard.style.setProperty('opacity', '1', 'important');
    dashboard.style.setProperty('z-index', '1000', 'important');

    const dashTitle = document.getElementById('dashTitle');
    const dashSubtitle = document.getElementById('dashSubtitle');
    if (dashTitle) dashTitle.innerText = role === 'admin' ? 'Panel Administrador' : 'Mi Panel Profesional';
    if (dashSubtitle && userData) dashSubtitle.innerText = `Bienvenido, ${userData.name} ${userData.genero === 'M' ? '♂️' : userData.genero === 'F' ? '♀️' : ''}`;

    console.log('🔧 Forzando visibilidad de pestañas para rol:', role);
    ADMIN_TABS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.setProperty('display', role === 'admin' ? 'inline-block' : 'none', 'important');
    });

    // Pestañas específicas de psicólogo (solo la que tiene contenido real)
    const psychTabs = ['psychTab']; // Solo la que existe en HTML
    psychTabs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.setProperty('display', role === 'psych' ? 'inline-block' : 'none', 'important');
    });

    COMMON_TABS.forEach(tabName => {
        const tab = Array.from(document.querySelectorAll('.tab')).find(t => t.textContent.toLowerCase().includes(tabName));
        if (tab) tab.style.setProperty('display', 'inline-block', 'important');
    });

    const calendarTab = document.getElementById('adminTabCalendario');
    if (calendarTab) calendarTab.style.setProperty('display', 'inline-block', 'important');

    const fichasTab = document.getElementById('adminTabFichas');
    if (fichasTab) fichasTab.style.setProperty('display', 'inline-block', 'important');

    const profileBtn = document.getElementById('editProfileButton');
    if (profileBtn) {
        if (role === 'psych') {
            profileBtn.style.setProperty('display', 'inline-flex', 'important');
            profileBtn.onclick = window.openMyProfileModal;
            profileBtn.innerHTML = '<i class="fa fa-user-edit"></i> Editar Mi Perfil';
        } else {
            profileBtn.style.setProperty('display', 'none', 'important');
        }
    }

    setTimeout(() => updateStats(), 500);
    switchTab('citas');
    console.log('✅ Dashboard forzado a visible con todas las pestañas configuradas');
}

// ============================================
// CAMBIO DE PESTAÑAS
// ============================================
export function switchTab(tabName) {
    console.log('🔄 Cambiando a pestaña:', tabName);
    document.querySelectorAll('#dashboardTabs .tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const tabs = document.querySelectorAll('#dashboardTabs .tab');
    let tabActivated = false;
    for (const tab of tabs) {
        const onclick = tab.getAttribute('onclick');
        if (onclick && onclick.includes(`'${tabName}'`)) {
            tab.classList.add('active');
            tabActivated = true;
            console.log(`✅ Pestaña activada por onclick: ${tab.textContent}`);
            break;
        }
        if (tab.textContent.toLowerCase().includes(tabName.toLowerCase())) {
            tab.classList.add('active');
            tabActivated = true;
            console.log(`✅ Pestaña activada por texto: ${tab.textContent}`);
            break;
        }
        if (tab.id && tab.id.toLowerCase().includes(tabName.toLowerCase())) {
            tab.classList.add('active');
            tabActivated = true;
            console.log(`✅ Pestaña activada por ID: ${tab.id}`);
            break;
        }
    }
    if (!tabActivated && tabs.length > 0) {
        tabs[0].classList.add('active');
        console.log(`✅ Activando primera pestaña por defecto: ${tabs[0].textContent}`);
    }

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
        'agendar': 'tabAgendar',
        'estadisticas': 'tabEstadisticas',
        'calendario': 'tabCalendario',
        'fichas': 'tabFichas'
    };
    const contentId = tabMap[tabName] || `tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`;
    const content = document.getElementById(contentId);
    if (content) {
        content.classList.add('active');
        console.log(`✅ Contenido activado: ${contentId}`);
        setTimeout(() => {
            try {
                if (tabName === 'pacientes' && typeof renderPatients === 'function') renderPatients();
                else if (tabName === 'citas') {
                    // Usar la nueva función de renderizado de citas si existe, si no la antigua
                    if (typeof window.renderAppointmentsTable === 'function') window.renderAppointmentsTable();
                    else if (typeof renderAppointments === 'function') renderAppointments();
                }
                else if (tabName === 'solicitudes' && typeof renderPendingRequests === 'function') renderPendingRequests();
                else if (tabName === 'profesionales' && isAdmin()) {
                    asegurarTablaProfesionales();
                    if (typeof renderStaffTable === 'function') renderStaffTable();
                }
                else if (tabName === 'mensajes' && isAdmin() && typeof renderMessagesTable === 'function') renderMessagesTable();
                else if (tabName === 'disponibilidad' && isPsych() && typeof window.loadTimeSlots === 'function') window.loadTimeSlots();
                else if (tabName === 'configuracion' && isPsych() && typeof loadMyConfig === 'function') loadMyConfig();
                else if (tabName === 'pagos' && isAdmin() && typeof updatePaymentMethodsInfo === 'function') updatePaymentMethodsInfo();
                else if (tabName === 'reinicio' && isAdmin() && typeof actualizarContadoresReinicio === 'function') actualizarContadoresReinicio();
                else if (tabName === 'estadisticas' && isAdmin() && window.estadisticas && typeof window.estadisticas.renderPanelEstadisticas === 'function') window.estadisticas.renderPanelEstadisticas();
                else if (tabName === 'calendario' && typeof window.renderCalendar === 'function') window.renderCalendar();
                else if (tabName === 'fichas' && window.fichasClinicas && typeof window.fichasClinicas.renderFichasConFiltros === 'function') {
                    if (window.fichasClinicas.cargarSelectProfesionales) window.fichasClinicas.cargarSelectProfesionales();
                    window.fichasClinicas.renderFichasConFiltros();
                }
            } catch (error) {
                console.error(`❌ Error cargando datos para ${tabName}:`, error);
            }
        }, 100);
    } else {
        console.warn(`⚠️ No se encontró contenido para: ${contentId}`);
    }
}

// ============================================
// ESTADÍSTICAS Y PERFIL
// ============================================
export function updateStats() {
    console.log('📊 Actualizando estadísticas...');
    if (!state.currentUser) {
        console.log('⚠️ No hay usuario logueado');
        return;
    }
    const miId = state.currentUser.data?.id;
    const esAdmin = isAdmin();
    const misCitas = esAdmin
        ? state.appointments || []
        : (state.appointments || []).filter(a => a.psychId == miId);

    const ingresosPagados = misCitas
        .filter(a => a.paymentStatus === 'pagado')
        .reduce((sum, a) => sum + (a.price || 0), 0);

    const pacientesUnicos = new Set();
    misCitas.forEach(a => {
        if (a.patientId) pacientesUnicos.add(a.patientId);
    });

    const statIncome = document.getElementById('statIncome');
    const statCitas = document.getElementById('statCitas');
    const statPatients = document.getElementById('statPatients');

    if (statIncome) statIncome.innerText = `$${ingresosPagados.toLocaleString()}`;
    if (statCitas) statCitas.innerText = misCitas.length;
    if (statPatients) statPatients.innerText = pacientesUnicos.size;
}

export function updateProfileButton() {
    const profileBtn = document.getElementById('editProfileButton');
    if (!profileBtn) return;
    if (isPsych()) {
        profileBtn.style.display = 'inline-flex';
        profileBtn.onclick = window.openMyProfileModal;
        profileBtn.innerHTML = '<i class="fa fa-user-edit"></i> Editar Mi Perfil';
    } else {
        profileBtn.style.display = 'none';
    }
}

// ============================================
// RESTAURAR SESIÓN
// ============================================
export async function verificarSesionGuardada() {
    console.log('🔍 Verificando sesión guardada...');
    const savedUserFull = localStorage.getItem('vinculo_user');
    if (savedUserFull) {
        try {
            const userData = JSON.parse(savedUserFull);
            console.log('📦 Sesión completa encontrada:', userData);
            if (userData.role === 'admin') {
                state.setCurrentUser({ role: 'admin', data: userData.data });
                actualizarUIAdmin(userData.data, 'admin');
                // Cargar datos privados después de restaurar admin
                if (typeof cargarDatosPrivados === 'function') cargarDatosPrivados();
                return true;
            } else if (userData.role === 'psych') {
                const exists = state.staff.some(s => s.id === userData.data.id);
                if (exists || !state.staff.length) {
                    state.setCurrentUser({ role: 'psych', data: userData.data });
                    actualizarUIAdmin(userData.data, 'psych');
                    if (!exists && state.staff.length) state.staff.push(userData.data);
                    // Cargar datos privados después de restaurar psicólogo
                    if (typeof cargarDatosPrivados === 'function') cargarDatosPrivados();
                    return true;
                }
            }
        } catch (e) {
            console.error('Error al leer vinculo_user:', e);
        }
    }

    const savedUser = localStorage.getItem('vinculoCurrentUser');
    if (!savedUser) {
        console.log('ℹ️ No hay sesión guardada');
        return false;
    }

    try {
        const userData = JSON.parse(savedUser);
        console.log('📦 Sesión básica encontrada:', userData);
        if (userData.firebaseUid) {
            try {
                const currentUser = firebase.auth().currentUser;
                if (currentUser && currentUser.uid === userData.firebaseUid) {
                    console.log('✅ Sesión de Firebase Auth activa:', currentUser.uid);
                } else {
                    console.log('⚠️ No hay sesión activa en Firebase Auth');
                    localStorage.removeItem('vinculoCurrentUser');
                    return false;
                }
            } catch (e) {
                console.error('❌ Error verificando Firebase Auth:', e);
            }
        }

        if (userData.role === 'admin') {
            state.setCurrentUser({ role: 'admin', data: userData.data });
            actualizarUIAdmin(userData.data, 'admin');
            // Cargar datos privados después de restaurar admin
            if (typeof cargarDatosPrivados === 'function') cargarDatosPrivados();
            return true;
        } else {
            const psychExists = state.staff.some(s => s.id == userData.data.id);
            if (psychExists) {
                const psychFullData = state.staff.find(s => s.id == userData.data.id);
                state.setCurrentUser({ role: 'psych', data: psychFullData });
                actualizarUIAdmin(psychFullData, 'psych');
                localStorage.setItem('vinculo_user', JSON.stringify({ role: 'psych', data: psychFullData }));
                // Cargar datos privados después de restaurar psicólogo
                if (typeof cargarDatosPrivados === 'function') cargarDatosPrivados();
                return true;
            } else {
                state.setCurrentUser({ role: 'psych', data: userData.data });
                actualizarUIAdmin(userData.data, 'psych');
                console.log('⚠️ Profesional no encontrado en staff, usando datos básicos');
                // Cargar datos privados después de restaurar psicólogo
                if (typeof cargarDatosPrivados === 'function') cargarDatosPrivados();
                return true;
            }
        }
    } catch (error) {
        console.error('❌ Error al leer sesión guardada:', error);
        localStorage.removeItem('vinculoCurrentUser');
        return false;
    }
}

// ============================================
// EXPOSICIÓN GLOBAL Y AUTOINICIALIZACIÓN
// ============================================
if (typeof window !== 'undefined') {
    window.showLoginModal = showLoginModal;
    window.closeLoginModal = closeLoginModal;
    window.processLogin = processLogin;
    window.logout = logout;
    window.switchTab = switchTab;
    window.updateStats = updateStats;
    window.updateProfileButton = updateProfileButton;
    window.verificarSesionGuardada = verificarSesionGuardada;
    window.irADashboard = irADashboard;
    window.volverAVistaPublica = volverAVistaPublica;
    window.abrirGestionDisponibilidad = abrirGestionDisponibilidad;
    // Funciones para restablecer contraseña
    window.showResetPasswordModal = showResetPasswordModal;
    window.closeResetPasswordModal = closeResetPasswordModal;
    window.sendPasswordReset = sendPasswordReset;
}

(function initAuth() {
    console.log('🔧 Inicializando autenticación...');
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            console.log('✅ Usuario autenticado en Firebase:', user.uid);
            const savedUser = localStorage.getItem('vinculoCurrentUser');
            if (savedUser) {
                try {
                    const userData = JSON.parse(savedUser);
                    if (userData.firebaseUid === user.uid) {
                        console.log('📦 Sesión sincronizada con Firebase');
                        if (!state.currentUser) {
                            if (userData.role === 'admin') {
                                state.setCurrentUser({ role: 'admin', data: userData.data });
                                actualizarUIAdmin(userData.data, 'admin');
                            } else {
                                const psychFullData = state.staff.find(s => s.id == userData.data.id);
                                if (psychFullData) {
                                    state.setCurrentUser({ role: 'psych', data: psychFullData });
                                    actualizarUIAdmin(psychFullData, 'psych');
                                }
                            }
                            // Cargar datos privados después de restaurar sesión por Auth
                            if (typeof cargarDatosPrivados === 'function') cargarDatosPrivados();
                        }
                    }
                } catch (e) {
                    console.error('❌ Error procesando sesión guardada:', e);
                }
            }
        } else {
            console.log('ℹ️ No hay usuario autenticado en Firebase');
            const savedUser = localStorage.getItem('vinculoCurrentUser');
            if (!savedUser && state.currentUser) {
                console.log('🧹 Limpiando estado local sin sesión');
                state.setCurrentUser(null);
            }
        }
    });

    setTimeout(() => {
        const savedUser = localStorage.getItem('vinculoCurrentUser');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                console.log('📦 Sesión encontrada en localStorage:', userData);
                if (userData.role === 'admin') {
                    const adminFullData = state.staff.find(s => s.id == userData.data.id) || userData.data;
                    state.setCurrentUser({ role: 'admin', data: adminFullData });
                    const staffLink = document.querySelector('a[onclick*="showLoginModal"]');
                    if (staffLink) {
                        staffLink.setAttribute('onclick', 'mostrarMenuStaff(true); return false;');
                        const icon = staffLink.querySelector('i');
                        if (icon) {
                            icon.className = 'fa fa-user-check';
                            icon.style.color = '#1E7A8A';
                        }
                        const textNode = staffLink.childNodes[2];
                        if (textNode) textNode.textContent = adminFullData.name || 'Admin';
                    }
                    console.log('✅ Sesión de admin restaurada automáticamente');
                    // Cargar datos privados después de restaurar admin
                    if (typeof cargarDatosPrivados === 'function') cargarDatosPrivados();
                }
            } catch (e) {
                console.error('❌ Error restaurando sesión:', e);
            }
        } else {
            console.log('ℹ️ No hay sesión guardada');
        }
    }, 1000);
})();

console.log('✅ auth.js refactorizado: constantes centralizadas, lógica limpia, restablecimiento de contraseña');