// js/modules/utils.js
import * as state from './state.js';

// ============================================
// CONFIGURACIÓN DE EMAILJS (TUS DATOS REALES)
// ============================================
const EMAILJS_SERVICE_ID = 'vinculo_salud';
const EMAILJS_TEMPLATE_ID = 'template_dhhwp7d';
const EMAILJS_USER_ID = '_LDTyGJlGKoOIWVJa'; // ← TU PUBLIC KEY

// ============================================
// FUNCIÓN PARA ENVIAR EMAILS CON EMAILJS (CORREGIDA)
// ============================================
export async function sendEmailNotification(to, subject, message, tipo = 'general') {
  console.log(`📧 Enviando email a: ${to} (${tipo})`);
  
  try {
    // Verificar que emailjs esté disponible
    if (typeof emailjs === 'undefined') {
      throw new Error('EmailJS no está cargado. Verifica que el script esté en index.html');
    }
    
    // Preparar parámetros según el tipo de email
    const templateParams = {
      to_email: to,
      patient_name: to.split('@')[0],
      appointment_date: new Date().toLocaleDateString('es-CL'),
      appointment_time: '10:00',
      professional_name: 'Profesional',
      appointment_type: 'online',
      appointment_price: '25000',
      message: message
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
// FUNCIÓN DE RESPALDO (OPCIONAL)
// ============================================
export function sendEmailFallback(to, subject, message) {
  console.log('📧 Usando fallback - simulación:');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Message:', message);
  
  const emailDiv = document.getElementById('emailSimulation');
  if (emailDiv) {
    emailDiv.innerHTML = `<strong>📧 SIMULACIÓN: Email a ${to}</strong><br>${subject}`;
    emailDiv.style.display = 'block';
    setTimeout(() => { emailDiv.style.display = 'none'; }, 5000);
  }
  
  showToast(`Simulación: Email enviado a ${to}`, 'info');
  return true;
}

// ============================================
// RESTO DE FUNCIONES (formatRut, validarRut, showToast, getPublicStaff)
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