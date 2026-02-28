// js/modules/citas.js
import { getAvailableBoxes } from './boxes.js';
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast, validarRut, sendEmailNotification } from './utils.js';

export function openBooking(id) {
    state.setSelectedPsych(state.staff.find(p => p.id == id));
    state.setSelectedBoxId(null);

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('clientView').style.display = 'none';
    document.getElementById('bookingPanel').style.display = 'block';
    document.getElementById('psychName').innerText = state.selectedPsych.name;
    document.getElementById('psychSelectedName').innerText = state.selectedPsych.name;
    document.getElementById('psychSelectedSpec').innerText = Array.isArray(state.selectedPsych.spec) ? state.selectedPsych.spec.join(' · ') : state.selectedPsych.spec;

    document.getElementById('custDate').min = today;
    document.getElementById('custDate').value = today;

    document.getElementById('bookingDuration').innerText = (state.selectedPsych.sessionDuration || 45) + ' minutos';

    loadPaymentMethods();
    updateBookingDetails();
    document.getElementById('emailSimulation').style.display = 'none';
    updateAvailableTimes();
}

function loadPaymentMethods() {
    const select = document.getElementById('paymentMethod');
    select.innerHTML = '<option value="">Selecciona método</option>';

    const methods = state.selectedPsych.paymentMethods || state.globalPaymentMethods;

    if (methods.transfer) {
        select.innerHTML += '<option value="transfer">Transferencia Bancaria</option>';
    }
    if (methods.cardPresencial) {
        select.innerHTML += '<option value="card-presencial">Tarjeta (en consulta)</option>';
    }
    if (methods.cardOnline) {
        select.innerHTML += '<option value="card-online">Tarjeta (pago online)</option>';
    }
    if (methods.cash) {
        select.innerHTML += '<option value="cash">Efectivo (en consulta)</option>';
    }
    if (methods.mercadopago) {
        select.innerHTML += '<option value="mercadopago">Mercado Pago</option>';
    }
    if (methods.webpay) {
        select.innerHTML += '<option value="webpay">Webpay</option>';
    }
}

export function showPaymentDetails() {
    const method = document.getElementById('paymentMethod').value;
    const detailsDiv = document.getElementById('paymentDetails');
    if (method === 'transfer' && state.selectedPsych.bankDetails) {
        const bank = state.selectedPsych.bankDetails;
        detailsDiv.style.display = 'block';
        detailsDiv.innerHTML = `
            <h4 style="margin-bottom:10px;">Datos para Transferencia</h4>
            <p><strong>Banco:</strong> ${bank.bank || 'No especificado'}</p>
            <p><strong>Cuenta:</strong> ${bank.accountType || ''} ${bank.accountNumber || ''}</p>
            <p><strong>RUT:</strong> ${bank.rut || ''}</p>
            <p><strong>Email:</strong> ${bank.email || ''}</p>
        `;
    } else {
        detailsDiv.style.display = 'none';
    }
}

function updateAvailableTimes() {
    const date = document.getElementById('custDate').value;
    const type = document.getElementById('appointmentType').value;
    const timeSelect = document.getElementById('custTime');

    if (!date || !state.selectedPsych) return;

    timeSelect.innerHTML = '<option value="">Cargando horarios...</option>';

    if (type === 'presencial') {
        timeSelect.innerHTML = '<option value="">Selecciona un día (la hora se coordinará)</option>';
        return;
    }

    const availableSlots = state.selectedPsych.availability?.[date] || [];
    const bookedTimes = state.appointments
        .filter(a => a.psychId == state.selectedPsych.id && a.date === date)
        .map(a => a.time);

    const now = new Date();
    const availableTimes = availableSlots
        .filter(slot => !bookedTimes.includes(slot.time))
        .filter(slot => new Date(date + 'T' + slot.time) > now)
        .sort((a, b) => a.time.localeCompare(b.time));

    if (availableTimes.length === 0) {
        timeSelect.innerHTML = '<option value="">No hay horarios disponibles</option>';
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
}

export function checkOnlineAvailability() {
    const date = document.getElementById('custDate').value;
    const time = document.getElementById('custTime').value;
    const type = document.getElementById('appointmentType').value;

    if (type === 'presencial') {
        document.getElementById('onlineAvailabilityMsg').style.display = 'none';
        return true;
    }

    if (type === 'online' && date && time) {
        const selectedDateTime = new Date(date + 'T' + time);
        const now = new Date();

        if (selectedDateTime < now) {
            document.getElementById('onlineAvailabilityMsg').style.display = 'block';
            document.getElementById('onlineAvailabilityMsg').innerHTML = '<i class="fa fa-exclamation-circle"></i> No puedes seleccionar una hora que ya pasó.';
            document.getElementById('onlineAvailabilityMsg').style.background = '#fff3cd';
            return false;
        }

        const existingAppointment = state.appointments.find(a => 
            a.psychId == state.selectedPsych.id && 
            a.date === date && 
            a.time === time
        );

        const isAvailable = !existingAppointment && 
            state.selectedPsych.availability?.[date]?.some(s => s.time === time);

        if (isAvailable) {
            document.getElementById('onlineAvailabilityMsg').style.display = 'block';
            document.getElementById('onlineAvailabilityMsg').innerHTML = '<i class="fa fa-check-circle"></i> Horario disponible para reserva inmediata.';
            document.getElementById('onlineAvailabilityMsg').style.background = '#e6f7e6';
            return true;
        } else {
            document.getElementById('onlineAvailabilityMsg').style.display = 'block';
            document.getElementById('onlineAvailabilityMsg').innerHTML = '<i class="fa fa-exclamation-circle"></i> Horario no disponible. Por favor selecciona otro.';
            document.getElementById('onlineAvailabilityMsg').style.background = '#fff3cd';
            return false;
        }
    }
}

export function updateBookingDetails() {
    const type = document.getElementById('appointmentType').value;
    const price = type === 'online' ? state.selectedPsych.priceOnline : state.selectedPsych.pricePresencial;

    document.getElementById('bookingPrice').innerText = `$${price.toLocaleString()}`;
    document.getElementById('bookingType').innerText = type === 'online' ? 'Online' : 'Presencial';

    const warning = document.getElementById('presencialWarning');
    const onlineMsg = document.getElementById('onlineAvailabilityMsg');

    if (type === 'presencial') {
        warning.style.display = 'block';
        onlineMsg.style.display = 'none';
    } else {
        warning.style.display = 'none';
        onlineMsg.style.display = 'block';
    }

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
    }
}

export function executeBooking() {
    const rut = document.getElementById('custRut').value;
    const name = document.getElementById('custName').value;
    const email = document.getElementById('custEmail').value;
    const phone = document.getElementById('custPhone').value;
    const date = document.getElementById('custDate').value;
    const time = document.getElementById('custTime').value;
    const type = document.getElementById('appointmentType').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const msg = document.getElementById('custMsg').value;
    const acceptPolicy = document.getElementById('acceptPolicy').checked;

    if (!rut || !name || !email || !date || !paymentMethod) {
        showToast('Completa todos los campos obligatorios (RUT, nombre, email, fecha y método de pago)', 'error');
        return;
    }

    if (!validarRut(rut)) {
        showToast('RUT inválido', 'error');
        return;
    }

    if (type === 'online' && !time) {
        showToast('Para atención online debes seleccionar una hora', 'error');
        return;
    }

    if (!acceptPolicy) {
        showToast('Debes aceptar la política de cancelación', 'error');
        return;
    }

    if (type === 'online') {
        const selectedDateTime = new Date(date + 'T' + time);
        const now = new Date();
        if (selectedDateTime < now) {
            showToast('No puedes agendar una hora que ya pasó', 'error');
            return;
        }
    }

    if (type === 'online') {
        const existingAppointment = state.appointments.find(a => 
            a.psychId == state.selectedPsych.id && 
            a.date === date && 
            a.time === time
        );

        if (existingAppointment) {
            showToast('El profesional ya tiene una cita agendada en este horario', 'error');
            return;
        }

        const isAvailable = state.selectedPsych.availability?.[date]?.some(s => s.time === time);
        if (!isAvailable) {
            showToast('Horario no disponible', 'error');
            return;
        }
    }

    const bookBtn = document.getElementById('bookBtn');
    bookBtn.innerHTML = '<span class="spinner"></span> Procesando...';
    bookBtn.disabled = true;

    setTimeout(() => {
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

        const paymentContainer = document.getElementById('paymentLinkContainer');
        let paymentLink = '';
        let qrCode = '';

        if (type === 'online' && state.selectedPsych.paymentLinks?.online) {
            paymentLink = state.selectedPsych.paymentLinks.online;
        } else if (type === 'presencial' && state.selectedPsych.paymentLinks?.presencial) {
            paymentLink = state.selectedPsych.paymentLinks.presencial;
            qrCode = state.selectedPsych.paymentLinks?.qrCode || '';
        }

        if (paymentLink) {
            const separator = paymentLink.includes('?') ? '&' : '?';
            paymentLink = `${paymentLink}${separator}description=Atención ${type} - ${encodeURIComponent(name)}&customer_email=${encodeURIComponent(email)}&customer_name=${encodeURIComponent(name)}`;
        }

        if (paymentContainer) {
            let qrHtml = '';
            if (qrCode) {
                qrHtml = `
                    <div style="text-align: center; margin: 20px 0;">
                        <p style="font-weight:600; margin-bottom:10px;">📱 Escanea para pagar (presencial):</p>
                        <img src="${qrCode}" 
                             style="width: 200px; height: 200px; border-radius: 12px; border: 3px solid var(--azul-medico); box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    </div>
                `;
            }

            paymentContainer.innerHTML = `
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 20px; color: white; text-align: center;">
                    <h4 style="margin-bottom: 15px; font-size:1.5rem;">💰 ${type === 'online' ? 'Pago online' : 'Pago presencial'}</h4>
                    <p style="font-size: 2rem; font-weight:700; margin-bottom:10px;">$${price.toLocaleString()}</p>
                    
                    ${qrHtml}
                    
                    ${paymentLink ? `
                        <a href="${paymentLink}" target="_blank" class="btn-staff" style="background: var(--verde-exito); text-decoration: none; padding: 15px 40px; font-size:1.2rem; margin-top:15px; display:inline-block;">
                            <i class="fab fa-cc-visa"></i> Pagar con Tarjeta
                        </a>
                        <p style="margin-top:15px; font-size:0.9rem; opacity:0.8;">
                            <i class="fas fa-lock"></i> Pago seguro procesado por SumUp
                        </p>
                    ` : ''}
                    
                    <p style="margin-top:20px; font-size:0.8rem; background: rgba(0,0,0,0.2); padding:10px; border-radius:10px;">
                        ⏰ Una vez realizado el pago, la cita se confirmará automáticamente y recibirás un email.
                    </p>
                </div>
            `;
            paymentContainer.style.display = 'block';
        }

        if (type === 'online') {
            const appointment = {
                id: Date.now(),
                patientId: patient.id,
                patient: name,
                patientRut: rut,
                patientEmail: email,
                patientPhone: phone,
                psych: state.selectedPsych.name,
                psychId: state.selectedPsych.id,
                date,
                time,
                type,
                boxId: null,
                boxName: null,
                price,
                paymentMethod,
                paymentStatus: paymentLink ? 'pendiente' : 'pagado',
                msg,
                status: paymentLink ? 'pendiente' : 'confirmada',
                createdAt: new Date().toISOString(),
                editableUntil: new Date(Date.now() + state.EDIT_HOURS * 60 * 60 * 1000).toISOString()
            };

            state.appointments.push(appointment);
            sendAppointmentEmails(appointment);
            showToast(paymentLink ? '¡Cita creada! Realiza el pago para confirmar' : '¡Cita confirmada!', 'success');
        } else {
            const request = {
                id: Date.now(),
                patientId: patient.id,
                patient: name,
                patientRut: rut,
                patientEmail: email,
                patientPhone: phone,
                psych: state.selectedPsych.name,
                psychId: state.selectedPsych.id,
                preferredDate: date,
                preferredTime: 'A coordinar',
                type,
                boxId: null,
                boxName: null,
                paymentMethod,
                msg,
                status: 'pendiente',
                createdAt: new Date().toLocaleString()
            };

            state.pendingRequests.push(request);
            sendRequestEmail(request);
            showToast('¡Solicitud enviada! El profesional te confirmará la hora', 'success');
        }

        import('./main.js').then(main => main.save());

        bookBtn.innerHTML = 'SOLICITAR CITA';
        bookBtn.disabled = false;
    }, 1500);
}

function sendAppointmentEmails(appointment, isReminder = false) {
    const patientEmail = appointment.patientEmail;
    const psych = state.staff.find(s => s.id == appointment.psychId);
    const psychEmail = psych?.email || '';

    let subject, message;

    if (isReminder) {
        subject = `Recordatorio: Cita con ${appointment.psych} - Mañana`;
        message = `Hola ${appointment.patient},\n\nTe recordamos que tienes una cita MAÑANA con ${appointment.psych}.\n\n📅 Fecha: ${appointment.date}\n⏰ Hora: ${appointment.time}\n💻 Tipo: ${appointment.type === 'online' ? 'Online' : 'Presencial'}${appointment.boxName ? `\n📍 Box: ${appointment.boxName}` : ''}\n📍 Dirección: ${appointment.type === 'presencial' ? (psych?.address || 'Dirección no especificada') : 'El enlace de videollamada se enviará 1 hora antes'}\n\nPor favor, confirma tu asistencia.\n\nVínculo Salud`;
    } else {
        subject = `Confirmación de cita - Vínculo Salud`;
        message = `Hola ${appointment.patient},\n\nTu cita ha sido confirmada con ${appointment.psych}.\n\n📅 Fecha: ${appointment.date}\n⏰ Hora: ${appointment.time}\n💻 Tipo: ${appointment.type === 'online' ? 'Online' : 'Presencial'}${appointment.boxName ? `\n📍 Box: ${appointment.boxName}` : ''}\n📍 Dirección: ${appointment.type === 'presencial' ? (psych?.address || 'Dirección no especificada') : 'El enlace de videollamada se enviará 1 hora antes'}\n\n💳 Método de pago: ${appointment.paymentMethod === 'transfer' ? 'Transferencia bancaria' : appointment.paymentMethod === 'cash' ? 'Efectivo' : appointment.paymentMethod === 'mercadopago' ? 'Mercado Pago' : appointment.paymentMethod === 'webpay' ? 'Webpay' : 'Tarjeta'}\n\nSi necesitas modificar o cancelar tu cita, contáctanos con al menos 24 horas de anticipación.\n\nVínculo Salud`;
    }

    if (patientEmail) {
        sendEmailNotification(patientEmail, subject, message);
    }

    if (!isReminder && psychEmail) {
        const psychSubject = `Nueva cita confirmada - ${appointment.patient}`;
        const psychMessage = `Hola ${appointment.psych},\n\nSe ha confirmado una nueva cita.\n\nPaciente: ${appointment.patient}\nEmail: ${appointment.patientEmail}\nTeléfono: ${appointment.patientPhone}\n📅 Fecha: ${appointment.date}\n⏰ Hora: ${appointment.time}\n💻 Tipo: ${appointment.type === 'online' ? 'Online' : 'Presencial'}${appointment.boxName ? `\n📍 Box: ${appointment.boxName}` : ''}\n📝 Notas: ${appointment.msg || 'Sin observaciones'}\n\nVínculo Salud`;
        sendEmailNotification(psychEmail, psychSubject, psychMessage);
    }
}

function sendRequestEmail(request) {
    const patientEmail = request.patientEmail;
    const psych = state.staff.find(s => s.id == request.psychId);
    const psychEmail = psych?.email || '';

    if (patientEmail) {
        const patientSubject = `Solicitud de cita recibida - Vínculo Salud`;
        const patientMessage = `Hola ${request.patient},\n\nHemos recibido tu solicitud de cita con ${request.psych}.\n\n📅 Fecha solicitada: ${request.preferredDate}\n⏰ Hora solicitada: ${request.preferredTime}\n💻 Tipo: ${request.type === 'online' ? 'Online' : 'Presencial'}\n\nEl profesional revisará tu solicitud y te confirmará la hora exacta a la brevedad.\n\nPara consultas, puedes contactarnos directamente.\n\nVínculo Salud`;
        sendEmailNotification(patientEmail, patientSubject, patientMessage);
    }

    if (psychEmail) {
        const psychSubject = `Nueva solicitud de cita - ${request.patient}`;
        const psychMessage = `Hola ${request.psych},\n\nHas recibido una nueva solicitud de cita.\n\nPaciente: ${request.patient}\nEmail: ${request.patientEmail}\nTeléfono: ${request.patientPhone}\n📅 Fecha solicitada: ${request.preferredDate}\n⏰ Hora solicitada: ${request.preferredTime}\n💻 Tipo: ${request.type === 'online' ? 'Online' : 'Presencial'}\n📝 Motivo: ${request.msg || 'No especificado'}\n\nPor favor, ingresa al sistema para confirmar o reprogramar esta cita.\n\nVínculo Salud`;
        sendEmailNotification(psychEmail, psychSubject, psychMessage);
    }
}

function sendConfirmationEmail(request, appointment) {
    const patientEmail = request.patientEmail;
    const psych = state.staff.find(s => s.id == appointment.psychId);

    if (patientEmail) {
        const subject = `Cita confirmada - Vínculo Salud`;
        const message = `Hola ${request.patient},\n\nTu solicitud de cita ha sido confirmada.\n\n📅 Fecha: ${appointment.date}\n⏰ Hora: ${appointment.time}\n💻 Tipo: ${appointment.type === 'online' ? 'Online' : 'Presencial'}${appointment.boxName ? `\n📍 Box: ${appointment.boxName}` : ''}\n📍 Dirección: ${appointment.type === 'presencial' ? (psych?.address || 'Dirección no especificada') : 'El enlace de videollamada se enviará 1 hora antes'}\n\nPor favor, llega 10 minutos antes de tu hora agendada.\n\nVínculo Salud`;
        sendEmailNotification(patientEmail, subject, message);
    }
}

function sendCancellationEmail(appointment) {
    if (appointment?.patientEmail) {
        const subject = 'Cita cancelada - Vínculo Salud';
        const message = `Hola ${appointment.patient},\n\nTu cita con ${appointment.psych} para el ${appointment.date} a las ${appointment.time} ha sido cancelada.\n\nSi necesitas reagendar, contáctanos.\n\nVínculo Salud`;
        sendEmailNotification(appointment.patientEmail, subject, message);
    }
}

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
    document.getElementById('therapistPsychName').innerText = state.currentUser.data.name;
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
        if (confirm('Paciente no encontrado. ¿Desea crearlo?')) {
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
    const type = document.getElementById('therapistAppointmentType').value;
    const price = type === 'online' ? state.currentUser.data.priceOnline : state.currentUser.data.pricePresencial;
    document.getElementById('therapistPrice').innerText = `$${price.toLocaleString()}`;
    document.getElementById('therapistTypeDisplay').innerText = type === 'online' ? 'Online' : 'Presencial';

    if (type === 'presencial') {
        document.getElementById('therapistBoxField').style.display = 'block';
        updateTherapistAvailableSlots();
    } else {
        document.getElementById('therapistBoxField').style.display = 'none';
        document.getElementById('therapistBoxDisplay').style.display = 'none';
        updateTherapistAvailableSlots();
    }
}

export function updateTherapistAvailableSlots() {
    const date = document.getElementById('therapistDate').value;
    const timeSelect = document.getElementById('therapistTime');
    const type = document.getElementById('therapistAppointmentType').value;

    if (!date || !state.currentUser) return;

    const bookedTimes = state.appointments
        .filter(a => a.psychId == state.currentUser.data.id && a.date === date)
        .map(a => a.time);

    const availableSlots = state.currentUser.data.availability?.[date] || [];

    timeSelect.innerHTML = '<option value="">Selecciona un horario</option>';

    const now = new Date();
    availableSlots.forEach(slot => {
        if (!bookedTimes.includes(slot.time)) {
            const slotDateTime = new Date(date + 'T' + slot.time);
            if (slotDateTime > now) {
                const option = document.createElement('option');
                option.value = slot.time;
                option.textContent = slot.time + (slot.isOvercupo ? ' (⚠️ Sobrecupo)' : '');
                if (slot.isOvercupo) option.style.color = '#f59e0b';

                if (type === 'presencial') {
                    const availableBoxes = getAvailableBoxes(date, slot.time);
                    if (availableBoxes.length === 0) {
                        option.disabled = true;
                        option.textContent += ' (sin boxes disponibles)';
                        option.style.color = 'var(--text-light)';
                    }
                }

                timeSelect.appendChild(option);
            }
        }
    });

    if (timeSelect.children.length === 1) {
        timeSelect.innerHTML = '<option value="">No hay horarios disponibles</option>';
    }

    const time = document.getElementById('therapistTime').value;
    if (time) {
        document.getElementById('therapistTimeDisplay').innerText = time;
        updateTherapistBoxSelector(date, time);
    }
}

export function updateTherapistBoxSelector(date, time) {
    const boxSelector = document.getElementById('therapistBoxSelector');
    const boxAvailabilityMsg = document.getElementById('therapistBoxAvailabilityMsg');

    if (!date || !time) {
        boxSelector.innerHTML = '';
        boxAvailabilityMsg.innerHTML = 'Selecciona fecha y horario primero';
        return;
    }

    const availableBoxes = getAvailableBoxes(date, time);

    if (availableBoxes.length === 0) {
        boxSelector.innerHTML = '';
        boxAvailabilityMsg.innerHTML = 'No hay boxes disponibles para este horario';
        document.getElementById('therapistBoxDisplay').style.display = 'none';
        state.setSelectedTherapistBoxId(null);
        return;
    }

    boxSelector.innerHTML = availableBoxes.map(box => `
        <div class="box-option ${state.selectedTherapistBoxId == box.id ? 'selected' : ''}" 
             onclick="selectTherapistBox(${box.id}, this)"
             title="${box.description || ''}">
            📦 ${box.name} ${box.location ? `- ${box.location}` : ''}
        </div>
    `).join('');

    boxAvailabilityMsg.innerHTML = `${availableBoxes.length} box(es) disponible(s)`;
}

export function selectTherapistBox(boxId, element) {
    state.setSelectedTherapistBoxId(boxId);
    const box = state.boxes.find(b => b.id == boxId);

    document.querySelectorAll('#therapistBoxSelector .box-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');

    if (box) {
        document.getElementById('therapistBoxName').innerText = `${box.name} ${box.location ? `(${box.location})` : ''}`;
        document.getElementById('therapistBoxDisplay').style.display = 'flex';
    }
}

export function executeTherapistBooking() {
    if (!state.selectedPatientForTherapist) {
        showToast('Debes buscar y seleccionar un paciente', 'error');
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

    const existingAppointment = state.appointments.find(a => 
        a.psychId == state.currentUser.data.id && 
        a.date === date && 
        a.time === time
    );

    if (existingAppointment) {
        showToast('Ya tienes una cita agendada en este horario', 'error');
        return;
    }

    if (type === 'presencial' && !state.selectedTherapistBoxId) {
        showToast('Debes seleccionar un box para atención presencial', 'error');
        return;
    }

    const bookBtn = document.getElementById('therapistBookBtn');
    bookBtn.innerHTML = '<span class="spinner"></span> Procesando...';
    bookBtn.disabled = true;

    setTimeout(() => {
        const price = type === 'online' ? state.currentUser.data.priceOnline : state.currentUser.data.pricePresencial;
        const box = type === 'presencial' ? state.boxes.find(b => b.id == state.selectedTherapistBoxId) : null;

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
            boxId: type === 'presencial' ? state.selectedTherapistBoxId : null,
            boxName: box ? box.name : null,
            price,
            paymentMethod,
            paymentStatus: 'pagado',
            msg,
            status: 'confirmada',
            createdAt: new Date().toISOString(),
            editableUntil: new Date(Date.now() + state.EDIT_HOURS * 60 * 60 * 1000).toISOString(),
            createdBy: state.currentUser.data.name
        };

        state.appointments.push(appointment);

        if (!state.selectedPatientForTherapist.appointments) state.selectedPatientForTherapist.appointments = [];
        state.selectedPatientForTherapist.appointments.push(appointment.id);

        if (window.currentRequestId) {
            const request = state.pendingRequests.find(r => r.id == window.currentRequestId);
            if (request) {
                sendConfirmationEmail(request, appointment);
            }
            state.setPendingRequests(state.pendingRequests.filter(r => r.id != window.currentRequestId));
            window.currentRequestId = null;
        } else {
            sendAppointmentEmails(appointment);
        }

        import('./main.js').then(main => main.save());

        showToast(`Cita confirmada con ${state.selectedPatientForTherapist.name}`, 'success');

        bookBtn.innerHTML = 'Confirmar Cita';
        bookBtn.disabled = false;

        document.getElementById('therapistRut').value = '';
        document.getElementById('patientInfo').style.display = 'none';
        document.getElementById('therapistDate').value = '';
        document.getElementById('therapistTime').innerHTML = '<option value="">Selecciona una fecha</option>';
        document.getElementById('therapistMsg').value = '';
        document.getElementById('therapistPatientName').innerText = '—';
        document.getElementById('therapistDateDisplay').innerText = '—';
        document.getElementById('therapistTimeDisplay').innerText = '—';
        document.getElementById('therapistBoxDisplay').style.display = 'none';
        state.setSelectedPatientForTherapist(null);
        state.setSelectedTherapistBoxId(null);

        import('./boxes.js').then(boxes => boxes.renderBoxOccupancy());
        import('./auth.js').then(auth => auth.switchTab('citas'));
    }, 1500);
}

export function renderPendingRequests() {
    const tb = document.getElementById('pendingRequestsTable');
    if (!tb) return;

    let requestsToShow = [];
    if (state.currentUser.role === 'admin') {
        requestsToShow = state.pendingRequests;
    } else if (state.currentUser.role === 'psych') {
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
            <td>${r.preferredDate}</td>
            <td>${r.preferredTime}</td>
            <td><span class="badge ${r.type}">${r.type === 'online' ? 'Online' : 'Presencial'}</span></td>
            <td>${r.boxName || '—'}</td>
            <td>${r.msg || '—'}</td>
            <td>
                <button onclick="showConfirmRequestModal('${r.id}')" class="btn-icon" style="background:var(--verde-exito); color:white;">
                    <i class="fa fa-check"></i> Confirmar
                </button>
                <button onclick="rejectRequest('${r.id}')" class="btn-icon" style="background:var(--rojo-alerta); color:white;">
                    <i class="fa fa-times"></i> Rechazar
                </button>
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
    document.getElementById('therapistAppointmentType').value = request.type;
    document.getElementById('therapistDate').value = request.preferredDate;
    document.getElementById('therapistMsg').value = request.msg;
    document.getElementById('therapistPaymentMethod').value = 'transfer';

    if (request.boxId) {
        state.setSelectedTherapistBoxId(request.boxId);
    }

    window.currentRequestId = requestId;

    updateTherapistBookingDetails();
    setTimeout(() => {
        updateTherapistAvailableSlots();
        document.getElementById('therapistTime').value = request.preferredTime;
        document.getElementById('therapistTimeDisplay').innerText = request.preferredTime;
        if (request.boxId) {
            updateTherapistBoxSelector(request.preferredDate, request.preferredTime);
        }
    }, 500);

    import('./auth.js').then(auth => auth.switchTab('agendar'));
}

export function rejectRequest(requestId) {
    if (confirm('¿Rechazar esta solicitud? Se notificará al paciente.')) {
        const request = state.pendingRequests.find(r => r.id == requestId);
        state.setPendingRequests(state.pendingRequests.filter(r => r.id != requestId));

        if (request?.patientEmail) {
            const subject = 'Solicitud de cita no confirmada - Vínculo Salud';
            const message = `Hola ${request.patient},\n\nLamentamos informarte que no ha sido posible confirmar tu solicitud de cita con ${request.psych} para el ${request.preferredDate} a las ${request.preferredTime}.\n\nPor favor, contacta directamente con el profesional para acordar una nueva fecha.\n\nVínculo Salud`;
            sendEmailNotification(request.patientEmail, subject, message);
        }

        import('./main.js').then(main => main.save());
        showToast('Solicitud rechazada', 'success');
    }
}

export function editAppointment(id) {
    const appointment = state.appointments.find(a => a.id == id);
    if (!appointment) return;
    showToast('Función de edición en desarrollo', 'info');
}

export function cancelAppointment(id) {
    if (confirm('¿Cancelar esta cita?')) {
        const appointment = state.appointments.find(a => a.id == id);
        state.setAppointments(state.appointments.filter(a => a.id != id));

        if (appointment?.patientEmail) {
            sendCancellationEmail(appointment);
        }

        import('./main.js').then(main => main.save());
        showToast('Cita cancelada', 'success');
    }
}

export function markAsPaid(id) {
    const appointment = state.appointments.find(a => a.id == id);
    if (appointment) {
        appointment.paymentStatus = 'pagado';
        import('./main.js').then(main => main.save());
        showToast('Pago marcado como recibido', 'success');
    }
}