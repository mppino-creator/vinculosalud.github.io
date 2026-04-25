// js/modules/publico.js - VERSIÓN COMPLETA CON ANULACIONES PERSONALES Y CONTROL DE WARNING
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast, getPublicStaff } from './utils.js';
import { renderMessages, updateMarquee, renderMessagesTable } from './mensajes.js';
import { 
    cargarEspecialidades, 
    cargarMetodosPago, 
    cargarFondo, 
    cargarTextos, 
    cargarLogo,
    cargarAboutTexts,
    cargarAtencionTexts,
    cargarContactInfo,
    cargarInstagramData,
    updateAboutSection,
    updateAtencionSection,
    updateContactSection
} from './personalizacion.js';
import { renderStaffTable } from './profesionales.js';
import { renderPatients } from './pacientes.js';
import { renderPendingRequests, renderAppointments } from './citas.js';
import { loadBoxSlots, saveBoxSlots } from './box.js';

// ============================================
// ALMACENAMIENTO DE LISTENERS PRIVADOS
// ============================================
let activeListeners = {
    patients: null,
    appointments: null,
    pendingRequests: null,
    fichasIngreso: null,
    sesiones: null,
    informes: null
};

let escuchasPrivadasIniciadas = false;
let datosPrivadosCargados = false;

// ============================================
// REGISTRAR VISITA A PROFESIONAL
// ============================================
export async function registrarVisitaProfesional(psychId) {
    if (!psychId) return;
    try {
        const visitaRef = firebase.database().ref(`analytics/profesionales/${psychId}/visitas`);
        await visitaRef.transaction((current) => (current || 0) + 1);
        const hoy = new Date().toISOString().split('T')[0];
        const diarioRef = firebase.database().ref(`analytics/profesionales/${psychId}/visitas_diarias/${hoy}`);
        await diarioRef.transaction((current) => (current || 0) + 1);
        console.log(`✅ Visita registrada para profesional ${psychId}`);
    } catch (error) {
        console.error('Error registrando visita:', error);
    }
}

// ============================================
// FUNCIÓN AUXILIAR PARA CALIFICACIONES
// ============================================
function getAverageRating(psychId) {
    const messages = state.messages || [];
    const psychMessages = messages.filter(m => m && m.therapistId == psychId);
    if (psychMessages.length === 0) return 0;
    const sum = psychMessages.reduce((sum, m) => sum + (m.rating || 0), 0);
    return sum / psychMessages.length;
}

function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ============================================
// FUNCIÓN: Calcular cupos disponibles HOY (basada en Box + anulaciones)
// ============================================
async function getAvailableSlotsCountForToday(psych) {
    const today = getLocalDateString(new Date());
    const now = new Date();
    const boxSlots = await loadBoxSlots(today);
    const profStart = psych.startTime || '00:00';
    const profEnd = psych.endTime || '23:59';
    const unavailableSlots = psych.unavailableSlots || {};
    const anulacionesHoy = unavailableSlots[today] || [];
    if (anulacionesHoy.includes('ALL_DAY')) return 0;
    const advanceMinutes = psych.advanceNotice ?? 60;
    const cutoffTime = new Date(now.getTime() + advanceMinutes * 60 * 1000);
    const available = boxSlots.filter(slot => {
        const slotStart = slot.timeLabel.split(' - ')[0];
        const slotDateTime = new Date(`${today}T${slotStart}:00`);
        return slot.status === 'available' &&
               slotStart >= profStart && slotStart < profEnd &&
               slotDateTime > cutoffTime &&
               !anulacionesHoy.includes(slot.timeLabel);
    });
    return available.length;
}

// ============================================
// FUNCIÓN: Próxima fecha con disponibilidad
// ============================================
async function getNextAvailableDate(psych, maxDays = 30) {
    const now = new Date();
    const profStart = psych.startTime || '00:00';
    const profEnd = psych.endTime || '23:59';
    const unavailableSlots = psych.unavailableSlots || {};
    for (let i = 0; i <= maxDays; i++) {
        const fecha = new Date(now);
        fecha.setDate(now.getDate() + i);
        const dateStr = getLocalDateString(fecha);
        const anulaciones = unavailableSlots[dateStr] || [];
        if (anulaciones.includes('ALL_DAY')) continue;
        const boxSlots = await loadBoxSlots(dateStr);
        const disponible = boxSlots.some(slot => {
            const slotStart = slot.timeLabel.split(' - ')[0];
            const slotDateTime = new Date(`${dateStr}T${slotStart}:00`);
            const advanceMinutes = psych.advanceNotice ?? 60;
            const cutoffTime = new Date(now.getTime() + advanceMinutes * 60 * 1000);
            return slot.status === 'available' &&
                   slotStart >= profStart && slotStart < profEnd &&
                   slotDateTime > cutoffTime &&
                   !anulaciones.includes(slot.timeLabel);
        });
        if (disponible) return dateStr;
    }
    return null;
}

// ============================================
// TOGGLE INFO (accordion)
// ============================================
window.toggleInfo = function(button) {
    const card = button?.closest('.professional-card, .therapist-card');
    if (!card) return;
    const psychId = card.getAttribute('data-id');
    const psych = state.staff?.find(p => p.id == psychId);
    if (!psych) return;
    let infoSection = card.querySelector('.card-info');
    if (!infoSection) {
        infoSection = document.createElement('div');
        infoSection.className = 'card-info';
        infoSection.style.display = 'none';
        let infoHTML = '';
        if (psych.education) infoHTML += `<div class="info-section"><h4><i class="fa fa-graduation-cap"></i> Formación</h4><p>${psych.education}</p></div>`;
        if (psych.spec && psych.spec.length) {
            const specs = Array.isArray(psych.spec) ? psych.spec : [psych.spec];
            infoHTML += `<div class="info-section"><h4><i class="fa fa-tags"></i> Especialidades</h4><div class="specialties-list">${specs.filter(s => s).map(s => `<span class="specialty-tag">${s}</span>`).join('')}</div></div>`;
        }
        if (psych.experience) infoHTML += `<div class="info-section"><h4><i class="fa fa-briefcase"></i> Experiencia</h4><p>${psych.experience} años de experiencia clínica</p></div>`;
        if (psych.clinicalExperience) infoHTML += `<div class="info-section"><h4><i class="fa fa-heart"></i> Enfoque clínico</h4><p>${psych.clinicalExperience}</p></div>`;
        if (psych.whatsapp) infoHTML += `<div class="info-section"><h4><i class="fa fa-phone"></i> Contacto</h4><a href="https://wa.me/${psych.whatsapp.replace(/\+/g, '')}?text=${encodeURIComponent('Hola, necesito información sobre tus atenciones.')}" target="_blank" class="whatsapp-link"><i class="fab fa-whatsapp"></i> Contactar por WhatsApp</a></div>`;
        infoSection.innerHTML = infoHTML;
        card.appendChild(infoSection);
    }
    const isHidden = infoSection.style.display === 'none' || !infoSection.style.display;
    infoSection.style.display = isHidden ? 'block' : 'none';
    button.innerHTML = isHidden ? '<i class="fa fa-chevron-up"></i> <span>Menos información</span>' : '<i class="fa fa-chevron-down"></i> <span>Más información</span>';
    if (infoSection.style.display === 'block') infoSection.style.animation = 'slideDown 0.3s ease';
};

// ============================================
// NAVEGACIÓN
// ============================================
export function showSection(sectionId) {
    console.log('🔄 Mostrando sección:', sectionId);
    const secciones = ['inicio', 'about', 'equipo', 'atencion', 'contacto'];
    secciones.forEach(sec => {
        const elemento = document.getElementById(sec);
        if (elemento) elemento.style.display = 'none';
    });
    const seccionAMostrar = document.getElementById(sectionId);
    if (seccionAMostrar) {
        seccionAMostrar.style.display = 'block';
        seccionAMostrar.scrollIntoView({ behavior: 'smooth' });
    }
    document.querySelectorAll('.public-nav a').forEach(link => {
        link.classList.remove('active');
        link.style.borderBottom = 'none';
        link.style.paddingBottom = '0';
        if (link.getAttribute('onclick')?.includes(sectionId)) {
            link.classList.add('active');
            link.style.borderBottom = '2px solid var(--ocre-calido)';
            link.style.paddingBottom = '5px';
        }
    });
    const breadcrumbs = document.querySelector('.breadcrumbs');
    const currentPageSpan = document.getElementById('currentPage');
    if (breadcrumbs) {
        if (sectionId !== 'inicio') {
            breadcrumbs.style.display = 'block';
            const nombres = { 'about': 'Quiénes Somos', 'equipo': 'Equipo', 'atencion': 'Tipo de Atención', 'contacto': 'Contacto' };
            if (currentPageSpan) currentPageSpan.textContent = nombres[sectionId] || sectionId;
        } else {
            breadcrumbs.style.display = 'none';
        }
    }
    if (sectionId === 'equipo') {
        setTimeout(() => {
            if (window.personalizacion && typeof window.personalizacion.updateInstagramSection === 'function') {
                console.log('📸 Forzando actualización de Instagram al mostrar sección equipo');
                window.personalizacion.updateInstagramSection();
            }
        }, 300);
    }
    const grid = document.getElementById('equipo');
    const filtros = document.querySelector('.filters');
    if (sectionId === 'equipo') {
        if (grid) grid.style.display = '';
        if (filtros) filtros.style.display = 'flex';
        if (typeof filterProfessionals === 'function') filterProfessionals();
    } else {
        if (filtros) filtros.style.display = 'none';
        if (grid) grid.style.display = 'none';
        if (sectionId === 'about') updateAboutSection();
        else if (sectionId === 'atencion') updateAtencionSection();
        else if (sectionId === 'contacto') updateContactSection();
    }
    console.log(`✅ Sección ${sectionId} mostrada correctamente`);
}

export function abrirAgenda() {
    console.log('📅 Abriendo agenda con profesionales y filtros...');
    showSection('equipo');
    const filtros = document.querySelector('.filters');
    if (filtros) filtros.style.display = 'flex';
    const grid = document.getElementById('equipo');
    if (grid) grid.style.display = '';
    showToast('Selecciona un profesional para ver su disponibilidad y agendar tu hora', 'info', 3000);
}

export function enviarContacto() {
    const nombre = document.getElementById('contactName')?.value;
    const email = document.getElementById('contactEmail')?.value;
    const mensaje = document.getElementById('contactMessage')?.value;
    if (!nombre || !email || !mensaje) { showToast('Completa todos los campos', 'error'); return; }
    if (!email.includes('@') || !email.includes('.')) { showToast('Ingresa un email válido', 'error'); return; }
    console.log('📧 Mensaje de contacto:', { nombre, email, mensaje });
    showToast('✅ Mensaje enviado, te contactaremos pronto', 'success');
    document.getElementById('contactName').value = '';
    document.getElementById('contactEmail').value = '';
    document.getElementById('contactMessage').value = '';
}

export function compartirPerfil(psychId, psychName) {
    const url = window.location.href.split('?')[0] + '?profesional=' + psychId;
    if (navigator.share) {
        navigator.share({ title: `${psychName} - Vínculo Salud`, text: `Conoce a ${psychName} y agenda tu cita`, url: url })
            .catch(() => mostrarOpcionesCompartir(url, psychName));
    } else {
        mostrarOpcionesCompartir(url, psychName);
    }
}

function mostrarOpcionesCompartir(url, psychName) {
    const mensajeWhatsApp = `https://wa.me/?text=${encodeURIComponent(`📋 ${psychName} - Vínculo Salud\n${url}`)}`;
    const mensajeEmail = `mailto:?subject=${encodeURIComponent(`Perfil de ${psychName} en Vínculo Salud`)}&body=${encodeURIComponent(`Te recomiendo este profesional:\n${url}`)}`;
    const modal = document.createElement('div');
    modal.style.cssText = `position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:10000;`;
    modal.innerHTML = `
        <div style="background:white; padding:25px; border-radius:20px; max-width:300px; text-align:center;">
            <h3 style="margin-bottom:20px;">Compartir perfil</h3>
            <div style="display:flex; gap:15px; justify-content:center; margin-bottom:20px;">
                <a href="${mensajeWhatsApp}" target="_blank" style="background:var(--whatsapp); color:white; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px; text-decoration:none;"><i class="fab fa-whatsapp"></i></a>
                <a href="${mensajeEmail}" style="background:var(--primario); color:white; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; text-decoration:none;"><i class="fa fa-envelope"></i></a>
                <button onclick="copiarAlPortapapeles('${url}')" style="background:var(--exito); color:white; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; border:none; cursor:pointer;"><i class="fa fa-link"></i></button>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="background:var(--peligro); color:white; padding:10px 20px; border:none; border-radius:30px; cursor:pointer;">Cerrar</button>
        </div>
    `;
    document.body.appendChild(modal);
}

export function copiarAlPortapapeles(texto) {
    navigator.clipboard.writeText(texto).then(() => showToast('✅ Enlace copiado', 'success'))
        .catch(() => showToast('❌ Error al copiar', 'error'));
}

export function showTherapistInfo(psychId) {
    console.log('📋 Usando nuevo sistema accordion para profesional:', psychId);
    const button = document.querySelector(`.therapist-card[data-id="${psychId}"] .btn-mas-info`);
    if (button) window.toggleInfo(button);
}

export async function openBooking(psychId) {
    console.log('📅 Abriendo booking para profesional:', psychId);
    await registrarVisitaProfesional(psychId);
    const psych = state.staff.find(p => p.id == psychId);
    if (!psych) { showToast('Profesional no encontrado', 'error'); return; }
    state.setCurrentPsychId(psychId);
    const psychNameSpan = document.getElementById('psychName');
    const psychSelectedName = document.getElementById('psychSelectedName');
    const psychSelectedSpec = document.getElementById('psychSelectedSpec');
    if (psychNameSpan) psychNameSpan.innerText = psych.name;
    if (psychSelectedName) psychSelectedName.innerText = psych.name;
    if (psychSelectedSpec) {
        const specs = Array.isArray(psych.spec) ? psych.spec : [psych.spec];
        psychSelectedSpec.innerText = specs[0] || 'Profesional';
    }
    const clientView = document.getElementById('clientView');
    const bookingPanel = document.getElementById('bookingPanel');
    if (clientView) clientView.style.display = 'none';
    if (bookingPanel) bookingPanel.style.display = 'block';
    const custDate = document.getElementById('custDate');
    if (custDate) custDate.value = '';
    const custTime = document.getElementById('custTime');
    if (custTime) custTime.innerHTML = '<option value="">Selecciona un horario</option>';
    updateBookingDetails();
}
window.openBooking = openBooking;

export function updateBookingDetails() {
    const psychId = state.currentPsychId;
    const psych = state.staff.find(p => p.id == psychId);
    if (!psych) return;
    const appointmentType = document.getElementById('appointmentType')?.value;
    const bookingPrice = document.getElementById('bookingPrice');
    const bookingType = document.getElementById('bookingType');
    const presencialWarning = document.getElementById('presencialWarning');
    const onlineAvailabilityMsg = document.getElementById('onlineAvailabilityMsg');
    if (appointmentType === 'online') {
        if (bookingPrice) bookingPrice.innerText = `$${(psych.priceOnline || 0).toLocaleString()}`;
        if (bookingType) bookingType.innerText = 'Online';
        if (presencialWarning) presencialWarning.style.display = 'none';
        if (onlineAvailabilityMsg) onlineAvailabilityMsg.style.display = 'block';
    } else {
        if (bookingPrice) bookingPrice.innerText = `$${(psych.pricePresencial || 0).toLocaleString()}`;
        if (bookingType) bookingType.innerText = 'Presencial';
        if (presencialWarning) presencialWarning.style.display = 'block';
        if (onlineAvailabilityMsg) onlineAvailabilityMsg.style.display = 'none';
    }
}

// ============================================
// ACTUALIZAR HORARIOS DISPONIBLES (basado en BOX + anulaciones personales)
// ============================================
export async function updateAvailableTimes() {
    const date = document.getElementById('custDate')?.value;
    const appointmentType = document.getElementById('appointmentType')?.value;
    const timeSelect = document.getElementById('custTime');
    const psychId = state.currentPsychId;
    if (!date || !psychId || !timeSelect) return;
    timeSelect.innerHTML = '<option value="">Cargando horarios...</option>';
    
    const warningDiv = document.getElementById('presencialWarning');
    
    try {
        const psych = state.staff.find(p => p.id == psychId);
        if (!psych) throw new Error('Profesional no encontrado');
        const profStart = psych.startTime || '00:00';
        const profEnd = psych.endTime || '23:59';
        const unavailableSlots = psych.unavailableSlots || {};
        const anulacionesHoy = unavailableSlots[date] || [];
        if (anulacionesHoy.includes('ALL_DAY')) {
            timeSelect.innerHTML = '<option value="">Día anulado por el profesional</option>';
            if (warningDiv) warningDiv.style.display = 'none';
            return;
        }
        let boxSlots = [];
        try { boxSlots = await loadBoxSlots(date); } catch(err) { console.warn(err); }
        if (boxSlots.length === 0) {
            timeSelect.innerHTML = '<option value="">No hay horarios configurados para esta fecha</option>';
            if (warningDiv) warningDiv.style.display = 'block';
            return;
        }
        const existingAppointments = state.appointments.filter(a => a.psychId == psychId && a.date === date).map(a => a.time);
        const now = new Date();
        const advanceMinutes = psych.advanceNotice ?? 60;
        const cutoffTime = new Date(now.getTime() + advanceMinutes * 60 * 1000);
        let availableSlots = [];
        if (appointmentType === 'presencial') {
            availableSlots = boxSlots.filter(slot => {
                const slotStart = slot.timeLabel.split(' - ')[0];
                const slotDateTime = new Date(`${date}T${slotStart}:00`);
                return slot.status === 'available' &&
                       slotStart >= profStart && slotStart < profEnd &&
                       slotDateTime > cutoffTime &&
                       !existingAppointments.includes(slot.timeLabel) &&
                       !anulacionesHoy.includes(slot.timeLabel);
            });
        } else {
            availableSlots = boxSlots.filter(slot => {
                const slotStart = slot.timeLabel.split(' - ')[0];
                const slotDateTime = new Date(`${date}T${slotStart}:00`);
                return slotStart >= profStart && slotStart < profEnd &&
                       slotDateTime > cutoffTime &&
                       !existingAppointments.includes(slot.timeLabel) &&
                       !anulacionesHoy.includes(slot.timeLabel);
            });
        }
        availableSlots.sort((a,b) => a.timeLabel.localeCompare(b.timeLabel));
        if (availableSlots.length === 0) {
            timeSelect.innerHTML = '<option value="">No hay horarios disponibles para esta fecha</option>';
            if (warningDiv && appointmentType === 'presencial') warningDiv.style.display = 'block';
        } else {
            timeSelect.innerHTML = '<option value="">Selecciona un horario</option>' +
                availableSlots.map(slot => `<option value="${slot.timeLabel}">${slot.timeLabel}</option>`).join('');
            if (warningDiv && appointmentType === 'presencial') warningDiv.style.display = 'none';
        }
    } catch (error) {
        console.error(error);
        timeSelect.innerHTML = '<option value="">Error al cargar horarios</option>';
        if (warningDiv) warningDiv.style.display = 'block';
    }
}

// ============================================
// BUSCAR PACIENTE POR RUT
// ============================================
export function searchPatientByRutBooking() {
    const rutInput = document.getElementById('custRut');
    if (!rutInput) return;
    let rut = rutInput.value.replace(/\./g, '').replace(/\-/g, '');
    if (!rut) return;
    const patient = state.patients.find(p => {
        const pRut = p.rut ? p.rut.replace(/\./g, '').replace(/\-/g, '') : '';
        return pRut === rut;
    });
    if (!patient) return;
    const custName = document.getElementById('custName');
    const custEmail = document.getElementById('custEmail');
    const custPhone = document.getElementById('custPhone');
    const custPrevision = document.getElementById('custPrevision');
    const custBirthdate = document.getElementById('custBirthdate');
    if (custName) custName.value = patient.name || '';
    if (custEmail) custEmail.value = patient.email || '';
    if (custPhone) custPhone.value = patient.phone || '';
    if (custPrevision) custPrevision.value = patient.prevision || '';
    if (custBirthdate) custBirthdate.value = patient.birthdate || '';
    if (window.calcularEdad) window.calcularEdad();
    showToast('Datos del paciente cargados', 'success');
}

// ============================================
// EJECUTAR RESERVA (con actualización del BOX)
// ============================================
export async function executeBooking() {
    const psychId = state.currentPsychId;
    if (!psychId) { showToast('Selecciona un profesional', 'error'); return; }
    const custName = document.getElementById('custName')?.value;
    const custEmail = document.getElementById('custEmail')?.value;
    const custRut = document.getElementById('custRut')?.value;
    const custPhone = document.getElementById('custPhone')?.value;
    const countryCode = document.getElementById('countryCode')?.value || '+56';
    const phoneNine = document.getElementById('phoneNine')?.value || '9';
    const custDate = document.getElementById('custDate')?.value;
    const custTime = document.getElementById('custTime')?.value;
    const appointmentType = document.getElementById('appointmentType')?.value;
    const custMsg = document.getElementById('custMsg')?.value;
    const paymentMethod = document.getElementById('paymentMethod')?.value;
    const acceptPolicy = document.getElementById('acceptPolicy')?.checked;
    if (!custName || !custEmail || !custRut || !custDate || !custTime || !appointmentType || !paymentMethod) {
        showToast('Completa todos los campos obligatorios', 'error');
        return;
    }
    if (!acceptPolicy) { showToast('Debes aceptar la política de cancelación', 'error'); return; }
    const phoneFull = `${countryCode} ${phoneNine} ${custPhone}`;
    const psych = state.staff.find(p => p.id == psychId);
    const price = appointmentType === 'online' ? psych.priceOnline : psych.pricePresencial;
    const appointment = {
        id: Date.now().toString(),
        patientName: custName,
        patientEmail: custEmail,
        patientRut: custRut,
        patientPhone: phoneFull,
        psychId: psychId,
        psychName: psych.name,
        date: custDate,
        time: custTime,
        type: appointmentType,
        notes: custMsg,
        paymentMethod: paymentMethod,
        paymentStatus: 'pendiente',
        price: price,
        status: 'pendiente',
        createdAt: new Date().toISOString()
    };
    try {
        await firebase.database().ref(`appointments/${appointment.id}`).set(appointment);
        if (appointmentType === 'presencial') {
            const boxSlots = await loadBoxSlots(custDate);
            const slotIndex = boxSlots.findIndex(slot => slot.timeLabel === custTime);
            if (slotIndex !== -1 && boxSlots[slotIndex].status === 'available') {
                boxSlots[slotIndex].status = 'booked';
                boxSlots[slotIndex].professional = psych.name;
                await saveBoxSlots(custDate, boxSlots);
                console.log(`📦 Slot del Box reservado: ${custDate} ${custTime} por ${psych.name}`);
            } else {
                console.warn(`⚠️ No se pudo reservar el slot del Box (ya no está disponible)`);
            }
        }
        showToast('✅ Cita solicitada exitosamente', 'success');
        await registrarConversion(psychId);
        const clientView = document.getElementById('clientView');
        const bookingPanel = document.getElementById('bookingPanel');
        if (clientView) clientView.style.display = 'block';
        if (bookingPanel) bookingPanel.style.display = 'none';
        document.getElementById('custName').value = '';
        document.getElementById('custEmail').value = '';
        document.getElementById('custRut').value = '';
        document.getElementById('custPhone').value = '';
        document.getElementById('custDate').value = '';
        document.getElementById('custMsg').value = '';
        document.getElementById('acceptPolicy').checked = false;
    } catch (error) {
        console.error(error);
        showToast('Error al solicitar cita', 'error');
    }
}

async function registrarConversion(psychId) {
    if (!psychId) return;
    try {
        const conversionRef = firebase.database().ref(`analytics/profesionales/${psychId}/conversiones`);
        await conversionRef.transaction((current) => (current || 0) + 1);
        const hoy = new Date().toISOString().split('T')[0];
        const diarioRef = firebase.database().ref(`analytics/profesionales/${psychId}/conversiones_diarias/${hoy}`);
        await diarioRef.transaction((current) => (current || 0) + 1);
        console.log(`✅ Conversión registrada para profesional ${psychId}`);
    } catch (error) {
        console.error('Error registrando conversión:', error);
    }
}

// ============================================
// FILTRO DE PROFESIONALES (con próxima disponibilidad)
// ============================================
export async function filterProfessionals() {
    console.log('🔄 filterProfessionals ejecutándose...');
    const staff = state.staff || [];
    const searchTerm = document.getElementById('searchFilter')?.value?.toLowerCase() || '';
    const specialtyTerm = document.getElementById('specialtyFilter')?.value || '';
    const availabilityFilter = document.getElementById('availabilityFilter')?.value || '';
    const hasAvailabilityToday = async (psych) => {
        const today = getLocalDateString(new Date());
        const boxSlots = await loadBoxSlots(today);
        const profStart = psych.startTime || '00:00';
        const profEnd = psych.endTime || '23:59';
        const now = new Date();
        const advanceMinutes = psych.advanceNotice ?? 60;
        const cutoffTime = new Date(now.getTime() + advanceMinutes * 60 * 1000);
        const unavailableSlots = psych.unavailableSlots || {};
        const anulacionesHoy = unavailableSlots[today] || [];
        if (anulacionesHoy.includes('ALL_DAY')) return false;
        return boxSlots.some(slot => {
            const slotStart = slot.timeLabel.split(' - ')[0];
            const slotDateTime = new Date(`${today}T${slotStart}:00`);
            return slot.status === 'available' &&
                   slotStart >= profStart && slotStart < profEnd &&
                   slotDateTime > cutoffTime &&
                   !anulacionesHoy.includes(slot.timeLabel);
        });
    };
    const hasAvailabilityTomorrow = async (psych) => {
        const tomorrowDate = new Date();
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrow = getLocalDateString(tomorrowDate);
        const boxSlots = await loadBoxSlots(tomorrow);
        const profStart = psych.startTime || '00:00';
        const profEnd = psych.endTime || '23:59';
        const unavailableSlots = psych.unavailableSlots || {};
        const anulacionesManana = unavailableSlots[tomorrow] || [];
        if (anulacionesManana.includes('ALL_DAY')) return false;
        return boxSlots.some(slot => {
            const slotStart = slot.timeLabel.split(' - ')[0];
            return slot.status === 'available' &&
                   slotStart >= profStart && slotStart < profEnd &&
                   !anulacionesManana.includes(slot.timeLabel);
        });
    };
    let filtered = [];
    for (const p of getPublicStaff()) {
        if (!p) continue;
        const name = p.name || '';
        const specs = p.spec ? (Array.isArray(p.spec) ? p.spec : [p.spec]) : [];
        const specsText = specs.join(' ').toLowerCase();
        const matchesSearch = name.toLowerCase().includes(searchTerm) || specsText.includes(searchTerm);
        let matchesSpecialty = true;
        if (specialtyTerm) matchesSpecialty = specs.some(s => s && s.toLowerCase().includes(specialtyTerm.toLowerCase()));
        let matchesAvailability = true;
        if (availabilityFilter === 'available' || availabilityFilter === 'today') matchesAvailability = await hasAvailabilityToday(p);
        else if (availabilityFilter === 'tomorrow') matchesAvailability = await hasAvailabilityTomorrow(p);
        if (matchesSearch && matchesSpecialty && matchesAvailability) filtered.push(p);
    }
    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    renderProfessionals(filtered);
}

// ============================================
// RENDERIZADO DE PROFESIONALES (con próxima disponibilidad)
// ============================================
export async function renderProfessionals(professionals) {
    const grid = document.getElementById('equipo');
    if (!grid) { console.error('❌ Grid no encontrado'); return; }
    if (!grid.classList.contains('grid')) grid.classList.add('grid');
    if (!professionals || professionals.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:60px; background:white; border-radius:20px;"><i class="fa fa-user-md" style="font-size:48px; color:#ccc;"></i><p style="margin-top:20px; color:#666;">No se encontraron profesionales</p></div>';
        return;
    }
    const today = getLocalDateString(new Date());
    const professionalsEnriched = await Promise.all(professionals.map(async (p) => {
        const disponiblesHoy = await getAvailableSlotsCountForToday(p);
        let proximaFecha = null;
        if (disponiblesHoy === 0) {
            proximaFecha = await getNextAvailableDate(p, 30);
        }
        return { ...p, disponiblesHoy, proximaFecha };
    }));
    grid.innerHTML = professionalsEnriched.map(p => {
        let disponibilidadTexto = '';
        if (p.disponiblesHoy > 0) {
            disponibilidadTexto = `${p.disponiblesHoy} disponible(s) hoy`;
        } else if (p.proximaFecha) {
            const [year, month, day] = p.proximaFecha.split('-');
            const fechaFormateada = `${day}/${month}/${year}`;
            disponibilidadTexto = `Próxima: ${fechaFormateada}`;
        } else {
            disponibilidadTexto = 'Sin disponibilidad próxima';
        }
        const rating = getAverageRating(p.id);
        const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
        const totalReseñas = (state.messages || []).filter(m => m && m.therapistId == p.id).length;
        const name = p.name || 'Profesional';
        const title = p.title || (p.genero === 'M' ? 'Psicólogo' : p.genero === 'F' ? 'Psicóloga' : 'Psicólogo/a');
        const img = p.img || p.photoURL || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500';
        const address = p.address || 'Dirección no especificada';
        const specs = p.spec ? (Array.isArray(p.spec) ? p.spec : [p.spec]) : [];
        const specialtiesHtml = specs.length ? `<div class="specialties">${specs.map(s => `<span class="specialty-tag">${s}</span>`).join('')}</div>` : '';
        const whatsappBadge = p.whatsapp ? `<a href="https://wa.me/${p.whatsapp.replace(/\+/g, '')}" target="_blank" class="whatsapp-badge"><i class="fab fa-whatsapp"></i></a>` : '';
        const instagramBadge = p.instagram ? `<a href="https://instagram.com/${p.instagram.replace('@', '')}" target="_blank" class="instagram-badge"><i class="fab fa-instagram"></i></a>` : '';
        return `
            <div class="professional-card therapist-card" data-id="${p.id}">
                ${whatsappBadge}
                ${instagramBadge}
                <div class="img-container"><img src="${img}" alt="${name}" loading="lazy"></div>
                <div class="card-body">
                    <h3>${name}</h3>
                    <p class="card-subtitle">${title}</p>
                    ${specialtiesHtml}
                    ${rating > 0 ? `<div class="rating"><span class="stars">${stars}</span><span class="reviews">(${totalReseñas})</span></div>` : ''}
                    <div class="card-meta">
                        <span><i class="fa fa-map-marker-alt"></i> <span class="meta-text">${address}</span></span>
                        <span><i class="fa fa-clock"></i> <span class="meta-text">${disponibilidadTexto}</span></span>
                    </div>
                    <div class="card-actions">
                        <button class="btn-mas-info" onclick="event.stopPropagation(); window.toggleInfo(this)"><i class="fa fa-chevron-down"></i> <span>Más info</span></button>
                        <button class="btn-agendar" onclick="event.stopPropagation(); openBooking('${p.id}')"><i class="fa fa-calendar-check"></i> <span>Agendar</span></button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    console.log(`✅ Renderizados ${professionals.length} profesionales con disponibilidad y próxima fecha`);
}

// ============================================
// CARGA INICIAL DE DATOS (públicos + privados)
// ============================================
export function cargarDatosIniciales() {
    console.log('🚀 Cargando datos iniciales...');
    const grid = document.getElementById('equipo');
    if (grid) grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:60px;"><div class="loader-spinner" style="margin:0 auto 20px;"></div><p style="color:#666;">Cargando profesionales...</p></div>';
    const filtros = document.querySelector('.filters');
    if (filtros) filtros.style.display = 'none';
    const promesasPublicas = [
        db.ref('staff').once('value').catch(err => { console.warn('⚠️ Error staff:', err); return null; }),
        db.ref('messages').once('value').catch(err => { console.warn('⚠️ Error messages:', err); return null; }),
        db.ref('specialties').once('value').catch(err => { console.warn('⚠️ Error specialties:', err); return null; }),
        db.ref('textosEditables').once('value').catch(err => { console.warn('⚠️ Error textosEditables:', err); return null; })
    ];
    Promise.all(promesasPublicas).then(resultados => {
        console.log('📦 Datos públicos cargados');
        const staffSnapshot = resultados[0];
        const staffData = staffSnapshot?.val();
        if (staffData) {
            const staffArray = Object.keys(staffData).map(key => {
                const item = staffData[key];
                return {
                    id: key, ...item,
                    usuario: item.usuario || item.user || '',
                    email: item.email || '',
                    spec: item.spec || ['Profesional'],
                    priceOnline: item.priceOnline || 0,
                    pricePresencial: item.pricePresencial || 0,
                    img: item.img || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500',
                    whatsapp: item.whatsapp || '',
                    instagram: item.instagram || '',
                    stars: item.stars || 5,
                    genero: item.genero || '',
                    address: item.address || '',
                    phone: item.phone || '',
                    title: item.title || '',
                    bio: item.bio || '',
                    education: item.education || '',
                    experience: item.experience || 0,
                    languages: item.languages || ['Español'],
                    clinicalExperience: item.clinicalExperience || '',
                    bankDetails: item.bankDetails || { bank: '', accountType: 'corriente', accountNumber: '', rut: '', email: '' },
                    paymentMethods: item.paymentMethods || state.globalPaymentMethods,
                    sessionDuration: item.sessionDuration || 45,
                    breakBetween: item.breakBetween || 10,
                    availability: item.availability || {},
                    startTime: item.startTime || '00:00',
                    endTime: item.endTime || '23:59',
                    unavailableSlots: item.unavailableSlots || {},
                    paymentLinks: { online: item.paymentLinks?.online || '', presencial: item.paymentLinks?.presencial || '', qrOnline: item.paymentLinks?.qrOnline || item.paymentLinks?.qrCode || '', qrPresencial: item.paymentLinks?.qrPresencial || '' }
                };
            });
            state.setStaff(staffArray);
        } else state.setStaff([]);
        const adminExists = state.staff.some(s => s.id == 9999 || s.name === 'Administrador');
        if (!adminExists) state.staff.push({ id: 9999, name: 'Administrador', spec: ['ADMIN_HIDDEN'], priceOnline: 0, pricePresencial: 0, usuario: 'Admin', pass: 'Nina2026', email: 'admin@vinculosalud.cl', img: '', whatsapp: '', instagram: '', stars: 0, genero: '', address: '', phone: '', title: '', bio: '', education: '', experience: 0, languages: ['Español'], bankDetails: {}, isHiddenAdmin: true, isAdmin: true, paymentMethods: {}, sessionDuration: 45, breakBetween: 10, availability: {}, startTime: '00:00', endTime: '23:59', unavailableSlots: {}, paymentLinks: { online: '', presencial: '', qrOnline: '', qrPresencial: '' } });
        const messagesSnapshot = resultados[1];
        if (messagesSnapshot) {
            const messagesData = messagesSnapshot.val();
            state.setMessages(messagesData ? Object.keys(messagesData).map(key => ({ id: key, ...messagesData[key] })) : []);
        } else state.setMessages([{ id: 1, name: 'Carolina Méndez', rating: 5, text: 'Excelente profesional, me ayudó mucho con mi ansiedad.', date: '2024-02-15' }, { id: 2, name: 'Roberto Campos', rating: 5, text: 'Muy buena página, encontré al especialista que necesitaba rápidamente.', date: '2024-02-16' }, { id: 3, name: 'María José', rating: 4, text: 'Muy profesional, aunque los tiempos de espera a veces son largos.', date: '2024-02-17' }]);
        const specialtiesSnapshot = resultados[2];
        if (specialtiesSnapshot) {
            const specialtiesData = specialtiesSnapshot.val();
            state.setSpecialties(specialtiesData ? Object.keys(specialtiesData).map(key => ({ id: key, name: specialtiesData[key].name })) : []);
        } else state.setSpecialties([{ id: 1, name: 'Psicología Clínica' }, { id: 2, name: 'Psiquiatría' }, { id: 3, name: 'Terapia de Pareja' }, { id: 4, name: 'Terapia Familiar' }, { id: 5, name: 'Mindfulness' }, { id: 6, name: 'Ansiedad' }, { id: 7, name: 'Depresión' }, { id: 8, name: 'Terapia Infantil' }, { id: 9, name: 'Neuropsicología' }, { id: 10, name: 'Sexología' }]);
        const textosSnapshot = resultados[3];
        if (textosSnapshot) {
            const textosData = textosSnapshot.val();
            if (textosData) {
                if (textosData.missionText) state.setMissionText(textosData.missionText);
                if (textosData.visionText) state.setVisionText(textosData.visionText);
                if (textosData.aboutTeamText) state.setAboutTeamText(textosData.aboutTeamText);
                if (textosData.aboutImage) state.setAboutImage(textosData.aboutImage);
                if (textosData.atencionTexts) state.setAtencionTexts(textosData.atencionTexts);
                if (textosData.contactInfo) state.setContactInfo(textosData.contactInfo);
                if (textosData.heroTexts) state.setHeroTexts(textosData.heroTexts);
                if (textosData.logoImage) state.setLogoImage(textosData.logoImage);
                if (textosData.backgroundImage) state.setBackgroundImage(textosData.backgroundImage);
                if (textosData.instagramData) state.setInstagramData(textosData.instagramData);
            }
        }
        state.setDataLoaded(true);
        if (state.currentUser && !datosPrivadosCargados) cargarDatosPrivados();
        setTimeout(() => { showSection('inicio'); filterProfessionals(); }, 100);
        if (state.currentUser?.role === 'admin') renderStaffTable();
    }).catch(error => { console.error(error); showToast('Error al cargar datos', 'error'); state.setDataLoaded(true); setTimeout(() => showSection('inicio'), 500); });
    db.ref('staff').on('value', (snapshot) => {
        try { const data = snapshot.val(); if (data) { const staffArray = Object.keys(data).map(key => ({ id: key, ...data[key] })); state.setStaff(staffArray); filterProfessionals(); if (state.currentUser?.role === 'admin') renderStaffTable(); } } catch(e) { console.warn(e); }
    }, (error) => console.warn(error));
    db.ref('messages').on('value', (snapshot) => {
        try { const data = snapshot.val(); state.setMessages(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []); renderMessages(); updateMarquee(); if (state.currentUser?.role === 'admin') renderMessagesTable(); } catch(e) { console.warn(e); }
    }, (error) => console.warn(error));
    db.ref('textosEditables').on('value', (snapshot) => {
        try { const data = snapshot.val(); if (data) { if (data.missionText) state.setMissionText(data.missionText); if (data.visionText) state.setVisionText(data.visionText); if (data.aboutTeamText) state.setAboutTeamText(data.aboutTeamText); if (data.aboutImage) state.setAboutImage(data.aboutImage); if (data.atencionTexts) state.setAtencionTexts(data.atencionTexts); if (data.contactInfo) state.setContactInfo(data.contactInfo); if (data.heroTexts) state.setHeroTexts(data.heroTexts); if (data.logoImage) state.setLogoImage(data.logoImage); if (data.backgroundImage) state.setBackgroundImage(data.backgroundImage); if (data.instagramData) state.setInstagramData(data.instagramData); updateAboutSection(); updateAtencionSection(); updateContactSection(); } } catch(e) { console.warn(e); }
    }, (error) => console.warn(error));
    cargarEspecialidades(); cargarMetodosPago(); cargarFondo(); cargarTextos(); cargarLogo(); cargarAboutTexts(); cargarAtencionTexts(); cargarContactInfo(); cargarInstagramData();
    setTimeout(() => { updateAboutSection(); updateAtencionSection(); updateContactSection(); }, 500);
}

// ============================================
// DATOS PRIVADOS Y LISTENERS
// ============================================
export function cargarDatosPrivados() {
    if (datosPrivadosCargados) return;
    datosPrivadosCargados = true;
    console.log('🔒 Cargando datos privados...');
    const promesasPrivadas = [
        db.ref('patients').once('value').catch(err => { console.warn('⚠️ Error patients:', err); return null; }),
        db.ref('appointments').once('value').catch(err => { console.warn('⚠️ Error appointments:', err); return null; }),
        db.ref('pendingRequests').once('value').catch(err => { console.warn('⚠️ Error pendingRequests:', err); return null; }),
        db.ref('fichasIngreso').once('value').catch(err => { console.warn('⚠️ Error fichasIngreso:', err); return null; }),
        db.ref('sesiones').once('value').catch(err => { console.warn('⚠️ Error sesiones:', err); return null; }),
        db.ref('informes').once('value').catch(err => { console.warn('⚠️ Error informes:', err); return null; })
    ];
    Promise.all(promesasPrivadas).then(resultados => {
        const patientsSnapshot = resultados[0];
        if (patientsSnapshot) { const patientsData = patientsSnapshot.val(); state.setPatients(patientsData ? Object.keys(patientsData).map(key => ({ id: key, ...patientsData[key] })) : []); } else state.setPatients([]);
        const appointmentsSnapshot = resultados[1];
        if (appointmentsSnapshot) { const appointmentsData = appointmentsSnapshot.val(); state.setAppointments(appointmentsData ? Object.keys(appointmentsData).map(key => ({ id: key, ...appointmentsData[key] })) : []); } else state.setAppointments([]);
        const pendingSnapshot = resultados[2];
        if (pendingSnapshot) { const pendingData = pendingSnapshot.val(); state.setPendingRequests(pendingData ? Object.keys(pendingData).map(key => ({ id: key, ...pendingData[key] })) : []); } else state.setPendingRequests([]);
        const fichasSnapshot = resultados[3];
        if (fichasSnapshot) { const fichasData = fichasSnapshot.val(); state.setFichasIngreso(fichasData ? Object.keys(fichasData).map(key => ({ id: key, ...fichasData[key] })) : []); } else state.setFichasIngreso([]);
        const sesionesSnapshot = resultados[4];
        if (sesionesSnapshot) { const sesionesData = sesionesSnapshot.val(); state.setSesiones(sesionesData ? Object.keys(sesionesData).map(key => ({ id: key, ...sesionesData[key] })) : []); } else state.setSesiones([]);
        const informesSnapshot = resultados[5];
        if (informesSnapshot) { const informesData = informesSnapshot.val(); state.setInformes(informesData ? Object.keys(informesData).map(key => ({ id: key, ...informesData[key] })) : []); } else state.setInformes([]);
        if (state.currentUser) {
            if (state.currentUser.role === 'admin') { if (typeof renderStaffTable === 'function') renderStaffTable(); if (typeof renderMessagesTable === 'function') renderMessagesTable(); }
            else if (state.currentUser.role === 'psych') { if (typeof renderAppointments === 'function') renderAppointments(); if (typeof renderPendingRequests === 'function') renderPendingRequests(); if (typeof renderPatients === 'function') renderPatients(); }
            if (typeof window.renderAppointmentsTable === 'function') window.renderAppointmentsTable();
            if (typeof window.updateStats === 'function') window.updateStats();
        }
        iniciarEscuchasPrivadas();
    }).catch(error => console.error('❌ Error en carga privada:', error));
}

function iniciarEscuchasPrivadas() {
    if (!state.currentUser) return;
    if (escuchasPrivadasIniciadas) return;
    escuchasPrivadasIniciadas = true;
    limpiarEscuchasPrivadas();
    activeListeners.patients = db.ref('patients').on('value', (snapshot) => { try { const data = snapshot.val(); state.setPatients(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []); if (state.currentUser) renderPatients(); } catch(e) { console.warn(e); } }, (error) => console.warn(error));
    activeListeners.appointments = db.ref('appointments').on('value', (snapshot) => { try { const data = snapshot.val(); if (data) { const newApps = Object.keys(data).map(key => ({ id: key, ...data[key] })); state.setAppointments(newApps); if (state.currentUser) { if (typeof window.updateStats === 'function') window.updateStats(); renderPendingRequests(); renderAppointments(); if (typeof window.renderAppointmentsTable === 'function') window.renderAppointmentsTable(); } } else state.setAppointments([]); } catch(e) { console.warn(e); } }, (error) => console.warn(error));
    activeListeners.pendingRequests = db.ref('pendingRequests').on('value', (snapshot) => { try { const data = snapshot.val(); state.setPendingRequests(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []); if (state.currentUser) renderPendingRequests(); } catch(e) { console.warn(e); } }, (error) => console.warn(error));
    activeListeners.fichasIngreso = db.ref('fichasIngreso').on('value', (snapshot) => { try { const data = snapshot.val(); state.setFichasIngreso(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []); } catch(e) { console.warn(e); } }, (error) => console.warn(error));
    // No listener para sesiones
    activeListeners.informes = db.ref('informes').on('value', (snapshot) => { try { const data = snapshot.val(); state.setInformes(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []); } catch(e) { console.warn(e); } }, (error) => console.warn(error));
}

export function limpiarEscuchasPrivadas() {
    if (activeListeners.patients) db.ref('patients').off('value', activeListeners.patients);
    if (activeListeners.appointments) db.ref('appointments').off('value', activeListeners.appointments);
    if (activeListeners.pendingRequests) db.ref('pendingRequests').off('value', activeListeners.pendingRequests);
    if (activeListeners.fichasIngreso) db.ref('fichasIngreso').off('value', activeListeners.fichasIngreso);
    if (activeListeners.sesiones) db.ref('sesiones').off('value', activeListeners.sesiones);
    if (activeListeners.informes) db.ref('informes').off('value', activeListeners.informes);
    activeListeners = { patients: null, appointments: null, pendingRequests: null, fichasIngreso: null, sesiones: null, informes: null };
    escuchasPrivadasIniciadas = false;
    datosPrivadosCargados = false;
}

export function actualizarTodasLasSecciones() { updateAboutSection(); updateAtencionSection(); updateContactSection(); if (typeof filterProfessionals === 'function') filterProfessionals(); }
export function forzarCargaDatos() { if (!window.state?.dataLoaded) cargarDatosIniciales(); }

if (typeof window !== 'undefined') {
    window.showSection = showSection;
    window.abrirAgenda = abrirAgenda;
    window.enviarContacto = enviarContacto;
    window.compartirPerfil = compartirPerfil;
    window.copiarAlPortapapeles = copiarAlPortapapeles;
    window.showTherapistInfo = showTherapistInfo;
    window.toggleInfo = window.toggleInfo;
    window.filterProfessionals = filterProfessionals;
    window.forzarCargaDatos = forzarCargaDatos;
    window.forceRenderProfessionals = () => filterProfessionals();
    window.actualizarTodasLasSecciones = actualizarTodasLasSecciones;
    window.openBooking = openBooking;
    window.registrarVisitaProfesional = registrarVisitaProfesional;
}
console.log('✅ publico.js corregido: integración completa con Box, anulaciones personales, control de warning y próxima disponibilidad');