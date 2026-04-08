// js/main.js - VERSIÓN ACTUALIZADA CON GUARDADO SIN AUTENTICACIÓN PARA PACIENTES
import { db } from './config/firebase.js';
import * as state from './modules/state.js';
window.state = state;

import * as calendario from './modules/calendario.js';
window.calendario = calendario;
window.renderCalendar = calendario.renderCalendar;

import * as utils from './modules/utils.js';
window.utils = utils;

import * as auth from './modules/auth.js';
import * as pacientes from './modules/pacientes.js';
import * as profesionales from './modules/profesionales.js';
import * as citas from './modules/citas.js';
import * as disponibilidad from './modules/disponibilidad.js';
import * as mensajes from './modules/mensajes.js';
import * as personalizacion from './modules/personalizacion.js';
import * as publico from './modules/publico.js';
import * as admin from './modules/admin.js';
import * as fichasClinicas from './modules/fichasClinicas.js';
import * as permisos from './modules/permisos.js';
import './modules/notas.js';

// ============================================
// VERIFICAR QUE personalizacion CONTIENE loadMyConfig
// ============================================
console.log('🔍 Funciones disponibles en personalizacion:', Object.keys(personalizacion));
if (typeof personalizacion.loadMyConfig !== 'function') {
    console.error('❌ ERROR CRÍTICO: personalizacion.loadMyConfig NO es una función');
} else {
    console.log('✅ personalizacion.loadMyConfig disponible');
}

// ============================================
// FUNCIÓN PARA LIMPIAR OBJETOS (ELIMINA REFERENCIAS CIRCULARES)
// ============================================
function safeClean(obj, fallback = null) {
    if (obj === null || typeof obj !== 'object') return obj;
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch(e) {
        console.warn('Error al limpiar objeto, usando fallback:', e.message);
        return fallback;
    }
}

// ============================================
// EXPONER FUNCIONES GLOBALES
// ============================================
window.formatRut = utils.formatRut;
window.validarRut = utils.validarRut;
window.showToast = utils.showToast;
window.calcularEdad = utils.calcularEdad;
window.esEmailProfesional = utils.esEmailProfesional;

window.showLoginModal = auth.showLoginModal;
window.closeLoginModal = auth.closeLoginModal;
window.processLogin = auth.processLogin;
window.logout = auth.logout;
window.switchTab = auth.switchTab;

window.showMessageModal = mensajes.showMessageModal;
window.closeMessageModal = mensajes.closeMessageModal;
window.setRating = mensajes.setRating;
window.saveMessage = mensajes.saveMessage;
window.deleteMessage = mensajes.deleteMessage;

window.showAddStaffModal = profesionales.showAddStaffModal;
window.closeAddStaffModal = profesionales.closeAddStaffModal;
window.addStaff = profesionales.addStaff;
window.editTherapist = profesionales.editTherapist;
window.closeEditTherapistModal = profesionales.closeEditTherapistModal;
window.updateTherapist = profesionales.updateTherapist;
window.deleteStaff = profesionales.deleteStaff;

window.openMyProfileModal = profesionales.openMyProfileModal;
window.saveMyProfile = profesionales.saveMyProfile;
window.openMyAvailabilityModal = profesionales.openMyAvailabilityModal;
window.viewMyPublicProfile = profesionales.viewMyPublicProfile;
window.loadSpecialtiesInProfileSelects = profesionales.loadSpecialtiesInProfileSelects;
window.addProfileButtonToDashboard = profesionales.addProfileButtonToDashboard;

window.showNewPatientModal = pacientes.showNewPatientModal;
window.closePatientModal = pacientes.closePatientModal;
window.savePatient = pacientes.savePatient;
window.printPatientSummary = pacientes.printPatientSummary;
window.searchPatientByRut = pacientes.searchPatientByRut;
window.viewPatientDetails = pacientes.viewPatientDetails;
window.renderPatients = pacientes.renderPatients;
window.mostrarDetallePaciente = pacientes.mostrarDetallePaciente;
window.showNewSesionModal = pacientes.showNewSesionModal;
window.exportarHistorialPaciente = pacientes.exportarHistorialPaciente;
window.cambiarPestana = pacientes.cambiarPestana;
window.copiarLinkConsentimiento = pacientes.copiarLinkConsentimiento;

window.openBooking = citas.openBooking;
window.executeBooking = citas.executeBooking;
window.showTherapistBookingModal = citas.showTherapistBookingModal;
window.searchPatientByRutTherapist = citas.searchPatientByRutTherapist;
window.executeTherapistBooking = citas.executeTherapistBooking;
window.showConfirmRequestModal = citas.showConfirmRequestModal;
window.rejectRequest = citas.rejectRequest;
window.editAppointment = citas.editAppointment;
window.cancelAppointment = citas.cancelAppointment;
window.markAsPaid = citas.markAsPaid;
window.confirmPayment = citas.confirmPayment;
window.rejectPayment = citas.rejectPayment;
window.updateAvailableTimes = citas.updateAvailableTimes;
window.updateBookingDetails = citas.updateBookingDetails;
window.searchPatientByRutBooking = citas.searchPatientByRutBooking;
window.checkOnlineAvailability = citas.checkOnlineAvailability;
window.showPaymentDetails = citas.showPaymentDetails;
window.renderPendingRequests = citas.renderPendingRequests;
window.renderAppointments = citas.renderAppointments;
window.selectTimeSlot = citas.selectTimeSlot;
window.selectTimePref = citas.selectTimePref;

window.showAvailabilityModal = disponibilidad.showAvailabilityModal;
window.closeAvailabilityModal = disponibilidad.closeAvailabilityModal;
window.generateTimeSlots = disponibilidad.generateTimeSlots;
window.toggleWeekday = disponibilidad.toggleWeekday;
window.blockTimeRange = disponibilidad.blockTimeRange;
window.applyGeneratedSlots = disponibilidad.applyGeneratedSlots;
window.clearAllSlots = disponibilidad.clearAllSlots;
window.saveAvailability = disponibilidad.saveAvailability;
window.loadTimeSlots = disponibilidad.loadTimeSlots;
window.addOvercupo = disponibilidad.addOvercupo;

window.showLogoModal = personalizacion.showLogoModal;
window.closeLogoModal = personalizacion.closeLogoModal;
window.saveLogo = personalizacion.saveLogo;
window.removeLogo = personalizacion.removeLogo;
window.previewLogo = personalizacion.previewLogo;

window.showTextsModal = personalizacion.showTextsModal;
window.closeTextsModal = personalizacion.closeTextsModal;
window.saveHeroTexts = personalizacion.saveHeroTexts;

window.showBackgroundImageModal = personalizacion.showBackgroundImageModal;
window.closeBackgroundImageModal = personalizacion.closeBackgroundImageModal;
window.saveBackgroundImage = personalizacion.saveBackgroundImage;
window.removeBackgroundImage = personalizacion.removeBackgroundImage;
window.updateBackgroundOpacity = personalizacion.updateBackgroundOpacity;
window.previewBackgroundImage = personalizacion.previewBackgroundImage;

window.showPaymentMethodsModal = personalizacion.showPaymentMethodsModal;
window.closePaymentMethodsModal = personalizacion.closePaymentMethodsModal;
window.saveGlobalPaymentMethods = personalizacion.saveGlobalPaymentMethods;
window.updatePaymentMethodsInfo = personalizacion.updatePaymentMethodsInfo;

window.showSpecialtiesModal = personalizacion.showSpecialtiesModal;
window.closeSpecialtiesModal = personalizacion.closeSpecialtiesModal;
window.addSpecialty = personalizacion.addSpecialty;
window.deleteSpecialty = personalizacion.deleteSpecialty;
window.editSpecialty = personalizacion.editSpecialty;
window.renderSpecialtiesTable = personalizacion.renderSpecialtiesTable;

window.loadMyConfig = personalizacion.loadMyConfig;
window.saveMyConfig = personalizacion.saveMyConfig;

window.showAboutModal = personalizacion.showAboutModal;
window.uploadAboutImage = personalizacion.uploadAboutImage;
window.saveAboutTexts = personalizacion.saveAboutTexts;

window.showAtencionModal = personalizacion.showAtencionModal;
window.saveAtencionTexts = personalizacion.saveAtencionTexts;

window.showContactModal = personalizacion.showContactModal;
window.saveContactInfo = personalizacion.saveContactInfo;

window.showInstagramModal = personalizacion.showInstagramModal;
window.uploadInstagramImage = personalizacion.uploadInstagramImage;
window.saveInstagramData = personalizacion.saveInstagramData;
window.cargarInstagramData = personalizacion.cargarInstagramData;

window.actualizarContadoresReinicio = admin.actualizarContadoresReinicio;
window.eliminarTodosLosPacientes = admin.eliminarTodosLosPacientes;
window.eliminarPacientesPrueba = admin.eliminarPacientesPrueba;
window.eliminarTodosLosMensajes = admin.eliminarTodosLosMensajes;
window.restaurarMensajesIniciales = admin.restaurarMensajesIniciales;
window.eliminarTodasLasCitas = admin.eliminarTodasLasCitas;
window.eliminarCitasPrueba = admin.eliminarCitasPrueba;
window.reinicioCompleto = admin.reinicioCompleto;
window.exportarDatosExcel = admin.exportarDatosExcel;
window.refrescarVistaPublica = admin.refrescarVistaPublica;
window.mostrarTabsAdmin = admin.mostrarTabsAdmin;
window.addEditButtonsToAdmin = admin.addEditButtonsToAdmin;
window.asegurarTablaProfesionales = admin.asegurarTablaProfesionales;
window.mostrarTabConsentimientos = admin.mostrarTabConsentimientos;

window.fichasClinicas = fichasClinicas;
window.permisos = permisos;
window.guardarFichaIngreso = fichasClinicas.guardarFichaIngreso;
window.guardarNotaSesion = fichasClinicas.guardarNotaSesion;
window.obtenerSesionesDePaciente = fichasClinicas.obtenerSesionesDePaciente;
window.obtenerFichasIngresoDePaciente = fichasClinicas.obtenerFichasIngresoDePaciente;
window.verFichaCompleta = pacientes.mostrarDetallePaciente;

window.showSection = publico.showSection;
window.abrirAgenda = publico.abrirAgenda;
window.enviarContacto = publico.enviarContacto;
window.compartirPerfil = publico.compartirPerfil;
window.copiarAlPortapapeles = publico.copiarAlPortapapeles;
window.showTherapistInfo = publico.showTherapistInfo;
window.filterProfessionals = publico.filterProfessionals;

window.verDetalleCita = calendario.verDetalleCita;
window.verDetalleSolicitud = calendario.verDetalleSolicitud;
window.confirmarSolicitud = calendario.confirmarSolicitud;

window.getCurrentPsychFullData = state.getCurrentPsychFullData;
window.updatePsychData = state.updatePsychData;
window.miPerfil = function() {
    if (!state.currentUser) {
        console.log('❌ No hay usuario logueado');
        return null;
    }
    if (state.currentUser.role === 'psych') {
        const fullData = state.getCurrentPsychFullData?.() || state.currentUser.data;
        console.log('👤 Mi perfil completo:', fullData);
        return fullData;
    } else {
        console.log('👑 Usuario admin:', state.currentUser.data);
        return state.currentUser.data;
    }
};

window.verTextos = function() {
    console.log('📝 Textos editables:');
    console.log('- Misión:', state.missionText);
    console.log('- Visión:', state.visionText);
    console.log('- Equipo:', state.aboutTeamText);
    console.log('- Tipos de Atención:', state.atencionTexts);
    console.log('- Contacto:', state.contactInfo);
    console.log('- Instagram:', state.instagramData);
    return {
        mission: state.missionText,
        vision: state.visionText,
        team: state.aboutTeamText,
        atencion: state.atencionTexts,
        contact: state.contactInfo,
        instagram: state.instagramData
    };
};

window.updateProfileButton = function() {
    const profileBtn = document.getElementById('editProfileButton');
    if (profileBtn && state.currentUser?.role === 'psych') {
        profileBtn.style.display = 'inline-flex';
        profileBtn.onclick = window.openMyProfileModal;
    } else if (profileBtn) {
        profileBtn.style.display = 'none';
    }
};

window.actualizarInstagramGlobal = function(nuevosDatos) {
    if (personalizacion && typeof personalizacion.actualizarInstagramData === 'function') {
        personalizacion.actualizarInstagramData(nuevosDatos);
    }
    if (window.state && typeof window.state.setInstagramData === 'function') {
        window.state.setInstagramData(nuevosDatos);
    }
    if (personalizacion && typeof personalizacion.updateInstagramSection === 'function') {
        personalizacion.updateInstagramSection();
    }
};

if (typeof window !== 'undefined') {
    window.personalizacion = personalizacion;
    console.log('✅ personalizacion expuesto globalmente en window.personalizacion');
}

console.log('✅ showLoginModal asignada:', typeof window.showLoginModal);
console.log('✅ switchTab asignada:', typeof window.switchTab);
console.log('✅ renderPatients asignada:', typeof window.renderPatients);
console.log('✅ selectTimeSlot asignada:', typeof window.selectTimeSlot);
console.log('✅ openMyProfileModal asignada:', typeof window.openMyProfileModal);
console.log('✅ esEmailProfesional disponible:', typeof window.esEmailProfesional);

// ============================================
// RESPALDO DE EMERGENCIA
// ============================================
setTimeout(() => {
    if (typeof window.selectTimeSlot !== 'function' && typeof citas?.selectTimeSlot === 'function') {
        window.selectTimeSlot = citas.selectTimeSlot;
        window.selectTimePref = citas.selectTimePref;
    }
    if (typeof window.openMyProfileModal !== 'function' && typeof profesionales?.openMyProfileModal === 'function') {
        window.openMyProfileModal = profesionales.openMyProfileModal;
        window.saveMyProfile = profesionales.saveMyProfile;
    }
    if (typeof window.showAboutModal !== 'function' && typeof personalizacion?.showAboutModal === 'function') {
        window.showAboutModal = personalizacion.showAboutModal;
        window.saveAboutTexts = personalizacion.saveAboutTexts;
        window.showAtencionModal = personalizacion.showAtencionModal;
        window.saveAtencionTexts = personalizacion.saveAtencionTexts;
        window.showContactModal = personalizacion.showContactModal;
        window.saveContactInfo = personalizacion.saveContactInfo;
    }
    if (typeof window.showInstagramModal !== 'function' && typeof personalizacion?.showInstagramModal === 'function') {
        window.showInstagramModal = personalizacion.showInstagramModal;
        window.uploadInstagramImage = personalizacion.uploadInstagramImage;
        window.saveInstagramData = personalizacion.saveInstagramData;
    }
    if (typeof window.personalizacion === 'undefined' && typeof personalizacion !== 'undefined') {
        window.personalizacion = personalizacion;
    }
    if (typeof window.esEmailProfesional !== 'function' && typeof utils?.esEmailProfesional === 'function') {
        window.esEmailProfesional = utils.esEmailProfesional;
    }
    if (typeof window.showSpecialtiesModal !== 'function' && typeof personalizacion?.showSpecialtiesModal === 'function') {
        window.showSpecialtiesModal = personalizacion.showSpecialtiesModal;
        window.closeSpecialtiesModal = personalizacion.closeSpecialtiesModal;
        window.addSpecialty = personalizacion.addSpecialty;
        window.deleteSpecialty = personalizacion.deleteSpecialty;
        window.editSpecialty = personalizacion.editSpecialty;
        window.renderSpecialtiesTable = personalizacion.renderSpecialtiesTable;
    }
    if (typeof window.verDetalleCita !== 'function' && typeof calendario?.verDetalleCita === 'function') {
        window.verDetalleCita = calendario.verDetalleCita;
        window.verDetalleSolicitud = calendario.verDetalleSolicitud;
        window.confirmarSolicitud = calendario.confirmarSolicitud;
    }
}, 500);

// ============================================
// FUNCIÓN PARA GUARDAR EN FIREBASE (CORREGIDA - PERMITE GUARDAR SIN LOGIN)
// ============================================
export function save() {
    console.log("💾 Guardando datos en Firebase...");
    
    // Nodos que pueden guardarse SIN autenticación
    const nodosPublicos = [
        'appointments', 'pendingRequests', 'patients', 'messages',
        'fichasIngreso', 'sesiones', 'informes', 'consentimientos'
    ];
    
    // Nodos que requieren autenticación (solo admin)
    const nodosPrivados = [
        'staff', 'specialties', 'textosEditables', 'paymentMethods',
        'backgroundImage', 'logoImage', 'heroTexts', 'aboutTexts',
        'atencionTexts', 'contactInfo', 'instagramData'
    ];
    
    const promises = [];
    const user = firebase.auth().currentUser;
    const role = state.currentUser?.role;
    
    // Función auxiliar para limpiar objetos
    const safeClean = (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch(e) {
            console.warn('Error limpiando objeto:', e.message);
            return null;
        }
    };
    
    // 1. Guardar nodos públicos
    for (const node of nodosPublicos) {
        let data;
        try {
            switch (node) {
                case 'appointments':
                    const appointmentsObj = {};
                    (state.appointments || []).forEach(item => { 
                        if (item && item.id) appointmentsObj[item.id] = safeClean(item); 
                    });
                    data = appointmentsObj;
                    break;
                case 'pendingRequests':
                    const pendingRequestsObj = {};
                    (state.pendingRequests || []).forEach(item => { 
                        if (item && item.id) pendingRequestsObj[item.id] = safeClean(item); 
                    });
                    data = pendingRequestsObj;
                    break;
                case 'patients':
                    const patientsObj = {};
                    (state.patients || []).forEach(item => { 
                        if (item && item.id) patientsObj[item.id] = safeClean(item); 
                    });
                    data = patientsObj;
                    break;
                case 'messages':
                    const messagesObj = {};
                    (state.messages || []).forEach(item => { 
                        if (item && item.id) messagesObj[item.id] = safeClean(item); 
                    });
                    data = messagesObj;
                    break;
                case 'fichasIngreso':
                    const fichasObj = {};
                    (state.fichasIngreso || []).forEach(item => { 
                        if (item && item.id) fichasObj[item.id] = safeClean(item); 
                    });
                    data = fichasObj;
                    break;
                case 'sesiones':
                    const sesionesObj = {};
                    (state.sesiones || []).forEach(item => { 
                        if (item && item.id) sesionesObj[item.id] = safeClean(item); 
                    });
                    data = sesionesObj;
                    break;
                case 'informes':
                    const informesObj = {};
                    (state.informes || []).forEach(item => { 
                        if (item && item.id) informesObj[item.id] = safeClean(item); 
                    });
                    data = informesObj;
                    break;
                case 'consentimientos':
                    const consentimientosObj = {};
                    (state.consentimientos || []).forEach(item => { 
                        if (item && item.id) consentimientosObj[item.id] = safeClean(item); 
                    });
                    data = consentimientosObj;
                    break;
                default:
                    continue;
            }
        } catch(e) {
            console.error(`❌ Error en nodo ${node}:`, e);
            continue;
        }
        
        if (data && Object.keys(data).length > 0) {
            promises.push(db.ref(node).set(data).catch(err => {
                console.error(`❌ Error en ${node}:`, err);
                return null;
            }));
        }
    }
    
    // 2. Guardar nodos privados (solo admin)
    if (user && role === 'admin') {
        for (const node of nodosPrivados) {
            let data;
            try {
                switch (node) {
                    case 'staff':
                        const staffObj = {};
                        (state.staff || []).forEach(item => { 
                            if (item && item.id) staffObj[item.id] = safeClean(item); 
                        });
                        data = staffObj;
                        break;
                    case 'specialties':
                        const specialtiesObj = {};
                        (state.specialties || []).forEach(item => { 
                            if (item && item.id) specialtiesObj[item.id] = { name: item.name }; 
                        });
                        data = specialtiesObj;
                        break;
                    case 'textosEditables':
                        data = safeClean({
                            missionText: state.missionText || '',
                            visionText: state.visionText || '',
                            aboutTeamText: state.aboutTeamText || '',
                            aboutImage: state.aboutImage || '',
                            contactInfo: {
                                phone: (state.contactInfo?.phone || '').toString(),
                                email: (state.contactInfo?.email || '').toString(),
                                address: (state.contactInfo?.address || '').toString()
                            }
                        });
                        break;
                    case 'paymentMethods':
                        data = safeClean(state.globalPaymentMethods || {});
                        break;
                    case 'backgroundImage':
                        data = state.backgroundImage || '';
                        break;
                    case 'logoImage':
                        data = state.logoImage || '';
                        break;
                    case 'heroTexts':
                        data = safeClean(state.heroTexts || {});
                        break;
                    case 'aboutTexts':
                        data = safeClean({
                            teamText: state.aboutTeamText || '',
                            mission: state.missionText || '',
                            vision: state.visionText || '',
                            image: state.aboutImage || ''
                        });
                        break;
                    case 'atencionTexts':
                        data = safeClean(state.atencionTexts || {});
                        break;
                    case 'contactInfo':
                        data = safeClean({
                            phone: (state.contactInfo?.phone || '').toString(),
                            email: (state.contactInfo?.email || '').toString(),
                            address: (state.contactInfo?.address || '').toString()
                        });
                        break;
                    case 'instagramData':
                        data = safeClean(state.instagramData || {});
                        break;
                    default:
                        continue;
                }
            } catch(e) {
                console.error(`❌ Error en nodo ${node}:`, e);
                continue;
            }
            
            if (data && (typeof data === 'object' ? Object.keys(data).length > 0 : data)) {
                promises.push(db.ref(node).set(data).catch(err => {
                    console.error(`❌ Error en ${node}:`, err);
                    return null;
                }));
            }
        }
    }
    
    if (promises.length === 0) {
        console.log('ℹ️ No hay datos para guardar');
        return Promise.resolve();
    }
    
    return Promise.all(promises)
        .then((results) => {
            const successful = results.filter(r => r !== null).length;
            console.log(`✅ ${successful}/${promises.length} nodos guardados`);
        })
        .catch(err => {
            console.error('❌ Error guardando:', err);
        });
}

// ============================================
// INICIALIZAR LA APLICACIÓN
// ============================================
if (typeof publico.cargarDatosIniciales === 'function') {
    publico.cargarDatosIniciales();
}

// ============================================
// RECUPERAR SESIÓN GUARDADA
// ============================================
const savedUser = localStorage.getItem('vinculoCurrentUser');
if (savedUser) {
    try {
        const userData = JSON.parse(savedUser);
        state.setCurrentUser(userData);
        const checkData = setInterval(() => {
            if (state.dataLoaded) {
                clearInterval(checkData);
                if (typeof auth.actualizarUIAdmin === 'function') {
                    auth.actualizarUIAdmin(userData.data, userData.role);
                }
                if (typeof window.updateProfileButton === 'function') {
                    setTimeout(window.updateProfileButton, 1000);
                }
                if (userData.role === 'admin' && typeof admin.addEditButtonsToAdmin === 'function') {
                    setTimeout(admin.addEditButtonsToAdmin, 2000);
                }
            }
        }, 100);
    } catch (e) {
        console.error('Error al recuperar sesión:', e);
        localStorage.removeItem('vinculoCurrentUser');
    }
}

if (state.currentUser && typeof fichasClinicas.cargarTodasLasFichas === 'function') {
    fichasClinicas.cargarTodasLasFichas().then(() => {
        console.log('📋 Fichas clínicas cargadas');
    });
}

window.addEventListener('load', function() {
    setTimeout(() => {
        const loader = document.getElementById('initialLoader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }, 1000);
});

window.save = save;
console.log('✅ main.js cargado (versión actualizada con guardado SIN autenticación para pacientes)');
console.log('✅ Nodos de Firebase en minúsculas consistentes');
console.log('✅ esEmailProfesional expuesto globalmente');