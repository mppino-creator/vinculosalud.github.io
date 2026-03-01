// js/modules/fichasClinicas.js
import { db } from '../config/firebase.js';
import state from './state.js';
import { puedeEditarFichas } from './permisos.js';

// ============================================
// FICHA DE INGRESO (basado en FICHA PREINGRESOS.docx)
// ============================================

export async function guardarFichaIngreso(patientId, data) {
  if (!puedeEditarFichas(patientId)) {
    throw new Error('No tienes permisos para editar esta ficha');
  }
  
  const ficha = {
    patientId,
    ...data,
    realizadoPor: state.currentUser.data.id,
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString()
  };
  
  try {
    // Si tiene ID, actualizamos, si no, creamos nuevo
    if (data.id) {
      await db.collection('fichasIngreso').doc(data.id).update(ficha);
      // Actualizar en state
      const index = state.fichasIngreso.findIndex(f => f.id === data.id);
      if (index !== -1) state.fichasIngreso[index] = { ...ficha, id: data.id };
    } else {
      const docRef = await db.collection('fichasIngreso').add(ficha);
      state.fichasIngreso.push({ ...ficha, id: docRef.id });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error guardando ficha ingreso:', error);
    throw error;
  }
}

// ============================================
// NOTAS DE SESIÓN / EVOLUCIÓN (basado en Detalle de la Atención.pdf)
// ============================================

export async function guardarNotaSesion(patientId, data) {
  if (!puedeEditarFichas(patientId)) {
    throw new Error('No tienes permisos');
  }
  
  const sesion = {
    patientId,
    ...data,
    realizadoPor: state.currentUser.data.id,
    fechaGuardado: new Date().toISOString()
  };
  
  try {
    if (data.id) {
      await db.collection('sesiones').doc(data.id).update(sesion);
      const index = state.sesiones.findIndex(s => s.id === data.id);
      if (index !== -1) state.sesiones[index] = { ...sesion, id: data.id };
    } else {
      const docRef = await db.collection('sesiones').add(sesion);
      state.sesiones.push({ ...sesion, id: docRef.id });
    }
    return { success: true };
  } catch (error) {
    console.error('Error guardando sesión:', error);
    throw error;
  }
}

export async function obtenerSesionesDePaciente(patientId) {
  try {
    const snapshot = await db.collection('sesiones')
      .where('patientId', '==', patientId)
      .orderBy('fechaAtencion', 'desc')
      .get();
      
    const sesiones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Actualizar state
    state.sesiones = [
      ...state.sesiones.filter(s => s.patientId !== patientId),
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