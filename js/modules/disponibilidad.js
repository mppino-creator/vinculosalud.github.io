// js/modules/disponibilidad.js
import * as state from './state.js';
import { showToast } from './utils.js';

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

    import('./main.js').then(main => main.save());
    closeAvailabilityModal();
    loadTimeSlots();
    showToast('Horarios aplicados', 'success');
}

export function clearAllSlots() {
    if (confirm('¿Eliminar toda la disponibilidad?')) {
        state.currentUser.data.availability = {};
        const staffIndex = state.staff.findIndex(s => s.id == state.currentUser.data.id);
        if (staffIndex !== -1) state.staff[staffIndex].availability = {};
        import('./main.js').then(main => main.save());
        closeAvailabilityModal();
        showToast('Disponibilidad eliminada', 'success');
    }
}

export function loadTimeSlots() {
    const date = document.getElementById('availDate').value;
    if (!date || !state.currentUser?.data) return;

    const container = document.getElementById('timeSlotsContainer');
    const currentAvailability = state.currentUser.data.availability || {};
    const selectedSlots = currentAvailability[date] || [];
    const showOvercupo = document.getElementById('showOvercupo')?.checked || false;

    container.innerHTML = '';

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
        showToast('Formato inválido', 'error');
    }
}

export function saveAvailability() {
    import('./main.js').then(main => main.save());
    showToast('Disponibilidad guardada', 'success');
}