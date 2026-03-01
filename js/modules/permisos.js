// js/modules/permisos.js
import state from './state.js';

export function puedeAccederAPaciente(patientId) {
  const user = state.currentUser;
  const patient = state.patients.find(p => p.id === patientId);
  
  if (!user || !patient) return false;
  
  // Admin puede todo
  if (user.data?.isAdmin) return true;
  
  // Psicólogo solo a sus pacientes asignados
  if (user.data?.role === 'psychologist' && patient.psychId === user.data.id) {
    return true;
  }
  
  return false;
}

export function puedeEditarFichas(patientId) {
  // Misma lógica que puedeAccederAPaciente
  // Por ahora es igual, pero podrías diferenciar si quieres permisos de solo lectura
  return puedeAccederAPaciente(patientId);
}

export function filtrarSoloMisPacientes(array, campoPatientId = 'patientId') {
  const user = state.currentUser;
  if (!user) return [];
  
  // Admin ve todo
  if (user.data?.isAdmin) return array;
  
  // Psicólogo ve solo lo de sus pacientes
  const misPatientIds = state.patients
    .filter(p => p.psychId === user.data.id)
    .map(p => p.id);
    
  return array.filter(item => misPatientIds.includes(item[campoPatientId]));
}