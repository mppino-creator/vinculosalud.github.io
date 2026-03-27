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

    // Obtener citas y solicitudes según rol
    let citas = [];
    let solicitudes = [];
    if (user.role === 'admin') {
        citas = state.appointments;
        solicitudes = state.pendingRequests;
    } else if (user.role === 'psych') {
        citas = state.appointments.filter(a => a.psychId == user.data.id);
        solicitudes = state.pendingRequests.filter(r => r.psychId == user.data.id);
    }

    // Obtener disponibilidad del profesional (si es psicólogo)
    let disponibilidad = {};
    if (user.role === 'psych' && user.data.availability) {
        disponibilidad = user.data.availability;
    }

    // Crear estructura del mes
    const primerDia = new Date(añoActual, mesActual, 1);
    const ultimoDia = new Date(añoActual, mesActual + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaInicioSemana = primerDia.getDay();

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

                // Obtener eventos del día
                const citasDia = citas.filter(c => c.date === fechaStr);
                const solicitudesDia = solicitudes.filter(s => s.date === fechaStr && s.time !== 'Pendiente');
                const slotsDelDia = disponibilidad[fechaStr] || [];

                // Crear lista de eventos (citas, solicitudes, slots disponibles sin evento)
                const eventos = [];

                // Agregar citas
                citasDia.forEach(cita => {
                    const profesional = state.staff.find(p => p.id == cita.psychId);
                    const paciente = state.patients.find(p => p.id == cita.patientId);
                    const profNombre = profesional?.name || cita.psych || '?';
                    const pacNombre = paciente?.name || cita.patient || '?';
                    eventos.push({
                        tipo: 'cita',
                        hora: cita.time,
                        titulo: user.role === 'admin' ? `${cita.time} 🖥️ ${profNombre} - ${pacNombre}` : `${cita.time} 🖥️ ${pacNombre}`,
                        descripcion: `Cita ${cita.type === 'online' ? 'Online' : 'Presencial'} · ${profNombre} · ${pacNombre} · ${cita.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente'}`,
                        color: '#dc3545',
                        onClick: () => verDetalleCita(cita.id)
                    });
                });

                // Agregar solicitudes
                solicitudesDia.forEach(sol => {
                    const profesional = state.staff.find(p => p.id == sol.psychId);
                    const paciente = state.patients.find(p => p.id == sol.patientId);
                    const profNombre = profesional?.name || sol.psych || '?';
                    const pacNombre = paciente?.name || sol.patient || '?';
                    eventos.push({
                        tipo: 'solicitud',
                        hora: sol.time,
                        titulo: user.role === 'admin' ? `${sol.time} 🏢 ${profNombre} - ${pacNombre} (pend)` : `${sol.time} 🏢 ${pacNombre} (pend)`,
                        descripcion: `Solicitud presencial · ${profNombre} · ${pacNombre} · ${sol.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente'}`,
                        color: '#ffc107',
                        onClick: () => verDetalleSolicitud(sol.id)
                    });
                });

                // Agregar slots disponibles (solo si no hay evento en esa hora)
                slotsDelDia.forEach(slot => {
                    if (slot.blocked) {
                        eventos.push({
                            tipo: 'bloqueado',
                            hora: slot.time,
                            titulo: `${slot.time} (anulado)`,
                            descripcion: 'Anulado por el profesional',
                            color: '#6c757d',
                            onClick: user.role === 'psych' ? () => anularHora(fechaStr, slot.time, true) : null
                        });
                    } else {
                        const yaHayEvento = eventos.some(e => e.hora === slot.time);
                        if (!yaHayEvento) {
                            eventos.push({
                                tipo: 'disponible',
                                hora: slot.time,
                                titulo: `${slot.time} (disponible)`,
                                descripcion: 'Horario disponible',
                                color: '#28a745',
                                onClick: user.role === 'psych' ? () => anularHora(fechaStr, slot.time, false) : null
                            });
                        }
                    }
                });

                // Ordenar eventos por hora
                eventos.sort((a, b) => a.hora.localeCompare(b.hora));

                // Construir celda
                html += `<td class="calendar-cell" style="vertical-align:top; border:1px solid #ddd; padding:8px; width:14%;">
                    <div style="font-weight:bold; margin-bottom:8px;">${dia}</div>
                    <div style="font-size:0.75rem;">`;

                if (eventos.length === 0) {
                    html += '<span style="color:#999;">Sin horarios</span>';
                } else {
                    eventos.forEach(ev => {
                        const cursor = ev.onClick ? 'pointer' : 'default';
                        html += `<div class="calendar-event" style="background:${ev.color}; margin:2px 0; padding:2px 4px; border-radius:4px; color:white; cursor:${cursor};" title="${ev.descripcion}" onclick="${ev.onClick ? `(${ev.onClick.toString()})()` : ''}">${ev.titulo}</div>`;
                    });
                }

                html += `</div><\/td>`;
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
    // Exponer funciones directamente en window para que los onclick las encuentren
    window.verDetalleCita = verDetalleCita;
    window.verDetalleSolicitud = verDetalleSolicitud;
    window.confirmarSolicitud = confirmarSolicitud;

    // También exponer el objeto calendario para navegación
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

console.log('✅ calendario.js actualizado: muestra todas las citas y solicitudes individualmente');