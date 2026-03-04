// js/main.js - VERSIÓN COMPLETA CON SECCIONES EDITABLES E INSTAGRAM v3.0

// ============================================
// EXPONER STATE INMEDIATAMENTE (ANTES QUE NADA)
// ============================================
import * as state from './modules/state.js';
window.state = state;
console.log('✅ state expuesto globalmente inmediatamente');

// AHORA importamos el resto
import { db } from './config/firebase.js';
import * as utils from './modules/utils.js';
import * as auth from './modules/auth.js';
import * as pacientes from './modules/pacientes.js';
import * as profesionales from './modules/profesionales.js';
import * as citas from './modules/citas.js';
import * as disponibilidad from './modules/disponibilidad.js';
import * as boxes from './modules/boxes.js';
import * as mensajes from './modules/mensajes.js';
import * as personalizacion from './modules/personalizacion.js';
import * as publico from './modules/publico.js';
import * as admin from './modules/admin.js';

// Módulos de fichas clínicas
import * as fichasClinicas from './modules/fichasClinicas.js';
import * as informes from './modules/informes.js';
import * as permisos from './modules/permisos.js';
import * as pdfGenerator from './modules/pdfGenerator.js';
import * as estadisticas from './modules/estadisticas.js';

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
// EXPONER FUNCIONES GLOBALES
// ============================================
console.log('🚀 Exponiendo funciones globales...');

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================
window.showLoginModal = auth.showLoginModal;
window.closeLoginModal = auth.closeLoginModal;
window.processLogin = auth.processLogin;
window.logout = auth.logout;
window.switchTab = auth.switchTab;

// ============================================
// FUNCIONES DE MENSAJES
// ============================================
window.showMessageModal = mensajes.showMessageModal;
window.closeMessageModal = mensajes.closeMessageModal;
window.setRating = mensajes.setRating;
window.saveMessage = mensajes.saveMessage;
window.deleteMessage = mensajes.deleteMessage;

// ============================================
// FUNCIONES DE PROFESIONALES
// ============================================
window.showAddStaffModal = profesionales.showAddStaffModal;
window.closeAddStaffModal = profesionales.closeAddStaffModal;
window.addStaff = profesionales.addStaff;
window.editTherapist = profesionales.editTherapist;
window.closeEditTherapistModal = profesionales.closeEditTherapistModal;
window.updateTherapist = profesionales.updateTherapist;
window.deleteStaff = profesionales.deleteStaff;

// ============================================
// 🆕 NUEVAS FUNCIONES DE PERFIL PROFESIONAL
// ============================================
window.openMyProfileModal = profesionales.openMyProfileModal;
window.saveMyProfile = profesionales.saveMyProfile;
window.openMyAvailabilityModal = profesionales.openMyAvailabilityModal;
window.viewMyPublicProfile = profesionales.viewMyPublicProfile;
window.loadSpecialtiesInProfileSelects = profesionales.loadSpecialtiesInProfileSelects;
window.addProfileButtonToDashboard = profesionales.addProfileButtonToDashboard;

// ============================================
// FUNCIONES DE PACIENTES
// ============================================
window.showNewPatientModal = pacientes.showNewPatientModal;
window.closePatientModal = pacientes.closePatientModal;
window.savePatient = pacientes.savePatient;
window.printPatientSummary = pacientes.printPatientSummary;
window.searchPatientByRut = pacientes.searchPatientByRut;
window.viewPatientDetails = pacientes.viewPatientDetails;
window.renderPatients = pacientes.renderPatients;
window.mostrarDetallePaciente = pacientes.mostrarDetallePaciente;
window.cambiarPestana = pacientes.cambiarPestana;

// ============================================
// FUNCIONES DE CITAS 
// ============================================
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
// Ya son expuestas directamente por citas.js
window.selectTimeSlot = citas.selectTimeSlot;
window.selectTimePref = citas.selectTimePref;

// ============================================
// FUNCIONES DE DISPONIBILIDAD
// ============================================
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

// ============================================
// FUNCIONES DE BOXES
// ============================================
window.showBoxModal = boxes.showBoxModal;
window.closeBoxModal = boxes.closeBoxModal;
window.saveBox = boxes.saveBox;
window.editBox = boxes.editBox;
window.toggleBoxStatus = boxes.toggleBoxStatus;
window.deleteBox = boxes.deleteBox;

// ============================================
// 🆕 FUNCIONES DE PERSONALIZACIÓN (NUEVAS SECCIONES EDITABLES)
// ============================================
// Funciones de Logo
window.showLogoModal = personalizacion.showLogoModal;
window.closeLogoModal = personalizacion.closeLogoModal;
window.saveLogo = personalizacion.saveLogo;
window.removeLogo = personalizacion.removeLogo;
window.previewLogo = personalizacion.previewLogo;

// Funciones de Textos Hero
window.showTextsModal = personalizacion.showTextsModal;
window.closeTextsModal = personalizacion.closeTextsModal;
window.saveHeroTexts = personalizacion.saveHeroTexts;

// Funciones de Fondo
window.showBackgroundImageModal = personalizacion.showBackgroundImageModal;
window.closeBackgroundImageModal = personalizacion.closeBackgroundImageModal;
window.saveBackgroundImage = personalizacion.saveBackgroundImage;
window.removeBackgroundImage = personalizacion.removeBackgroundImage;
window.updateBackgroundOpacity = personalizacion.updateBackgroundOpacity;
window.previewBackgroundImage = personalizacion.previewBackgroundImage;

// Funciones de Métodos de Pago
window.showPaymentMethodsModal = personalizacion.showPaymentMethodsModal;
window.closePaymentMethodsModal = personalizacion.closePaymentMethodsModal;
window.saveGlobalPaymentMethods = personalizacion.saveGlobalPaymentMethods;
window.updatePaymentMethodsInfo = personalizacion.updatePaymentMethodsInfo;

// Funciones de Especialidades
window.showSpecialtiesModal = personalizacion.showSpecialtiesModal;
window.closeSpecialtiesModal = personalizacion.closeSpecialtiesModal;
window.addSpecialty = personalizacion.addSpecialty;
window.deleteSpecialty = personalizacion.deleteSpecialty;

// 🔥 Funciones de Configuración Personal
window.loadMyConfig = personalizacion.loadMyConfig;
window.saveMyConfig = personalizacion.saveMyConfig;

// 🆕 NUEVAS FUNCIONES PARA SECCIONES EDITABLES
window.showAboutModal = personalizacion.showAboutModal;
window.uploadAboutImage = personalizacion.uploadAboutImage;
window.saveAboutTexts = personalizacion.saveAboutTexts;
window.showAtencionModal = personalizacion.showAtencionModal;
window.saveAtencionTexts = personalizacion.saveAtencionTexts;
window.showContactModal = personalizacion.showContactModal;
window.saveContactInfo = personalizacion.saveContactInfo;

// 🆕 🆕 NUEVAS FUNCIONES PARA INSTAGRAM
window.showInstagramModal = personalizacion.showInstagramModal;
window.uploadInstagramImage = personalizacion.uploadInstagramImage;
window.saveInstagramData = personalizacion.saveInstagramData;
window.cargarInstagramData = personalizacion.cargarInstagramData;

// ============================================
// FUNCIONES DE ADMIN
// ============================================
window.actualizarContadoresReinicio = admin.actualizarContadoresReinicio;
window.getEstadisticasGlobales = admin.getEstadisticasGlobales;
window.eliminarTodasLasFichasIngreso = admin.eliminarTodasLasFichasIngreso;
window.eliminarTodasLasSesiones = admin.eliminarTodasLasSesiones;
window.eliminarTodosLosInformes = admin.eliminarTodosLosInformes;
window.eliminarFichasDePaciente = admin.eliminarFichasDePaciente;
window.exportarTodasLasFichas = admin.exportarTodasLasFichas;
window.importarFichas = admin.importarFichas;
window.limpiarFichasHuerfanas = admin.limpiarFichasHuerfanas;
window.renderAdminPanel = admin.renderAdminPanel;
window.addEditButtonsToAdmin = admin.addEditButtonsToAdmin;
window.exportarDatosExcel = admin.exportarDatosExcel;

// ============================================
// FUNCIONES DE FICHAS CLÍNICAS
// ============================================
window.fichasClinicas = fichasClinicas;
window.informes = informes;
window.permisos = permisos;
window.pdfGenerator = pdfGenerator;
window.estadisticas = estadisticas;

// Funciones específicas
window.guardarFichaIngreso = fichasClinicas.guardarFichaIngreso;
window.guardarNotaSesion = fichasClinicas.guardarNotaSesion;
window.obtenerSesionesDePaciente = fichasClinicas.obtenerSesionesDePaciente;
window.obtenerFichasIngresoDePaciente = fichasClinicas.obtenerFichasIngresoDePaciente;
window.guardarInforme = informes.guardarInforme;
window.obtenerInformesDePaciente = informes.obtenerInformesDePaciente;
window.verFichaCompleta = pacientes.mostrarDetallePaciente;

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================
window.filterProfessionals = publico.filterProfessionals;
window.formatRut = utils.formatRut;
window.validarRut = utils.validarRut;
window.showToast = utils.showToast;
window.calcularEdad = utils.calcularEdad;

// ============================================
// FUNCIONES DE NAVEGACIÓN PÚBLICA
// ============================================
window.showSection = publico.showSection;
window.abrirAgenda = publico.abrirAgenda;
window.enviarContacto = publico.enviarContacto;
window.compartirPerfil = publico.compartirPerfil;
window.copiarAlPortapapeles = publico.copiarAlPortapapeles;
window.showTherapistInfo = publico.showTherapistInfo;

// ============================================
// 🆕 FUNCIONES DE ESTADO (para acceso global)
// ============================================
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

// 🆕 Función para ver textos editables (actualizada con Instagram)
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

// ============================================
// 🆕 FUNCIÓN PARA ACTUALIZAR EL BOTÓN DE PERFIL EN EL DASHBOARD
// ============================================
window.updateProfileButton = function() {
    const profileBtn = document.getElementById('editProfileButton');
    if (profileBtn && state.currentUser?.role === 'psych') {
        profileBtn.style.display = 'inline-flex';
        profileBtn.onclick = window.openMyProfileModal;
    } else if (profileBtn) {
        profileBtn.style.display = 'none';
    }
};

// ============================================
// VERIFICACIÓN FINAL
// ============================================
console.log('✅ showLoginModal asignada:', typeof window.showLoginModal);
console.log('✅ switchTab asignada:', typeof window.switchTab);
console.log('✅ renderPatients asignada:', typeof window.renderPatients);
console.log('✅ verFichaCompleta asignada:', typeof window.verFichaCompleta);
console.log('✅ estadisticas asignada:', typeof window.estadisticas);
console.log('✅ selectTimeSlot asignada:', typeof window.selectTimeSlot);
console.log('✅ selectTimePref asignada:', typeof window.selectTimePref);
console.log('✅ loadMyConfig asignada:', typeof window.loadMyConfig);
console.log('✅ openMyProfileModal asignada:', typeof window.openMyProfileModal);
console.log('✅ saveMyProfile asignada:', typeof window.saveMyProfile);
console.log('✅ miPerfil asignada:', typeof window.miPerfil);
console.log('✅ showAboutModal asignada:', typeof window.showAboutModal);
console.log('✅ showAtencionModal asignada:', typeof window.showAtencionModal);
console.log('✅ showContactModal asignada:', typeof window.showContactModal);
console.log('✅ showInstagramModal asignada:', typeof window.showInstagramModal); // 🆕
console.log('✅ verTextos asignada:', typeof window.verTextos);

// ============================================
// RESPALDO DE EMERGENCIA
// ============================================
setTimeout(() => {
    if (typeof window.selectTimeSlot !== 'function' && typeof citas?.selectTimeSlot === 'function') {
        console.log('🚨 Restaurando selectTimeSlot desde citas...');
        window.selectTimeSlot = citas.selectTimeSlot;
        window.selectTimePref = citas.selectTimePref;
    }
    
    if (typeof window.openMyProfileModal !== 'function' && typeof profesionales?.openMyProfileModal === 'function') {
        console.log('🚨 Restaurando openMyProfileModal desde profesionales...');
        window.openMyProfileModal = profesionales.openMyProfileModal;
        window.saveMyProfile = profesionales.saveMyProfile;
    }
    
    if (typeof window.showAboutModal !== 'function' && typeof personalizacion?.showAboutModal === 'function') {
        console.log('🚨 Restaurando showAboutModal desde personalizacion...');
        window.showAboutModal = personalizacion.showAboutModal;
        window.saveAboutTexts = personalizacion.saveAboutTexts;
        window.showAtencionModal = personalizacion.showAtencionModal;
        window.saveAtencionTexts = personalizacion.saveAtencionTexts;
        window.showContactModal = personalizacion.showContactModal;
        window.saveContactInfo = personalizacion.saveContactInfo;
    }
    
    // 🆕 Respaldo para Instagram
    if (typeof window.showInstagramModal !== 'function' && typeof personalizacion?.showInstagramModal === 'function') {
        console.log('🚨 Restaurando showInstagramModal desde personalizacion...');
        window.showInstagramModal = personalizacion.showInstagramModal;
        window.uploadInstagramImage = personalizacion.uploadInstagramImage;
        window.saveInstagramData = personalizacion.saveInstagramData;
    }
}, 500);

// ============================================
// FUNCIÓN PARA GUARDAR EN FIREBASE (ACTUALIZADA CON INSTAGRAM)
// ============================================
export function save() {
    console.log("💾 Guardando datos en Firebase...");
    
    // Preparar objetos para Firebase
    const staffObj = {};
    state.staff.forEach(item => { staffObj[item.id] = item; });

    const boxesObj = {};
    state.boxes.forEach(item => { boxesObj[item.id] = item; });

    const patientsObj = {};
    state.patients.forEach(item => { 
        patientsObj[item.id] = item; 
    });
    console.log('📋 Guardando pacientes en Firebase:', state.patients.length);

    const appointmentsObj = {};
    state.appointments.forEach(item => { appointmentsObj[item.id] = item; });

    const pendingRequestsObj = {};
    state.pendingRequests.forEach(item => { pendingRequestsObj[item.id] = item; });

    const messagesObj = {};
    state.messages.forEach(item => { messagesObj[item.id] = item; });

    // Guardar fichas clínicas
    const fichasIngresoObj = {};
    state.fichasIngreso.forEach(item => { fichasIngresoObj[item.id] = item; });

    const sesionesObj = {};
    state.sesiones.forEach(item => { sesionesObj[item.id] = item; });

    const informesObj = {};
    state.informes.forEach(item => { informesObj[item.id] = item; });

    // 🆕 Guardar textos editables (incluyendo Instagram)
    const textosEditablesObj = {
        missionText: state.missionText,
        visionText: state.visionText,
        aboutTeamText: state.aboutTeamText,
        aboutImage: state.aboutImage,
        atencionTexts: state.atencionTexts,
        contactInfo: state.contactInfo,
        heroTexts: state.heroTexts,
        logoImage: state.logoImage,
        backgroundImage: state.backgroundImage,
        globalPaymentMethods: state.globalPaymentMethods,
        instagramData: state.instagramData // 🆕 NUEVO
    };

    const updates = {
        '/Staff': staffObj,
        '/Boxes': boxesObj,
        '/Patients': patientsObj,
        '/Appointments': appointmentsObj,
        '/PendingRequests': pendingRequestsObj,
        '/Messages': messagesObj,
        '/FichasIngreso': fichasIngresoObj,
        '/Sesiones': sesionesObj,
        '/Informes': informesObj,
        '/TextosEditables': textosEditablesObj
    };

    db.ref().update(updates)
        .then(() => {
            console.log('✅ Datos guardados correctamente en Firebase');
            console.log('✅ Pacientes guardados:', state.patients.length);
            
            const specialtiesObj = {};
            state.specialties.forEach(item => { specialtiesObj[item.id] = { name: item.name }; });
            return db.ref('Specialties').set(specialtiesObj);
        })
        .then(() => {
            console.log('✅ Especialidades guardadas correctamente');
            
            if (state.currentUser) {
                if (typeof auth.updateStats === 'function') auth.updateStats();
                if (typeof citas.renderPendingRequests === 'function') citas.renderPendingRequests();
                
                if (state.currentUser.role === 'admin') {
                    if (typeof profesionales.renderStaffTable === 'function') profesionales.renderStaffTable();
                    if (typeof mensajes.renderMessagesTable === 'function') mensajes.renderMessagesTable();
                    if (typeof boxes.renderBoxesTable === 'function') boxes.renderBoxesTable();
                    
                    // Actualizar botones de admin
                    if (typeof admin.addEditButtonsToAdmin === 'function') {
                        setTimeout(admin.addEditButtonsToAdmin, 500);
                    }
                }
                if (state.currentUser.role === 'psych') {
                    if (typeof pacientes.renderPatients === 'function') pacientes.renderPatients();
                    if (typeof boxes.renderBoxOccupancy === 'function') boxes.renderBoxOccupancy();
                }
            }
            
            if (typeof publico.filterProfessionals === 'function') publico.filterProfessionals();
            if (typeof mensajes.renderMessages === 'function') mensajes.renderMessages();
            if (typeof mensajes.updateMarquee === 'function') mensajes.updateMarquee();
            
            // Actualizar secciones editables (incluyendo Instagram)
            if (typeof personalizacion.updateAboutSection === 'function') personalizacion.updateAboutSection();
            if (typeof personalizacion.updateAtencionSection === 'function') personalizacion.updateAtencionSection();
            if (typeof personalizacion.updateContactSection === 'function') personalizacion.updateContactSection();
            if (typeof personalizacion.updateInstagramSection === 'function') personalizacion.updateInstagramSection(); // 🆕 NUEVO
            
            // Mostrar toast de éxito
            if (typeof utils.showToast === 'function') utils.showToast('✅ Datos guardados', 'success');
        })
        .catch(err => {
            console.error('❌ Error al guardar en Firebase:', err);
            if (typeof utils.showToast === 'function') utils.showToast('Error al guardar los datos', 'error');
        });
}

// ============================================
// INICIALIZAR LA APLICACIÓN
// ============================================
if (typeof publico.cargarDatosIniciales === 'function') {
    publico.cargarDatosIniciales();
}

// Recuperar sesión guardada
const savedUser = localStorage.getItem('vinculoCurrentUser');
if (savedUser) {
    try {
        state.setCurrentUser(JSON.parse(savedUser));
        const checkData = setInterval(() => {
            if (state.dataLoaded) {
                clearInterval(checkData);
                if (typeof auth.cargarDashboard === 'function') {
                    auth.cargarDashboard(state.currentUser.role);
                }
                
                // Actualizar botón de perfil
                if (typeof window.updateProfileButton === 'function') {
                    setTimeout(window.updateProfileButton, 1000);
                }
                
                // Si es admin, agregar botones de edición
                if (state.currentUser.role === 'admin' && typeof admin.addEditButtonsToAdmin === 'function') {
                    setTimeout(admin.addEditButtonsToAdmin, 2000);
                }
            }
        }, 100);
    } catch (e) {
        localStorage.removeItem('vinculoCurrentUser');
    }
}

// Cargar fichas clínicas
if (state.currentUser && typeof fichasClinicas.cargarTodasLasFichas === 'function') {
    fichasClinicas.cargarTodasLasFichas().then(() => {
        console.log('📋 Fichas clínicas cargadas');
    });
}

// ============================================
// OCULTAR LOADER
// ============================================
window.addEventListener('load', function() {
    setTimeout(() => {
        const loader = document.getElementById('initialLoader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
    }, 1000);
});

// ============================================
// IMPORTAR ADMIN
// ============================================
import './modules/admin.js';

console.log('✅ main.js cargado completamente con todas las funciones de secciones editables e INSTAGRAM v3.0');