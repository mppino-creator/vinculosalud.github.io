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
    
    // Cargar métodos de pago (si existe el elemento)
    loadPaymentMethods();
    
    // Actualizar detalles
    updateBookingDetails();
    document.getElementById('emailSimulation').style.display = 'none';
    updateAvailableTimes();
}

// Función de carga de métodos de pago - CORREGIDA (tolerante a elementos faltantes)
function loadPaymentMethods() {
    const select = document.getElementById('paymentMethod');
    if (!select) {
        console.log("ℹ️ Elemento paymentMethod no encontrado - se omite carga de métodos de pago");
        return;
    }
    
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
    const method = document.getElementById('paymentMethod')?.value;
    const detailsDiv = document.getElementById('paymentDetails');
    if (!detailsDiv) return;
    
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

export function updateAvailableTimes() {
    const date = document.getElementById('custDate').value;
    const type = document.getElementById('appointmentType').value;
    const timeSelect = document.getElementById('custTime');
    const onlineMsg = document.getElementById('onlineAvailabilityMsg');
    const presencialWarning = document.getElementById('presencialWarning');

    console.log("🔍 updateAvailableTimes ejecutado");
    console.log("📅 Fecha seleccionada:", date);
    console.log("💻 Tipo:", type);
    console.log("👤 Psicólogo seleccionado:", state.selectedPsych?.name);

    if (!date || !state.selectedPsych) {
        console.log("❌ Falta fecha o psicólogo");
        return;
    }

    timeSelect.innerHTML = '<option value="">Cargando horarios...</option>';

    // SI ES PRESENCIAL: no mostrar horas
    if (type === 'presencial') {
        console.log("🏢 Es presencial, no mostramos horas");
        timeSelect.innerHTML = '<option value="">La hora se coordinará con el profesional</option>';
        timeSelect.disabled = true;
        presencialWarning.style.display = 'block';
        onlineMsg.style.display = 'none';
        return;
    }

    // SI ES ONLINE: mostrar horas disponibles
    timeSelect.disabled = false;
    presencialWarning.style.display = 'none';
    
    // Verificar disponibilidad
    console.log("📊 Disponibilidad completa:", state.selectedPsych.availability);
    
    const availableSlots = state.selectedPsych.availability?.[date] || [];
    console.log("🕐 Slots para esta fecha:", availableSlots);

    if (availableSlots.length === 0) {
        console.log("⚠️ No hay slots para esta fecha");
        timeSelect.innerHTML = '<option value="">No hay horarios disponibles para esta fecha</option>';
        onlineMsg.style.display = 'none';
        return;
    }

    // Obtener citas ocupadas (solo confirmadas)
    const bookedTimes = state.appointments
        .filter(a => a.psychId == state.selectedPsych.id && a.date === date && a.status === 'confirmada')
        .map(a => a.time);
    console.log("🚫 Horas ocupadas:", bookedTimes);

    const now = new Date();
    const availableTimes = availableSlots
        .filter(slot => !bookedTimes.includes(slot.time))
        .filter(slot => {
            const slotDateTime = new Date(date + 'T' + slot.time);
            return slotDateTime > now;
        })
        .sort((a, b) => a.time.localeCompare(b.time));

    console.log("✅ Horas disponibles finales:", availableTimes);

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
    onlineMsg.innerHTML = '<i class="fa fa-info-circle"></i> Horarios disponibles para reserva inmediata';
    onlineMsg.style.background = '#e6f7e6';
}

export function updateBookingDetails() {
    const type = document.getElementById('appointmentType').value;
    const price = type === 'online' ? state.selectedPsych.priceOnline : state.selectedPsych.pricePresencial;

    document.getElementById('bookingPrice').innerText = `$${price.toLocaleString()}`;
    document.getElementById('bookingType').innerText = type === 'online' ? 'Online' : 'Presencial (solicitud)';
    
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
    const paymentMethod = document.getElementById('paymentMethod')?.value || 'transfer'; // Opcional con valor por defecto
    const msg = document.getElementById('custMsg').value;
    const acceptPolicy = document.getElementById('acceptPolicy').checked;

    // Validaciones básicas - CORREGIDO (sin paymentMethod obligatorio)
    if (!rut || !name || !email || !date) {
        showToast('Completa todos los campos obligatorios (RUT, nombre, email, fecha)', 'error');
        return;
    }

    if (!validarRut(rut)) {
        showToast('RUT inválido', 'error');
        return;
    }

    if (!acceptPolicy) {
        showToast('Debes aceptar la política de cancelación', 'error');
        return;
    }

    // Para online: requiere hora y validaciones adicionales
    if (type === 'online') {
        if (!time) {
            showToast('Selecciona una hora para la cita online', 'error');
            return;
        }

        // Validar que la hora no haya pasado
        const selectedDateTime = new Date(date + 'T' + time);
        const now = new Date();
        if (selectedDateTime < now) {
            showToast('No puedes agendar una hora que ya pasó', 'error');
            return;
        }

        // Verificar que el horario esté disponible en la agenda del psicólogo
        const isAvailable = state.selectedPsych.availability?.[date]?.some(s => s.time === time);
        if (!isAvailable) {
            showToast('El profesional no tiene disponibilidad en ese horario', 'error');
            return;
        }

        // Verificar que no haya otra cita (online o presencial) a la misma hora
        const existingAppointment = state.appointments.find(a => 
            a.psychId == state.selectedPsych.id && 
            a.date === date && 
            a.time === time &&
            a.status === 'confirmada'
        );

        if (existingAppointment) {
            showToast('El profesional ya tiene una cita agendada en este horario', 'error');
            return;
        }
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

        // Mostrar link de pago si existe (solo para online)
        const paymentContainer = document.getElementById('paymentLinkContainer');
        if (type === 'online' && state.selectedPsych.paymentLinks?.online) {
            let paymentLink = state.selectedPsych.paymentLinks.online;
            const separator = paymentLink.includes('?') ? '&' : '?';
            paymentLink = `${paymentLink}${separator}description=Atención Online - ${encodeURIComponent(name)}&customer_email=${encodeURIComponent(email)}&customer_name=${encodeURIComponent(name)}`;

            paymentContainer.innerHTML = `
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 20px; color: white; text-align: center; margin-top:20px;">
                    <h4 style="margin-bottom: 15px; font-size:1.5rem;">💰 Pago online</h4>
                    <p style="font-size: 2rem; font-weight:700; margin-bottom:10px;">$${price.toLocaleString()}</p>
                    <a href="${paymentLink}" target="_blank" class="btn-staff" style="background: var(--verde-exito); text-decoration: none; padding: 15px 40px; font-size:1.2rem; margin-top:15px; display:inline-block;">
                        <i class="fab fa-cc-visa"></i> Pagar con Tarjeta
                    </a>
                    <p style="margin-top:15px; font-size:0.9rem; opacity:0.8;">
                        <i class="fas fa-lock"></i> Pago seguro procesado por SumUp
                    </p>
                    <p style="margin-top:20px; font-size:0.8rem; background: rgba(0,0,0,0.2); padding:10px; border-radius:10px;">
                        ⏰ Una vez realizado el pago, la cita se confirmará automáticamente.
                    </p>
                </div>
            `;
            paymentContainer.style.display = 'block';
        } else {
            paymentContainer.style.display = 'none';
        }

        if (type === 'online') {
            // Reserva online directa
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
                type: 'online',
                boxId: null,
                boxName: null,
                price,
                paymentMethod,
                paymentStatus: 'pendiente',
                msg,
                status: 'pendiente',
                createdAt: new Date().toISOString(),
                editableUntil: new Date(Date.now() + state.EDIT_HOURS * 60 * 60 * 1000).toISOString()
            };

            state.appointments.push(appointment);
            
            // Enviar email de solicitud
            sendRequestEmail({
                ...appointment,
                preferredDate: date,
                preferredTime: time
            });
            
            showToast('¡Solicitud enviada! Completa el pago para confirmar', 'success');
        } else {
            // Solicitud presencial (solo día, sin hora)
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
                type: 'presencial',
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

        import('../main.js').then(main => main.save());

        bookBtn.innerHTML = 'SOLICITAR CITA';
        bookBtn.disabled = false;
        
        // Opcional: redirigir o limpiar formulario
        setTimeout(() => {
            if (confirm('¿Quieres volver a la página principal?')) {
                location.reload();
            }
        }, 2000);
    }, 1500);
}

// Funciones de email
function sendRequestEmail(request) {
    const patientEmail = request.patientEmail;
    
    if (patientEmail) {
        let subject, message;
        
        if (request.type === 'online') {
            subject = 'Solicitud de cita online - Vínculo Salud';
            message = `Hola ${request.patient},\n\nHemos recibido tu solicitud de cita ONLINE con ${request.psych}.\n\n📅 Fecha: ${request.preferredDate}\n⏰ Hora: ${request.preferredTime}\n\nPara confirmar tu cita, debes realizar el pago a través del link que encontrarás en la página.\n\nUna vez confirmado el pago, recibirás un email con los detalles de la videollamada.\n\nVínculo Salud`;
        } else {
            subject = 'Solicitud de cita presencial - Vínculo Salud';
            message = `Hola ${request.patient},\n\nHemos recibido tu solicitud de cita PRESENCIAL con ${request.psych}.\n\n📅 Día solicitado: ${request.preferredDate}\n\nEl profesional revisará tu solicitud y te confirmará la hora exacta a la brevedad.\n\nVínculo Salud`;
        }
        
        sendEmailNotification(patientEmail, subject, message);
    }
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
            <td>${r.preferredDate}</td>
            <td>${r.preferredTime}</td>
            <td><span class="badge ${r.type}">${r.type === 'online' ? 'Online (pago pendiente)' : 'Presencial'}</span></td>
            <td>${r.boxName || '—'}</td>
            <td>${r.msg || '—'}</td>
            <td>
                ${r.type === 'presencial' ? `
                    <button onclick="showConfirmRequestModal('${r.id}')" class="btn-icon" style="background:var(--verde-exito); color:white;">
                        <i class="fa fa-check"></i> Confirmar
                    </button>
                ` : `
                    <span class="badge" style="background:var(--naranja-aviso);">Esperando pago</span>
                `}
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
    document.getElementById('therapistAppointmentType').value = 'presencial';
    document.getElementById('therapistDate').value = request.preferredDate;
    document.getElementById('therapistMsg').value = request.msg;
    document.getElementById('therapistPaymentMethod').value = request.paymentMethod || 'transfer';

    window.currentRequestId = requestId;

    updateTherapistBookingDetails();
    setTimeout(() => {
        updateTherapistAvailableSlots();
    }, 500);

    import('./auth.js').then(auth => auth.switchTab('agendar'));
}

export function rejectRequest(requestId) {
    if (confirm('¿Rechazar esta solicitud? Se notificará al paciente.')) {
        const request = state.pendingRequests.find(r => r.id == requestId);
        state.setPendingRequests(state.pendingRequests.filter(r => r.id != requestId));

        if (request?.patientEmail) {
            const subject = 'Solicitud de cita no confirmada - Vínculo Salud';
            const message = `Hola ${request.patient},\n\nLamentamos informarte que no ha sido posible confirmar tu solicitud de cita con ${request.psych} para el ${request.preferredDate}.\n\nPor favor, contacta directamente con el profesional para acordar una nueva fecha.\n\nVínculo Salud`;
            sendEmailNotification(request.patientEmail, subject, message);
        }

        import('../main.js').then(main => main.save());
        showToast('Solicitud rechazada', 'success');
    }
}

// ============================================
// FUNCIONES PARA QUE EL PROFESIONAL AGENDE MANUALMENTE
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

    // Obtener TODAS las citas confirmadas del profesional en esa fecha
    const bookedTimes = state.appointments
        .filter(a => a.psychId == state.currentUser.data.id && a.date === date && a.status === 'confirmada')
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
    }
}

export function executeTherapistBooking() {
    if (!state.selectedPatientForTherapist) {
        showToast('Debes buscar y seleccionar un paciente', 'error');
        return;
    }

    if (!state.currentUser?.data) {
        showToast('Error de sesión', 'error');
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

    // Verificar que no haya otra cita a la misma hora
    const existingAppointment = state.appointments.find(a => 
        a.psychId == state.currentUser.data.id && 
        a.date === date && 
        a.time === time &&
        a.status === 'confirmada'
    );

    if (existingAppointment) {
        showToast('Ya tienes una cita agendada en este horario', 'error');
        return;
    }

    const bookBtn = document.getElementById('therapistBookBtn');
    bookBtn.innerHTML = '<span class="spinner"></span> Procesando...';
    bookBtn.disabled = true;

    setTimeout(() => {
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
            paymentStatus: 'pagado',
            msg,
            status: 'confirmada',
            createdAt: new Date().toISOString(),
            editableUntil: new Date(Date.now() + state.EDIT_HOURS * 60 * 60 * 1000).toISOString(),
            createdBy: state.currentUser.data.name
        };

        state.appointments.push(appointment);

        if (!state.selectedPatientForTherapist.appointments) {
            state.selectedPatientForTherapist.appointments = [];
        }
        state.selectedPatientForTherapist.appointments.push(appointment.id);

        // Si venía de una solicitud, eliminarla
        if (window.currentRequestId) {
            state.setPendingRequests(state.pendingRequests.filter(r => r.id != window.currentRequestId));
            window.currentRequestId = null;
        }

        import('../main.js').then(main => main.save());

        showToast(`Cita confirmada con ${state.selectedPatientForTherapist.name}`, 'success');

        // Limpiar formulario
        document.getElementById('therapistRut').value = '';
        document.getElementById('patientInfo').style.display = 'none';
        document.getElementById('therapistDate').value = '';
        document.getElementById('therapistTime').innerHTML = '<option value="">Selecciona una fecha</option>';
        document.getElementById('therapistMsg').value = '';
        document.getElementById('therapistPatientName').innerText = '—';
        document.getElementById('therapistDateDisplay').innerText = '—';
        document.getElementById('therapistTimeDisplay').innerText = '—';
        state.setSelectedPatientForTherapist(null);

        import('./auth.js').then(auth => auth.switchTab('citas'));
    }, 1500);
}

export function editAppointment(id) {
    showToast('Función de edición en desarrollo', 'info');
}

export function cancelAppointment(id) {
    if (confirm('¿Cancelar esta cita?')) {
        const appointment = state.appointments.find(a => a.id == id);
        state.setAppointments(state.appointments.filter(a => a.id != id));

        if (appointment?.patientEmail) {
            const subject = 'Cita cancelada - Vínculo Salud';
            const message = `Hola ${appointment.patient},\n\nTu cita con ${appointment.psych} para el ${appointment.date} a las ${appointment.time} ha sido cancelada.\n\nSi necesitas reagendar, contáctanos.\n\nVínculo Salud`;
            sendEmailNotification(appointment.patientEmail, subject, message);
        }

        import('../main.js').then(main => main.save());
        showToast('Cita cancelada', 'success');
    }
}

export function markAsPaid(id) {
    const appointment = state.appointments.find(a => a.id == id);
    if (appointment) {
        appointment.paymentStatus = 'pagado';
        appointment.status = 'confirmada';
        import('../main.js').then(main => main.save());
        showToast('Pago marcado como recibido', 'success');
    }
}