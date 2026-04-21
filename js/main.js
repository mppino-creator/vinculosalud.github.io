// js/main.js - VERSIÓN CORREGIDA CON MÓDULO BOX INTEGRADO
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
import * as box from './modules/box.js';          // 🆕 MÓDULO BOX COMPARTIDO
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

// 🆕 EXPONER FUNCIONES DEL MÓDULO BOX
window.renderAdminBoxPanel = box.renderAdminBoxPanel;
window.renderProfessionalBoxPanel = box.renderProfessionalBoxPanel;
window.renderBoxEstadisticas = box.renderBoxEstadisticas;
window.cargarEstadisticasBox = function() {
    const month = document.getElementById('boxStatsMonth')?.value;
    if (month) box.renderBoxEstadisticas(month);
};

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
// FUNCIÓN PARA GUARDAR EN FIREBASE (DESACTIVADA PARA EVITAR ERROR DE REFERENCIA CIRCULAR)
// ============================================
export function save() {
    console.log("⚠️ save() DESACTIVADA - Error de referencia circular evitado");
    console.log("💡 Los datos se guardan individualmente desde cada módulo");
    return Promise.resolve();
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

// window.save = save;  // DESACTIVADO - Los datos se guardan desde cada módulo individualmente
console.log('✅ main.js cargado (versión corregida - save() desactivada)');
console.log('✅ Módulo BOX integrado y funciones expuestas');
console.log('✅ Nodos de Firebase en minúsculas consistentes');
console.log('✅ esEmailProfesional expuesto globalmente');