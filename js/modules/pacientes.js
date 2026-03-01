// js/modules/pacientes.js
import * as state from './state.js';
import { showToast, validarRut, formatRut, formatDate, calculateAge, getInitials } from './utils.js';
import { puedeAccederAPaciente, puedeEditarFichas } from './permisos.js';
import { obtenerSesionesDePaciente, obtenerFichaIngreso } from './fichasClinicas.js';
import { obtenerInformesDePaciente } from './informes.js';

// ============================================
// RENDERIZAR LISTA DE PACIENTES (MEJORADA)
// ============================================

export function renderPatients() {
    const container = document.getElementById('patientsList');
    if (!container) return;

    const searchTerm = document.getElementById('patientSearch')?.value.toLowerCase() || '';

    let filteredPatients = state.currentUser?.role === 'admin' 
        ? state.patients 
        : state.patients.filter(p => p.psychId == state.currentUser?.data?.id);

    filteredPatients = filteredPatients.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        p.email.toLowerCase().includes(searchTerm) ||
        (p.rut && p.rut.includes(searchTerm))
    );

    if (filteredPatients.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">No hay pacientes</div>';
        return;
    }

    container.innerHTML = filteredPatients.map(p => {
        const patientApps = state.appointments.filter(a => a.patientId == p.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        const nextAppt = patientApps.find(a => new Date(a.date + 'T' + a.time) > new Date());
        const totalSessions = patientApps.length;
        const totalPaid = patientApps.reduce((sum, a) => sum + (a.paymentStatus === 'pagado' ? a.price : 0), 0);
        const totalAmount = patientApps.reduce((sum, a) => sum + a.price, 0);
        const recentApps = patientApps.slice(0, 3);
        
        // ============================================
        // NUEVO: Obtener información de fichas clínicas
        // ============================================
        const tieneFichaIngreso = state.fichasIngreso.some(f => f.patientId == p.id);
        const totalSesionesRegistradas = state.sesiones.filter(s => s.patientId == p.id).length;
        const ultimaSesion = state.sesiones
            .filter(s => s.patientId == p.id)
            .sort((a, b) => new Date(b.fechaAtencion) - new Date(a.fechaAtencion))[0];

        return `
            <div class="patient-card">
                <div class="patient-header">
                    <span class="patient-name">${p.name}</span>
                    <div style="display:flex; gap:5px;">
                        ${tieneFichaIngreso ? '<span class="badge" style="background:var(--verde-exito);">📋 Ficha</span>' : ''}
                        <span class="badge" style="background:var(--azul-medico);">${totalSessions} citas</span>
                    </div>
                </div>
                
                <div class="patient-contact">
                    <span><i class="fa fa-id-card"></i> ${p.rut || 'Sin RUT'}</span>
                    <span><i class="fa fa-envelope"></i> ${p.email}</span>
                    ${p.phone ? `<span><i class="fa fa-phone"></i> ${p.phone}</span>` : ''}
                </div>
                
                <div style="display:flex; gap:15px; margin-top:10px; font-size:0.8rem;">
                    <span><i class="fa fa-credit-card"></i> Pagado: $${totalPaid.toLocaleString()}</span>
                    <span><i class="fa fa-clock"></i> Total: $${totalAmount.toLocaleString()}</span>
                </div>
                
                ${totalSesionesRegistradas > 0 ? `
                    <div style="background:#e6f7e6; padding:8px; border-radius:8px; margin-top:10px;">
                        <i class="fa fa-file-text"></i> ${totalSesionesRegistradas} sesiones registradas
                        ${ultimaSesion ? `<br><small>Última: ${formatDate(ultimaSesion.fechaAtencion)}</small>` : ''}
                    </div>
                ` : ''}
                
                ${nextAppt ? `
                    <div style="background:#e6f7e6; padding:8px; border-radius:8px; margin-top:10px;">
                        <i class="fa fa-calendar-check"></i> Próxima: ${nextAppt.date} ${nextAppt.time} con ${nextAppt.psych}
                        ${nextAppt.boxName ? `<span class="history-box">${nextAppt.boxName}</span>` : ''}
                    </div>
                ` : ''}
                
                ${recentApps.length > 0 ? `
                    <div class="patient-history">
                        <strong>Últimas atenciones:</strong>
                        ${recentApps.map(a => `
                            <div class="history-item">
                                <span class="history-date">${a.date}</span>
                                <span class="history-psych">${a.psych}</span>
                                <span class="history-type">${a.type === 'online' ? '🌐' : '🏢'}</span>
                                ${a.boxName ? `<span class="history-box">${a.boxName}</span>` : ''}
                                <span class="history-amount">$${a.price.toLocaleString()}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <!-- BOTONES DE ACCIÓN -->
                <div style="margin-top:15px; display:flex; gap:10px;">
                    <button class="btn-icon" onclick="verFichaCompleta('${p.id}')" 
                            style="background: var(--azul-apple); color: white; flex:1;">
                        <i class="fa fa-folder-medical"></i> Ver Ficha Clínica
                    </button>
                    <button class="btn-icon" onclick="viewPatientDetails(${p.id})" 
                            style="background: var(--text-light); color: white;">
                        <i class="fa fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// FUNCIONES PARA DETALLE DE PACIENTE CON PESTAÑAS
// ============================================

// Mostrar detalle completo del paciente con pestañas
export async function mostrarDetallePaciente(patientId) {
    if (!puedeAccederAPaciente(patientId)) {
        showToast('No tienes permisos para ver este paciente', 'error');
        return;
    }
    
    const patient = state.patients.find(p => p.id == patientId);
    if (!patient) return;
    
    state.ui.fichas.pacienteSeleccionadoId = patientId;
    state.ui.fichas.pestanaActiva = 'perfil';
    
    // Mostrar loader
    const container = document.getElementById('patientsList');
    if (container) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">Cargando ficha del paciente...</div>';
    }
    
    // Cargar datos del paciente
    const sesiones = await obtenerSesionesDePaciente(patientId);
    const fichaIngreso = await obtenerFichaIngreso(patientId);
    const informes = await obtenerInformesDePaciente(patientId);
    
    renderDetallePaciente(patient, sesiones, fichaIngreso, informes);
}

// Renderizar el detalle con pestañas
function renderDetallePaciente(patient, sesiones = [], fichaIngreso = null, informes = []) {
    const container = document.getElementById('patientsList');
    if (!container) return;
    
    const edad = calculateAge(patient.birthdate);
    const iniciales = getInitials(patient.name);
    
    const html = `
        <div class="detalle-paciente">
            <!-- HEADER -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; background:white; padding:20px; border-radius:12px;">
                <div style="display:flex; align-items:center; gap:15px;">
                    <div style="width:60px; height:60px; background:var(--azul-apple); border-radius:30px; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:24px;">
                        ${iniciales}
                    </div>
                    <div>
                        <h2 style="margin:0;">${patient.name}</h2>
                        <p style="margin:5px 0 0; color:#666;">${patient.rut} · ${edad} años</p>
                    </div>
                </div>
                <button class="btn-icon" onclick="renderPatients()" 
                        style="background: var(--text-light); color: white;">
                    <i class="fa fa-arrow-left"></i> Volver
                </button>
            </div>
            
            <!-- TABS -->
            <div class="tabs-container" style="display:flex; gap:5px; margin-bottom:20px; background:white; padding:10px; border-radius:12px;">
                <button class="tab-btn ${state.ui.fichas.pestanaActiva === 'perfil' ? 'active' : ''}" 
                        onclick="cambiarPestana('perfil')" 
                        style="padding:10px 20px; border:none; background:${state.ui.fichas.pestanaActiva === 'perfil' ? 'var(--azul-apple)' : '#f0f0f0'}; color:${state.ui.fichas.pestanaActiva === 'perfil' ? 'white' : '#333'}; border-radius:8px; cursor:pointer; flex:1;">
                    <i class="fa fa-user"></i> Perfil
                </button>
                <button class="tab-btn ${state.ui.fichas.pestanaActiva === 'fichaIngreso' ? 'active' : ''}" 
                        onclick="cambiarPestana('fichaIngreso')"
                        style="padding:10px 20px; border:none; background:${state.ui.fichas.pestanaActiva === 'fichaIngreso' ? 'var(--azul-apple)' : '#f0f0f0'}; color:${state.ui.fichas.pestanaActiva === 'fichaIngreso' ? 'white' : '#333'}; border-radius:8px; cursor:pointer; flex:1;">
                    <i class="fa fa-file-text"></i> Ficha Ingreso
                </button>
                <button class="tab-btn ${state.ui.fichas.pestanaActiva === 'sesiones' ? 'active' : ''}" 
                        onclick="cambiarPestana('sesiones')"
                        style="padding:10px 20px; border:none; background:${state.ui.fichas.pestanaActiva === 'sesiones' ? 'var(--azul-apple)' : '#f0f0f0'}; color:${state.ui.fichas.pestanaActiva === 'sesiones' ? 'white' : '#333'}; border-radius:8px; cursor:pointer; flex:1;">
                    <i class="fa fa-calendar"></i> Sesiones (${sesiones.length})
                </button>
                <button class="tab-btn ${state.ui.fichas.pestanaActiva === 'informes' ? 'active' : ''}" 
                        onclick="cambiarPestana('informes')"
                        style="padding:10px 20px; border:none; background:${state.ui.fichas.pestanaActiva === 'informes' ? 'var(--azul-apple)' : '#f0f0f0'}; color:${state.ui.fichas.pestanaActiva === 'informes' ? 'white' : '#333'}; border-radius:8px; cursor:pointer; flex:1;">
                    <i class="fa fa-file-pdf"></i> Informes (${informes.length})
                </button>
            </div>
            
            <!-- CONTENIDO SEGÚN PESTAÑA -->
            <div class="tab-content">
                ${renderPestanaActual(patient, sesiones, fichaIngreso, informes)}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Renderizar pestaña actual
function renderPestanaActual(patient, sesiones, fichaIngreso, informes) {
    switch(state.ui.fichas.pestanaActiva) {
        case 'perfil':
            return renderPerfil(patient, sesiones, informes);
        case 'fichaIngreso':
            return renderFichaIngreso(patient, fichaIngreso);
        case 'sesiones':
            return renderSesiones(patient, sesiones);
        case 'informes':
            return renderInformes(patient, informes);
        default:
            return renderPerfil(patient, sesiones, informes);
    }
}

// ============================================
// RENDERIZADO DE CADA PESTAÑA
// ============================================

// Renderizar perfil del paciente (MEJORADO)
function renderPerfil(patient, sesiones = [], informes = []) {
    const edad = calculateAge(patient.birthdate);
    const totalSesiones = sesiones.length;
    const totalInformes = informes.length;
    const citas = state.appointments.filter(a => a.patientId == patient.id);
    const totalPagado = citas.reduce((sum, a) => sum + (a.paymentStatus === 'pagado' ? a.price : 0), 0);
    
    return `
        <div class="perfil-paciente" style="background:white; padding:20px; border-radius:12px;">
            <h3>📋 Datos Personales</h3>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-top:15px;">
                <div><strong>RUT:</strong> ${patient.rut || '—'}</div>
                <div><strong>Email:</strong> ${patient.email}</div>
                <div><strong>Teléfono:</strong> ${patient.phone || '—'}</div>
                <div><strong>Fecha Nac.:</strong> ${patient.birthdate || '—'} (${edad} años)</div>
                <div><strong>Notas:</strong> ${patient.notes || '—'}</div>
                <div><strong>Registrado:</strong> ${patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : '—'}</div>
            </div>
            
            <h3 style="margin-top:30px;">📊 Estadísticas</h3>
            <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:15px; margin-top:15px;">
                <div style="background:#f8fafc; padding:15px; border-radius:10px; text-align:center;">
                    <div style="font-size:24px; font-weight:bold; color:var(--azul-apple);">${citas.length}</div>
                    <div style="font-size:12px; color:#666;">Citas totales</div>
                </div>
                <div style="background:#f8fafc; padding:15px; border-radius:10px; text-align:center;">
                    <div style="font-size:24px; font-weight:bold; color:var(--verde-exito);">${totalSesiones}</div>
                    <div style="font-size:12px; color:#666;">Sesiones registradas</div>
                </div>
                <div style="background:#f8fafc; padding:15px; border-radius:10px; text-align:center;">
                    <div style="font-size:24px; font-weight:bold; color:var(--naranja-aviso);">$${totalPagado.toLocaleString()}</div>
                    <div style="font-size:12px; color:#666;">Total pagado</div>
                </div>
                <div style="background:#f8fafc; padding:15px; border-radius:10px; text-align:center;">
                    <div style="font-size:24px; font-weight:bold; color:var(--azul-medico);">${totalInformes}</div>
                    <div style="font-size:12px; color:#666;">Informes</div>
                </div>
            </div>
            
            <div style="margin-top:20px; display:flex; gap:10px;">
                <button class="btn-icon" onclick="viewPatientDetails(${patient.id})" 
                        style="background: var(--azul-apple); color: white;">
                    <i class="fa fa-edit"></i> Editar Datos
                </button>
                <button class="btn-icon" onclick="printPatientSummary()" 
                        style="background: var(--text-light); color: white;">
                    <i class="fa fa-print"></i> Imprimir Resumen
                </button>
                <button class="btn-icon" onclick="exportarFichaCompleta('${patient.id}')" 
                        style="background: var(--verde-exito); color: white;">
                    <i class="fa fa-download"></i> Exportar Todo
                </button>
            </div>
        </div>
    `;
}

// Renderizar ficha de ingreso (MEJORADA)
function renderFichaIngreso(patient, fichaIngreso) {
    if (!fichaIngreso) {
        return `
            <div style="text-align:center; padding:40px; background:white; border-radius:12px;">
                <i class="fa fa-file-text" style="font-size:48px; color:#ccc;"></i>
                <p style="margin:20px 0; color:#666;">No hay ficha de ingreso para este paciente.</p>
                <button class="btn-icon" onclick="window.fichasClinicas?.mostrarFormularioFichaIngreso('${patient.id}')" 
                        style="background: var(--verde-exito); color: white;">
                    <i class="fa fa-plus"></i> Crear Ficha de Ingreso
                </button>
            </div>
        `;
    }
    
    return `
        <div class="ficha-ingreso" style="background:white; padding:20px; border-radius:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="margin:0;">📝 Ficha de Ingreso</h3>
                <div style="display:flex; gap:10px;">
                    <button class="btn-icon" onclick="window.fichasClinicas?.editarFichaIngreso('${fichaIngreso.id}')" 
                            style="background: var(--azul-apple); color: white;">
                        <i class="fa fa-edit"></i> Editar
                    </button>
                    <button class="btn-icon" onclick="window.pdfGenerator?.generarFichaIngresoPDF(${JSON.stringify(fichaIngreso).replace(/"/g, '&quot;')})" 
                            style="background: var(--verde-exito); color: white;">
                        <i class="fa fa-file-pdf"></i> PDF
                    </button>
                </div>
            </div>
            
            <div style="display:grid; gap:20px;">
                <div style="background:#f8fafc; padding:15px; border-radius:8px;">
                    <h4 style="margin:0 0 10px 0; color:var(--azul-apple);">Motivo de Consulta</h4>
                    <p style="margin:0;">${fichaIngreso.motivoConsulta || '—'}</p>
                </div>
                
                <div style="background:#f8fafc; padding:15px; border-radius:8px;">
                    <h4 style="margin:0 0 10px 0; color:var(--azul-apple);">Sintomatología</h4>
                    <p><strong>Inicio:</strong> ${fichaIngreso.sintomatologia?.fechaInicio || '—'}</p>
                    <p><strong>Progresión:</strong> ${fichaIngreso.sintomatologia?.progresion || '—'}</p>
                    <p><strong>Tratamientos previos:</strong> ${fichaIngreso.sintomatologia?.tratamientosPrevios || '—'}</p>
                    <p><strong>Medicamentos:</strong> ${fichaIngreso.sintomatologia?.medicamentos || '—'}</p>
                </div>
                
                <div style="background:#f8fafc; padding:15px; border-radius:8px;">
                    <h4 style="margin:0 0 10px 0; color:var(--azul-apple);">Composición Familiar</h4>
                    <p>${fichaIngreso.composicionFamiliar || '—'}</p>
                </div>
                
                <div style="background:#f8fafc; padding:15px; border-radius:8px;">
                    <h4 style="margin:0 0 10px 0; color:var(--azul-apple);">Otros Antecedentes</h4>
                    <p>${fichaIngreso.otrosAntecedentes || '—'}</p>
                </div>
                
                ${fichaIngreso.criteriosExclusion ? `
                    <div style="background:#f8fafc; padding:15px; border-radius:8px;">
                        <h4 style="margin:0 0 10px 0; color:var(--azul-apple);">Criterios de Exclusión</h4>
                        <ul style="margin:0;">
                            <li>Trastornos psiquiátricos: ${fichaIngreso.criteriosExclusion.trastornosPsiquiatricos ? '✅' : '❌'}</li>
                            <li>TCA grave: ${fichaIngreso.criteriosExclusion.tcaGrave ? '✅' : '❌'}</li>
                            <li>Consumo de sustancias: ${fichaIngreso.criteriosExclusion.consumoSustancias ? '✅' : '❌'}</li>
                            <li>Abuso/violencia: ${fichaIngreso.criteriosExclusion.abusoViolencia ? '✅' : '❌'}</li>
                            <li>Ideación suicida activa: ${fichaIngreso.criteriosExclusion.ideacionSuicidaActiva ? '✅' : '❌'}</li>
                        </ul>
                    </div>
                ` : ''}
            </div>
            
            <p style="margin-top:20px; font-size:12px; color:#999; text-align:right;">
                Creado: ${new Date(fichaIngreso.fechaCreacion).toLocaleString()}
            </p>
        </div>
    `;
}

// Renderizar sesiones (MEJORADA)
function renderSesiones(patient, sesiones) {
    const sesionesHtml = sesiones.map(s => `
        <div class="sesion-item" style="background:white; padding:15px; border-radius:8px; margin-bottom:10px; border-left:4px solid var(--azul-apple);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${formatDate(s.fechaAtencion)} · ${s.tipoAtencion || 'Sesión'}</strong>
                    <p style="margin:5px 0 0; color:#666; font-size:14px;">${s.notas?.substring(0, 200)}${s.notas?.length > 200 ? '...' : ''}</p>
                </div>
                <div style="display:flex; gap:5px;">
                    <button class="btn-icon" onclick="window.fichasClinicas?.verNotaSesion('${s.id}')" 
                            style="background: var(--azul-apple); color: white; padding:5px 10px;">
                        <i class="fa fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="window.pdfGenerator?.generarNotaSesionPDF(${JSON.stringify(s).replace(/"/g, '&quot;')})" 
                            style="background: var(--verde-exito); color: white; padding:5px 10px;">
                        <i class="fa fa-file-pdf"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    return `
        <div class="sesiones-container" style="background:white; padding:20px; border-radius:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="margin:0;">📅 Notas de Evolución</h3>
                <button class="btn-icon" onclick="window.fichasClinicas?.mostrarFormularioNotaSesion('${patient.id}')" 
                        style="background: var(--verde-exito); color: white;">
                    <i class="fa fa-plus"></i> Nueva Nota
                </button>
            </div>
            
            ${sesiones.length > 0 ? sesionesHtml : `
                <div style="text-align:center; padding:40px;">
                    <i class="fa fa-calendar" style="font-size:48px; color:#ccc;"></i>
                    <p style="margin:20px 0; color:#666;">No hay sesiones registradas</p>
                </div>
            `}
        </div>
    `;
}

// Renderizar informes (MEJORADA)
function renderInformes(patient, informes) {
    const informesHtml = informes.map(i => `
        <div class="informe-item" style="background:white; padding:15px; border-radius:8px; margin-bottom:10px; border-left:4px solid var(--naranja-aviso);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${i.tipo === 'psicodiagnostico' ? '📋 Psicodiagnóstico' : '📄 Cierre de Proceso'}</strong>
                    <p style="margin:5px 0 0; color:#666; font-size:12px;">${new Date(i.fechaCreacion).toLocaleDateString()}</p>
                </div>
                <div style="display:flex; gap:5px;">
                    <button class="btn-icon" onclick="window.informes?.verInforme('${i.id}')" 
                            style="background: var(--azul-apple); color: white; padding:5px 10px;">
                        <i class="fa fa-eye"></i>
                    </button>
                    ${i.pdfUrl ? `
                        <button class="btn-icon" onclick="window.open('${i.pdfUrl}')" 
                                style="background: var(--verde-exito); color: white; padding:5px 10px;">
                            <i class="fa fa-file-pdf"></i>
                        </button>
                    ` : `
                        <button class="btn-icon" onclick="window.informes?.generarPDFInforme('${i.id}')" 
                                style="background: var(--verde-exito); color: white; padding:5px 10px;">
                            <i class="fa fa-file-pdf"></i> Generar
                        </button>
                    `}
                </div>
            </div>
        </div>
    `).join('');
    
    return `
        <div class="informes-container" style="background:white; padding:20px; border-radius:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="margin:0;">📄 Informes</h3>
                <div style="display:flex; gap:10px;">
                    <button class="btn-icon" onclick="window.informes?.mostrarFormularioInforme('${patient.id}', 'psicodiagnostico')" 
                            style="background: var(--azul-apple); color: white;">
                        <i class="fa fa-file"></i> Nuevo Psicodiagnóstico
                    </button>
                    <button class="btn-icon" onclick="window.informes?.mostrarFormularioInforme('${patient.id}', 'cierre')" 
                            style="background: var(--naranja-aviso); color: white;">
                        <i class="fa fa-file"></i> Cierre de Proceso
                    </button>
                </div>
            </div>
            
            ${informes.length > 0 ? informesHtml : `
                <div style="text-align:center; padding:40px;">
                    <i class="fa fa-file-pdf" style="font-size:48px; color:#ccc;"></i>
                    <p style="margin:20px 0; color:#666;">No hay informes generados</p>
                </div>
            `}
        </div>
    `;
}

// ============================================
// FUNCIONES DE NAVEGACIÓN
// ============================================

// Cambiar pestaña
export function cambiarPestana(pestana) {
    state.ui.fichas.pestanaActiva = pestana;
    mostrarDetallePaciente(state.ui.fichas.pacienteSeleccionadoId);
}

// Volver a la lista de pacientes
export function volverALista() {
    renderPatients();
}

// ============================================
// FUNCIONES DE EXPORTACIÓN
// ============================================

// Exportar ficha completa del paciente
export async function exportarFichaCompleta(patientId) {
    if (!puedeAccederAPaciente(patientId)) {
        showToast('No tienes permisos para exportar esta ficha', 'error');
        return;
    }
    
    showToast('Preparando exportación...', 'info');
    
    try {
        const result = await window.pdfGenerator?.exportarFichaCompletaPaciente(patientId);
        if (result?.success) {
            showToast('Ficha exportada correctamente', 'success');
        } else {
            showToast('Error al exportar la ficha', 'error');
        }
    } catch (error) {
        console.error('Error exportando ficha:', error);
        showToast('Error al exportar la ficha', 'error');
    }
}

// ============================================
// FUNCIONES EXISTENTES (CON PEQUEÑAS MEJORAS)
// ============================================

export function showNewPatientModal() {
    document.getElementById('editPatientId').value = '';
    document.getElementById('patientRut').value = '';
    document.getElementById('patientName').value = '';
    document.getElementById('patientEmail').value = '';
    document.getElementById('patientPhone').value = '';
    document.getElementById('patientBirthdate').value = '';
    document.getElementById('patientNotes').value = '';
    document.getElementById('patientModalTitle').innerText = 'Nuevo Paciente';
    document.getElementById('patientHistoryContainer').style.display = 'none';
    document.getElementById('patientStatsContainer').style.display = 'none';
    document.getElementById('patientModal').style.display = 'flex';
}

export function viewPatientDetails(id) {
    const patient = state.patients.find(p => p.id == id);
    if (!patient) return;

    document.getElementById('editPatientId').value = patient.id;
    document.getElementById('patientRut').value = patient.rut || '';
    document.getElementById('patientName').value = patient.name || '';
    document.getElementById('patientEmail').value = patient.email || '';
    document.getElementById('patientPhone').value = patient.phone || '';
    document.getElementById('patientBirthdate').value = patient.birthdate || '';
    document.getElementById('patientNotes').value = patient.notes || '';
    document.getElementById('patientModalTitle').innerText = 'Editar Paciente';

    const patientApps = state.appointments.filter(a => a.patientId == patient.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    const historyContainer = document.getElementById('patientHistoryContainer');
    const historyList = document.getElementById('patientHistoryList');
    const statsContainer = document.getElementById('patientStatsContainer');

    if (patientApps.length > 0) {
        const totalSessions = patientApps.length;
        const totalPaid = patientApps.reduce((sum, a) => sum + (a.paymentStatus === 'pagado' ? a.price : 0), 0);
        const onlineSessions = patientApps.filter(a => a.type === 'online').length;
        const presencialSessions = patientApps.filter(a => a.type === 'presencial').length;

        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="number">${totalSessions}</div>
                <div class="label">Total Sesiones</div>
            </div>
            <div class="stat-card">
                <div class="number">$${totalPaid.toLocaleString()}</div>
                <div class="label">Pagado</div>
            </div>
            <div class="stat-card">
                <div class="number">${onlineSessions}/${presencialSessions}</div>
                <div class="label">Online/Presencial</div>
            </div>
        `;
        statsContainer.style.display = 'grid';

        historyList.innerHTML = patientApps.map(a => `
            <div class="history-item">
                <span class="history-date">${a.date} ${a.time}</span>
                <span class="history-psych">${a.psych}</span>
                <span class="history-type">${a.type === 'online' ? 'Online' : 'Presencial'}</span>
                ${a.boxName ? `<span class="history-box">${a.boxName}</span>` : ''}
                <span class="history-amount">$${a.price.toLocaleString()}</span>
                <span style="color:${a.paymentStatus === 'pagado' ? 'var(--verde-exito)' : 'var(--naranja-aviso)'}">
                    ${a.paymentStatus === 'pagado' ? '✓' : '⏳'}
                </span>
            </div>
        `).join('');
        historyContainer.style.display = 'block';
    } else {
        statsContainer.style.display = 'none';
        historyContainer.style.display = 'none';
    }

    document.getElementById('patientModal').style.display = 'flex';
}

export function closePatientModal() {
    document.getElementById('patientModal').style.display = 'none';
}

export function searchPatientByRut() {
    const rut = document.getElementById('patientRut').value;
    if (!rut) return;

    const patient = state.patients.find(p => p.rut === rut);
    if (patient) {
        document.getElementById('editPatientId').value = patient.id;
        document.getElementById('patientName').value = patient.name || '';
        document.getElementById('patientEmail').value = patient.email || '';
        document.getElementById('patientPhone').value = patient.phone || '';
        document.getElementById('patientBirthdate').value = patient.birthdate || '';
        document.getElementById('patientNotes').value = patient.notes || '';
        showToast('Datos cargados automáticamente', 'success');
    }
}

export function savePatient() {
    const id = document.getElementById('editPatientId').value;
    const rut = document.getElementById('patientRut').value;
    const name = document.getElementById('patientName').value;
    const email = document.getElementById('patientEmail').value;
    const phone = document.getElementById('patientPhone').value;
    const birthdate = document.getElementById('patientBirthdate').value;
    const notes = document.getElementById('patientNotes').value;

    if (!rut || !name || !email) {
        showToast('RUT, nombre y email son obligatorios', 'error');
        return;
    }

    if (!validarRut(rut)) {
        showToast('RUT inválido', 'error');
        return;
    }

    if (id) {
        const patient = state.patients.find(p => p.id == id);
        if (patient) {
            patient.rut = rut;
            patient.name = name;
            patient.email = email;
            patient.phone = phone;
            patient.birthdate = birthdate;
            patient.notes = notes;
        }
    } else {
        const existingPatient = state.patients.find(p => p.rut === rut);
        if (existingPatient) {
            if (confirm('Ya existe un paciente con este RUT. ¿Actualizar sus datos?')) {
                existingPatient.name = name;
                existingPatient.email = email;
                existingPatient.phone = phone;
                existingPatient.birthdate = birthdate;
                existingPatient.notes = notes;
            } else {
                return;
            }
        } else {
            state.patients.push({
                id: Date.now(),
                rut,
                name,
                email,
                phone,
                birthdate,
                notes,
                psychId: state.currentUser?.role === 'psych' ? state.currentUser.data.id : null,
                createdAt: new Date().toISOString(),
                appointments: []
            });
        }
    }

    import('../main.js').then(main => main.save());
    closePatientModal();

    if (document.getElementById('tabAgendar')?.classList.contains('active')) {
        document.getElementById('therapistRut').value = rut;
        import('./citas.js').then(citas => citas.searchPatientByRutTherapist());
    }

    showToast('Paciente guardado', 'success');
}

export function printPatientSummary() {
    const patientId = document.getElementById('editPatientId').value;
    const patient = state.patients.find(p => p.id == patientId);
    if (!patient) return;

    const patientApps = state.appointments.filter(a => a.patientId == patientId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    const sesiones = state.sesiones.filter(s => s.patientId == patientId);
    const fichas = state.fichasIngreso.filter(f => f.patientId == patientId);

    let summaryHtml = `
        <html>
        <head>
            <title>Resumen de Atenciones - ${patient.name}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #2c3e50; }
                .header { margin-bottom: 30px; }
                .table { width: 100%; border-collapse: collapse; }
                .table th { background: #3498db; color: white; padding: 10px; text-align: left; }
                .table td { padding: 10px; border-bottom: 1px solid #ddd; }
                .total { margin-top: 20px; font-size: 1.2em; font-weight: bold; }
                .info-box { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Vínculo Salud - Resumen de Atenciones</h1>
                <p><strong>Paciente:</strong> ${patient.name}</p>
                <p><strong>RUT:</strong> ${patient.rut}</p>
                <p><strong>Email:</strong> ${patient.email}</p>
                <p><strong>Teléfono:</strong> ${patient.phone || '—'}</p>
            </div>
            
            <div class="info-box">
                <h3>📊 Estadísticas Clínicas</h3>
                <p><strong>Ficha de Ingreso:</strong> ${fichas.length > 0 ? '✓ Sí' : '✗ No'}</p>
                <p><strong>Sesiones Registradas:</strong> ${sesiones.length}</p>
                <p><strong>Citas Totales:</strong> ${patientApps.length}</p>
            </div>
            
            <table class="table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Profesional</th>
                        <th>Tipo</th>
                        <th>Box</th>
                        <th>Valor</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let total = 0;
    patientApps.forEach(a => {
        total += a.price;
        summaryHtml += `
            <tr>
                <td>${a.date}</td>
                <td>${a.time}</td>
                <td>${a.psych}</td>
                <td>${a.type === 'online' ? 'Online' : 'Presencial'}</td>
                <td>${a.boxName || '—'}</td>
                <td>$${a.price.toLocaleString()}</td>
                <td>${a.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente'}</td>
            </tr>
        `;
    });

    summaryHtml += `
                </tbody>
            </table>
            
            <div class="total">
                Total: $${total.toLocaleString()}
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(summaryHtml);
    printWindow.document.close();
    printWindow.print();
}

// ============================================
// EXPORTAR FUNCIONES AL OBJETO WINDOW
// ============================================
if (typeof window !== 'undefined') {
    window.renderPatients = renderPatients;
    window.showNewPatientModal = showNewPatientModal;
    window.closePatientModal = closePatientModal;
    window.savePatient = savePatient;
    window.printPatientSummary = printPatientSummary;
    window.searchPatientByRut = searchPatientByRut;
    window.viewPatientDetails = viewPatientDetails;
    window.mostrarDetallePaciente = mostrarDetallePaciente;
    window.cambiarPestana = cambiarPestana;
    window.verFichaCompleta = mostrarDetallePaciente;
    window.exportarFichaCompleta = exportarFichaCompleta;
    window.volverALista = volverALista;
}

console.log('✅ pacientes.js cargado con todas las funciones de fichas clínicas');