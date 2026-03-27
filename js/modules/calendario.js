// js/modules/calendario.js
import * as state from './state.js';
import { showToast } from './utils.js';

let mesActual = new Date().getMonth();
let añoActual = new Date().getFullYear();

// ============================================
// RENDERIZADO PRINCIPAL DEL CALENDARIO
// ============================================
export function renderCalendar() {
    const container = document.getElementById('calendarContainer');
    if (!container) return;

    const user = state.currentUser;
    if (!user) return;

    // Obtener citas según rol
    let citas = [];
    let solicitudes = [];
    if (user.role === 'admin') {
        citas = state.appointments;
        solicitudes = state.pendingRequests;
    } else if (user.role === 'psych') {
        citas = state.appointments.filter(a => a.psychId == user.data.id);
        solicitudes = state.pendingRequests.filter(r => r.psychId == user.data.id);
    }

    // Agrupar citas por fecha
    const citasPorFecha = {};
    citas.forEach(cita => {
        if (!cita.date) return;
        if (!citasPorFecha[cita.date]) citasPorFecha[cita.date] = [];
        citasPorFecha[cita.date].push({ ...cita, tipo: 'cita' });
    });

    // Agrupar solicitudes por fecha
    const solicitudesPorFecha = {};
    solicitudes.forEach(sol => {
        if (!sol.date) return;
        if (!solicitudesPorFecha[sol.date]) solicitudesPorFecha[sol.date] = [];
        solicitudesPorFecha[sol.date].push({ ...sol, tipo: 'solicitud' });
    });

    // Obtener disponibilidad del profesional (si es psicólogo)
    let disponibilidad = {};
    if (user.role === 'psych' && user.data.availability) {
        disponibilidad = user.data.availability;
    }

    // Crear estructura de horarios para cada día
    const primerDia = new Date(añoActual, mesActual, 1);
    const ultimoDia = new Date(añoActual, mesActual + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaInicioSemana = primerDia.getDay();

    // Función para obtener el estado de una hora en un día
    function getSlotStatus(fechaStr, hora) {
        // Verificar si hay cita en esa hora (prioridad mayor)
        const cita = citasPorFecha[fechaStr]?.find(c => c.time === hora);
        if (cita) {
            return { status: 'cita', item: cita };
        }

        // Verificar si hay solicitud presencial en esa hora (solo si tiene hora definida)
        const solicitud = solicitudesPorFecha[fechaStr]?.find(s => s.time === hora && s.time !== 'Pendiente');
        if (solicitud) {
            return { status: 'solicitud', item: solicitud };
        }

        // Verificar si está anulada (bloqueada) en disponibilidad
        const slots = disponibilidad[fechaStr];
        const slot = slots?.find(s => s.time === hora);
        if (slot && slot.blocked) return { status: 'blocked' };

        // Verificar si está disponible (existe en disponibilidad y no está bloqueada)
        if (slot && !slot.blocked) return { status: 'available' };

        return { status: 'none' };
    }

    // Construir tabla
    let html = `
        <div style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
            <h4>${primerDia.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h4>
            <div style="display:flex; gap:10px;">
                <button class="btn-staff" onclick="window.calendario.cambiarMes(-1)">◀ Mes anterior</button>
                <button class="btn-staff" onclick="window.calendario.cambiarMes(1)">Mes siguiente ▶</button>
            </div>
        </div>
        <!-- Leyenda de colores -->
        <div style="margin-bottom:15px; display:flex; gap:15px; flex-wrap:wrap; font-size:0.8rem;">
            <span><span style="display:inline-block; width:12px; height:12px; background:#28a745; border-radius:2px;"></span> Disponible</span>
            <span><span style="display:inline-block; width:12px; height:12px; background:#dc3545; border-radius:2px;"></span> Cita confirmada</span>
            <span><span style="display:inline-block; width:12px; height:12px; background:#ffc107; border-radius:2px;"></span> Solicitud pendiente</span>
            <span><span style="display:inline-block; width:12px; height:12px; background:#6c757d; border-radius:2px;"></span> Anulado</span>
            <span><span style="display:inline-block; width:12px; height:12px; background:#e9ecef; border-radius:2px;"></span> Sin disponibilidad</span>
        </div>
        <table class="calendar-table" style="width:100%; border-collapse:collapse;">
            <thead>
                <tr>
                    <th>Dom</th><th>Lun</th><th>Mar</th><th>Mié</th><th>Jue</th><th>Vie</th><th>Sáb</th>
                </tr>
            </thead>
            <tbody>
    `;

    let dia = 1;
    for (let i = 0; i < 6; i++) {
        if (dia > diasEnMes) break;
        html += '<tr>';
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < diaInicioSemana) {
                html += '<td class="calendar-cell empty">   <\/td>';
            } else if (dia <= diasEnMes) {
                const fechaStr = `${añoActual}-${String(mesActual+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
                const citasDia = citasPorFecha[fechaStr] || [];
                const solicitudesDia = solicitudesPorFecha[fechaStr] || [];
                const slotsDelDia = disponibilidad[fechaStr] || [];

                // Recolectar todas las horas únicas de disponibilidad y de eventos
                const horasSet = new Set([
                    ...slotsDelDia.map(s => s.time),
                    ...citasDia.map(c => c.time),
                    ...solicitudesDia.filter(s => s.time !== 'Pendiente').map(s => s.time)
                ]);
                const horas = Array.from(horasSet).sort();

                html += `<td class="calendar-cell" style="vertical-align:top; border:1px solid #ddd; padding:8px; width:14%;">
                    <div style="font-weight:bold; margin-bottom:8px;">${dia}</div>
                    <div style="font-size:0.75rem;">`;

                if (horas.length === 0) {
                    html += '<span style="color:#999;">Sin horarios</span>';
                } else {
                    horas.forEach(hora => {
                        const { status, item } = getSlotStatus(fechaStr, hora);
                        let color = '';
                        let title = '';
                        let clase = '';
                        let onClick = '';
                        let displayText = '';

                        if (status === 'available') {
                            color = '#28a745';
                            title = 'Disponible';
                            displayText = hora;
                            if (user.role === 'psych') {
                                onClick = `onclick="window.calendario.anularHora('${fechaStr}', '${hora}', false)"`;
                            }
                        } else if (status === 'cita') {
                            color = '#dc3545';
                            // Buscar nombres del profesional y paciente
                            const paciente = state.patients.find(p => p.id == item.patientId);
                            const pacienteNombre = paciente?.name || item.patient || '?';
                            const profesional = state.staff.find(p => p.id == item.psychId);
                            const profesionalNombre = profesional?.name || item.psych || '?';
                            const tipoIcono = item.type === 'online' ? '🖥️' : '🏢';
                            const tipoTexto = item.type === 'online' ? 'Online' : 'Presencial';
                            const estadoPago = item.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente';
                            
                            if (user.role === 'admin') {
                                // Admin: muestra hora, ícono, profesional y paciente
                                displayText = `${hora} ${tipoIcono} ${profesionalNombre} - ${pacienteNombre}`;
                                title = `${hora} · ${tipoTexto} · ${profesionalNombre} · ${pacienteNombre} · ${estadoPago}`;
                            } else {
                                // Psicólogo: solo hora, ícono y paciente
                                displayText = `${hora} ${tipoIcono} ${pacienteNombre}`;
                                title = `${hora} · ${tipoTexto} · ${pacienteNombre} · ${estadoPago}`;
                            }
                            onClick = `onclick="window.calendario.verDetalleCita('${item.id}')"`;
                        } else if (status === 'solicitud') {
                            color = '#ffc107';
                            const paciente = state.patients.find(p => p.id == item.patientId);
                            const pacienteNombre = paciente?.name || item.patient || '?';
                            const profesional = state.staff.find(p => p.id == item.psychId);
                            const profesionalNombre = profesional?.name || item.psych || '?';
                            const tipoIcono = '🏢'; // presencial
                            const estadoPago = item.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente';
                            
                            if (user.role === 'admin') {
                                displayText = `${hora} ${tipoIcono} ${profesionalNombre} - ${pacienteNombre} (pend)`;
                                title = `Solicitud · ${hora} · Presencial · ${profesionalNombre} · ${pacienteNombre} · ${estadoPago}`;
                            } else {
                                displayText = `${hora} ${tipoIcono} ${pacienteNombre} (pend)`;
                                title = `Solicitud · ${hora} · Presencial · ${pacienteNombre} · ${estadoPago}`;
                            }
                            onClick = `onclick="window.calendario.verDetalleSolicitud('${item.id}')"`;
                        } else if (status === 'blocked') {
                            color = '#6c757d';
                            title = 'Anulado por el profesional';
                            displayText = `${hora} (anulado)`;
                            clase = 'blocked-slot';
                            if (user.role === 'psych') {
                                onClick = `onclick="window.calendario.anularHora('${fechaStr}', '${hora}', false)"`;
                            }
                        } else {
                            color = '#e9ecef';
                            title = 'No disponible';
                            displayText = hora;
                        }

                        html += `<div class="time-slot ${clase}" style="background:${color}; margin:2px 0; padding:2px 4px; border-radius:4px; color:${status === 'cita' || status === 'solicitud' || status === 'blocked' ? 'white' : '#333'}; cursor:${user.role === 'psych' && (status === 'available' || status === 'blocked') ? 'pointer' : (status === 'cita' || status === 'solicitud') ? 'pointer' : 'default'};" title="${title}" ${onClick}>${displayText}</div>`;
                    });
                }
                html += `</div>
                         <\/td>`;
                dia++;
            } else {
                html += '<td class="calendar-cell empty">   <\/td>';
            }
        }
        html += '<\/tr>';
    }

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

// ============================================
// FUNCIÓN PARA VER DETALLE DE CITA
// ============================================
export function verDetalleCita(citaId) {
    const cita = state.appointments.find(a => a.id == citaId);
    if (!cita) {
        showToast('Cita no encontrada', 'error');
        return;
    }
    const paciente = state.patients.find(p => p.id == cita.patientId);
    const profesional = state.staff.find(p => p.id == cita.psychId);
    const detalles = `
        <strong>Paciente:</strong> ${paciente?.name || cita.patient || '?'}<br>
        <strong>Profesional:</strong> ${profesional?.name || cita.psych || '?'}<br>
        <strong>Fecha:</strong> ${cita.date}<br>
        <strong>Hora:</strong> ${cita.time}<br>
        <strong>Tipo:</strong> ${cita.type === 'online' ? 'Online' : 'Presencial'}<br>
        <strong>Pago:</strong> ${cita.paymentStatus === 'pagado' ? '✅ Pagado' : '⏳ Pendiente'}<br>
        <strong>Valor:</strong> $${cita.price?.toLocaleString() || 0}<br>
        <strong>Estado:</strong> ${cita.status === 'confirmada' ? 'Confirmada' : (cita.status === 'pendiente' ? 'Pendiente' : 'Completada')}<br>
        <strong>Notas:</strong> ${cita.msg || '—'}
    `;
    showToast(detalles, 'info', 5000);
}

// ============================================
// FUNCIÓN PARA VER DETALLE DE SOLICITUD
// ============================================
export function verDetalleSolicitud(solicitudId) {
    const solicitud = state.pendingRequests.find(r => r.id == solicitudId);
    if (!solicitud) {
        showToast('Solicitud no encontrada', 'error');
        return;
    }
    const paciente = state.patients.find(p => p.id == solicitud.patientId);
    const profesional = state.staff.find(p => p.id == solicitud.psychId);
    const detalles = `
        <strong>Paciente:</strong> ${paciente?.name || solicitud.patient || '?'}<br>
        <strong>Profesional:</strong> ${profesional?.name || solicitud.psych || '?'}<br>
        <strong>Fecha:</strong> ${solicitud.date}<br>
        <strong>Hora:</strong> ${solicitud.time === 'Pendiente' ? 'A confirmar' : solicitud.time}<br>
        <strong>Tipo:</strong> Presencial (por confirmar)<br>
        <strong>Pago:</strong> ${solicitud.paymentStatus === 'pagado' ? '✅ Pagado' : '⏳ Pendiente'}<br>
        <strong>Valor:</strong> $${solicitud.price?.toLocaleString() || 0}<br>
        <strong>Notas:</strong> ${solicitud.msg || '—'}<br>
        <button onclick="window.calendario.confirmarSolicitud('${solicitud.id}')" style="margin-top:5px;">Confirmar hora</button>
    `;
    showToast(detalles, 'info', 5000);
}

// ============================================
// FUNCIÓN PARA CONFIRMAR SOLICITUD (redirige a agendar)
// ============================================
export function confirmarSolicitud(solicitudId) {
    if (typeof window.citas?.showConfirmRequestModal === 'function') {
        window.citas.showConfirmRequestModal(solicitudId);
    } else {
        showToast('No se puede confirmar la solicitud en este momento', 'error');
    }
}

// ============================================
// FUNCIÓN PARA ANULAR/DESANULAR UNA HORA
// ============================================
export async function anularHora(fechaStr, hora, esOcupada = false) {
    const user = state.currentUser;
    if (!user || user.role !== 'psych') {
        showToast('Solo el profesional puede anular horas', 'error');
        return;
    }

    const accion = esOcupada ? 'desanular' : 'anular';
    if (!confirm(`¿${accion === 'anular' ? 'Anular' : 'Desanular'} la hora ${hora} del día ${fechaStr}?`)) return;

    // Asegurar estructura de disponibilidad
    if (!user.data.availability) user.data.availability = {};
    if (!user.data.availability[fechaStr]) user.data.availability[fechaStr] = [];

    let slots = user.data.availability[fechaStr];
    const slotIndex = slots.findIndex(s => s.time === hora);
    let slot = slotIndex !== -1 ? slots[slotIndex] : null;

    if (accion === 'anular') {
        // Si la hora está ocupada por una cita, no se puede anular (ya está ocupada)
        const ocupado = state.appointments.some(a => a.psychId == user.data.id && a.date === fechaStr && a.time === hora);
        if (ocupado) {
            showToast('No puedes anular una hora que ya tiene una cita confirmada', 'error');
            return;
        }

        if (slot) {
            slot.blocked = true;
        } else {
            slots.push({ time: hora, isOvercupo: false, blocked: true });
        }
    } else {
        // Desanular: eliminar el flag blocked
        if (slot) {
            delete slot.blocked;
            // Opcional: eliminar el slot si no tiene ningún flag
            if (!slot.isOvercupo && !slot.blocked) {
                // Podríamos dejarlo, pero si quieres limpiar descomenta:
                // slots.splice(slotIndex, 1);
            }
        } else {
            showToast('No se encontró el horario para desanular', 'error');
            return;
        }
    }

    // Guardar cambios
    await firebase.database().ref(`staff/${user.data.id}/availability`).set(user.data.availability);

    // Actualizar estado local y staff
    const staffIndex = state.staff.findIndex(s => s.id == user.data.id);
    if (staffIndex !== -1) state.staff[staffIndex].availability = user.data.availability;

    // Refrescar calendario
    renderCalendar();

    showToast(`✅ Hora ${accion === 'anular' ? 'anulada' : 'desanulada'} correctamente`, 'success');
}

// ============================================
// CAMBIAR MES
// ============================================
export function cambiarMes(delta) {
    const nuevaFecha = new Date(añoActual, mesActual + delta);
    mesActual = nuevaFecha.getMonth();
    añoActual = nuevaFecha.getFullYear();
    renderCalendar();
}

// ============================================
// EXPONER FUNCIONES AL OBJETO WINDOW
// ============================================
if (typeof window !== 'undefined') {
    window.calendario = {
        cambiarMes: cambiarMes,
        anularHora: anularHora,
        verDetalleCita: verDetalleCita,
        verDetalleSolicitud: verDetalleSolicitud,
        confirmarSolicitud: confirmarSolicitud
    };
    if (!window.citas) window.citas = {};
    window.citas.showConfirmRequestModal = (id) => {
        import('./citas.js').then(module => module.showConfirmRequestModal(id))
            .catch(() => showToast('Módulo de citas no disponible', 'error'));
    };
}

console.log('✅ calendario.js actualizado: muestra detalles de citas (profesional, paciente, tipo)');