// js/modules/citas.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast, validarRut, sendEmailNotification } from './utils.js';

// ============================================
// FUNCIONES EXPORTADAS (se llaman desde el HTML)
// ============================================

export function openBooking(id) {
    console.log("🔍 Abriendo reserva para ID:", id);
    
    // Buscar el psicólogo
    const psych = state.staff.find(p => p.id == id);
    if (!psych) {
        console.error("❌ Psicólogo no encontrado");
        showToast('Profesional no encontrado', 'error');
        return;
    }
    
    state.setSelectedPsych(psych);
    state.setSelectedBoxId(null);

    const today = new Date().toISOString().split('T')[0];
    
    // Mostrar el panel de reserva
    document.getElementById('clientView').style.display = 'none';
    document.getElementById('bookingPanel').style.display = 'block';
    
    // Llenar datos básicos
    document.getElementById('psychName').innerText = psych.name;
    document.getElementById('psychSelectedName').innerText = psych.name;
    document.getElementById('psychSelectedSpec').innerText = Array.isArray(psych.spec) ? psych.spec.join(' · ') : psych.spec;
    document.getElementById('custDate').min = today;
    document.getElementById('custDate').value = today;
    document.getElementById('bookingDuration').innerText = (psych.sessionDuration || 45) + ' minutos';
    
    // Cargar métodos de pago
    loadPaymentMethods();
    
    // Ocultar contenedores de pago al inicio
    document.getElementById('paymentDetails').style.display = 'none';
    document.getElementById('paymentLinkContainer').style.display = 'none';
    
    // Actualizar detalles
    updateBookingDetails();
    document.getElementById('emailSimulation').style.display = 'none';
    updateAvailableTimes();
}

// Función de carga de métodos de pago
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
}

// ============================================
// FUNCIÓN PARA MOSTRAR DATOS BANCARIOS
// ============================================
export function showPaymentDetails() {
    const method = document.getElementById('paymentMethod')?.value;
    const detailsDiv = document.getElementById('paymentDetails');
    const type = document.getElementById('appointmentType').value;
    
    // Ocultar todo primero
    if (detailsDiv) detailsDiv.style.display = 'none';
    
    // Si no hay método seleccionado, salir
    if (!method) return;
    
    // TRANSFERENCIA BANCARIA - Mostrar datos bancarios
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
    
    // TARJETA PRESENCIAL
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
    
    // EFECTIVO
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
}

export function updateAvailableTimes() {
    const date = document.getElementById('custDate').value;
    const type = document.getElementById('appointmentType').value;
    const timeSelect = document.getElementById('custTime');
    const onlineMsg = document.getElementById('onlineAvailabilityMsg');
    const presencialWarning = document.getElementById('presencialWarning');

    if (!date || !state.selectedPsych) return;

    timeSelect.innerHTML = '<option value="">Cargando horarios...</option>';

    if (type === 'presencial') {
        timeSelect.innerHTML = '<option value="">La hora se coordinará con el profesional</option>';
        timeSelect.disabled = true;
        presencialWarning.style.display = 'block';
        onlineMsg.style.display = 'none';
        return;
    }

    timeSelect.disabled = false;
    presencialWarning.style.display = 'none';
    
    const availableSlots = state.selectedPsych.availability?.[date] || [];

    if (availableSlots.length === 0) {
        timeSelect.innerHTML = '<option value="">No hay horarios disponibles</option>';
        onlineMsg.style.display = 'none';
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
        timeSelect.innerHTML = '<option value="">No hay horarios disponibles</option>';
        onlineMsg.style.display = 'none';
        return;
    }

    timeSelect.innerHTML = '<option value="">Selecciona un horario</option>';
    availableTimes.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot.time;
        option.textContent = slot.time + (slot.isOvercupo ? ' (Sobrecupo)' : '');
        if (slot.isOvercupo) option.style.color = '#f59e0b';
        timeSelect.appendChild(option);
    });

    onlineMsg.style.display = 'block';
    onlineMsg.innerHTML = '<i class="fa fa-info-circle"></i> Horarios disponibles';
}

export function updateBookingDetails() {
    const type = document.getElementById('appointmentType').value;
    const price = type === 'online' ? state.selectedPsych.priceOnline : state.selectedPsych.pricePresencial;

    document.getElementById('bookingPrice').innerText = `$${price.toLocaleString()}`;
    document.getElementById('bookingType').innerText = type === 'online' ? 'Online' : 'Presencial';
    
    document.getElementById('paymentDetails').style.display = 'none';
    
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
// NUEVA FUNCIÓN: CONFIRMAR PAGO
// ============================================
export function confirmPayment(appointmentId) {
    console.log('💰 Confirmando pago para:', appointmentId);
    
    // Buscar en appointments o pendingRequests
    const appointment = state.appointments.find(a => a.id == appointmentId) || 
                       state.pendingRequests.find(p => p.id == appointmentId);
    
    if (!appointment) {
        showToast('Cita no encontrada', 'error');
        return;
    }
    
    // Verificar permisos
    if (state.currentUser?.role !== 'admin' && state.currentUser?.data?.id != appointment.psychId) {
        showToast('No tienes permiso para confirmar este pago', 'error');
        return;
    }
    
    // Confirmar pago
    appointment.paymentStatus = 'pagado';
    appointment.paymentConfirmedBy = state.currentUser?.data?.name || 'Admin';
    appointment.paymentConfirmedAt = new Date().toISOString();
    
    // Si la cita estaba pendiente y ya se pagó, actualizar estado
    if (appointment.status === 'pendiente' && appointment.type === 'online') {
        appointment.status = 'confirmada';
    }
    
    // Guardar cambios
    import('../main.js').then(main => {
        main.save();
        showToast('✅ Pago confirmado correctamente', 'success');
        
        // Actualizar vistas
        if (typeof window.updateStats === 'function') window.updateStats();
        renderPendingRequests();
    });
    
    // Notificar al paciente
    if (appointment.patientEmail) {
        sendEmailNotification(
            appointment.patientEmail,
            'Pago confirmado - Vínculo Salud',
            `Hola ${appointment.patient},\n\nTu pago por la cita con ${appointment.psych} ha sido confirmado.\n\n💰 Monto: $${appointment.price}\n📅 Fecha: ${appointment.date}\n\nVínculo Salud`,
            'pago_confirmado',
            appointment.patient
        );
    }
}

// ============================================
// NUEVA FUNCIÓN: RECHAZAR PAGO
// ============================================
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
    });
    
    if (appointment.patientEmail) {
        sendEmailNotification(
            appointment.patientEmail,
            'Pago no confirmado - Vínculo Salud',
            `Hola ${appointment.patient},\n\nEl pago de tu cita con ${appointment.psych} no pudo ser confirmado. Por favor, contacta al profesional.\n\nVínculo Salud`,
            'pago_rechazado',
            appointment.patient
        );
    }
}

// ============================================
// NUEVA FUNCIÓN: CONFIRMAR HORA PRESENCIAL
// ============================================
export function confirmPresencialTime(requestId, date, time) {
    const request = state.pendingRequests.find(r => r.id == requestId);
    if (!request) return;
    
    // Crear cita confirmada
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
        createdAt: new Date().toISOString()
    };
    
    state.appointments.push(appointment);
    state.setPendingRequests(state.pendingRequests.filter(r => r.id != requestId));
    
    import('../main.js').then(main => main.save());
    showToast('✅ Cita confirmada', 'success');
}

// ============================================
// FUNCIÓN executeBooking ACTUALIZADA
// ============================================
export function executeBooking() {
    const rut = document.getElementById('custRut').value;
    const name = document.getElementById('custName').value;
    const email = document.getElementById('custEmail').value;
    const phone = document.getElementById('custPhone').value;
    const date = document.getElementById('custDate').value;
    const time = document.getElementById('custTime').value;
    const type = document.getElementById('appointmentType').value;
    const paymentMethod = document.getElementById('paymentMethod')?.value;
    const msg = document.getElementById('custMsg').value;
    const acceptPolicy = document.getElementById('acceptPolicy').checked;

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

    if (type === 'online' && !time) {
        showToast('Selecciona una hora para la cita online', 'error');
        return;
    }

    const bookBtn = document.getElementById('bookBtn');
    bookBtn.innerHTML = '<span class="spinner"></span> Procesando...';
    bookBtn.disabled = true;

    setTimeout(() => {
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

        // Crear cita con estado pendiente
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
            time: type === 'online' ? time : 'Pendiente',
            type: type,
            boxId: null,
            boxName: null,
            price: price,
            paymentMethod: paymentMethod,
            paymentStatus: 'pendiente', // SIEMPRE pendiente hasta confirmación
            paymentConfirmedBy: null,
            paymentConfirmedAt: null,
            msg: msg,
            status: type === 'online' ? 'pendiente' : 'pendiente', // Pendiente hasta confirmación
            createdAt: new Date().toISOString()
        };

        if (type === 'online') {
            state.appointments.push(appointment);
            showToast('✅ Solicitud creada. El profesional confirmará el pago.', 'success');
        } else {
            state.pendingRequests.push(appointment);
            showToast('✅ Solicitud enviada. El profesional confirmará hora y pago.', 'success');
        }

        // Enviar emails
        if (email) {
            sendEmailNotification(
                email,
                'Solicitud de cita recibida - Vínculo Salud',
                `Hola ${name},\n\nHemos recibido tu solicitud de cita con ${state.selectedPsych.name}.\n\n📅 Fecha: ${date}\n💰 Método de pago: ${paymentMethod}\n\nEl profesional confirmará el pago y la hora a la brevedad.\n\nVínculo Salud`,
                'solicitud_recibida',
                name
            );
        }

        import('../main.js').then(main => main.save());

        bookBtn.innerHTML = 'SOLICITAR CITA';
        bookBtn.disabled = false;
        
        setTimeout(() => location.reload(), 2000);
    }, 1500);
}

// ============================================
// FUNCIONES PARA EL PANEL DEL PROFESIONAL
// ============================================

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

    tb.innerHTML = requestsToShow.reverse().map(r => `
        <tr>
            <td>${r.createdAt || '—'}</td>
            <td><strong>${r.patient}</strong><br><small>${r.patientRut}</small></td>
            <td>${r.psych}</td>
            <td>${r.date}</td>
            <td>${r.time || 'A coordinar'}</td>
            <td><span class="badge ${r.type}">${r.type === 'online' ? 'Online' : 'Presencial'}</span></td>
            <td>${r.boxName || '—'}</td>
            <td>${r.msg || '—'}</td>
            <td>
                <div style="display:flex; flex-direction:column; gap:5px;">
                    <span style="font-size:0.8rem; padding:2px 5px; background:${r.paymentStatus === 'pagado' ? '#e6f7e6' : '#fff3cd'}; border-radius:4px;">
                        Pago: ${r.paymentStatus === 'pagado' ? '✅ Confirmado' : '⏳ Pendiente'}
                    </span>
                    
                    <div style="display:flex; gap:5px; flex-wrap:wrap;">
                        ${r.paymentStatus !== 'pagado' ? `
                            <button onclick="confirmPayment('${r.id}')" class="btn-icon" style="background:#34c759; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">
                                <i class="fa fa-dollar-sign"></i> Conf. Pago
                            </button>
                        ` : ''}
                        
                        ${r.type === 'presencial' && r.paymentStatus === 'pagado' ? `
                            <button onclick="showConfirmRequestModal('${r.id}')" class="btn-icon" style="background:#0071e3; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">
                                <i class="fa fa-check"></i> Conf. Hora
                            </button>
                        ` : ''}
                        
                        <button onclick="rejectRequest('${r.id}')" class="btn-icon" style="background:#ff3b30; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">
                            <i class="fa fa-times"></i> Rechazar
                        </button>
                    </div>
                    
                    ${r.paymentConfirmedBy ? `
                        <span style="font-size:0.7rem; color:#666;">
                            Pago confirmado por: ${r.paymentConfirmedBy}
                        </span>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
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
            sendEmailNotification(
                request.patientEmail,
                'Solicitud no confirmada - Vínculo Salud',
                `Hola ${request.patient},\n\nTu solicitud de cita no pudo ser confirmada. Por favor, contacta al profesional.\n\nVínculo Salud`,
                'rechazo',
                request.patient
            );
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
        createdBy: state.currentUser.data.name
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

export function editAppointment(id) {
    showToast('Función de edición en desarrollo', 'info');
}

export function cancelAppointment(id) {
    if (confirm('¿Cancelar esta cita?')) {
        state.setAppointments(state.appointments.filter(a => a.id != id));
        import('../main.js').then(main => main.save());
        showToast('Cita cancelada', 'success');
    }
}

// Mantener markAsPaid por compatibilidad, pero redirigir a confirmPayment
export function markAsPaid(id) {
    confirmPayment(id);
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