// js/modules/disponibilidad.js - VERSIÓN BOX (horarios compartidos)
import * as state from './state.js';
import { showToast } from './utils.js';
import { db } from '../config/firebase.js';
import { loadBoxSlots, saveBoxSlots } from './box.js';

// ============================================
// NUEVA CARGA DE HORARIOS DESDE BOX
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

    const professionalName = state.currentUser.data.name;
    const profStart = state.currentUser.data.startTime || '00:00';
    const profEnd = state.currentUser.data.endTime || '23:59';

    // Cargar slots del Box
    let boxSlots = [];
    try {
        boxSlots = await loadBoxSlots(date);
    } catch (err) {
        console.error('Error cargando slots del box:', err);
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">Error al cargar horarios del box</div>';
        return;
    }
    
    // Filtrar slots disponibles o reservados por este profesional, y que estén dentro del rango horario
    let relevantSlots = boxSlots.filter(slot => {
        const slotStart = slot.timeLabel.split(' - ')[0];
        const inRange = slotStart >= profStart && slotStart < profEnd;
        const isMine = (slot.status === 'booked' && slot.professional === professionalName);
        return (slot.status === 'available' || isMine) && inRange;
    });

    relevantSlots.sort((a,b) => a.timeLabel.localeCompare(b.timeLabel));

    container.innerHTML = '';
    if (relevantSlots.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">No hay horarios disponibles para esta fecha en tu rango horario</div>';
        return;
    }

    for (const slot of relevantSlots) {
        const isMine = (slot.status === 'booked' && slot.professional === professionalName);
        const slotDiv = document.createElement('div');
        slotDiv.className = `time-slot ${slot.status === 'booked' ? 'booked' : ''}`;
        slotDiv.textContent = slot.timeLabel;

        if (isMine) {
            slotDiv.title = 'Reservado por ti. Haz clic para cancelar.';
            slotDiv.onclick = async () => {
                if (confirm(`¿Cancelar tu reserva de ${slot.timeLabel}?`)) {
                    const currentSlots = await loadBoxSlots(date);
                    const idxSlot = currentSlots.findIndex(s => s.timeLabel === slot.timeLabel);
                    if (idxSlot !== -1 && currentSlots[idxSlot].professional === professionalName) {
                        currentSlots[idxSlot].status = 'available';
                        currentSlots[idxSlot].professional = null;
                        await saveBoxSlots(date, currentSlots);
                        await loadTimeSlots();  // refrescar
                        showToast('Reserva cancelada', 'success');
                    }
                }
            };
        } else if (slot.status === 'available') {
            slotDiv.title = 'Disponible. Haz clic para reservar.';
            slotDiv.onclick = async () => {
                if (confirm(`¿Reservar ${slot.timeLabel} para ti?`)) {
                    const currentSlots = await loadBoxSlots(date);
                    const idxSlot = currentSlots.findIndex(s => s.timeLabel === slot.timeLabel);
                    if (idxSlot !== -1 && currentSlots[idxSlot].status === 'available') {
                        currentSlots[idxSlot].status = 'booked';
                        currentSlots[idxSlot].professional = professionalName;
                        await saveBoxSlots(date, currentSlots);
                        await loadTimeSlots();
                        showToast('Reserva realizada', 'success');
                    } else {
                        showToast('El horario ya no está disponible', 'error');
                    }
                }
            };
        } else {
            slotDiv.title = `Reservado por ${slot.professional}`;
            slotDiv.onclick = null;
        }

        container.appendChild(slotDiv);
    }
}

// ============================================
// FUNCIONES OBSOLETAS (ahora se gestiona con Box)
// ============================================

export function showAvailabilityModal() {
    showToast('⚠️ La gestión de disponibilidad ahora se realiza en la pestaña "Box Compartido" (Admin) o "Mi Box" (Profesional).', 'info');
}

export function closeAvailabilityModal() {
    // No hay modal que cerrar
}

export function generateTimeSlots() {
    showToast('La generación de horarios ahora se hace en el panel del Box (Admin).', 'info');
}

export function toggleWeekday() {
    showToast('La selección de días ya no se usa. Use el panel del Box.', 'info');
}

export function blockTimeRange() {
    showToast('Esta función ha sido reemplazada por el sistema de Box.', 'info');
}

export async function applyGeneratedSlots() {
    showToast('Para generar horarios, use el panel Admin → Box → "Generar horarios por rango".', 'info');
}

export async function excludeSpecificDates() {
    showToast('Para excluir fechas, elimine manualmente los slots desde el calendario del Box.', 'info');
}

export async function clearAllSlots() {
    showToast('Para limpiar horarios, use el panel Admin → Box → "Eliminar rango de fechas".', 'info');
}

export function addOvercupo() {
    showToast('El sobrecupo ya no está disponible con el nuevo sistema de Box.', 'info');
}

export async function saveAvailability() {
    showToast('La disponibilidad ahora se guarda automáticamente al reservar/cancelar en el Box.', 'info');
}

// ============================================
// FUNCIONES AUXILIARES (adaptadas al Box)
// ============================================

export async function getAvailableSlotsForDate(psychId, date) {
    const psych = state.staff.find(s => s.id == psychId);
    if (!psych) return [];

    const profStart = psych.startTime || '00:00';
    const profEnd = psych.endTime || '23:59';
    let boxSlots = [];
    try {
        boxSlots = await loadBoxSlots(date);
    } catch (err) {
        console.error('Error cargando slots del box:', err);
        return [];
    }
    
    return boxSlots.filter(slot => 
        slot.status === 'available' &&
        slot.timeLabel.split(' - ')[0] >= profStart &&
        slot.timeLabel.split(' - ')[0] < profEnd
    ).map(slot => ({ time: slot.timeLabel }));
}

export async function getNextAvailableSlot(psychId) {
    const psych = state.staff.find(s => s.id == psychId);
    if (!psych) return null;

    const profStart = psych.startTime || '00:00';
    const profEnd = psych.endTime || '23:59';
    const hoy = new Date();
    let fechaActual = new Date(hoy);
    
    for (let i = 0; i < 60; i++) { // buscar en los próximos 60 días
        const dateStr = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth()+1).padStart(2,'0')}-${String(fechaActual.getDate()).padStart(2,'0')}`;
        let boxSlots = [];
        try {
            boxSlots = await loadBoxSlots(dateStr);
        } catch (err) {
            console.error('Error cargando slots del box:', err);
        }
        const disponibles = boxSlots.filter(slot => 
            slot.status === 'available' &&
            slot.timeLabel.split(' - ')[0] >= profStart &&
            slot.timeLabel.split(' - ')[0] < profEnd
        );
        if (disponibles.length > 0) {
            return {
                date: dateStr,
                slots: disponibles.map(slot => ({ time: slot.timeLabel })),
                firstSlot: disponibles[0].timeLabel
            };
        }
        fechaActual.setDate(fechaActual.getDate() + 1);
    }
    return null;
}

// La función getAvailabilityStats ya no se utiliza (estadísticas ahora desde box.js)
export function getAvailabilityStats(psychId) {
    console.warn('getAvailabilityStats está obsoleto. Use las estadísticas del Box.');
    return null;
}

// ============================================
// EXPORTAR FUNCIONES AL OBJETO WINDOW (para compatibilidad)
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
    window.excludeSpecificDates = excludeSpecificDates;
}

console.log('✅ disponibilidad.js actualizado: ahora usa slots compartidos del Box');