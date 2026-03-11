// js/modules/permisos.js
import * as state from './state.js';

// ============================================
// FUNCIONES BÁSICAS DE PERMISOS - VERSIÓN ASÍNCRONA CON REINTENTOS
// ============================================

/**
 * Verifica si un usuario puede acceder a un paciente específico
 * @param {string|number} patientId - ID del paciente
 * @param {number} intento - Número de intento (para recursión, no usar manualmente)
 * @returns {Promise<boolean>} true si tiene acceso
 */
export async function puedeAccederAPaciente(patientId, intento = 1) {
  console.log(`🔍 Verificando permisos para paciente: ${patientId} (intento ${intento})`);
  
  // 1. Verificar que tenemos el estado
  if (!state) {
    console.log('❌ state no disponible');
    return false;
  }
  
  // 2. Verificar usuario
  const user = state.currentUser;
  if (!user) {
    // Reintentar hasta 5 veces con espera de 100ms
    if (intento < 5) {
      console.log(`⏳ Usuario no disponible, reintentando en 100ms... (intento ${intento}/5)`);
      await new Promise(resolve => setTimeout(resolve, 100));
      return puedeAccederAPaciente(patientId, intento + 1);
    }
    
    console.log('❌ No hay usuario logueado después de 5 intentos');
    return false;
  }
  
  console.log('👤 Usuario encontrado:', user.data?.name || user.name);
  console.log('👤 Role:', user.role);
  
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
  const userId = user.data?.id || user.id;
  
  if (!userId) {
    console.log('❌ No se pudo determinar el ID del usuario');
    return false;
  }
  
  console.log(`🔍 Comparando: psychId=${patient.psychId} (${typeof patient.psychId}) vs userId=${userId} (${typeof userId})`);
  
  const tieneAcceso = patient.psychId == userId;
  console.log(`✅ Resultado: ${tieneAcceso ? 'ACCESO CONCEDIDO' : 'ACCESO DENEGADO'}`);
  
  return tieneAcceso;
}

/**
 * Verifica si un usuario puede editar fichas de un paciente
 */
export async function puedeEditarFichas(patientId) {
  return await puedeAccederAPaciente(patientId);
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

export async function puedeVerFichaIngreso(fichaIngresoId) {
  const ficha = state.fichasIngreso?.find(f => f.id == fichaIngresoId);
  return ficha ? await puedeAccederAPaciente(ficha.patientId) : false;
}

export async function puedeVerSesion(sesionId) {
  const sesion = state.sesiones?.find(s => s.id == sesionId);
  return sesion ? await puedeAccederAPaciente(sesion.patientId) : false;
}

export async function puedeVerInforme(informeId) {
  const informe = state.informes?.find(i => i.id == informeId);
  return informe ? await puedeAccederAPaciente(informe.patientId) : false;
}

export async function puedeEditarFichaIngreso(patientId) {
  return await puedeEditarFichas(patientId);
}

export async function puedeEditarSesion(patientId) {
  return await puedeEditarFichas(patientId);
}

export async function puedeEditarInforme(patientId) {
  return await puedeEditarFichas(patientId);
}

// ============================================
// FUNCIONES PARA PROFESIONALES Y ADMIN
// ============================================

/**
 * Verifica si el usuario actual puede editar un profesional específico
 * @param {string|number} professionalId - ID del profesional
 * @returns {boolean} true si puede editar
 */
export function puedeEditarProfesional(professionalId) {
  const user = state.currentUser;
  if (!user) return false;
  
  // Admin puede editar cualquier profesional
  if (user.role === 'admin' || user.data?.isAdmin) return true;
  
  // Psicólogo solo puede editar su propio perfil
  const userId = user.data?.id || user.id;
  return userId == professionalId;
}

/**
 * Verifica si el usuario actual puede ver estadísticas
 */
export function puedeVerEstadisticas() {
  const user = state.currentUser;
  if (!user) return false;
  
  // Admin y psicólogos pueden ver estadísticas
  return user.role === 'admin' || user.role === 'psych';
}

/**
 * Verifica si el usuario actual puede exportar datos a Excel
 */
export function puedeExportarExcel() {
  const user = state.currentUser;
  if (!user) return false;
  
  // Solo admin puede exportar datos completos
  return user.role === 'admin' || user.data?.isAdmin === true;
}

/**
 * Verifica si el usuario actual puede editar textos del sitio
 */
export function puedeEditarTextosSitio() {
  const user = state.currentUser;
  if (!user) return false;
  
  // Solo admin puede editar textos del sitio
  return user.role === 'admin' || user.data?.isAdmin === true;
}

// ============================================
// FUNCIONES DE PERMISOS POR ROL (síncronas)
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
      : 0,
    puedeEditarTextos: puedeEditarTextosSitio(),
    puedeExportarExcel: puedeExportarExcel(),
    puedeVerEstadisticas: puedeVerEstadisticas()
  };
}

// ============================================
// FUNCIONES PARA VERIFICAR ACCESO A MÓDULOS
// ============================================

/**
 * Verifica si el usuario puede acceder al módulo de pacientes
 */
export function puedeVerPacientes() {
  const user = state.currentUser;
  if (!user) return false;
  
  // Admin y psicólogos pueden ver pacientes
  return user.role === 'admin' || user.role === 'psych';
}

/**
 * Verifica si el usuario puede acceder al módulo de citas
 */
export function puedeVerCitas() {
  const user = state.currentUser;
  if (!user) return false;
  
  // Admin y psicólogos pueden ver citas
  return user.role === 'admin' || user.role === 'psych';
}

/**
 * Verifica si el usuario puede acceder al módulo de profesionales
 */
export function puedeVerProfesionales() {
  const user = state.currentUser;
  if (!user) return false;
  
  // Solo admin puede ver lista de profesionales
  return user.role === 'admin';
}

// ============================================
// EXPORTAR FUNCIONES AL OBJETO WINDOW
// ============================================
if (typeof window !== 'undefined') {
  window.permisos = {
    // Funciones principales
    puedeAccederAPaciente,
    puedeEditarFichas,
    filtrarSoloMisPacientes,
    
    // Fichas clínicas
    puedeVerFichaIngreso,
    puedeVerSesion,
    puedeVerInforme,
    puedeEditarFichaIngreso,
    puedeEditarSesion,
    puedeEditarInforme,
    
    // Profesionales y admin
    puedeEditarProfesional,
    puedeVerEstadisticas,
    puedeExportarExcel,
    puedeEditarTextosSitio,
    
    // Módulos
    puedeVerPacientes,
    puedeVerCitas,
    puedeVerProfesionales,
    
    // Roles
    isAdmin,
    isPsychologist,
    getPermisosResumen
  };
  console.log('✅ window.permisos expuesto correctamente');
}

console.log('✅ permisos.js cargado con funciones para fichas clínicas, profesionales y módulos (versión asíncrona, sin boxes)');