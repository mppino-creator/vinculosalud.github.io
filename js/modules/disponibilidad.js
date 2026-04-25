// js/modules/disponibilidad.js - GESTIÓN PERSONAL DEL PROFESIONAL (con Box, fechas locales corregidas)
import * as state from './state.js';
import { showToast } from './utils.js';
import { db } from '../config/firebase.js';
import { loadBoxSlots, saveBoxSlots } from './box.js';

// Convierte una fecha Date a string YYYY-MM-DD en hora local
function toLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Obtiene el nombre del día de la semana en español (Lun, Mar, Mié, Jue, Vie, Sáb, Dom) a partir del día numérico (0=domingo)
function getDayName(dayNum) {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[dayNum];
}

// ============================================
// RENDERIZADO PRINCIPAL DE LA PESTAÑA "GESTIONAR MI DISPONIBILIDAD"
// ============================================
export async function renderMiDisponibilidad() {
    const container = document.getElementById('tabDisponibilidad');
    if (!container) return;

    const professional = state.currentUser?.data;
    if (!professional) {
        container.innerHTML = '<div class="info-message">Debes iniciar sesión como profesional</div>';
        return;
    }

    // Obtener valores guardados o usar defaults
    const startTime = professional.startTime || '08:00';
    const endTime = professional.endTime || '20:00';
    const selectedWeekdays = professional.selectedWeekdays || ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

    // HTML de la interfaz
    container.innerHTML = `
        <h3>📅 Gestionar Mi Disponibilidad Personal</h3>
        <p class="info-message">Define los horarios en los que atenderás. Los pacientes solo verán los horarios del Box que coincidan con tu configuración.</p>

        <!-- Sección: Rango de fechas -->
        <div class="admin-box-config" style="background:#f9f9fc; padding:20px; border-radius:16px; margin-bottom:25px;">
            <h4 style="margin-top:0;">🗓️ Rango de fechas a aplicar</h4>
            <div class="form-row" style="display:flex; gap:15px; flex-wrap:wrap; margin-bottom:15px;">
                <div class="field" style="flex:1;">
                    <label>📅 Fecha inicio</label>
                    <input type="date" id="miRangoStartDate" class="filter-input" value="${toLocalDateString(new Date())}">
                </div>
                <div class="field" style="flex:1;">
                    <label>📅 Fecha fin</label>
                    <input type="date" id="miRangoEndDate" class="filter-input" value="${toLocalDateString(new Date(new Date().setMonth(new Date().getMonth()+2)))}">
                </div>
            </div>
            <div class="form-row" style="display:flex; gap:15px; flex-wrap:wrap; margin-bottom:15px;">
                <div class="field" style="flex:1;">
                    <label>⏰ Hora inicio atención</label>
                    <input type="time" id="miStartTime" value="${startTime}" class="filter-input">
                </div>
                <div class="field" style="flex:1;">
                    <label>⏰ Hora fin atención</label>
                    <input type="time" id="miEndTime" value="${endTime}" class="filter-input">
                </div>
            </div>
            <div style="margin-bottom:15px;">
                <label>📌 Días de la semana que atiendes</label>
                <div class="weekday-selector" id="miWeekdaySelector" style="display:flex; gap:10px; flex-wrap:wrap; margin-top:8px;">
                    ${['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(day => `
                        <div class="weekday ${selectedWeekdays.includes(day) ? 'selected' : ''}" data-day="${day}">${day}</div>
                    `).join('')}
                </div>
            </div>
            <div style="margin-bottom:15px;">
                <label>🚫 Bloquear un rango de horas (ej. 13:00 - 14:00)</label>
                <div style="display:flex; gap:10px; align-items:center;">
                    <input type="time" id="blockStartTime" placeholder="Inicio" style="flex:1;">
                    <input type="time" id="blockEndTime" placeholder="Fin" style="flex:1;">
                    <button id="applyBlockRangeBtn" class="btn-staff" style="background:#dc3545;">Bloquear rango</button>
                </div>
                <small>Este bloqueo se aplicará a todas las fechas del rango seleccionado</small>
            </div>
            <div style="display:flex; gap:15px; margin-top:20px;">
                <button id="applyMyAvailabilityBtn" class="btn-staff" style="background:var(--verde-exito); flex:1;">✅ Aplicar configuración</button>
                <button id="clearMyAvailabilityBtn" class="btn-staff" style="background:#6c757d; flex:1;">🗑️ Limpiar toda mi disponibilidad personal</button>
            </div>
        </div>

        <!-- Vista previa de los slots resultantes (para la fecha actual) -->
        <h4>🔍 Vista previa de tu disponibilidad (basada en Box + tu configuración)</h4>
        <div style="display:flex; gap:10px; margin-bottom:10px;">
            <input type="date" id="previewDate" class="filter-input" value="${toLocalDateString(new Date())}">
            <button id="refreshPreviewBtn" class="btn-staff">Actualizar vista</button>
        </div>
        <div id="previewSlotsContainer" class="slots-grid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px;"></div>
    `;

    // ---- Lógica de interacción ----
    const startDateInput = document.getElementById('miRangoStartDate');
    const endDateInput = document.getElementById('miRangoEndDate');
    const startTimeInput = document.getElementById('miStartTime');
    const endTimeInput = document.getElementById('miEndTime');
    const blockStart = document.getElementById('blockStartTime');
    const blockEnd = document.getElementById('blockEndTime');
    const applyBtn = document.getElementById('applyMyAvailabilityBtn');
    const clearBtn = document.getElementById('clearMyAvailabilityBtn');
    const previewDateInput = document.getElementById('previewDate');
    const refreshPreviewBtn = document.getElementById('refreshPreviewBtn');

    // Selección de días
    let selectedDays = [...selectedWeekdays];
    document.querySelectorAll('#miWeekdaySelector .weekday').forEach(dayDiv => {
        const dayName = dayDiv.getAttribute('data-day');
        if (selectedDays.includes(dayName)) dayDiv.classList.add('selected');
        dayDiv.addEventListener('click', () => {
            if (selectedDays.includes(dayName)) {
                selectedDays = selectedDays.filter(d => d !== dayName);
                dayDiv.classList.remove('selected');
            } else {
                selectedDays.push(dayName);
                dayDiv.classList.add('selected');
            }
        });
    });

    // Función para aplicar la configuración (guardar startTime/endTime y actualizar unavailableSlots) - USANDO FECHAS LOCALES
    async function aplicarConfiguracion() {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const startH = startTimeInput.value;
        const endH = endTimeInput.value;
        const blockStartH = blockStart.value;
        const blockEndH = blockEnd.value;

        if (!startDate || !endDate || !startH || !endH) {
            showToast('Completa todas las fechas y horarios', 'error');
            return;
        }
        if (startDate > endDate) {
            showToast('La fecha inicio debe ser anterior a la fecha fin', 'error');
            return;
        }

        // 1. Guardar startTime y endTime en el perfil del profesional
        await db.ref(`staff/${professional.id}`).update({ startTime: startH, endTime: endH });
        professional.startTime = startH;
        professional.endTime = endH;
        const staffIndex = state.staff.findIndex(s => s.id == professional.id);
        if (staffIndex !== -1) {
            state.staff[staffIndex].startTime = startH;
            state.staff[staffIndex].endTime = endH;
        }

        // 2. Obtener disponibilidad actual (unavailableSlots)
        let unavailable = professional.unavailableSlots || {};

        // 3. Para cada fecha en el rango (usando fechas locales)
        const start = new Date(startDate);
        const end = new Date(endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = toLocalDateString(d);
            const dayOfWeek = d.getDay(); // 0=domingo, 1=lunes, ...
            const dayName = getDayName(dayOfWeek); // 'Dom', 'Lun', ...

            if (!selectedDays.includes(dayName)) {
                // Si el día no está seleccionado, marcar como ALL_DAY anulado
                unavailable[dateStr] = ['ALL_DAY'];
            } else {
                // Día seleccionado: aplicar bloqueo de rango si se especificó
                let anulaciones = unavailable[dateStr] || [];
                if (anulaciones.includes('ALL_DAY')) {
                    anulaciones = []; // quitamos anulación total si existía
                }
                if (blockStartH && blockEndH) {
                    // Obtener todos los slots del Box para esa fecha
                    const boxSlots = await loadBoxSlots(dateStr);
                    const slotsEnRango = boxSlots.filter(slot => {
                        const slotStart = slot.timeLabel.split(' - ')[0];
                        return slotStart >= blockStartH && slotStart < blockEndH;
                    }).map(slot => slot.timeLabel);
                    // Añadir esos slots a unavailable (sin duplicados)
                    for (const slot of slotsEnRango) {
                        if (!anulaciones.includes(slot)) anulaciones.push(slot);
                    }
                }
                if (anulaciones.length === 0) delete unavailable[dateStr];
                else unavailable[dateStr] = anulaciones;
            }
        }

        // Guardar unavailableSlots actualizado
        await db.ref(`staff/${professional.id}`).update({ unavailableSlots: unavailable });
        professional.unavailableSlots = unavailable;
        if (staffIndex !== -1) state.staff[staffIndex].unavailableSlots = unavailable;

        showToast('✅ Configuración de disponibilidad guardada', 'success');
        // Refrescar vista previa
        cargarVistaPrevia();
    }

    // Limpiar toda la disponibilidad personal
    async function limpiarDisponibilidad() {
        if (!confirm('¿Eliminar toda tu configuración de disponibilidad personal? Volverás a atender en todo el rango horario por defecto (00:00-23:59).')) return;
        await db.ref(`staff/${professional.id}`).update({
            startTime: '00:00',
            endTime: '23:59',
            unavailableSlots: {}
        });
        professional.startTime = '00:00';
        professional.endTime = '23:59';
        professional.unavailableSlots = {};
        const staffIndex = state.staff.findIndex(s => s.id == professional.id);
        if (staffIndex !== -1) {
            state.staff[staffIndex].startTime = '00:00';
            state.staff[staffIndex].endTime = '23:59';
            state.staff[staffIndex].unavailableSlots = {};
        }
        showToast('Disponibilidad personal eliminada', 'success');
        cargarVistaPrevia();
        // Actualizar inputs
        document.getElementById('miStartTime').value = '00:00';
        document.getElementById('miEndTime').value = '23:59';
    }

    // Vista previa: mostrar slots del Box para una fecha, aplicando start/end y unavailableSlots
    async function cargarVistaPrevia() {
        const date = previewDateInput.value;
        if (!date) return;
        const containerPrev = document.getElementById('previewSlotsContainer');
        containerPrev.innerHTML = '<div>Cargando...</div>';

        const profActual = state.currentUser.data;
        const startH = profActual.startTime || '00:00';
        const endH = profActual.endTime || '23:59';
        const unavailable = profActual.unavailableSlots || {};
        const anulacionesHoy = unavailable[date] || [];

        if (anulacionesHoy.includes('ALL_DAY')) {
            containerPrev.innerHTML = '<div class="info-message">🚫 Día completamente anulado según tu configuración.</div>';
            return;
        }

        const boxSlots = await loadBoxSlots(date);
        if (boxSlots.length === 0) {
            containerPrev.innerHTML = '<div class="info-message">No hay horarios disponibles en el Box para esta fecha.</div>';
            return;
        }

        let misSlots = boxSlots.filter(slot => {
            const slotStart = slot.timeLabel.split(' - ')[0];
            return slotStart >= startH && slotStart < endH && !anulacionesHoy.includes(slot.timeLabel);
        });
        misSlots.sort((a,b) => a.timeLabel.localeCompare(b.timeLabel));

        if (misSlots.length === 0) {
            containerPrev.innerHTML = '<div class="info-message">No hay horarios disponibles en el Box que cumplan tu configuración para esta fecha.</div>';
            return;
        }

        containerPrev.innerHTML = misSlots.map(slot => `
            <div class="slot-card" style="background:#fefcf9; border-radius:16px; padding:12px; border:1px solid #e9dfd3;">
                <div style="font-weight:700;">${slot.timeLabel}</div>
                <div class="slot-status available" style="display:inline-block; padding:2px 10px; border-radius:20px; background:#d9e8e2; color:#1e6b55;">Disponible para pacientes</div>
            </div>
        `).join('');
    }

    // Eventos
    applyBtn.addEventListener('click', aplicarConfiguracion);
    clearBtn.addEventListener('click', limpiarDisponibilidad);
    refreshPreviewBtn.addEventListener('click', cargarVistaPrevia);
    previewDateInput.addEventListener('change', cargarVistaPrevia);

    // Cargar vista previa inicial
    await cargarVistaPrevia();
}

// ============================================
// FUNCIONES LEGACY PARA COMPATIBILIDAD
// ============================================
export function showAvailabilityModal() {
    showToast('Usa la sección "Gestionar Mi Disponibilidad" para configurar tus horarios.', 'info');
}
export function closeAvailabilityModal() {}
export function generateTimeSlots() {}
export function toggleWeekday() {}
export function blockTimeRange() {}
export function applyGeneratedSlots() {}
export function clearAllSlots() {}
export function saveAvailability() {}
export function loadTimeSlots() { renderMiDisponibilidad(); }
export function addOvercupo() {}

// Exponer función principal al window
if (typeof window !== 'undefined') {
    window.renderMiDisponibilidad = renderMiDisponibilidad;
    window.loadTimeSlots = loadTimeSlots;
}
console.log('✅ disponibilidad.js actualizado: fechas 100% locales y corrección de anulación de días');