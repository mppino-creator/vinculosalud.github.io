// js/modules/permisos.js
import state from './state.js';

// ============================================
// FUNCIONES BÁSICAS DE PERMISOS
// ============================================

/**
 * Verifica si un usuario puede acceder a un paciente específico
 * @param {string|number} patientId - ID del paciente
 * @returns {boolean} true si tiene acceso
 */
export function puedeAccederAPaciente(patientId) {
  const user = state.currentUser;
  const patient = state.patients.find(p => p.id == patientId);
  
  if (!user || !patient) return false;
  
  // Admin puede todo
  if (user.data?.isAdmin) return true;
  
  // Psicólogo solo a sus pacientes asignados
  if (user.data?.role === 'psychologist' && patient.psychId == user.data.id) {
    return true;
  }
  
  return false;
}

/**
 * Verifica si un usuario puede editar fichas de un paciente
 * @param {string|number} patientId - ID del paciente
 * @returns {boolean} true si puede editar
 */
export function puedeEditarFichas(patientId) {
  // Por ahora es igual que acceder, pero podría diferenciarse
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
// NUEVAS FUNCIONES PARA FICHAS CLÍNICAS
// ============================================

/**
 * Verifica si un usuario puede ver una ficha de ingreso específica
 * @param {string|number} fichaIngresoId - ID de la ficha
 * @returns {boolean} true si tiene acceso
 */
export function puedeVerFichaIngreso(fichaIngresoId) {
  const user = state.currentUser;
  if (!user) return false;
  
  const ficha = state.fichasIngreso.find(f => f.id == fichaIngresoId);
  if (!ficha) return false;
  
  // Admin puede todo
  if (user.data?.isAdmin) return true;
  
  // Psicólogo solo si es su paciente
  const patient = state.patients.find(p => p.id == ficha.patientId);
  return patient && patient.psychId == user.data.id;
}

/**
 * Verifica si un usuario puede ver una sesión específica
 * @param {string|number} sesionId - ID de la sesión
 * @returns {boolean} true si tiene acceso
 */
export function puedeVerSesion(sesionId) {
  const user = state.currentUser;
  if (!user) return false;
  
  const sesion = state.sesiones.find(s => s.id == sesionId);
  if (!sesion) return false;
  
  // Admin puede todo
  if (user.data?.isAdmin) return true;
  
  // Psicólogo solo si es su paciente
  const patient = state.patients.find(p => p.id == sesion.patientId);
  return patient && patient.psychId == user.data.id;
}

/**
 * Verifica si un usuario puede ver un informe específico
 * @param {string|number} informeId - ID del informe
 * @returns {boolean} true si tiene acceso
 */
export function puedeVerInforme(informeId) {
  const user = state.currentUser;
  if (!user) return false;
  
  const informe = state.informes.find(i => i.id == informeId);
  if (!informe) return false;
  
  // Admin puede todo
  if (user.data?.isAdmin) return true;
  
  // Psicólogo solo si es su paciente
  const patient = state.patients.find(p => p.id == informe.patientId);
  return patient && patient.psychId == user.data.id;
}

/**
 * Verifica si un usuario puede crear/editar una ficha de ingreso
 * @param {string|number} patientId - ID del paciente
 * @returns {boolean} true si puede editar
 */
export function puedeEditarFichaIngreso(patientId) {
  return puedeEditarFichas(patientId);
}

/**
 * Verifica si un usuario puede crear/editar una sesión
 * @param {string|number} patientId - ID del paciente
 * @returns {boolean} true si puede editar
 */
export function puedeEditarSesion(patientId) {
  return puedeEditarFichas(patientId);
}

/**
 * Verifica si un usuario puede crear/editar un informe
 * @param {string|number} patientId - ID del paciente
 * @returns {boolean} true si puede editar
 */
export function puedeEditarInforme(patientId) {
  return puedeEditarFichas(patientId);
}

// ============================================
// FUNCIONES DE PERMISOS POR ROL
// ============================================

/**
 * Obtiene el rol del usuario actual
 * @returns {string|null} Rol del usuario o null si no hay sesión
 */
export function getCurrentUserRole() {
  return state.currentUser?.role || null;
}

/**
 * Verifica si el usuario actual es administrador
 * @returns {boolean} true si es admin
 */
export function isAdmin() {
  return state.currentUser?.data?.isAdmin === true;
}

/**
 * Verifica si el usuario actual es psicólogo
 * @returns {boolean} true si es psicólogo
 */
export function isPsychologist() {
  return state.currentUser?.role === 'psychologist';
}

/**
 * Verifica si el usuario actual es paciente (si aplica en el futuro)
 * @returns {boolean} true si es paciente
 */
export function isPatient() {
  return state.currentUser?.role === 'patient';
}

// ============================================
// FUNCIONES PARA FILTRAR COLECCIONES COMPLETAS
// ============================================

/**
 * Filtra las fichas de ingreso según permisos del usuario
 * @returns {Array} Fichas de ingreso visibles
 */
export function filtrarFichasIngresoVisibles() {
  const user = state.currentUser;
  if (!user) return [];
  
  // Admin ve todas
  if (user.data?.isAdmin) return state.fichasIngreso;
  
  // Psicólogo ve solo las de sus pacientes
  const misPatientIds = state.patients
    .filter(p => p.psychId == user.data.id)
    .map(p => p.id);
    
  return state.fichasIngreso.filter(f => misPatientIds.includes(f.patientId));
}

/**
 * Filtra las sesiones según permisos del usuario
 * @returns {Array} Sesiones visibles
 */
export function filtrarSesionesVisibles() {
  const user = state.currentUser;
  if (!user) return [];
  
  // Admin ve todas
  if (user.data?.isAdmin) return state.sesiones;
  
  // Psicólogo ve solo las de sus pacientes
  const misPatientIds = state.patients
    .filter(p => p.psychId == user.data.id)
    .map(p => p.id);
    
  return state.sesiones.filter(s => misPatientIds.includes(s.patientId));
}

/**
 * Filtra los informes según permisos del usuario
 * @returns {Array} Informes visibles
 */
export function filtrarInformesVisibles() {
  const user = state.currentUser;
  if (!user) return [];
  
  // Admin ve todos
  if (user.data?.isAdmin) return state.informes;
  
  // Psicólogo ve solo los de sus pacientes
  const misPatientIds = state.patients
    .filter(p => p.psychId == user.data.id)
    .map(p => p.id);
    
  return state.informes.filter(i => misPatientIds.includes(i.patientId));
}

// ============================================
// FUNCIONES DE VERIFICACIÓN RÁPIDA
// ============================================

/**
 * Verifica si un profesional puede acceder a un paciente específico
 * @param {string|number} psychId - ID del profesional
 * @param {string|number} patientId - ID del paciente
 * @returns {boolean} true si tiene acceso
 */
export function psicologoPuedeAccederAPaciente(psychId, patientId) {
  const patient = state.patients.find(p => p.id == patientId);
  return patient && patient.psychId == psychId;
}

/**
 * Verifica si un paciente tiene fichas clínicas
 * @param {string|number} patientId - ID del paciente
 * @returns {Object} Objeto con booleanos por tipo
 */
export function pacienteTieneFichas(patientId) {
  return {
    fichaIngreso: state.fichasIngreso.some(f => f.patientId == patientId),
    sesiones: state.sesiones.some(s => s.patientId == patientId),
    informes: state.informes.some(i => i.patientId == patientId)
  };
}

/**
 * Obtiene el resumen de permisos del usuario actual
 * @returns {Object} Resumen de permisos
 */
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
// FUNCIONES DE VALIDACIÓN PARA ACCIONES ESPECÍFICAS
// ============================================

/**
 * Valida si el usuario puede realizar una acción sobre una ficha
 * @param {string} tipo - Tipo de ficha ('fichaIngreso'|'sesion'|'informe')
 * @param {string} action - Acción ('ver'|'editar'|'eliminar')
 * @param {string|number} id - ID del elemento
 * @returns {boolean} true si puede realizar la acción
 */
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