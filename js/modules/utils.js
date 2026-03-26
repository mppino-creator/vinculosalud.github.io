// js/modules/utils.js
import * as state from './state.js';

// ============================================
// CONFIGURACIÓN DE EMAILJS
// ============================================
const EMAILJS_SERVICE_ID = 'vinculo_salud';
const EMAILJS_TEMPLATE_ID = 'template_0cl1i1h';
const EMAILJS_USER_ID = '_LDTyGJlGKoOIWVJa';

// Inicializar EmailJS si está disponible
if (typeof window !== 'undefined' && typeof emailjs !== 'undefined') {
    try {
        emailjs.init(EMAILJS_USER_ID);
        console.log('✅ EmailJS inicializado');
    } catch (error) {
        console.warn('⚠️ Error al inicializar EmailJS');
    }
} else {
    console.warn('⚠️ EmailJS no disponible, modo simulación');
}

const emailsEnviados = new Set();

// ============================================
// FUNCIÓN PARA VERIFICAR SI UN EMAIL ES DE PROFESIONAL
// ============================================
export function esEmailProfesional(email) {
    if (!email) return false;
    
    const emailsProfesionales = state.staff
        .map(p => p.email)
        .filter(email => email && email.trim() !== '')
        .map(e => e.trim().toLowerCase());
    
    const emailLimpio = email.trim().toLowerCase();
    const esProfesional = emailsProfesionales.includes(emailLimpio);
    
    if (esProfesional) {
        console.warn('🚫 EMAIL DE PROFESIONAL DETECTADO:', email);
    }
    
    return esProfesional;
}

// ============================================
// FUNCIÓN PARA ENVIAR EMAILS
// ============================================
export async function sendEmailNotification(to, subject, message, tipo = 'general', patientName = null, appointmentData = {}) {
    const emailId = `${to}_${tipo}_${appointmentData.id || Date.now()}`;
    
    if (emailsEnviados.has(emailId)) {
        console.log(`⏭️ Email ya enviado (${emailId})`);
        return true;
    }
    
    console.log(`📧 Enviando email a: ${to} (${tipo})`);
    
    try {
        if (!to || to.trim() === '') {
            console.warn('⚠️ Destinatario vacío');
            return false;
        }

        if (typeof emailjs === 'undefined') {
            console.warn('⚠️ EmailJS no disponible, simulando');
            simulateEmail(to, subject, message);
            emailsEnviados.add(emailId);
            setTimeout(() => emailsEnviados.delete(emailId), 5000);
            return true;
        }
        
        const mensajeLimpio = (message || '')
            .replace(/[<>]/g, '')
            .replace(/\n/g, ' ')
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
            appointment_time: appointmentData.time || '',
            professional_name: appointmentData.psych || 'Profesional',
            appointment_type: appointmentData.type === 'online' ? 'Online' : 'Presencial',
            appointment_price: appointmentData.price || '0',
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

        console.log('✅ Email enviado:', response);
        
        emailsEnviados.add(emailId);
        setTimeout(() => emailsEnviados.delete(emailId), 10000);
        
        simulateEmail(to, subject, message, true);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error:', error);
        simulateEmail(to, subject, message);
        return false;
    }
}

function simulateEmail(to, subject, message, isSuccess = false) {
    console.log(`📧 [SIMULACIÓN] ${isSuccess ? '✅' : '🔧'} ${to}`);
    
    const emailDiv = document.getElementById('emailSimulation');
    if (emailDiv) {
        const statusColor = isSuccess ? 'var(--exito)' : 'var(--atencion)';
        emailDiv.innerHTML = `
            <div style="background: ${statusColor}; color: white; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
                <strong>📧 ${isSuccess ? 'EMAIL ENVIADO' : 'SIMULACIÓN'}</strong>
            </div>
            <strong>Para:</strong> ${to}<br>
            <strong>Asunto:</strong> ${subject}
        `;
        emailDiv.style.display = 'block';
        setTimeout(() => emailDiv.style.display = 'none', 5000);
    }
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

export function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return `${d.getDate().toString().padStart(2,'0')}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getFullYear()}`;
}

export function formatDateForInput(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

export function getPsychNameById(psychId) {
    if (!psychId) return 'No asignado';
    const psych = state.staff.find(p => p.id == psychId);
    return psych ? psych.name : 'Desconocido';
}

export function getPatientNameById(patientId) {
    if (!patientId) return 'Desconocido';
    const patient = state.patients.find(p => p.id == patientId);
    return patient ? patient.name : 'Desconocido';
}

/**
 * Calcula la edad a partir de una fecha de nacimiento.
 * @param {string} birthdate - Fecha en formato YYYY-MM-DD o similar
 * @returns {number} Edad en años
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
 * Alias de calculateAge para mantener compatibilidad con admin.js
 */
export function calcularEdad(birthdate) {
    return calculateAge(birthdate);
}

export function getInitials(name) {
    if (!name) return '??';
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length === 0) return '??';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

export function generateId() {
    return Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

export function isEmpty(obj) {
    return !obj || Object.keys(obj).length === 0;
}

export function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '$0';
    return '$' + amount.toLocaleString('es-CL');
}

export function getPaymentStatusColor(status) {
    switch(status) {
        case 'pagado': return 'var(--exito)';
        case 'pendiente': return 'var(--atencion)';
        case 'rechazado': return 'var(--peligro)';
        default: return 'var(--texto-secundario)';
    }
}

export function getPaymentStatusIcon(status) {
    switch(status) {
        case 'pagado': return 'fa-check-circle';
        case 'pendiente': return 'fa-clock';
        case 'rechazado': return 'fa-times-circle';
        default: return 'fa-question-circle';
    }
}

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

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

export function sendEmailToProfessional(professional_email, subject, message, template, patient_name, appointment) {
    console.log('📧 [DESACTIVADO] No se envía email al profesional:', professional_email);
    return Promise.resolve(true);
}

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
// EXPORTAR FUNCIONES AL WINDOW (para compatibilidad)
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
    window.calcularEdad = calcularEdad;     // Alias para admin.js
    window.getPsychNameById = getPsychNameById;
    window.getPatientNameById = getPatientNameById;
    window.esEmailProfesional = esEmailProfesional;
}

console.log('✅ utils.js actualizado con calcularEdad y alias');