// js/modules/utils.js
import * as state from './state.js';

// Toast
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

// Formateo de RUT
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

// Validación de RUT
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

// Obtener profesionales públicos (no admin)
export function getPublicStaff() {
    return state.staff.filter(s => s.spec && s.spec.length > 0 && !s.isHiddenAdmin);
}

// Simulación de correo (puedes reemplazar con envío real)
export function sendEmailNotification(to, subject, message) {
    console.log(`📧 Simulación de correo a: ${to}`);
    console.log(`📧 Asunto: ${subject}`);
    console.log(`📧 Mensaje: ${message}`);
    const emailDiv = document.getElementById('emailSimulation');
    if (emailDiv) {
        emailDiv.innerHTML = `<strong>📧 Correo enviado a ${to}</strong><br>Asunto: ${subject}<br>${message.substring(0, 100)}...`;
        emailDiv.style.display = 'block';
        setTimeout(() => { emailDiv.style.display = 'none'; }, 5000);
    }
    showToast(`Correo simulado enviado a ${to}`, 'success');
    return true;
}