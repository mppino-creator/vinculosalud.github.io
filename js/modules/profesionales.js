// js/modules/profesionales.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast } from './utils.js';

// ============================================
// FUNCIONES DE ADMIN PARA PROFESIONALES
// ============================================

export function showAddStaffModal() {
    document.getElementById('addStaffModal').style.display = 'flex';
    document.getElementById('addName').value = '';
    document.getElementById('addEmail').value = '';
    document.getElementById('addSpec').selectedIndex = -1;
    document.getElementById('addUser').value = '';
    document.getElementById('addPass').value = '';
    document.getElementById('addWhatsapp').value = '';
    document.getElementById('addInstagram').value = '';
    document.getElementById('addAddress').value = '';
    document.getElementById('addPhone').value = '';
    document.getElementById('addPriceOnline').value = '';
    document.getElementById('addPricePresencial').value = '';
    document.getElementById('addBank').value = '';
    document.getElementById('addAccountType').value = 'corriente';
    document.getElementById('addAccountNumber').value = '';
    document.getElementById('addBankRut').value = '';
    document.getElementById('addBankEmail').value = '';
    document.getElementById('addPaymentLinkOnline').value = '';
    document.getElementById('addPaymentLinkPresencial').value = '';
    document.getElementById('addPhotoPreview').style.display = 'none';
    document.getElementById('addQrPreview').style.display = 'none';
    state.setTempImageData(null);
    state.setTempQrData(null);
}

export function closeAddStaffModal() {
    document.getElementById('addStaffModal').style.display = 'none';
}

export function renderStaffTable() {
    const tb = document.getElementById('staffTableBody');
    if (!tb) return;

    const visibleStaff = state.staff.filter(s => !s.isHiddenAdmin);
    tb.innerHTML = visibleStaff.map(p => {
        const specs = Array.isArray(p.spec) ? p.spec.join(', ') : p.spec;
        return `
        <tr>
            <td>${p.name}</td>
            <td>${p.email || '—'}</td>
            <td>${specs ? specs.substring(0, 30) + '...' : '—'}</td>
            <td>${p.usuario || p.name || '—'}</td>
            <td>$${p.priceOnline || 0}/$${p.pricePresencial || 0}</td>
            <td>${p.whatsapp || '—'}</td>
            <td>${p.instagram || '—'}</td>
            <td>
                ${p.paymentLinks?.online ? '✅ Online' : '❌ Online'}<br>
                ${p.paymentLinks?.presencial ? '✅ Presencial' : '❌ Presencial'}
            </td>
            <td>
                <button onclick="editTherapist('${p.id}')" class="btn-icon" style="background:var(--azul-medico); color:white;">
                    <i class="fa fa-edit"></i>
                </button>
                <button onclick="deleteStaff('${p.id}')" class="btn-icon" style="background:var(--rojo-alerta); color:white;">
                    <i class="fa fa-trash"></i>
                </button>
            </td>
        </tr>
    `}).join('');
}

export function addStaff() {
    const name = document.getElementById('addName').value;
    const email = document.getElementById('addEmail').value;
    const specSelect = document.getElementById('addSpec');
    const selectedSpecs = Array.from(specSelect.selectedOptions).map(opt => opt.value);
    const priceOnline = document.getElementById('addPriceOnline').value;
    const pricePresencial = document.getElementById('addPricePresencial').value;
    const usuario = document.getElementById('addUser').value;
    const pass = document.getElementById('addPass').value;
    const whatsapp = document.getElementById('addWhatsapp')?.value || '';
    const instagram = document.getElementById('addInstagram')?.value || '';
    const address = document.getElementById('addAddress')?.value || '';
    const phone = document.getElementById('addPhone')?.value || '';
    const bank = document.getElementById('addBank')?.value || '';
    const accountType = document.getElementById('addAccountType')?.value || 'corriente';
    const accountNumber = document.getElementById('addAccountNumber')?.value || '';
    const bankRut = document.getElementById('addBankRut')?.value || '';
    const bankEmail = document.getElementById('addBankEmail')?.value || '';
    
    const paymentLinkOnline = document.getElementById('addPaymentLinkOnline')?.value || '';
    const paymentLinkPresencial = document.getElementById('addPaymentLinkPresencial')?.value || '';
    
    if (!name || !email || selectedSpecs.length === 0 || !priceOnline || !pricePresencial || !usuario || !pass) {
        showToast('Completa todos los campos obligatorios', 'error');
        return;
    }

    if (state.staff.some(s => s.usuario === usuario)) {
        showToast('El usuario ya existe', 'error');
        return;
    }

    // Crear nuevo profesional (sin isAdmin por defecto)
    const nuevoProfesional = {
        id: String(Date.now()),
        name: name,
        email: email,
        spec: selectedSpecs,
        priceOnline: parseInt(priceOnline),
        pricePresencial: parseInt(pricePresencial),
        usuario: usuario,
        pass: pass,
        whatsapp: whatsapp,
        instagram: instagram,
        img: state.tempImageData || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500',
        address: address,
        phone: phone,
        bankDetails: {
            bank: bank,
            accountType: accountType,
            accountNumber: accountNumber,
            rut: bankRut,
            email: bankEmail
        },
        paymentMethods: { ...state.globalPaymentMethods },
        stars: 5,
        sessionDuration: 45,
        breakBetween: 10,
        availability: {},
        paymentLinks: {
            online: paymentLinkOnline,
            presencial: paymentLinkPresencial,
            qrCode: state.tempQrData || ''
        },
        isAdmin: false, // Por defecto, ningún profesional es admin
        isHiddenAdmin: false,
        createdAt: new Date().toISOString()
    };

    state.staff.push(nuevoProfesional);
    import('../main.js').then(main => main.save());
    closeAddStaffModal();
    renderStaffTable();
    showToast('Profesional añadido', 'success');
}

export function editTherapist(id) {
    const therapist = state.staff.find(s => s.id == id);
    if (!therapist) return;
    
    document.getElementById('editTherapistId').value = therapist.id;
    document.getElementById('editName').value = therapist.name || '';
    document.getElementById('editEmail').value = therapist.email || '';
    
    const editSpecSelect = document.getElementById('editSpec');
    const therapistSpecs = Array.isArray(therapist.spec) ? therapist.spec : [therapist.spec];
    Array.from(editSpecSelect.options).forEach(opt => {
        opt.selected = therapistSpecs.includes(opt.value);
    });
    
    document.getElementById('editUser').value = therapist.usuario || '';
    document.getElementById('editPass').value = '';
    document.getElementById('editWhatsapp').value = therapist.whatsapp || '';
    document.getElementById('editInstagram').value = therapist.instagram || '';
    document.getElementById('editAddress').value = therapist.address || '';
    document.getElementById('editPhone').value = therapist.phone || '';
    document.getElementById('editPriceOnline').value = therapist.priceOnline || '';
    document.getElementById('editPricePresencial').value = therapist.pricePresencial || '';
    
    const bank = therapist.bankDetails || {};
    document.getElementById('editBank').value = bank.bank || '';
    document.getElementById('editAccountType').value = bank.accountType || 'corriente';
    document.getElementById('editAccountNumber').value = bank.accountNumber || '';
    document.getElementById('editBankRut').value = bank.rut || '';
    document.getElementById('editBankEmail').value = bank.email || '';
    
    document.getElementById('editPaymentLinkOnline').value = therapist.paymentLinks?.online || '';
    document.getElementById('editPaymentLinkPresencial').value = therapist.paymentLinks?.presencial || '';
    if (therapist.paymentLinks?.qrCode) {
        document.getElementById('editQrPreview').src = therapist.paymentLinks.qrCode;
        document.getElementById('editQrPreview').style.display = 'block';
    } else {
        document.getElementById('editQrPreview').style.display = 'none';
    }
    
    if (therapist.img) {
        document.getElementById('editPhotoPreview').src = therapist.img;
        document.getElementById('editPhotoPreview').style.display = 'block';
    } else {
        document.getElementById('editPhotoPreview').style.display = 'none';
    }
    
    state.setTempImageData(null);
    state.setTempQrData(null);
    document.getElementById('editTherapistModal').style.display = 'flex';
}

export function closeEditTherapistModal() {
    document.getElementById('editTherapistModal').style.display = 'none';
}

export function updateTherapist() {
    const id = document.getElementById('editTherapistId').value;
    const therapist = state.staff.find(s => s.id == id);
    if (!therapist) return;

    therapist.name = document.getElementById('editName').value;
    therapist.email = document.getElementById('editEmail').value;
    
    const editSpecSelect = document.getElementById('editSpec');
    therapist.spec = Array.from(editSpecSelect.selectedOptions).map(opt => opt.value);
    
    therapist.usuario = document.getElementById('editUser').value;
    therapist.whatsapp = document.getElementById('editWhatsapp').value;
    therapist.instagram = document.getElementById('editInstagram').value;
    therapist.address = document.getElementById('editAddress').value;
    therapist.phone = document.getElementById('editPhone').value;
    therapist.priceOnline = parseInt(document.getElementById('editPriceOnline').value);
    therapist.pricePresencial = parseInt(document.getElementById('editPricePresencial').value);
    
    therapist.bankDetails = {
        bank: document.getElementById('editBank').value,
        accountType: document.getElementById('editAccountType').value,
        accountNumber: document.getElementById('editAccountNumber').value,
        rut: document.getElementById('editBankRut').value,
        email: document.getElementById('editBankEmail').value
    };

    therapist.paymentLinks = {
        online: document.getElementById('editPaymentLinkOnline').value,
        presencial: document.getElementById('editPaymentLinkPresencial').value,
        qrCode: state.tempQrData || therapist.paymentLinks?.qrCode || ''
    };

    if (state.tempImageData) {
        therapist.img = state.tempImageData;
    }

    const newPass = document.getElementById('editPass').value;
    if (newPass) therapist.pass = newPass;

    import('../main.js').then(main => main.save());
    closeEditTherapistModal();
    renderStaffTable();
    showToast('Profesional actualizado', 'success');
}

export function deleteStaff(id) {
    const therapist = state.staff.find(s => s.id == id);
    if (therapist?.isHiddenAdmin) {
        showToast('No se puede eliminar al admin', 'error');
        return;
    }
    
    if (confirm('¿Eliminar profesional y todos sus datos?')) {
        // Eliminar citas asociadas
        state.appointments = state.appointments.filter(a => a.psychId != id);
        
        // Eliminar pacientes asociados (o reasignarlos? mejor eliminar por ahora)
        state.patients = state.patients.filter(p => p.psychId != id);
        
        // ============================================
        // NUEVO: Eliminar también fichas clínicas asociadas
        // ============================================
        // Obtener IDs de pacientes que tenía este profesional
        const patientIds = state.patients
            .filter(p => p.psychId == id)
            .map(p => p.id);
        
        // Eliminar fichas de ingreso de esos pacientes
        state.fichasIngreso = state.fichasIngreso.filter(f => !patientIds.includes(f.patientId));
        
        // Eliminar sesiones de esos pacientes
        state.sesiones = state.sesiones.filter(s => !patientIds.includes(s.patientId));
        
        // Eliminar informes de esos pacientes
        state.informes = state.informes.filter(i => !patientIds.includes(i.patientId));
        
        // Finalmente eliminar al profesional
        state.staff = state.staff.filter(s => s.id != id);
        
        import('../main.js').then(main => main.save());
        showToast('Profesional y todos sus datos eliminados', 'success');
    }
}

// ============================================
// NUEVAS FUNCIONES PARA GESTIÓN DE PROFESIONALES CON FICHAS
// ============================================

/**
 * Obtiene el resumen de actividad de un profesional
 * @param {string} psychId - ID del profesional
 * @returns {Object} Resumen con estadísticas
 */
export function getPsychologistSummary(psychId) {
    const psych = state.staff.find(s => s.id == psychId);
    if (!psych) return null;
    
    // Pacientes asignados
    const misPacientes = state.patients.filter(p => p.psychId == psychId);
    const misPatientIds = misPacientes.map(p => p.id);
    
    // Citas
    const misCitas = state.appointments.filter(a => a.psychId == psychId);
    const citasPagadas = misCitas.filter(a => a.paymentStatus === 'pagado');
    const citasPendientes = misCitas.filter(a => a.paymentStatus === 'pendiente');
    
    // Ingresos
    const ingresosTotales = citasPagadas.reduce((sum, a) => sum + (a.price || 0), 0);
    const ingresosMes = citasPagadas
        .filter(a => {
            const fecha = new Date(a.date);
            const ahora = new Date();
            return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
        })
        .reduce((sum, a) => sum + (a.price || 0), 0);
    
    // ============================================
    // NUEVO: Estadísticas de fichas clínicas
    // ============================================
    const fichasIngreso = state.fichasIngreso.filter(f => misPatientIds.includes(f.patientId));
    const sesiones = state.sesiones.filter(s => misPatientIds.includes(s.patientId));
    const informes = state.informes.filter(i => misPatientIds.includes(i.patientId));
    
    return {
        profesional: {
            id: psych.id,
            nombre: psych.name,
            email: psych.email
        },
        pacientes: {
            total: misPacientes.length,
            conFichaIngreso: fichasIngreso.length,
            sinFichaIngreso: misPacientes.length - fichasIngreso.length
        },
        citas: {
            total: misCitas.length,
            pagadas: citasPagadas.length,
            pendientes: citasPendientes.length
        },
        ingresos: {
            total: ingresosTotales,
            mes: ingresosMes
        },
        fichasClinicas: {
            fichasIngreso: fichasIngreso.length,
            sesiones: sesiones.length,
            informes: informes.length,
            promedioSesionesPorPaciente: misPacientes.length > 0 
                ? (sesiones.length / misPacientes.length).toFixed(1) 
                : 0
        }
    };
}

/**
 * Obtiene todos los pacientes de un profesional con sus fichas clínicas
 * @param {string} psychId - ID del profesional
 * @returns {Array} Lista de pacientes enriquecida
 */
export function getPatientsWithClinicalData(psychId) {
    const misPacientes = state.patients.filter(p => p.psychId == psychId);
    
    return misPacientes.map(patient => {
        const fichas = state.fichasIngreso.filter(f => f.patientId == patient.id);
        const sesiones = state.sesiones.filter(s => s.patientId == patient.id);
        const informes = state.informes.filter(i => i.patientId == patient.id);
        const citas = state.appointments.filter(a => a.patientId == patient.id);
        
        return {
            ...patient,
            estadisticas: {
                totalSesiones: sesiones.length,
                totalCitas: citas.length,
                totalPagado: citas
                    .filter(a => a.paymentStatus === 'pagado')
                    .reduce((sum, a) => sum + (a.price || 0), 0),
                tieneFichaIngreso: fichas.length > 0,
                ultimaSesion: sesiones.length > 0 
                    ? sesiones.sort((a, b) => new Date(b.fechaAtencion) - new Date(a.fechaAtencion))[0].fechaAtencion
                    : null,
                informes: informes.length
            }
        };
    });
}

/**
 * Verifica si un profesional tiene acceso a un paciente específico
 * @param {string} psychId - ID del profesional
 * @param {string} patientId - ID del paciente
 * @returns {boolean} true si tiene acceso
 */
export function canPsychologistAccessPatient(psychId, patientId) {
    const patient = state.patients.find(p => p.id == patientId);
    return patient && patient.psychId == psychId;
}

/**
 * Obtiene las últimas sesiones de un profesional
 * @param {string} psychId - ID del profesional
 * @param {number} limit - Límite de resultados
 * @returns {Array} Últimas sesiones
 */
export function getRecentSessions(psychId, limit = 10) {
    const misPatientIds = state.patients
        .filter(p => p.psychId == psychId)
        .map(p => p.id);
    
    return state.sesiones
        .filter(s => misPatientIds.includes(s.patientId))
        .sort((a, b) => new Date(b.fechaAtencion) - new Date(a.fechaAtencion))
        .slice(0, limit)
        .map(s => {
            const patient = state.patients.find(p => p.id == s.patientId);
            return {
                ...s,
                patientName: patient?.name || 'Desconocido',
                patientRut: patient?.rut || ''
            };
        });
}

/**
 * Carga las especialidades en los selects de los modales
 */
export function loadSpecialtiesInSelects() {
    const addSpecSelect = document.getElementById('addSpec');
    const editSpecSelect = document.getElementById('editSpec');
    
    if (!addSpecSelect || !editSpecSelect) return;
    
    const specialtiesHtml = state.specialties
        .map(s => `<option value="${s.name}">${s.name}</option>`)
        .join('');
    
    addSpecSelect.innerHTML = specialtiesHtml;
    editSpecSelect.innerHTML = specialtiesHtml;
}

// ============================================
// EXPORTAR FUNCIONES AL OBJETO WINDOW
// ============================================
if (typeof window !== 'undefined') {
    window.getPsychologistSummary = getPsychologistSummary;
    window.getPatientsWithClinicalData = getPatientsWithClinicalData;
    window.canPsychologistAccessPatient = canPsychologistAccessPatient;
    window.getRecentSessions = getRecentSessions;
    window.loadSpecialtiesInSelects = loadSpecialtiesInSelects;
}

console.log('✅ profesionales.js cargado con funciones de fichas clínicas');