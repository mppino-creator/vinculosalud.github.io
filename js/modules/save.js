// modules/save.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { guardarEspecialidades } from './personalizacion.js'; // si es necesario

export function save() {
    const updates = {};
    
    updates['/Staff'] = state.staff.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});
    updates['/Boxes'] = state.boxes.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});
    updates['/Patients'] = state.patients.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});
    updates['/Appointments'] = state.appointments.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});
    updates['/PendingRequests'] = state.pendingRequests.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});
    updates['/Messages'] = state.messages.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});
    
    db.ref().update(updates)
        .then(() => console.log('Datos guardados'))
        .catch(err => console.error('Error al guardar:', err));
    
    // Si guardarEspecialidades está en personalizacion, impórtala
    // guardarEspecialidades();
}