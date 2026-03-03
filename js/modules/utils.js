// js/modules/utils.js
import * as state from './state.js';

// ============================================
// CONFIGURACIÓN DE EMAILJS (TUS DATOS REALES)
// ============================================
const EMAILJS_SERVICE_ID = 'vinculo_salud';
const EMAILJS_TEMPLATE_ID = 'template_0cl1i1h';
const EMAILJS_USER_ID = '_LDTyGJlGKoOIWVJa';

// Inicializar EmailJS si está disponible
if (typeof window !== 'undefined' && typeof emailjs !== 'undefined') {
    try {
        emailjs.init(EMAILJS_USER_ID);
        console.log('✅ EmailJS inicializado correctamente');
    } catch (error) {
        console.warn('⚠️ Error al inicializar EmailJS:', error);
    }
} else {
    console.warn('⚠️ EmailJS no disponible, usando modo simulación');
}

// ============================================
// VARIABLE GLOBAL PARA CONTROLAR EMAILS ENVIADOS (AGREGAR ESTO)
// ============================================
const emailsEnviados = new Set();

// ============================================
// FUNCIÓN PARA ENVIAR EMAILS CON EMAILJS (VERSIÓN CORREGIDA - SIN DUPLICADOS)
// ============================================
export async function sendEmailNotification(to, subject, message, tipo = 'general', patientName = null, appointmentData = {}) {
  
  // 🔥 CORRECCIÓN: Crear un ID único para este email
  const emailId = `${to}_${tipo}_${appointmentData.id || Date.now()}`;
  
  // Verificar si ya se envió este mismo email
  if (emailsEnviados.has(emailId)) {
    console.log(`⏭️ Email ya enviado anteriormente (${emailId}), omitiendo duplicado`);
    return true;
  }
  
  console.log(`📧 Enviando email a: ${to} (${tipo})`);
  
  try {
    // Verificar que el destinatario sea válido
    if (!to || to.trim() === '') {
      console.warn('⚠️ No se puede enviar email: destinatario vacío');
      return false;
    }

    // Verificar que emailjs esté disponible
    if (typeof emailjs === 'undefined') {
      console.warn('⚠️ EmailJS no está cargado. Usando modo simulación');
      simulateEmail(to, subject, message);
      
      // Marcar como enviado en simulación
      emailsEnviados.add(emailId);
      setTimeout(() => emailsEnviados.delete(emailId), 5000); // Limpiar después de 5 seg
      
      return true;
    }
    
    // Limpiar el mensaje de caracteres problemáticos
    const mensajeLimpio = (message || 'Sin observaciones')
      .replace(/[<>]/g, '')        // Eliminar < y >
      .replace(/&/g, 'y')           // Cambiar & por "y"
      .replace(/\n/g, ' ')          // Saltos de línea a espacios
      .replace(/\s+/g, ' ')         // Múltiples espacios a uno
      .trim();

    const nombreReal = patientName || to.split('@')[0] || 'Paciente';
    
    const templateParams = {
      to_email: to,
      to_name: nombreReal,
      reply_to: to,
      from_name: 'Vínculo Salud',
      patient_name: nombreReal,
      patient_email: to,
      appointment_date: appointmentData.date || new Date().toLocaleDateString('es-CL'),
      appointment_time: appointmentData.time || '10:00',
      professional_name: appointmentData.psych || appointmentData.professional || 'Profesional',
      appointment_type: appointmentData.type === 'online' ? 'Online' : 'Presencial',
      appointment_price: appointmentData.price || '25000',
      message: mensajeLimpio,
      subject: subject
    };

    console.log('📤 Enviando con EmailJS...', templateParams);

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_USER_ID
    );

    console.log('✅ Email enviado correctamente:', response);
    
    // 🔥 Marcar como enviado para evitar duplicados
    emailsEnviados.add(emailId);
    setTimeout(() => emailsEnviados.delete(emailId), 10000); // Limpiar después de 10 seg
    
    // Mostrar en la interfaz
    simulateEmail(to, subject, message, true);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    if (error.text) console.error('Texto del error:', error.text);
    
    simulateEmail(to, subject, message);
    return false;
  }
}

/**
 * Simula el envío de un email (para debugging)
 * @param {string} to - Destinatario
 * @param {string} subject - Asunto
 * @param {string} message - Mensaje
 * @param {boolean} isSuccess - Indica si fue exitoso
 */
function simulateEmail(to, subject, message, isSuccess = false) {
  console.log(`📧 [${isSuccess ? '✅' : '🔧'} SIMULACIÓN] Email a:`, to);
  console.log(`📧 [${isSuccess ? '✅' : '🔧'} SIMULACIÓN] Asunto:`, subject);
  
  const emailDiv = document.getElementById('emailSimulation');
  if (emailDiv) {
    const statusColor = isSuccess ? 'var(--exito)' : 'var(--atencion)';
    emailDiv.innerHTML = `
      <div style="background: ${statusColor}; color: white; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
        <strong>📧 ${isSuccess ? 'EMAIL ENVIADO' : 'SIMULACIÓN DE EMAIL'}</strong>
      </div>
      <strong>Para:</strong> ${to}<br>
      <strong>Asunto:</strong> ${subject}<br>
      <strong>Mensaje:</strong><br>${message.replace(/\n/g, '<br>')}
    `;
    emailDiv.style.display = 'block';
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
      emailDiv.style.display = 'none';
    }, 5000);
  }
}

/**
 * Envía email al profesional (DESACTIVADO - No se usa)
 */
export function sendEmailToProfessional(professional_email, subject, message, template, patient_name, appointment) {
  console.log('📧 [DESACTIVADO] No se envía email al profesional:', professional_email);
  return Promise.resolve(true);
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
      return 'var(--exito)';
    case 'pendiente':
      return 'var(--atencion)';
    case 'rechazado':
      return 'var(--peligro)';
    default:
      return 'var(--texto-secundario)';
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

console.log('✅ utils.js cargado con funciones de fichas clínicas y email corregido');