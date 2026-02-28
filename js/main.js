// js/main.js
// Punto de entrada principal de la aplicación

// Importar configuración de Firebase (necesario para inicializar)
import './config/firebase.js';

// Importar módulos
import * as state from './modules/state.js';
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

// ============================================
// EXPONER FUNCIONES GLOBALES PARA LOS ONCLICK DEL HTML
// ============================================

// Autenticación
window.showLoginModal = auth.showLoginModal;
window.closeLoginModal = auth.closeLoginModal;
window.processLogin = auth.processLogin;
window.logout = auth.logout;
window.switchTab = auth.switchTab;

// Mensajes
window.showMessageModal = mensajes.showMessageModal;
window.closeMessageModal = mensajes.closeMessageModal;
window.setRating = mensajes.setRating;
window.saveMessage = mensajes.saveMessage;
window.deleteMessage = mensajes.deleteMessage;

// Profesionales (admin)
window.showAddStaffModal = profesionales.showAddStaffModal;
window.closeAddStaffModal = profesionales.closeAddStaffModal;
window.addStaff = profesionales.addStaff;
window.editTherapist = profesionales.editTherapist;
window.closeEditTherapistModal = profesionales.closeEditTherapistModal;
window.updateTherapist = profesionales.updateTherapist;
window.deleteStaff = profesionales.deleteStaff;

// Pacientes
window.showNewPatientModal = pacientes.showNewPatientModal;
window.closePatientModal = pacientes.closePatientModal;
window.savePatient = pacientes.savePatient;
window.printPatientSummary = pacientes.printPatientSummary;
window.searchPatientByRut = pacientes.searchPatientByRut;
window.viewPatientDetails = pacientes.viewPatientDetails;

// Citas
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

// Disponibilidad
window.showAvailabilityModal = disponibilidad.showAvailabilityModal;
window.closeAvailabilityModal = disponibilidad.closeAvailabilityModal;
window.toggleWeekday = disponibilidad.toggleWeekday;
window.generateTimeSlots = disponibilidad.generateTimeSlots;
window.blockTimeRange = disponibilidad.blockTimeRange;
window.applyGeneratedSlots = disponibilidad.applyGeneratedSlots;
window.clearAllSlots = disponibilidad.clearAllSlots;
window.loadTimeSlots = disponibilidad.loadTimeSlots;
window.addOvercupo = disponibilidad.addOvercupo;
window.saveAvailability = disponibilidad.saveAvailability;

// Boxes
window.showBoxModal = boxes.showBoxModal;
window.closeBoxModal = boxes.closeBoxModal;
window.saveBox = boxes.saveBox;
window.editBox = boxes.editBox;
window.toggleBoxStatus = boxes.toggleBoxStatus;
window.deleteBox = boxes.deleteBox;

// Personalización (logo, fondo, textos, métodos de pago)
window.showLogoModal = personalizacion.showLogoModal;
window.closeLogoModal = personalizacion.closeLogoModal;
window.previewLogo = personalizacion.previewLogo;
window.saveLogo = personalizacion.saveLogo;
window.removeLogo = personalizacion.removeLogo;

window.showTextsModal = personalizacion.showTextsModal;
window.closeTextsModal = personalizacion.closeTextsModal;
window.saveHeroTexts = personalizacion.saveHeroTexts;

window.showBackgroundImageModal = personalizacion.showBackgroundImageModal;
window.closeBackgroundImageModal = personalizacion.closeBackgroundImageModal;
window.previewBackgroundImage = personalizacion.previewBackgroundImage;
window.saveBackgroundImage = personalizacion.saveBackgroundImage;
window.removeBackgroundImage = personalizacion.removeBackgroundImage;
window.updateBackgroundOpacity = personalizacion.updateBackgroundOpacity;

window.showPaymentMethodsModal = personalizacion.showPaymentMethodsModal;
window.closePaymentMethodsModal = personalizacion.closePaymentMethodsModal;
window.saveGlobalPaymentMethods = personalizacion.saveGlobalPaymentMethods;

// Configuración personal del psicólogo
window.loadMyConfig = personalizacion.loadMyConfig;
window.saveMyConfig = personalizacion.saveMyConfig;

// Filtros y vista pública
window.filterProfessionals = publico.filterProfessionals;

// Utilidades (formato RUT, validación, etc.)
window.formatRut = utils.formatRut;
window.validarRut = utils.validarRut;
window.showToast = utils.showToast; // opcional

// ============================================
// FUNCIÓN GLOBAL DE GUARDADO (usada por los módulos)
// ============================================

export function save() {
    const updates = {};
    
    updates['/Staff'] = state.staff.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});
    updates['/Boxes'] = state.boxes.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});
    updates['/Patients'] = state.patients.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});
    updates['/Appointments'] = state.appointments.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});
    updates['/PendingRequests'] = state.pendingRequests.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});
    updates['/Messages'] = state.messages.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});
    
    db.ref().update(updates)
        .then(() => console.log('Datos guardados'))
        .catch(err => console.error('Error al guardar:', err));
    
    // Guardar especialidades (función en personalizacion)
    personalizacion.guardarEspecialidades?.(); // si existe
}

window.save = save; // para que otros módulos puedan llamarla

// ============================================
// RECUPERAR SESIÓN GUARDADA
// ============================================

const savedUser = localStorage.getItem('vinculoCurrentUser');
if (savedUser) {
    try {
        state.currentUser = JSON.parse(savedUser);
        // Esperar a que los datos carguen y luego mostrar el dashboard
        const checkData = setInterval(() => {
            if (state.dataLoaded) {
                clearInterval(checkData);
                auth.showDashboard();
            }
        }, 100);
    } catch (e) {
        localStorage.removeItem('vinculoCurrentUser');
    }
}

// ============================================
// INICIALIZAR CARGA DE DATOS
// ============================================
publico.cargarDatosIniciales();

// ============================================
// EVENT LISTENERS (algunos se asignan directamente en HTML, otros aquí)
// ============================================

document.getElementById('custDate')?.addEventListener('change', function() {
    citas.updateAvailableTimes?.();
    citas.checkOnlineAvailability?.();
    citas.updateBookingDetails?.();
});

document.getElementById('custTime')?.addEventListener('change', function() {
    citas.checkOnlineAvailability?.();
});

document.getElementById('appointmentType')?.addEventListener('change', function() {
    citas.updateBookingDetails?.();
    citas.updateAvailableTimes?.();
});

document.getElementById('therapistTime')?.addEventListener('change', function() {
    const date = document.getElementById('therapistDate').value;
    const time = this.value;
    document.getElementById('therapistTimeDisplay').innerText = time || '—';
    if (date && time) {
        citas.updateTherapistBoxSelector?.(date, time);
    }
});

document.getElementById('therapistDate')?.addEventListener('change', function() {
    document.getElementById('therapistDateDisplay').innerText = this.value || '—';
    citas.updateTherapistAvailableSlots?.();
});