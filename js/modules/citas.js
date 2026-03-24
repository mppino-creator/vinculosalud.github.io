// js/modules/citas.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast, validarRut, formatDate } from './utils.js';

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
// FUNCIÓN PARA NORMALIZAR FECHA (dd/mm/yyyy -> yyyy-mm-dd)
// ============================================
function normalizarFecha(fechaStr) {
    if (!fechaStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
        return fechaStr;
    }
    let partes = fechaStr.split(/[\/\-]/);
    if (partes.length === 3) {
        let dia = partes[0].padStart(2, '0');
        let mes = partes[1].padStart(2, '0');
        let año = partes[2];
        if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12 && año.length === 4) {
            return `${año}-${mes}-${dia}`;
        }
    }
    return '';
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

// ============================================
// FUNCIÓN PARA CONFIGURAR LA SECCIÓN TUTOR SEGÚN EDAD (SIEMPRE VISIBLE)
// ============================================
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
        if (tutorHelpText) {
            tutorHelpText.innerHTML = '<span style="color:#ff9500;"><i class="fa fa-exclamation-circle"></i> Obligatorio para menores de 18 años</span>';
        }
        if (tutorName) tutorName.required = true;
        if (tutorRut) tutorRut.required = true;
        if (tutorRelationship) tutorRelationship.required = true;
    } else {
        tutorSection.style.borderLeft = '3px solid #34c759';
        tutorSection.style.backgroundColor = '#f0f9f0';
        if (tutorHelpText) {
            tutorHelpText.innerHTML = '<span style="color:#34c759;"><i class="fa fa-info-circle"></i> Opcional (puedes dejar en blanco si no aplica)</span>';
        }
        if (tutorName) tutorName.required = false;
        if (tutorRut) tutorRut.required = false;
        if (tutorRelationship) tutorRelationship.required = false;
    }
}

// ============================================
// FUNCIÓN GLOBAL calcularEdad (mejorada)
// ============================================
window.calcularEdad = function() {
    console.log('📅 calcularEdad ejecutada');
    const birthdateRaw = document.getElementById('custBirthdate')?.value;
    
    if (!birthdateRaw) {
        document.getElementById('edadDisplay').innerHTML = '';
        configurarTutorSegunEdad(null);
        return;
    }
    
    let birthdate = normalizarFecha(birthdateRaw);
    if (!birthdate) {
        document.getElementById('edadDisplay').innerHTML = '<span style="color:red;">Formato inválido (usa dd/mm/aaaa)</span>';
        configurarTutorSegunEdad(null);
        return;
    }
    
    if (birthdate !== birthdateRaw) {
        document.getElementById('custBirthdate').value = birthdate;
    }
    
    const edad = calcularEdadDesdeFecha(birthdate);
    const edadDisplay = document.getElementById('edadDisplay');
    if (edadDisplay) {
        edadDisplay.innerHTML = `<strong>Edad:</strong> ${edad} años`;
    }
    
    configurarTutorSegunEdad(edad);
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
    
    // Limpiar campos
    const birthdate = document.getElementById('custBirthdate');
    if (birthdate) birthdate.value = '';
    const edadDisplay = document.getElementById('edadDisplay');
    if (edadDisplay) edadDisplay.innerHTML = '';
    
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
    
    configurarTutorSegunEdad(null);
    
    const birthdateInput = document.getElementById('custBirthdate');
    if (birthdateInput) {
        birthdateInput.removeEventListener('change', window.calcularEdad);
        birthdateInput.removeEventListener('input', window.calcularEdad);
        birthdateInput.addEventListener('change', window.calcularEdad);
        birthdateInput.addEventListener('input', window.calcularEdad);
        console.log('Eventos de fecha añadidos');
    } else {
        console.error('No se encontró el input de fecha');
    }
    
    loadPaymentMethods();
    document.getElementById('paymentDetails').style.display = 'none';
    document.getElementById('paymentLinkContainer').style.display = 'none';
    updateBookingDetails();
    document.getElementById('emailSimulation').style.display = 'none';
    updateAvailableTimes();
}

// ============================================
// FUNCIÓN PARA CARGAR MÉTODOS DE PAGO SEGÚN TIPO DE ATENCIÓN
// ============================================
function loadPaymentMethods() {
    const select = document.getElementById('paymentMethod');
    if (!select) return;
    
    const type = document.getElementById('appointmentType').value;
    const methods = state.selectedPsych.paymentMethods || state.globalPaymentMethods;

    select.innerHTML = '<option value="">Selecciona método de pago</option>';
    
    if (methods.transfer) {
        select.innerHTML += '<option value="transfer">Transferencia Bancaria</option>';
    }
    
    if (type === 'online') {
        if (methods.cardOnline) {
            select.innerHTML += '<option value="card-online">Tarjeta Online</option>';
        }
        if (methods.mercadopago) {
            select.innerHTML += '<option value="mercadopago">Mercado Pago</option>';
        }
        if (methods.webpay) {
            select.innerHTML += '<option value="webpay">Webpay</option>';
        }
    } else {
        if (methods.cardPresencial) {
            select.innerHTML += '<option value="card-presencial">Tarjeta (en consulta)</option>';
        }
        if (methods.cash) {
            select.innerHTML += '<option value="cash">Efectivo (en consulta)</option>';
        }
        if (methods.cardOnline) {
            select.innerHTML += '<option value="card-online-presencial">Tarjeta Online (pago anticipado)</option>';
        }
    }
}

// ============================================
// FUNCIÓN PARA MOSTRAR DETALLES DE PAGO SEGÚN MÉTODO Y TIPO
// ============================================
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

    const bookedAppointments = state.appointments
        .filter(a => a.psychId == state.selectedPsych.id && a.date === date && 
                (a.status === 'confirmada' || a.status === 'pendiente'))
        .map(a => a.time);
    
    const bookedRequests = state.pendingRequests
        .filter(r => r.psychId == state.selectedPsych.id && r.date === date && r.time && r.time !== 'Pendiente')
        .map(r => r.time);
    
    const bookedTimes = [...new Set([...bookedAppointments, ...bookedRequests])];
    
    console.log(`📅 Horarios ocupados para ${date}:`, bookedTimes);

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
    
    loadPaymentMethods();
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
        
        const birthdate = document.getElementById('custBirthdate');
        if (birthdate && patient.birthdate) {
            birthdate.value = patient.birthdate;
            if (typeof window.calcularEdad === 'function') {
                window.calcularEdad();
            }
        }
        
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
    }
}

export function checkOnlineAvailability() {
    const date = document.getElementById('custDate').value;
    const time = document.getElementById('custTime').value;
    const type = document.getElementById('appointmentType').value;
    
    if (type === 'online' && date && time) {
        return new Date(date + 'T' + time) > new Date();
    }
    return true;
}

let bookingEnProceso = false;

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
    
    // Validación simple de email (no se envía correo)
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
    const tutorRut = document.getElementById('tutorRut')?.value;
    const tutorRelationship = document.getElementById('tutorRelationship')?.value;
    
    if (tutorName && tutorRut && tutorRelationship) {
        tutorData = {
            nombre: tutorName,
            rut: tutorRut,
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

    // ============================================
    // VALIDACIÓN DE HORARIO OCUPADO (MEJORADA)
    // ============================================
    if (type === 'online' && time) {
        // Verificar en appointments y pendingRequests
        const ocupado = state.appointments.some(a => 
            a.psychId == state.selectedPsych.id && 
            a.date === date && 
            a.time === time && 
            (a.status === 'confirmada' || a.status === 'pendiente')
        ) || state.pendingRequests.some(r => 
            r.psychId == state.selectedPsych.id && 
            r.date === date && 
            r.time === time && 
            r.time !== 'Pendiente'
        );
        
        if (ocupado) {
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

    setTimeout(async () => {
        try {
            let patient = state.patients.find(p => p.rut === rut);
            
            if (!patient) {
                const edad = birthdate ? calcularEdadDesdeFecha(birthdate) : 0;
                patient = {
                    id: Date.now(),
                    rut,
                    name,
                    email,
                    phone,
                    birthdate: birthdate,
                    edad: edad,
                    tutor: (edad < 18 && tutorData) ? tutorData : null,
                    notes: msg || '',
                    psychId: state.selectedPsych.id,
                    createdAt: new Date().toISOString(),
                    appointments: []
                };
                
                state.patients.push(patient);
                try {
                    await import('../main.js').then(main => main.save());
                } catch (saveError) {
                    console.error('❌ Error guardando paciente:', saveError);
                }
            } else {
                let datosActualizados = false;
                if (!patient.birthdate && birthdate) {
                    patient.birthdate = birthdate;
                    patient.edad = calcularEdadDesdeFecha(birthdate);
                    datosActualizados = true;
                }
                if (tutorData && patient.edad < 18) {
                    if (!patient.tutor || 
                        patient.tutor.nombre !== tutorData.nombre ||
                        patient.tutor.rut !== tutorData.rut) {
                        patient.tutor = tutorData;
                        datosActualizados = true;
                    }
                } else if (tutorData && patient.edad >= 18) {
                    patient.tutor = tutorData;
                    datosActualizados = true;
                }
                if (!patient.psychId && state.selectedPsych) {
                    patient.psychId = state.selectedPsych.id;
                    datosActualizados = true;
                }
                if (datosActualizados) {
                    try {
                        await import('../main.js').then(main => main.save());
                    } catch (saveError) {
                        console.error('❌ Error actualizando paciente:', saveError);
                    }
                }
            }

            const price = type === 'online' ? state.selectedPsych.priceOnline : state.selectedPsych.pricePresencial;

            // Crear appointment asegurando que patientTutor nunca sea undefined
            const appointment = {
                id: Date.now(),
                patientId: patient.id,
                patient: name,
                patientRut: rut,
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
                patientTutor: patient.tutor || null   // ← Asegurar null si no hay tutor
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

            // ============================================
            // NO SE ENVÍA CORREO (ELIMINADO)
            // ============================================

            await import('../main.js').then(main => main.save());
            window.horaSeleccionada = null;
            
            // Forzar actualización de horarios después de guardar
            setTimeout(() => {
                if (typeof updateAvailableTimes === 'function') updateAvailableTimes();
            }, 300);

            bookBtn.innerHTML = originalText;
            bookBtn.disabled = false;
            bookingEnProceso = false;

            // Mostrar mensaje con instrucciones para consultar citas
            setTimeout(() => {
                if (confirm('✅ Cita registrada.\n\nPuedes consultar tus citas ingresando tu RUT en la sección "Mis citas".\n\n¿Volver al listado de profesionales?')) {
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

export function cancelAppointment(id) {
    if (!confirm('¿Cancelar cita?')) return;
    
    const appointment = state.appointments.find(a => a.id == id);
    if (!appointment) {
        showToast('Cita no encontrada', 'error');
        return;
    }
    
    state.setAppointments(state.appointments.filter(a => a.id != id));
    
    import('../main.js').then(main => {
        main.save();
        showToast('Cita cancelada', 'success');
        if (typeof renderAppointments === 'function') renderAppointments();
        if (typeof updateAvailableTimes === 'function') updateAvailableTimes();
    });
}

export function rejectRequest(requestId) {
    if (!confirm('¿Rechazar solicitud?')) return;
    
    const request = state.pendingRequests.find(r => r.id == requestId);
    if (!request) return;
    
    state.setPendingRequests(state.pendingRequests.filter(r => r.id != requestId));
    
    import('../main.js').then(main => {
        main.save();
        showToast('Solicitud rechazada', 'success');
        renderPendingRequests();
    });
}

export function showPatientAppointmentsByRut() {
    const rut = prompt('Ingresa tu RUT para consultar tus citas (formato 12.345.678-9):');
    if (!rut) return;
    
    const rutLimpio = rut.replace(/[.-]/g, '');
    const patient = state.patients.find(p => p.rut === rut || p.rut.replace(/[.-]/g, '') === rutLimpio);
    
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
    if (!patient || (patient.rut !== patientRut && patient.rut.replace(/[.-]/g, '') !== patientRut.replace(/[.-]/g, ''))) {
        showToast('No tienes permiso para cancelar esta cita', 'error');
        return;
    }
    
    if (!confirm('¿Cancelar esta cita? Esta acción no se puede deshacer.')) return;
    
    if (isPending) {
        state.setPendingRequests(state.pendingRequests.filter(r => r.id != appointmentId));
    } else {
        state.setAppointments(state.appointments.filter(a => a.id != appointmentId));
    }
    
    await import('../main.js').then(main => main.save());
    showToast('Cita cancelada correctamente', 'success');
    
    const modal = document.getElementById('modalCitasPaciente');
    if (modal) modal.remove();
    showToast('Cancelación realizada.', 'success');
}

// ============================================
// RENDERIZADO DE TABLAS (simplificado)
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
        tb.innerHTML = '<td colspan="8" style="text-align:center; padding:40px;">No hay citas</td>';
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
                <td>—</td>
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
        tb.innerHTML = '<td colspan="9" style="text-align:center; padding:40px;">No hay solicitudes</td>';
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
                <td>—</td>
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

export function confirmPayment(appointmentId) {
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
        document.getElementById('therapistBoxField').style.display = 'none';
        document.getElementById('therapistBoxDisplay').style.display = 'none';
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
    
    import('./auth.js').then(auth => auth.switchTab('citas'));
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
window.calcularEdad = window.calcularEdad;

console.log('✅ citas.js simplificado: sin correos, validación de horarios duplicados y consulta por RUT');