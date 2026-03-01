// js/modules/boxes.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast } from './utils.js';

export function renderBoxOccupancy() {
    const container = document.getElementById('boxOccupancy');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = state.appointments.filter(a => a.date === today && a.type === 'presencial' && a.status === 'confirmada');

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
            </div>
        `;
    }).join('');
}

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
        active: true
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
        return `
            <tr>
                <td><strong>${b.name}</strong></td>
                <td>${b.location || '—'}</td>
                <td>${b.startTime} - ${b.endTime}</td>
                <td>${daysStr}</td>
                <td><span class="badge" style="background:${b.active ? 'var(--verde-exito)' : 'var(--text-light)'}; color:white;">${b.active ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <button onclick="editBox(${b.id})" class="btn-icon" style="background:var(--azul-medico); color:white;">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button onclick="toggleBoxStatus(${b.id})" class="btn-icon" style="background:var(--naranja-aviso); color:white;">
                        <i class="fa ${b.active ? 'fa-ban' : 'fa-check'}"></i>
                    </button>
                    <button onclick="deleteBox(${b.id})" class="btn-icon" style="background:var(--rojo-alerta); color:white;">
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

    import('../main.js').then(main => main.save());
    closeBoxModal();
    renderBoxesTable();
    showToast('Box actualizado', 'success');
}

export function toggleBoxStatus(id) {
    const box = state.boxes.find(b => b.id == id);
    if (box) {
        box.active = !box.active;
        import('../main.js').then(main => main.save());
        renderBoxesTable();
        showToast(`Box ${box.active ? 'activado' : 'desactivado'}`, 'success');
    }
}

export function deleteBox(id) {
    if (confirm('¿Eliminar este box? Las citas asociadas quedarán sin box asignado.')) {
        state.setBoxes(state.boxes.filter(b => b.id != id));
        state.appointments.forEach(a => {
            if (a.boxId == id) a.boxId = null;
        });
        import('../main.js').then(main => main.save());
        renderBoxesTable();
        showToast('Box eliminado', 'success');
    }
}

// ✅ FUNCIÓN EXPORTADA - esta es la clave para solucionar el error
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