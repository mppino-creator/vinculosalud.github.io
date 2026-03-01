// js/modules/admin.js
import * as state from './state.js';
import { showToast } from './utils.js';

// ============================================
// FUNCIONES DE REINICIO PARA ADMIN
// ============================================

// Actualizar contadores en la interfaz (DEFINIDA UNA SOLA VEZ)
export function actualizarContadoresReinicio() {
    const totalPacientes = document.getElementById('totalPacientes');
    const totalMensajes = document.getElementById('totalMensajes');
    const totalCitas = document.getElementById('totalCitas');
    const totalFichas = document.getElementById('totalFichas');
    const totalSesiones = document.getElementById('totalSesiones');
    const totalInformes = document.getElementById('totalInformes');
    
    if (totalPacientes) totalPacientes.innerText = state.patients.filter(p => !p.isHiddenAdmin).length;
    if (totalMensajes) totalMensajes.innerText = state.messages.length;
    if (totalCitas) totalCitas.innerText = state.appointments.length;
    
    // ============================================
    // NUEVO: Contadores de fichas clínicas
    // ============================================
    if (totalFichas) totalFichas.innerText = state.fichasIngreso.length;
    if (totalSesiones) totalSesiones.innerText = state.sesiones.length;
    if (totalInformes) totalInformes.innerText = state.informes.length;
}

// ============================================
// FUNCIONES DE ESTADÍSTICAS GLOBALES
// ============================================

/**
 * Obtiene estadísticas globales del sistema
 * @returns {Object} Estadísticas completas
 */
export function getEstadisticasGlobales() {
    // Pacientes
    const totalPacientes = state.patients.filter(p => !p.isHiddenAdmin).length;
    const pacientesConFicha = state.fichasIngreso.length;
    const pacientesSinFicha = totalPacientes - pacientesConFicha;
    
    // Sesiones
    const totalSesiones = state.sesiones.length;
    const sesionesPorMes = {};
    state.sesiones.forEach(s => {
        if (s.fechaAtencion) {
            const mes = s.fechaAtencion.substring(0, 7); // YYYY-MM
            sesionesPorMes[mes] = (sesionesPorMes[mes] || 0) + 1;
        }
    });
    
    // Informes
    const totalInformes = state.informes.length;
    const informesPorTipo = {
        psicodiagnostico: state.informes.filter(i => i.tipo === 'psicodiagnostico').length,
        cierre: state.informes.filter(i => i.tipo === 'cierre').length
    };
    
    // Citas y financiero
    const totalCitas = state.appointments.length;
    const ingresosTotales = state.appointments
        .filter(a => a.paymentStatus === 'pagado')
        .reduce((sum, a) => sum + (a.price || 0), 0);
    
    const ingresosPorMes = {};
    state.appointments
        .filter(a => a.paymentStatus === 'pagado')
        .forEach(a => {
            if (a.date) {
                const mes = a.date.substring(0, 7);
                ingresosPorMes[mes] = (ingresosPorMes[mes] || 0) + (a.price || 0);
            }
        });
    
    // Profesionales activos
    const profesionalesActivos = new Set();
    state.appointments.forEach(a => profesionalesActivos.add(a.psychId));
    state.sesiones.forEach(s => {
        const patient = state.patients.find(p => p.id == s.patientId);
        if (patient) profesionalesActivos.add(patient.psychId);
    });
    
    return {
        pacientes: {
            total: totalPacientes,
            conFicha: pacientesConFicha,
            sinFicha: pacientesSinFicha,
            porcentajeConFicha: totalPacientes > 0 ? ((pacientesConFicha / totalPacientes) * 100).toFixed(1) : 0
        },
        fichasClinicas: {
            fichasIngreso: state.fichasIngreso.length,
            sesiones: totalSesiones,
            informes: totalInformes,
            informesPorTipo
        },
        citas: {
            total: totalCitas,
            pendientes: state.appointments.filter(a => a.paymentStatus === 'pendiente').length,
            pagadas: state.appointments.filter(a => a.paymentStatus === 'pagado').length,
            rechazadas: state.appointments.filter(a => a.paymentStatus === 'rechazado').length
        },
        financiero: {
            ingresosTotales,
            ingresosPorMes,
            promedioPorCita: totalCitas > 0 ? (ingresosTotales / totalCitas).toFixed(0) : 0
        },
        profesionales: {
            total: state.staff.filter(s => !s.isHiddenAdmin).length,
            activos: profesionalesActivos.size
        }
    };
}

// ============================================
// FUNCIONES DE GESTIÓN DE FICHAS CLÍNICAS
// ============================================

/**
 * Eliminar todas las fichas de ingreso
 */
export function eliminarTodasLasFichasIngreso() {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    
    if (confirm('⚠️ ¿Eliminar TODAS las fichas de ingreso? Esta acción no se puede deshacer.')) {
        const cantidad = state.fichasIngreso.length;
        state.setFichasIngreso([]);
        import('../main.js').then(main => main.save());
        showToast(`✅ ${cantidad} fichas de ingreso eliminadas`, 'success');
        actualizarContadoresReinicio();
    }
}

/**
 * Eliminar todas las sesiones
 */
export function eliminarTodasLasSesiones() {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    
    if (confirm('⚠️ ¿Eliminar TODAS las sesiones/notas de evolución? Esta acción no se puede deshacer.')) {
        const cantidad = state.sesiones.length;
        state.setSesiones([]);
        import('../main.js').then(main => main.save());
        showToast(`✅ ${cantidad} sesiones eliminadas`, 'success');
        actualizarContadoresReinicio();
    }
}

/**
 * Eliminar todos los informes
 */
export function eliminarTodosLosInformes() {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    
    if (confirm('⚠️ ¿Eliminar TODOS los informes? Esta acción no se puede deshacer.')) {
        const cantidad = state.informes.length;
        state.setInformes([]);
        import('../main.js').then(main => main.save());
        showToast(`✅ ${cantidad} informes eliminados`, 'success');
        actualizarContadoresReinicio();
    }
}

/**
 * Eliminar todas las fichas clínicas de un paciente específico
 * @param {string|number} patientId - ID del paciente
 */
export function eliminarFichasDePaciente(patientId) {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    
    const patient = state.patients.find(p => p.id == patientId);
    if (!patient) return;
    
    if (confirm(`⚠️ ¿Eliminar TODAS las fichas clínicas de ${patient.name}?`)) {
        // Eliminar fichas de ingreso
        state.setFichasIngreso(state.fichasIngreso.filter(f => f.patientId != patientId));
        
        // Eliminar sesiones
        state.setSesiones(state.sesiones.filter(s => s.patientId != patientId));
        
        // Eliminar informes
        state.setInformes(state.informes.filter(i => i.patientId != patientId));
        
        import('../main.js').then(main => main.save());
        showToast(`✅ Fichas de ${patient.name} eliminadas`, 'success');
        actualizarContadoresReinicio();
    }
}

// ============================================
// FUNCIONES DE RESPALDO Y RESTAURACIÓN
// ============================================

/**
 * Exportar todas las fichas clínicas a JSON
 */
export function exportarTodasLasFichas() {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    
    const backup = {
        fecha: new Date().toISOString(),
        version: '2.0',
        estadisticas: getEstadisticasGlobales(),
        datos: {
            pacientes: state.patients,
            fichasIngreso: state.fichasIngreso,
            sesiones: state.sesiones,
            informes: state.informes,
            citas: state.appointments,
            mensajes: state.messages,
            profesionales: state.staff
        }
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vinculo_salud_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('✅ Backup exportado correctamente', 'success');
}

/**
 * Importar fichas clínicas desde JSON
 */
export function importarFichas() {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(ev) {
            try {
                const backup = JSON.parse(ev.target.result);
                
                if (confirm(`¿Importar ${backup.datos?.fichasIngreso?.length || 0} fichas de ingreso, ${backup.datos?.sesiones?.length || 0} sesiones y ${backup.datos?.informes?.length || 0} informes? Los datos actuales se mantendrán.`)) {
                    
                    if (backup.datos?.fichasIngreso) {
                        state.setFichasIngreso([...state.fichasIngreso, ...backup.datos.fichasIngreso]);
                    }
                    if (backup.datos?.sesiones) {
                        state.setSesiones([...state.sesiones, ...backup.datos.sesiones]);
                    }
                    if (backup.datos?.informes) {
                        state.setInformes([...state.informes, ...backup.datos.informes]);
                    }
                    
                    import('../main.js').then(main => main.save());
                    showToast('✅ Datos importados correctamente', 'success');
                    actualizarContadoresReinicio();
                }
            } catch (error) {
                console.error('Error importando:', error);
                showToast('❌ Error al importar el archivo', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ============================================
// FUNCIONES DE LIMPIEZA SELECTIVA
// ============================================

/**
 * Limpiar fichas huérfanas (sin paciente asociado)
 */
export function limpiarFichasHuerfanas() {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    
    const patientIds = new Set(state.patients.map(p => p.id));
    
    const fichasHuerfanas = state.fichasIngreso.filter(f => !patientIds.has(f.patientId));
    const sesionesHuerfanas = state.sesiones.filter(s => !patientIds.has(s.patientId));
    const informesHuerfanos = state.informes.filter(i => !patientIds.has(i.patientId));
    
    if (fichasHuerfanas.length === 0 && sesionesHuerfanas.length === 0 && informesHuerfanos.length === 0) {
        showToast('No hay fichas huérfanas', 'info');
        return;
    }
    
    if (confirm(`¿Eliminar ${fichasHuerfanas.length} fichas, ${sesionesHuerfanas.length} sesiones y ${informesHuerfanos.length} informes huérfanos?`)) {
        state.setFichasIngreso(state.fichasIngreso.filter(f => patientIds.has(f.patientId)));
        state.setSesiones(state.sesiones.filter(s => patientIds.has(s.patientId)));
        state.setInformes(state.informes.filter(i => patientIds.has(i.patientId)));
        
        import('../main.js').then(main => main.save());
        showToast('✅ Fichas huérfanas eliminadas', 'success');
        actualizarContadoresReinicio();
    }
}

// ============================================
// FUNCIONES DE REINICIO EXISTENTES (MEJORADAS)
// ============================================

// Eliminar todos los pacientes (ahora también elimina sus fichas)
window.eliminarTodosLosPacientes = function() {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    
    if (confirm('⚠️ ¿Estás SEGURO de eliminar TODOS los pacientes? Esto también eliminará TODAS sus fichas clínicas. Esta acción no se puede deshacer.')) {
        const pacientesAEliminar = state.patients.filter(p => !p.isHiddenAdmin);
        
        if (pacientesAEliminar.length === 0) {
            showToast('No hay pacientes para eliminar', 'info');
            return;
        }
        
        // Obtener IDs de pacientes a eliminar
        const patientIds = new Set(pacientesAEliminar.map(p => p.id));
        
        // Eliminar pacientes
        state.setPatients(state.patients.filter(p => p.isHiddenAdmin));
        
        // Eliminar sus fichas clínicas
        state.setFichasIngreso(state.fichasIngreso.filter(f => !patientIds.has(f.patientId)));
        state.setSesiones(state.sesiones.filter(s => !patientIds.has(s.patientId)));
        state.setInformes(state.informes.filter(i => !patientIds.has(i.patientId)));
        
        import('../main.js').then(main => main.save());
        showToast(`✅ ${pacientesAEliminar.length} pacientes y sus fichas eliminados`, 'success');
        actualizarContadoresReinicio();
    }
};

// Reinicio completo del sistema (ahora incluye fichas clínicas)
window.reinicioCompleto = function() {
    if (!state.currentUser || state.currentUser.role !== 'admin') return;
    
    if (confirm('🔥 ¿REINICIO COMPLETO? Esto eliminará TODOS los pacientes, mensajes, citas, solicitudes Y FICHAS CLÍNICAS. Los profesionales se mantienen. ¿Continuar?')) {
        if (confirm('ÚLTIMA CONFIRMACIÓN: ¿Estás ABSOLUTAMENTE SEGURO?')) {
            state.setPatients([]);
            state.setMessages([]);
            state.setAppointments([]);
            state.setPendingRequests([]);
            
            // ============================================
            // NUEVO: Limpiar fichas clínicas
            // ============================================
            state.setFichasIngreso([]);
            state.setSesiones([]);
            state.setInformes([]);
            
            import('../main.js').then(main => main.save());
            showToast('✅ Sistema reiniciado completamente (incluyendo fichas clínicas)', 'success');
            actualizarContadoresReinicio();
        }
    }
};

// ============================================
// FUNCIONES DE PANEL DE ADMINISTRACIÓN
// ============================================

/**
 * Renderizar panel de administración con estadísticas de fichas
 */
export function renderAdminPanel() {
    const container = document.getElementById('adminPanelStats');
    if (!container) return;
    
    const stats = getEstadisticasGlobales();
    
    container.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:20px; margin-bottom:30px;">
            <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <div style="font-size:36px; font-weight:bold; color:white;">${stats.pacientes.total}</div>
                <div style="color:rgba(255,255,255,0.9);">Pacientes</div>
                <div style="font-size:14px; color:rgba(255,255,255,0.7);">${stats.pacientes.conFicha} con ficha</div>
            </div>
            
            <div class="stat-card" style="background: linear-gradient(135deg, #f6b023 0%, #f98d39 100%);">
                <div style="font-size:36px; font-weight:bold; color:white;">${stats.fichasClinicas.fichasIngreso}</div>
                <div style="color:rgba(255,255,255,0.9);">Fichas de Ingreso</div>
            </div>
            
            <div class="stat-card" style="background: linear-gradient(135deg, #34c759 0%, #30b0c0 100%);">
                <div style="font-size:36px; font-weight:bold; color:white;">${stats.fichasClinicas.sesiones}</div>
                <div style="color:rgba(255,255,255,0.9);">Sesiones Registradas</div>
            </div>
            
            <div class="stat-card" style="background: linear-gradient(135deg, #ff3b30 0%, #ff6b6b 100%);">
                <div style="font-size:36px; font-weight:bold; color:white;">${stats.fichasClinicas.informes}</div>
                <div style="color:rgba(255,255,255,0.9);">Informes</div>
            </div>
        </div>
        
        <div style="background:white; border-radius:12px; padding:20px; margin-bottom:20px;">
            <h3 style="margin:0 0 15px 0;">📊 Estadísticas Detalladas</h3>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                <div>
                    <h4>Pacientes</h4>
                    <p>• Con ficha de ingreso: ${stats.pacientes.conFicha} (${stats.pacientes.porcentajeConFicha}%)</p>
                    <p>• Sin ficha: ${stats.pacientes.sinFicha}</p>
                    
                    <h4 style="margin-top:20px;">Informes</h4>
                    <p>• Psicodiagnóstico: ${stats.fichasClinicas.informesPorTipo.psicodiagnostico}</p>
                    <p>• Cierre: ${stats.fichasClinicas.informesPorTipo.cierre}</p>
                </div>
                
                <div>
                    <h4>Citas</h4>
                    <p>• Pagadas: ${stats.citas.pagadas}</p>
                    <p>• Pendientes: ${stats.citas.pendientes}</p>
                    <p>• Rechazadas: ${stats.citas.rechazadas}</p>
                    
                    <h4 style="margin-top:20px;">Financiero</h4>
                    <p>• Ingresos totales: $${stats.financiero.ingresosTotales.toLocaleString()}</p>
                    <p>• Promedio por cita: $${stats.financiero.promedioPorCita.toLocaleString()}</p>
                </div>
            </div>
        </div>
        
        <div style="display:flex; gap:15px; flex-wrap:wrap;">
            <button class="btn-staff" onclick="exportarTodasLasFichas()" style="background:var(--azul-apple);">
                <i class="fa fa-download"></i> Exportar Todo
            </button>
            <button class="btn-staff" onclick="importarFichas()" style="background:var(--verde-exito);">
                <i class="fa fa-upload"></i> Importar
            </button>
            <button class="btn-staff" onclick="limpiarFichasHuerfanas()" style="background:var(--naranja-aviso);">
                <i class="fa fa-eraser"></i> Limpiar Huérfanas
            </button>
        </div>
        
        <div style="margin-top:30px; background:#fef5f5; border-radius:12px; padding:20px; border:1px solid #ffcdd2;">
            <h4 style="color:var(--rojo-alerta); margin:0 0 15px 0;">⚠️ Zona de Peligro</h4>
            <div style="display:flex; gap:15px; flex-wrap:wrap;">
                <button class="btn-staff" onclick="eliminarTodasLasFichasIngreso()" style="background:var(--rojo-alerta);">
                    <i class="fa fa-trash"></i> Eliminar Fichas Ingreso
                </button>
                <button class="btn-staff" onclick="eliminarTodasLasSesiones()" style="background:var(--rojo-alerta);">
                    <i class="fa fa-trash"></i> Eliminar Sesiones
                </button>
                <button class="btn-staff" onclick="eliminarTodosLosInformes()" style="background:var(--rojo-alerta);">
                    <i class="fa fa-trash"></i> Eliminar Informes
                </button>
            </div>
        </div>
    `;
}

// ============================================
// EXPORTAR FUNCIONES AL OBJETO WINDOW
// ============================================
if (typeof window !== 'undefined') {
    window.actualizarContadoresReinicio = actualizarContadoresReinicio;
    window.getEstadisticasGlobales = getEstadisticasGlobales;
    window.eliminarTodasLasFichasIngreso = eliminarTodasLasFichasIngreso;
    window.eliminarTodasLasSesiones = eliminarTodasLasSesiones;
    window.eliminarTodosLosInformes = eliminarTodosLosInformes;
    window.eliminarFichasDePaciente = eliminarFichasDePaciente;
    window.exportarTodasLasFichas = exportarTodasLasFichas;
    window.importarFichas = importarFichas;
    window.limpiarFichasHuerfanas = limpiarFichasHuerfanas;
    window.renderAdminPanel = renderAdminPanel;
}

console.log('✅ admin.js cargado con funciones de fichas clínicas');