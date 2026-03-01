// js/modules/utils.js
import * as state from './state.js';

// ============================================
// CONFIGURACIÓN DE EMAILJS (TUS DATOS REALES)
// ============================================
const EMAILJS_SERVICE_ID = 'vinculo_salud';
const EMAILJS_TEMPLATE_ID = 'template_0cl1i1h';
const EMAILJS_USER_ID = '_LDTyGJlGKoOIWVJa';

// ============================================
// FUNCIÓN PARA ENVIAR EMAILS CON EMAILJS (VERSIÓN DEFINITIVA CON NOMBRE REAL)
// ============================================
export async function sendEmailNotification(to, subject, message, tipo = 'general', patientName = null, appointmentData = {}) {
  console.log(`📧 Enviando email a: ${to} (${tipo})`);
  
  try {
    // Verificar que emailjs esté disponible
    if (typeof emailjs === 'undefined') {
      throw new Error('EmailJS no está cargado. Verifica que el script esté en index.html');
    }
    
    // Limpiar el mensaje de caracteres problemáticos
    const mensajeLimpio = (message || 'Sin observaciones')
      .replace(/[<>]/g, '')        // Eliminar < y >
      .replace(/&/g, 'y')           // Cambiar & por "y"
      .replace(/\n/g, ' ')          // Saltos de línea a espacios
      .replace(/\s+/g, ' ')         // Múltiples espacios a uno
      .trim();

    // Usar el nombre real del paciente o extraer del email como fallback
    const nombreReal = patientName || to.split('@')[0] || 'Paciente';
    
    // Preparar parámetros con los datos reales de la cita
    const templateParams = {
      to_email: to,
      patient_name: nombreReal,  // ← AHORA USA EL NOMBRE REAL
      appointment_date: appointmentData.date || new Date().toLocaleDateString('es-CL'),
      appointment_time: appointmentData.time || '10:00',
      professional_name: appointmentData.professional || 'Profesional',
      appointment_type: appointmentData.type || 'online',
      appointment_price: appointmentData.price || '25000',
      message: mensajeLimpio
    };

    console.log('📤 Enviando con EmailJS...', templateParams);

    // Enviar usando EmailJS
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_USER_ID
    );

    console.log('✅ Email enviado correctamente:', response);
    
    // Mostrar en la interfaz
    const emailDiv = document.getElementById('emailSimulation');
    if (emailDiv) {
      emailDiv.innerHTML = `<strong>📧 Email enviado a ${to}</strong><br>${subject}`;
      emailDiv.style.display = 'block';
      setTimeout(() => { emailDiv.style.display = 'none'; }, 5000);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    // Mostrar más detalles si existen
    if (error.text) console.error('Texto del error:', error.text);
    return false;
  }
}

// ============================================
// FUNCIONES DE UTILIDAD PARA FICHAS CLÍNICAS
// ============================================

/**
 * Formatea una fecha al formato DD-MM-YYYY
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export function formatDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}-${month}-${year}`;
}

/**
 * Formatea una fecha al formato YYYY-MM-DD para inputs type="date"
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function formatDateForInput(date) {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene el nombre del profesional por su ID
 * @param {string|number} psychId - ID del profesional
 * @returns {string} Nombre del profesional o 'Desconocido'
 */
export function getPsychNameById(psychId) {
  if (!psychId) return 'No asignado';
  
  const psych = state.staff.find(p => p.id == psychId);
  return psych ? psych.name : 'Desconocido';
}

/**
 * Obtiene el nombre del paciente por su ID
 * @param {string|number} patientId - ID del paciente
 * @returns {string} Nombre del paciente o 'Desconocido'
 */
export function getPatientNameById(patientId) {
  if (!patientId) return 'Desconocido';
  
  const patient = state.patients.find(p => p.id == patientId);
  return patient ? patient.name : 'Desconocido';
}

/**
 * Calcula la edad a partir de la fecha de nacimiento
 * @param {string} birthdate - Fecha de nacimiento
 * @returns {number} Edad calculada
 */
export function calculateAge(birthdate) {
  if (!birthdate) return 0;
  
  const today = new Date();
  const birthDate = new Date(birthdate);
  if (isNaN(birthDate.getTime())) return 0;
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Obtiene las iniciales de un nombre
 * @param {string} name - Nombre completo
 * @returns {string} Iniciales (máx 2 caracteres)
 */
export function getInitials(name) {
  if (!name) return '??';
  
  const parts = name.split(' ').filter(p => p.length > 0);
  if (parts.length === 0) return '??';
  
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Trunca un texto a una longitud máxima
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
export function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
}

/**
 * Genera un ID único
 * @returns {string} ID único
 */
export function generateId() {
  return Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Verifica si un objeto está vacío
 * @param {Object} obj - Objeto a verificar
 * @returns {boolean} true si está vacío
 */
export function isEmpty(obj) {
  return !obj || Object.keys(obj).length === 0;
}

/**
 * Formatea un número como moneda CLP
 * @param {number} amount - Monto a formatear
 * @returns {string} Monto formateado
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '$0';
  
  return '$' + amount.toLocaleString('es-CL');
}

/**
 * Obtiene el color según el estado de pago
 * @param {string} status - Estado del pago
 * @returns {string} Color en CSS
 */
export function getPaymentStatusColor(status) {
  switch(status) {
    case 'pagado':
      return 'var(--verde-exito)';
    case 'pendiente':
      return 'var(--naranja-aviso)';
    case 'rechazado':
      return 'var(--rojo-alerta)';
    default:
      return 'var(--text-light)';
  }
}

/**
 * Obtiene el icono según el estado de pago
 * @param {string} status - Estado del pago
 * @returns {string} Clase de Font Awesome
 */
export function getPaymentStatusIcon(status) {
  switch(status) {
    case 'pagado':
      return 'fa-check-circle';
    case 'pendiente':
      return 'fa-clock';
    case 'rechazado':
      return 'fa-times-circle';
    default:
      return 'fa-question-circle';
  }
}

/**
 * Descarga un archivo JSON
 * @param {Object} data - Datos a descargar
 * @param {string} filename - Nombre del archivo
 */
export function downloadJSON(data, filename = 'datos.json') {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Abre un modal
 * @param {string} modalId - ID del modal
 */
export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
  }
}

/**
 * Cierra un modal
 * @param {string} modalId - ID del modal
 */
export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

// ============================================
// FUNCIONES ORIGINALES (SIN CAMBIOS)
// ============================================

export function formatRut(input) {
  let value = input.value.replace(/[^0-9kK]/g, '');
  if (value.length <= 1) {
    input.value = value;
    return;
  }
  let rut = value.slice(0, -1);
  let dv = value.slice(-1).toUpperCase();
  rut = rut.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  input.value = `${rut}-${dv}`;
}

export function validarRut(rutCompleto) {
  if (!rutCompleto) return false;
  const rutLimpio = rutCompleto.replace(/[.-]/g, '');
  if (rutLimpio.length < 2) return false;
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toUpperCase();
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i)) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  const dvEsperado = 11 - (suma % 11);
  const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : String(dvEsperado);
  return dvCalculado === dv;
}

export function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

export function getPublicStaff() {
  return state.staff.filter(s => s.spec && s.spec.length > 0 && !s.isHiddenAdmin);
}

// ============================================
// EXPORTAR FUNCIONES AL OBJETO WINDOW
// ============================================
if (typeof window !== 'undefined') {
  window.formatRut = formatRut;
  window.validarRut = validarRut;
  window.showToast = showToast;
  window.formatCurrency = formatCurrency;
  window.getInitials = getInitials;
  window.truncateText = truncateText;
  window.formatDate = formatDate;
  window.calculateAge = calculateAge;
  window.getPsychNameById = getPsychNameById;
  window.getPatientNameById = getPatientNameById;
}

console.log('✅ utils.js cargado con funciones de fichas clínicas');