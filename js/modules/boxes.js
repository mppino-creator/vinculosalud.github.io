// js/modules/boxes.js
// ⚠️ MÓDULO COMPLETAMENTE DESACTIVADO - VERSIÓN INERTE
// Las citas presenciales se coordinan directamente con el psicólogo
// Este archivo solo existe para prevenir errores de importación

import { showToast } from './utils.js';

// ============================================
// FUNCIONES DE OCUPACIÓN DE BOXES (DESACTIVADAS)
// ============================================

export function renderBoxOccupancy() {
    // Función desactivada - No hace nada
    return;
}

// ============================================
// FUNCIONES DE MODAL DE BOXES (DESACTIVADAS)
// ============================================

export function showBoxModal() {
    showToast('📦 El sistema de boxes está desactivado. Las citas presenciales se coordinan directamente con el psicólogo.', 'info');
    return;
}

export function closeBoxModal() {
    // Función desactivada - No hace nada
    return;
}

// ============================================
// FUNCIONES CRUD DE BOXES (DESACTIVADAS)
// ============================================

export function saveBox() {
    showToast('📦 El sistema de boxes está desactivado', 'info');
    return;
}

export function renderBoxesTable() {
    const tbModal = document.getElementById('boxTableBody');
    const tbDashboard = document.getElementById('boxTableBodyDashboard');
    
    // Mostrar mensaje de sistema desactivado
    const mensaje = '<tr><td colspan="6" style="text-align:center; padding:20px;">📦 Sistema de boxes desactivado. Las citas presenciales se coordinan directamente.</td></tr>';
    
    if (tbModal) tbModal.innerHTML = mensaje;
    if (tbDashboard) tbDashboard.innerHTML = mensaje;
}

export function editBox(id) {
    showToast('📦 El sistema de boxes está desactivado', 'info');
    return;
}

export function updateBox(id) {
    showToast('📦 El sistema de boxes está desactivado', 'info');
    return;
}

export function toggleBoxStatus(id) {
    showToast('📦 El sistema de boxes está desactivado', 'info');
    return;
}

export function deleteBox(id) {
    showToast('📦 El sistema de boxes está desactivado', 'info');
    return;
}

// ============================================
// FUNCIÓN PARA OBTENER BOXES DISPONIBLES (DESACTIVADA)
// ============================================

export function getAvailableBoxes(date, time) {
    return []; // Siempre retorna array vacío
}

// ============================================
// FUNCIONES DE ESTADÍSTICAS (DESACTIVADAS)
// ============================================

export function getBoxesStats() {
    return {
        total: 0,
        activos: 0,
        inactivos: 0,
        usoPorDia: {},
        boxMasUsado: 'Sistema desactivado',
        usosBoxMasUsado: 0,
        citasProximas24h: 0,
        promedioDiario: 0,
        mensaje: '📦 Sistema de boxes desactivado'
    };
}

export function getBoxesCurrentStatus() {
    return [];
}

export function getBoxHistory(boxId, dias = 30) {
    return [];
}

export function validateBoxAvailability(boxId, date, time) {
    return { 
        disponible: false, 
        razon: '📦 Sistema de boxes desactivado. La cita presencial se coordina directamente con el psicólogo.' 
    };
}

// ============================================
// FUNCIÓN AUXILIAR (MANTENIDA POR COMPATIBILIDAD)
// ============================================
function sumarHora(time, minutes) {
    const [hour, min] = time.split(':').map(Number);
    const totalMin = hour * 60 + min + minutes;
    const newHour = Math.floor(totalMin / 60);
    const newMin = totalMin % 60;
    return `${newHour.toString().padStart(2, '0')}:${newMin.toString().padStart(2, '0')}`;
}

// ============================================
// EXPORTAR FUNCIONES AL OBJETO WINDOW
// ============================================
if (typeof window !== 'undefined') {
    window.getBoxesStats = getBoxesStats;
    window.getBoxesCurrentStatus = getBoxesCurrentStatus;
    window.getBoxHistory = getBoxHistory;
    window.validateBoxAvailability = validateBoxAvailability;
    window.getAvailableBoxes = getAvailableBoxes;
}

console.log('⚠️ boxes.js: MÓDULO DESACTIVADO - Las citas presenciales se coordinan directamente con el psicólogo');