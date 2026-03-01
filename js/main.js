// js/main.js
import { db } from './config/firebase.js';
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
// EXPONER STATE GLOBALMENTE PARA DEPURACIÓN
// ============================================
window.state = state;
console.log('✅ state expuesto globalmente');

// ============================================
// EXPONER FUNCIONES GLOBALES INMEDIATAMENTE
// ============================================
console.log('🚀 Exponiendo funciones globales...');

// Funciones de autenticación
window.showLoginModal = auth.showLoginModal;
window.closeLoginModal = auth.closeLoginModal;
window.processLogin = auth.processLogin;
window.logout = auth.logout;
window.switchTab = auth.switchTab;

// Funciones de mensajes
window.showMessageModal = mensajes.showMessageModal;
window.closeMessageModal = mensajes.closeMessageModal;
window.setRating = mensajes.setRating;
window.saveMessage = mensajes.saveMessage;
window.deleteMessage = mensajes.deleteMessage;

// Funciones de profesionales
window.showAddStaffModal = profesionales.showAddStaffModal;
window.closeAddStaffModal = profesionales.closeAddStaffModal;
window.addStaff = profesionales.addStaff;
window.editTherapist = profesionales.editTherapist;
window.closeEditTherapistModal = profesionales.closeEditTherapistModal;
window.updateTherapist = profesionales.updateTherapist;
window.deleteStaff = profesionales.deleteStaff;

// Funciones de pacientes
window.showNewPatientModal = pacientes.showNewPatientModal;
window.closePatientModal = pacientes.closePatientModal;
window.savePatient = pacientes.savePatient;
window.printPatientSummary = pacientes.printPatientSummary;
window.searchPatientByRut = pacientes.searchPatientByRut;
window.viewPatientDetails = pacientes.viewPatientDetails;
window.renderPatients = pacientes.renderPatients;

// Funciones de citas
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

// Funciones de disponibilidad
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

// Funciones de boxes
window.showBoxModal = boxes.showBoxModal;
window.closeBoxModal = boxes.closeBoxModal;
window.saveBox = boxes.saveBox;
window.editBox = boxes.editBox;
window.toggleBoxStatus = boxes.toggleBoxStatus;
window.deleteBox = boxes.deleteBox;

// Funciones de personalización
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

// Funciones de utilidad
window.filterProfessionals = publico.filterProfessionals;
window.formatRut = utils.formatRut;
window.validarRut = utils.validarRut;
window.showToast = utils.showToast;

// Verificar que switchTab se asignó correctamente
console.log('✅ switchTab asignada a window:', typeof window.switchTab);

// ============================================
// FUNCIÓN PARA GUARDAR EN FIREBASE
// ============================================
export function save() {
    console.log("💾 Guardando datos en Firebase...");
    
    // Preparar objetos para Firebase (convertir arrays a objetos con ID como clave)
    const staffObj = {};
    state.staff.forEach(item => {
        staffObj[item.id] = item;
    });

    const boxesObj = {};
    state.boxes.forEach(item => {
        boxesObj[item.id] = item;
    });

    const patientsObj = {};
    state.patients.forEach(item => {
        patientsObj[item.id] = item;
    });

    const appointmentsObj = {};
    state.appointments.forEach(item => {
        appointmentsObj[item.id] = item;
    });

    const pendingRequestsObj = {};
    state.pendingRequests.forEach(item => {
        pendingRequestsObj[item.id] = item;
    });

    const messagesObj = {};
    state.messages.forEach(item => {
        messagesObj[item.id] = item;
    });

    // Realizar todas las actualizaciones en una sola operación
    const updates = {
        '/Staff': staffObj,
        '/Boxes': boxesObj,
        '/Patients': patientsObj,
        '/Appointments': appointmentsObj,
        '/PendingRequests': pendingRequestsObj,
        '/Messages': messagesObj
    };

    // Ejecutar la actualización
    db.ref().update(updates)
        .then(() => {
            console.log('✅ Datos guardados correctamente en Firebase');
            
            // Guardar especialidades por separado
            const specialtiesObj = {};
            state.specialties.forEach(item => {
                specialtiesObj[item.id] = { name: item.name };
            });
            return db.ref('Specialties').set(specialtiesObj);
        })
        .then(() => {
            console.log('✅ Especialidades guardadas correctamente');
            
            // Actualizar vistas si hay usuario logueado
            if (state.currentUser) {
                auth.updateStats();
                citas.renderPendingRequests();
                
                if (state.currentUser.role === 'admin') {
                    profesionales.renderStaffTable();
                    mensajes.renderMessagesTable();
                    boxes.renderBoxesTable();
                }
                if (state.currentUser.role === 'psych') {
                    pacientes.renderPatients();
                    boxes.renderBoxOccupancy();
                    if (document.getElementById('tabDisponibilidad')?.classList.contains('active')) {
                        disponibilidad.loadTimeSlots();
                    }
                }
            }
            
            // Actualizar vista pública
            publico.filterProfessionals();
            mensajes.renderMessages();
            mensajes.updateMarquee();
        })
        .catch(err => {
            console.error('❌ Error al guardar en Firebase:', err);
            utils.showToast('Error al guardar los datos', 'error');
        });
}

// ============================================
// INICIALIZAR LA APLICACIÓN
// ============================================
publico.cargarDatosIniciales();

// Recuperar sesión guardada (si existe)
const savedUser = localStorage.getItem('vinculoCurrentUser');
if (savedUser) {
    try {
        state.setCurrentUser(JSON.parse(savedUser));
        // Esperar a que los datos carguen y luego mostrar el dashboard
        const checkData = setInterval(() => {
            if (state.dataLoaded) {
                clearInterval(checkData);
                auth.cargarDashboard(state.currentUser.role);
            }
        }, 100);
    } catch (e) {
        localStorage.removeItem('vinculoCurrentUser');
    }
}

// ============================================
// OCULTAR LOADER CUANDO TODO ESTÉ CARGADO
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
// IMPORTAR FUNCIONES DE ADMIN
// ============================================
import './modules/admin.js';

// Mejorar scroll en móviles
document.addEventListener('touchstart', function(){}, {passive: true});

// Desactivar zoom en inputs
document.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('focus', () => {
        document.querySelector('meta[name=viewport]').setAttribute('content', 
            'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
    });
    el.addEventListener('blur', () => {
        document.querySelector('meta[name=viewport]').setAttribute('content', 
            'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes');
    });
});

console.log('✅ main.js cargado completamente');