// js/modules/disponibilidad.js - VERSIÓN DEFINITIVA (gestión personal del profesional)
import * as state from './state.js';
import { showToast } from './utils.js';
import { db } from '../config/firebase.js';
import { loadBoxSlots } from './box.js';

// ============================================
// CARGA DE HORARIOS (basado en Box + filtros personales)
// ============================================
export async function loadTimeSlots() {
    const dateInput = document.getElementById('availDate');
    if (!dateInput) return;

    if (!dateInput.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    const date = dateInput.value;
    if (!date || !state.currentUser?.data) return;

    const container = document.getElementById('timeSlotsContainer');
    if (!container) return;

    const professional = state.currentUser.data;
    const profStart = professional.startTime || '00:00';
    const profEnd = professional.endTime || '23:59';
    const unavailableSlots = professional.unavailableSlots || {};

    // Obtener slots del Box para esa fecha
    let boxSlots = [];
    try {
        boxSlots = await loadBoxSlots(date);
    } catch (err) {
        console.warn('Error cargando Box:', err);
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">Error al cargar horarios base</div>';
        return;
    }

    // Filtrar por rango horario personal
    let personalSlots = boxSlots.filter(slot => {
        const slotStart = slot.timeLabel.split(' - ')[0];
        return slotStart >= profStart && slotStart < profEnd;
    });

    // Aplicar anulaciones personales (unavailableSlots para esta fecha)
    const anulacionesHoy = unavailableSlots[date] || [];
    if (anulacionesHoy.includes('ALL_DAY')) {
        personalSlots = [];
    } else {
        personalSlots = personalSlots.filter(slot => !anulacionesHoy.includes(slot.timeLabel));
    }

    // Verificar si el slot está ocupado por una cita del profesional (para mostrar como reservado)
    const citasPropias = state.appointments.filter(a => 
        a.psychId == professional.id && a.date === date
    ).map(a => a.time);

    container.innerHTML = '';
    if (personalSlots.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">No hay horarios disponibles según tu disponibilidad personal</div>';
        return;
    }

    personalSlots.sort((a, b) => a.timeLabel.localeCompare(b.timeLabel));

    for (const slot of personalSlots) {
        const estaOcupado = citasPropias.includes(slot.timeLabel);
        const slotDiv = document.createElement('div');
        slotDiv.className = `time-slot ${estaOcupado ? 'booked' : ''}`;
        slotDiv.textContent = `${slot.timeLabel} ${estaOcupado ? '(Reservado)' : '(Disponible)'}`;

        if (!estaOcupado) {
            slotDiv.title = 'Haz clic para anular este horario personalmente';
            slotDiv.style.cursor = 'pointer';
            slotDiv.onclick = () => toggleAnularHorario(date, slot.timeLabel);
        } else {
            slotDiv.title = 'Este horario ya tiene una cita asignada. No se puede anular.';
            slotDiv.style.opacity = '0.6';
        }
        container.appendChild(slotDiv);
    }
}

// ============================================
// ANULAR / DESANULAR UN HORARIO PERSONAL
// ============================================
async function toggleAnularHorario(date, timeLabel) {
    const professional = state.currentUser.data;
    if (!professional) return;

    const unavailable = { ...(professional.unavailableSlots || {}) };
    const anulacionesHoy = unavailable[date] || [];

    if (anulacionesHoy.includes(timeLabel)) {
        // Desanular
        const nuevas = anulacionesHoy.filter(t => t !== timeLabel);
        if (nuevas.length === 0) delete unavailable[date];
        else unavailable[date] = nuevas;
        showToast(`✅ Horario ${timeLabel} disponible nuevamente`, 'success');
    } else {
        // Anular
        if (!anulacionesHoy.includes('ALL_DAY')) {
            unavailable[date] = [...anulacionesHoy, timeLabel];
            showToast(`⚠️ Horario ${timeLabel} anulado personalmente`, 'warning');
        } else {
            showToast('Este día ya está completamente anulado', 'error');
            return;
        }
    }

    // Guardar en Firebase
    try {
        await db.ref(`staff/${professional.id}`).update({
            unavailableSlots: unavailable,
            updatedAt: Date.now()
        });
        // Actualizar estado local
        professional.unavailableSlots = unavailable;
        const staffIndex = state.staff.findIndex(s => s.id == professional.id);
        if (staffIndex !== -1) state.staff[staffIndex].unavailableSlots = unavailable;

        loadTimeSlots(); // refrescar vista
    } catch (err) {
        console.error('Error guardando anulación:', err);
        showToast('Error al guardar', 'error');
    }
}

// ============================================
// ANULAR DÍA COMPLETO
// ============================================
export async function anularDiaCompleto() {
    const date = document.getElementById('availDate')?.value;
    if (!date) {
        showToast('Selecciona una fecha', 'error');
        return;
    }
    const professional = state.currentUser.data;
    const unavailable = { ...(professional.unavailableSlots || {}) };
    const anulacionesHoy = unavailable[date] || [];

    if (anulacionesHoy.includes('ALL_DAY')) {
        // Si ya está anulado, quitamos la anulación
        delete unavailable[date];
        showToast(`✅ Día ${date} desanulado`, 'success');
    } else {
        unavailable[date] = ['ALL_DAY'];
        showToast(`🚫 Día ${date} anulado completamente`, 'warning');
    }

    try {
        await db.ref(`staff/${professional.id}`).update({ unavailableSlots: unavailable });
        professional.unavailableSlots = unavailable;
        const staffIndex = state.staff.findIndex(s => s.id == professional.id);
        if (staffIndex !== -1) state.staff[staffIndex].unavailableSlots = unavailable;
        loadTimeSlots();
    } catch (err) {
        console.error(err);
        showToast('Error al guardar', 'error');
    }
}

// ============================================
// EDITAR RANGO HORARIO PERSONAL (startTime / endTime)
// ============================================
export function mostrarModalRangoHorario() {
    const prof = state.currentUser.data;
    const modalHtml = `
        <div id="modalRangoHorario" class="modal" style="display:flex;">
            <div class="modal-content" style="max-width:400px;">
                <h3>✏️ Editar mi horario de atención</h3>
                <p>Define el rango en el que atiendes (se aplicará a todos los días).</p>
                <label>Hora inicio</label>
                <input type="time" id="editStartTime" value="${prof.startTime || '08:00'}" class="filter-input">
                <label>Hora fin</label>
                <input type="time" id="editEndTime" value="${prof.endTime || '20:00'}" class="filter-input">
                <div style="margin-top:20px; display:flex; gap:10px;">
                    <button class="btn-staff" onclick="guardarRangoHorario()">Guardar</button>
                    <button class="btn-staff" onclick="cerrarModalRango()">Cancelar</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

export async function guardarRangoHorario() {
    const startTime = document.getElementById('editStartTime')?.value;
    const endTime = document.getElementById('editEndTime')?.value;
    if (!startTime || !endTime) {
        showToast('Completa ambos campos', 'error');
        return;
    }
    const professional = state.currentUser.data;
    try {
        await db.ref(`staff/${professional.id}`).update({ startTime, endTime });
        professional.startTime = startTime;
        professional.endTime = endTime;
        const staffIndex = state.staff.findIndex(s => s.id == professional.id);
        if (staffIndex !== -1) {
            state.staff[staffIndex].startTime = startTime;
            state.staff[staffIndex].endTime = endTime;
        }
        showToast('✅ Rango horario actualizado', 'success');
        cerrarModalRango();
        loadTimeSlots();
    } catch (err) {
        console.error(err);
        showToast('Error al guardar', 'error');
    }
}

export function cerrarModalRango() {
    const modal = document.getElementById('modalRangoHorario');
    if (modal) modal.remove();
}

// ============================================
// FUNCIONES OBSOLETAS (redirigen a Box)
// ============================================
export function showAvailabilityModal() {
    showToast('Para gestionar los horarios base del Box, usa la pestaña "Box Compartido" (Admin). Para tu disponibilidad personal, usa los botones de esta pantalla.', 'info');
}
export function closeAvailabilityModal() {}
export function generateTimeSlots() { showToast('La generación de horarios base se hace en el panel del Box.', 'info'); }
export function toggleWeekday() {}
export function blockTimeRange() {}
export function applyGeneratedSlots() { showToast('Usa el panel del Box para generar slots base.', 'info'); }
export function clearAllSlots() { showToast('Usa el panel del Box para limpiar slots base.', 'info'); }
export function saveAvailability() { showToast('La disponibilidad personal se guarda automáticamente.', 'info'); }
export function addOvercupo() { showToast('Los sobrecupos ya no están soportados. Usa el Box.', 'info'); }

// ============================================
// EXPORTAR AL WINDOW (para botones)
// ============================================
if (typeof window !== 'undefined') {
    window.loadTimeSlots = loadTimeSlots;
    window.mostrarModalRangoHorario = mostrarModalRangoHorario;
    window.guardarRangoHorario = guardarRangoHorario;
    window.cerrarModalRango = cerrarModalRango;
    window.anularDiaCompleto = anularDiaCompleto;
    // Funciones antiguas (compatibilidad)
    window.showAvailabilityModal = showAvailabilityModal;
    window.closeAvailabilityModal = closeAvailabilityModal;
    window.generateTimeSlots = generateTimeSlots;
    window.toggleWeekday = toggleWeekday;
    window.blockTimeRange = blockTimeRange;
    window.applyGeneratedSlots = applyGeneratedSlots;
    window.clearAllSlots = clearAllSlots;
    window.saveAvailability = saveAvailability;
    window.addOvercupo = addOvercupo;
}

console.log('✅ disponibilidad.js actualizado: gestión personal de rango y anulaciones, usando Box como base');