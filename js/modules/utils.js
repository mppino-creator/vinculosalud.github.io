// js/modules/utils.js
import * as state from './state.js';

// ============================================
// CONFIGURACIÓN DE EMAILJS
// ============================================
const EMAILJS_SERVICE_ID = 'vinculo_salud';
const EMAILJS_TEMPLATE_ID = 'template_abc123'; // ← PON EL NUEVO ID
const EMAILJS_USER_ID = '_LDTyGJlGKoOIWVJa';

// ============================================
// FUNCIÓN PARA ENVIAR EMAILS (VERSIÓN DEFINITIVA)
// ============================================
export async function sendEmailNotification(to, subject, message, tipo = 'general') {
  console.log(`📧 Enviando email a: ${to}`);
  
  try {
    // Limpiar el mensaje de caracteres problemáticos
    const mensajeLimpio = (message || 'Sin observaciones')
      .replace(/[<>]/g, '')        // Eliminar < y >
      .replace(/&/g, 'y')           // Cambiar & por "y"
      .replace(/\n/g, ' ')          // Saltos de línea a espacios
      .replace(/\s+/g, ' ')         // Múltiples espacios a uno
      .trim();

    const templateParams = {
      to_email: to,
      patient_name: to.split('@')[0] || 'Paciente',
      appointment_date: new Date().toLocaleDateString('es-CL'),
      appointment_time: '10:00',
      professional_name: 'Profesional',
      appointment_type: 'online',
      appointment_price: '25000',
      message: mensajeLimpio
    };

    console.log('📤 Enviando:', templateParams);

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_USER_ID
    );

    console.log('✅ Email enviado:', response);
    
    // Mostrar en interfaz
    const emailDiv = document.getElementById('emailSimulation');
    if (emailDiv) {
      emailDiv.innerHTML = `<strong>📧 Email enviado a ${to}</strong>`;
      emailDiv.style.display = 'block';
      setTimeout(() => emailDiv.style.display = 'none', 5000);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// ============================================
// RESTO DE FUNCIONES (sin cambios)
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