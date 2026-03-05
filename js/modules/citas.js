// js/modules/citas.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast, validarRut, sendEmailNotification, formatDate } from './utils.js';

// ============================================
// VARIABLE GLOBAL PARA HORA SELECCIONADA
// ============================================
window.horaSeleccionada = null;

// ============================================
// FUNCIÓN PARA SELECCIONAR HORARIO
// ============================================
if (typeof window !== 'undefined') {
    window.selectTimeSlot = function(time) {
        console.log('🎯 [SELECT] Seleccionando horario:', time);
        window.horaSeleccionada = time;
        
        document.querySelectorAll('.time-slot-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        const btn = document.querySelector(`.time-slot-btn[data-time="${time}"]`);
        if (btn) btn.classList.add('selected');
        
        const select = document.getElementById('custTime');
        if (select) {
            select.value = time;
            select.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        if (typeof window.updateBookingDetails === 'function') {
            window.updateBookingDetails();
        }
        
        return true;
    };
    
    window.selectTimePref = function(pref) {
        console.log('📅 [PREF] Preferencia seleccionada:', pref);
        const panel = document.getElementById('bookingPanel');
        if (panel) panel.dataset.timePref = pref;
        if (pref && window.showToast) {
            window.showToast(`Preferencia: ${pref === 'AM' ? 'Mañana' : 'Tarde'}`, 'info');
        }
    };
}

// ============================================
// FUNCIÓN AUXILIAR
// ============================================
function getTimePeriod(time) {
    const hour = parseInt(time.split(':')[0]);
    return hour < 12 ? 'AM' : 'PM';
}

// ============================================
// FUNCIÓN PARA CALCULAR EDAD
// ============================================
function calcularEdadDesdeFecha(birthdate) {
    if (!birthdate) return 0;
    
    const hoy = new Date();
    const nacimiento = new Date(birthdate);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    
    return edad;
}

window.calcularEdad = function() {
    const birthdate = document.getElementById('custBirthdate')?.value;
    const edadDisplay = document.getElementById('edadDisplay');
    const tutorSection = document.getElementById('tutorSection');
    
    if (!birthdate) {
        if (edadDisplay) edadDisplay.innerHTML = '';
        if (tutorSection) tutorSection.style.display = 'none';
        return;
    }
    
    const hoy = new Date();
    const nacimiento = new Date(birthdate);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    
    if (edadDisplay) {
        edadDisplay.innerHTML = `<strong>Edad:</strong> ${edad} años`;
    }
    
    if (tutorSection) {
        if (edad < 18) {
            tutorSection.style.display = 'block';
            const tutorName = document.getElementById('tutorName');
            const tutorRut = document.getElementById('tutorRut');
            const tutorRelationship = document.getElementById('tutorRelationship');
            
            if (tutorName) tutorName.required = true;
            if (tutorRut) tutorRut.required = true;
            if (tutorRelationship) tutorRelationship.required = true;
        } else {
            tutorSection.style.display = 'none';
            const tutorName = document.getElementById('tutorName');
            const tutorRut = document.getElementById('tutorRut');
            const tutorRelationship = document.getElementById('tutorRelationship');
            
            if (tutorName) tutorName.required = false;
            if (tutorRut) tutorRut.required = false;
            if (tutorRelationship) tutorRelationship.required = false;
        }
    }
    
    return edad;
};

// ============================================
// FUNCIONES EXPORTADAS
// ============================================

export function openBooking(id) {
    console.log("🔍 Abriendo reserva para ID:", id);
    
    const psych = state.staff.find(p => p.id == id);
    if (!psych) {
        showToast('Profesional no encontrado', 'error');
        return;
    }
    
    state.setSelectedPsych(psych);
    state.setSelectedBoxId(null);

    const today = new Date().toISOString().split('T')[0];
    
    document.getElementById('clientView').style.display = 'none';
    document.getElementById('bookingPanel').style.display = 'block';
    
    document.getElementById('psychName').innerText = psych.name;
    document.getElementById('psychSelectedName').innerText = psych.name;
    document.getElementById('psychSelectedSpec').innerText = Array.isArray(psych.spec) ? psych.spec.join(' · ') : psych.spec;
    document.getElementById('custDate').min = today;
    document.getElementById('custDate').value = today;
    document.getElementById('bookingDuration').innerText = (psych.sessionDuration || 45) + ' minutos';
    
    // Limpiar campos de edad y tutor
    const birthdate = document.getElementById('custBirthdate');
    if (birthdate) birthdate.value = '';
    
    const edadDisplay = document.getElementById('edadDisplay');
    if (edadDisplay) edadDisplay.innerHTML = '';
    
    const tutorSection = document.getElementById('tutorSection');
    if (tutorSection) tutorSection.style.display = 'none';
    
    const tutorName = document.getElementById('tutorName');
    const tutorRut = document.getElementById('tutorRut');
    const tutorRelationship = document.getElementById('tutorRelationship');
    
    if (tutorName) {
        tutorName.value = '';
        tutorName.required = false;
    }
    if (tutorRut) {
        tutorRut.value = '';
        tutorRut.required = false;
    }
    if (tutorRelationship) {
        tutorRelationship.value = '';
        tutorRelationship.required = false;
    }
    
    loadPaymentMethods();
    
    document.getElementById('paymentDetails').style.display = 'none';
    document.getElementById('paymentLinkContainer').style.display = 'none';
    
    updateBookingDetails();
    document.getElementById('emailSimulation').style.display = 'none';
    updateAvailableTimes();
}

function loadPaymentMethods() {
    const select = document.getElementById('paymentMethod');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecciona método de pago</option>';
    const methods = state.selectedPsych.paymentMethods || state.globalPaymentMethods;

    if (methods.transfer) select.innerHTML += '<option value="transfer">Transferencia Bancaria</option>';
    if (methods.cardPresencial) select.innerHTML += '<option value="card-presencial">Tarjeta (en consulta)</option>';
    if (methods.cash) select.innerHTML += '<option value="cash">Efectivo (en consulta)</option>';
    if (methods.cardOnline) select.innerHTML += '<option value="card-online">Tarjeta Online</option>';
    if (methods.mercadopago) select.innerHTML += '<option value="mercadopago">Mercado Pago</option>';
    if (methods.webpay) select.innerHTML += '<option value="webpay">Webpay</option>';
}

export function showPaymentDetails() {
    const method = document.getElementById('paymentMethod')?.value;
    const detailsDiv = document.getElementById('paymentDetails');
    const linkContainer = document.getElementById('paymentLinkContainer');
    
    if (detailsDiv) detailsDiv.style.display = 'none';
    if (linkContainer) linkContainer.style.display = 'none';
    
    if (!method) return;
    
    if (method === 'transfer' && state.selectedPsych.bankDetails) {
        const bank = state.selectedPsych.bankDetails;
        detailsDiv.style.display = 'block';
        detailsDiv.innerHTML = `
            <h4 style="margin-bottom:10px;">Datos para Transferencia</h4>
            <p><strong>Banco:</strong> ${bank.bank || 'No especificado'}</p>
            <p><strong>Cuenta:</strong> ${bank.accountType || ''} ${bank.accountNumber || ''}</p>
            <p><strong>RUT:</strong> ${bank.rut || ''}</p>
            <p><strong>Email:</strong> ${bank.email || ''}</p>
            <p style="font-size:0.8rem; margin-top:10px; background:#fff3cd; padding:10px; border-radius:8px;">
                💡 Realiza la transferencia. El profesional confirmará el pago.
            </p>
        `;
    }
    
    if (method === 'card-presencial' || method === 'cash') {
        detailsDiv.style.display = 'block';
        detailsDiv.innerHTML = `
            <div style="background: #e8f4fd; padding: 15px; border-radius: 8px;">
                <p>El pago se realizará en el consultorio.</p>
            </div>
        `;
    }
    
    if (method === 'card-online' || method === 'mercadopago' || method === 'webpay') {
        const paymentLinks = state.selectedPsych.paymentLinks || {};
        const link = method === 'card-online' ? paymentLinks.online : 
                    method === 'mercadopago' ? paymentLinks.mercadopago || paymentLinks.online :
                    paymentLinks.webpay || paymentLinks.online;
        
        if (link) {
            linkContainer.style.display = 'block';
            linkContainer.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">
                    <h4 style="margin-bottom:15px;">💳 Pago Online</h4>
                    <a href="${link}" target="_blank" class="btn-staff" style="background:var(--exito); color:white; padding:12px 30px; border-radius:30px; text-decoration:none;">
                        <i class="fa fa-credit-card"></i> Ir a pagar
                    </a>
                    <p style="font-size:0.8rem;">Vuelve a esta página después del pago</p>
                </div>
            `;
        }
    }
}

// ============================================
// FUNCIÓN PRINCIPAL DE HORARIOS
// ============================================

export function updateAvailableTimes() {
    const date = document.getElementById('custDate').value;
    const type = document.getElementById('appointmentType').value;
    const amContainer = document.getElementById('amSlots');
    const pmContainer = document.getElementById('pmSlots');
    const amSlotsContainer = document.getElementById('amSlotsContainer');
    const pmSlotsContainer = document.getElementById('pmSlotsContainer');
    const timeSelect = document.getElementById('custTime');
    const onlineMsg = document.getElementById('onlineAvailabilityMsg');
    const presencialWarning = document.getElementById('presencialWarning');
    const noSlotsMessage = document.getElementById('noSlotsMessage');

    if (!date || !state.selectedPsych) return;

    if (amContainer) amContainer.style.display = 'none';
    if (pmContainer) pmContainer.style.display = 'none';
    if (timeSelect) timeSelect.style.display = 'none';
    if (noSlotsMessage) noSlotsMessage.style.display = 'none';

    if (type === 'presencial') {
        if (presencialWarning) {
            presencialWarning.style.display = 'block';
            presencialWarning.innerHTML = `
                <i class="fa fa-info-circle"></i> 
                <strong>Solicitud Presencial:</strong> El profesional confirmará la hora.
                <div style="margin-top:15px;">
                    <label>Preferencia de horario (opcional):</label>
                    <div style="display:flex; gap:15px;">
                        <label><input type="radio" name="presencialTimePref" value="AM" onchange="selectTimePref('AM')"> Mañana</label>
                        <label><input type="radio" name="presencialTimePref" value="PM" onchange="selectTimePref('PM')"> Tarde</label>
                        <label><input type="radio" name="presencialTimePref" value="" checked> Sin preferencia</label>
                    </div>
                </div>
            `;
        }
        if (onlineMsg) onlineMsg.style.display = 'none';
        return;
    }

    if (presencialWarning) presencialWarning.style.display = 'none';
    
    const availableSlots = state.selectedPsych.availability?.[date] || [];

    if (availableSlots.length === 0) {
        if (noSlotsMessage) {
            noSlotsMessage.style.display = 'block';
            noSlotsMessage.innerHTML = 'No hay horarios disponibles';
        }
        if (onlineMsg) onlineMsg.style.display = 'none';
        return;
    }

    // Obtener TODAS las ocupaciones
    const bookedAppointments = state.appointments
        .filter(a => a.psychId == state.selectedPsych.id && a.date === date && 
                (a.status === 'confirmada' || a.status === 'pendiente'))
        .map(a => a.time);
    
    const bookedRequests = state.pendingRequests
        .filter(r => r.psychId == state.selectedPsych.id && r.date === date && r.time && r.time !== 'Pendiente')
        .map(r => r.time);
    
    const bookedTimes = [...new Set([...bookedAppointments, ...bookedRequests])];

    const now = new Date();
    const availableTimes = availableSlots
        .filter(slot => !bookedTimes.includes(slot.time))
        .filter(slot => new Date(date + 'T' + slot.time) > now)
        .sort((a, b) => a.time.localeCompare(b.time));

    if (availableTimes.length === 0) {
        if (noSlotsMessage) {
            noSlotsMessage.style.display = 'block';
            noSlotsMessage.innerHTML = 'No hay horarios disponibles';
        }
        if (onlineMsg) onlineMsg.style.display = 'none';
        
        const selectedSlot = document.querySelector('.time-slot-btn.selected');
        if (selectedSlot) selectedSlot.classList.remove('selected');
        if (timeSelect) timeSelect.value = '';
        window.horaSeleccionada = null;
        return;
    }

    const amTimes = availableTimes.filter(slot => getTimePeriod(slot.time) === 'AM');
    const pmTimes = availableTimes.filter(slot => getTimePeriod(slot.time) === 'PM');

    if (amTimes.length > 0 && amSlotsContainer) {
        amSlotsContainer.innerHTML = amTimes.map(slot => `
            <div class="time-slot-btn ${slot.isOvercupo ? 'overcupo' : ''}" 
                 onclick="selectTimeSlot('${slot.time}')"
                 data-time="${slot.time}">
                ${slot.time}
            </div>
        `).join('');
        amContainer.style.display = 'block';
    }

    if (pmTimes.length > 0 && pmSlotsContainer) {
        pmSlotsContainer.innerHTML = pmTimes.map(slot => `
            <div class="time-slot-btn ${slot.isOvercupo ? 'overcupo' : ''}" 
                 onclick="selectTimeSlot('${slot.time}')"
                 data-time="${slot.time}">
                ${slot.time}
            </div>
        `).join('');
        pmContainer.style.display = 'block';
    }

    if (onlineMsg) {
        onlineMsg.style.display = 'block';
        onlineMsg.innerHTML = '<i class="fa fa-check-circle"></i> Horarios disponibles';
    }

    const currentSelectedTime = timeSelect ? timeSelect.value : '';
    
    if (!currentSelectedTime && window.horaSeleccionada) {
        const horaValida = availableTimes.some(slot => slot.time === window.horaSeleccionada);
        if (horaValida) {
            if (timeSelect) timeSelect.value = window.horaSeleccionada;
            const btn = document.querySelector(`.time-slot-btn[data-time="${window.horaSeleccionada}"]`);
            if (btn) btn.classList.add('selected');
        }
    }
}

export function updateBookingDetails() {
    const type = document.getElementById('appointmentType').value;
    const price = type === 'online' ? state.selectedPsych.priceOnline : state.selectedPsych.pricePresencial;

    document.getElementById('bookingPrice').innerText = `$${price.toLocaleString()}`;
    document.getElementById('bookingType').innerText = type === 'online' ? 'Online' : 'Presencial';
    
    document.getElementById('paymentDetails').style.display = 'none';
    document.getElementById('paymentLinkContainer').style.display = 'none';
    
    updateAvailableTimes();
}

export function searchPatientByRutBooking() {
    const rut = document.getElementById('custRut').value;
    if (!rut) return;

    console.log('🔍 Buscando paciente con RUT:', rut);
    console.log('📋 Total pacientes:', state.patients.length);
    
    const patient = state.patients.find(p => p.rut === rut);
    if (patient) {
        console.log('✅ Paciente encontrado:', patient.name);
        document.getElementById('custName').value = patient.name || '';
        document.getElementById('custEmail').value = patient.email || '';
        
        // Cargar fecha de nacimiento si existe
        const birthdate = document.getElementById('custBirthdate');
        if (birthdate && patient.birthdate) {
            birthdate.value = patient.birthdate;
            if (typeof window.calcularEdad === 'function') {
                window.calcularEdad();
            }
        }
        
        const phoneParts = patient.phone ? patient.phone.split(' ') : ['+56', '9', ''];
        const countryCode = document.getElementById('countryCode');
        const phoneNine = document.getElementById('phoneNine');
        const custPhone = document.getElementById('custPhone');
        
        if (countryCode) countryCode.value = phoneParts[0] || '+56';
        if (phoneNine) phoneNine.value = phoneParts[1] || '9';
        if (custPhone) custPhone.value = phoneParts[2] || '';
        
        showToast('Datos cargados', 'success');
        showPaymentDetails();
    }
}

// ============================================
// FUNCIÓN checkOnlineAvailability
// ============================================
export function checkOnlineAvailability() {
    const date = document.getElementById('custDate').value;
    const time = document.getElementById('custTime').value;
    const type = document.getElementById('appointmentType').value;
    
    if (type === 'online' && date && time) {
        return new Date(date + 'T' + time) > new Date();
    }
    return true;
}

// ============================================
// FUNCIONES DE PAGOS
// ============================================

export function confirmPayment(appointmentId) {
    console.log('💰 Confirmando pago para:', appointmentId);
    
    const appointment = state.appointments.find(a => a.id == appointmentId) || 
                       state.pendingRequests.find(p => p.id == appointmentId);
    
    if (!appointment) {
        showToast('Cita no encontrada', 'error');
        return;
    }
    
    if (state.currentUser?.role !== 'admin' && state.currentUser?.data?.id != appointment.psychId) {
        showToast('No tienes permiso', 'error');
        return;
    }
    
    appointment.paymentStatus = 'pagado';
    appointment.paymentConfirmedBy = state.currentUser?.data?.name || 'Admin';
    
    if (appointment.status === 'pendiente' && appointment.type === 'online') {
        appointment.status = 'confirmada';
    }
    
    import('../main.js').then(main => {
        main.save();
        showToast('✅ Pago confirmado', 'success');
        
        if (typeof window.updateStats === 'function') window.updateStats();
        renderPendingRequests();
        renderAppointments();
    });
    
    // Enviar email al PACIENTE (nunca al psicólogo)
    if (appointment.patientEmail && !appointment.emailPagoEnviado) {
        // Verificar que NO sea email de profesional
        const esEmailProfesional = state.staff.some(p => p.email === appointment.patientEmail);
        
        if (!esEmailProfesional) {
            setTimeout(() => {
                sendEmailNotification(
                    appointment.patientEmail, // ✅ SIEMPRE al paciente
                    'Pago confirmado - Vínculo Salud',
                    `Hola ${appointment.patient},\n\nTu pago ha sido confirmado.`,
                    'pago_confirmado',
                    appointment.patient,
                    appointment
                ).then(success => {
                    if (success) appointment.emailPagoEnviado = true;
                });
            }, 100);
        } else {
            console.error('❌ ERROR: Intento de enviar email de pago a profesional:', appointment.patientEmail);
        }
    }
}

export function rejectPayment(appointmentId) {
    console.log('❌ Rechazando pago para:', appointmentId);
    
    const appointment = state.appointments.find(a => a.id == appointmentId) || 
                       state.pendingRequests.find(p => p.id == appointmentId);
    
    if (!appointment) return;
    
    if (!confirm('¿Rechazar este pago?')) return;
    
    appointment.paymentStatus = 'rechazado';
    appointment.status = 'cancelada';
    
    import('../main.js').then(main => main.save());
    showToast('✅ Pago rechazado', 'success');
    
    // Enviar email al PACIENTE (nunca al psicólogo)
    if (appointment.patientEmail && !appointment.emailRechazoEnviado) {
        const esEmailProfesional = state.staff.some(p => p.email === appointment.patientEmail);
        
        if (!esEmailProfesional) {
            setTimeout(() => {
                sendEmailNotification(
                    appointment.patientEmail, // ✅ SIEMPRE al paciente
                    'Pago no confirmado - Vínculo Salud',
                    `Hola ${appointment.patient},\n\nEl pago no pudo ser confirmado.`,
                    'pago_rechazado',
                    appointment.patient,
                    appointment
                ).then(success => {
                    if (success) appointment.emailRechazoEnviado = true;
                });
            }, 100);
        }
    }
}

export function confirmPresencialTime(requestId, date, time) {
    const request = state.pendingRequests.find(r => r.id == requestId);
    if (!request) return;
    
    const appointment = {
        id: Date.now(),
        patientId: request.patientId,
        patient: request.patient,
        patientRut: request.patientRut,
        patientEmail: request.patientEmail,
        patientPhone: request.patientPhone,
        psych: request.psych,
        psychId: request.psychId,
        date: date,
        time: time,
        type: 'presencial',
        boxId: null,
        boxName: null,
        price: request.price || 0,
        paymentMethod: request.paymentMethod,
        paymentStatus: request.paymentStatus || 'pendiente',
        msg: request.msg,
        status: 'confirmada',
        createdAt: new Date().toISOString(),
        confirmedBy: state.currentUser?.data?.name,
        emailConfirmacionEnviado: false
    };
    
    state.appointments.push(appointment);
    state.setPendingRequests(state.pendingRequests.filter(r => r.id != requestId));
    
    import('../main.js').then(main => main.save());
    showToast('✅ Cita confirmada', 'success');
    
    // Enviar email al PACIENTE (nunca al psicólogo)
    if (request.patientEmail && !appointment.emailConfirmacionEnviado) {
        const esEmailProfesional = state.staff.some(p => p.email === request.patientEmail);
        
        if (!esEmailProfesional) {
            setTimeout(() => {
                sendEmailNotification(
                    request.patientEmail, // ✅ SIEMPRE al paciente
                    'Cita confirmada - Vínculo Salud',
                    `Hola ${request.patient},\n\nTu cita ha sido confirmada.`,
                    'cita_confirmada',
                    request.patient,
                    appointment
                ).then(success => {
                    if (success) appointment.emailConfirmacionEnviado = true;
                });
            }, 100);
        }
    }
}

// ============================================
// FUNCIÓN EXECUTEBOOKING - VERSIÓN CORREGIDA CON VALIDACIÓN ABSOLUTA DE EMAIL
// ============================================

let bookingEnProceso = false;
let emailsEnviados = new Set(); // Para evitar duplicados

// 🚨 LISTA NEGRA DE EMAILS PROHIBIDOS (todos los profesionales)
function obtenerEmailsProfesionales() {
    return state.staff
        .map(p => p.email)
        .filter(email => email && email.trim() !== '');
}

// 🚨 VALIDACIÓN ABSOLUTA: El email NO puede ser de ningún profesional
function esEmailProfesional(email) {
    if (!email) return false;
    
    const emailsProfesionales = obtenerEmailsProfesionales();
    const emailLimpio = email.trim().toLowerCase();
    
    // Verificar contra lista de profesionales
    const esProfesional = emailsProfesionales.some(profEmail => 
        profEmail && profEmail.trim().toLowerCase() === emailLimpio
    );
    
    if (esProfesional) {
        console.error('🚫 EMAIL PROHIBIDO DETECTADO:', email);
        console.error('📋 Lista de emails profesionales:', emailsProfesionales);
    }
    
    return esProfesional;
}

export function executeBooking() {
    if (bookingEnProceso) {
        console.log('⏳ Reserva ya en proceso');
        return;
    }
    
    bookingEnProceso = true;
    
    const rut = document.getElementById('custRut').value;
    const name = document.getElementById('custName').value;
    const email = document.getElementById('custEmail').value;
    const birthdate = document.getElementById('custBirthdate')?.value || '';
    
    // ============================================
    // 🚨 VALIDACIÓN ABSOLUTA #1: El email NO puede ser de ningún profesional
    // ============================================
    if (esEmailProfesional(email)) {
        showToast('❌ ERROR: El email ingresado pertenece a un profesional. Debe ser el email del paciente.', 'error');
        console.error('🚫 BLOQUEADO: Intento de reserva con email profesional:', email);
        bookingEnProceso = false;
        return;
    }
    
    // Validación específica con el psicólogo seleccionado (por si acaso)
    if (state.selectedPsych && email === state.selectedPsych.email) {
        showToast('❌ ERROR: No puedes usar el email del profesional. Usa el email del paciente.', 'error');
        console.error('🚫 BLOQUEADO: Email igual al psicólogo seleccionado:', email);
        bookingEnProceso = false;
        return;
    }
    
    // Obtener datos del tutor si existen
    const tutorSection = document.getElementById('tutorSection');
    let tutorData = null;
    
    if (tutorSection && tutorSection.style.display === 'block') {
        const tutorName = document.getElementById('tutorName')?.value;
        const tutorRut = document.getElementById('tutorRut')?.value;
        const tutorRelationship = document.getElementById('tutorRelationship')?.value;
        
        if (tutorName && tutorRut && tutorRelationship) {
            tutorData = {
                nombre: tutorName,
                rut: tutorRut,
                parentesco: tutorRelationship
            };
        }
    }
    
    const countryCode = document.getElementById('countryCode')?.value || '+56';
    const phoneNine = document.getElementById('phoneNine')?.value || '9';
    const phoneNumber = document.getElementById('custPhone')?.value || '';
    const phone = countryCode + ' ' + phoneNine + ' ' + phoneNumber;
    
    const date = document.getElementById('custDate').value;
    const type = document.getElementById('appointmentType').value;
    const paymentMethod = document.getElementById('paymentMethod')?.value;
    const msg = document.getElementById('custMsg').value;
    const acceptPolicy = document.getElementById('acceptPolicy').checked;

    if (!rut || !name || !email || !date) {
        showToast('Completa todos los campos', 'error');
        bookingEnProceso = false;
        return;
    }

    if (!validarRut(rut)) {
        showToast('RUT inválido', 'error');
        bookingEnProceso = false;
        return;
    }

    if (!paymentMethod) {
        showToast('Selecciona método de pago', 'error');
        bookingEnProceso = false;
        return;
    }

    if (!acceptPolicy) {
        showToast('Debes aceptar la política', 'error');
        bookingEnProceso = false;
        return;
    }

    // Validar tutor si es menor de edad
    if (birthdate) {
        const edad = calcularEdadDesdeFecha(birthdate);
        if (edad < 18 && !tutorData) {
            showToast('Debes completar datos del tutor para menores de edad', 'error');
            bookingEnProceso = false;
            return;
        }
    }

    let time = '';
    
    if (window.horaSeleccionada) {
        time = window.horaSeleccionada;
    }
    
    if (!time) {
        const timeSelect = document.getElementById('custTime');
        time = timeSelect ? timeSelect.value : '';
    }
    
    if (!time) {
        const selectedBtn = document.querySelector('.time-slot-btn.selected');
        if (selectedBtn && selectedBtn.dataset.time) {
            time = selectedBtn.dataset.time;
            const timeSelect = document.getElementById('custTime');
            if (timeSelect) timeSelect.value = time;
            window.horaSeleccionada = time;
        }
    }

    if (type === 'online' && !time) {
        showToast('Selecciona un horario', 'error');
        bookingEnProceso = false;
        return;
    }

    let horaFinal = time || 'Pendiente';
    
    let preferenciaAMPM = null;
    if (type === 'presencial') {
        const prefRadios = document.getElementsByName('presencialTimePref');
        for (const radio of prefRadios) {
            if (radio.checked && radio.value) {
                preferenciaAMPM = radio.value;
                break;
            }
        }
    }

    const bookBtn = document.getElementById('bookBtn');
    const originalText = bookBtn.innerHTML;
    bookBtn.innerHTML = '<span class="spinner"></span> Procesando...';
    bookBtn.disabled = true;

    setTimeout(async () => {
        try {
            // BUSCAR O CREAR PACIENTE - VERSIÓN CORREGIDA
            let patient = state.patients.find(p => p.rut === rut);
            
            if (!patient) {
                // Calcular edad si hay fecha de nacimiento
                const edad = birthdate ? calcularEdadDesdeFecha(birthdate) : 0;
                
                // Crear nuevo paciente CON TODOS LOS DATOS
                patient = {
                    id: Date.now(),
                    rut,
                    name,
                    email, // ✅ Este es el email del paciente (ya validado)
                    phone,
                    birthdate: birthdate,
                    edad: edad,
                    tutor: (edad < 18 && tutorData) ? tutorData : null,
                    notes: msg || '',
                    // 🔥 ASIGNAR AUTOMÁTICAMENTE AL PSICÓLOGO DE LA RESERVA
                    psychId: state.selectedPsych.id,
                    createdAt: new Date().toISOString(),
                    appointments: []
                };
                
                // Agregar a state.patients
                state.patients.push(patient);
                console.log('🆕 NUEVO PACIENTE CREADO:', patient);
                
                // 💾 ¡GUARDAR INMEDIATAMENTE EN FIREBASE!
                try {
                    await import('../main.js').then(main => main.save());
                    console.log('💾✅ Paciente guardado en Firebase');
                } catch (saveError) {
                    console.error('❌ Error guardando paciente:', saveError);
                }
            } else {
                console.log('✅ Paciente existente encontrado:', patient.id);
                
                // Actualizar datos del paciente existente si es necesario
                let datosActualizados = false;
                
                if (!patient.birthdate && birthdate) {
                    patient.birthdate = birthdate;
                    patient.edad = calcularEdadDesdeFecha(birthdate);
                    datosActualizados = true;
                }
                
                if (!patient.tutor && tutorData && patient.edad < 18) {
                    patient.tutor = tutorData;
                    datosActualizados = true;
                }
                
                // Si no tiene psychId asignado, asignarlo ahora
                if (!patient.psychId && state.selectedPsych) {
                    patient.psychId = state.selectedPsych.id;
                    datosActualizados = true;
                    console.log('📌 PsychId asignado a paciente existente:', state.selectedPsych.id);
                }
                
                if (datosActualizados) {
                    try {
                        await import('../main.js').then(main => main.save());
                        console.log('💾✅ Paciente actualizado en Firebase');
                    } catch (saveError) {
                        console.error('❌ Error actualizando paciente:', saveError);
                    }
                }
            }

            const price = type === 'online' ? state.selectedPsych.priceOnline : state.selectedPsych.pricePresencial;

            const appointment = {
                id: Date.now(),
                patientId: patient.id,
                patient: name,
                patientRut: rut,
                patientEmail: email, // ✅ SIEMPRE el email del paciente (ya validado)
                patientPhone: phone,
                psych: state.selectedPsych.name,
                psychId: state.selectedPsych.id,
                date: date,
                time: horaFinal,
                type: type,
                boxId: null,
                boxName: null,
                price: price,
                paymentMethod: paymentMethod,
                paymentStatus: 'pendiente',
                paymentConfirmedBy: null,
                paymentConfirmedAt: null,
                msg: msg,
                status: type === 'online' ? 'pendiente' : 'pendiente',
                createdAt: new Date().toISOString(),
                emailEnviado: false,
                emailPagoEnviado: false,
                emailRechazoEnviado: false,
                emailConfirmacionEnviado: false,
                emailCancelacionEnviado: false,
                preferredTime: time || null,
                preferredAMPM: preferenciaAMPM,
                patientBirthdate: birthdate,
                patientTutor: patient.tutor
            };

            // ============================================
            // 🔥 AGREGAR AL ARRAY LOCAL
            // ============================================
            if (type === 'online') {
                state.appointments.push(appointment);
                showToast('✅ Solicitud creada', 'success');
                if (typeof updateAvailableTimes === 'function') {
                    updateAvailableTimes();
                }
            } else {
                state.pendingRequests.push(appointment);
                let mensaje = '✅ Solicitud enviada';
                if (time) mensaje += ` (Preferencia: ${time})`;
                if (preferenciaAMPM) mensaje += ` ${preferenciaAMPM}`;
                showToast(mensaje, 'success');
                if (typeof updateAvailableTimes === 'function') {
                    updateAvailableTimes();
                }
            }

            // ============================================
            // 📧 ENVIAR EMAIL AL PACIENTE (NUNCA AL PROFESIONAL)
            // ============================================
            if (email && !appointment.emailEnviado) {
                // Verificación de seguridad ULTRA ESTRICTA
                const esEmailProfesional = esEmailProfesional(email);
                
                if (esEmailProfesional) {
                    console.error('❌ ERROR CRÍTICO: Intento de enviar email a profesional:', email);
                    showToast('⚠️ El email ingresado es de un profesional. No se envió el email.', 'warning');
                } else {
                    // Verificar que no se haya enviado ya este email
                    const emailKey = `${email}_${date}_${time}`;
                    if (emailsEnviados.has(emailKey)) {
                        console.log('⏭️ Email ya enviado previamente, omitiendo');
                    } else {
                        let mensaje = `Hola ${name},\n\nHemos recibido tu solicitud de cita.\n\n` +
                            `📅 Fecha: ${date}\n` +
                            (time ? `⏰ Hora: ${time}\n` : '') +
                            `👨‍⚕️ Profesional: ${state.selectedPsych.name}\n\n` +
                            `Vínculo Salud`;

                        console.log('📧 Enviando email a PACIENTE:', email);
                        
                        const success = await sendEmailNotification(
                            email, // ✅ SIEMPRE al paciente
                            'Solicitud de cita - Vínculo Salud',
                            mensaje,
                            'solicitud_recibida',
                            name,
                            appointment
                        );
                        
                        if (success) {
                            appointment.emailEnviado = true;
                            emailsEnviados.add(emailKey);
                            console.log('✅ Email enviado correctamente a PACIENTE:', email);
                        } else {
                            console.warn('⚠️ No se pudo enviar email a:', email);
                        }
                    }
                }
            }

            // Guardar TODO en Firebase (cita + paciente actualizado)
            await import('../main.js').then(main => main.save());

            // Limpiar selección
            window.horaSeleccionada = null;
            
            // Actualizar disponibilidad nuevamente
            if (typeof updateAvailableTimes === 'function') {
                updateAvailableTimes();
            }

            bookBtn.innerHTML = originalText;
            bookBtn.disabled = false;
            bookingEnProceso = false;

            setTimeout(() => {
                if (confirm('✅ Cita agendada. ¿Volver al listado?')) {
                    document.getElementById('bookingPanel').style.display = 'none';
                    document.getElementById('clientView').style.display = 'block';
                    window.horaSeleccionada = null;
                    if (typeof window.filterProfessionals === 'function') {
                        window.filterProfessionals();
                    }
                }
            }, 2000);

        } catch (error) {
            console.error('❌ Error en executeBooking:', error);
            showToast('Error al procesar: ' + error.message, 'error');
            bookBtn.innerHTML = originalText;
            bookBtn.disabled = false;
            bookingEnProceso = false;
        }
    }, 1500);
}

// ============================================
// FUNCIONES DE RENDERIZADO
// ============================================

export function renderAppointments() {
    const tb = document.getElementById('tableBody');
    if (!tb) return;

    let appointmentsToShow = [];
    if (state.currentUser?.role === 'admin') {
        appointmentsToShow = state.appointments;
    } else if (state.currentUser?.role === 'psych') {
        appointmentsToShow = state.appointments.filter(a => a.psychId == state.currentUser.data.id);
    }

    if (appointmentsToShow.length === 0) {
        tb.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:40px;">No hay citas</td></tr>';
        return;
    }

    const sortedApps = [...appointmentsToShow].sort((a, b) => new Date(b.date) - new Date(a.date));

    tb.innerHTML = sortedApps.map(a => {
        const fechaHora = new Date(a.date + 'T' + a.time);
        const isPast = fechaHora < new Date();
        const paymentStatusColor = a.paymentStatus === 'pagado' ? 'var(--exito)' : 'var(--atencion)';
        const paymentStatusText = a.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente';
        const statusColor = isPast ? 'var(--texto-secundario)' : 'var(--exito)';
        const statusText = isPast ? 'Completada' : (a.status === 'confirmada' ? 'Confirmada' : 'Pendiente');
        
        return `
            <tr>
                <td><strong>${a.patient || '—'}</strong><br><small>${a.patientRut || ''}</small></td>
                <td>${a.psych || '—'}</td>
                <td>${a.date || '—'} <br><small>${a.time || '—'}</small></td>
                <td><span style="background:${a.type === 'online' ? 'var(--exito)' : 'var(--primario)'}; color:white; padding:4px 8px; border-radius:6px; font-size:0.7rem;">${a.type === 'online' ? 'Online' : 'Presencial'}</span></td>
                <td>${a.boxName ? `<span style="background:var(--box-color); color:white; padding:4px 8px; border-radius:6px;">${a.boxName}</span>` : '—'}</td>
                <td><span style="color:${paymentStatusColor};">${paymentStatusText}<br><small>$${(a.price || 0).toLocaleString()}</small></span></td>
                <td><span style="color:${statusColor};">${statusText}</span></td>
                <td>
                    <div style="display:flex; gap:5px;">
                        ${a.paymentStatus !== 'pagado' ? `
                            <button onclick="confirmPayment('${a.id}')" class="btn-icon" style="background:var(--exito); color:white; border:none; padding:5px 8px; border-radius:4px;" title="Confirmar pago">
                                <i class="fa fa-dollar-sign"></i>
                            </button>
                        ` : ''}
                        <button onclick="cancelAppointment('${a.id}')" class="btn-icon" style="background:var(--peligro); color:white; border:none; padding:5px 8px;" title="Cancelar cita">
                            <i class="fa fa-times"></i>
                        </button>
                    </div>
                    ${a.paymentConfirmedBy ? `<br><small style="font-size:0.6rem;">Pagado por: ${a.paymentConfirmedBy}</small>` : ''}
                    ${a.emailEnviado ? `<br><small style="color:var(--exito);">📧 Email enviado a paciente</small>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

export function renderPendingRequests() {
    const tb = document.getElementById('pendingRequestsTable');
    if (!tb) return;

    let requestsToShow = [];
    if (state.currentUser?.role === 'admin') {
        requestsToShow = state.pendingRequests;
    } else if (state.currentUser?.role === 'psych') {
        requestsToShow = state.pendingRequests.filter(r => r.psychId == state.currentUser.data.id);
    }

    if (requestsToShow.length === 0) {
        tb.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:40px;">No hay solicitudes</td></tr>';
        return;
    }

    tb.innerHTML = requestsToShow.reverse().map(r => {
        const tieneFicha = state.fichasIngreso.some(f => f.patientId == r.patientId);
        
        return `
        <tr>
            <td>${r.createdAt ? formatDate(r.createdAt) : '—'}</td>
            <td>
                <strong>${r.patient}</strong><br>
                <small>${r.patientRut}</small>
                ${tieneFicha ? '<span style="color:var(--exito); font-size:0.6rem;">📋 Ficha</span>' : ''}
                ${r.patientBirthdate ? `<br><small>🎂 ${r.patientBirthdate}</small>` : ''}
                ${r.patientTutor ? `<br><small>👤 Tutor: ${r.patientTutor.nombre}</small>` : ''}
            </td>
            <td>${r.psych}</td>
            <td>${r.date}</td>
            <td>${r.time || 'A coordinar'}</td>
            <td><span class="badge ${r.type}">${r.type === 'online' ? 'Online' : 'Presencial'}</span></td>
            <td>${r.boxName || '—'}</td>
            <td>${r.msg ? r.msg.substring(0, 30) + (r.msg.length > 30 ? '...' : '') : '—'}</td>
            <td>
                <div style="display:flex; flex-direction:column; gap:5px;">
                    <span style="font-size:0.8rem;">Pago: ${r.paymentStatus === 'pagado' ? '✅' : '⏳'}</span>
                    
                    <div style="display:flex; gap:5px;">
                        ${r.paymentStatus !== 'pagado' ? `
                            <button onclick="confirmPayment('${r.id}')" class="btn-icon" style="background:var(--exito); color:white; padding:5px 10px;">
                                <i class="fa fa-dollar-sign"></i> Pagado
                            </button>
                        ` : ''}
                        
                        ${r.type === 'presencial' && r.paymentStatus === 'pagado' ? `
                            <button onclick="showConfirmRequestModal('${r.id}')" class="btn-icon" style="background:var(--primario); color:white; padding:5px 10px;">
                                <i class="fa fa-check"></i> Confirmar
                            </button>
                        ` : ''}
                        
                        <button onclick="rejectRequest('${r.id}')" class="btn-icon" style="background:var(--peligro); color:white; padding:5px 10px;">
                            <i class="fa fa-times"></i> Rechazar
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    `}).join('');
}

export function rejectRequest(requestId) {
    if (confirm('¿Rechazar solicitud?')) {
        const request = state.pendingRequests.find(r => r.id == requestId);
        state.setPendingRequests(state.pendingRequests.filter(r => r.id != requestId));
        import('../main.js').then(main => main.save());
        showToast('Solicitud rechazada', 'success');
        
        // Enviar email al PACIENTE
        if (request?.patientEmail && !request.emailRechazoEnviado) {
            const esEmailProfesional = state.staff.some(p => p.email === request.patientEmail);
            
            if (!esEmailProfesional) {
                setTimeout(() => {
                    sendEmailNotification(
                        request.patientEmail, // ✅ SIEMPRE al paciente
                        'Solicitud no confirmada - Vínculo Salud',
                        `Hola ${request.patient},\n\nTu solicitud no pudo ser confirmada.`,
                        'rechazo',
                        request.patient,
                        request
                    ).then(success => {
                        if (success) request.emailRechazoEnviado = true;
                    });
                }, 100);
            }
        }
    }
}

export function showConfirmRequestModal(requestId) {
    const request = state.pendingRequests.find(r => r.id == requestId);
    if (!request) return;

    state.setSelectedPatientForTherapist(state.patients.find(p => p.id == request.patientId));
    document.getElementById('therapistRut').value = state.selectedPatientForTherapist?.rut || '';
    document.getElementById('patientInfoName').innerText = state.selectedPatientForTherapist?.name || '';
    document.getElementById('patientInfoEmail').innerText = state.selectedPatientForTherapist?.email || '';
    document.getElementById('patientInfoPhone').innerText = state.selectedPatientForTherapist?.phone || '';
    document.getElementById('patientInfo').style.display = 'block';
    document.getElementById('therapistPatientName').innerText = state.selectedPatientForTherapist?.name || '';
    document.getElementById('therapistAppointmentType').value = 'presencial';
    document.getElementById('therapistDate').value = request.date;
    document.getElementById('therapistMsg').value = request.msg;
    document.getElementById('therapistPaymentMethod').value = request.paymentMethod || 'transfer';

    window.currentRequestId = requestId;

    updateTherapistBookingDetails();
    setTimeout(() => updateTherapistAvailableSlots(), 500);
    import('./auth.js').then(auth => auth.switchTab('agendar'));
}

export function showTherapistBookingModal() {
    state.setSelectedTherapistBoxId(null);
    state.setSelectedPatientForTherapist(null);
    window.currentRequestId = null;

    document.getElementById('therapistRut').value = '';
    document.getElementById('patientInfo').style.display = 'none';
    document.getElementById('therapistAppointmentType').value = 'online';
    document.getElementById('therapistDate').value = '';
    document.getElementById('therapistTime').innerHTML = '<option value="">Selecciona fecha</option>';
    document.getElementById('therapistMsg').value = '';
    document.getElementById('therapistPaymentMethod').value = 'transfer';
    document.getElementById('therapistPsychName').innerText = state.currentUser?.data?.name || '';
    document.getElementById('therapistPatientName').innerText = '—';
    document.getElementById('therapistDateDisplay').innerText = '—';
    document.getElementById('therapistTimeDisplay').innerText = '—';
    document.getElementById('therapistTypeDisplay').innerText = 'Online';
    document.getElementById('therapistPrice').innerText = '$0';
    document.getElementById('therapistBoxDisplay').style.display = 'none';
    document.getElementById('therapistBoxField').style.display = 'none';

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('therapistDate').min = today;
    import('./auth.js').then(auth => auth.switchTab('agendar'));
}

export function searchPatientByRutTherapist() {
    const rut = document.getElementById('therapistRut').value;
    if (!rut) return;

    const patient = state.patients.find(p => p.rut === rut);
    if (patient) {
        state.setSelectedPatientForTherapist(patient);
        document.getElementById('patientInfoName').innerText = patient.name || '';
        document.getElementById('patientInfoEmail').innerText = patient.email || '';
        document.getElementById('patientInfoPhone').innerText = patient.phone || '';
        document.getElementById('patientInfo').style.display = 'block';
        document.getElementById('therapistPatientName').innerText = patient.name;
        showToast('Paciente encontrado', 'success');
    } else {
        if (confirm('¿Crear nuevo paciente?')) {
            document.getElementById('patientRut').value = rut;
            document.getElementById('patientName').value = '';
            document.getElementById('patientEmail').value = '';
            document.getElementById('patientPhone').value = '';
            document.getElementById('patientModalTitle').innerText = 'Nuevo Paciente';
            document.getElementById('patientModal').style.display = 'flex';
        }
    }
}

export function updateTherapistBookingDetails() {
    if (!state.currentUser?.data) return;
    
    const type = document.getElementById('therapistAppointmentType').value;
    const price = type === 'online' ? state.currentUser.data.priceOnline : state.currentUser.data.pricePresencial;
    document.getElementById('therapistPrice').innerText = `$${price.toLocaleString()}`;
    document.getElementById('therapistTypeDisplay').innerText = type === 'online' ? 'Online' : 'Presencial';

    if (type === 'presencial') {
        document.getElementById('therapistBoxField').style.display = 'block';
    } else {
        document.getElementById('therapistBoxField').style.display = 'none';
        document.getElementById('therapistBoxDisplay').style.display = 'none';
    }
    updateTherapistAvailableSlots();
}

export function updateTherapistAvailableSlots() {
    const date = document.getElementById('therapistDate').value;
    const timeSelect = document.getElementById('therapistTime');

    if (!date || !state.currentUser?.data) return;

    const bookedTimes = state.appointments
        .filter(a => a.psychId == state.currentUser.data.id && a.date === date && a.status === 'confirmada')
        .map(a => a.time);

    const availableSlots = state.currentUser.data.availability?.[date] || [];

    timeSelect.innerHTML = '<option value="">Selecciona horario</option>';

    const now = new Date();
    availableSlots.forEach(slot => {
        if (!bookedTimes.includes(slot.time) && new Date(date + 'T' + slot.time) > now) {
            const option = document.createElement('option');
            option.value = slot.time;
            option.textContent = slot.time + (slot.isOvercupo ? ' (⚠️ Sobrecupo)' : '');
            if (slot.isOvercupo) option.style.color = 'var(--atencion)';
            timeSelect.appendChild(option);
        }
    });
}

export function executeTherapistBooking() {
    if (!state.selectedPatientForTherapist) {
        showToast('Debes seleccionar un paciente', 'error');
        return;
    }

    const date = document.getElementById('therapistDate').value;
    const time = document.getElementById('therapistTime').value;
    const type = document.getElementById('therapistAppointmentType').value;
    const paymentMethod = document.getElementById('therapistPaymentMethod').value;
    const msg = document.getElementById('therapistMsg').value;

    if (!date || !time) {
        showToast('Selecciona fecha y horario', 'error');
        return;
    }

    const price = type === 'online' ? state.currentUser.data.priceOnline : state.currentUser.data.pricePresencial;

    const appointment = {
        id: Date.now(),
        patientId: state.selectedPatientForTherapist.id,
        patient: state.selectedPatientForTherapist.name,
        patientRut: state.selectedPatientForTherapist.rut,
        patientEmail: state.selectedPatientForTherapist.email,
        patientPhone: state.selectedPatientForTherapist.phone,
        psych: state.currentUser.data.name,
        psychId: state.currentUser.data.id,
        date,
        time,
        type,
        boxId: null,
        boxName: null,
        price,
        paymentMethod,
        paymentStatus: 'pendiente',
        msg,
        status: 'confirmada',
        createdAt: new Date().toISOString(),
        createdBy: state.currentUser.data.name,
        emailEnviado: false
    };

    state.appointments.push(appointment);

    if (window.currentRequestId) {
        state.setPendingRequests(state.pendingRequests.filter(r => r.id != window.currentRequestId));
        window.currentRequestId = null;
    }

    import('../main.js').then(main => main.save());
    showToast('✅ Cita creada', 'success');
    
    // Enviar email al PACIENTE
    if (state.selectedPatientForTherapist.email && !appointment.emailEnviado) {
        const esEmailProfesional = state.staff.some(p => p.email === state.selectedPatientForTherapist.email);
        
        if (!esEmailProfesional) {
            setTimeout(() => {
                sendEmailNotification(
                    state.selectedPatientForTherapist.email,
                    'Cita confirmada - Vínculo Salud',
                    `Hola ${state.selectedPatientForTherapist.name},\n\nTu cita ha sido confirmada.`,
                    'cita_confirmada',
                    state.selectedPatientForTherapist.name,
                    appointment
                ).then(success => {
                    if (success) appointment.emailEnviado = true;
                });
            }, 100);
        }
    }
    
    import('./auth.js').then(auth => auth.switchTab('citas'));
}

export function cancelAppointment(id) {
    if (confirm('¿Cancelar cita?')) {
        const appointment = state.appointments.find(a => a.id == id);
        state.setAppointments(state.appointments.filter(a => a.id != id));
        import('../main.js').then(main => main.save());
        showToast('Cita cancelada', 'success');
        
        // Enviar email al PACIENTE
        if (appointment?.patientEmail && !appointment.emailCancelacionEnviado) {
            const esEmailProfesional = state.staff.some(p => p.email === appointment.patientEmail);
            
            if (!esEmailProfesional) {
                setTimeout(() => {
                    sendEmailNotification(
                        appointment.patientEmail,
                        'Cita cancelada - Vínculo Salud',
                        `Hola ${appointment.patient},\n\nTu cita ha sido cancelada.`,
                        'cita_cancelada',
                        appointment.patient,
                        appointment
                    ).then(success => {
                        if (success) appointment.emailCancelacionEnviado = true;
                    });
                }, 100);
            }
        }
    }
}

export function markAsPaid(id) {
    confirmPayment(id);
}

export function editAppointment(id) {
    showToast('Función de edición en desarrollo', 'info');
}

// ============================================
// ESTADÍSTICAS
// ============================================

export function getAppointmentStats(psychId = null) {
    let citas = state.appointments;
    let solicitudes = state.pendingRequests;
    
    if (psychId) {
        citas = citas.filter(a => a.psychId == psychId);
        solicitudes = solicitudes.filter(s => s.psychId == psychId);
    }
    
    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const añoActual = ahora.getFullYear();
    
    const porEstado = {
        confirmadas: citas.filter(a => a.status === 'confirmada').length,
        pendientes: citas.filter(a => a.status === 'pendiente').length,
        canceladas: citas.filter(a => a.status === 'cancelada').length
    };
    
    const porTipo = {
        online: citas.filter(a => a.type === 'online').length,
        presencial: citas.filter(a => a.type === 'presencial').length
    };
    
    const porMes = {};
    for (let i = 0; i < 6; i++) {
        const fecha = new Date(añoActual, mesActual - i, 1);
        const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        porMes[key] = 0;
    }
    
    citas.forEach(c => {
        if (c.date) {
            const [year, month] = c.date.split('-');
            const key = `${year}-${month}`;
            if (porMes[key] !== undefined) {
                porMes[key]++;
            }
        }
    });
    
    const proximas = citas.filter(c => {
        if (c.status !== 'confirmada') return false;
        const fechaCita = new Date(c.date + 'T' + (c.time || '00:00'));
        const diffDays = Math.ceil((fechaCita - ahora) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
    }).length;
    
    return {
        total: citas.length,
        solicitudesPendientes: solicitudes.length,
        porEstado,
        porTipo,
        porMes,
        proximas,
        promedioDiario: citas.length > 0 ? (citas.length / 30).toFixed(1) : 0
    };
}

export function getUpcomingAppointments(psychId, limit = 5) {
    const ahora = new Date();
    
    return state.appointments
        .filter(a => a.psychId == psychId && a.status === 'confirmada')
        .filter(a => new Date(a.date + 'T' + (a.time || '00:00')) > ahora)
        .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
        .slice(0, limit)
        .map(a => ({
            ...a,
            paciente: a.patient,
            fechaFormateada: a.date,
            hora: a.time
        }));
}

export function isTimeSlotAvailable(psychId, date, time) {
    const psych = state.staff.find(s => s.id == psychId);
    if (!psych || !psych.availability || !psych.availability[date]) return false;
    
    const slot = psych.availability[date].find(s => s.time === time);
    if (!slot) return false;
    
    const isBooked = state.appointments.some(a => 
        a.psychId == psychId && a.date === date && a.time === time && a.status === 'confirmada'
    );
    
    return !isBooked;
}

// ============================================
// EXPONER FUNCIONES GLOBALMENTE
// ============================================
window.openBooking = openBooking;
window.updateBookingDetails = updateBookingDetails;
window.updateAvailableTimes = updateAvailableTimes;
window.searchPatientByRutBooking = searchPatientByRutBooking;
window.checkOnlineAvailability = checkOnlineAvailability;
window.executeBooking = executeBooking;
window.showPaymentDetails = showPaymentDetails;
window.confirmPayment = confirmPayment;
window.rejectPayment = rejectPayment;
window.confirmPresencialTime = confirmPresencialTime;
window.renderPendingRequests = renderPendingRequests;
window.showConfirmRequestModal = showConfirmRequestModal;
window.rejectRequest = rejectRequest;
window.editAppointment = editAppointment;
window.cancelAppointment = cancelAppointment;
window.markAsPaid = markAsPaid;
window.showTherapistBookingModal = showTherapistBookingModal;
window.searchPatientByRutTherapist = searchPatientByRutTherapist;
window.updateTherapistBookingDetails = updateTherapistBookingDetails;
window.executeTherapistBooking = executeTherapistBooking;
window.renderAppointments = renderAppointments;
window.getAppointmentStats = getAppointmentStats;
window.getUpcomingAppointments = getUpcomingAppointments;
window.isTimeSlotAvailable = isTimeSlotAvailable;
window.selectTimeSlot = selectTimeSlot;
window.selectTimePref = selectTimePref;
window.calcularEdad = calcularEdad;

console.log('✅ citas.js cargado (versión con validación ABSOLUTA de email)');