// js/modules/permisos.js
import state from './state.js';

// ============================================
// FUNCIONES BÁSICAS DE PERMISOS - VERSIÓN SIMPLIFICADA
// ============================================

/**
 * Verifica si un usuario puede acceder a un paciente específico
 * @param {string|number} patientId - ID del paciente
 * @returns {boolean} true si tiene acceso
 */
export function puedeAccederAPaciente(patientId) {
  console.log('🔍 Verificando permisos para paciente:', patientId);
  
  // 1. Verificar que tenemos el estado
  if (!state) {
    console.log('❌ state no disponible');
    return false;
  }
  
  // 2. Verificar usuario - ACCESO DIRECTO a state.currentUser
  const user = state.currentUser;
  if (!user) {
    console.log('❌ No hay usuario logueado (state.currentUser es null)');
    return false;
  }
  
  console.log('👤 Usuario encontrado:', user);
  console.log('👤 Role:', user.role);
  console.log('👤 user.data:', user.data);
  
  // 3. Buscar paciente
  if (!state.patients || !Array.isArray(state.patients)) {
    console.log('❌ state.patients no disponible');
    return false;
  }
  
  const patient = state.patients.find(p => p.id == patientId);
  if (!patient) {
    console.log('❌ Paciente no encontrado. Pacientes disponibles:', state.patients.length);
    return false;
  }
  
  console.log('👤 Paciente encontrado:', patient.name, 'psychId:', patient.psychId);
  
  // 4. Admin puede todo
  if (user.data?.isAdmin === true || user.role === 'admin') {
    console.log('✅ Es admin, acceso concedido');
    return true;
  }
  
  // 5. Psicólogo - verificar si el paciente le pertenece
  // Obtener el ID del usuario (puede estar en diferentes lugares)
  const userId = user.data?.id || user.id;
  
  if (!userId) {
    console.log('❌ No se pudo determinar el ID del usuario');
    return false;
  }
  
  console.log(`🔍 Comparando: psychId=${patient.psychId} vs userId=${userId}`);
  
  // Comparación flexible (== para permitir string/number)
  const tieneAcceso = patient.psychId == userId;
  console.log(`✅ Resultado: ${tieneAcceso ? 'ACCESO CONCEDIDO' : 'ACCESO DENEGADO'}`);
  
  return tieneAcceso;
}

/**
 * Verifica si un usuario puede editar fichas de un paciente
 */
export function puedeEditarFichas(patientId) {
  return puedeAccederAPaciente(patientId);
}

/**
 * Filtra un array para mostrar solo elementos de pacientes del usuario actual
 */
export function filtrarSoloMisPacientes(array, campoPatientId = 'patientId') {
  const user = state.currentUser;
  if (!user) return [];
  
  // Admin ve todo
  if (user.data?.isAdmin || user.role === 'admin') return array;
  
  // Obtener ID del usuario
  const userId = user.data?.id || user.id;
  if (!userId) return [];
  
  // Psicólogo ve solo lo de sus pacientes
  const misPatientIds = state.patients
    .filter(p => p.psychId == userId)
    .map(p => p.id);
    
  return array.filter(item => misPatientIds.includes(item[campoPatientId]));
}

// ============================================
// FUNCIONES PARA FICHAS CLÍNICAS
// ============================================

export function puedeVerFichaIngreso(fichaIngresoId) {
  const ficha = state.fichasIngreso?.find(f => f.id == fichaIngresoId);
  return ficha ? puedeAccederAPaciente(ficha.patientId) : false;
}

export function puedeVerSesion(sesionId) {
  const sesion = state.sesiones?.find(s => s.id == sesionId);
  return sesion ? puedeAccederAPaciente(sesion.patientId) : false;
}

export function puedeVerInforme(informeId) {
  const informe = state.informes?.find(i => i.id == informeId);
  return informe ? puedeAccederAPaciente(informe.patientId) : false;
}

export function puedeEditarFichaIngreso(patientId) {
  return puedeEditarFichas(patientId);
}

export function puedeEditarSesion(patientId) {
  return puedeEditarFichas(patientId);
}

export function puedeEditarInforme(patientId) {
  return puedeEditarFichas(patientId);
}

// ============================================
// FUNCIONES DE PERMISOS POR ROL
// ============================================

export function isAdmin() {
  const user = state.currentUser;
  return user?.data?.isAdmin === true || user?.role === 'admin';
}

export function isPsychologist() {
  const user = state.currentUser;
  return user?.role === 'psychologist' || user?.role === 'psych';
}

export function getPermisosResumen() {
  const user = state.currentUser;
  if (!user) return null;
  
  const userId = user.data?.id || user.id;
  
  return {
    esAdmin: isAdmin(),
    esPsicologo: isPsychologist(),
    misPacientes: isPsychologist() && userId
      ? state.patients?.filter(p => p.psychId == userId).length || 0
      : 0
  };
}

// ============================================
// EXPORTAR FUNCIONES AL OBJETO WINDOW
// ============================================
if (typeof window !== 'undefined') {
  window.permisos = {
    puedeAccederAPaciente,
    puedeEditarFichas,
    filtrarSoloMisPacientes,
    puedeVerFichaIngreso,
    puedeVerSesion,
    puedeVerInforme,
    puedeEditarFichaIngreso,
    puedeEditarSesion,
    puedeEditarInforme,
    isAdmin,
    isPsychologist,
    getPermisosResumen
  };
}

console.log('✅ permisos.js cargado con funciones para fichas clínicas');