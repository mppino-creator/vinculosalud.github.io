// js/modules/box.js - Módulo de gestión de Box compartido
import { db } from '../config/firebase.js';
import { showToast } from './utils.js';

// ============================================
// UTILIDADES INTERNAS
// ============================================

function formatTime(date) {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// Generar slots (60 min atención + 10 min holgura)
export function generateSlots(dateStr, startTime, endTime) {
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

// Guardar slots en Firebase (nodo "boxes")
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
// PANEL ADMIN
// ============================================
export async function renderAdminBoxPanel() {
    const container = document.getElementById('tabBox');
    if (!container) return;
    const today = new Date().toISOString().slice(0,10);
    container.innerHTML = `
        <h3>📦 Gestión del Box Compartido</h3>
        <div class="form-row" style="display:flex; gap:15px; flex-wrap:wrap; margin-bottom:20px;">
            <div class="field"><label>📅 Fecha</label><input type="date" id="adminBoxDate" value="${today}"></div>
            <div class="field"><label>⏰ Inicio</label><input type="time" id="adminBoxStart" value="08:00"></div>
            <div class="field"><label>⏰ Fin</label><input type="time" id="adminBoxEnd" value="22:00"></div>
            <button id="generateBoxSlotsBtn" class="btn-staff" style="background:var(--verde-exito);">✨ Generar / Resetear slots</button>
        </div>
        <div id="adminBoxSlotsContainer" class="slots-grid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px;"></div>
    `;
    const dateInput = document.getElementById('adminBoxDate');
    const startInput = document.getElementById('adminBoxStart');
    const endInput = document.getElementById('adminBoxEnd');
    const generateBtn = document.getElementById('generateBoxSlotsBtn');
    const slotsContainer = document.getElementById('adminBoxSlotsContainer');
    
    async function refreshAdminSlots() {
        const date = dateInput.value;
        const slots = await loadBoxSlots(date);
        if (!slots.length) {
            slotsContainer.innerHTML = '<div class="info-message">No hay slots generados. Usa el botón "Generar / Resetear slots".</div>';
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
        // Eventos
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
    generateBtn.addEventListener('click', async () => {
        const date = dateInput.value;
        const start = startInput.value;
        const end = endInput.value;
        if (!date || !start || !end) { showToast('Completa fecha, inicio y fin.', 'error'); return; }
        const newSlots = generateSlots(date, start, end);
        if (!newSlots.length) { showToast('No se generaron slots. Revisa el rango horario.', 'error'); return; }
        await saveBoxSlots(date, newSlots);
        refreshAdminSlots();
        showToast(`✅ ${newSlots.length} turnos generados para ${date}`, 'success');
    });
    dateInput.addEventListener('change', refreshAdminSlots);
    refreshAdminSlots();
}

// ============================================
// PANEL PROFESIONAL
// ============================================
export async function renderProfessionalBoxPanel() {
    const container = document.getElementById('tabBoxProfesional');
    if (!container) return;
    const today = new Date().toISOString().slice(0,10);
    container.innerHTML = `
        <h3>📦 Reservar Box Compartido</h3>
        <div style="display:flex; gap:15px; margin-bottom:20px; align-items:flex-end;">
            <div class="field"><label>📅 Fecha</label><input type="date" id="proBoxDate" value="${today}"></div>
            <button id="refreshProBoxBtn" class="btn-staff">Actualizar</button>
        </div>
        <div id="proBoxSlotsContainer" class="slots-grid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px;"></div>
    `;
    const dateInput = document.getElementById('proBoxDate');
    const refreshBtn = document.getElementById('refreshProBoxBtn');
    const slotsContainer = document.getElementById('proBoxSlotsContainer');
    
    async function refreshProSlots() {
        const date = dateInput.value;
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
        // Reservar
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
                } else showToast('El nombre no coincide con el profesional que reservó.', 'error');
            });
        });
    }
    refreshBtn.addEventListener('click', refreshProSlots);
    dateInput.addEventListener('change', refreshProSlots);
    refreshProSlots();
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

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}