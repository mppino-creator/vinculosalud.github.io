// js/modules/box.js - Versión Profesional con Calendario Admin y Gestión Avanzada
import { db } from '../config/firebase.js';
import { showToast } from './utils.js';
import * as state from './state.js';

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

function limpiarHora(valor) {
    if (!valor) return '';
    return valor.split(' ')[0];
}

function isSlotPassed(dateStr, timeLabel) {
    const startTimeStr = timeLabel.split(' - ')[0];
    const slotDateTime = new Date(`${dateStr}T${startTimeStr}:00`);
    return slotDateTime < new Date();
}

// ========== FUNCIONES PRINCIPALES ==========
export function generateSlotsForDate(dateStr, startTime, endTime, duracionMin, holguraMin) {
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

export async function saveBoxSlots(dateStr, slots) {
    await db.ref(`boxes/${dateStr}`).set(slots);
    showToast(`✅ Horarios del box guardados para ${dateStr}`, 'success');
}

export async function loadBoxSlots(dateStr) {
    const snapshot = await db.ref(`boxes/${dateStr}`).once('value');
    return snapshot.val() || [];
}

// ============================================
// PANEL ADMINISTRADOR (con calendario y acciones masivas)
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

    // HTML principal con calendario y generación
    container.innerHTML = `
        <h3>📦 Gestión del Box Compartido</h3>
        
        <!-- Sección de generación por rango -->
        <div class="admin-box-config" style="background: #f9f9fc; padding: 20px; border-radius: 16px; margin-bottom: 25px;">
            <h4 style="margin-top:0;">⚙️ Generar horarios por rango</h4>
            <div class="form-row" style="display:flex; gap:15px; flex-wrap:wrap; margin-bottom:20px;">
                <div class="field" style="flex:1; min-width:150px;">
                    <label>📅 Fecha inicio</label>
                    <input type="date" id="boxRangeStartDate" value="${today.toISOString().slice(0,10)}" class="filter-input">
                </div>
                <div class="field" style="flex:1; min-width:150px;">
                    <label>📅 Fecha fin</label>
                    <input type="date" id="boxRangeEndDate" value="${nextWeek.toISOString().slice(0,10)}" class="filter-input">
                </div>
                <div class="field" style="flex:1; min-width:120px;">
                    <label>⏰ Hora inicio</label>
                    <input type="time" id="boxStartTime" value="08:00" class="filter-input">
                </div>
                <div class="field" style="flex:1; min-width:120px;">
                    <label>⏰ Hora fin</label>
                    <input type="time" id="boxEndTime" value="22:00" class="filter-input">
                </div>
            </div>
            <div class="form-row" style="display:flex; gap:15px; flex-wrap:wrap; margin-bottom:20px;">
                <div class="field" style="flex:1;">
                    <label>⏱️ Duración atención (min)</label>
                    <input type="number" id="boxDuracionAtencion" value="60" min="15" step="5" class="filter-input">
                </div>
                <div class="field" style="flex:1;">
                    <label>⏱️ Holgura entre turnos (min)</label>
                    <input type="number" id="boxHolguraTurnos" value="10" min="0" step="5" class="filter-input">
                </div>
            </div>
            <div style="margin-bottom:20px;">
                <label>📌 Días de la semana a incluir</label>
                <div class="weekday-selector" id="boxWeekdaySelector" style="display:flex; gap:10px; flex-wrap:wrap; margin-top:8px;">
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
                <button id="boxPreviewRangeBtn" class="btn-staff" style="background:var(--azul-medico); flex:1;">🔍 Previsualizar</button>
                <button id="boxGenerateRangeBtn" class="btn-staff" style="background:var(--verde-exito); flex:1;">✨ Generar slots</button>
            </div>
            <div id="boxPreviewContainer" style="background:#eef2f0; padding:15px; border-radius:12px; display:none;">
                <h5>📋 Vista previa:</h5>
                <div id="boxPreviewDetails" style="max-height:200px; overflow-y:auto;"></div>
            </div>
        </div>

        <!-- Calendario mensual para admin -->
        <div style="margin-bottom:25px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h4>📅 Calendario de disponibilidad</h4>
                <div>
                    <button id="adminPrevMonthBtn" class="btn-staff" style="padding:4px 12px;">◀</button>
                    <span id="adminMonthYear" style="margin:0 15px; font-weight:bold;"></span>
                    <button id="adminNextMonthBtn" class="btn-staff" style="padding:4px 12px;">▶</button>
                </div>
            </div>
            <div id="adminCalendarioContainer" style="background:white; border-radius:16px; padding:15px; overflow-x:auto;"></div>
            <div class="info-message" style="margin-top:10px; font-size:0.8rem;">
                🟢 Verde: con disponibilidad | 🔴 Rojo: totalmente reservado | ⚪ Gris: sin slots
            </div>
        </div>

        <!-- Slots del día seleccionado -->
        <h4>🗓️ Slots del día (edición individual)</h4>
        <div class="form-row" style="display:flex; gap:15px; align-items:flex-end; margin-bottom:20px;">
            <div class="field" style="flex:2;">
                <label>Fecha</label>
                <input type="date" id="boxAdminDate" value="${today.toISOString().slice(0,10)}" class="filter-input">
            </div>
            <button id="boxRefreshAdminSlotsBtn" class="btn-staff">Cargar horarios</button>
            <button id="boxDeleteRangeBtn" class="btn-staff" style="background:#dc3545;">🗑️ Eliminar rango de fechas</button>
        </div>
        <div id="boxAdminSlotsContainer" class="slots-grid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px;"></div>
    `;

    // ========== SELECCIÓN DE DÍAS ==========
    const weekdays = document.querySelectorAll('#boxWeekdaySelector .weekday');
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

    // ========== FUNCIONES DE LECTURA ==========
    function getStart() { return document.getElementById('boxRangeStartDate')?.value || ''; }
    function getEnd() { return document.getElementById('boxRangeEndDate')?.value || ''; }
    function getStartH() { return limpiarHora(document.getElementById('boxStartTime')?.value || ''); }
    function getEndH() { return limpiarHora(document.getElementById('boxEndTime')?.value || ''); }
    function getDuracion() { return parseInt(document.getElementById('boxDuracionAtencion')?.value) || 60; }
    function getHolgura() { return parseInt(document.getElementById('boxHolguraTurnos')?.value) || 10; }

    // ========== CALENDARIO ADMIN ==========
    async function renderAdminCalendario() {
        const primerDia = new Date(añoActual, mesActual, 1);
        const ultimoDia = new Date(añoActual, mesActual + 1, 0);
        const diasEnMes = ultimoDia.getDate();
        const diaInicioSemana = primerDia.getDay();
        document.getElementById('adminMonthYear').innerText = primerDia.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

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
                    let bgColor = '#fafafa';
                    let tooltip = 'Sin horarios';
                    if (slots.length > 0) {
                        if (disponibles > 0) {
                            bgColor = '#d9e8e2';
                            tooltip = `${disponibles} disponible(s), ${reservados} reservado(s)`;
                        } else if (reservados > 0 && disponibles === 0) {
                            bgColor = '#f0e0d4';
                            tooltip = `Totalmente reservado (${reservados})`;
                        }
                    }
                    html += `<td style="border:1px solid #ddd; padding:8px; background-color:${bgColor}; cursor:pointer;" 
                                onclick="document.getElementById('boxAdminDate').value='${fechaStr}'; document.getElementById('boxRefreshAdminSlotsBtn').click();"
                                title="${tooltip}">
                                <div style="font-weight:bold;">${dia}</div>
                                ${slots.length > 0 ? `<div style="font-size:0.7rem;">🟢 ${disponibles} / 📌 ${reservados}</div>` : '<div style="font-size:0.7rem;">—</div>'}
                            </td>`;
                    dia++;
                } else {
                    html += '<td style="border:1px solid #ddd; padding:8px;"> </td>';
                }
            }
            html += '</tr>';
        }
        html += '</tbody></table>';
        document.getElementById('adminCalendarioContainer').innerHTML = html;
    }

    // ========== PREVISUALIZACIÓN ==========
    async function generarPrevisualizacion() {
        const start = getStart();
        const end = getEnd();
        const startH = getStartH();
        const endH = getEndH();
        const duracion = getDuracion();
        const holgura = getHolgura();
        if (!start || !end || !startH || !endH) {
            showToast('❌ Completa todas las fechas y horarios', 'error');
            return;
        }
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (startDate > endDate) { showToast('❌ Fecha inicio debe ser anterior a fin', 'error'); return; }
        let totalTurnos = 0, resumen = '';
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().slice(0,10);
            const dayOfWeek = d.getDay().toString();
            if (selectedDays.includes(dayOfWeek)) {
                const slots = generateSlotsForDate(dateStr, startH, endH, duracion, holgura);
                if (slots.length) {
                    totalTurnos += slots.length;
                    resumen += `<div><strong>${dateStr} (${d.toLocaleDateString('es-ES', { weekday: 'long' })}):</strong> ${slots.length} turnos</div>`;
                }
            }
        }
        const previewDiv = document.getElementById('boxPreviewDetails');
        if (totalTurnos === 0) previewDiv.innerHTML = '<div>⚠️ No se generará ningún turno.</div>';
        else previewDiv.innerHTML = `<div><strong>Total: ${totalTurnos}</strong></div>${resumen}`;
        document.getElementById('boxPreviewContainer').style.display = 'block';
    }

    // ========== GENERAR Y GUARDAR ==========
    async function generarYGuardar() {
        const start = getStart();
        const end = getEnd();
        const startH = getStartH();
        const endH = getEndH();
        const duracion = getDuracion();
        const holgura = getHolgura();
        if (!start || !end || !startH || !endH) { showToast('❌ Completa todas las fechas y horarios', 'error'); return; }
        const startDate = new Date(start);
        const endDate = new Date(end);
        let totalGenerados = 0;
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().slice(0,10);
            const dayOfWeek = d.getDay().toString();
            if (selectedDays.includes(dayOfWeek)) {
                const slots = generateSlotsForDate(dateStr, startH, endH, duracion, holgura);
                if (slots.length) {
                    const slotsToSave = slots.map(slot => ({ ...slot, status: 'available', professional: null }));
                    await saveBoxSlots(dateStr, slotsToSave);
                    totalGenerados += slots.length;
                }
            }
        }
        showToast(`✅ Generados ${totalGenerados} turnos`, 'success');
        refreshAdminSlots();
        renderAdminCalendario();
    }

    // ========== REFRESCAR SLOTS DEL DÍA ==========
    async function refreshAdminSlots() {
        const date = document.getElementById('boxAdminDate').value;
        if (!date) return;
        const slots = await loadBoxSlots(date);
        const container = document.getElementById('boxAdminSlotsContainer');
        if (!slots.length) {
            container.innerHTML = '<div class="info-message">No hay slots generados para esta fecha.</div>';
            return;
        }
        container.innerHTML = '';
        slots.forEach((slot, idx) => {
            const card = document.createElement('div');
            card.className = 'slot-card';
            card.style.cssText = 'background:#fefcf9; border-radius:16px; padding:12px; border:1px solid #e9dfd3;';
            card.innerHTML = `
                <div class="slot-time" style="font-weight:700;">${slot.timeLabel}</div>
                <div class="slot-status ${slot.status}" style="display:inline-block; padding:2px 10px; border-radius:20px; font-size:0.7rem;">${slot.status === 'available' ? 'Disponible' : 'Reservado'}</div>
                ${slot.professional ? `<div class="slot-professional">👤 ${escapeHtml(slot.professional)}</div>` : ''}
                <div style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;">
                    ${slot.status === 'booked' ? `<button class="small-btn cancel-admin" data-index="${idx}" style="background:#dc3545;">🗑️ Cancelar</button>` : ''}
                    <button class="small-btn reserve-admin" data-index="${idx}" style="background:#28a745;">📝 Reservar</button>
                    <button class="small-btn delete-slot" data-index="${idx}" style="background:#6c757d;">❌ Eliminar</button>
                </div>
                ${slot.status === 'available' ? `<input type="text" id="adminBoxName_${idx}" class="reserve-input" placeholder="Nombre del profesional" style="width:100%; margin-top:8px;">` : ''}
            `;
            container.appendChild(card);
        });
        // Eventos
        document.querySelectorAll('#boxAdminSlotsContainer .cancel-admin').forEach(btn => {
            btn.addEventListener('click', async () => {
                const idx = parseInt(btn.dataset.index);
                if (slots[idx]?.status === 'booked') {
                    slots[idx].status = 'available';
                    slots[idx].professional = null;
                    await saveBoxSlots(date, slots);
                    refreshAdminSlots();
                    renderAdminCalendario();
                }
            });
        });
        document.querySelectorAll('#boxAdminSlotsContainer .reserve-admin').forEach(btn => {
            btn.addEventListener('click', async () => {
                const idx = parseInt(btn.dataset.index);
                if (slots[idx]?.status === 'booked') { showToast('Ya reservado', 'error'); return; }
                const nameInput = document.getElementById(`adminBoxName_${idx}`);
                const profName = nameInput?.value.trim();
                if (!profName) { showToast('Ingresa nombre', 'error'); return; }
                slots[idx].status = 'booked';
                slots[idx].professional = profName;
                await saveBoxSlots(date, slots);
                refreshAdminSlots();
                renderAdminCalendario();
            });
        });
        document.querySelectorAll('#boxAdminSlotsContainer .delete-slot').forEach(btn => {
            btn.addEventListener('click', async () => {
                const idx = parseInt(btn.dataset.index);
                if (confirm(`¿Eliminar permanentemente el slot ${slots[idx].timeLabel}?`)) {
                    slots.splice(idx, 1);
                    await saveBoxSlots(date, slots);
                    refreshAdminSlots();
                    renderAdminCalendario();
                }
            });
        });
    }

    // ========== ELIMINAR RANGO DE FECHAS ==========
    async function eliminarRangoFechas() {
        const fechaInicio = prompt('Fecha de inicio (YYYY-MM-DD):');
        if (!fechaInicio) return;
        const fechaFin = prompt('Fecha de fin (YYYY-MM-DD):');
        if (!fechaFin) return;
        const startDate = new Date(fechaInicio);
        const endDate = new Date(fechaFin);
        if (startDate > endDate) { showToast('Fecha inicio mayor que fin', 'error'); return; }
        if (!confirm(`¿Eliminar TODOS los slots entre ${fechaInicio} y ${fechaFin}?`)) return;
        let eliminados = 0;
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().slice(0,10);
            const slots = await loadBoxSlots(dateStr);
            if (slots.length) {
                await db.ref(`boxes/${dateStr}`).remove();
                eliminados += slots.length;
            }
        }
        showToast(`✅ Eliminados ${eliminados} turnos en el rango`, 'success');
        refreshAdminSlots();
        renderAdminCalendario();
    }

    // ========== EVENTOS ==========
    document.getElementById('boxPreviewRangeBtn')?.addEventListener('click', generarPrevisualizacion);
    document.getElementById('boxGenerateRangeBtn')?.addEventListener('click', generarYGuardar);
    document.getElementById('boxRefreshAdminSlotsBtn')?.addEventListener('click', refreshAdminSlots);
    document.getElementById('boxDeleteRangeBtn')?.addEventListener('click', eliminarRangoFechas);
    document.getElementById('boxAdminDate')?.addEventListener('change', refreshAdminSlots);
    document.getElementById('adminPrevMonthBtn')?.addEventListener('click', () => { mesActual--; if (mesActual < 0) { mesActual = 11; añoActual--; } renderAdminCalendario(); });
    document.getElementById('adminNextMonthBtn')?.addEventListener('click', () => { mesActual++; if (mesActual > 11) { mesActual = 0; añoActual++; } renderAdminCalendario(); });
    refreshAdminSlots();
    renderAdminCalendario();
}

// ============================================
// PANEL PROFESIONAL (con calendario y reservas inteligentes)
// ============================================
export async function renderProfessionalBoxPanel() {
    const container = document.getElementById('tabBoxProfesional');
    if (!container) return;
    const professionalName = state.currentUser?.data?.name || 'Profesional';
    const today = new Date();
    const fechaActual = today.toISOString().slice(0,10);

    container.innerHTML = `
        <h3>📦 Reservar Box Compartido</h3>
        <div style="margin-bottom:20px;">
            <div style="display:flex; gap:15px; align-items:flex-end; flex-wrap:wrap;">
                <div class="field">
                    <label>📅 Ver mes</label>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <button id="proPrevMonthBtn" class="btn-staff" style="padding:6px 12px;">◀</button>
                        <span id="proMonthYear" style="font-weight:bold; min-width:150px; text-align:center;"></span>
                        <button id="proNextMonthBtn" class="btn-staff" style="padding:6px 12px;">▶</button>
                    </div>
                </div>
                <div class="field">
                    <label>Ir a fecha específica</label>
                    <input type="date" id="proBoxDate" class="filter-input" value="${fechaActual}">
                </div>
                <button id="refreshProBoxBtn" class="btn-staff">Ir</button>
            </div>
            <div id="proCalendarioContainer" style="background:white; border-radius:16px; padding:15px; margin-top:15px; overflow-x:auto;"></div>
            <h4 style="margin-top:20px;">📋 Horarios del día seleccionado</h4>
            <div id="proBoxSlotsContainer" class="slots-grid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px;"></div>
        </div>
    `;

    let mesPro = new Date().getMonth();
    let añoPro = new Date().getFullYear();

    async function renderProCalendario() {
        const primerDia = new Date(añoPro, mesPro, 1);
        const ultimoDia = new Date(añoPro, mesPro + 1, 0);
        const diasEnMes = ultimoDia.getDate();
        const diaInicioSemana = primerDia.getDay();
        document.getElementById('proMonthYear').innerText = primerDia.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

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
                    const fechaStr = `${añoPro}-${String(mesPro+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
                    const slots = await loadBoxSlots(fechaStr);
                    const disponibles = slots.filter(s => s.status === 'available' && !isSlotPassed(fechaStr, s.timeLabel)).length;
                    const reservados = slots.filter(s => s.status === 'booked').length;
                    let bgColor = '#fafafa';
                    let tooltip = 'Sin horarios';
                    if (slots.length > 0) {
                        if (disponibles > 0) {
                            bgColor = '#d9e8e2';
                            tooltip = `${disponibles} disponible(s)`;
                        } else if (reservados > 0 && disponibles === 0) {
                            bgColor = '#f0e0d4';
                            tooltip = `Totalmente reservado (${reservados})`;
                        }
                    }
                    html += `<td style="border:1px solid #ddd; padding:8px; background-color:${bgColor}; cursor:pointer;" 
                                onclick="document.getElementById('proBoxDate').value='${fechaStr}'; document.getElementById('refreshProBoxBtn').click();"
                                title="${tooltip}">
                                <div style="font-weight:bold;">${dia}</div>
                                ${slots.length > 0 ? `<div style="font-size:0.7rem;">🟢 ${disponibles}</div>` : '<div style="font-size:0.7rem;">—</div>'}
                            </td>`;
                    dia++;
                } else {
                    html += '<td style="border:1px solid #ddd; padding:8px;"> </td>';
                }
            }
            html += '</tr>';
        }
        html += '</tbody></table>';
        document.getElementById('proCalendarioContainer').innerHTML = html;
    }

    async function refreshProSlots() {
        const date = document.getElementById('proBoxDate').value;
        if (!date) return;
        const slots = await loadBoxSlots(date);
        const container = document.getElementById('proBoxSlotsContainer');
        if (!slots.length) {
            container.innerHTML = '<div class="info-message">No hay horarios configurados para esta fecha.</div>';
            return;
        }
        container.innerHTML = '';
        slots.forEach((slot, idx) => {
            const slotPassed = isSlotPassed(date, slot.timeLabel);
            const isOwn = (slot.status === 'booked' && slot.professional === professionalName);
            const isOther = (slot.status === 'booked' && slot.professional !== professionalName);
            const card = document.createElement('div');
            card.className = 'slot-card';
            card.style.cssText = 'background:#fefcf9; border-radius:16px; padding:12px; border:1px solid #e9dfd3;';
            if (slot.status === 'available' && !slotPassed) {
                card.innerHTML = `
                    <div class="slot-time" style="font-weight:700;">${slot.timeLabel}</div>
                    <div class="slot-status available" style="display:inline-block; padding:2px 10px; border-radius:20px; background:#d9e8e2; color:#1e6b55;">Disponible</div>
                    <button class="small-btn reserve-pro" data-index="${idx}" style="background:#28a745; width:100%; margin-top:8px;">📌 Reservar</button>
                `;
            } else if (slotPassed && slot.status === 'available') {
                card.innerHTML = `<div class="slot-time" style="font-weight:700;">${slot.timeLabel}</div><div class="slot-status" style="background:#e9ecef; color:#6c757d;">Horario pasado</div>`;
            } else if (isOwn) {
                card.innerHTML = `
                    <div class="slot-time" style="font-weight:700;">${slot.timeLabel}</div>
                    <div class="slot-status booked" style="background:#f0e0d4; color:#b1624b;">Reservado por ti</div>
                    <button class="small-btn cancel-pro" data-index="${idx}" style="background:#dc3545; width:100%; margin-top:8px;">❌ Cancelar</button>
                `;
            } else if (isOther) {
                card.innerHTML = `<div class="slot-time" style="font-weight:700;">${slot.timeLabel}</div><div class="slot-status booked" style="background:#f0e0d4; color:#b1624b;">Reservado por ${escapeHtml(slot.professional)}</div>`;
            } else {
                card.innerHTML = `<div class="slot-time" style="font-weight:700;">${slot.timeLabel}</div><div class="slot-status" style="background:#e9ecef;">No disponible</div>`;
            }
            container.appendChild(card);
        });

        document.querySelectorAll('#proBoxSlotsContainer .reserve-pro').forEach(btn => {
            btn.addEventListener('click', async () => {
                const idx = parseInt(btn.dataset.index);
                if (slots[idx]?.status !== 'available' || isSlotPassed(date, slots[idx].timeLabel)) {
                    showToast('No disponible', 'error');
                    return;
                }
                if (confirm(`¿Reservar ${slots[idx].timeLabel} para ${professionalName}?`)) {
                    slots[idx].status = 'booked';
                    slots[idx].professional = professionalName;
                    await saveBoxSlots(date, slots);
                    refreshProSlots();
                    renderProCalendario();
                }
            });
        });
        document.querySelectorAll('#proBoxSlotsContainer .cancel-pro').forEach(btn => {
            btn.addEventListener('click', async () => {
                const idx = parseInt(btn.dataset.index);
                if (slots[idx]?.professional !== professionalName) {
                    showToast('No es tu reserva', 'error');
                    return;
                }
                if (confirm(`¿Cancelar tu reserva de ${slots[idx].timeLabel}?`)) {
                    slots[idx].status = 'available';
                    slots[idx].professional = null;
                    await saveBoxSlots(date, slots);
                    refreshProSlots();
                    renderProCalendario();
                }
            });
        });
    }

    async function cambiarMesPro(delta) {
        const nuevaFecha = new Date(añoPro, mesPro + delta);
        mesPro = nuevaFecha.getMonth();
        añoPro = nuevaFecha.getFullYear();
        await renderProCalendario();
    }

    document.getElementById('proPrevMonthBtn')?.addEventListener('click', () => cambiarMesPro(-1));
    document.getElementById('proNextMonthBtn')?.addEventListener('click', () => cambiarMesPro(1));
    document.getElementById('refreshProBoxBtn')?.addEventListener('click', async () => { await refreshProSlots(); await renderProCalendario(); });
    document.getElementById('proBoxDate')?.addEventListener('change', refreshProSlots);

    await renderProCalendario();
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
    try {
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
    } catch (error) {
        console.error('Error en estadísticas:', error);
        container.innerHTML = '<p>Error al cargar estadísticas.</p>';
    }
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

console.log('✅ box.js actualizado: calendario admin, gestión avanzada y reservas profesionales');