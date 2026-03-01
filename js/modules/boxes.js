// js/modules/boxes.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast } from './utils.js';

// ============================================
// FUNCIONES DE OCUPACIÓN DE BOXES
// ============================================

export function renderBoxOccupancy() {
    const container = document.getElementById('boxOccupancy');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = state.appointments.filter(a => 
        a.date === today && 
        a.type === 'presencial' && 
        a.status === 'confirmada' &&
        a.boxId
    );

    if (todayAppointments.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">No hay boxes ocupados hoy</p>';
        return;
    }

    const sortedApps = todayAppointments.sort((a, b) => a.time.localeCompare(b.time));

    container.innerHTML = sortedApps.map(a => {
        const box = state.boxes.find(b => b.id == a.boxId);
        return `
            <div class="schedule-item">
                <span class="schedule-time">${a.time}</span>
                <span class="schedule-professional"><strong>${a.psych}</strong> - ${a.patient}</span>
                <span class="schedule-box">${box ? box.name : 'Box no asignado'}</span>
                ${a.observaciones ? `<small style="color:#666;">${a.observaciones}</small>` : ''}
            </div>
        `;
    }).join('');
}

// ============================================
// FUNCIONES DE MODAL DE BOXES
// ============================================

export function showBoxModal() {
    document.getElementById('boxModal').style.display = 'flex';
    document.getElementById('boxName').value = '';
    document.getElementById('boxLocation').value = '';
    document.getElementById('boxStartTime').value = '09:00';
    document.getElementById('boxEndTime').value = '20:00';
    document.getElementById('boxDescription').value = '';
    document.querySelectorAll('.box-day').forEach(cb => cb.checked = false);
    [1,2,3,4,5].forEach(d => {
        const cb = document.querySelector(`.box-day[value="${d}"]`);
        if (cb) cb.checked = true;
    });
    document.getElementById('saveBoxBtn').onclick = saveBox;
}

export function closeBoxModal() {
    document.getElementById('boxModal').style.display = 'none';
}

// ============================================
// FUNCIONES CRUD DE BOXES
// ============================================

export function saveBox() {
    const name = document.getElementById('boxName').value;
    const location = document.getElementById('boxLocation').value;
    const startTime = document.getElementById('boxStartTime').value;
    const endTime = document.getElementById('boxEndTime').value;
    const description = document.getElementById('boxDescription').value;
    const days = Array.from(document.querySelectorAll('.box-day:checked')).map(cb => parseInt(cb.value));

    if (!name || !startTime || !endTime || days.length === 0) {
        showToast('Nombre, horario y días son obligatorios', 'error');
        return;
    }

    const newBox = {
        id: Date.now(),
        name,
        location,
        startTime,
        endTime,
        days,
        description,
        active: true,
        createdAt: new Date().toISOString(),
        createdBy: state.currentUser?.data?.name || 'Admin'
    };

    state.boxes.push(newBox);
    import('../main.js').then(main => main.save());
    closeBoxModal();
    renderBoxesTable();
    showToast('Box guardado correctamente', 'success');
}

export function renderBoxesTable() {
    const tbModal = document.getElementById('boxTableBody');
    const tbDashboard = document.getElementById('boxTableBodyDashboard');

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

    const rows = state.boxes.map(b => {
        const daysStr = b.days.map(d => dayNames[d]).join(', ');
        
        // Contar citas de hoy en este box
        const today = new Date().toISOString().split('T')[0];
        const citasHoy = state.appointments.filter(a => 
            a.boxId == b.id && 
            a.date === today && 
            a.status === 'confirmada'
        ).length;
        
        return `
            <tr>
                <td><strong>${b.name}</strong><br><small style="color:#666;">${b.location || '—'}</small></td>
                <td>${b.startTime} - ${b.endTime}</td>
                <td>${daysStr}</td>
                <td>
                    <span class="badge" style="background:${b.active ? 'var(--verde-exito)' : 'var(--text-light)'}; color:white;">
                        ${b.active ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td style="text-align:center;">
                    <span class="badge" style="background:${citasHoy > 0 ? 'var(--azul-medico)' : '#e2e8f0'}; color:${citasHoy > 0 ? 'white' : '#666'};">
                        ${citasHoy} hoy
                    </span>
                </td>
                <td>
                    <button onclick="editBox(${b.id})" class="btn-icon" style="background:var(--azul-medico); color:white; padding:5px 8px;">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button onclick="toggleBoxStatus(${b.id})" class="btn-icon" style="background:var(--naranja-aviso); color:white; padding:5px 8px;">
                        <i class="fa ${b.active ? 'fa-ban' : 'fa-check'}"></i>
                    </button>
                    <button onclick="deleteBox(${b.id})" class="btn-icon" style="background:var(--rojo-alerta); color:white; padding:5px 8px;">
                        <i class="fa fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    if (tbModal) tbModal.innerHTML = rows;
    if (tbDashboard) tbDashboard.innerHTML = rows;
}

export function editBox(id) {
    const box = state.boxes.find(b => b.id == id);
    if (!box) return;

    document.getElementById('boxName').value = box.name;
    document.getElementById('boxLocation').value = box.location || '';
    document.getElementById('boxStartTime').value = box.startTime;
    document.getElementById('boxEndTime').value = box.endTime;
    document.getElementById('boxDescription').value = box.description || '';

    document.querySelectorAll('.box-day').forEach(cb => cb.checked = false);
    box.days.forEach(d => {
        const cb = document.querySelector(`.box-day[value="${d}"]`);
        if (cb) cb.checked = true;
    });

    document.getElementById('saveBoxBtn').onclick = () => updateBox(id);
    document.getElementById('boxModal').style.display = 'flex';
}

export function updateBox(id) {
    const box = state.boxes.find(b => b.id == id);
    if (!box) return;

    box.name = document.getElementById('boxName').value;
    box.location = document.getElementById('boxLocation').value;
    box.startTime = document.getElementById('boxStartTime').value;
    box.endTime = document.getElementById('boxEndTime').value;
    box.description = document.getElementById('boxDescription').value;
    box.days = Array.from(document.querySelectorAll('.box-day:checked')).map(cb => parseInt(cb.value));
    box.updatedAt = new Date().toISOString();

    import('../main.js').then(main => main.save());
    closeBoxModal();
    renderBoxesTable();
    showToast('Box actualizado', 'success');
}

export function toggleBoxStatus(id) {
    const box = state.boxes.find(b => b.id == id);
    if (box) {
        box.active = !box.active;
        box.updatedAt = new Date().toISOString();
        import('../main.js').then(main => main.save());
        renderBoxesTable();
        showToast(`Box ${box.active ? 'activado' : 'desactivado'}`, 'success');
    }
}

export function deleteBox(id) {
    if (confirm('¿Eliminar este box? Las citas asociadas quedarán sin box asignado.')) {
        // Verificar si hay citas futuras en este box
        const citasFuturas = state.appointments.filter(a => 
            a.boxId == id && 
            new Date(a.date) > new Date()
        );
        
        if (citasFuturas.length > 0) {
            if (!confirm(`Hay ${citasFuturas.length} citas futuras en este box. ¿Eliminar de todas formas?`)) {
                return;
            }
        }
        
        // Eliminar box
        state.setBoxes(state.boxes.filter(b => b.id != id));
        
        // Quitar boxId de citas existentes
        state.appointments.forEach(a => {
            if (a.boxId == id) a.boxId = null;
        });
        
        import('../main.js').then(main => main.save());
        renderBoxesTable();
        renderBoxOccupancy();
        showToast('Box eliminado', 'success');
    }
}

// ============================================
// FUNCIÓN EXPORTADA PARA OBTENER BOXES DISPONIBLES
// ============================================

export function getAvailableBoxes(date, time) {
    if (!date || !time) return [];

    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();

    return state.boxes.filter(box => {
        if (!box.active) return false;
        if (!box.days.includes(dayOfWeek)) return false;

        const [boxStartHour, boxStartMin] = box.startTime.split(':').map(Number);
        const [boxEndHour, boxEndMin] = box.endTime.split(':').map(Number);
        const [appHour, appMin] = time.split(':').map(Number);

        const boxStartMinutes = boxStartHour * 60 + boxStartMin;
        const boxEndMinutes = boxEndHour * 60 + boxEndMin;
        const appMinutes = appHour * 60 + appMin;

        if (appMinutes < boxStartMinutes || appMinutes >= boxEndMinutes) return false;

        const boxOccupied = state.appointments.some(a => 
            a.boxId == box.id && 
            a.date === date && 
            a.time === time &&
            a.status === 'confirmada'
        );

        return !boxOccupied;
    });
}

// ============================================
// NUEVAS FUNCIONES PARA ESTADÍSTICAS DE BOXES
// ============================================

/**
 * Obtiene estadísticas de uso de boxes
 * @returns {Object} Estadísticas de boxes
 */
export function getBoxesStats() {
    const totalBoxes = state.boxes.length;
    const boxesActivos = state.boxes.filter(b => b.active).length;
    
    // Uso por día de la semana
    const usoPorDia = {};
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    for (let i = 0; i < 7; i++) {
        usoPorDia[dayNames[i]] = {
            disponible: state.boxes.filter(b => b.days.includes(i)).length,
            usado: 0,
            citas: 0
        };
    }
    
    // Contar citas presenciales por día
    const ultimos30Dias = new Date();
    ultimos30Dias.setDate(ultimos30Dias.getDate() - 30);
    
    state.appointments
        .filter(a => a.type === 'presencial' && a.status === 'confirmada' && a.boxId)
        .forEach(a => {
            if (a.date) {
                const fecha = new Date(a.date);
                if (fecha >= ultimos30Dias) {
                    const dia = fecha.getDay();
                    usoPorDia[dayNames[dia]].usado++;
                    usoPorDia[dayNames[dia]].citas++;
                }
            }
        });
    
    // Box más usado
    const usoPorBox = {};
    state.appointments
        .filter(a => a.type === 'presencial' && a.status === 'confirmada' && a.boxId)
        .forEach(a => {
            usoPorBox[a.boxId] = (usoPorBox[a.boxId] || 0) + 1;
        });
    
    let boxMasUsado = null;
    let maxUsos = 0;
    
    Object.entries(usoPorBox).forEach(([boxId, usos]) => {
        if (usos > maxUsos) {
            maxUsos = usos;
            const box = state.boxes.find(b => b.id == boxId);
            if (box) boxMasUsado = box.name;
        }
    });
    
    // Ocupación actual (próximas 24h)
    const ahora = new Date();
    const manana = new Date(ahora);
    manana.setDate(manana.getDate() + 1);
    
    const citasProximas = state.appointments
        .filter(a => 
            a.type === 'presencial' && 
            a.status === 'confirmada' && 
            a.boxId &&
            new Date(a.date) >= ahora &&
            new Date(a.date) <= manana
        ).length;
    
    return {
        total: totalBoxes,
        activos: boxesActivos,
        inactivos: totalBoxes - boxesActivos,
        usoPorDia,
        boxMasUsado: boxMasUsado || 'Sin datos',
        usosBoxMasUsado: maxUsos,
        citasProximas24h: citasProximas,
        promedioDiario: state.appointments.filter(a => a.type === 'presencial').length > 0 
            ? (state.appointments.filter(a => a.type === 'presencial').length / 30).toFixed(1)
            : 0
    };
}

/**
 * Obtiene la ocupación actual de boxes
 * @returns {Array} Lista de boxes con su estado actual
 */
export function getBoxesCurrentStatus() {
    const ahora = new Date();
    const fechaHoy = ahora.toISOString().split('T')[0];
    const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;
    
    return state.boxes
        .filter(b => b.active)
        .map(box => {
            // Buscar cita en curso en este box
            const citaActual = state.appointments.find(a => 
                a.boxId == box.id &&
                a.date === fechaHoy &&
                a.status === 'confirmada' &&
                a.time <= horaActual &&
                horaActual <= sumarHora(a.time, 45) // Asume duración de 45 min
            );
            
            // Próxima cita
            const proximaCita = state.appointments
                .filter(a => 
                    a.boxId == box.id &&
                    a.date === fechaHoy &&
                    a.status === 'confirmada' &&
                    a.time > horaActual
                )
                .sort((a, b) => a.time.localeCompare(b.time))[0];
            
            return {
                id: box.id,
                nombre: box.name,
                ubicacion: box.location,
                estado: citaActual ? 'ocupado' : (proximaCita ? 'reservado' : 'disponible'),
                citaActual: citaActual ? {
                    paciente: citaActual.patient,
                    profesional: citaActual.psych,
                    hasta: sumarHora(citaActual.time, 45)
                } : null,
                proximaCita: proximaCita ? {
                    paciente: proximaCita.patient,
                    profesional: proximaCita.psych,
                    aLas: proximaCita.time
                } : null
            };
        });
}

/**
 * Suma minutos a una hora
 * @param {string} time - Hora en formato HH:MM
 * @param {number} minutes - Minutos a sumar
 * @returns {string} Hora resultante
 */
function sumarHora(time, minutes) {
    const [hour, min] = time.split(':').map(Number);
    const totalMin = hour * 60 + min + minutes;
    const newHour = Math.floor(totalMin / 60);
    const newMin = totalMin % 60;
    return `${newHour.toString().padStart(2, '0')}:${newMin.toString().padStart(2, '0')}`;
}

/**
 * Obtiene el historial de uso de un box específico
 * @param {number} boxId - ID del box
 * @param {number} dias - Días hacia atrás
 * @returns {Array} Historial de uso
 */
export function getBoxHistory(boxId, dias = 30) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);
    
    return state.appointments
        .filter(a => 
            a.boxId == boxId &&
            a.type === 'presencial' &&
            a.status === 'confirmada' &&
            new Date(a.date) >= fechaLimite
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(a => ({
            fecha: a.date,
            hora: a.time,
            paciente: a.patient,
            profesional: a.psych,
            pago: a.paymentStatus
        }));
}

/**
 * Valida si un box está disponible para una fecha y hora
 * @param {number} boxId - ID del box
 * @param {string} date - Fecha
 * @param {string} time - Hora
 * @returns {Object} Resultado de la validación
 */
export function validateBoxAvailability(boxId, date, time) {
    const box = state.boxes.find(b => b.id == boxId);
    
    if (!box) {
        return { disponible: false, razon: 'Box no encontrado' };
    }
    
    if (!box.active) {
        return { disponible: false, razon: 'Box inactivo' };
    }
    
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    
    if (!box.days.includes(dayOfWeek)) {
        const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        return { 
            disponible: false, 
            razon: `Box no opera los ${dayNames[dayOfWeek]}s` 
        };
    }
    
    const [boxStartHour, boxStartMin] = box.startTime.split(':').map(Number);
    const [boxEndHour, boxEndMin] = box.endTime.split(':').map(Number);
    const [appHour, appMin] = time.split(':').map(Number);
    
    const appTime = appHour * 60 + appMin;
    const boxStart = boxStartHour * 60 + boxStartMin;
    const boxEnd = boxEndHour * 60 + boxEndMin;
    
    if (appTime < boxStart || appTime >= boxEnd) {
        return { 
            disponible: false, 
            razon: `Box opera de ${box.startTime} a ${box.endTime}` 
        };
    }
    
    const ocupado = state.appointments.some(a => 
        a.boxId == boxId && 
        a.date === date && 
        a.time === time &&
        a.status === 'confirmada'
    );
    
    if (ocupado) {
        return { disponible: false, razon: 'Horario ya reservado' };
    }
    
    return { disponible: true, razon: 'Disponible' };
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

console.log('✅ boxes.js cargado con estadísticas y validaciones');