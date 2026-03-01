// js/modules/disponibilidad.js
import * as state from './state.js';
import { showToast } from './utils.js';

// ============================================
// FUNCIONES DE MODAL
// ============================================

export function showAvailabilityModal() {
    document.getElementById('availabilityModal').style.display = 'flex';

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    document.getElementById('rangeStartDate').value = today.toISOString().split('T')[0];
    document.getElementById('rangeEndDate').value = nextWeek.toISOString().split('T')[0];

    if (state.currentUser?.data) {
        document.getElementById('sessionDuration').value = state.currentUser.data.sessionDuration || 45;
        document.getElementById('breakBetween').value = state.currentUser.data.breakBetween || 10;
    }

    generateTimeSlots();
}

export function closeAvailabilityModal() {
    document.getElementById('availabilityModal').style.display = 'none';
}

// ============================================
// FUNCIONES DE DÍAS DE SEMANA
// ============================================

export function toggleWeekday(day) {
    const element = event.target;
    if (state.selectedWeekdays.includes(day)) {
        state.setSelectedWeekdays(state.selectedWeekdays.filter(d => d !== day));
        element.classList.remove('selected');
    } else {
        state.setSelectedWeekdays([...state.selectedWeekdays, day]);
        element.classList.add('selected');
    }
}

// ============================================
// FUNCIONES DE GENERACIÓN DE HORARIOS
// ============================================

export function generateTimeSlots() {
    const start = document.getElementById('startTime').value;
    const end = document.getElementById('endTime').value;
    const duration = parseInt(document.getElementById('sessionDuration').value);
    const breakTime = parseInt(document.getElementById('breakBetween').value);

    if (!start || !end) {
        showToast('Define horario de inicio y fin', 'error');
        return;
    }

    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const slotDuration = duration + breakTime;

    const slots = [];
    while (currentMinutes + duration <= endMinutes) {
        const hour = Math.floor(currentMinutes / 60);
        const minute = currentMinutes % 60;
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({ time: timeStr, isOvercupo: false });
        currentMinutes += slotDuration;
    }
    state.setGeneratedSlots(slots);
    renderGeneratedSlots();
}

function renderGeneratedSlots() {
    const container = document.getElementById('generatedTimeSlots');
    container.innerHTML = '';
    state.generatedSlots.forEach(slot => {
        const slotDiv = document.createElement('div');
        slotDiv.className = `time-slot selected`;
        slotDiv.textContent = slot.time;
        slotDiv.onclick = () => toggleGeneratedSlot(slot.time);
        container.appendChild(slotDiv);
    });
}

function toggleGeneratedSlot(time) {
    const index = state.generatedSlots.findIndex(s => s.time === time);
    if (index !== -1) {
        const slots = [...state.generatedSlots];
        slots.splice(index, 1);
        state.setGeneratedSlots(slots);
    } else {
        state.setGeneratedSlots([...state.generatedSlots, { time, isOvercupo: false }]);
    }
    renderGeneratedSlots();
}

// ============================================
// FUNCIONES DE BLOQUEO DE RANGOS
// ============================================

export function blockTimeRange() {
    const startTime = document.getElementById('blockStartTime').value;
    const endTime = document.getElementById('blockEndTime').value;

    if (!startTime || !endTime) {
        showToast('Selecciona hora de inicio y fin', 'error');
        return;
    }

    const slots = state.generatedSlots.filter(slot => slot.time < startTime || slot.time >= endTime);
    state.setGeneratedSlots(slots);
    renderGeneratedSlots();
    showToast('Rango de horas eliminado', 'success');
}

// ============================================
// FUNCIONES DE APLICACIÓN DE HORARIOS
// ============================================

export function applyGeneratedSlots() {
    const startDate = new Date(document.getElementById('rangeStartDate').value);
    const endDate = new Date(document.getElementById('rangeEndDate').value);

    if (!startDate || !endDate) {
        showToast('Selecciona rango de fechas', 'error');
        return;
    }

    const weekdayMap = { 'Lun': 1, 'Mar': 2, 'Mie': 3, 'Jue': 4, 'Vie': 5, 'Sab': 6, 'Dom': 0 };
    const selectedDayNumbers = state.selectedWeekdays.map(d => weekdayMap[d]);

    if (!state.currentUser.data.availability) state.currentUser.data.availability = {};

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay();

        if (selectedDayNumbers.includes(dayOfWeek)) {
            if (!state.currentUser.data.availability[dateStr]) state.currentUser.data.availability[dateStr] = [];

            state.generatedSlots.forEach(slot => {
                if (!state.currentUser.data.availability[dateStr].some(s => s.time === slot.time)) {
                    state.currentUser.data.availability[dateStr].push(slot);
                }
            });
        }
    }

    const staffIndex = state.staff.findIndex(s => s.id == state.currentUser.data.id);
    if (staffIndex !== -1) state.staff[staffIndex].availability = state.currentUser.data.availability;

    import('../main.js').then(main => main.save());
    closeAvailabilityModal();
    loadTimeSlots();
    showToast('Horarios aplicados', 'success');
}

// ============================================
// FUNCIONES DE LIMPIEZA
// ============================================

export function clearAllSlots() {
    if (confirm('¿Eliminar toda la disponibilidad?')) {
        state.currentUser.data.availability = {};
        const staffIndex = state.staff.findIndex(s => s.id == state.currentUser.data.id);
        if (staffIndex !== -1) state.staff[staffIndex].availability = {};
        import('../main.js').then(main => main.save());
        closeAvailabilityModal();
        showToast('Disponibilidad eliminada', 'success');
    }
}

// ============================================
// FUNCIONES DE CARGA DE HORARIOS (MEJORADAS)
// ============================================

export function loadTimeSlots() {
    const date = document.getElementById('availDate').value;
    if (!date || !state.currentUser?.data) return;

    const container = document.getElementById('timeSlotsContainer');
    const currentAvailability = state.currentUser.data.availability || {};
    const selectedSlots = currentAvailability[date] || [];
    const showOvercupo = document.getElementById('showOvercupo')?.checked || false;

    container.innerHTML = '';

    if (selectedSlots.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">No hay horarios disponibles para esta fecha</div>';
        return;
    }

    // Ordenar slots por hora
    selectedSlots.sort((a, b) => a.time.localeCompare(b.time));

    selectedSlots.forEach(slot => {
        if (!slot.isOvercupo || showOvercupo) {
            const isBooked = state.appointments.some(a => 
                a.psychId == state.currentUser.data.id && 
                a.date === date && 
                a.time === slot.time
            );

            const slotDiv = document.createElement('div');
            slotDiv.className = `time-slot ${slot.isOvercupo ? 'overcupo' : ''} ${isBooked ? 'booked' : ''}`;
            slotDiv.textContent = slot.time + (slot.isOvercupo ? ' (Sobrecupo)' : '');

            // Tooltip con información de la cita si está reservada
            if (isBooked) {
                const cita = state.appointments.find(a => 
                    a.psychId == state.currentUser.data.id && 
                    a.date === date && 
                    a.time === slot.time
                );
                if (cita) {
                    slotDiv.title = `Reservado por: ${cita.patient || 'Paciente'} - ${cita.paymentStatus === 'pagado' ? '✅ Pagado' : '⏳ Pendiente'}`;
                }
            }

            if (!isBooked) {
                slotDiv.onclick = () => toggleTimeSlot(slot.time, slot.isOvercupo);
            }

            container.appendChild(slotDiv);
        }
    });
}

function toggleTimeSlot(time, isOvercupo = false) {
    if (!state.currentUser?.data) return;

    const date = document.getElementById('availDate').value;
    if (!date) {
        showToast('Selecciona una fecha', 'warning');
        return;
    }

    if (!state.currentUser.data.availability) state.currentUser.data.availability = {};
    if (!state.currentUser.data.availability[date]) state.currentUser.data.availability[date] = [];

    const index = state.currentUser.data.availability[date].findIndex(s => s.time === time);
    if (index === -1) {
        state.currentUser.data.availability[date].push({ time, isOvercupo });
    } else {
        state.currentUser.data.availability[date].splice(index, 1);
    }

    const staffIndex = state.staff.findIndex(s => s.id == state.currentUser.data.id);
    if (staffIndex !== -1) state.staff[staffIndex].availability = state.currentUser.data.availability;

    loadTimeSlots();
}

// ============================================
// FUNCIONES DE SOBRECUPO
// ============================================

export function addOvercupo() {
    const date = document.getElementById('availDate').value;
    if (!date) {
        showToast('Selecciona una fecha', 'error');
        return;
    }

    const time = prompt('Ingresa horario para sobrecupo (HH:MM):');
    if (time && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
        toggleTimeSlot(time, true);
        showToast('Sobrecupo agregado', 'success');
    } else if (time) {
        showToast('Formato inválido (usa HH:MM)', 'error');
    }
}

// ============================================
// FUNCIÓN DE GUARDADO
// ============================================

export function saveAvailability() {
    import('../main.js').then(main => main.save());
    showToast('Disponibilidad guardada', 'success');
}

// ============================================
// NUEVAS FUNCIONES PARA ESTADÍSTICAS DE DISPONIBILIDAD
// ============================================

/**
 * Obtiene estadísticas de disponibilidad del profesional
 * @param {string} psychId - ID del profesional
 * @returns {Object} Estadísticas de disponibilidad
 */
export function getAvailabilityStats(psychId) {
    const psych = state.staff.find(s => s.id == psychId);
    if (!psych) return null;

    const availability = psych.availability || {};
    const fechas = Object.keys(availability).sort();
    
    let totalSlots = 0;
    let overcupos = 0;
    const slotsPorDia = {};

    fechas.forEach(fecha => {
        const slots = availability[fecha] || [];
        totalSlots += slots.length;
        overcupos += slots.filter(s => s.isOvercupo).length;
        slotsPorDia[fecha] = slots.length;
    });

    // Próximos 7 días
    const hoy = new Date();
    const proximos7Dias = [];
    for (let i = 0; i < 7; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() + i);
        const fechaStr = fecha.toISOString().split('T')[0];
        proximos7Dias.push({
            fecha: fechaStr,
            slots: availability[fechaStr]?.length || 0,
            dia: fecha.toLocaleDateString('es-CL', { weekday: 'long' })
        });
    }

    return {
        psicologo: psych.name,
        totalDiasConDisponibilidad: fechas.length,
        totalSlots,
        overcupos,
        promedioSlotsPorDia: fechas.length > 0 ? (totalSlots / fechas.length).toFixed(1) : 0,
        proximos7Dias,
        fechasDisponibles: fechas
    };
}

/**
 * Verifica disponibilidad para una fecha específica
 * @param {string} psychId - ID del profesional
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @returns {Array} Slots disponibles
 */
export function getAvailableSlotsForDate(psychId, date) {
    const psych = state.staff.find(s => s.id == psychId);
    if (!psych || !psych.availability || !psych.availability[date]) return [];

    const slots = psych.availability[date];
    const citasExistentes = state.appointments.filter(a => 
        a.psychId == psychId && a.date === date
    ).map(a => a.time);

    return slots.filter(slot => !citasExistentes.includes(slot.time));
}

/**
 * Obtiene el próximo horario disponible
 * @param {string} psychId - ID del profesional
 * @returns {Object|null} Próximo horario disponible
 */
export function getNextAvailableSlot(psychId) {
    const psych = state.staff.find(s => s.id == psychId);
    if (!psych || !psych.availability) return null;

    const hoy = new Date();
    const fechas = Object.keys(psych.availability)
        .filter(f => f >= hoy.toISOString().split('T')[0])
        .sort();

    for (const fecha of fechas) {
        const slotsDisponibles = getAvailableSlotsForDate(psychId, fecha);
        if (slotsDisponibles.length > 0) {
            return {
                date: fecha,
                slots: slotsDisponibles,
                firstSlot: slotsDisponibles[0].time
            };
        }
    }

    return null;
}

// ============================================
// EXPORTAR FUNCIONES AL OBJETO WINDOW
// ============================================
if (typeof window !== 'undefined') {
    window.getAvailabilityStats = getAvailabilityStats;
    window.getAvailableSlotsForDate = getAvailableSlotsForDate;
    window.getNextAvailableSlot = getNextAvailableSlot;
}

console.log('✅ disponibilidad.js cargado con estadísticas');