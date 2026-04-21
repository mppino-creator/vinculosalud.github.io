// js/modules/box.js - Módulo de gestión de Box Compartido (con previsualización y validación mejorada)
import { db } from '../config/firebase.js';
import { showToast } from './utils.js';

// ============================================
// VARIABLES GLOBALES
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

// Generar slots para UNA fecha (solo cálculo, no guarda)
function calcularSlotsParaFecha(dateStr, startTime, endTime, duracionMin, holguraMin) {
    const slots = [];
    const start = new Date(`${dateStr}T${startTime}:00`);
    const end = new Date(`${dateStr}T${endTime}:00`);
    if (end <= start) return slots;
    const step = duracionMin + holguraMin;
    let current = new Date(start);
    while (current < end) {
        let slotEnd = new Date(current.getTime() + duracionMin * 60000);
        if (slotEnd > end) break;
        slots.push({
            start: current.toISOString(),
            end: slotEnd.toISOString(),
            timeLabel: `${formatTime(current)} - ${formatTime(slotEnd)}`
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
// PANEL ADMIN (con previsualización)
// ============================================
export async function renderAdminBoxPanel() {
    const container = document.getElementById('tabBox');
    if (!container) {
        console.error('❌ Contenedor tabBox no encontrado');
        return;
    }

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    container.innerHTML = `
        <h3>📦 Gestión del Box Compartido</h3>
        <div class="admin-box-config" style="background: #f9f9fc; padding: 20px; border-radius: 16px; margin-bottom: 25px;">
            <h4 style="margin-top:0;">⚙️ Generar horarios por rango de fechas</h4>
            <div class="form-row" style="display:flex; gap:15px; flex-wrap:wrap; margin-bottom:20px;">
                <div class="field" style="flex:1; min-width:150px;">
                    <label>📅 Fecha inicio</label>
                    <input type="date" id="rangeStartDate" value="${today.toISOString().slice(0,10)}" class="filter-input">
                </div>
                <div class="field" style="flex:1; min-width:150px;">
                    <label>📅 Fecha fin</label>
                    <input type="date" id="rangeEndDate" value="${nextWeek.toISOString().slice(0,10)}" class="filter-input">
                </div>
                <div class="field" style="flex:1; min-width:120px;">
                    <label>⏰ Hora inicio</label>
                    <input type="time" id="startTime" value="08:00" class="filter-input">
                </div>
                <div class="field" style="flex:1; min-width:120px;">
                    <label>⏰ Hora fin</label>
                    <input type="time" id="endTime" value="22:00" class="filter-input">
                </div>
            </div>
            <div class="form-row" style="display:flex; gap:15px; flex-wrap:wrap; margin-bottom:20px;">
                <div class="field" style="flex:1;">
                    <label>⏱️ Duración atención (min)</label>
                    <input type="number" id="duracionAtencion" value="60" min="15" step="5" class="filter-input">
                </div>
                <div class="field" style="flex:1;">
                    <label>⏱️ Holgura entre turnos (min)</label>
                    <input type="number" id="holguraTurnos" value="10" min="0" step="5" class="filter-input">
                </div>
            </div>
            <div style="margin-bottom:20px;">
                <label>📌 Días de la semana a incluir</label>
                <div class="weekday-selector" id="weekdaySelector" style="display:flex; gap:10px; flex-wrap:wrap; margin-top:8px;">
                    <div class="weekday selected" data-day="1">Lun</div>
                    <div class="weekday selected" data-day="2">Mar</div>
                    <div class="weekday selected" data-day="3">Mié</div>
                    <div class="weekday selected" data-day="4">Jue</div>
                    <div class="weekday selected" data-day="5">Vie</div>
                    <div class="weekday" data-day="6">Sáb</div>
                    <div class="weekday" data-day="0">Dom</div>
                </div>
            </div>
            <div style="display:flex; gap:15px; margin-bottom:20px;">
                <button id="previewRangeBtn" class="btn-staff" style="background:var(--azul-medico); flex:1;">🔍 Previsualizar slots</button>
                <button id="generateRangeBtn" class="btn-staff" style="background:var(--verde-exito); flex:1;">✨ Generar slots para todo el rango</button>
            </div>
            <div id="previewContainer" style="background:#eef2f0; padding:15px; border-radius:12px; display:none; margin-top:15px;">
                <h5>📋 Vista previa de los turnos a generar:</h5>
                <div id="previewDetails" style="max-height:300px; overflow-y:auto; font-size:0.9rem;"></div>
            </div>
        </div>

        <hr style="margin: 25px 0;">

        <h4>🗓️ Slots del día (edición individual)</h4>
        <div class="form-row" style="display:flex; gap:15px; align-items:flex-end; margin-bottom:20px;">
            <div class="field" style="flex:2;">
                <label>Fecha</label>
                <input type="date" id="adminBoxDate" value="${today.toISOString().slice(0,10)}" class="filter-input">
            </div>
            <button id="refreshAdminSlotsBtn" class="btn-staff">Cargar horarios</button>
        </div>
        <div id="adminBoxSlotsContainer" class="slots-grid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px;"></div>
    `;

    // ========== SELECCIÓN DE DÍAS ==========
    const weekdays = document.querySelectorAll('#weekdaySelector .weekday');
    let selectedDays = ['1','2','3','4','5'];
    weekdays.forEach(day => {
        const dayVal = day.getAttribute('data-day');
        if (selectedDays.includes(dayVal)) day.classList.add('selected');
        day.addEventListener('click', () => {
            if (selectedDays.includes(dayVal)) {
                selectedDays = selectedDays.filter(d => d !== dayVal);
                day.classList.remove('selected');
            } else {
                selectedDays.push(dayVal);
                day.classList.add('selected');
            }
        });
    });

    // ========== ELEMENTOS ==========
    const rangeStart = document.getElementById('rangeStartDate');
    const rangeEnd = document.getElementById('rangeEndDate');
    const startTime = document.getElementById('startTime');
    const endTime = document.getElementById('endTime');
    const duracionInput = document.getElementById('duracionAtencion');
    const holguraInput = document.getElementById('holguraTurnos');
    const previewBtn = document.getElementById('previewRangeBtn');
    const generateBtn = document.getElementById('generateRangeBtn');
    const adminDate = document.getElementById('adminBoxDate');
    const refreshBtn = document.getElementById('refreshAdminSlotsBtn');
    const slotsContainer = document.getElementById('adminBoxSlotsContainer');
    const previewContainer = document.getElementById('previewContainer');
    const previewDetails = document.getElementById('previewDetails');

    // ========== FUNCIÓN PARA GENERAR PREVISUALIZACIÓN ==========
    async function generarPrevisualizacion() {
        const start = rangeStart.value;
        const end = rangeEnd.value;
        const startH = startTime.value;
        const endH = endTime.value;
        const duracion = parseInt(duracionInput.value);
        const holgura = parseInt(holguraInput.value);

        // Validaciones específicas con mensajes claros
        if (!start) { showToast('❌ Falta la fecha de inicio', 'error'); return false; }
        if (!end) { showToast('❌ Falta la fecha de fin', 'error'); return false; }
        if (!startH) { showToast('❌ Falta la hora de inicio', 'error'); return false; }
        if (!endH) { showToast('❌ Falta la hora de fin', 'error'); return false; }
        if (isNaN(duracion) || duracion < 15) { showToast('❌ La duración debe ser al menos 15 minutos', 'error'); return false; }
        if (isNaN(holgura) || holgura < 0) { showToast('❌ La holgura no puede ser negativa', 'error'); return false; }

        const startDate = new Date(start);
        const endDate = new Date(end);
        if (startDate > endDate) { showToast('❌ La fecha inicio debe ser anterior a la fecha fin', 'error'); return false; }
        if (startH >= endH) { showToast('❌ La hora de inicio debe ser anterior a la hora de fin', 'error'); return false; }

        let totalTurnos = 0;
        let resumen = '';
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().slice(0,10);
            const dayOfWeek = d.getDay().toString();
            if (selectedDays.includes(dayOfWeek)) {
                const slots = calcularSlotsParaFecha(dateStr, startH, endH, duracion, holgura);
                if (slots.length) {
                    totalTurnos += slots.length;
                    resumen += `<div><strong>${dateStr} (${d.toLocaleDateString('es-ES', { weekday: 'long' })}):</strong> ${slots.length} turnos</div>`;
                } else {
                    resumen += `<div><strong>${dateStr}:</strong> ⚠️ No se generaron turnos (revisa horarios)</div>`;
                }
            }
        }
        if (totalTurnos === 0) {
            previewDetails.innerHTML = '<div>⚠️ No se generará ningún turno. Verifica los días seleccionados y el rango horario.</div>';
        } else {
            previewDetails.innerHTML = `<div style="margin-bottom:10px;"><strong>Total de turnos a generar: ${totalTurnos}</strong></div>${resumen}`;
        }
        previewContainer.style.display = 'block';
        return true;
    }

    // ========== GENERAR Y GUARDAR ==========
    async function generarYGuardar() {
        const start = rangeStart.value;
        const end = rangeEnd.value;
        const startH = startTime.value;
        const endH = endTime.value;
        const duracion = parseInt(duracionInput.value);
        const holgura = parseInt(holguraInput.value);

        // Validaciones
        if (!start || !end || !startH || !endH) {
            showToast('❌ Completa todas las fechas y horarios', 'error');
            return;
        }
        if (isNaN(duracion) || duracion < 15) { showToast('❌ La duración debe ser al menos 15 minutos', 'error'); return; }
        if (isNaN(holgura) || holgura < 0) { showToast('❌ La holgura no puede ser negativa', 'error'); return; }

        const startDate = new Date(start);
        const endDate = new Date(end);
        if (startDate > endDate) { showToast('❌ La fecha inicio debe ser anterior a la fecha fin', 'error'); return; }
        if (startH >= endH) { showToast('❌ La hora de inicio debe ser anterior a la hora de fin', 'error'); return; }

        let totalGenerados = 0;
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().slice(0,10);
            const dayOfWeek = d.getDay().toString();
            if (selectedDays.includes(dayOfWeek)) {
                const newSlots = calcularSlotsParaFecha(dateStr, startH, endH, duracion, holgura).map(slot => ({
                    ...slot,
                    status: 'available',
                    professional: null
                }));
                if (newSlots.length) {
                    await saveBoxSlots(dateStr, newSlots);
                    totalGenerados += newSlots.length;
                }
            }
        }
        showToast(`✅ Generados ${totalGenerados} turnos en el rango de fechas`, 'success');
        refreshAdminSlots();
        const proDate = document.getElementById('proBoxDate')?.value;
        if (proDate && proDate >= start && proDate <= end) renderProfessionalBoxPanel();
    }

    // ========== REFRESCAR SLOTS DEL DÍA ==========
    async function refreshAdminSlots() {
        const date = adminDate.value;
        if (!date) return;
        const slots = await loadBoxSlots(date);
        if (!slots.length) {
            slotsContainer.innerHTML = '<div class="info-message">No hay slots generados para esta fecha. Usa "Generar slots para todo el rango" primero.</div>';
            return;
        }
        slotsContainer.innerHTML = '';
        slots.forEach((slot, idx) => {
            const card = document.createElement('div');
            card.className = 'slot-card';
            card.style.background = '#fefcf9';
            card.style.borderRadius = '16px';
            card.style.padding = '12px';
            card.style.border = '1px solid #e9dfd3';
            card.innerHTML = `
                <div class="slot-time" style="font-weight:700; font-size:1rem;">${slot.timeLabel}</div>
                <div class="slot-status ${slot.status}" style="display:inline-block; padding:2px 10px; border-radius:20px; font-size:0.7rem; margin:8px 0;">${slot.status === 'available' ? 'Disponible' : 'Reservado'}</div>
                ${slot.professional ? `<div class="slot-professional" style="font-size:0.85rem;">👤 ${escapeHtml(slot.professional)}</div>` : ''}
                <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
                    ${slot.status === 'booked' ? `<button class="small-btn cancel-admin" data-index="${idx}" style="background:#dc3545; color:white; border:none; padding:6px 12px; border-radius:30px; cursor:pointer;">🗑️ Cancelar</button>` : ''}
                    <button class="small-btn reserve-admin" data-index="${idx}" style="background:#28a745; color:white; border:none; padding:6px 12px; border-radius:30px; cursor:pointer;">📝 Reservar</button>
                </div>
                ${slot.status === 'available' ? `<input type="text" id="adminBoxName_${idx}" class="reserve-input" placeholder="Nombre del profesional" style="width:100%; margin-top:8px; padding:6px; border-radius:20px; border:1px solid #ccc;">` : ''}
            `;
            slotsContainer.appendChild(card);
        });

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

    // ========== EVENTOS ==========
    previewBtn.addEventListener('click', generarPrevisualizacion);
    generateBtn.addEventListener('click', generarYGuardar);
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

    const today = new Date();
    const fechaActual = today.toISOString().slice(0,10);

    container.innerHTML = `
        <h3>📦 Reservar Box Compartido</h3>
        <div style="margin-bottom:20px;">
            <div style="display:flex; gap:15px; align-items:flex-end; flex-wrap:wrap; margin-bottom:20px;">
                <div class="field">
                    <label>📅 Ver mes</label>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <button id="prevMonthBtn" class="btn-staff" style="padding:6px 12px;">◀</button>
                        <span id="currentMonthYear" style="font-weight:bold; min-width:150px; text-align:center;"></span>
                        <button id="nextMonthBtn" class="btn-staff" style="padding:6px 12px;">▶</button>
                    </div>
                </div>
                <div class="field">
                    <label>Ir a fecha específica</label>
                    <input type="date" id="proBoxDate" class="filter-input" value="${fechaActual}">
                </div>
                <button id="refreshProBoxBtn" class="btn-staff">Ir</button>
            </div>
            <div id="calendarioBoxContainer" style="background:white; border-radius:16px; padding:15px; margin-bottom:20px; overflow-x:auto;"></div>
            <h4>📋 Horarios del día seleccionado</h4>
            <div id="proBoxSlotsContainer" class="slots-grid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px;"></div>
        </div>
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

        let html = `<table style="width:100%; border-collapse:collapse; text-align:center;">
            <thead><tr><th>Dom</th><th>Lun</th><th>Mar</th><th>Mié</th><th>Jue</th><th>Vie</th><th>Sáb</th></tr></thead><tbody>`;
        let dia = 1;
        for (let i = 0; i < 6; i++) {
            if (dia > diasEnMes) break;
            html += '<tr>';
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < diaInicioSemana) {
                    html += '<td style="border:1px solid #ddd; padding:8px;"> </td>';
                } else if (dia <= diasEnMes) {
                    const fechaStr = `${añoActual}-${String(mesActual+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
                    const slots = await loadBoxSlots(fechaStr);
                    const disponibles = slots.filter(s => s.status === 'available').length;
                    const reservados = slots.filter(s => s.status === 'booked').length;
                    html += `<td style="border:1px solid #ddd; padding:8px; cursor:pointer; background-color:${disponibles > 0 ? '#e8f5e9' : reservados > 0 ? '#ffebee' : '#fafafa'}" onclick="document.getElementById('proBoxDate').value='${fechaStr}'; window.cargarSlotsProfesionalFecha('${fechaStr}');">
                        <div style="font-weight:bold;">${dia}</div>
                        <div style="font-size:0.7rem;">
                            ${disponibles > 0 ? `<span style="color:#2e7d32;">✅ ${disponibles}</span>` : ''}
                            ${reservados > 0 ? `<span style="color:#c62828;">📌 ${reservados}</span>` : ''}
                        </div>
                    </td>`;
                    dia++;
                } else {
                    html += '<td style="border:1px solid #ddd; padding:8px;"> </td>';
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
            card.style.background = '#fefcf9';
            card.style.borderRadius = '16px';
            card.style.padding = '12px';
            card.style.border = '1px solid #e9dfd3';
            if (slot.status === 'available') {
                card.innerHTML = `
                    <div class="slot-time" style="font-weight:700;">${slot.timeLabel}</div>
                    <div class="slot-status available" style="display:inline-block; padding:2px 10px; border-radius:20px; background:#d9e8e2; color:#1e6b55; font-size:0.7rem;">Disponible</div>
                    <input type="text" id="proBoxName_${idx}" class="reserve-input" placeholder="Tu nombre completo" style="width:100%; margin:10px 0; padding:6px; border-radius:20px; border:1px solid #ccc;">
                    <button class="small-btn reserve-pro" data-index="${idx}" style="background:#28a745; color:white; border:none; padding:8px; border-radius:30px; width:100%; cursor:pointer;">📌 Reservar</button>
                `;
            } else {
                card.innerHTML = `
                    <div class="slot-time" style="font-weight:700;">${slot.timeLabel}</div>
                    <div class="slot-status booked" style="display:inline-block; padding:2px 10px; border-radius:20px; background:#f0e0d4; color:#b1624b; font-size:0.7rem;">Reservado</div>
                    <div class="slot-professional" style="margin:8px 0;">👤 ${escapeHtml(slot.professional)}</div>
                    <button class="small-btn cancel-pro" data-index="${idx}" style="background:#dc3545; color:white; border:none; padding:8px; border-radius:30px; width:100%; cursor:pointer;">❌ Cancelar mi reserva</button>
                `;
            }
            slotsContainer.appendChild(card);
        });

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
                    renderCalendario();
                } else showToast('Este horario ya no está disponible.', 'error');
            });
        });
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

    window.cargarSlotsProfesionalFecha = async (fecha) => {
        if (proDateInput) proDateInput.value = fecha;
        await refreshProSlots();
        await renderCalendario();
    };

    async function cambiarMes(delta) {
        const nuevaFecha = new Date(añoActual, mesActual + delta);
        mesActual = nuevaFecha.getMonth();
        añoActual = nuevaFecha.getFullYear();
        await renderCalendario();
    }

    prevBtn.addEventListener('click', () => cambiarMes(-1));
    nextBtn.addEventListener('click', () => cambiarMes(1));
    refreshBtn.addEventListener('click', async () => {
        await refreshProSlots();
        await renderCalendario();
    });
    proDateInput.addEventListener('change', refreshProSlots);

    await renderCalendario();
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
    let html = '<table class="admin-table" style="width:100%; border-collapse:collapse;"><thead><tr><th>Profesional</th><th>Cantidad de atenciones</th></tr></thead><tbody>';
    sorted.forEach(([prof, count]) => html += `<tr><td>${escapeHtml(prof)}</td><td>${count}</td></tr>`);
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ============================================
// EXPOSICIÓN GLOBAL
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

console.log('✅ box.js actualizado con previsualización y validación mejorada');