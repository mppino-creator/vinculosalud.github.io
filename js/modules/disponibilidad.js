// js/modules/disponibilidad.js
import * as state from './state.js';
import { showToast } from './utils.js';

// ============================================
// FUNCIONES DE MODAL
// ============================================

export function showAvailabilityModal() {
    const modal = document.getElementById('availabilityModal');
    if (!modal) return;
    
    modal.style.display = 'flex';

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const rangeStartDate = document.getElementById('rangeStartDate');
    const rangeEndDate = document.getElementById('rangeEndDate');
    
    if (rangeStartDate) rangeStartDate.value = today.toISOString().split('T')[0];
    if (rangeEndDate) rangeEndDate.value = nextWeek.toISOString().split('T')[0];

    if (state.currentUser?.data) {
        const sessionDuration = document.getElementById('sessionDuration');
        const breakBetween = document.getElementById('breakBetween');
        
        if (sessionDuration) sessionDuration.value = state.currentUser.data.sessionDuration || 45;
        if (breakBetween) breakBetween.value = state.currentUser.data.breakBetween || 10;
    }

    // Inicializar selección de días de la semana (todos seleccionados por defecto)
    const weekdays = document.querySelectorAll('#weekdaySelector .weekday');
    if (state.selectedWeekdays.length === 0) {
        const allDays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
        state.setSelectedWeekdays(allDays);
    }
    // Sincronizar clases con state
    weekdays.forEach(day => {
        const dayName = day.innerText.trim();
        if (state.selectedWeekdays.includes(dayName)) {
            day.classList.add('selected');
        } else {
            day.classList.remove('selected');
        }
    });

    generateTimeSlots();
}

export function closeAvailabilityModal() {
    const modal = document.getElementById('availabilityModal');
    if (modal) modal.style.display = 'none';
}

// ============================================
// FUNCIONES DE DÍAS DE SEMANA (CORREGIDAS)
// ============================================

export function toggleWeekday(dayName) {
    // Buscar el elemento por su texto (sin usar :contains)
    let element = null;
    const allDays = document.querySelectorAll('#weekdaySelector .weekday');
    for (let d of allDays) {
        if (d.innerText.trim() === dayName) {
            element = d;
            break;
        }
    }
    
    if (state.selectedWeekdays.includes(dayName)) {
        state.setSelectedWeekdays(state.selectedWeekdays.filter(d => d !== dayName));
        if (element) element.classList.remove('selected');
    } else {
        state.setSelectedWeekdays([...state.selectedWeekdays, dayName]);
        if (element) element.classList.add('selected');
    }
}

// ============================================
// FUNCIONES DE GENERACIÓN DE HORARIOS (MEJORADA)
// ============================================

export function generateTimeSlots() {
    const start = document.getElementById('startTime')?.value;
    const end = document.getElementById('endTime')?.value;
    const duration = parseInt(document.getElementById('sessionDuration')?.value || '45');
    const breakTime = parseInt(document.getElementById('breakBetween')?.value || '10');

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
    
    // Generar horarios redondeados a horas y medias horas
    while (currentMinutes + duration <= endMinutes) {
        const hour = Math.floor(currentMinutes / 60);
        const minute = currentMinutes % 60;
        
        // Generar solo horas en punto y medias horas
        if (minute === 0 || minute === 30) {
            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            slots.push({ time: timeStr, isOvercupo: false });
        }
        
        currentMinutes += slotDuration;
    }
    
    state.setGeneratedSlots(slots);
    renderGeneratedSlots();
}

function renderGeneratedSlots() {
    const container = document.getElementById('generatedTimeSlots');
    if (!container) return;
    
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
// BLOQUEAR RANGO DE HORAS (EJ. ALMUERZO)
// ============================================

export function blockTimeRange() {
    const startTime = document.getElementById('blockStartTime')?.value;
    const endTime = document.getElementById('blockEndTime')?.value;

    if (!startTime || !endTime) {
        showToast('Selecciona hora de inicio y fin', 'error');
        return;
    }

    const slots = state.generatedSlots.filter(slot => slot.time < startTime || slot.time >= endTime);
    state.setGeneratedSlots(slots);
    renderGeneratedSlots();
    showToast('Rango de horas eliminado de los horarios generados', 'success');
}

// ============================================
// APLICAR HORARIOS GENERADOS A UN RANGO DE FECHAS
// ============================================

export function applyGeneratedSlots() {
    const startDateInput = document.getElementById('rangeStartDate');
    const endDateInput = document.getElementById('rangeEndDate');
    
    if (!startDateInput || !endDateInput) {
        showToast('Error con los campos de fecha', 'error');
        return;
    }
    
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);

    if (!startDateInput.value || !endDateInput.value) {
        showToast('Selecciona rango de fechas', 'error');
        return;
    }

    // Mapeo de nombres de días a números (0 = domingo)
    const weekdayMap = { 'Lun': 1, 'Mar': 2, 'Mie': 3, 'Jue': 4, 'Vie': 5, 'Sab': 6, 'Dom': 0 };
    const selectedDayNumbers = state.selectedWeekdays.map(d => weekdayMap[d]);

    console.log('Días seleccionados:', state.selectedWeekdays, '→ números:', selectedDayNumbers);

    if (!state.currentUser.data.availability) state.currentUser.data.availability = {};

    // Crear nueva disponibilidad fusionando con la existente
    const newAvailability = { ...state.currentUser.data.availability };

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay();

        if (selectedDayNumbers.includes(dayOfWeek)) {
            if (!newAvailability[dateStr]) newAvailability[dateStr] = [];

            // Agregar los slots generados que no existan ya
            state.generatedSlots.forEach(slot => {
                if (!newAvailability[dateStr].some(s => s.time === slot.time)) {
                    newAvailability[dateStr].push(slot);
                }
            });
        } else {
            console.log(`Fecha ${dateStr} (día ${dayOfWeek}) no seleccionada, omitida`);
        }
    }

    state.currentUser.data.availability = newAvailability;

    // Actualizar el staff
    const staffIndex = state.staff.findIndex(s => s.id == state.currentUser.data.id);
    if (staffIndex !== -1) state.staff[staffIndex].availability = newAvailability;

    import('../main.js').then(main => main.save());
    closeAvailabilityModal();
    // Refrescar la vista de disponibilidad si la fecha actual está en el rango
    const currentDateInput = document.getElementById('availDate');
    if (currentDateInput && currentDateInput.value) {
        loadTimeSlots();
    }
    showToast('Horarios aplicados', 'success');
}

// ============================================
// EXCLUIR FECHAS ESPECÍFICAS (DÍAS INHÁBILES)
// ============================================

export function excludeSpecificDates() {
    const datesInput = prompt('Ingresa las fechas a excluir (formato YYYY-MM-DD), separadas por comas:\nEjemplo: 2026-03-30, 2026-04-01');
    if (!datesInput) return;

    const dates = datesInput.split(',').map(d => d.trim());
    const validDates = dates.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));

    if (validDates.length === 0) {
        showToast('No se ingresaron fechas válidas', 'error');
        return;
    }

    if (!state.currentUser.data.availability) return;

    let modified = false;
    validDates.forEach(date => {
        if (state.currentUser.data.availability[date]) {
            delete state.currentUser.data.availability[date];
            modified = true;
        }
    });

    if (modified) {
        const staffIndex = state.staff.findIndex(s => s.id == state.currentUser.data.id);
        if (staffIndex !== -1) state.staff[staffIndex].availability = state.currentUser.data.availability;
        import('../main.js').then(main => main.save());
        showToast(`Se eliminó la disponibilidad en ${validDates.length} fecha(s)`, 'success');
        // Refrescar vista actual si está visible
        const currentDateInput = document.getElementById('availDate');
        if (currentDateInput && currentDateInput.value && loadTimeSlots) loadTimeSlots();
    } else {
        showToast('Ninguna de las fechas tenía disponibilidad', 'info');
    }
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
        loadTimeSlots();
        showToast('Disponibilidad eliminada', 'success');
    }
}

// ============================================
// FUNCIONES DE CARGA DE HORARIOS (PESTAÑA DISPONIBILIDAD)
// ============================================

export function loadTimeSlots() {
    const dateInput = document.getElementById('availDate');
    if (!dateInput) return;
    
    const date = dateInput.value;
    if (!date || !state.currentUser?.data) return;

    const container = document.getElementById('timeSlotsContainer');
    if (!container) return;
    
    const currentAvailability = state.currentUser.data.availability || {};
    const selectedSlots = currentAvailability[date] || [];
    const showOvercupo = document.getElementById('showOvercupo')?.checked || false;

    container.innerHTML = '';

    if (selectedSlots.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">No hay horarios disponibles para esta fecha</div>';
        return;
    }

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

    const dateInput = document.getElementById('availDate');
    if (!dateInput) return;
    
    const date = dateInput.value;
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
    const dateInput = document.getElementById('availDate');
    if (!dateInput) return;
    
    const date = dateInput.value;
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
// ESTADÍSTICAS DE DISPONIBILIDAD (AUXILIARES)
// ============================================

export function getAvailabilityStats(psychId) {
    const psych = state.staff.find(s => s.id == psychId);
    if (!psych) return null;

    const availability = psych.availability || {};
    const fechas = Object.keys(availability).sort();
    
    let totalSlots = 0;
    let overcupos = 0;

    fechas.forEach(fecha => {
        const slots = availability[fecha] || [];
        totalSlots += slots.length;
        overcupos += slots.filter(s => s.isOvercupo).length;
    });

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

export function getAvailableSlotsForDate(psychId, date) {
    const psych = state.staff.find(s => s.id == psychId);
    if (!psych || !psych.availability || !psych.availability[date]) return [];

    const slots = psych.availability[date];
    const citasExistentes = state.appointments.filter(a => 
        a.psychId == psychId && a.date === date
    ).map(a => a.time);

    return slots.filter(slot => !citasExistentes.includes(slot.time));
}

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
    window.showAvailabilityModal = showAvailabilityModal;
    window.closeAvailabilityModal = closeAvailabilityModal;
    window.generateTimeSlots = generateTimeSlots;
    window.toggleWeekday = toggleWeekday;
    window.blockTimeRange = blockTimeRange;
    window.applyGeneratedSlots = applyGeneratedSlots;
    window.clearAllSlots = clearAllSlots;
    window.saveAvailability = saveAvailability;
    window.loadTimeSlots = loadTimeSlots;
    window.addOvercupo = addOvercupo;
    window.excludeSpecificDates = excludeSpecificDates;  // <-- NUEVA FUNCIÓN
}

console.log('✅ disponibilidad.js cargado con agenda AM/PM mejorada + excluir fechas');