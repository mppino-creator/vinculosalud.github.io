// js/modules/box.js - Módulo de gestión de Box Compartido (versión con rango y calendario)
import { db } from '../config/firebase.js';
import { showToast } from './utils.js';
import * as state from './state.js';

// ============================================
// VARIABLES GLOBALES DEL MÓDULO
// ============================================
let mesActual = new Date().getMonth();
let añoActual = new Date().getFullYear();

// ============================================
// UTILIDADES
// ============================================
function formatTime(date) {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

// Generar slots para una fecha y rango horario (atención 60 min + holgura 10 min)
export function generateSlotsForDate(dateStr, startTime, endTime) {
    const slots = [];
    const start = new Date(`${dateStr}T${startTime}:00`);
    const end = new Date(`${dateStr}T${endTime}:00`);
    if (end <= start) return slots;
    const attention = 60;
    const gap = 10;
    const step = attention + gap;
    let current = new Date(start);
    while (current < end) {
        let slotEnd = new Date(current.getTime() + attention * 60000);
        if (slotEnd > end) break;
        slots.push({
            start: current.toISOString(),
            end: slotEnd.toISOString(),
            timeLabel: `${formatTime(current)} - ${formatTime(slotEnd)}`,
            status: 'available',
            professional: null
        });
        current = new Date(current.getTime() + step * 60000);
    }
    return slots;
}

// Guardar slots en Firebase
export async function saveBoxSlots(dateStr, slots) {
    await db.ref(`boxes/${dateStr}`).set(slots);
    showToast(`✅ Horarios del box guardados para ${dateStr}`, 'success');
}

// Cargar slots desde Firebase
export async function loadBoxSlots(dateStr) {
    const snapshot = await db.ref(`boxes/${dateStr}`).once('value');
    return snapshot.val() || [];
}

// ============================================
// RENDER ADMIN (con generación por rango)
// ============================================
export async function renderAdminBoxPanel() {
    const container = document.getElementById('tabBox');
    if (!container) return;

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    container.innerHTML = `
        <h3>📦 Gestión del Box Compartido</h3>
        <div class="admin-box-config">
            <div class="form-row" style="display:flex; gap:15px; flex-wrap:wrap; margin-bottom:20px;">
                <div class="field"><label>📅 Fecha inicio</label><input type="date" id="rangeStartDate" value="${today.toISOString().slice(0,10)}"></div>
                <div class="field"><label>📅 Fecha fin</label><input type="date" id="rangeEndDate" value="${nextWeek.toISOString().slice(0,10)}"></div>
                <div class="field"><label>⏰ Hora inicio</label><input type="time" id="startTime" value="08:00"></div>
                <div class="field"><label>⏰ Hora fin</label><input type="time" id="endTime" value="22:00"></div>
            </div>
            <div style="margin-bottom:20px;">
                <label>Días de la semana</label>
                <div class="weekday-selector" id="weekdaySelector">
                    <div class="weekday selected" data-day="1">Lun</div>
                    <div class="weekday selected" data-day="2">Mar</div>
                    <div class="weekday selected" data-day="3">Mié</div>
                    <div class="weekday selected" data-day="4">Jue</div>
                    <div class="weekday selected" data-day="5">Vie</div>
                    <div class="weekday" data-day="6">Sáb</div>
                    <div class="weekday" data-day="0">Dom</div>
                </div>
            </div>
            <button id="generateRangeBtn" class="btn-staff" style="background:var(--verde-exito);">✨ Generar slots para todo el rango</button>
            <hr style="margin: 25px 0;">
            <h4>🗓️ Slots del día (selecciona una fecha)</h4>
            <div class="form-row" style="display:flex; gap:15px; align-items:flex-end;">
                <div class="field"><label>Fecha</label><input type="date" id="adminBoxDate" value="${today.toISOString().slice(0,10)}"></div>
                <button id="refreshAdminSlotsBtn" class="btn-staff">Cargar</button>
            </div>
            <div id="adminBoxSlotsContainer" class="slots-grid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px;"></div>
        </div>
    `;

    // Inicializar selectores de días
    const weekdays = document.querySelectorAll('#weekdaySelector .weekday');
    let selectedDays = ['1','2','3','4','5']; // Lunes a Viernes por defecto
    weekdays.forEach(day => {
        day.classList.toggle('selected', selectedDays.includes(day.getAttribute('data-day')));
        day.addEventListener('click', () => {
            const dayVal = day.getAttribute('data-day');
            if (selectedDays.includes(dayVal)) {
                selectedDays = selectedDays.filter(d => d !== dayVal);
                day.classList.remove('selected');
            } else {
                selectedDays.push(dayVal);
                day.classList.add('selected');
            }
        });
    });

    const rangeStart = document.getElementById('rangeStartDate');
    const rangeEnd = document.getElementById('rangeEndDate');
    const startTime = document.getElementById('startTime');
    const endTime = document.getElementById('endTime');
    const generateRangeBtn = document.getElementById('generateRangeBtn');
    const adminDate = document.getElementById('adminBoxDate');
    const refreshBtn = document.getElementById('refreshAdminSlotsBtn');
    const slotsContainer = document.getElementById('adminBoxSlotsContainer');

    // Función para refrescar slots del día seleccionado
    async function refreshAdminSlots() {
        const date = adminDate.value;
        const slots = await loadBoxSlots(date);
        if (!slots.length) {
            slotsContainer.innerHTML = '<div class="info-message">No hay slots generados para esta fecha. Usa "Generar slots para todo el rango".</div>';
            return;
        }
        slotsContainer.innerHTML = '';
        slots.forEach((slot, idx) => {
            const card = document.createElement('div');
            card.className = 'slot-card';
            card.innerHTML = `
                <div class="slot-time">${slot.timeLabel}</div>
                <div class="slot-status ${slot.status}">${slot.status === 'available' ? 'Disponible' : 'Reservado'}</div>
                ${slot.professional ? `<div class="slot-professional">👤 ${escapeHtml(slot.professional)}</div>` : ''}
                <div style="display:flex; gap:6px; margin-top:8px;">
                    ${slot.status === 'booked' ? `<button class="small-btn cancel-admin" data-index="${idx}">🗑️ Cancelar reserva</button>` : ''}
                    <button class="small-btn reserve-admin" data-index="${idx}">📝 Reservar (admin)</button>
                </div>
                ${slot.status === 'available' ? `<input type="text" id="adminBoxName_${idx}" class="reserve-input" placeholder="Nombre del profesional" maxlength="50">` : ''}
            `;
            slotsContainer.appendChild(card);
        });

        // Eventos de admin
        document.querySelectorAll('#adminBoxSlotsContainer .cancel-admin').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idx = parseInt(btn.getAttribute('data-index'));
                if (slots[idx]?.status === 'booked') {
                    slots[idx].status = 'available';
                    slots[idx].professional = null;
                    await saveBoxSlots(date, slots);
                    refreshAdminSlots();
                    const proDate = document.getElementById('proBoxDate')?.value;
                    if (proDate === date) renderProfessionalBoxPanel();
                }
            });
        });
        document.querySelectorAll('#adminBoxSlotsContainer .reserve-admin').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idx = parseInt(btn.getAttribute('data-index'));
                if (slots[idx]?.status === 'booked') {
                    showToast('Este slot ya está reservado. Cancele primero.', 'error');
                    return;
                }
                const nameInput = document.getElementById(`adminBoxName_${idx}`);
                const profName = nameInput?.value.trim();
                if (!profName) {
                    showToast('Ingresa el nombre del profesional.', 'error');
                    return;
                }
                slots[idx].status = 'booked';
                slots[idx].professional = profName;
                await saveBoxSlots(date, slots);
                refreshAdminSlots();
                const proDate = document.getElementById('proBoxDate')?.value;
                if (proDate === date) renderProfessionalBoxPanel();
            });
        });
    }

    // Generar para rango de fechas
    generateRangeBtn.addEventListener('click', async () => {
        const start = rangeStart.value;
        const end = rangeEnd.value;
        const startH = startTime.value;
        const endH = endTime.value;
        if (!start || !end || !startH || !endH) {
            showToast('Completa todas las fechas y horarios', 'error');
            return;
        }
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (startDate > endDate) {
            showToast('La fecha inicio debe ser anterior a la fecha fin', 'error');
            return;
        }
        let generated = 0;
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().slice(0,10);
            const dayOfWeek = d.getDay().toString();
            if (selectedDays.includes(dayOfWeek)) {
                const newSlots = generateSlotsForDate(dateStr, startH, endH);
                if (newSlots.length) {
                    await saveBoxSlots(dateStr, newSlots);
                    generated += newSlots.length;
                }
            }
        }
        showToast(`✅ Generados ${generated} turnos en el rango de fechas`, 'success');
        refreshAdminSlots();
        // Refrescar también vista profesional si está en misma fecha
        const proDate = document.getElementById('proBoxDate')?.value;
        if (proDate && proDate >= start && proDate <= end) renderProfessionalBoxPanel();
    });

    adminDate.addEventListener('change', refreshAdminSlots);
    refreshBtn.addEventListener('click', refreshAdminSlots);
    refreshAdminSlots();
}

// ============================================
// PANEL PROFESIONAL (con calendario mensual)
// ============================================
export async function renderProfessionalBoxPanel() {
    const container = document.getElementById('tabBoxProfesional');
    if (!container) return;

    container.innerHTML = `
        <h3>📦 Reservar Box Compartido</h3>
        <div style="margin-bottom:20px;">
            <div style="display:flex; gap:15px; align-items:flex-end; flex-wrap:wrap;">
                <div class="field"><label>📅 Ver mes</label>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <button id="prevMonthBtn" class="btn-staff" style="padding:6px 12px;">◀</button>
                        <span id="currentMonthYear" style="font-weight:bold; min-width:150px; text-align:center;"></span>
                        <button id="nextMonthBtn" class="btn-staff" style="padding:6px 12px;">▶</button>
                    </div>
                </div>
                <div class="field"><label>Ir a fecha específica</label><input type="date" id="proBoxDate" class="filter-input"></div>
                <button id="refreshProBoxBtn" class="btn-staff">Ir</button>
            </div>
        </div>
        <div id="calendarioBoxContainer" style="background:white; border-radius:16px; padding:20px; margin-bottom:20px;"></div>
        <div id="proBoxSlotsContainer" class="slots-grid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px;"></div>
    `;

    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');
    const monthYearSpan = document.getElementById('currentMonthYear');
    const proDateInput = document.getElementById('proBoxDate');
    const refreshBtn = document.getElementById('refreshProBoxBtn');
    const calendarioDiv = document.getElementById('calendarioBoxContainer');
    const slotsContainer = document.getElementById('proBoxSlotsContainer');

    async function renderCalendario() {
        const primerDia = new Date(añoActual, mesActual, 1);
        const ultimoDia = new Date(añoActual, mesActual + 1, 0);
        const diasEnMes = ultimoDia.getDate();
        const diaInicioSemana = primerDia.getDay();

        monthYearSpan.innerText = primerDia.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

        let html = `
            <table class="calendar-table" style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr><th>Dom</th><th>Lun</th><th>Mar</th><th>Mié</th><th>Jue</th><th>Vie</th><th>Sáb</th></tr>
                </thead>
                <tbody>
        `;
        let dia = 1;
        for (let i = 0; i < 6; i++) {
            if (dia > diasEnMes) break;
            html += '<tr>';
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < diaInicioSemana) {
                    html += '<td class="calendar-cell empty"></td>';
                } else if (dia <= diasEnMes) {
                    const fechaStr = `${añoActual}-${String(mesActual+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
                    const slots = await loadBoxSlots(fechaStr);
                    const disponibles = slots.filter(s => s.status === 'available').length;
                    const reservados = slots.filter(s => s.status === 'booked').length;
                    html += `<td class="calendar-cell" style="border:1px solid #ddd; padding:8px; vertical-align:top; cursor:pointer;" onclick="document.getElementById('proBoxDate').value='${fechaStr}'; window.cargarSlotsProfesionalFecha('${fechaStr}');">
                        <div style="font-weight:bold;">${dia}</div>
                        <div style="font-size:0.7rem; margin-top:4px;">
                            ${disponibles > 0 ? `<span style="color:#28a745;">✅ ${disponibles} disp.</span>` : ''}
                            ${reservados > 0 ? `<span style="color:#dc3545;">📌 ${reservados} res.</span>` : ''}
                            ${disponibles === 0 && reservados === 0 ? '<span style="color:#999;">—</span>' : ''}
                        </div>
                    </td>`;
                    dia++;
                } else {
                    html += '<td class="calendar-cell empty"></td>';
                }
            }
            html += '</tr>';
        }
        html += '</tbody></table>';
        calendarioDiv.innerHTML = html;
    }

    async function refreshProSlots() {
        const date = proDateInput.value;
        if (!date) return;
        const slots = await loadBoxSlots(date);
        if (!slots.length) {
            slotsContainer.innerHTML = '<div class="info-message">No hay horarios configurados para esta fecha. Contacta al administrador.</div>';
            return;
        }
        slotsContainer.innerHTML = '';
        slots.forEach((slot, idx) => {
            const card = document.createElement('div');
            card.className = 'slot-card';
            if (slot.status === 'available') {
                card.innerHTML = `
                    <div class="slot-time">${slot.timeLabel}</div>
                    <div class="slot-status available">Disponible</div>
                    <input type="text" id="proBoxName_${idx}" class="reserve-input" placeholder="Tu nombre completo" maxlength="50">
                    <button class="small-btn reserve-pro" data-index="${idx}">📌 Reservar este horario</button>
                `;
            } else {
                card.innerHTML = `
                    <div class="slot-time">${slot.timeLabel}</div>
                    <div class="slot-status booked">Reservado por</div>
                    <div class="slot-professional">👤 ${escapeHtml(slot.professional)}</div>
                    <button class="small-btn cancel-pro" data-index="${idx}">❌ Cancelar mi reserva</button>
                `;
            }
            slotsContainer.appendChild(card);
        });

        // Eventos reserva
        document.querySelectorAll('#proBoxSlotsContainer .reserve-pro').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idx = parseInt(btn.getAttribute('data-index'));
                const nameInput = document.getElementById(`proBoxName_${idx}`);
                const profName = nameInput?.value.trim();
                if (!profName) { showToast('Ingresa tu nombre para reservar.', 'error'); return; }
                if (slots[idx]?.status === 'available') {
                    slots[idx].status = 'booked';
                    slots[idx].professional = profName;
                    await saveBoxSlots(date, slots);
                    refreshProSlots();
                    const adminDate = document.getElementById('adminBoxDate')?.value;
                    if (adminDate === date && typeof renderAdminBoxPanel === 'function') renderAdminBoxPanel();
                    renderCalendario(); // actualizar calendario
                } else showToast('Este horario ya no está disponible.', 'error');
            });
        });
        // Cancelar propia
        document.querySelectorAll('#proBoxSlotsContainer .cancel-pro').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idx = parseInt(btn.getAttribute('data-index'));
                const slot = slots[idx];
                if (slot.status !== 'booked') return;
                const currentProfessional = slot.professional;
                const nombreConfirm = prompt(`Esta hora está reservada por "${currentProfessional}". Ingresa tu nombre para confirmar la cancelación:`);
                if (nombreConfirm?.trim() === currentProfessional) {
                    slot.status = 'available';
                    slot.professional = null;
                    await saveBoxSlots(date, slots);
                    refreshProSlots();
                    const adminDate = document.getElementById('adminBoxDate')?.value;
                    if (adminDate === date && typeof renderAdminBoxPanel === 'function') renderAdminBoxPanel();
                    renderCalendario();
                } else showToast('El nombre no coincide con el profesional que reservó.', 'error');
            });
        });
    }

    // Función global para cargar slots desde el calendario
    window.cargarSlotsProfesionalFecha = async (fecha) => {
        if (proDateInput) proDateInput.value = fecha;
        await refreshProSlots();
    };

    async function cambiarMes(delta) {
        const nuevaFecha = new Date(añoActual, mesActual + delta);
        mesActual = nuevaFecha.getMonth();
        añoActual = nuevaFecha.getFullYear();
        await renderCalendario();
    }

    prevBtn.addEventListener('click', () => cambiarMes(-1));
    nextBtn.addEventListener('click', () => cambiarMes(1));
    refreshBtn.addEventListener('click', refreshProSlots);
    proDateInput.addEventListener('change', refreshProSlots);

    await renderCalendario();
    // Si hay fecha seleccionada, cargar; si no, hoy
    if (!proDateInput.value) {
        proDateInput.value = new Date().toISOString().slice(0,10);
    }
    await refreshProSlots();
}

// ============================================
// ESTADÍSTICAS DEL BOX
// ============================================
export async function renderBoxEstadisticas(month) {
    if (!month) month = new Date().toISOString().slice(0,7);
    const [year, monthNum] = month.split('-');
    const startDate = new Date(parseInt(year), parseInt(monthNum)-1, 1);
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0);
    const stats = new Map();
    const snapshot = await db.ref('boxes').once('value');
    const boxes = snapshot.val() || {};
    for (const [dateStr, slots] of Object.entries(boxes)) {
        const slotDate = new Date(dateStr);
        if (slotDate >= startDate && slotDate <= endDate && Array.isArray(slots)) {
            slots.forEach(slot => {
                if (slot.status === 'booked' && slot.professional) {
                    const prof = slot.professional.trim();
                    stats.set(prof, (stats.get(prof) || 0) + 1);
                }
            });
        }
    }
    const container = document.getElementById('boxStatsContainer');
    if (!container) return;
    if (stats.size === 0) {
        container.innerHTML = '<p>No hay atenciones registradas en este mes.</p>';
        return;
    }
    const sorted = Array.from(stats.entries()).sort((a,b) => b[1] - a[1]);
    let html = '<table class="admin-table"><thead><tr><th>Profesional</th><th>Cantidad de atenciones</th></tr></thead><tbody>';
    sorted.forEach(([prof, count]) => html += `<tr><td>${escapeHtml(prof)}</td><td>${count}</td></tr>`);
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ============================================
// EXPOSICIÓN GLOBAL PARA EL SWITCH DE PESTAÑAS
// ============================================
if (typeof window !== 'undefined') {
    window.renderAdminBoxPanel = renderAdminBoxPanel;
    window.renderProfessionalBoxPanel = renderProfessionalBoxPanel;
    window.renderBoxEstadisticas = renderBoxEstadisticas;
    window.cargarEstadisticasBox = () => {
        const month = document.getElementById('boxStatsMonth')?.value;
        if (month) renderBoxEstadisticas(month);
    };
}

console.log('✅ box.js actualizado con generación por rango y calendario mensual');