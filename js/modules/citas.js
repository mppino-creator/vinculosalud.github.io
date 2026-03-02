// js/modules/citas.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast, validarRut, sendEmailNotification, formatDate } from './utils.js';

// ============================================
// VARIABLE GLOBAL PARA HORA SELECCIONADA (INMUNE A CAMBIOS DEL DOM)
// ============================================
window.horaSeleccionada = null;

// ============================================
// FUNCIÓN ÚNICA PARA SELECCIONAR HORARIO - VERSIÓN DEFINITIVA
// ============================================
if (typeof window !== 'undefined') {
    // Esta es la ÚNICA función que se ejecutará
    window.selectTimeSlot = function(time) {
        console.log('🎯 [SELECT] Seleccionando horario:', time);
        
        // GUARDAR EN VARIABLE GLOBAL (esto NO se pierde nunca)
        window.horaSeleccionada = time;
        console.log('✅ Hora guardada en variable global:', window.horaSeleccionada);
        
        // Remover selección anterior de todos los botones
        document.querySelectorAll('.time-slot-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Seleccionar el nuevo botón
        const btn = document.querySelector(`.time-slot-btn[data-time="${time}"]`);
        if (btn) {
            btn.classList.add('selected');
            console.log('✅ Botón marcado como seleccionado:', time);
        } else {
            console.warn('⚠️ Botón no encontrado para:', time);
        }
        
        // Actualizar el select oculto
        const select = document.getElementById('custTime');
        if (select) {
            select.value = time;
            console.log('✅ Select actualizado a:', time);
            
            // Disparar evento change para cualquier listener
            select.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
            console.error('❌ Elemento #custTime no encontrado');
        }
        
        // Actualizar detalles de la reserva
        if (typeof window.updateBookingDetails === 'function') {
            window.updateBookingDetails();
        } else if (typeof updateBookingDetails === 'function') {
            updateBookingDetails();
        }
        
        console.log('✅ Horario procesado completamente:', time);
        return true;
    };
    
    // Función para preferencias AM/PM
    window.selectTimePref = function(pref) {
        console.log('📅 [PREF] Preferencia seleccionada:', pref);
        const panel = document.getElementById('bookingPanel');
        if (panel) {
            panel.dataset.timePref = pref;
        }
        if (pref && window.showToast) {
            window.showToast(`Preferencia: ${pref === 'AM' ? 'Mañana' : 'Tarde'}`, 'info');
        }
    };
    
    console.log('✅ Funciones de horarios instaladas (versión única)');
}

// Eliminar posibles funciones residuales
window._realSelectTimeSlot = undefined;
window._realSelectTimePref = undefined;

// Verificar que quedó asignada correctamente
console.log('✅ Verificación final:', {
    selectTimeSlot: typeof window.selectTimeSlot,
    selectTimePref: typeof window.selectTimePref
});

// ============================================
// FUNCIÓN AUXILIAR PARA CLASIFICAR HORARIOS
// ============================================

/**
 * Clasifica una hora en AM o PM
 * @param {string} time - Hora en formato HH:MM
 * @returns {string} 'AM' o 'PM'
 */
function getTimePeriod(time) {
    const hour = parseInt(time.split(':')[0]);
    return hour < 12 ? 'AM' : 'PM';
}

// ============================================
// FUNCIONES EXPORTADAS
// ============================================

export function openBooking(id) {
    console.log("🔍 Abriendo reserva para ID:", id);
    
    const psych = state.staff.find(p => p.id == id);
    if (!psych) {
        console.error("❌ Psicólogo no encontrado");
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
    
    loadPaymentMethods();
    
    document.getElementById('paymentDetails').style.display = 'none';
    document.getElementById('paymentLinkContainer').style.display = 'none';
    
    updateBookingDetails();
    document.getElementById('emailSimulation').style.display = 'none';
    updateAvailableTimes();
}

function loadPaymentMethods() {
    const select = document.getElementById('paymentMethod');
    if (!select) {
        console.log("ℹ️ Elemento paymentMethod no encontrado");
        return;
    }
    
    select.innerHTML = '<option value="">Selecciona método de pago</option>';

    const methods = state.selectedPsych.paymentMethods || state.globalPaymentMethods;

    if (methods.transfer) {
        select.innerHTML += '<option value="transfer">Transferencia Bancaria</option>';
    }
    if (methods.cardPresencial) {
        select.innerHTML += '<option value="card-presencial">Tarjeta (en consulta)</option>';
    }
    if (methods.cash) {
        select.innerHTML += '<option value="cash">Efectivo (en consulta)</option>';
    }
    if (methods.cardOnline) {
        select.innerHTML += '<option value="card-online">Tarjeta Online</option>';
    }
    if (methods.mercadopago) {
        select.innerHTML += '<option value="mercadopago">Mercado Pago</option>';
    }
    if (methods.webpay) {
        select.innerHTML += '<option value="webpay">Webpay</option>';
    }
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
                <i class="fa fa-info-circle"></i> 
                💡 Realiza la transferencia. El profesional confirmará el pago antes de la cita.
            </p>
        `;
    }
    
    if (method === 'card-presencial') {
        detailsDiv.style.display = 'block';
        detailsDiv.innerHTML = `
            <div style="background: #e8f4fd; padding: 15px; border-radius: 8px;">
                <i class="fa fa-info-circle" style="color: var(--azul-medico);"></i>
                <strong>Pago en consulta</strong>
                <p style="margin-top:10px; font-size:0.9rem;">
                    El pago se realizará en el consultorio. El profesional confirmará el pago después de la atención.
                </p>
            </div>
        `;
    }
    
    if (method === 'cash') {
        detailsDiv.style.display = 'block';
        detailsDiv.innerHTML = `
            <div style="background: #e8f4fd; padding: 15px; border-radius: 8px;">
                <i class="fa fa-info-circle" style="color: var(--azul-medico);"></i>
                <strong>Pago en efectivo</strong>
                <p style="margin-top:10px; font-size:0.9rem;">
                    El pago se realizará en efectivo en el consultorio.
                </p>
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
                    <p>Haz clic en el botón para realizar el pago:</p>
                    <a href="${link}" target="_blank" class="btn-staff" style="display:inline-block; background:var(--verde-exito); color:white; padding:12px 30px; border-radius:30px; text-decoration:none; margin:15px 0;">
                        <i class="fa fa-credit-card"></i> Ir a pagar
                    </a>
                    <p style="font-size:0.8rem; color:#666;">Después del pago, vuelve a esta página para confirmar tu cita.</p>
                </div>
            `;
        } else {
            showToast('Link de pago no disponible', 'warning');
        }
    }
}

// ============================================
// FUNCIÓN PRINCIPAL DE HORARIOS AM/PM
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

    // Ocultar todo mientras se carga
    if (amContainer) amContainer.style.display = 'none';
    if (pmContainer) pmContainer.style.display = 'none';
    if (timeSelect) timeSelect.style.display = 'none';
    if (noSlotsMessage) noSlotsMessage.style.display = 'none';

    if (type === 'presencial') {
        if (presencialWarning) {
            presencialWarning.style.display = 'block';
            presencialWarning.innerHTML = `
                <i class="fa fa-info-circle" style="color: var(--azul-medico);"></i> 
                <strong>Solicitud Presencial:</strong> El profesional confirmará la hora.
                <div style="margin-top:15px; padding:10px; background:#f8fafc; border-radius:8px;">
                    <label style="display:block; margin-bottom:8px; color:var(--texto-primario);">Preferencia de horario (opcional):</label>
                    <div style="display:flex; gap:15px; justify-content:center;">
                        <label style="display:flex; align-items:center; gap:5px;">
                            <input type="radio" name="presencialTimePref" value="AM" onchange="selectTimePref('AM')"> Mañana (AM)
                        </label>
                        <label style="display:flex; align-items:center; gap:5px;">
                            <input type="radio" name="presencialTimePref" value="PM" onchange="selectTimePref('PM')"> Tarde (PM)
                        </label>
                        <label style="display:flex; align-items:center; gap:5px;">
                            <input type="radio" name="presencialTimePref" value="" checked> Sin preferencia
                        </label>
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
            noSlotsMessage.innerHTML = 'No hay horarios disponibles para esta fecha';
        }
        if (onlineMsg) onlineMsg.style.display = 'none';
        return;
    }

    const bookedTimes = state.appointments
        .filter(a => a.psychId == state.selectedPsych.id && a.date === date && a.status === 'confirmada')
        .map(a => a.time);

    const now = new Date();
    const availableTimes = availableSlots
        .filter(slot => !bookedTimes.includes(slot.time))
        .filter(slot => new Date(date + 'T' + slot.time) > now)
        .sort((a, b) => a.time.localeCompare(b.time));

    if (availableTimes.length === 0) {
        if (noSlotsMessage) {
            noSlotsMessage.style.display = 'block';
            noSlotsMessage.innerHTML = 'No hay horarios disponibles para esta fecha';
        }
        if (onlineMsg) onlineMsg.style.display = 'none';
        return;
    }

    // Separar horarios AM y PM
    const amTimes = availableTimes.filter(slot => getTimePeriod(slot.time) === 'AM');
    const pmTimes = availableTimes.filter(slot => getTimePeriod(slot.time) === 'PM');

    // Renderizar horarios AM
    if (amTimes.length > 0 && amSlotsContainer) {
        amSlotsContainer.innerHTML = amTimes.map(slot => `
            <div class="time-slot-btn ${slot.isOvercupo ? 'overcupo' : ''}" 
                 onclick="selectTimeSlot('${slot.time}')"
                 data-time="${slot.time}">
                ${slot.time}
            </div>
        `).join('');
        amContainer.style.display = 'block';
    } else if (amContainer) {
        amContainer.style.display = 'none';
    }

    // Renderizar horarios PM
    if (pmTimes.length > 0 && pmSlotsContainer) {
        pmSlotsContainer.innerHTML = pmTimes.map(slot => `
            <div class="time-slot-btn ${slot.isOvercupo ? 'overcupo' : ''}" 
                 onclick="selectTimeSlot('${slot.time}')"
                 data-time="${slot.time}">
                ${slot.time}
            </div>
        `).join('');
        pmContainer.style.display = 'block';
    } else if (pmContainer) {
        pmContainer.style.display = 'none';
    }

    if (onlineMsg) {
        onlineMsg.style.display = 'block';
        onlineMsg.innerHTML = '<i class="fa fa-check-circle" style="color: var(--verde-exito);"></i> Horarios disponibles';
    }

    // IMPORTANTE: No limpiar el select si ya hay una hora seleccionada
    // Solo limpiar si no hay horarios disponibles Y no hay hora seleccionada
    const currentSelectedTime = timeSelect ? timeSelect.value : '';
    
    if (availableTimes.length === 0) {
        // Si no hay horarios, limpiar todo
        const selectedSlot = document.querySelector('.time-slot-btn.selected');
        if (selectedSlot) {
            selectedSlot.classList.remove('selected');
        }
        if (timeSelect) {
            timeSelect.value = '';
        }
        // También limpiar variable global
        window.horaSeleccionada = null;
    } else if (!currentSelectedTime) {
        // Verificar si hay hora guardada en variable global
        console.log('🔍 Select vacío, revisando variable global...');
        
        if (window.horaSeleccionada) {
            console.log('✅ Hora encontrada en variable global:', window.horaSeleccionada);
            // Verificar si la hora sigue siendo válida
            const horaValida = availableTimes.some(slot => slot.time === window.horaSeleccionada);
            if (horaValida) {
                if (timeSelect) {
                    timeSelect.value = window.horaSeleccionada;
                    console.log('✅ Select restaurado desde variable global a:', window.horaSeleccionada);
                }
                // También restaurar la clase selected en el botón correspondiente
                const btn = document.querySelector(`.time-slot-btn[data-time="${window.horaSeleccionada}"]`);
                if (btn) {
                    btn.classList.add('selected');
                }
            } else {
                console.log('⚠️ Hora en variable global ya no es válida, limpiando');
                window.horaSeleccionada = null;
                console.log('📅 No hay hora seleccionada, mostrando horarios disponibles');
            }
        } else {
            console.log('❌ No hay hora en variable global');
            console.log('📅 No hay hora seleccionada, mostrando horarios disponibles');
        }
    } else {
        // Verificar si la hora seleccionada sigue siendo válida
        const selectedTimeStillValid = availableTimes.some(slot => slot.time === currentSelectedTime);
        if (!selectedTimeStillValid) {
            console.log('⚠️ La hora seleccionada ya no está disponible, limpiando selección');
            const selectedSlot = document.querySelector('.time-slot-btn.selected');
            if (selectedSlot) {
                selectedSlot.classList.remove('selected');
            }
            if (timeSelect) {
                timeSelect.value = '';
            }
            window.horaSeleccionada = null;
        } else {
            console.log('✅ Hora seleccionada sigue siendo válida:', currentSelectedTime);
            // Actualizar variable global para mantener consistencia
            window.horaSeleccionada = currentSelectedTime;
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

    const patient = state.patients.find(p => p.rut === rut);
    if (patient) {
        document.getElementById('custName').value = patient.name || '';
        document.getElementById('custEmail').value = patient.email || '';
        document.getElementById('custPhone').value = patient.phone || '';
        showToast('Datos del paciente cargados', 'success');
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
        showToast('No tienes permiso para confirmar este pago', 'error');
        return;
    }
    
    appointment.paymentStatus = 'pagado';
    appointment.paymentConfirmedBy = state.currentUser?.data?.name || 'Admin';
    appointment.paymentConfirmedAt = new Date().toISOString();
    
    if (appointment.status === 'pendiente' && appointment.type === 'online') {
        appointment.status = 'confirmada';
    }
    
    import('../main.js').then(main => {
        main.save();
        showToast('✅ Pago confirmado correctamente', 'success');
        
        if (typeof window.updateStats === 'function') window.updateStats();
        renderPendingRequests();
        renderAppointments();
    });
    
    if (appointment.patientEmail) {
        setTimeout(() => {
            sendEmailNotification(
                appointment.patientEmail,
                'Pago confirmado - Vínculo Salud',
                `Hola ${appointment.patient},\n\nTu pago por la cita con ${appointment.psych} ha sido confirmado.\n\n💰 Monto: $${appointment.price}\n📅 Fecha: ${appointment.date}\n\nVínculo Salud`,
                'pago_confirmado',
                appointment.patient,
                appointment
            );
        }, 100);
    }
}

export function rejectPayment(appointmentId) {
    console.log('❌ Rechazando pago para:', appointmentId);
    
    const appointment = state.appointments.find(a => a.id == appointmentId) || 
                       state.pendingRequests.find(p => p.id == appointmentId);
    
    if (!appointment) {
        showToast('Cita no encontrada', 'error');
        return;
    }
    
    if (!confirm('¿Estás seguro de rechazar este pago? Se notificará al paciente.')) return;
    
    appointment.paymentStatus = 'rechazado';
    appointment.status = 'cancelada';
    
    import('../main.js').then(main => {
        main.save();
        showToast('✅ Pago rechazado', 'success');
        renderPendingRequests();
        renderAppointments();
    });
    
    if (appointment.patientEmail) {
        setTimeout(() => {
            sendEmailNotification(
                appointment.patientEmail,
                'Pago no confirmado - Vínculo Salud',
                `Hola ${appointment.patient},\n\nEl pago de tu cita con ${appointment.psych} no pudo ser confirmado. Por favor, contacta al profesional.\n\nVínculo Salud`,
                'pago_rechazado',
                appointment.patient,
                appointment
            );
        }, 100);
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
        confirmedBy: state.currentUser?.data?.name
    };
    
    state.appointments.push(appointment);
    state.setPendingRequests(state.pendingRequests.filter(r => r.id != requestId));
    
    import('../main.js').then(main => main.save());
    showToast('✅ Cita confirmada', 'success');
    
    if (request.patientEmail) {
        setTimeout(() => {
            sendEmailNotification(
                request.patientEmail,
                'Cita confirmada - Vínculo Salud',
                `Hola ${request.patient},\n\nTu cita presencial ha sido confirmada.\n\n📅 Fecha: ${date}\n⏰ Hora: ${time}\n👨‍⚕️ Profesional: ${request.psych}\n\nVínculo Salud`,
                'cita_confirmada',
                request.patient,
                appointment
            );
        }, 100);
    }
}

// ============================================
// FUNCIÓN EXECUTEBOOKING (SIMPLIFICADA Y MEJORADA)
// ============================================

export function executeBooking() {
    console.log('🚀 Ejecutando reserva...');
    
    const rut = document.getElementById('custRut').value;
    const name = document.getElementById('custName').value;
    const email = document.getElementById('custEmail').value;
    const phone = document.getElementById('custPhone').value;
    const date = document.getElementById('custDate').value;
    const type = document.getElementById('appointmentType').value;
    const paymentMethod = document.getElementById('paymentMethod')?.value;
    const msg = document.getElementById('custMsg').value;
    const acceptPolicy = document.getElementById('acceptPolicy').checked;

    // ✅ VALIDACIONES BÁSICAS
    if (!rut || !name || !email || !date) {
        showToast('Completa todos los campos obligatorios', 'error');
        return;
    }

    if (!validarRut(rut)) {
        showToast('RUT inválido', 'error');
        return;
    }

    if (!paymentMethod) {
        showToast('Selecciona un método de pago', 'error');
        return;
    }

    if (!acceptPolicy) {
        showToast('Debes aceptar la política de cancelación', 'error');
        return;
    }

    // ============================================
    // ✅ OBTENER HORA - PRIMERO VARIABLE GLOBAL, LUEGO SELECT
    // ============================================
    
    let time = '';
    
    // 1. Primero intentar con variable global (ES LO MÁS CONFIABLE)
    if (window.horaSeleccionada) {
        time = window.horaSeleccionada;
        console.log('⏰ Hora desde variable global:', time);
    }
    
    // 2. Si no hay variable global, intentar con el select
    if (!time) {
        const timeSelect = document.getElementById('custTime');
        time = timeSelect ? timeSelect.value : '';
        console.log('⏰ Hora desde select (fallback):', time ? time : '(vacío)');
    }
    
    // 3. Si no hay hora en select, buscar botón seleccionado
    if (!time) {
        const selectedBtn = document.querySelector('.time-slot-btn.selected');
        if (selectedBtn && selectedBtn.dataset.time) {
            time = selectedBtn.dataset.time;
            console.log('⏰ Hora desde botón seleccionado (último recurso):', time);
            
            // Actualizar el select y variable global
            const timeSelect = document.getElementById('custTime');
            if (timeSelect) {
                timeSelect.value = time;
            }
            window.horaSeleccionada = time;
        }
    }
    
    // 4. Si aún no hay hora, buscar en el panel data
    if (!time) {
        const bookingPanel = document.getElementById('bookingPanel');
        if (bookingPanel && bookingPanel.dataset.selectedTime) {
            time = bookingPanel.dataset.selectedTime;
            console.log('⏰ Hora desde panel data:', time);
        }
    }

    // ============================================
    // ✅ VALIDACIÓN DE HORA SEGÚN TIPO
    // ============================================
    
    if (type === 'online' && !time) {
        showToast('Selecciona un horario para la cita online', 'error');
        console.error('❌ No se pudo obtener la hora');
        return;
    }

    // Para presencial, la hora es opcional
    let horaFinal = time || 'Pendiente';
    
    // Obtener preferencia AM/PM para presencial
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
            // Buscar o crear paciente
            let patient = state.patients.find(p => p.rut === rut);
            if (!patient) {
                patient = {
                    id: Date.now(),
                    rut,
                    name,
                    email,
                    phone,
                    birthdate: '',
                    notes: '',
                    psychId: state.selectedPsych.id,
                    createdAt: new Date().toISOString(),
                    appointments: []
                };
                state.patients.push(patient);
            }

            const price = type === 'online' ? state.selectedPsych.priceOnline : state.selectedPsych.pricePresencial;

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
                preferredTime: time || null,
                preferredAMPM: preferenciaAMPM
            };

            if (type === 'online') {
                state.appointments.push(appointment);
                showToast('✅ Solicitud creada. El profesional confirmará el pago.', 'success');
            } else {
                state.pendingRequests.push(appointment);
                let mensaje = '✅ Solicitud enviada. El profesional confirmará hora y pago.';
                if (time) mensaje += ` (Preferencia: ${time})`;
                if (preferenciaAMPM) mensaje += ` ${preferenciaAMPM}`;
                showToast(mensaje, 'success');
            }

            // Enviar email
            if (email) {
                console.log('📧 Enviando email de confirmación a:', email);
                
                let mensajeEmail = `Hola ${name},\n\nHemos recibido tu solicitud de cita ${type === 'online' ? 'online' : 'presencial'}.\n\n` +
                    `📅 Fecha: ${date}\n`;
                
                if (type === 'online' && time) {
                    mensajeEmail += `⏰ Hora: ${time}\n`;
                } else if (type === 'presencial') {
                    if (time) mensajeEmail += `⏰ Preferencia de horario: ${time}\n`;
                    if (preferenciaAMPM) mensajeEmail += `⏰ Turno preferido: ${preferenciaAMPM === 'AM' ? 'Mañana' : 'Tarde'}\n`;
                }
                
                mensajeEmail += `👨‍⚕️ Profesional: ${state.selectedPsych.name}\n` +
                    `💰 Monto: $${price.toLocaleString()}\n` +
                    `💳 Método de pago: ${paymentMethod}\n\n` +
                    `El profesional confirmará el pago y la hora a la brevedad.\n\n` +
                    `Vínculo Salud - Centro de Bienestar`;

                setTimeout(() => {
                    sendEmailNotification(
                        email,
                        type === 'online' 
                            ? 'Solicitud de cita online - Vínculo Salud'
                            : 'Solicitud de cita presencial - Vínculo Salud',
                        mensajeEmail,
                        'solicitud_recibida',
                        name,
                        appointment
                    ).then(success => {
                        if (success) {
                            console.log('✅ Email enviado correctamente a:', email);
                            appointment.emailEnviado = true;
                        } else {
                            console.warn('⚠️ No se pudo enviar el email a:', email);
                        }
                    });
                }, 500);
            }

            await import('../main.js').then(main => main.save());

            bookBtn.innerHTML = originalText;
            bookBtn.disabled = false;
            
            setTimeout(() => {
                if (confirm('¿Quieres ver el listado de profesionales?')) {
                    location.reload();
                }
            }, 2000);

        } catch (error) {
            console.error('❌ Error en executeBooking:', error);
            showToast('Error al procesar la solicitud', 'error');
            bookBtn.innerHTML = originalText;
            bookBtn.disabled = false;
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
        tb.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:40px;">No hay citas confirmadas</td></tr>';
        return;
    }

    const sortedApps = [...appointmentsToShow].sort((a, b) => new Date(b.date) - new Date(a.date));

    tb.innerHTML = sortedApps.map(a => {
        const fechaHora = new Date(a.date + 'T' + a.time);
        const isPast = fechaHora < new Date();
        const paymentStatusColor = a.paymentStatus === 'pagado' ? '#34c759' : '#ff9500';
        const paymentStatusText = a.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente';
        const statusColor = isPast ? '#86868b' : '#34c759';
        const statusText = isPast ? 'Completada' : (a.status === 'confirmada' ? 'Confirmada' : 'Pendiente');
        
        return `
            <tr>
                <td><strong>${a.patient || '—'}</strong><br><small>${a.patientRut || ''}</small></td>
                <td>${a.psych || '—'}</td>
                <td>${a.date || '—'} <br><small>${a.time || '—'}</small></td>
                <td><span style="background:${a.type === 'online' ? '#34c759' : '#0071e3'}; color:white; padding:4px 8px; border-radius:6px; font-size:0.7rem;">${a.type === 'online' ? 'Online' : 'Presencial'}</span></td>
                <td>${a.boxName ? `<span style="background:#af52de; color:white; padding:4px 8px; border-radius:6px;">${a.boxName}</span>` : '—'}</td>
                <td><span style="color:${paymentStatusColor};">${paymentStatusText}<br><small>$${(a.price || 0).toLocaleString()}</small></span></td>
                <td><span style="color:${statusColor};">${statusText}</span></td>
                <td>
                    <div style="display:flex; gap:5px;">
                        ${a.paymentStatus !== 'pagado' ? `
                            <button onclick="confirmPayment('${a.id}')" class="btn-icon" style="background:#34c759; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer;" title="Confirmar pago">
                                <i class="fa fa-dollar-sign"></i>
                            </button>
                        ` : ''}
                        <button onclick="cancelAppointment('${a.id}')" class="btn-icon" style="background:#ff3b30; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer;" title="Cancelar cita">
                            <i class="fa fa-times"></i>
                        </button>
                    </div>
                    ${a.paymentConfirmedBy ? `<br><small style="font-size:0.6rem;">Pagado por: ${a.paymentConfirmedBy}</small>` : ''}
                    ${a.emailEnviado ? `<br><small style="color:#34c759;">📧 Email enviado</small>` : ''}
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
        tb.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:40px;">No hay solicitudes pendientes</td></tr>';
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
                ${tieneFicha ? '<span style="color:#34c759; font-size:0.6rem;">📋 Ficha completa</span>' : ''}
            </td>
            <td>${r.psych}</td>
            <td>${r.date}</td>
            <td>${r.time || 'A coordinar'}</td>
            <td><span class="badge ${r.type}">${r.type === 'online' ? 'Online' : 'Presencial'}</span></td>
            <td>${r.boxName || '—'}</td>
            <td>${r.msg ? r.msg.substring(0, 30) + (r.msg.length > 30 ? '...' : '') : '—'}</td>
            <td>
                <div style="display:flex; flex-direction:column; gap:5px;">
                    <span style="font-size:0.8rem; padding:2px 5px; background:${r.paymentStatus === 'pagado' ? '#e6f7e6' : '#fff3cd'}; border-radius:4px;">
                        Pago: ${r.paymentStatus === 'pagado' ? '✅ Confirmado' : '⏳ Pendiente'}
                    </span>
                    
                    <div style="display:flex; gap:5px; flex-wrap:wrap;">
                        ${r.paymentStatus !== 'pagado' ? `
                            <button onclick="confirmPayment('${r.id}')" class="btn-icon" style="background:#34c759; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">
                                <i class="fa fa-dollar-sign"></i> Pagado
                            </button>
                        ` : ''}
                        
                        ${r.type === 'presencial' && r.paymentStatus === 'pagado' ? `
                            <button onclick="showConfirmRequestModal('${r.id}')" class="btn-icon" style="background:#0071e3; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">
                                <i class="fa fa-check"></i> Confirmar
                            </button>
                        ` : ''}
                        
                        <button onclick="rejectRequest('${r.id}')" class="btn-icon" style="background:#ff3b30; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">
                            <i class="fa fa-times"></i> Rechazar
                        </button>
                    </div>
                    
                    ${r.paymentConfirmedBy ? `
                        <span style="font-size:0.7rem; color:#666;">
                            Pago: ${r.paymentConfirmedBy}
                        </span>
                    ` : ''}
                    ${r.emailEnviado ? `<span style="color:#34c759; font-size:0.7rem;">📧 Notificado</span>` : ''}
                </div>
            </td>
        </tr>
    `}).join('');
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

export function rejectRequest(requestId) {
    if (confirm('¿Rechazar esta solicitud?')) {
        const request = state.pendingRequests.find(r => r.id == requestId);
        state.setPendingRequests(state.pendingRequests.filter(r => r.id != requestId));

        if (request?.patientEmail) {
            setTimeout(() => {
                sendEmailNotification(
                    request.patientEmail,
                    'Solicitud no confirmada - Vínculo Salud',
                    `Hola ${request.patient},\n\nTu solicitud de cita no pudo ser confirmada. Por favor, contacta al profesional.\n\nVínculo Salud`,
                    'rechazo',
                    request.patient,
                    request
                );
            }, 100);
        }

        import('../main.js').then(main => main.save());
        showToast('Solicitud rechazada', 'success');
    }
}

// ============================================
// FUNCIONES PARA AGENDAR MANUALMENTE
// ============================================

export function showTherapistBookingModal() {
    state.setSelectedTherapistBoxId(null);
    state.setSelectedPatientForTherapist(null);
    window.currentRequestId = null;

    document.getElementById('therapistRut').value = '';
    document.getElementById('patientInfo').style.display = 'none';
    document.getElementById('therapistAppointmentType').value = 'online';
    document.getElementById('therapistDate').value = '';
    document.getElementById('therapistTime').innerHTML = '<option value="">Selecciona una fecha</option>';
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
        if (confirm('Paciente no encontrado. ¿Crear nuevo?')) {
            document.getElementById('patientRut').value = rut;
            document.getElementById('patientName').value = '';
            document.getElementById('patientEmail').value = '';
            document.getElementById('patientPhone').value = '';
            document.getElementById('patientModalTitle').innerText = 'Nuevo Paciente';
            document.getElementById('patientHistoryContainer').style.display = 'none';
            document.getElementById('patientStatsContainer').style.display = 'none';
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

    timeSelect.innerHTML = '<option value="">Selecciona un horario</option>';

    const now = new Date();
    availableSlots.forEach(slot => {
        if (!bookedTimes.includes(slot.time) && new Date(date + 'T' + slot.time) > now) {
            const option = document.createElement('option');
            option.value = slot.time;
            option.textContent = slot.time + (slot.isOvercupo ? ' (⚠️ Sobrecupo)' : '');
            if (slot.isOvercupo) option.style.color = '#f59e0b';
            timeSelect.appendChild(option);
        }
    });

    if (timeSelect.children.length === 1) {
        timeSelect.innerHTML = '<option value="">No hay horarios disponibles</option>';
    }
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
    
    if (state.selectedPatientForTherapist.email) {
        setTimeout(() => {
            sendEmailNotification(
                state.selectedPatientForTherapist.email,
                'Cita confirmada - Vínculo Salud',
                `Hola ${state.selectedPatientForTherapist.name},\n\nTu cita ha sido confirmada.\n\n📅 Fecha: ${date}\n⏰ Hora: ${time}\n👨‍⚕️ Profesional: ${state.currentUser.data.name}\n\nVínculo Salud`,
                'cita_confirmada',
                state.selectedPatientForTherapist.name,
                appointment
            ).then(success => {
                if (success) appointment.emailEnviado = true;
            });
        }, 100);
    }
    
    import('./auth.js').then(auth => auth.switchTab('citas'));
}

export function editAppointment(id) {
    showToast('Función de edición en desarrollo', 'info');
}

export function cancelAppointment(id) {
    if (confirm('¿Cancelar esta cita?')) {
        const appointment = state.appointments.find(a => a.id == id);
        state.setAppointments(state.appointments.filter(a => a.id != id));
        import('../main.js').then(main => main.save());
        showToast('Cita cancelada', 'success');
        
        if (appointment?.patientEmail) {
            setTimeout(() => {
                sendEmailNotification(
                    appointment.patientEmail,
                    'Cita cancelada - Vínculo Salud',
                    `Hola ${appointment.patient},\n\nTu cita ha sido cancelada.\n\nSi necesitas reagendar, por favor contacta al profesional.\n\nVínculo Salud`,
                    'cita_cancelada',
                    appointment.patient,
                    appointment
                );
            }, 100);
        }
    }
}

export function markAsPaid(id) {
    confirmPayment(id);
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

console.log('✅ citas.js cargado con agenda AM/PM y estadísticas');