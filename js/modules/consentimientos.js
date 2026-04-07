// js/modules/consentimientos.js
// Módulo de Consentimiento Informado - Integración completa

import { db } from '../config/firebase.js';
import { ref, push, set, get, onValue, update, query, orderByChild, equalTo } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js';

// Estado local
let currentConsentimientos = [];
let currentUser = null;

// ============================================
// INICIALIZACIÓN
// ============================================
export function initConsentimientos(user) {
    currentUser = user;
    cargarConsentimientosAdmin();
}

// ============================================
// FUNCIONES PARA ADMIN (dentro del dashboard)
// ============================================

// Cargar todos los consentimientos para admin
export function cargarConsentimientosAdmin() {
    const consentimientosRef = ref(db, 'consentimientos');
    onValue(consentimientosRef, (snapshot) => {
        const data = snapshot.val();
        currentConsentimientos = [];
        if (data) {
            Object.keys(data).forEach(key => {
                currentConsentimientos.push({ id: key, ...data[key] });
            });
            currentConsentimientos.sort((a, b) => 
                new Date(b.fechaFirma) - new Date(a.fechaFirma)
            );
        }
        // Disparar evento para actualizar UI
        window.dispatchEvent(new CustomEvent('consentimientosActualizados', { 
            detail: currentConsentimientos 
        }));
    });
}

// Verificar si un paciente específico ya firmó
export async function pacienteYaFirmo(rutPaciente) {
    const consentimientosRef = ref(db, 'consentimientos');
    const snapshot = await get(consentimientosRef);
    const data = snapshot.val();
    if (!data) return false;
    
    return Object.values(data).some(c => c.paciente?.rut === rutPaciente);
}

// Obtener consentimiento de un paciente por RUT
export async function getConsentimientoByRut(rutPaciente) {
    const consentimientosRef = ref(db, 'consentimientos');
    const snapshot = await get(consentimientosRef);
    const data = snapshot.val();
    if (!data) return null;
    
    const encontrado = Object.entries(data).find(([key, val]) => val.paciente?.rut === rutPaciente);
    if (encontrado) {
        return { id: encontrado[0], ...encontrado[1] };
    }
    return null;
}

// Obtener estadísticas
export function getEstadisticasConsentimientos() {
    const total = currentConsentimientos.length;
    const hoy = new Date().toISOString().split('T')[0];
    const hoyCount = currentConsentimientos.filter(c => c.fechaFirma?.startsWith(hoy)).length;
    const pendientes = currentConsentimientos.filter(c => !c.pdfEnviado).length;
    
    return { total, hoyCount, pendientes };
}

// Generar link único para paciente (con token o solo RUT encodeado)
export function generarLinkConsentimiento(rutPaciente, nombrePaciente) {
    // Opción simple: encodeamos el RUT en base64 para que no sea tan obvio
    const token = btoa(rutPaciente);
    const baseUrl = window.location.origin;
    return `${baseUrl}/consentimiento.html?token=${token}&nombre=${encodeURIComponent(nombrePaciente)}`;
}

// ============================================
// FUNCIONES PARA EL PACIENTE (en consentimiento.html)
// ============================================

// Obtener IP del usuario
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'No disponible';
    }
}

// Generar PDF del consentimiento
export async function generarPDFConsentimiento(datosPaciente) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.setTextColor(26, 60, 52);
    doc.text('CONSENTIMIENTO INFORMADO', 105, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Fecha: ${new Date().toLocaleString('es-CL')}`, 20, 45);
    doc.text(`Paciente: ${datosPaciente.nombre}`, 20, 60);
    doc.text(`RUT: ${datosPaciente.rut}`, 20, 70);
    doc.text(`Email: ${datosPaciente.email || 'No registrado'}`, 20, 80);
    doc.text(`Profesional: ${datosPaciente.profesional || 'Equipo Vínculo Salud'}`, 20, 95);
    
    doc.setFontSize(10);
    doc.text('El paciente declara haber leído, comprendido y aceptado todas las condiciones', 20, 125);
    doc.text('del Consentimiento Informado para el proceso de atención psicológica.', 20, 135);
    doc.text('Este documento tiene validez legal según Ley 20.584 y Ley 21.331.', 20, 155);
    doc.text('La firma digital (nombre+RUT) tiene el mismo valor que una firma manuscrita.', 20, 165);
    
    doc.setFontSize(12);
    doc.text('_________________________', 70, 200);
    doc.text(datosPaciente.nombre, 70, 210);
    doc.text('Firma digital del paciente', 70, 220);
    
    return doc.output('dataurlstring');
}

// Firmar consentimiento (llamada desde consentimiento.html)
export async function firmarConsentimiento(datosFirma) {
    const { nombre, rut, email, aceptaciones, profesionalAsignado } = datosFirma;
    
    try {
        // Verificar si ya firmó antes
        const yaFirmo = await pacienteYaFirmo(rut);
        if (yaFirmo) {
            return { success: false, error: 'Este RUT ya ha firmado el consentimiento anteriormente.' };
        }
        
        const ip = await getUserIP();
        const fechaFirma = new Date().toISOString();
        
        const datosConsentimiento = {
            paciente: {
                nombre: nombre,
                rut: rut,
                email: email || 'No proporcionado'
            },
            profesionalAsignado: profesionalAsignado || 'Equipo Vínculo Salud',
            fechaFirma: fechaFirma,
            ip: ip,
            userAgent: navigator.userAgent,
            aceptaciones: aceptaciones,
            pdfEnviado: false,
            fechaRevocacion: null
        };
        
        // Guardar en Firebase
        const consentimientosRef = ref(db, 'consentimientos');
        const newRef = await push(consentimientosRef, datosConsentimiento);
        
        // Generar y guardar PDF
        const pdfDataUrl = await generarPDFConsentimiento({ 
            nombre, 
            rut, 
            email,
            profesional: profesionalAsignado 
        });
        await set(ref(db, `consentimientos/${newRef.key}/pdfBase64`), pdfDataUrl);
        
        return { success: true, id: newRef.key, pdfDataUrl: pdfDataUrl };
        
    } catch (error) {
        console.error('Error al guardar consentimiento:', error);
        return { success: false, error: error.message };
    }
}

// Revocar consentimiento
export async function revocarConsentimiento(consentimientoId, rutPaciente) {
    try {
        const consentimientoRef = ref(db, `consentimientos/${consentimientoId}`);
        await update(consentimientoRef, {
            fechaRevocacion: new Date().toISOString(),
            revocado: true
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Filtrar consentimientos para admin
export function filtrarConsentimientos(filtros) {
    const { searchTerm, fechaInicio, fechaFin, soloPendientes } = filtros;
    
    return currentConsentimientos.filter(c => {
        let match = true;
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const nombre = (c.paciente?.nombre || '').toLowerCase();
            const rut = (c.paciente?.rut || '').toLowerCase();
            match = match && (nombre.includes(term) || rut.includes(term));
        }
        
        if (fechaInicio) {
            match = match && (c.fechaFirma >= fechaInicio);
        }
        
        if (fechaFin) {
            const fin = new Date(fechaFin);
            fin.setHours(23, 59, 59);
            match = match && (new Date(c.fechaFirma) <= fin);
        }
        
        if (soloPendientes) {
            match = match && (!c.pdfEnviado);
        }
        
        return match;
    });
}