// js/modules/informes.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { puedeEditarFichas, puedeVerInforme } from './permisos.js';
import { generarPDF, generarInformePsicodiagnostico, generarInformeCierre } from './pdfGenerator.js';
import { showToast, formatDate, getPsychNameById } from './utils.js';

// ============================================
// FUNCIONES PRINCIPALES DE INFORMES
// ============================================

/**
 * Guarda un informe (psicodiagnóstico o cierre)
 * @param {string} patientId - ID del paciente
 * @param {string} tipo - Tipo de informe ('psicodiagnostico' o 'cierre')
 * @param {Object} data - Datos del informe
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function guardarInforme(patientId, tipo, data) {
  if (!puedeEditarFichas(patientId)) {
    showToast('No tienes permisos para guardar informes', 'error');
    throw new Error('No tienes permisos');
  }
  
  const patient = state.patients.find(p => p.id == patientId);
  if (!patient) {
    showToast('Paciente no encontrado', 'error');
    throw new Error('Paciente no encontrado');
  }
  
  const informe = {
    patientId,
    patientName: patient.name || 'Desconocido',
    patientRut: patient.rut || '',
    tipo, // 'psicodiagnostico' o 'cierre'
    ...data,
    realizadoPor: state.currentUser?.data?.id || null,
    realizadoPorNombre: state.currentUser?.data?.name || 'Desconocido',
    fechaCreacion: new Date().toISOString(),
    fechaModificacion: new Date().toISOString()
  };
  
  try {
    let docRef;
    if (data.id) {
      // Actualizar existente
      await db.ref(`informes/${data.id}`).update(informe);
      docRef = { id: data.id };
      
      // Actualizar state usando setter
      const informesActualizados = state.informes.map(i => 
        i.id === data.id ? { ...informe, id: data.id } : i
      );
      state.setInformes(informesActualizados);
      
      showToast('Informe actualizado correctamente', 'success');
    } else {
      // Crear nuevo
      const newRef = db.ref('informes').push();
      docRef = { id: newRef.key };
      await newRef.set(informe);
      
      // Actualizar state usando setter
      state.setInformes([...state.informes, { ...informe, id: newRef.key }]);
      
      showToast('Informe guardado correctamente', 'success');
    }
    
    // Generar PDF automáticamente (en segundo plano)
    generarPDFInforme(docRef.id).catch(err => 
      console.warn('Error generando PDF automático:', err)
    );
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error guardando informe:', error);
    showToast('Error al guardar el informe', 'error');
    throw error;
  }
}

/**
 * Obtiene todos los informes de un paciente
 * @param {string} patientId - ID del paciente
 * @returns {Promise<Array>} Lista de informes
 */
export async function obtenerInformesDePaciente(patientId) {
  try {
    // Si estamos en memoria, filtrar localmente
    if (state.informes && state.informes.length > 0) {
      return state.informes
        .filter(i => i.patientId == patientId)
        .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
    }
    
    // Si no, buscar en Firebase
    const snapshot = await db.ref('informes')
      .orderByChild('patientId')
      .equalTo(patientId)
      .once('value');
    
    const data = snapshot.val();
    if (data) {
      const informes = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      
      // Actualizar state usando setter
      const otrosInformes = state.informes.filter(i => i.patientId != patientId);
      state.setInformes([...otrosInformes, ...informes]);
      
      return informes.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
    }
    
    return [];
  } catch (error) {
    console.error('Error obteniendo informes:', error);
    return [];
  }
}

/**
 * Obtiene un informe por su ID
 * @param {string} informeId - ID del informe
 * @returns {Promise<Object|null>} Informe encontrado o null
 */
export async function obtenerInformePorId(informeId) {
  try {
    // Buscar en state primero
    const informeLocal = state.informes.find(i => i.id == informeId);
    if (informeLocal) return informeLocal;
    
    // Buscar en Firebase
    const snapshot = await db.ref(`informes/${informeId}`).once('value');
    if (snapshot.exists()) {
      return { id: snapshot.key, ...snapshot.val() };
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo informe:', error);
    return null;
  }
}

// ============================================
// FUNCIONES DE VISUALIZACIÓN DE FORMULARIOS
// ============================================

/**
 * Muestra el formulario para crear/editar un informe
 * @param {string} patientId - ID del paciente
 * @param {string} tipo - Tipo de informe
 * @param {string} informeId - ID del informe (opcional, para edición)
 */
export function mostrarFormularioInforme(patientId, tipo, informeId = null) {
  if (!puedeEditarFichas(patientId)) {
    showToast('No tienes permisos para crear informes', 'error');
    return;
  }
  
  const patient = state.patients.find(p => p.id == patientId);
  if (!patient) return;
  
  // Crear modal si no existe
  crearModalInforme();
  
  const modal = document.getElementById('informeModal');
  const title = document.getElementById('informeModalTitle');
  const form = document.getElementById('informeForm');
  
  // Configurar según tipo
  if (tipo === 'psicodiagnostico') {
    title.innerText = `📋 Informe Psicodiagnóstico - ${patient.name}`;
    renderFormularioPsicodiagnostico(patientId, informeId);
  } else {
    title.innerText = `📄 Informe de Cierre - ${patient.name}`;
    renderFormularioCierre(patientId, informeId);
  }
  
  modal.style.display = 'flex';
}

/**
 * Crea el modal de informe si no existe
 */
function crearModalInforme() {
  if (document.getElementById('informeModal')) return;
  
  const modalHtml = `
    <div class="modal" id="informeModal">
      <div class="modal-content" style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
        <button class="modal-close" onclick="cerrarModalInforme()">&times;</button>
        <h2 id="informeModalTitle"></h2>
        <div id="informeForm"></div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

/**
 * Cierra el modal de informe
 */
export function cerrarModalInforme() {
  const modal = document.getElementById('informeModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Renderiza el formulario de informe psicodiagnóstico
 */
function renderFormularioPsicodiagnostico(patientId, informeId = null) {
  const container = document.getElementById('informeForm');
  const informe = informeId ? state.informes.find(i => i.id == informeId) : null;
  
  container.innerHTML = `
    <form onsubmit="event.preventDefault(); guardarInformePsicodiagnostico('${patientId}', '${informeId || ''}')">
      <input type="hidden" id="informeId" value="${informeId || ''}">
      
      <div class="form-group">
        <label>Motivo de Consulta *</label>
        <textarea id="motivoConsulta" rows="3" required>${informe?.motivoConsulta || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Instrumentos Aplicados</label>
        <textarea id="instrumentos" rows="3">${informe?.instrumentos || ''}</textarea>
        <small>Ej: Entrevista clínica, Test de Rorschach, WISC-V, etc.</small>
      </div>
      
      <h3 style="margin:20px 0 10px;">Antecedentes Relevantes</h3>
      
      <div class="form-group">
        <label>Situación Actual</label>
        <textarea id="situacionActual" rows="3">${informe?.situacionActual || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Historia de la Sintomatología</label>
        <textarea id="historiaSintomatologia" rows="3">${informe?.historiaSintomatologia || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Historia Individual y Familiar</label>
        <textarea id="historiaFamiliar" rows="3">${informe?.historiaFamiliar || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Antecedentes del Desarrollo</label>
        <textarea id="desarrollo" rows="3">${informe?.desarrollo || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Antecedentes Mórbidos</label>
        <textarea id="morbidos" rows="3">${informe?.morbidos || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Relaciones Interpersonales</label>
        <textarea id="relaciones" rows="3">${informe?.relaciones || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Comportamiento Observado</label>
        <textarea id="comportamiento" rows="3">${informe?.comportamiento || ''}</textarea>
      </div>
      
      <h3 style="margin:20px 0 10px;">Resultados</h3>
      
      <div class="form-group">
        <label>Área Afectiva-Emocional</label>
        <textarea id="areaAfectiva" rows="4">${informe?.areaAfectiva || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Área Cognitiva-Intelectual</label>
        <textarea id="areaCognitiva" rows="4">${informe?.areaCognitiva || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Área Relacional</label>
        <textarea id="areaRelacional" rows="4">${informe?.areaRelacional || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Hipótesis Descriptiva (DSM-V)</label>
        <textarea id="hipotesisDescriptiva" rows="3">${informe?.hipotesisDescriptiva || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Hipótesis Psicodinámica</label>
        <textarea id="hipotesisPsicodinamica" rows="4">${informe?.hipotesisPsicodinamica || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Plan de Tratamiento</label>
        <textarea id="planTratamiento" rows="4">${informe?.planTratamiento || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Conclusiones e Indicaciones</label>
        <textarea id="conclusiones" rows="4">${informe?.conclusiones || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Fecha de Evaluación</label>
        <input type="date" id="fechaEvaluacion" value="${informe?.fechaEvaluacion || new Date().toISOString().split('T')[0]}">
      </div>
      
      <div style="display:flex; gap:15px; margin-top:30px;">
        <button type="submit" class="btn-staff" style="background:var(--verde-exito); flex:1;">
          <i class="fa fa-save"></i> Guardar Informe
        </button>
        <button type="button" class="btn-staff" style="background:var(--text-light); flex:0.5;" onclick="cerrarModalInforme()">
          Cancelar
        </button>
      </div>
    </form>
  `;
}

/**
 * Renderiza el formulario de informe de cierre
 */
function renderFormularioCierre(patientId, informeId = null) {
  const container = document.getElementById('informeForm');
  const informe = informeId ? state.informes.find(i => i.id == informeId) : null;
  
  container.innerHTML = `
    <form onsubmit="event.preventDefault(); guardarInformeCierre('${patientId}', '${informeId || ''}')">
      <input type="hidden" id="informeId" value="${informeId || ''}">
      
      <div class="form-group">
        <label>Motivo de Consulta (Manifiesto)</label>
        <textarea id="motivoConsulta" rows="3">${informe?.motivoConsulta || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Antecedentes Relevantes</label>
        <textarea id="antecedentes" rows="4">${informe?.antecedentes || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Hipótesis Diagnóstica Descriptiva</label>
        <textarea id="hipotesisDiagnostica" rows="3">${informe?.hipotesisDiagnostica || ''}</textarea>
      </div>
      
      <h3 style="margin:20px 0 10px;">Descripción del Proceso</h3>
      
      <div class="form-group">
        <label>Plan de Tratamiento</label>
        <textarea id="planTratamiento" rows="3">${informe?.planTratamiento || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Foco Abordado</label>
        <textarea id="focoAbordado" rows="3">${informe?.focoAbordado || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Objetivos</label>
        <textarea id="objetivos" rows="3">${informe?.objetivos || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Dificultades del Proceso</label>
        <textarea id="dificultades" rows="3">${informe?.dificultades || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Transferencia y Contratransferencia</label>
        <textarea id="transferencia" rows="3">${informe?.transferencia || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Resistencias</label>
        <textarea id="resistencias" rows="3">${informe?.resistencias || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Número de Sesiones</label>
        <input type="number" id="numSesiones" value="${informe?.numSesiones || ''}">
      </div>
      
      <div class="form-group">
        <label>Avances o Logros Obtenidos</label>
        <textarea id="avances" rows="4">${informe?.avances || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Cierre del Proceso</label>
        <textarea id="cierre" rows="4">${informe?.cierre || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label>Tipo de Cierre</label>
        <select id="tipoCierre">
          <option value="alta" ${informe?.tipoCierre === 'alta' ? 'selected' : ''}>Alta</option>
          <option value="abandono" ${informe?.tipoCierre === 'abandono' ? 'selected' : ''}>Abandono</option>
          <option value="derivacion" ${informe?.tipoCierre === 'derivacion' ? 'selected' : ''}>Derivación</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Sugerencias</label>
        <textarea id="sugerencias" rows="3">${informe?.sugerencias || ''}</textarea>
      </div>
      
      <div style="display:flex; gap:15px; margin-top:30px;">
        <button type="submit" class="btn-staff" style="background:var(--verde-exito); flex:1;">
          <i class="fa fa-save"></i> Guardar Informe
        </button>
        <button type="button" class="btn-staff" style="background:var(--text-light); flex:0.5;" onclick="cerrarModalInforme()">
          Cancelar
        </button>
      </div>
    </form>
  `;
}

// ============================================
// FUNCIONES DE GUARDADO DE INFORMES
// ============================================

/**
 * Guarda un informe psicodiagnóstico
 */
export async function guardarInformePsicodiagnostico(patientId, informeId = '') {
  const data = {
    id: informeId || null,
    motivoConsulta: document.getElementById('motivoConsulta')?.value,
    instrumentos: document.getElementById('instrumentos')?.value,
    situacionActual: document.getElementById('situacionActual')?.value,
    historiaSintomatologia: document.getElementById('historiaSintomatologia')?.value,
    historiaFamiliar: document.getElementById('historiaFamiliar')?.value,
    desarrollo: document.getElementById('desarrollo')?.value,
    morbidos: document.getElementById('morbidos')?.value,
    relaciones: document.getElementById('relaciones')?.value,
    comportamiento: document.getElementById('comportamiento')?.value,
    areaAfectiva: document.getElementById('areaAfectiva')?.value,
    areaCognitiva: document.getElementById('areaCognitiva')?.value,
    areaRelacional: document.getElementById('areaRelacional')?.value,
    hipotesisDescriptiva: document.getElementById('hipotesisDescriptiva')?.value,
    hipotesisPsicodinamica: document.getElementById('hipotesisPsicodinamica')?.value,
    planTratamiento: document.getElementById('planTratamiento')?.value,
    conclusiones: document.getElementById('conclusiones')?.value,
    fechaEvaluacion: document.getElementById('fechaEvaluacion')?.value
  };
  
  await guardarInforme(patientId, 'psicodiagnostico', data);
  cerrarModalInforme();
  
  // Recargar vista del paciente
  if (window.mostrarDetallePaciente) {
    window.mostrarDetallePaciente(patientId);
  }
}

/**
 * Guarda un informe de cierre
 */
export async function guardarInformeCierre(patientId, informeId = '') {
  const data = {
    id: informeId || null,
    motivoConsulta: document.getElementById('motivoConsulta')?.value,
    antecedentes: document.getElementById('antecedentes')?.value,
    hipotesisDiagnostica: document.getElementById('hipotesisDiagnostica')?.value,
    planTratamiento: document.getElementById('planTratamiento')?.value,
    focoAbordado: document.getElementById('focoAbordado')?.value,
    objetivos: document.getElementById('objetivos')?.value,
    dificultades: document.getElementById('dificultades')?.value,
    transferencia: document.getElementById('transferencia')?.value,
    resistencias: document.getElementById('resistencias')?.value,
    numSesiones: document.getElementById('numSesiones')?.value,
    avances: document.getElementById('avances')?.value,
    cierre: document.getElementById('cierre')?.value,
    tipoCierre: document.getElementById('tipoCierre')?.value,
    sugerencias: document.getElementById('sugerencias')?.value
  };
  
  await guardarInforme(patientId, 'cierre', data);
  cerrarModalInforme();
  
  // Recargar vista del paciente
  if (window.mostrarDetallePaciente) {
    window.mostrarDetallePaciente(patientId);
  }
}

// ============================================
// FUNCIONES DE VISUALIZACIÓN DE INFORMES
// ============================================

/**
 * Muestra un informe en vista previa
 * @param {string} informeId - ID del informe
 */
export async function verInforme(informeId) {
  const informe = await obtenerInformePorId(informeId);
  if (!informe) {
    showToast('Informe no encontrado', 'error');
    return;
  }
  
  if (!puedeVerInforme(informeId)) {
    showToast('No tienes permisos para ver este informe', 'error');
    return;
  }
  
  // Crear modal de visualización
  const modalHtml = `
    <div class="modal" id="verInformeModal">
      <div class="modal-content" style="max-width: 900px; max-height: 80vh; overflow-y: auto;">
        <button class="modal-close" onclick="document.getElementById('verInformeModal').remove()">&times;</button>
        <h2>${informe.tipo === 'psicodiagnostico' ? '📋 Informe Psicodiagnóstico' : '📄 Informe de Cierre'}</h2>
        
        <div style="margin:20px 0; padding:20px; background:#f8fafc; border-radius:12px;">
          <p><strong>Paciente:</strong> ${informe.patientName}</p>
          <p><strong>RUT:</strong> ${informe.patientRut}</p>
          <p><strong>Fecha creación:</strong> ${formatDate(informe.fechaCreacion)}</p>
          <p><strong>Realizado por:</strong> ${informe.realizadoPorNombre || getPsychNameById(informe.realizadoPor)}</p>
        </div>
        
        <div style="background:white; padding:20px; border-radius:12px;">
          ${renderInformeHTML(informe)}
        </div>
        
        <div style="display:flex; gap:15px; margin-top:30px; justify-content:flex-end;">
          <button class="btn-staff" onclick="window.open('${informe.pdfUrl || '#'}')" style="background:var(--verde-exito);">
            <i class="fa fa-file-pdf"></i> Descargar PDF
          </button>
          <button class="btn-staff" onclick="window.informes?.generarPDFInforme('${informeId}')" style="background:var(--azul-apple);">
            <i class="fa fa-refresh"></i> Regenerar PDF
          </button>
          <button class="btn-staff" onclick="document.getElementById('verInformeModal').remove()" style="background:var(--text-light);">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

/**
 * Renderiza el HTML del informe según su tipo
 */
function renderInformeHTML(informe) {
  if (informe.tipo === 'psicodiagnostico') {
    return `
      <h3>I. MOTIVO DE CONSULTA</h3>
      <p>${informe.motivoConsulta || 'No especificado'}</p>
      
      <h3>II. INSTRUMENTOS APLICADOS</h3>
      <p>${informe.instrumentos || 'No especificado'}</p>
      
      <h3>III. ANTECEDENTES RELEVANTES</h3>
      <p><strong>Situación actual:</strong> ${informe.situacionActual || '—'}</p>
      <p><strong>Historia sintomatología:</strong> ${informe.historiaSintomatologia || '—'}</p>
      <p><strong>Historia familiar:</strong> ${informe.historiaFamiliar || '—'}</p>
      <p><strong>Desarrollo:</strong> ${informe.desarrollo || '—'}</p>
      <p><strong>Antecedentes mórbidos:</strong> ${informe.morbidos || '—'}</p>
      <p><strong>Relaciones interpersonales:</strong> ${informe.relaciones || '—'}</p>
      
      <h3>IV. COMPORTAMIENTO OBSERVADO</h3>
      <p>${informe.comportamiento || '—'}</p>
      
      <h3>V. RESULTADOS</h3>
      <p><strong>Área afectiva-emocional:</strong> ${informe.areaAfectiva || '—'}</p>
      <p><strong>Área cognitiva-intelectual:</strong> ${informe.areaCognitiva || '—'}</p>
      <p><strong>Área relacional:</strong> ${informe.areaRelacional || '—'}</p>
      
      <h3>VI. HIPÓTESIS DESCRIPTIVA (DSM-V)</h3>
      <p>${informe.hipotesisDescriptiva || '—'}</p>
      
      <h3>VII. HIPÓTESIS PSICODINÁMICA</h3>
      <p>${informe.hipotesisPsicodinamica || '—'}</p>
      
      <h3>VIII. PLAN DE TRATAMIENTO</h3>
      <p>${informe.planTratamiento || '—'}</p>
      
      <h3>IX. CONCLUSIONES E INDICACIONES</h3>
      <p>${informe.conclusiones || '—'}</p>
      
      <p style="margin-top:30px; text-align:right;"><em>Fecha de evaluación: ${informe.fechaEvaluacion || '—'}</em></p>
    `;
  } else {
    return `
      <h3>I. MOTIVO DE CONSULTA</h3>
      <p>${informe.motivoConsulta || 'No especificado'}</p>
      
      <h3>II. ANTECEDENTES RELEVANTES</h3>
      <p>${informe.antecedentes || '—'}</p>
      
      <h3>III. HIPÓTESIS DIAGNÓSTICA DESCRIPTIVA</h3>
      <p>${informe.hipotesisDiagnostica || '—'}</p>
      
      <h3>IV. DESCRIPCIÓN DEL PROCESO</h3>
      <p><strong>Plan de tratamiento:</strong> ${informe.planTratamiento || '—'}</p>
      <p><strong>Foco abordado:</strong> ${informe.focoAbordado || '—'}</p>
      <p><strong>Objetivos:</strong> ${informe.objetivos || '—'}</p>
      <p><strong>Dificultades:</strong> ${informe.dificultades || '—'}</p>
      <p><strong>Transferencia y contratransferencia:</strong> ${informe.transferencia || '—'}</p>
      <p><strong>Resistencias:</strong> ${informe.resistencias || '—'}</p>
      <p><strong>Número de sesiones:</strong> ${informe.numSesiones || '—'}</p>
      
      <h3>V. AVANCES Y LOGROS OBTENIDOS</h3>
      <p>${informe.avances || '—'}</p>
      
      <h3>VI. CIERRE DEL PROCESO</h3>
      <p>${informe.cierre || '—'}</p>
      <p><strong>Tipo de cierre:</strong> ${informe.tipoCierre || '—'}</p>
      
      <h3>VII. SUGERENCIAS</h3>
      <p>${informe.sugerencias || '—'}</p>
    `;
  }
}

// ============================================
// FUNCIONES DE GENERACIÓN DE PDF
// ============================================

/**
 * Genera PDF para un informe específico
 * @param {string} informeId - ID del informe
 */
export async function generarPDFInforme(informeId) {
  const informe = await obtenerInformePorId(informeId);
  if (!informe) {
    showToast('Informe no encontrado', 'error');
    return;
  }
  
  showToast('Generando PDF...', 'info');
  
  try {
    let pdfUrl;
    if (informe.tipo === 'psicodiagnostico') {
      pdfUrl = await generarInformePsicodiagnostico(informe);
    } else {
      pdfUrl = await generarInformeCierre(informe);
    }
    
    // Guardar URL en Firebase
    await db.ref(`informes/${informeId}`).update({ pdfUrl });
    
    // Actualizar state usando setter
    const informesActualizados = state.informes.map(i => 
      i.id === informeId ? { ...i, pdfUrl } : i
    );
    state.setInformes(informesActualizados);
    
    showToast('PDF generado correctamente', 'success');
    
    // Abrir PDF en nueva pestaña
    window.open(pdfUrl, '_blank');
  } catch (error) {
    console.error('Error generando PDF:', error);
    showToast('Error al generar PDF', 'error');
  }
}

// ============================================
// FUNCIONES DE ESTADÍSTICAS DE INFORMES
// ============================================

/**
 * Obtiene estadísticas de informes
 * @param {string} psychId - ID del profesional (opcional)
 * @returns {Object} Estadísticas de informes
 */
export function getInformeStats(psychId = null) {
  let informes = state.informes;
  
  if (psychId) {
    // Filtrar por profesional (a través de pacientes)
    const patientIds = state.patients
      .filter(p => p.psychId == psychId)
      .map(p => p.id);
    informes = informes.filter(i => patientIds.includes(i.patientId));
  }
  
  const total = informes.length;
  const porTipo = {
    psicodiagnostico: informes.filter(i => i.tipo === 'psicodiagnostico').length,
    cierre: informes.filter(i => i.tipo === 'cierre').length
  };
  
  const porMes = {};
  informes.forEach(i => {
    if (i.fechaCreacion) {
      const mes = i.fechaCreacion.substring(0, 7); // YYYY-MM
      porMes[mes] = (porMes[mes] || 0) + 1;
    }
  });
  
  const pacientesConInforme = new Set(informes.map(i => i.patientId)).size;
  const pacientesSinInforme = state.patients.length - pacientesConInforme;
  
  return {
    total,
    porTipo,
    porMes,
    pacientesConInforme,
    pacientesSinInforme,
    promedioPorPaciente: state.patients.length > 0 
      ? (total / state.patients.length).toFixed(1) 
      : 0
  };
}

// ============================================
// EXPORTAR FUNCIONES AL OBJETO WINDOW
// ============================================
if (typeof window !== 'undefined') {
  window.informes = {
    guardarInforme,
    obtenerInformesDePaciente,
    obtenerInformePorId,
    mostrarFormularioInforme,
    cerrarModalInforme,
    guardarInformePsicodiagnostico,
    guardarInformeCierre,
    verInforme,
    generarPDFInforme,
    getInformeStats
  };
}

console.log('✅ informes.js cargado con todas las funcionalidades (sin boxes)');