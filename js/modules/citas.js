// js/modules/citas.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { 
    showToast, validarRut, formatDate, normalizarRut, 
    normalizarFecha, getTimePeriod, calcularEdad 
} from './utils.js';
import { save } from '../main.js';

// ============================================
// VARIABLE GLOBAL PARA HORA SELECCIONADA
// ============================================
window.horaSeleccionada = null;

// ============================================
// FUNCIONES AUXILIARES INTERNAS
// ============================================

/**
 * Verifica si un horario está ocupado para un profesional en una fecha específica.
 * @param {string} psychId - ID del profesional
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @param {string} time - Hora (HH:MM)
 * @returns {boolean}
 */
function isTimeSlotOccupied(psychId, date, time) {
    if (!time) return false;
    const occupiedAppointments = state.appointments.some(a => 
        a.psychId == psychId && a.date === date && a.time === time &&
        (a.status === 'confirmada' || a.status === 'pendiente')
    );
    const occupiedRequests = state.pendingRequests.some(r => 
        r.psychId == psychId && r.date === date && r.time === time && r.time !== 'Pendiente'
    );
    return occupiedAppointments || occupiedRequests;
}

/**
 * Obtiene los horarios disponibles para un profesional en una fecha.
 * @param {object} psych - Objeto del profesional
 * @param {string} date - Fecha YYYY-MM-DD
 * @returns {Array} Lista de slots disponibles (objetos con time y isOvercupo)
 */
function getAvailableSlots(psych, date) {
    const availableSlots = psych.availability?.[date] || [];
    if (!availableSlots.length) return [];

    const now = new Date();
    return availableSlots
        .filter(slot => !isTimeSlotOccupied(psych.id, date, slot.time))
        .filter(slot => new Date(date + 'T' + slot.time) > now)
        .sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Configura la sección de tutor según edad.
 */
function configurarTutorSegunEdad(edad) {
    const tutorSection = document.getElementById('tutorSection');
    const tutorName = document.getElementById('tutorName');
    const tutorRut = document.getElementById('tutorRut');
    const tutorRelationship = document.getElementById('tutorRelationship');
    const tutorHelpText = document.getElementById('tutorHelpText');
    
    if (!tutorSection) return;
    
    if (edad !== null && edad < 18) {
        tutorSection.style.borderLeft = '3px solid #ff9500';
        tutorSection.style.backgroundColor = '#fff9f0';
        if (tutorHelpText) tutorHelpText.innerHTML = '<span style="color:#ff9500;"><i class="fa fa-exclamation-circle"></i> Obligatorio para menores de 18 años</span>';
        if (tutorName) tutorName.required = true;
        if (tutorRut) tutorRut.required = true;
        if (tutorRelationship) tutorRelationship.required = true;
    } else {
        tutorSection.style.borderLeft = '3px solid #34c759';
        tutorSection.style.backgroundColor = '#f0f9f0';
        if (tutorHelpText) tutorHelpText.innerHTML = '<span style="color:#34c759;"><i class="fa fa-info-circle"></i> Opcional (puedes dejar en blanco si no aplica)</span>';
        if (tutorName) tutorName.required = false;
        if (tutorRut) tutorRut.required = false;
        if (tutorRelationship) tutorRelationship.required = false;
    }
}

/**
 * Limpia el formulario de reserva.
 */
function limpiarFormularioReserva() {
    const campos = ['custRut', 'custName', 'custEmail', 'custPhone', 'custBirthdate', 'custMsg'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const prevision = document.getElementById('custPrevision');
    if (prevision) prevision.value = '';
    const tutorName = document.getElementById('tutorName');
    const tutorRut = document.getElementById('tutorRut');
    const tutorRelationship = document.getElementById('tutorRelationship');
    if (tutorName) tutorName.value = '';
    if (tutorRut) tutorRut.value = '';
    if (tutorRelationship) tutorRelationship.value = '';
    const edadDisplay = document.getElementById('edadDisplay');
    if (edadDisplay) edadDisplay.innerHTML = '';
    const paymentMethod = document.getElementById('paymentMethod');
    if (paymentMethod) paymentMethod.value = '';
    const paymentDetails = document.getElementById('paymentDetails');
    if (paymentDetails) paymentDetails.style.display = 'none';
    const paymentLinkContainer = document.getElementById('paymentLinkContainer');
    if (paymentLinkContainer) paymentLinkContainer.style.display = 'none';
    const acceptPolicy = document.getElementById('acceptPolicy');
    if (acceptPolicy) acceptPolicy.checked = false;
    window.horaSeleccionada = null;
    const custTime = document.getElementById('custTime');
    if (custTime) custTime.value = '';
    document.querySelectorAll('.time-slot-btn').forEach(btn => btn.classList.remove('selected'));
}

/**
 * Muestra resumen de cita después de reservar.
 */
function mostrarResumenYAcciones(datos) {
    const modalHtml = `
        <div id="modalResumenCita" class="modal" style="display:flex; z-index:10000;">
            <div class="modal-content" style="max-width: 500px; text-align: center;">
                <button class="modal-close" onclick="document.getElementById('modalResumenCita').remove()">&times;</button>
                <i class="fa fa-check-circle" style="font-size: 64px; color: var(--verde-exito); margin-bottom: 20px;"></i>
                <h2>✅ Cita registrada</h2>
                <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: left;">
                    <p><strong>Paciente:</strong> ${datos.paciente}</p>
                    <p><strong>Profesional:</strong> ${datos.profesional}</p>
                    <p><strong>Fecha:</strong> ${datos.fecha}</p>
                    <p><strong>Hora:</strong> ${datos.hora}</p>
                    <p><strong>Tipo:</strong> ${datos.tipo}</p>
                    <p><strong>Valor:</strong> $${datos.valor.toLocaleString()}</p>
                </div>
                <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
                    <button id="btnNuevaReserva" class="btn-staff" style="background: var(--verde-exito);">
                        <i class="fa fa-plus-circle"></i> Nueva reserva
                    </button>
                    <button id="btnVolverInicio" class="btn-staff" style="background: var(--primario);">
                        <i class="fa fa-home"></i> Volver al inicio
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = document.getElementById('modalResumenCita');
    const btnNueva = document.getElementById('btnNuevaReserva');
    const btnVolver = document.getElementById('btnVolverInicio');
    
    btnNueva.onclick = () => {
        modal.remove();
        document.getElementById('bookingPanel').style.display = 'block';
        const custDate = document.getElementById('custDate');
        if (custDate) custDate.value = new Date().toISOString().split('T')[0];
        if (typeof updateAvailableTimes === 'function') updateAvailableTimes();
    };
    
    btnVolver.onclick = () => {
        modal.remove();
        document.getElementById('bookingPanel').style.display = 'none';
        document.getElementById('clientView').style.display = 'block';
        if (typeof window.filterProfessionals === 'function') window.filterProfessionals();
    };
}

// ============================================
// FUNCIONES EXPORTADAS (Principales)
// ============================================

export function selectTimeSlot(time) {
    console.log('🎯 [SELECT] Seleccionando horario:', time);
    window.horaSeleccionada = time;
    
    document.querySelectorAll('.time-slot-btn').forEach(btn => btn.classList.remove('selected'));
    const btn = document.querySelector(`.time-slot-btn[data-time="${time}"]`);
    if (btn) btn.classList.add('selected');
    
    const select = document.getElementById('custTime');
    if (select) {
        select.value = time;
        select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    if (typeof window.updateBookingDetails === 'function') window.updateBookingDetails();
    return true;
}

export function selectTimePref(pref) {
    console.log('📅 [PREF] Preferencia seleccionada:', pref);
    const panel = document.getElementById('bookingPanel');
    if (panel) panel.dataset.timePref = pref;
    if (pref && window.showToast) window.showToast(`Preferencia: ${pref === 'AM' ? 'Mañana' : 'Tarde'}`, 'info');
}

export function openBooking(id) {
    console.log("🔍 Abriendo reserva para ID:", id);
    
    const psych = state.staff.find(p => p.id == id);
    if (!psych) {
        showToast('Profesional no encontrado', 'error');
        return;
    }
    
    state.setSelectedPsych(psych);
    // NOTA: se elimina la línea state.setSelectedBoxId(null) porque ya no existe

    const today = new Date().toISOString().split('T')[0];
    
    document.getElementById('clientView').style.display = 'none';
    document.getElementById('bookingPanel').style.display = 'block';
    
    document.getElementById('psychName').innerText = psych.name;
    document.getElementById('psychSelectedName').innerText = psych.name;
    document.getElementById('psychSelectedSpec').innerText = Array.isArray(psych.spec) ? psych.spec.join(' · ') : psych.spec;
    document.getElementById('custDate').min = today;
    document.getElementById('custDate').value = today;
    document.getElementById('bookingDuration').innerText = (psych.sessionDuration || 45) + ' minutos';
    
    // Limpiar campos
    const birthdate = document.getElementById('custBirthdate');
    if (birthdate) birthdate.value = '';
    const edadDisplay = document.getElementById('edadDisplay');
    if (edadDisplay) edadDisplay.innerHTML = '';
    
    const tutorName = document.getElementById('tutorName');
    const tutorRut = document.getElementById('tutorRut');
    const tutorRelationship = document.getElementById('tutorRelationship');
    if (tutorName) tutorName.value = '';
    if (tutorRut) tutorRut.value = '';
    if (tutorRelationship) tutorRelationship.value = '';
    configurarTutorSegunEdad(null);
    
    const birthdateInput = document.getElementById('custBirthdate');
    if (birthdateInput) {
        birthdateInput.removeEventListener('change', window.calcularEdad);
        birthdateInput.removeEventListener('input', window.calcularEdad);
        birthdateInput.addEventListener('change', window.calcularEdad);
        birthdateInput.addEventListener('input', window.calcularEdad);
        console.log('Eventos de fecha añadidos');
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
    
    const type = document.getElementById('appointmentType').value;
    const methods = state.selectedPsych.paymentMethods || state.globalPaymentMethods;

    select.innerHTML = '<option value="">Selecciona método de pago</option>';
    
    if (methods.transfer) select.innerHTML += '<option value="transfer">Transferencia Bancaria</option>';
    
    if (type === 'online') {
        if (methods.cardOnline) select.innerHTML += '<option value="card-online">Tarjeta Online</option>';
        if (methods.mercadopago) select.innerHTML += '<option value="mercadopago">Mercado Pago</option>';
        if (methods.webpay) select.innerHTML += '<option value="webpay">Webpay</option>';
    } else {
        if (methods.cardPresencial) select.innerHTML += '<option value="card-presencial">Tarjeta (en consulta)</option>';
        if (methods.cash) select.innerHTML += '<option value="cash">Efectivo (en consulta)</option>';
        if (methods.cardOnline) select.innerHTML += '<option value="card-online-presencial">Tarjeta Online (pago anticipado)</option>';
    }
}

export function showPaymentDetails() {
    const method = document.getElementById('paymentMethod')?.value;
    const type = document.getElementById('appointmentType').value;
    const detailsDiv = document.getElementById('paymentDetails');
    const linkContainer = document.getElementById('paymentLinkContainer');
    
    if (detailsDiv) detailsDiv.style.display = 'none';
    if (linkContainer) linkContainer.style.display = 'none';
    if (!method) return;
    
    const paymentLinks = state.selectedPsych.paymentLinks || {};
    const bank = state.selectedPsych.bankDetails;
    
    if (method === 'transfer' && bank) {
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
        const qr = paymentLinks.qrPresencial;
        detailsDiv.innerHTML = `
            <div style="background: #e8f4fd; padding: 15px; border-radius: 8px;">
                <p>El pago se realizará en el consultorio.</p>
                ${qr ? `<div style="text-align:center; margin:15px 0;"><img src="${qr}" style="max-width:150px;"></div>` : '<p style="color:var(--texto-secundario);">No hay código QR configurado para pagos presenciales.</p>'}
                <p style="font-size:0.9rem; margin-top:10px;"><strong>Importante:</strong> La dirección exacta se coordinará directamente con el psicólogo.</p>
            </div>
        `;
    }
    
    if (method === 'card-online' || method === 'mercadopago' || method === 'webpay') {
        const link = method === 'card-online' ? paymentLinks.online : 
                    method === 'mercadopago' ? paymentLinks.mercadopago || paymentLinks.online :
                    paymentLinks.webpay || paymentLinks.online;
        const qr = paymentLinks.qrOnline;
        
        if (link) {
            linkContainer.style.display = 'block';
            linkContainer.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">
                    <h4 style="margin-bottom:15px;">💳 Pago Online</h4>
                    <a href="${link}" target="_blank" class="btn-staff" style="background:var(--exito); color:white; padding:12px 30px; border-radius:30px; text-decoration:none;">
                        <i class="fa fa-credit-card"></i> Ir a pagar
                    </a>
                    ${qr ? `<div style="margin-top:20px;"><img src="${qr}" style="max-width:150px;"></div>` : ''}
                    <p style="font-size:0.8rem;">Vuelve a esta página después del pago</p>
                </div>
            `;
        } else {
            linkContainer.style.display = 'block';
            linkContainer.innerHTML = '<p style="color:var(--texto-secundario);">No hay link de pago configurado para este método.</p>';
        }
    }
    
    if (method === 'card-online-presencial') {
        const link = paymentLinks.presencial || paymentLinks.online;
        const qr = paymentLinks.qrPresencial;
        
        if (link) {
            linkContainer.style.display = 'block';
            linkContainer.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">
                    <h4 style="margin-bottom:15px;">💳 Pago anticipado (presencial)</h4>
                    <a href="${link}" target="_blank" class="btn-staff" style="background:var(--exito); color:white; padding:12px 30px; border-radius:30px; text-decoration:none;">
                        <i class="fa fa-credit-card"></i> Pagar ahora
                    </a>
                    ${qr ? `<div style="margin-top:20px;"><img src="${qr}" style="max-width:150px;"></div>` : ''}
                    <p style="font-size:0.8rem;">Realiza el pago antes de tu cita presencial.</p>
                </div>
            `;
        } else {
            linkContainer.style.display = 'block';
            linkContainer.innerHTML = '<p style="color:var(--texto-secundario);">No hay link de pago configurado para esta modalidad.</p>';
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
    
    loadPaymentMethods();
    updateAvailableTimes();
}

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
    const bookBtn = document.getElementById('bookBtn');

    if (!date || !state.selectedPsych) return;

    if (amContainer) amContainer.style.display = 'none';
    if (pmContainer) pmContainer.style.display = 'none';
    if (timeSelect) timeSelect.style.display = 'none';
    if (noSlotsMessage) noSlotsMessage.style.display = 'none';

    if (type === 'presencial') {
        const availableSlots = state.selectedPsych.availability?.[date] || [];
        const hasAvailability = availableSlots.length > 0;
        
        if (presencialWarning) {
            presencialWarning.style.display = 'block';
            if (!hasAvailability) {
                presencialWarning.innerHTML = `
                    <i class="fa fa-exclamation-triangle" style="color: #ff6b6b;"></i>
                    <strong>No hay disponibilidad para esta fecha.</strong> 
                    El profesional no tiene horarios configurados para este día. Por favor selecciona otra fecha.
                    <div style="margin-top:15px;">
                        <label>Preferencia de horario (opcional):</label>
                        <div style="display:flex; gap:15px;">
                            <label><input type="radio" name="presencialTimePref" value="AM" onchange="selectTimePref('AM')"> Mañana</label>
                            <label><input type="radio" name="presencialTimePref" value="PM" onchange="selectTimePref('PM')"> Tarde</label>
                            <label><input type="radio" name="presencialTimePref" value="" checked> Sin preferencia</label>
                        </div>
                    </div>
                `;
                presencialWarning.style.backgroundColor = '#ffe6e6';
                presencialWarning.style.borderLeft = '4px solid #ff6b6b';
                if (bookBtn) bookBtn.disabled = true;
            } else {
                presencialWarning.innerHTML = `
                    <i class="fa fa-info-circle" style="color: var(--azul-medico);"></i> 
                    <strong>Solicitud Presencial:</strong> El profesional confirmará la hora y coordinará la dirección.
                    <div style="margin-top:15px;">
                        <label>Preferencia de horario (opcional):</label>
                        <div style="display:flex; gap:15px;">
                            <label><input type="radio" name="presencialTimePref" value="AM" onchange="selectTimePref('AM')"> Mañana</label>
                            <label><input type="radio" name="presencialTimePref" value="PM" onchange="selectTimePref('PM')"> Tarde</label>
                            <label><input type="radio" name="presencialTimePref" value="" checked> Sin preferencia</label>
                        </div>
                    </div>
                    <p style="margin-top:15px; background:#fff3cd; padding:10px; border-radius:8px;">
                        <i class="fa fa-map-marker-alt"></i> La dirección exacta se coordinará directamente con el psicólogo.
                    </p>
                `;
                presencialWarning.style.backgroundColor = '#e8f4fd';
                if (bookBtn) bookBtn.disabled = false;
            }
        }
        if (onlineMsg) onlineMsg.style.display = 'none';
        return;
    }

    if (presencialWarning) presencialWarning.style.display = 'none';
    
    const availableSlots = getAvailableSlots(state.selectedPsych, date);

    if (availableSlots.length === 0) {
        if (noSlotsMessage) {
            noSlotsMessage.style.display = 'block';
            noSlotsMessage.innerHTML = 'No hay horarios disponibles';
        }
        if (onlineMsg) onlineMsg.style.display = 'none';
        if (bookBtn) bookBtn.disabled = true;
        return;
    } else {
        if (bookBtn) bookBtn.disabled = false;
    }

    const amTimes = availableSlots.filter(slot => getTimePeriod(slot.time) === 'AM');
    const pmTimes = availableSlots.filter(slot => getTimePeriod(slot.time) === 'PM');

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
        const horaValida = availableSlots.some(slot => slot.time === window.horaSeleccionada);
        if (horaValida) {
            if (timeSelect) timeSelect.value = window.horaSeleccionada;
            const btn = document.querySelector(`.time-slot-btn[data-time="${window.horaSeleccionada}"]`);
            if (btn) btn.classList.add('selected');
        }
    }
}

export function searchPatientByRutBooking() {
    const rutInput = document.getElementById('custRut').value;
    if (!rutInput) return;

    const rutNormalizado = normalizarRut(rutInput);
    const patient = state.patients.find(p => normalizarRut(p.rut) === rutNormalizado);
    if (patient) {
        document.getElementById('custName').value = patient.name || '';
        document.getElementById('custEmail').value = patient.email || '';
        const birthdate = document.getElementById('custBirthdate');
        if (birthdate && patient.birthdate) {
            birthdate.value = patient.birthdate;
            if (typeof window.calcularEdad === 'function') window.calcularEdad();
        }
        const previsionSelect = document.getElementById('custPrevision');
        if (previsionSelect && patient.prevision) previsionSelect.value = patient.prevision;
        if (patient.tutor) {
            const tutorName = document.getElementById('tutorName');
            const tutorRut = document.getElementById('tutorRut');
            const tutorRelationship = document.getElementById('tutorRelationship');
            if (tutorName) tutorName.value = patient.tutor.nombre || '';
            if (tutorRut) tutorRut.value = patient.tutor.rut || '';
            if (tutorRelationship) tutorRelationship.value = patient.tutor.parentesco || '';
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
    } else {
        showToast('Paciente no registrado. Completa los datos.', 'info', 3000);
    }
}

export function checkOnlineAvailability() {
    const date = document.getElementById('custDate').value;
    const time = document.getElementById('custTime').value;
    const type = document.getElementById('appointmentType').value;
    if (type === 'online' && date && time) return new Date(date + 'T' + time) > new Date();
    return true;
}

let bookingEnProceso = false;

export async function executeBooking() {
    console.log("🟢 executeBooking llamada");
    if (bookingEnProceso) {
        console.log('⏳ Reserva ya en proceso');
        return;
    }
    bookingEnProceso = true;

    const rutInput = document.getElementById('custRut').value;
    const rutNormalizado = normalizarRut(rutInput);
    const name = document.getElementById('custName').value;
    const email = document.getElementById('custEmail').value;
    const birthdate = document.getElementById('custBirthdate')?.value || '';
    const prevision = document.getElementById('custPrevision')?.value || '';
    
    if (!email || !email.includes('@')) {
        showToast('Ingresa un email válido', 'error');
        bookingEnProceso = false;
        return;
    }
    
    if (state.selectedPsych && email === state.selectedPsych.email) {
        showToast('❌ ERROR: No puedes usar el email del profesional. Usa el email del paciente.', 'error');
        bookingEnProceso = false;
        return;
    }
    
    let tutorData = null;
    const tutorName = document.getElementById('tutorName')?.value;
    const tutorRutRaw = document.getElementById('tutorRut')?.value;
    const tutorRelationship = document.getElementById('tutorRelationship')?.value;
    if (tutorName && tutorRutRaw && tutorRelationship) {
        tutorData = {
            nombre: tutorName,
            rut: normalizarRut(tutorRutRaw),
            parentesco: tutorRelationship
        };
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

    if (!rutInput || !name || !email || !date) {
        showToast('Completa todos los campos', 'error');
        bookingEnProceso = false;
        return;
    }
    if (!validarRut(rutInput)) {
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

    let edad = 0;
    if (birthdate) {
        const fechaNormalizada = normalizarFecha(birthdate);
        if (!fechaNormalizada) {
            showToast('Formato de fecha inválido', 'error');
            bookingEnProceso = false;
            return;
        }
        edad = calcularEdad(fechaNormalizada);
        if (edad < 18 && !tutorData) {
            showToast('Debes completar datos del tutor para menores de edad', 'error');
            bookingEnProceso = false;
            return;
        }
    }

    let time = '';
    if (window.horaSeleccionada) time = window.horaSeleccionada;
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

    // Para presencial: verificar que haya disponibilidad en la fecha
    if (type === 'presencial') {
        const availableSlots = state.selectedPsych.availability?.[date] || [];
        if (availableSlots.length === 0) {
            showToast('⚠️ No hay disponibilidad para esta fecha. El profesional no tiene horarios configurados.', 'error');
            bookingEnProceso = false;
            return;
        }
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

    // Validación de horario ocupado (solo para online)
    if (type === 'online' && time) {
        if (isTimeSlotOccupied(state.selectedPsych.id, date, time)) {
            showToast('⚠️ Este horario ya está ocupado. Por favor selecciona otro.', 'error');
            bookingEnProceso = false;
            const bookBtn = document.getElementById('bookBtn');
            if (bookBtn) {
                bookBtn.innerHTML = bookBtn.getAttribute('data-original-text') || 'SOLICITAR CITA';
                bookBtn.disabled = false;
            }
            return;
        }
    }

    const bookBtn = document.getElementById('bookBtn');
    const originalText = bookBtn.innerHTML;
    bookBtn.innerHTML = '<span class="spinner"></span> Procesando...';
    bookBtn.disabled = true;

    try {
        let patient = state.patients.find(p => normalizarRut(p.rut) === rutNormalizado);
        
        if (!patient) {
            patient = {
                id: Date.now(),
                rut: rutNormalizado,
                name,
                email,
                phone,
                birthdate: birthdate,
                edad: edad,
                prevision: prevision,
                tutor: (edad < 18 && tutorData) ? tutorData : null,
                notes: msg || '',
                psychId: state.selectedPsych.id,
                createdAt: new Date().toISOString(),
                appointments: []
            };
            state.patients.push(patient);
            await save();
        } else {
            let datosActualizados = false;
            if (!patient.birthdate && birthdate) {
                patient.birthdate = birthdate;
                patient.edad = edad;
                datosActualizados = true;
            }
            if (!patient.prevision && prevision) {
                patient.prevision = prevision;
                datosActualizados = true;
            }
            if (tutorData && edad < 18) {
                if (!patient.tutor || 
                    patient.tutor.nombre !== tutorData.nombre ||
                    patient.tutor.rut !== tutorData.rut) {
                    patient.tutor = tutorData;
                    datosActualizados = true;
                }
            } else if (tutorData && edad >= 18) {
                patient.tutor = tutorData;
                datosActualizados = true;
            }
            if (!patient.psychId && state.selectedPsych) {
                patient.psychId = state.selectedPsych.id;
                datosActualizados = true;
            }
            if (datosActualizados) await save();
        }

        const price = type === 'online' ? state.selectedPsych.priceOnline : state.selectedPsych.pricePresencial;

        const appointment = {
            id: Date.now(),
            patientId: patient.id,
            patient: name,
            patientRut: rutNormalizado,
            patientEmail: email,
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
            patientBirthdate: birthdate || null,
            patientTutor: patient.tutor || null,
            prevision: prevision
        };

        if (type === 'online') {
            state.appointments.push(appointment);
            showToast('✅ Solicitud creada', 'success');
            if (typeof updateAvailableTimes === 'function') updateAvailableTimes();
        } else {
            state.pendingRequests.push(appointment);
            let mensaje = '✅ Solicitud enviada';
            if (time) mensaje += ` (Preferencia: ${time})`;
            if (preferenciaAMPM) mensaje += ` ${preferenciaAMPM}`;
            showToast(mensaje, 'success');
            if (typeof updateAvailableTimes === 'function') updateAvailableTimes();
        }

        await save();
        
        if (state.currentUser && document.getElementById('dashboard').style.display === 'block') {
            if (typeof renderAppointments === 'function') renderAppointments();
            if (typeof renderPendingRequests === 'function') renderPendingRequests();
        }
        
        window.horaSeleccionada = null;
        setTimeout(() => { if (typeof updateAvailableTimes === 'function') updateAvailableTimes(); }, 300);
        limpiarFormularioReserva();
        mostrarResumenYAcciones({
            paciente: name,
            profesional: state.selectedPsych.name,
            fecha: date,
            hora: horaFinal,
            tipo: type === 'online' ? 'Online' : 'Presencial',
            valor: price
        });

    } catch (error) {
        console.error('❌ Error en executeBooking:', error);
        showToast('Error al procesar: ' + error.message, 'error');
    } finally {
        bookBtn.innerHTML = originalText;
        bookBtn.disabled = false;
        bookingEnProceso = false;
    }
}

// ============================================
// FUNCIONES DE TABLAS (para admin y psicólogo)
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
        tb.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:40px;">No hay citas</td></tr>';
        return;
    }

    const sortedApps = [...appointmentsToShow].sort((a, b) => new Date(b.date) - new Date(a.date));

    tb.innerHTML = sortedApps.map(a => {
        const fechaHora = new Date(a.date + 'T' + a.time);
        const isPast = fechaHora < new Date();
        const paymentStatusText = a.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente';
        const statusText = isPast ? 'Completada' : (a.status === 'confirmada' ? 'Confirmada' : 'Pendiente');
        
        return `
            <tr>
                <td><strong>${a.patient || '—'}</strong><br><small>${a.patientRut || ''}</small></td>
                <td>${a.psych || '—'}</td>
                <td>${a.date || '—'} <br><small>${a.time || '—'}</small></td>
                <td><span style="background:${a.type === 'online' ? 'var(--exito)' : 'var(--primario)'}; color:white; padding:4px 8px; border-radius:6px; font-size:0.7rem;">${a.type === 'online' ? 'Online' : 'Presencial'}</span></td>
                <td>${a.prevision || '—'}</td>
                <td><span>${paymentStatusText}<br><small>$${(a.price || 0).toLocaleString()}</small></span></td>
                <td><span>${statusText}</span></td>
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
                    ${a.type === 'presencial' ? `<br><small style="color:var(--primario);">📍 Dirección a coordinar</small>` : ''}
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
        tb.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:40px;">No hay solicitudes</td></tr>';
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
                <td>${r.time === 'Pendiente' ? 'A coordinar' : (r.time || 'A coordinar')}</td>
                <td><span class="badge ${r.type}">${r.type === 'online' ? 'Online' : 'Presencial'}</span></td>
                <td>${r.prevision || '—'}</td>
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
                        ${r.type === 'presencial' ? `<br><small style="color:var(--primario);">📍 Dirección a coordinar</small>` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

export async function confirmPayment(appointmentId) {
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
    
    await save();
    showToast('✅ Pago confirmado', 'success');
    if (typeof window.updateStats === 'function') window.updateStats();
    renderPendingRequests();
    renderAppointments();
}

export async function confirmPresencialTime(requestId, date, time) {
    const request = state.pendingRequests.find(r => r.id == requestId);
    if (!request) {
        showToast('Solicitud no encontrada', 'error');
        return;
    }

    if (isTimeSlotOccupied(request.psychId, date, time)) {
        showToast('⚠️ La hora seleccionada ya está ocupada. Elige otra.', 'error');
        return;
    }

    if (new Date(date + 'T' + time) < new Date()) {
        showToast('No se puede agendar en una fecha/hora pasada.', 'error');
        return;
    }

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
        emailConfirmacionEnviado: false,
        prevision: request.prevision
    };
    
    state.appointments.push(appointment);
    state.setPendingRequests(state.pendingRequests.filter(r => r.id != requestId));
    
    await save();
    showToast('✅ Cita confirmada', 'success');

    renderAppointments();
    renderPendingRequests();
    if (typeof window.renderCalendar === 'function') window.renderCalendar();
}

export function showConfirmRequestModal(requestId) {
    const request = state.pendingRequests.find(r => r.id == requestId);
    if (!request) {
        showToast('Solicitud no encontrada', 'error');
        return;
    }

    const agendarTab = document.getElementById('agendarTab');
    if (!agendarTab) {
        showToast('La pestaña "Agendar" no está disponible. Contacta al administrador.', 'error');
        return;
    }

    const therapistRut = document.getElementById('therapistRut');
    const patientInfo = document.getElementById('patientInfo');
    const patientInfoName = document.getElementById('patientInfoName');
    const patientInfoEmail = document.getElementById('patientInfoEmail');
    const patientInfoPhone = document.getElementById('patientInfoPhone');
    const therapistPatientName = document.getElementById('therapistPatientName');
    const therapistAppointmentType = document.getElementById('therapistAppointmentType');
    const therapistDate = document.getElementById('therapistDate');
    const therapistMsg = document.getElementById('therapistMsg');
    const therapistPaymentMethod = document.getElementById('therapistPaymentMethod');

    if (!therapistRut || !patientInfo || !patientInfoName || !patientInfoEmail || !patientInfoPhone ||
        !therapistPatientName || !therapistAppointmentType || !therapistDate || !therapistMsg || !therapistPaymentMethod) {
        showToast('Error: Faltan elementos en la interfaz para confirmar la solicitud.', 'error');
        return;
    }

    state.setSelectedPatientForTherapist(state.patients.find(p => p.id == request.patientId));
    therapistRut.value = state.selectedPatientForTherapist?.rut || '';
    patientInfoName.innerText = state.selectedPatientForTherapist?.name || '';
    patientInfoEmail.innerText = state.selectedPatientForTherapist?.email || '';
    patientInfoPhone.innerText = state.selectedPatientForTherapist?.phone || '';
    patientInfo.style.display = 'block';
    therapistPatientName.innerText = state.selectedPatientForTherapist?.name || '';
    therapistAppointmentType.value = 'presencial';
    therapistDate.value = request.date;
    therapistMsg.value = request.msg;
    therapistPaymentMethod.value = request.paymentMethod || 'transfer';

    window.currentRequestId = requestId;

    setTimeout(() => {
        updateTherapistBookingDetails();
        setTimeout(() => updateTherapistAvailableSlots(), 500);
    }, 100);
    
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
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('therapistDate').min = today;
    import('./auth.js').then(auth => auth.switchTab('agendar'));
}

export function searchPatientByRutTherapist() {
    const rutInput = document.getElementById('therapistRut').value;
    if (!rutInput) return;

    const rutNormalizado = normalizarRut(rutInput);
    const patient = state.patients.find(p => normalizarRut(p.rut) === rutNormalizado);
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
            document.getElementById('patientRut').value = rutInput;
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
    
    const type = document.getElementById('therapistAppointmentType')?.value;
    let price = 0;
    if (type === 'online') {
        price = state.currentUser.data.priceOnline || 0;
    } else {
        price = state.currentUser.data.pricePresencial || 0;
    }
    
    const priceElement = document.getElementById('therapistPrice');
    if (priceElement) priceElement.innerText = `$${price.toLocaleString()}`;
    const typeDisplay = document.getElementById('therapistTypeDisplay');
    if (typeDisplay) typeDisplay.innerText = type === 'online' ? 'Online' : 'Presencial';

    updateTherapistAvailableSlots();
}

export function updateTherapistAvailableSlots() {
    const date = document.getElementById('therapistDate')?.value;
    const timeSelect = document.getElementById('therapistTime');
    if (!date || !timeSelect || !state.currentUser?.data) return;

    const psych = state.currentUser.data;
    const availableSlots = getAvailableSlots(psych, date);

    timeSelect.innerHTML = '<option value="">Selecciona horario</option>';
    availableSlots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot.time;
        option.textContent = slot.time + (slot.isOvercupo ? ' (⚠️ Sobrecupo)' : '');
        if (slot.isOvercupo) option.style.color = 'var(--atencion)';
        timeSelect.appendChild(option);
    });
}

export async function executeTherapistBooking() {
    console.log("🟢 executeTherapistBooking llamada");

    if (!state.selectedPatientForTherapist) {
        showToast('Debes seleccionar un paciente', 'error');
        return;
    }

    const date = document.getElementById('therapistDate')?.value;
    const time = document.getElementById('therapistTime')?.value;
    const type = document.getElementById('therapistAppointmentType')?.value;
    const paymentMethod = document.getElementById('therapistPaymentMethod')?.value;
    const msg = document.getElementById('therapistMsg')?.value;

    if (!date || !time) {
        showToast('Selecciona fecha y horario', 'error');
        return;
    }

    if (isTimeSlotOccupied(state.currentUser.data.id, date, time)) {
        showToast('⚠️ La hora seleccionada ya está ocupada. Elige otra.', 'error');
        return;
    }

    const price = type === 'online' ? state.currentUser.data.priceOnline : state.currentUser.data.pricePresencial;
    if (price === 0) console.warn('⚠️ El precio es 0. Verifica la configuración del profesional.');

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
        emailEnviado: false,
        prevision: state.selectedPatientForTherapist.prevision || ''
    };

    state.appointments.push(appointment);

    let deleted = false;
    if (window.currentRequestId) {
        const req = state.pendingRequests.find(r => r.id == window.currentRequestId);
        if (req) {
            state.setPendingRequests(state.pendingRequests.filter(r => r.id != window.currentRequestId));
            deleted = true;
        }
    }
    if (!deleted && type === 'presencial') {
        const pending = state.pendingRequests.find(r =>
            r.patientId == state.selectedPatientForTherapist.id &&
            r.date === date &&
            r.type === 'presencial'
        );
        if (pending) {
            state.setPendingRequests(state.pendingRequests.filter(r => r.id != pending.id));
        }
    }

    await save();
    showToast(`✅ Cita creada con valor $${price.toLocaleString()}`, 'success');
    
    renderAppointments();
    renderPendingRequests();
    if (typeof window.renderCalendar === 'function') window.renderCalendar();
    updateTherapistAvailableSlots();
    
    import('./auth.js').then(auth => auth.switchTab('citas'));
}

export async function cancelAppointment(id) {
    if (!confirm('¿Cancelar cita?')) return;
    
    const appointment = state.appointments.find(a => a.id == id);
    if (!appointment) {
        showToast('Cita no encontrada', 'error');
        return;
    }
    
    state.setAppointments(state.appointments.filter(a => a.id != id));
    
    await save();
    showToast('Cita cancelada', 'success');
    renderAppointments();
    if (typeof updateAvailableTimes === 'function') updateAvailableTimes();
}

export async function rejectRequest(requestId) {
    if (!confirm('¿Rechazar solicitud?')) return;
    
    const request = state.pendingRequests.find(r => r.id == requestId);
    if (!request) return;
    
    state.setPendingRequests(state.pendingRequests.filter(r => r.id != requestId));
    
    await save();
    showToast('Solicitud rechazada', 'success');
    renderPendingRequests();
    if (request.time && request.time !== 'Pendiente') {
        if (typeof updateAvailableTimes === 'function') updateAvailableTimes();
        if (typeof updateTherapistAvailableSlots === 'function') updateTherapistAvailableSlots();
    }
}

export function showPatientAppointmentsByRut() {
    const rutInput = prompt('Ingresa tu RUT para consultar tus citas (formato 12345678-9):');
    if (!rutInput) return;
    
    const rutNormalizado = normalizarRut(rutInput);
    const patient = state.patients.find(p => normalizarRut(p.rut) === rutNormalizado);
    
    if (!patient) {
        showToast('No se encontraron citas para ese RUT', 'error');
        return;
    }
    
    const citasPaciente = [...state.appointments, ...state.pendingRequests]
        .filter(c => c.patientId == patient.id)
        .sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00')));
    
    if (citasPaciente.length === 0) {
        showToast('No tienes citas registradas', 'info');
        return;
    }
    
    const modalContent = `
        <div id="modalCitasPaciente" class="modal" style="display:flex;">
            <div class="modal-content" style="max-width: 800px;">
                <button class="modal-close" onclick="document.getElementById('modalCitasPaciente').remove()">&times;</button>
                <h2 style="margin-bottom: 20px;">📅 Mis Citas</h2>
                <p><strong>Paciente:</strong> ${patient.name} (${patient.rut})</p>
                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="background:#f0f0f0;">
                                <th>Fecha</th><th>Hora</th><th>Profesional</th><th>Tipo</th><th>Estado</th><th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${citasPaciente.map(cita => `
                                <tr>
                                    <td>${cita.date || '—'}</td>
                                    <td>${cita.time || 'A coordinar'}</td>
                                    <td>${cita.psych || '—'}</td>
                                    <td>${cita.type === 'online' ? 'Online' : 'Presencial'}</td>
                                    <td>
                                        ${cita.status === 'confirmada' ? 'Confirmada' : 
                                          cita.status === 'pendiente' ? 'Pendiente' : 
                                          cita.status === 'cancelada' ? 'Cancelada' : '—'}
                                    </td>
                                    <td>
                                        ${cita.status !== 'cancelada' && new Date(cita.date + 'T' + (cita.time || '00:00')) > new Date() ? `
                                            <button onclick="cancelAppointmentByPatient('${cita.id}', '${patient.rut}')" 
                                                style="background:var(--rojo-alerta); color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">
                                                Cancelar
                                            </button>
                                        ` : '—'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <p style="margin-top:20px; font-size:0.8rem;">Si deseas cancelar una cita, haz clic en "Cancelar".</p>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalContent);
}

export async function cancelAppointmentByPatient(appointmentId, patientRut) {
    let appointment = state.appointments.find(a => a.id == appointmentId);
    let isPending = false;
    if (!appointment) {
        appointment = state.pendingRequests.find(r => r.id == appointmentId);
        isPending = true;
    }
    if (!appointment) {
        showToast('Cita no encontrada', 'error');
        return;
    }
    
    const patient = state.patients.find(p => p.id == appointment.patientId);
    if (!patient || normalizarRut(patient.rut) !== normalizarRut(patientRut)) {
        showToast('No tienes permiso para cancelar esta cita', 'error');
        return;
    }
    
    if (!confirm('¿Cancelar esta cita? Esta acción no se puede deshacer.')) return;
    
    if (isPending) {
        state.setPendingRequests(state.pendingRequests.filter(r => r.id != appointmentId));
    } else {
        state.setAppointments(state.appointments.filter(a => a.id != appointmentId));
    }
    
    await save();
    showToast('Cita cancelada correctamente', 'success');
    
    const modal = document.getElementById('modalCitasPaciente');
    if (modal) modal.remove();
}

// ============================================
// EXPOSICIÓN AL OBJETO WINDOW
// ============================================
window.openBooking = openBooking;
window.updateBookingDetails = updateBookingDetails;
window.updateAvailableTimes = updateAvailableTimes;
window.searchPatientByRutBooking = searchPatientByRutBooking;
window.checkOnlineAvailability = checkOnlineAvailability;
window.executeBooking = executeBooking;
window.showPaymentDetails = showPaymentDetails;
window.confirmPayment = confirmPayment;
window.confirmPresencialTime = confirmPresencialTime;
window.renderPendingRequests = renderPendingRequests;
window.showConfirmRequestModal = showConfirmRequestModal;
window.rejectRequest = rejectRequest;
window.cancelAppointment = cancelAppointment;
window.showTherapistBookingModal = showTherapistBookingModal;
window.searchPatientByRutTherapist = searchPatientByRutTherapist;
window.updateTherapistBookingDetails = updateTherapistBookingDetails;
window.executeTherapistBooking = executeTherapistBooking;
window.renderAppointments = renderAppointments;
window.selectTimeSlot = selectTimeSlot;
window.selectTimePref = selectTimePref;
window.showPatientAppointmentsByRut = showPatientAppointmentsByRut;
window.cancelAppointmentByPatient = cancelAppointmentByPatient;
window.calcularEdad = window.calcularEdad; // ya existe

console.log('✅ citas.js refactorizado: modular, async/await, validación centralizada, sin duplicación');