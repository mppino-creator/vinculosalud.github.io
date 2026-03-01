// js/modules/fichasClinicas.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { puedeEditarFichas } from './permisos.js';
import { showToast } from './utils.js';

// ============================================
// FICHA DE INGRESO
// ============================================

export async function guardarFichaIngreso(patientId, data) {
  if (!puedeEditarFichas(patientId)) {
    showToast('No tienes permisos para editar esta ficha', 'error');
    throw new Error('No tienes permisos para editar esta ficha');
  }
  
  const patient = state.patients.find(p => p.id == patientId);
  if (!patient) {
    showToast('Paciente no encontrado', 'error');
    throw new Error('Paciente no encontrado');
  }
  
  const ficha = {
    patientId,
    patientName: patient.name,
    patientRut: patient.rut,
    ...data,
    realizadoPor: state.currentUser?.data?.id || null,
    realizadoPorNombre: state.currentUser?.data?.name || 'Desconocido',
    fechaCreacion: data.id ? undefined : new Date().toISOString(),
    fechaModificacion: new Date().toISOString()
  };
  
  try {
    // Usar Realtime Database (ref, no collection)
    if (data.id) {
      // Actualizar existente
      await db.ref(`fichasIngreso/${data.id}`).update(ficha);
      
      // Actualizar en state
      const index = state.fichasIngreso.findIndex(f => f.id === data.id);
      if (index !== -1) state.fichasIngreso[index] = { ...ficha, id: data.id };
      
      showToast('Ficha de ingreso actualizada', 'success');
    } else {
      // Crear nueva
      const newRef = db.ref('fichasIngreso').push();
      await newRef.set(ficha);
      state.fichasIngreso.push({ ...ficha, id: newRef.key });
      
      showToast('Ficha de ingreso guardada', 'success');
    }
    
    return { success: true, id: data.id || newRef?.key };
  } catch (error) {
    console.error('Error guardando ficha ingreso:', error);
    showToast('Error al guardar la ficha', 'error');
    throw error;
  }
}

// ============================================
// NOTAS DE SESIÓN
// ============================================

export async function guardarNotaSesion(patientId, data) {
  if (!puedeEditarFichas(patientId)) {
    showToast('No tienes permisos', 'error');
    throw new Error('No tienes permisos');
  }
  
  const patient = state.patients.find(p => p.id == patientId);
  
  const sesion = {
    patientId,
    patientName: patient?.name || 'Desconocido',
    ...data,
    realizadoPor: state.currentUser?.data?.id || null,
    realizadoPorNombre: state.currentUser?.data?.name || 'Desconocido',
    fechaGuardado: new Date().toISOString()
  };
  
  try {
    if (data.id) {
      await db.ref(`sesiones/${data.id}`).update(sesion);
      const index = state.sesiones.findIndex(s => s.id === data.id);
      if (index !== -1) state.sesiones[index] = { ...sesion, id: data.id };
      showToast('Nota de sesión actualizada', 'success');
    } else {
      const newRef = db.ref('sesiones').push();
      await newRef.set(sesion);
      state.sesiones.push({ ...sesion, id: newRef.key });
      showToast('Nota de sesión guardada', 'success');
    }
    return { success: true };
  } catch (error) {
    console.error('Error guardando sesión:', error);
    showToast('Error al guardar la sesión', 'error');
    throw error;
  }
}

// ============================================
// FUNCIONES PARA OBTENER DATOS
// ============================================

export async function obtenerFichasIngresoDePaciente(patientId) {
    console.log(`📋 Obteniendo fichas de ingreso para paciente: ${patientId}`);
    
    try {
        if (state.fichasIngreso && state.fichasIngreso.length > 0) {
            const fichas = state.fichasIngreso.filter(f => f.patientId == patientId);
            console.log(`✅ Encontradas ${fichas.length} fichas en memoria`);
            return fichas;
        }
        return [];
    } catch (error) {
        console.error('❌ Error obteniendo fichas de ingreso:', error);
        return [];
    }
}

export async function obtenerSesionesDePaciente(patientId) {
  try {
    if (state.sesiones && state.sesiones.length > 0) {
      return state.sesiones
        .filter(s => s.patientId == patientId)
        .sort((a, b) => new Date(b.fechaAtencion) - new Date(a.fechaAtencion));
    }
    return [];
  } catch (error) {
    console.error('Error obteniendo sesiones:', error);
    return [];
  }
}

// ============================================
// CARGAR DATOS INICIALES
// ============================================

export async function cargarTodasLasFichas() {
  try {
    console.log('📂 Cargando todas las fichas clínicas...');
    
    // Cargar fichas de ingreso usando Realtime Database
    const fichasSnapshot = await db.ref('fichasIngreso').once('value');
    const fichasData = fichasSnapshot.val();
    if (fichasData) {
      state.fichasIngreso = Object.keys(fichasData).map(key => ({ id: key, ...fichasData[key] }));
    }
    
    // Cargar sesiones
    const sesionesSnapshot = await db.ref('sesiones').once('value');
    const sesionesData = sesionesSnapshot.val();
    if (sesionesData) {
      state.sesiones = Object.keys(sesionesData).map(key => ({ id: key, ...sesionesData[key] }));
    }
    
    console.log('✅ Fichas clínicas cargadas:', {
      fichasIngreso: state.fichasIngreso.length,
      sesiones: state.sesiones.length
    });
  } catch (error) {
    console.error('Error cargando fichas:', error);
  }
}

// ============================================
// NUEVA FUNCIÓN: Mostrar formulario para crear ficha de ingreso
// ============================================

/**
 * Muestra un modal con el formulario para crear una ficha de ingreso.
 * @param {string} patientId - ID del paciente.
 */
export function mostrarFormularioFichaIngreso(patientId) {
    // Verificar permisos
    if (!puedeEditarFichas(patientId)) {
        showToast('No tienes permisos para crear una ficha', 'error');
        return;
    }

    const patient = state.patients.find(p => p.id == patientId);
    if (!patient) {
        showToast('Paciente no encontrado', 'error');
        return;
    }

    // Crear el modal si no existe
    let modal = document.getElementById('modalFichaIngreso');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalFichaIngreso';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <button class="modal-close" onclick="document.getElementById('modalFichaIngreso').style.display='none'">&times;</button>
                <h2>Crear Ficha de Ingreso</h2>
                <form id="formFichaIngreso">
                    <input type="hidden" id="fichaPatientId" value="${patientId}">
                    
                    <div class="form-group">
                        <label>Motivo de Consulta *</label>
                        <textarea id="motivoConsulta" rows="3" required></textarea>
                    </div>
                    
                    <h4 style="margin:15px 0 5px;">Sintomatología</h4>
                    <div class="form-group">
                        <label>Fecha de Inicio</label>
                        <input type="date" id="fechaInicio">
                    </div>
                    <div class="form-group">
                        <label>Progresión</label>
                        <textarea id="progresion" rows="2" placeholder="¿Cómo ha evolucionado?"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Tratamientos Previos</label>
                        <textarea id="tratamientosPrevios" rows="2" placeholder="¿Ha recibido tratamiento antes?"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Medicamentos</label>
                        <textarea id="medicamentos" rows="2" placeholder="¿Toma algún medicamento?"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Composición Familiar</label>
                        <textarea id="composicionFamiliar" rows="3" placeholder="Describe la composición de su familia"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Otros Antecedentes</label>
                        <textarea id="otrosAntecedentes" rows="3" placeholder="Otros antecedentes relevantes"></textarea>
                    </div>
                    
                    <div style="display:flex; gap:15px; margin-top:20px;">
                        <button type="button" class="btn-staff" onclick="window.fichasClinicas.guardarFichaIngresoDesdeFormulario()" style="background:var(--verde-exito); flex:1;">
                            Guardar Ficha
                        </button>
                        <button type="button" class="btn-staff" onclick="document.getElementById('modalFichaIngreso').style.display='none'" style="background:var(--text-light); flex:0.5;">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        // Si ya existe, solo actualizar el patientId y limpiar campos
        document.getElementById('fichaPatientId').value = patientId;
        document.getElementById('motivoConsulta').value = '';
        document.getElementById('fechaInicio').value = '';
        document.getElementById('progresion').value = '';
        document.getElementById('tratamientosPrevios').value = '';
        document.getElementById('medicamentos').value = '';
        document.getElementById('composicionFamiliar').value = '';
        document.getElementById('otrosAntecedentes').value = '';
    }

    modal.style.display = 'flex';
}

/**
 * Guarda la ficha de ingreso desde el formulario modal.
 */
export async function guardarFichaIngresoDesdeFormulario() {
    const patientId = document.getElementById('fichaPatientId')?.value;
    if (!patientId) {
        showToast('Error: ID de paciente no encontrado', 'error');
        return;
    }

    const motivoConsulta = document.getElementById('motivoConsulta')?.value;
    if (!motivoConsulta) {
        showToast('El motivo de consulta es obligatorio', 'error');
        return;
    }

    const data = {
        motivoConsulta: motivoConsulta,
        sintomatologia: {
            fechaInicio: document.getElementById('fechaInicio')?.value || '',
            progresion: document.getElementById('progresion')?.value || '',
            tratamientosPrevios: document.getElementById('tratamientosPrevios')?.value || '',
            medicamentos: document.getElementById('medicamentos')?.value || ''
        },
        composicionFamiliar: document.getElementById('composicionFamiliar')?.value || '',
        otrosAntecedentes: document.getElementById('otrosAntecedentes')?.value || ''
    };

    try {
        await guardarFichaIngreso(patientId, data);
        // Cerrar el modal
        const modal = document.getElementById('modalFichaIngreso');
        if (modal) modal.style.display = 'none';
        
        // Recargar la vista del paciente para mostrar la nueva ficha
        if (window.mostrarDetallePaciente) {
            window.mostrarDetallePaciente(patientId);
        }
    } catch (error) {
        console.error('Error al guardar desde formulario:', error);
        // El toast ya se muestra en guardarFichaIngreso
    }
}

// ============================================
// FUNCIONES AUXILIARES (para compatibilidad)
// ============================================

export function editarFichaIngreso(fichaIngresoId) {
    // Por implementar - similar a mostrarFormulario pero con datos precargados
    showToast('Función de edición en desarrollo', 'info');
}

export function verNotaSesion(sesionId) {
    // Por implementar - mostrar detalle de la sesión
    showToast('Función de visualización en desarrollo', 'info');
}

export function mostrarFormularioNotaSesion(patientId) {
    // Por implementar - formulario para nueva nota
    showToast('Función de nueva sesión en desarrollo', 'info');
}

// ============================================
// EXPORTAR FUNCIONES AL OBJETO WINDOW
// ============================================
if (typeof window !== 'undefined') {
  window.fichasClinicas = {
    guardarFichaIngreso,
    guardarNotaSesion,
    obtenerSesionesDePaciente,
    obtenerFichasIngresoDePaciente,
    cargarTodasLasFichas,
    // Nuevas funciones
    mostrarFormularioFichaIngreso,
    guardarFichaIngresoDesdeFormulario,
    editarFichaIngreso,
    verNotaSesion,
    mostrarFormularioNotaSesion
  };
}

console.log('✅ fichasClinicas.js cargado correctamente con formulario de creación');