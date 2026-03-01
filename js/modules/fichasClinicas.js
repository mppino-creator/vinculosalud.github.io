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
    
    return { success: true };
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
// CARGAR DATOS INICIALES (CORREGIDO)
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
// EXPORTAR FUNCIONES
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