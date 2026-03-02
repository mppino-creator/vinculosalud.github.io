// js/main.js - VERSIÓN CORREGIDA

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

// Módulos de fichas clínicas
import * as fichasClinicas from './modules/fichasClinicas.js';
import * as informes from './modules/informes.js';
import * as permisos from './modules/permisos.js';
import * as pdfGenerator from './modules/pdfGenerator.js';
import * as estadisticas from './modules/estadisticas.js';

// ============================================
// EXPONER FUNCIONES GLOBALES - VERSIÓN CORREGIDA
// ============================================
console.log('🚀 Exponiendo funciones globales...');

// ============================================
// FUNCIONES DE AUTENTICACIÓN (CRÍTICAS)
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
// FUNCIONES DE CITAS (INCLUYE selectTimeSlot)
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
window.selectTimeSlot = citas.selectTimeSlot; // ✅ AÑADIDO
window.selectTimePref = citas.selectTimePref; // ✅ AÑADIDO

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
// FUNCIONES DE PERSONALIZACIÓN
// ============================================
window.showLogoModal = personalizacion.showLogoModal;
window.closeLogoModal = personalizacion.closeLogoModal;
window.saveLogo = personalizacion.saveLogo;
window.removeLogo = personalizacion.removeLogo;
window.showTextsModal = personalizacion.showTextsModal;
window.closeTextsModal = personalizacion.closeTextsModal;
window.saveHeroTexts = personalizacion.saveHeroTexts;
window.showBackgroundImageModal = personalizacion.showBackgroundImageModal;
window.closeBackgroundImageModal = personalizacion.closeBackgroundImageModal;
window.saveBackgroundImage = personalizacion.saveBackgroundImage;
window.removeBackgroundImage = personalizacion.removeBackgroundImage;
window.showPaymentMethodsModal = personalizacion.showPaymentMethodsModal;
window.closePaymentMethodsModal = personalizacion.closePaymentMethodsModal;
window.saveGlobalPaymentMethods = personalizacion.saveGlobalPaymentMethods;
window.updatePaymentMethodsInfo = personalizacion.updatePaymentMethodsInfo;
window.loadMyConfig = personalizacion.loadMyConfig;
window.saveMyConfig = personalizacion.saveMyConfig;
window.showSpecialtiesModal = personalizacion.showSpecialtiesModal;
window.closeSpecialtiesModal = personalizacion.closeSpecialtiesModal;
window.addSpecialty = personalizacion.addSpecialty;
window.deleteSpecialty = personalizacion.deleteSpecialty;

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

// ============================================
// VERIFICACIÓN (DESPUÉS DE ASIGNAR TODO)
// ============================================
console.log('✅ showLoginModal asignada:', typeof window.showLoginModal);
console.log('✅ switchTab asignada:', typeof window.switchTab);
console.log('✅ renderPatients asignada:', typeof window.renderPatients);
console.log('✅ verFichaCompleta asignada:', typeof window.verFichaCompleta);
console.log('✅ estadisticas asignada:', typeof window.estadisticas);
console.log('✅ selectTimeSlot asignada:', typeof window.selectTimeSlot); // ✅ AHORA DEBERÍA FUNCIONAR
console.log('✅ selectTimePref asignada:', typeof window.selectTimePref);

// ============================================
// FUNCIÓN PARA GUARDAR EN FIREBASE
// ============================================
export function save() {
    console.log("💾 Guardando datos en Firebase...");
    
    // Preparar objetos para Firebase
    const staffObj = {};
    state.staff.forEach(item => { staffObj[item.id] = item; });

    const boxesObj = {};
    state.boxes.forEach(item => { boxesObj[item.id] = item; });

    const patientsObj = {};
    state.patients.forEach(item => { patientsObj[item.id] = item; });

    const appointmentsObj = {};
    state.appointments.forEach(item => { appointmentsObj[item.id] = item; });

    const pendingRequestsObj = {};
    state.pendingRequests.forEach(item => { pendingRequestsObj[item.id] = item; });

    const messagesObj = {};
    state.messages.forEach(item => { messagesObj[item.id] = item; });

    const updates = {
        '/Staff': staffObj,
        '/Boxes': boxesObj,
        '/Patients': patientsObj,
        '/Appointments': appointmentsObj,
        '/PendingRequests': pendingRequestsObj,
        '/Messages': messagesObj
    };

    db.ref().update(updates)
        .then(() => {
            console.log('✅ Datos guardados correctamente en Firebase');
            
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
                }
                if (state.currentUser.role === 'psych') {
                    if (typeof pacientes.renderPatients === 'function') pacientes.renderPatients();
                    if (typeof boxes.renderBoxOccupancy === 'function') boxes.renderBoxOccupancy();
                }
            }
            
            if (typeof publico.filterProfessionals === 'function') publico.filterProfessionals();
            if (typeof mensajes.renderMessages === 'function') mensajes.renderMessages();
            if (typeof mensajes.updateMarquee === 'function') mensajes.updateMarquee();
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

console.log('✅ main.js cargado completamente');