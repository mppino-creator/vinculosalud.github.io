// js/modules/auth.js
import * as state from './state.js';
import { showToast } from './utils.js';
import { renderStaffTable } from './profesionales.js';
import { renderMessagesTable } from './mensajes.js';
import { renderBoxesTable, renderBoxOccupancy } from './boxes.js';
import { updatePaymentMethodsInfo, loadMyConfig } from './personalizacion.js';
import { renderPatients } from './pacientes.js';
import { renderPendingRequests, renderAppointments } from './citas.js';
import { actualizarContadoresReinicio } from './admin.js';

// ============================================
// FUNCIONES DE LOGIN
// ============================================

export function showLoginModal() {
    console.log('🔓 Mostrando modal de login');
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'flex';
    
    // Limpiar campos
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

// ============================================
// FUNCIÓN PARA ACTUALIZAR UI SIN CAMBIAR DE VISTA
// ============================================
function actualizarUIAdmin(userData, role) {
    console.log('👑 Actualizando UI para:', role);
    
    // Cambiar el ícono y texto del link Staff
    const staffLink = document.querySelector('a[onclick*="showLoginModal"]');
    const staffIcon = staffLink?.querySelector('i');
    const staffText = staffLink?.childNodes[2]; // El texto después del ícono
    
    if (staffLink) {
        // Cambiar el onclick para que ahora muestre el menú
        staffLink.setAttribute('onclick', 'mostrarMenuStaff(); return false;');
        
        if (staffIcon) {
            staffIcon.className = 'fa fa-user-check';
            staffIcon.style.color = '#1E7A8A';
            staffIcon.style.opacity = '1';
        }
        
        if (staffText) {
            staffText.textContent = userData.name || 'Admin';
        }
    }
    
    // Mostrar botones de edición en secciones
    const editButtons = [
        'adminHeroEditBtn',
        'adminAboutEditBtn', 
        'adminAtencionEditBtn',
        'adminContactEditBtn',
        'adminInstagramEditBtn'
    ];
    
    editButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.style.display = 'flex';
        }
    });
    
    // Mostrar mensaje de bienvenida
    const generoEmoji = userData.genero === 'M' ? '♂️' : userData.genero === 'F' ? '♀️' : '';
    showToast(`✅ Sesión iniciada como ${userData.name} ${generoEmoji}`, 'success');
}

// ============================================
// FUNCIÓN PARA MOSTRAR MENÚ STAFF
// ============================================
window.mostrarMenuStaff = function() {
    if (!state.currentUser) {
        showLoginModal();
        return;
    }
    
    const user = state.currentUser;
    
    // Eliminar menú anterior si existe
    const oldMenu = document.getElementById('staffMenu');
    if (oldMenu) oldMenu.remove();
    
    // Crear menú contextual
    const menuHTML = `
        <div id="staffMenu" style="position: absolute; top: 80px; right: 20px; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); padding: 20px; z-index: 2000; min-width: 250px; border: 1px solid var(--gris-claro);">
            <div style="padding: 10px 0; border-bottom: 1px solid #eee; margin-bottom: 15px;">
                <div style="font-weight: 700; font-size: 1.1rem; color: var(--texto-principal);">${user.data.name}</div>
                <div style="color: var(--texto-secundario); font-size: 0.9rem; margin-top: 5px;">
                    <span style="background: ${user.role === 'admin' ? 'var(--primario)' : 'var(--exito)'}; color: white; padding: 3px 10px; border-radius: 30px; font-size: 0.8rem;">
                        ${user.role === 'admin' ? 'Administrador' : 'Profesional'}
                    </span>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button onclick="irADashboard()" style="padding: 12px; background: var(--primario); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 10px; width: 100%;">
                    <i class="fa fa-tachometer-alt"></i> Ir al Dashboard
                </button>
                ${user.role === 'psych' ? `
                <button onclick="window.openMyProfileModal?.()" style="padding: 12px; background: var(--verde-azulado-claro); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 10px; width: 100%;">
                    <i class="fa fa-user-edit"></i> Editar Mi Perfil
                </button>
                ` : ''}
                <button onclick="logout()" style="padding: 12px; background: #f5f5f5; border: none; border-radius: 12px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 10px; width: 100%; color: var(--peligro);">
                    <i class="fa fa-sign-out-alt"></i> Cerrar Sesión
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', menuHTML);
    
    // Cerrar al hacer clic fuera
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

// ============================================
// FUNCIÓN PARA IR AL DASHBOARD
// ============================================
window.irADashboard = function() {
    console.log('📊 Cambiando a dashboard');
    document.getElementById('clientView').style.setProperty('display', 'none', 'important');
    document.getElementById('dashboard').style.setProperty('display', 'block', 'important');
    document.getElementById('bookingPanel').style.setProperty('display', 'none', 'important');
    
    // Cerrar menú
    const menu = document.getElementById('staffMenu');
    if (menu) menu.remove();
};

// ============================================
// FUNCIÓN PARA VOLVER A VISTA PÚBLICA
// ============================================
window.volverAVistaPublica = function() {
    console.log('👁️ Cambiando a vista pública');
    document.getElementById('clientView').style.setProperty('display', 'block', 'important');
    document.getElementById('dashboard').style.setProperty('display', 'none', 'important');
    document.getElementById('bookingPanel').style.setProperty('display', 'none', 'important');
    
    // Mostrar sección equipo por defecto
    if (window.showSection) {
        window.showSection('equipo');
    }
};

// ============================================
// FUNCIÓN DE LOGIN MODIFICADA
// ============================================
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
        
        // Guardar en localStorage
        localStorage.setItem('vinculoCurrentUser', JSON.stringify({ role: 'admin', data: adminUser }));
        
        // 🔥 IMPORTANTE: Actualizar UI sin cambiar de vista
        actualizarUIAdmin(adminUser, 'admin');
        
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
        
        // Buscar datos COMPLETOS del profesional en staff
        const psychFullData = state.staff.find(s => s.id == foundUser.id) || foundUser;
        
        // Guardar usuario con TODOS los datos
        state.setCurrentUser({ 
            role, 
            data: psychFullData
        });
        
        closeLoginModal();
        
        // Guardar en localStorage
        const userToStore = {
            role: role,
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
        
        // 🔥 IMPORTANTE: Actualizar UI sin cambiar de vista
        actualizarUIAdmin(psychFullData, role);
        
    } else {
        showToast('Usuario o contraseña incorrectos', 'error');
    }
    
    if (btn) {
        btn.innerHTML = 'Ingresar al Panel';
        btn.disabled = false;
    }
}

// ============================================
// FUNCIÓN DE LOGOUT
// ============================================
export function logout() {
    console.log('🚪 Cerrando sesión');
    
    state.setCurrentUser(null);
    localStorage.removeItem('vinculoCurrentUser');
    
    // Restaurar link de Staff
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
        
        if (staffText) {
            staffText.textContent = ' Staff';
        }
    }
    
    // Ocultar botones de edición
    const editButtons = [
        'adminHeroEditBtn',
        'adminAboutEditBtn', 
        'adminAtencionEditBtn',
        'adminContactEditBtn',
        'adminInstagramEditBtn'
    ];
    
    editButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.style.display = 'none';
    });
    
    // Volver a vista pública
    window.volverAVistaPublica();
    
    // Cerrar menú si está abierto
    const menu = document.getElementById('staffMenu');
    if (menu) menu.remove();
    
    showToast('Sesión cerrada', 'info');
}

// ============================================
// FUNCIÓN PARA CARGAR EL DASHBOARD (ahora se llama desde el menú)
// ============================================
export function cargarDashboard(role) {
    const userData = state.currentUser?.data;
    if (userData) {
        mostrarDashboardInmediato(role, userData);
    } else {
        console.error('❌ No hay datos de usuario para cargar dashboard');
    }
}

// 🔥 VERSIÓN CORREGIDA - Mostrar dashboard inmediatamente con !important
function mostrarDashboardInmediato(role, userData) {
    console.log('🔄 Mostrando dashboard inmediatamente como:', role);
    
    const clientView = document.getElementById('clientView');
    const bookingPanel = document.getElementById('bookingPanel');
    const dashboard = document.getElementById('dashboard');
    
    if (!dashboard) {
        console.error('❌ Elemento dashboard no encontrado');
        return;
    }
    
    // FORZAR estilos con !important
    if (clientView) {
        clientView.style.setProperty('display', 'none', 'important');
    }
    
    if (bookingPanel) {
        bookingPanel.style.setProperty('display', 'none', 'important');
    }
    
    dashboard.style.setProperty('display', 'block', 'important');
    dashboard.style.setProperty('visibility', 'visible', 'important');
    dashboard.style.setProperty('opacity', '1', 'important');
    dashboard.style.setProperty('z-index', '1000', 'important');
    
    // Actualizar títulos
    const dashTitle = document.getElementById('dashTitle');
    const dashSubtitle = document.getElementById('dashSubtitle');
    
    if (dashTitle) {
        dashTitle.innerText = role === 'admin' ? 'Panel Administrador' : 'Mi Panel Profesional';
    }
    
    if (dashSubtitle && userData) {
        const generoEmoji = userData.genero === 'M' ? '♂️' : userData.genero === 'F' ? '♀️' : '';
        dashSubtitle.innerText = `Bienvenido, ${userData.name} ${generoEmoji}`;
    }
    
    // Configurar visibilidad de pestañas
    const adminTabs = [
        'adminTabProfesionales', 'adminTabEspecialidades', 'adminTabPagos',
        'adminTabFondo', 'adminTabTextos', 'adminTabLogo', 'adminTabReinicio',
        'messagesTab', 'boxesTab', 'adminTabEstadisticas'
    ];
    
    adminTabs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = role === 'admin' ? 'inline-block' : 'none';
    });
    
    const psychTabs = ['psychTab', 'configTab', 'agendarTab'];
    psychTabs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = role === 'psych' ? 'inline-block' : 'none';
    });
    
    // Mostrar/ocultar botón de edición de perfil
    const profileBtn = document.getElementById('editProfileButton');
    if (profileBtn) {
        if (role === 'psych') {
            profileBtn.style.display = 'inline-flex';
            profileBtn.onclick = window.openMyProfileModal;
            profileBtn.innerHTML = '<i class="fa fa-user-edit"></i> Editar Mi Perfil';
        } else {
            profileBtn.style.display = 'none';
        }
    }
    
    // Actualizar estadísticas
    setTimeout(() => {
        updateStats();
    }, 500);
    
    // Cambiar a pestaña de citas
    switchTab('citas');
    
    console.log('✅ Dashboard forzado a visible con !important');
}

// ============================================
// FUNCIÓN SWITCH TAB
// ============================================

export function switchTab(tabName) {
    console.log('🔄 Cambiando a pestaña:', tabName);
    
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    const activeTab = Array.from(document.querySelectorAll('.tab')).find(t => 
        t.textContent.toLowerCase().includes(tabName.toLowerCase())
    );
    if (activeTab) activeTab.classList.add('active');
    
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
        'agendar': 'tabAgendar',
        'estadisticas': 'tabEstadisticas'
    };
    
    const tabId = tabMap[tabName];
    if (tabId) {
        const tabElement = document.getElementById(tabId);
        if (tabElement) {
            tabElement.classList.add('active');
            
            setTimeout(() => {
                try {
                    if (tabName === 'pacientes' && typeof renderPatients === 'function') {
                        renderPatients();
                    }
                    else if (tabName === 'citas' && typeof renderAppointments === 'function') {
                        renderAppointments();
                    }
                    else if (tabName === 'solicitudes' && typeof renderPendingRequests === 'function') {
                        renderPendingRequests();
                    }
                    else if (tabName === 'profesionales' && isAdmin() && typeof renderStaffTable === 'function') {
                        renderStaffTable();
                    }
                    else if (tabName === 'mensajes' && isAdmin() && typeof renderMessagesTable === 'function') {
                        renderMessagesTable();
                    }
                    else if (tabName === 'boxes') {
                        if (typeof renderBoxesTable === 'function') renderBoxesTable();
                        if (typeof renderBoxOccupancy === 'function') renderBoxOccupancy();
                    }
                    else if (tabName === 'disponibilidad' && isPsych()) {
                        if (typeof window.loadTimeSlots === 'function') {
                            window.loadTimeSlots();
                        }
                    }
                    else if (tabName === 'configuracion' && isPsych()) {
                        if (typeof loadMyConfig === 'function') loadMyConfig();
                    }
                    else if (tabName === 'pagos' && isAdmin()) {
                        if (typeof updatePaymentMethodsInfo === 'function') updatePaymentMethodsInfo();
                    }
                    else if (tabName === 'reinicio' && isAdmin()) {
                        if (typeof actualizarContadoresReinicio === 'function') actualizarContadoresReinicio();
                    }
                    else if (tabName === 'estadisticas' && isAdmin()) {
                        if (window.estadisticas && typeof window.estadisticas.renderPanelEstadisticas === 'function') {
                            window.estadisticas.renderPanelEstadisticas();
                        }
                    }
                } catch (error) {
                    console.error('❌ Error cargando datos:', error);
                }
            }, 100);
        }
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function isAdmin() {
    return state.currentUser?.role === 'admin';
}

function isPsych() {
    return state.currentUser?.role === 'psych';
}

// ============================================
// FUNCIÓN UPDATE STATS
// ============================================

export function updateStats() {
    console.log('📊 Actualizando estadísticas...');
    
    if (!state.currentUser) {
        console.log('⚠️ No hay usuario logueado');
        return;
    }

    const miId = state.currentUser.data?.id;
    const esAdmin = isAdmin();
    
    let misCitas = [];
    if (esAdmin) {
        misCitas = state.appointments || [];
    } else {
        misCitas = (state.appointments || []).filter(a => a.psychId == miId);
    }
    
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

// ============================================
// FUNCIÓN PARA ACTUALIZAR BOTÓN DE PERFIL
// ============================================

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
// VERIFICAR SESIÓN GUARDADA - VERSIÓN CORREGIDA
// ============================================

export function verificarSesionGuardada() {
    console.log('🔍 Verificando sesión guardada...');
    
    const savedUser = localStorage.getItem('vinculoCurrentUser');
    if (!savedUser) {
        console.log('ℹ️ No hay sesión guardada');
        return false;
    }
    
    try {
        const userData = JSON.parse(savedUser);
        console.log('📦 Sesión encontrada:', userData);
        
        if (userData.role === 'admin') {
            state.setCurrentUser(userData);
            // 🔥 CORREGIDO: usar actualizarUIAdmin en lugar de mostrarDashboardInmediato
            actualizarUIAdmin(userData.data, 'admin');
            return true;
        } else {
            const psychExists = state.staff.some(s => s.id == userData.data.id);
            if (psychExists) {
                state.setCurrentUser(userData);
                // 🔥 CORREGIDO: usar actualizarUIAdmin en lugar de mostrarDashboardInmediato
                actualizarUIAdmin(userData.data, userData.role);
                return true;
            } else {
                console.log('⚠️ Psicólogo ya no existe en el sistema');
                localStorage.removeItem('vinculoCurrentUser');
                return false;
            }
        }
    } catch (error) {
        console.error('❌ Error al leer sesión guardada:', error);
        localStorage.removeItem('vinculoCurrentUser');
        return false;
    }
}

// ============================================
// EXPONER FUNCIONES GLOBALMENTE
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
}

console.log('✅ auth.js cargado correctamente con funciones de login y perfil profesional');