// js/modules/fichasClinicas.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { puedeEditarFichas } from './permisos.js';
import { showToast } from './utils.js';

// ============================================
// FICHA DE INGRESO
// ============================================

export async function guardarFichaIngreso(patientId, data) {
  console.log('💾 Guardando ficha de ingreso para paciente:', patientId);
  
  // Verificar permisos
  const tienePermiso = await puedeEditarFichas(patientId);
  if (!tienePermiso) {
    showToast('No tienes permisos para editar esta ficha', 'error');
    throw new Error('No tienes permisos para editar esta ficha');
  }
  
  const patient = state.patients.find(p => p.id == patientId);
  if (!patient) {
    showToast('Paciente no encontrado', 'error');
    throw new Error('Paciente no encontrado');
  }
  
  // Obtener información del usuario actual
  const userId = state.currentUser?.data?.id || state.currentUser?.id;
  const userName = state.currentUser?.data?.name || state.currentUser?.name || 'Desconocido';
  
  const ficha = {
    patientId,
    patientName: patient.name,
    patientRut: patient.rut,
    ...data,
    realizadoPor: userId,
    realizadoPorNombre: userName,
    fechaCreacion: data.id ? undefined : new Date().toISOString(),
    fechaModificacion: new Date().toISOString()
  };
  
  try {
    let fichaId;
    
    if (data.id) {
      // Actualizar existente
      fichaId = data.id;
      await db.ref(`fichasIngreso/${fichaId}`).update(ficha);
      
      // Actualizar en state
      const index = state.fichasIngreso.findIndex(f => f.id === fichaId);
      if (index !== -1) {
        state.fichasIngreso[index] = { ...ficha, id: fichaId };
      }
      
      showToast('Ficha de ingreso actualizada', 'success');
      console.log('✅ Ficha actualizada:', fichaId);
    } else {
      // Crear nueva
      const newRef = db.ref('fichasIngreso').push();
      fichaId = newRef.key;
      await newRef.set(ficha);
      
      // Agregar al state
      state.fichasIngreso.push({ ...ficha, id: fichaId });
      
      showToast('Ficha de ingreso guardada', 'success');
      console.log('✅ Ficha creada con ID:', fichaId);
    }
    
    return { success: true, id: fichaId };
  } catch (error) {
    console.error('❌ Error guardando ficha ingreso:', error);
    showToast('Error al guardar la ficha', 'error');
    throw error;
  }
}

// ============================================
// NOTAS DE SESIÓN
// ============================================

export async function guardarNotaSesion(patientId, data) {
  console.log('💾 Guardando nota de sesión para paciente:', patientId);
  
  const tienePermiso = await puedeEditarFichas(patientId);
  if (!tienePermiso) {
    showToast('No tienes permisos', 'error');
    throw new Error('No tienes permisos');
  }
  
  const patient = state.patients.find(p => p.id == patientId);
  const userId = state.currentUser?.data?.id || state.currentUser?.id;
  const userName = state.currentUser?.data?.name || state.currentUser?.name || 'Desconocido';
  
  const sesion = {
    patientId,
    patientName: patient?.name || 'Desconocido',
    ...data,
    realizadoPor: userId,
    realizadoPorNombre: userName,
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
    console.error('❌ Error guardando sesión:', error);
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
    
    // Cargar fichas de ingreso
    const fichasSnapshot = await db.ref('fichasIngreso').once('value');
    const fichasData = fichasSnapshot.val();
    if (fichasData) {
      state.fichasIngreso = Object.keys(fichasData).map(key => ({ id: key, ...fichasData[key] }));
      console.log(`✅ Cargadas ${state.fichasIngreso.length} fichas de ingreso`);
    }
    
    // Cargar sesiones
    const sesionesSnapshot = await db.ref('sesiones').once('value');
    const sesionesData = sesionesSnapshot.val();
    if (sesionesData) {
      state.sesiones = Object.keys(sesionesData).map(key => ({ id: key, ...sesionesData[key] }));
      console.log(`✅ Cargadas ${state.sesiones.length} sesiones`);
    }
    
    // Cargar informes (si existen)
    const informesSnapshot = await db.ref('informes').once('value');
    const informesData = informesSnapshot.val();
    if (informesData) {
      state.informes = Object.keys(informesData).map(key => ({ id: key, ...informesData[key] }));
      console.log(`✅ Cargados ${state.informes.length} informes`);
    }
    
    console.log('✅ Fichas clínicas cargadas completamente');
  } catch (error) {
    console.error('❌ Error cargando fichas:', error);
  }
}

// ============================================
// FUNCIÓN PARA MOSTRAR FORMULARIO DE FICHA DE INGRESO (CORREGIDA)
// ============================================

/**
 * Muestra un modal con el formulario para crear una ficha de ingreso.
 * @param {string} patientId - ID del paciente.
 */
export async function mostrarFormularioFichaIngreso(patientId) {
    console.log('📝 Mostrando formulario de ficha de ingreso para paciente:', patientId);
    
    // Verificar permisos (ahora con await)
    const tienePermiso = await puedeEditarFichas(patientId);
    if (!tienePermiso) {
        showToast('No tienes permisos para crear una ficha', 'error');
        return;
    }

    const patient = state.patients.find(p => p.id == patientId);
    if (!patient) {
        showToast('Paciente no encontrado', 'error');
        return;
    }

    // Verificar si ya existe una ficha para este paciente
    const fichasExistentes = await obtenerFichasIngresoDePaciente(patientId);
    if (fichasExistentes.length > 0) {
        if (!confirm('Este paciente ya tiene una ficha de ingreso. ¿Quieres editarla?')) {
            return;
        } else {
            // Cargar datos de la ficha existente para editar
            mostrarFormularioEdicionFichaIngreso(fichasExistentes[0]);
            return;
        }
    }

    // Crear o mostrar el modal
    let modal = document.getElementById('modalFichaIngreso');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalFichaIngreso';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <button class="modal-close" onclick="document.getElementById('modalFichaIngreso').style.display='none'">&times;</button>
                <h2>Crear Ficha de Ingreso</h2>
                <p style="color: var(--texto-secundario); margin-bottom: 20px;">
                    Paciente: <strong>${patient.name}</strong> (${patient.rut})
                </p>
                <form id="formFichaIngreso">
                    <input type="hidden" id="fichaPatientId" value="${patientId}">
                    <input type="hidden" id="fichaId" value="">
                    
                    <div class="form-group">
                        <label>Motivo de Consulta *</label>
                        <textarea id="motivoConsulta" rows="3" required placeholder="¿Cuál es el motivo principal de la consulta?"></textarea>
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
                        <button type="button" class="btn-staff" onclick="window.fichasClinicas.guardarFichaIngresoDesdeFormulario()" style="background:var(--exito); flex:1;">
                            <i class="fa fa-save"></i> Guardar Ficha
                        </button>
                        <button type="button" class="btn-staff" onclick="document.getElementById('modalFichaIngreso').style.display='none'" style="background:var(--texto-secundario); flex:0.5;">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        // Si ya existe, actualizar el título y limpiar campos
        const title = modal.querySelector('h2');
        if (title) title.textContent = 'Crear Ficha de Ingreso';
        
        document.getElementById('fichaPatientId').value = patientId;
        document.getElementById('fichaId').value = '';
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
 * Muestra el formulario para editar una ficha existente
 */
function mostrarFormularioEdicionFichaIngreso(ficha) {
    console.log('📝 Editando ficha:', ficha.id);
    
    let modal = document.getElementById('modalFichaIngreso');
    if (!modal) {
        mostrarFormularioFichaIngreso(ficha.patientId);
        // Esperar a que se cree el modal y luego llenar los datos
        setTimeout(() => llenarDatosFichaParaEdicion(ficha), 100);
    } else {
        llenarDatosFichaParaEdicion(ficha);
    }
}

function llenarDatosFichaParaEdicion(ficha) {
    const title = document.querySelector('#modalFichaIngreso h2');
    if (title) title.textContent = 'Editar Ficha de Ingreso';
    
    document.getElementById('fichaId').value = ficha.id;
    document.getElementById('fichaPatientId').value = ficha.patientId;
    document.getElementById('motivoConsulta').value = ficha.motivoConsulta || '';
    
    if (ficha.sintomatologia) {
        document.getElementById('fechaInicio').value = ficha.sintomatologia.fechaInicio || '';
        document.getElementById('progresion').value = ficha.sintomatologia.progresion || '';
        document.getElementById('tratamientosPrevios').value = ficha.sintomatologia.tratamientosPrevios || '';
        document.getElementById('medicamentos').value = ficha.sintomatologia.medicamentos || '';
    }
    
    document.getElementById('composicionFamiliar').value = ficha.composicionFamiliar || '';
    document.getElementById('otrosAntecedentes').value = ficha.otrosAntecedentes || '';
    
    const modal = document.getElementById('modalFichaIngreso');
    if (modal) modal.style.display = 'flex';
}

/**
 * Guarda la ficha de ingreso desde el formulario modal.
 */
export async function guardarFichaIngresoDesdeFormulario() {
    console.log('💾 Guardando ficha desde formulario...');
    
    const patientId = document.getElementById('fichaPatientId')?.value;
    const fichaId = document.getElementById('fichaId')?.value;
    
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
        id: fichaId || null,
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
        const resultado = await guardarFichaIngreso(patientId, data);
        
        // Cerrar el modal
        const modal = document.getElementById('modalFichaIngreso');
        if (modal) modal.style.display = 'none';
        
        // Recargar la vista del paciente para mostrar la nueva ficha
        if (typeof window.mostrarDetallePaciente === 'function') {
            window.mostrarDetallePaciente(patientId);
        }
        
        return resultado;
    } catch (error) {
        console.error('❌ Error al guardar desde formulario:', error);
        // El toast ya se muestra en guardarFichaIngreso
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

export function editarFichaIngreso(fichaIngresoId) {
    const ficha = state.fichasIngreso?.find(f => f.id == fichaIngresoId);
    if (ficha) {
        mostrarFormularioEdicionFichaIngreso(ficha);
    } else {
        showToast('Ficha no encontrada', 'error');
    }
}

export function verNotaSesion(sesionId) {
    const sesion = state.sesiones?.find(s => s.id == sesionId);
    if (!sesion) {
        showToast('Sesión no encontrada', 'error');
        return;
    }
    
    // Mostrar detalle de la sesión (puedes implementar un modal)
    alert(JSON.stringify(sesion, null, 2));
}

export function mostrarFormularioNotaSesion(patientId) {
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
    mostrarFormularioFichaIngreso,
    guardarFichaIngresoDesdeFormulario,
    editarFichaIngreso,
    verNotaSesion,
    mostrarFormularioNotaSesion
  };
  console.log('✅ window.fichasClinicas expuesto correctamente');
}

console.log('✅ fichasClinicas.js cargado correctamente con formulario de creación');