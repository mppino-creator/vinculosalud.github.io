// js/modules/permisos.js
import state from './state.js';

// ============================================
// FUNCIONES BÁSICAS DE PERMISOS - VERSIÓN CORREGIDA
// ============================================

/**
 * Verifica si un usuario puede acceder a un paciente específico
 * @param {string|number} patientId - ID del paciente
 * @returns {boolean} true si tiene acceso
 */
export function puedeAccederAPaciente(patientId) {
  const user = state.currentUser;
  const patient = state.patients.find(p => p.id == patientId);
  
  if (!user || !patient) {
    console.log('❌ No hay usuario o paciente');
    return false;
  }
  
  // Admin puede todo
  if (user.data?.isAdmin) {
    console.log('✅ Es admin, acceso concedido');
    return true;
  }
  
  // Psicólogo (acepta 'psychologist' o 'psych')
  const esPsicologo = user.data?.role === 'psychologist' || user.role === 'psych';
  
  if (esPsicologo) {
    const tieneAcceso = patient.psychId == user.data.id;
    console.log(`🔍 Comparando: psychId=${patient.psychId} vs userId=${user.data.id} → ${tieneAcceso}`);
    return tieneAcceso;
  }
  
  console.log('❌ No cumple ninguna condición');
  return false;
}

/**
 * Verifica si un usuario puede editar fichas de un paciente
 * @param {string|number} patientId - ID del paciente
 * @returns {boolean} true si puede editar
 */
export function puedeEditarFichas(patientId) {
  return puedeAccederAPaciente(patientId);
}

/**
 * Filtra un array para mostrar solo elementos de pacientes del usuario actual
 * @param {Array} array - Array a filtrar
 * @param {string} campoPatientId - Nombre del campo que contiene el patientId
 * @returns {Array} Array filtrado
 */
export function filtrarSoloMisPacientes(array, campoPatientId = 'patientId') {
  const user = state.currentUser;
  if (!user) return [];
  
  // Admin ve todo
  if (user.data?.isAdmin) return array;
  
  // Psicólogo ve solo lo de sus pacientes
  const misPatientIds = state.patients
    .filter(p => p.psychId == user.data.id)
    .map(p => p.id);
    
  return array.filter(item => misPatientIds.includes(item[campoPatientId]));
}

// ============================================
// FUNCIONES PARA FICHAS CLÍNICAS
// ============================================

export function puedeVerFichaIngreso(fichaIngresoId) {
  const user = state.currentUser;
  if (!user) return false;
  
  const ficha = state.fichasIngreso.find(f => f.id == fichaIngresoId);
  if (!ficha) return false;
  
  return puedeAccederAPaciente(ficha.patientId);
}

export function puedeVerSesion(sesionId) {
  const user = state.currentUser;
  if (!user) return false;
  
  const sesion = state.sesiones.find(s => s.id == sesionId);
  if (!sesion) return false;
  
  return puedeAccederAPaciente(sesion.patientId);
}

export function puedeVerInforme(informeId) {
  const user = state.currentUser;
  if (!user) return false;
  
  const informe = state.informes.find(i => i.id == informeId);
  if (!informe) return false;
  
  return puedeAccederAPaciente(informe.patientId);
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

export function getCurrentUserRole() {
  return state.currentUser?.role || null;
}

export function isAdmin() {
  return state.currentUser?.data?.isAdmin === true;
}

export function isPsychologist() {
  return state.currentUser?.role === 'psychologist' || state.currentUser?.role === 'psych';
}

export function isPatient() {
  return state.currentUser?.role === 'patient';
}

// ============================================
// FUNCIONES PARA FILTRAR COLECCIONES
// ============================================

export function filtrarFichasIngresoVisibles() {
  const user = state.currentUser;
  if (!user) return [];
  
  if (user.data?.isAdmin) return state.fichasIngreso;
  
  const misPatientIds = state.patients
    .filter(p => p.psychId == user.data.id)
    .map(p => p.id);
    
  return state.fichasIngreso.filter(f => misPatientIds.includes(f.patientId));
}

export function filtrarSesionesVisibles() {
  const user = state.currentUser;
  if (!user) return [];
  
  if (user.data?.isAdmin) return state.sesiones;
  
  const misPatientIds = state.patients
    .filter(p => p.psychId == user.data.id)
    .map(p => p.id);
    
  return state.sesiones.filter(s => misPatientIds.includes(s.patientId));
}

export function filtrarInformesVisibles() {
  const user = state.currentUser;
  if (!user) return [];
  
  if (user.data?.isAdmin) return state.informes;
  
  const misPatientIds = state.patients
    .filter(p => p.psychId == user.data.id)
    .map(p => p.id);
    
  return state.informes.filter(i => misPatientIds.includes(i.patientId));
}

// ============================================
// FUNCIONES DE VERIFICACIÓN RÁPIDA
// ============================================

export function psicologoPuedeAccederAPaciente(psychId, patientId) {
  const patient = state.patients.find(p => p.id == patientId);
  return patient && patient.psychId == psychId;
}

export function pacienteTieneFichas(patientId) {
  return {
    fichaIngreso: state.fichasIngreso.some(f => f.patientId == patientId),
    sesiones: state.sesiones.some(s => s.patientId == patientId),
    informes: state.informes.some(i => i.patientId == patientId)
  };
}

export function getPermisosResumen() {
  const user = state.currentUser;
  if (!user) return null;
  
  return {
    esAdmin: isAdmin(),
    esPsicologo: isPsychologist(),
    esPaciente: isPatient(),
    puedeVerTodo: isAdmin(),
    puedeEditarTodo: isAdmin(),
    misPacientes: isPsychologist() 
      ? state.patients.filter(p => p.psychId == user.data.id).length 
      : 0
  };
}

// ============================================
// FUNCIONES DE VALIDACIÓN ESPECÍFICA
// ============================================

export function puedeRealizarAccion(tipo, action, id) {
  switch(tipo) {
    case 'fichaIngreso':
      if (action === 'ver') return puedeVerFichaIngreso(id);
      return puedeVerFichaIngreso(id) && puedeEditarFichas(state.fichasIngreso.find(f => f.id == id)?.patientId);
    
    case 'sesion':
      if (action === 'ver') return puedeVerSesion(id);
      return puedeVerSesion(id) && puedeEditarFichas(state.sesiones.find(s => s.id == id)?.patientId);
    
    case 'informe':
      if (action === 'ver') return puedeVerInforme(id);
      return puedeVerInforme(id) && puedeEditarFichas(state.informes.find(i => i.id == id)?.patientId);
    
    default:
      return false;
  }
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
    getPermisosResumen,
    filtrarFichasIngresoVisibles,
    filtrarSesionesVisibles,
    filtrarInformesVisibles,
    psicologoPuedeAccederAPaciente,
    pacienteTieneFichas
  };
}

console.log('✅ permisos.js cargado con funciones para fichas clínicas');