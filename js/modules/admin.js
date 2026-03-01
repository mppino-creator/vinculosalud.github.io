// js/modules/admin.js
import * as state from './state.js';
import { showToast } from './utils.js';

// ============================================
// FUNCIONES DE REINICIO PARA ADMIN
// ============================================

// Eliminar todos los pacientes
window.eliminarTodosLosPacientes = function() {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    
    if (confirm('⚠️ ¿Estás SEGURO de eliminar TODOS los pacientes? Esta acción no se puede deshacer.')) {
        const pacientesAEliminar = state.patients.filter(p => !p.isHiddenAdmin);
        
        if (pacientesAEliminar.length === 0) {
            showToast('No hay pacientes para eliminar', 'info');
            return;
        }
        
        state.setPatients(state.patients.filter(p => p.isHiddenAdmin));
        import('../main.js').then(main => main.save());
        showToast(`✅ ${pacientesAEliminar.length} pacientes eliminados`, 'success');
        actualizarContadoresReinicio();
    }
};

// Eliminar solo pacientes de prueba (los que tienen correo @ejemplo.com o nombres de prueba)
window.eliminarPacientesPrueba = function() {
    if (!state.currentUser || state.currentUser.role !== 'admin') return;
    
    if (confirm('¿Eliminar pacientes de prueba?')) {
        const pacientesPrueba = state.patients.filter(p => 
            p.email?.includes('test') || 
            p.email?.includes('prueba') || 
            p.name?.includes('Test') || 
            p.name?.includes('Prueba') ||
            p.rut === '11111111-1'
        );
        
        state.setPatients(state.patients.filter(p => !pacientesPrueba.includes(p)));
        import('../main.js').then(main => main.save());
        showToast(`✅ ${pacientesPrueba.length} pacientes de prueba eliminados`, 'success');
        actualizarContadoresReinicio();
    }
};

// Eliminar todos los mensajes
window.eliminarTodosLosMensajes = function() {
    if (!state.currentUser || state.currentUser.role !== 'admin') return;
    
    if (confirm('⚠️ ¿Eliminar TODOS los mensajes?')) {
        const mensajesAEliminar = state.messages.length;
        state.setMessages([]);
        import('../main.js').then(main => main.save());
        showToast(`✅ ${mensajesAEliminar} mensajes eliminados`, 'success');
        actualizarContadoresReinicio();
    }
};

// Restaurar mensajes iniciales (los 3 de ejemplo)
window.restaurarMensajesIniciales = function() {
    if (!state.currentUser || state.currentUser.role !== 'admin') return;
    
    const mensajesIniciales = [
        { id: Date.now() + 1, name: 'Carolina Méndez', rating: 5, text: 'Excelente profesional, me ayudó mucho con mi ansiedad. Muy recomendada.', date: new Date().toISOString().split('T')[0] },
        { id: Date.now() + 2, name: 'Roberto Campos', rating: 5, text: 'Muy buena página, encontré al especialista que necesitaba rápidamente.', date: new Date().toISOString().split('T')[0] },
        { id: Date.now() + 3, name: 'María José', rating: 4, text: 'Muy profesional, aunque los tiempos de espera a veces son largos.', date: new Date().toISOString().split('T')[0] }
    ];
    
    state.setMessages(mensajesIniciales);
    import('../main.js').then(main => main.save());
    showToast('✅ Mensajes iniciales restaurados', 'success');
    actualizarContadoresReinicio();
};

// Eliminar todas las citas
window.eliminarTodasLasCitas = function() {
    if (!state.currentUser || state.currentUser.role !== 'admin') return;
    
    if (confirm('⚠️ ¿Eliminar TODAS las citas?')) {
        const citasAEliminar = state.appointments.length;
        state.setAppointments([]);
        state.setPendingRequests([]);
        import('../main.js').then(main => main.save());
        showToast(`✅ ${citasAEliminar} citas eliminadas`, 'success');
        actualizarContadoresReinicio();
    }
};

// Eliminar citas de prueba
window.eliminarCitasPrueba = function() {
    if (!state.currentUser || state.currentUser.role !== 'admin') return;
    
    if (confirm('¿Eliminar citas de prueba?')) {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 30);
        
        const citasPrueba = state.appointments.filter(a => {
            const fechaCita = new Date(a.date);
            return fechaCita < fechaLimite || a.patient?.includes('Test') || a.patient?.includes('Prueba');
        });
        
        state.setAppointments(state.appointments.filter(a => !citasPrueba.includes(a)));
        import('../main.js').then(main => main.save());
        showToast(`✅ ${citasPrueba.length} citas de prueba eliminadas`, 'success');
        actualizarContadoresReinicio();
    }
};

// Reinicio completo del sistema
window.reinicioCompleto = function() {
    if (!state.currentUser || state.currentUser.role !== 'admin') return;
    
    if (confirm('🔥 ¿REINICIO COMPLETO? Esto eliminará TODOS los pacientes, mensajes, citas y solicitudes. Los profesionales se mantienen. ¿Continuar?')) {
        if (confirm('ÚLTIMA CONFIRMACIÓN: ¿Estás ABSOLUTAMENTE SEGURO?')) {
            state.setPatients([]);
            state.setMessages([]);
            state.setAppointments([]);
            state.setPendingRequests([]);
            
            import('../main.js').then(main => main.save());
            showToast('✅ Sistema reiniciado completamente', 'success');
            actualizarContadoresReinicio();
        }
    }
};

// Actualizar contadores en la interfaz
export function actualizarContadoresReinicio() {
    const totalPacientes = document.getElementById('totalPacientes');
    const totalMensajes = document.getElementById('totalMensajes');
    const totalCitas = document.getElementById('totalCitas');
    
    if (totalPacientes) totalPacientes.innerText = state.patients.filter(p => !p.isHiddenAdmin).length;
    if (totalMensajes) totalMensajes.innerText = state.messages.length;
    if (totalCitas) totalCitas.innerText = state.appointments.length;
}