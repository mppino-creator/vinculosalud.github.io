// js/modules/fichasClinicas.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { puedeEditarFichas } from './permisos.js';
import { showToast } from './utils.js';

// ============================================
// FICHA DE INGRESO (basado en FICHA PREINGRESOS.docx)
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
    let docRef;
    if (data.id) {
      // Actualizar existente
      await db.collection('fichasIngreso').doc(data.id).update(ficha);
      docRef = { id: data.id };
      
      // Actualizar en state
      const index = state.fichasIngreso.findIndex(f => f.id === data.id);
      if (index !== -1) state.fichasIngreso[index] = { ...ficha, id: data.id };
      
      showToast('Ficha de ingreso actualizada', 'success');
    } else {
      // Crear nueva
      docRef = await db.collection('fichasIngreso').add(ficha);
      state.fichasIngreso.push({ ...ficha, id: docRef.id });
      
      showToast('Ficha de ingreso guardada', 'success');
    }
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error guardando ficha ingreso:', error);
    showToast('Error al guardar la ficha', 'error');
    throw error;
  }
}

// ============================================
// NOTAS DE SESIÓN / EVOLUCIÓN
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
      await db.collection('sesiones').doc(data.id).update(sesion);
      const index = state.sesiones.findIndex(s => s.id === data.id);
      if (index !== -1) state.sesiones[index] = { ...sesion, id: data.id };
      showToast('Nota de sesión actualizada', 'success');
    } else {
      const docRef = await db.collection('sesiones').add(sesion);
      state.sesiones.push({ ...sesion, id: docRef.id });
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

/**
 * Obtiene todas las fichas de ingreso de un paciente
 * @param {string} patientId - ID del paciente
 * @returns {Promise<Array>} Lista de fichas de ingreso
 */
export async function obtenerFichasIngresoDePaciente(patientId) {
    console.log(`📋 Obteniendo fichas de ingreso para paciente: ${patientId}`);
    
    try {
        // Si tenemos datos en memoria y están cargados
        if (state.fichasIngreso && state.fichasIngreso.length > 0) {
            const fichas = state.fichasIngreso.filter(f => f.patientId == patientId);
            console.log(`✅ Encontradas ${fichas.length} fichas en memoria`);
            return fichas;
        }
        
        // Si no, intentar cargar desde Firebase
        if (typeof db !== 'undefined') {
            const snapshot = await db.collection('fichasIngreso')
                .where('patientId', '==', patientId)
                .get();
            
            const fichas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log(`✅ Cargadas ${fichas.length} fichas desde Firebase`);
            
            // Actualizar state
            state.fichasIngreso = [
                ...state.fichasIngreso.filter(f => f.patientId != patientId),
                ...fichas
            ];
            
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
    // Si tenemos datos en memoria
    if (state.sesiones && state.sesiones.length > 0) {
      return state.sesiones
        .filter(s => s.patientId == patientId)
        .sort((a, b) => new Date(b.fechaAtencion) - new Date(a.fechaAtencion));
    }
    
    // Si no, buscar en Firebase
    const snapshot = await db.collection('sesiones')
      .where('patientId', '==', patientId)
      .orderBy('fechaAtencion', 'desc')
      .get();
      
    const sesiones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Actualizar state
    state.sesiones = [
      ...state.sesiones.filter(s => s.patientId != patientId),
      ...sesiones
    ];
    
    return sesiones;
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
    const fichasSnapshot = await db.collection('fichasIngreso').get();
    state.fichasIngreso = fichasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Cargar sesiones (últimas 100 para no saturar)
    const sesionesSnapshot = await db.collection('sesiones')
      .orderBy('fechaGuardado', 'desc')
      .limit(100)
      .get();
    state.sesiones = sesionesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log('✅ Fichas clínicas cargadas:', {
      fichasIngreso: state.fichasIngreso.length,
      sesiones: state.sesiones.length
    });
  } catch (error) {
    console.error('Error cargando fichas:', error);
  }
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
    cargarTodasLasFichas
  };
}

console.log('✅ fichasClinicas.js cargado correctamente');