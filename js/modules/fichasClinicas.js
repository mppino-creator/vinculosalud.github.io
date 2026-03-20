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
      fichaId = data.id;
      await db.ref(`fichasIngreso/${fichaId}`).update(ficha);
      const fichasActualizadas = state.fichasIngreso.map(f => 
        f.id === fichaId ? { ...ficha, id: fichaId } : f
      );
      state.setFichasIngreso(fichasActualizadas);
      showToast('Ficha de ingreso actualizada', 'success');
    } else {
      const newRef = db.ref('fichasIngreso').push();
      fichaId = newRef.key;
      await newRef.set(ficha);
      state.setFichasIngreso([...state.fichasIngreso, { ...ficha, id: fichaId }]);
      showToast('Ficha de ingreso guardada', 'success');
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
      const sesionesActualizadas = state.sesiones.map(s => 
        s.id === data.id ? { ...sesion, id: data.id } : s
      );
      state.setSesiones(sesionesActualizadas);
      showToast('Nota de sesión actualizada', 'success');
    } else {
      const newRef = db.ref('sesiones').push();
      await newRef.set(sesion);
      state.setSesiones([...state.sesiones, { ...sesion, id: newRef.key }]);
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
    try {
        if (state.fichasIngreso && state.fichasIngreso.length > 0) {
            return state.fichasIngreso.filter(f => f.patientId == patientId);
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
    
    const fichasSnapshot = await db.ref('fichasIngreso').once('value');
    const fichasData = fichasSnapshot.val();
    state.setFichasIngreso(fichasData ? Object.keys(fichasData).map(key => ({ id: key, ...fichasData[key] })) : []);
    
    const sesionesSnapshot = await db.ref('sesiones').once('value');
    const sesionesData = sesionesSnapshot.val();
    state.setSesiones(sesionesData ? Object.keys(sesionesData).map(key => ({ id: key, ...sesionesData[key] })) : []);
    
    const informesSnapshot = await db.ref('informes').once('value');
    const informesData = informesSnapshot.val();
    state.setInformes(informesData ? Object.keys(informesData).map(key => ({ id: key, ...informesData[key] })) : []);
    
    console.log('✅ Fichas clínicas cargadas completamente');
  } catch (error) {
    console.error('❌ Error cargando fichas:', error);
    showToast('Error al cargar fichas clínicas', 'error');
  }
}

// ============================================
// FORMULARIOS DE FICHA DE INGRESO
// ============================================

export async function mostrarFormularioFichaIngreso(patientId) {
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

    const fichasExistentes = await obtenerFichasIngresoDePaciente(patientId);
    if (fichasExistentes.length > 0) {
        if (!confirm('Este paciente ya tiene una ficha de ingreso. ¿Quieres editarla?')) {
            return;
        } else {
            mostrarFormularioEdicionFichaIngreso(fichasExistentes[0]);
            return;
        }
    }

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
        const title = modal.querySelector('h2');
        if (title) title.textContent = 'Crear Ficha de Ingreso';
        const patientInfo = modal.querySelector('p');
        if (patientInfo) patientInfo.innerHTML = `Paciente: <strong>${patient.name}</strong> (${patient.rut})`;
        
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

function mostrarFormularioEdicionFichaIngreso(ficha) {
    let modal = document.getElementById('modalFichaIngreso');
    if (!modal) {
        mostrarFormularioFichaIngreso(ficha.patientId);
        setTimeout(() => llenarDatosFichaParaEdicion(ficha), 100);
    } else {
        llenarDatosFichaParaEdicion(ficha);
    }
}

function llenarDatosFichaParaEdicion(ficha) {
    const title = document.querySelector('#modalFichaIngreso h2');
    if (title) title.textContent = 'Editar Ficha de Ingreso';
    
    const patientInfo = document.querySelector('#modalFichaIngreso p');
    if (patientInfo) {
        const patient = state.patients.find(p => p.id == ficha.patientId);
        if (patient) patientInfo.innerHTML = `Paciente: <strong>${patient.name}</strong> (${patient.rut})`;
    }
    
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

export async function guardarFichaIngresoDesdeFormulario() {
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
        await guardarFichaIngreso(patientId, data);
        const modal = document.getElementById('modalFichaIngreso');
        if (modal) modal.style.display = 'none';
        if (typeof window.mostrarDetallePaciente === 'function') {
            window.mostrarDetallePaciente(patientId);
        }
    } catch (error) {
        console.error('❌ Error al guardar desde formulario:', error);
    }
}

// ============================================
// FUNCIONES PARA VISOR DE FICHAS CLÍNICAS (NUEVO)
// ============================================

export function renderFichasConFiltros() {
    const container = document.getElementById('fichasList');
    if (!container) return;

    // Obtener datos según rol
    let fichasIngreso = state.fichasIngreso;
    let sesiones = state.sesiones;
    let informes = state.informes;

    const user = state.currentUser;
    if (user && user.role === 'psych') {
        const misPacientesIds = state.patients.filter(p => p.psychId == user.data.id).map(p => p.id);
        fichasIngreso = fichasIngreso.filter(f => misPacientesIds.includes(f.patientId));
        sesiones = sesiones.filter(s => misPacientesIds.includes(s.patientId));
        informes = informes.filter(i => misPacientesIds.includes(i.patientId));
    }

    // Obtener filtros
    const searchTerm = document.getElementById('fichaSearch')?.value.toLowerCase() || '';
    const tipoFiltro = document.getElementById('fichaTipo')?.value;
    const profesionalFiltro = document.getElementById('fichaProfesional')?.value;

    // Preparar datos unificados
    let items = [];

    if (!tipoFiltro || tipoFiltro === 'ingreso') {
        fichasIngreso.forEach(f => {
            const patient = state.patients.find(p => p.id == f.patientId);
            items.push({
                id: f.id,
                tipo: 'ingreso',
                fecha: f.fechaCreacion || f.fechaIngreso,
                paciente: patient?.name || 'Desconocido',
                pacienteRut: patient?.rut || '',
                profesional: patient ? state.staff.find(s => s.id == patient.psychId)?.name : 'No asignado',
                motivo: f.motivoConsulta,
                url: `/fichasIngreso/${f.id}`
            });
        });
    }
    if (!tipoFiltro || tipoFiltro === 'sesion') {
        sesiones.forEach(s => {
            const patient = state.patients.find(p => p.id == s.patientId);
            items.push({
                id: s.id,
                tipo: 'sesion',
                fecha: s.fechaAtencion,
                paciente: patient?.name || 'Desconocido',
                pacienteRut: patient?.rut || '',
                profesional: patient ? state.staff.find(s => s.id == patient.psychId)?.name : 'No asignado',
                notas: s.notas,
                url: `/sesiones/${s.id}`
            });
        });
    }
    if (!tipoFiltro || tipoFiltro === 'informe') {
        informes.forEach(i => {
            const patient = state.patients.find(p => p.id == i.patientId);
            items.push({
                id: i.id,
                tipo: i.tipo === 'psicodiagnostico' ? 'psicodiagnostico' : 'cierre',
                fecha: i.fechaCreacion,
                paciente: patient?.name || 'Desconocido',
                pacienteRut: patient?.rut || '',
                profesional: patient ? state.staff.find(s => s.id == patient.psychId)?.name : 'No asignado',
                contenido: i.conclusiones || i.cierre,
                url: `/informes/${i.id}`
            });
        });
    }

    // Aplicar filtros adicionales
    items = items.filter(item => {
        if (searchTerm && !item.paciente.toLowerCase().includes(searchTerm) && !item.pacienteRut.includes(searchTerm)) return false;
        if (profesionalFiltro && item.profesional !== profesionalFiltro) return false;
        return true;
    });

    // Ordenar por fecha descendente
    items.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));

    if (items.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;">No hay fichas que coincidan con los filtros</div>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="ficha-card" style="border-left-color: ${item.tipo === 'ingreso' ? '#1E7A8A' : item.tipo === 'sesion' ? '#63B0C7' : '#C8A161'}">
            <div style="display:flex; justify-content:space-between;">
                <div>
                    <strong>${item.paciente}</strong> (${item.pacienteRut})<br>
                    <small>${new Date(item.fecha).toLocaleDateString()}</small>
                </div>
                <span class="badge" style="background:${item.tipo === 'ingreso' ? '#1E7A8A' : item.tipo === 'sesion' ? '#63B0C7' : '#C8A161'}">${item.tipo === 'ingreso' ? 'Ficha Ingreso' : item.tipo === 'sesion' ? 'Nota Evolución' : (item.tipo === 'psicodiagnostico' ? 'Psicodiagnóstico' : 'Cierre')}</span>
            </div>
            <div style="margin:10px 0; color:#666;">
                ${item.motivo ? `<p><strong>Motivo:</strong> ${item.motivo.substring(0,100)}${item.motivo.length>100?'...':''}</p>` : ''}
                ${item.notas ? `<p><strong>Notas:</strong> ${item.notas.substring(0,100)}${item.notas.length>100?'...':''}</p>` : ''}
                ${item.contenido ? `<p><strong>Contenido:</strong> ${item.contenido.substring(0,100)}${item.contenido.length>100?'...':''}</p>` : ''}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span><i class="fa fa-user-md"></i> ${item.profesional}</span>
                <button class="btn-icon" onclick="window.fichasClinicas?.verDetalleFicha('${item.id}', '${item.tipo}')" style="background:var(--primario); color:white;">
                    Ver detalle
                </button>
            </div>
        </div>
    `).join('');
}

export function filtrarFichas() {
    renderFichasConFiltros();
}

export function cargarSelectProfesionales() {
    const select = document.getElementById('fichaProfesional');
    if (!select) return;
    const profesionalesSet = new Set();
    state.patients.forEach(p => {
        const prof = state.staff.find(s => s.id == p.psychId);
        if (prof && prof.name) profesionalesSet.add(prof.name);
    });
    select.innerHTML = '<option value="">Todos los profesionales</option>' +
        Array.from(profesionalesSet).map(n => `<option value="${n}">${n}</option>`).join('');
}

export function verDetalleFicha(id, tipo) {
    if (tipo === 'ingreso') {
        const ficha = state.fichasIngreso.find(f => f.id == id);
        if (ficha) mostrarFormularioEdicionFichaIngreso(ficha);
    } else if (tipo === 'sesion') {
        const sesion = state.sesiones.find(s => s.id == id);
        if (sesion) verNotaSesion(id);
    } else {
        const informe = state.informes.find(i => i.id == id);
        if (informe && window.informes?.verInforme) window.informes.verInforme(id);
    }
}

export function editarFichaIngreso(fichaIngresoId) {
    const ficha = state.fichasIngreso?.find(f => f.id == fichaIngresoId);
    if (ficha) mostrarFormularioEdicionFichaIngreso(ficha);
    else showToast('Ficha no encontrada', 'error');
}

export function verNotaSesion(sesionId) {
    const sesion = state.sesiones?.find(s => s.id == sesionId);
    if (!sesion) {
        showToast('Sesión no encontrada', 'error');
        return;
    }
    let modal = document.getElementById('modalVerSesion');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalVerSesion';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <button class="modal-close" onclick="document.getElementById('modalVerSesion').style.display='none'">&times;</button>
                <h2>Detalle de Sesión</h2>
                <div id="detalleSesionContent"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    const content = document.getElementById('detalleSesionContent');
    if (content) {
        content.innerHTML = `
            <p><strong>Fecha:</strong> ${sesion.fechaAtencion || 'No especificada'}</p>
            <p><strong>Tipo:</strong> ${sesion.tipoAtencion || 'No especificado'}</p>
            <p><strong>Notas:</strong> ${sesion.notas || 'Sin notas'}</p>
            <p><strong>Evolución:</strong> ${sesion.evolucion || 'Sin evolución'}</p>
            <p><strong>Registrado por:</strong> ${sesion.realizadoPorNombre || 'Desconocido'}</p>
            <p><strong>Fecha registro:</strong> ${new Date(sesion.fechaGuardado || sesion.fechaCreacion).toLocaleString()}</p>
        `;
    }
    modal.style.display = 'flex';
}

export function mostrarFormularioNotaSesion(patientId) {
    showToast('Función de nueva sesión en desarrollo', 'info');
    console.log('📝 Mostrar formulario de nueva sesión para paciente:', patientId);
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
    mostrarFormularioNotaSesion,
    renderFichasConFiltros,
    filtrarFichas,
    cargarSelectProfesionales,
    verDetalleFicha
  };
  console.log('✅ window.fichasClinicas expuesto correctamente');
}

console.log('✅ fichasClinicas.js cargado correctamente con formulario de creación, setters y visor de fichas');