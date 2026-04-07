// js/modules/admin.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast } from './utils.js';
import { calcularEdad } from './utils.js';
import { save } from '../main.js';

// ============================================
// UTILIDADES INTERNAS
// ============================================

async function confirmAction(message) {
    return new Promise((resolve) => {
        const result = confirm(message);
        resolve(result);
    });
}

// ============================================
// CONTADORES DE REINICIO
// ============================================

export function actualizarContadoresReinicio() {
    const totalPacientes = document.getElementById('totalPacientes');
    const totalMensajes = document.getElementById('totalMensajes');
    const totalCitas = document.getElementById('totalCitas');
    const totalFichas = document.getElementById('totalFichas');
    const totalSesiones = document.getElementById('totalSesiones');
    const totalInformes = document.getElementById('totalInformes');
    
    if (totalPacientes) totalPacientes.innerText = state.patients.filter(p => !p.isHiddenAdmin).length;
    if (totalMensajes) totalMensajes.innerText = state.messages.length;
    if (totalCitas) totalCitas.innerText = state.appointments.length;
    if (totalFichas) totalFichas.innerText = state.fichasIngreso.length;
    if (totalSesiones) totalSesiones.innerText = state.sesiones.length;
    if (totalInformes) totalInformes.innerText = state.informes.length;
}

// ============================================
// ESTADÍSTICAS GLOBALES
// ============================================

export function getEstadisticasGlobales() {
    const totalPacientes = state.patients.filter(p => !p.isHiddenAdmin).length;
    const pacientesConFicha = state.fichasIngreso.length;
    const pacientesSinFicha = totalPacientes - pacientesConFicha;
    const totalSesiones = state.sesiones.length;
    const sesionesPorMes = {};
    state.sesiones.forEach(s => {
        if (s.fechaAtencion) {
            const [dia, mes, año] = s.fechaAtencion.split('-');
            if (año && mes) {
                const key = `${año}-${mes}`;
                sesionesPorMes[key] = (sesionesPorMes[key] || 0) + 1;
            }
        }
    });
    const totalInformes = state.informes.length;
    const informesPorTipo = {
        psicodiagnostico: state.informes.filter(i => i.tipo === 'psicodiagnostico').length,
        cierre: state.informes.filter(i => i.tipo === 'cierre').length
    };
    const totalCitas = state.appointments.length;
    const ingresosTotales = state.appointments.filter(a => a.paymentStatus === 'pagado').reduce((sum, a) => sum + (a.price || 0), 0);
    const ingresosPorMes = {};
    state.appointments.filter(a => a.paymentStatus === 'pagado').forEach(a => {
        if (a.date) {
            const [año, mes] = a.date.split('-');
            if (año && mes) {
                const key = `${año}-${mes}`;
                ingresosPorMes[key] = (ingresosPorMes[key] || 0) + (a.price || 0);
            }
        }
    });
    const profesionalesActivos = new Set();
    state.appointments.forEach(a => profesionalesActivos.add(a.psychId));
    state.sesiones.forEach(s => {
        const patient = state.patients.find(p => p.id == s.patientId);
        if (patient) profesionalesActivos.add(patient.psychId);
    });
    const rangosEdad = { '0-18':0, '19-30':0, '31-45':0, '46-60':0, '61+':0, 'sin especificar':0 };
    state.patients.forEach(p => {
        if (!p.birthdate) { rangosEdad['sin especificar']++; return; }
        const edad = calcularEdad(p.birthdate);
        if (edad <= 18) rangosEdad['0-18']++;
        else if (edad <= 30) rangosEdad['19-30']++;
        else if (edad <= 45) rangosEdad['31-45']++;
        else if (edad <= 60) rangosEdad['46-60']++;
        else rangosEdad['61+']++;
    });
    return {
        pacientes: { total: totalPacientes, conFicha: pacientesConFicha, sinFicha: pacientesSinFicha, rangosEdad, porcentajeConFicha: totalPacientes ? ((pacientesConFicha / totalPacientes) * 100).toFixed(1) : 0 },
        fichasClinicas: { fichasIngreso: state.fichasIngreso.length, sesiones: totalSesiones, informes: totalInformes, sesionesPorMes, informesPorTipo },
        citas: { total: totalCitas, pendientes: state.appointments.filter(a => a.paymentStatus === 'pendiente').length, pagadas: state.appointments.filter(a => a.paymentStatus === 'pagado').length, rechazadas: state.appointments.filter(a => a.paymentStatus === 'rechazado').length },
        financiero: { ingresosTotales, ingresosPorMes, promedioPorCita: totalCitas ? (ingresosTotales / totalCitas).toFixed(0) : 0 },
        profesionales: { total: state.staff.filter(s => !s.isHiddenAdmin).length, activos: profesionalesActivos.size }
    };
}

export function renderAdminPanel() {
    const container = document.getElementById('adminPanelStats');
    if (!container) return;
    const stats = getEstadisticasGlobales();
    container.innerHTML = `
        <div style="padding:20px;">
            <h2 style="margin-bottom:20px;">📊 Panel de Administración</h2>
            <div class="stats-grid">
                <div class="stat-card stat-card-purple">
                    <div class="stat-number">${stats.pacientes.total}</div>
                    <div class="stat-label">Pacientes</div>
                    <div class="stat-sub">${stats.pacientes.conFicha} con ficha</div>
                </div>
                <div class="stat-card stat-card-orange">
                    <div class="stat-number">${stats.fichasClinicas.fichasIngreso}</div>
                    <div class="stat-label">Fichas de Ingreso</div>
                </div>
                <div class="stat-card stat-card-green">
                    <div class="stat-number">${stats.fichasClinicas.sesiones}</div>
                    <div class="stat-label">Sesiones</div>
                </div>
                <div class="stat-card stat-card-red">
                    <div class="stat-number">${stats.fichasClinicas.informes}</div>
                    <div class="stat-label">Informes</div>
                </div>
            </div>
            <div class="stats-footer">
                <button class="btn-stats" onclick="switchTab('estadisticas')">
                    <i class="fa fa-chart-line"></i> Ver Estadísticas Completas
                </button>
            </div>
        </div>
    `;
}

// ============================================
// GESTIÓN DE PROFESIONALES (TABLA)
// ============================================

export function asegurarTablaProfesionales() {
    console.log('🔧 asegurarTablaProfesionales ejecutándose...');
    const contenedor = document.getElementById('tabProfesionales');
    if (!contenedor) {
        console.warn('⚠️ No se encontró el contenedor tabProfesionales');
        return false;
    }

    const tabProf = document.getElementById('adminTabProfesionales');
    if (tabProf && !tabProf.classList.contains('active')) tabProf.click();

    let tbody = document.getElementById('staffTableBody');
    if (!tbody) {
        console.log('🔧 Creando tabla de profesionales...');
        let tabla = contenedor.querySelector('table');
        if (!tabla) {
            tabla = document.createElement('table');
            tabla.className = 'admin-table';
            tabla.innerHTML = `
                <thead>
                    <tr><th>Nombre</th><th>Email</th><th>Especialidades</th><th>Usuario</th>
                    <th>Precios</th><th>WhatsApp</th><th>Instagram</th><th>Pagos</th><th>Acciones</th></tr>
                </thead>
                <tbody id="staffTableBody"></tbody>
            `;
            let contenedorTabla = contenedor.querySelector('.table-container');
            if (!contenedorTabla) {
                contenedorTabla = document.createElement('div');
                contenedorTabla.className = 'table-container';
                contenedor.appendChild(contenedorTabla);
            }
            contenedorTabla.appendChild(tabla);
        }
        tbody = document.getElementById('staffTableBody');
    }

    if (typeof window.renderStaffTable === 'function') {
        window.renderStaffTable();
        console.log('✅ Tabla renderizada con renderStaffTable()');
    } else {
        const visibleStaff = state.staff.filter(s => !s.isHiddenAdmin);
        if (tbody) {
            tbody.innerHTML = visibleStaff.map(p => {
                const specs = Array.isArray(p.spec) ? p.spec.join(', ') : p.spec;
                const generoTexto = p.genero === 'M' ? '♂️' : p.genero === 'F' ? '♀️' : '';
                return `
                    <tr>
                        <td><strong>${p.name}</strong> ${generoTexto}</td>
                        <td>${p.email || '—'}</td>
                        <td>${specs ? specs.substring(0, 30) + (specs.length > 30 ? '...' : '') : '—'}</td>
                        <td>${p.usuario || p.name || '—'}</td>
                        <td>
                            <span class="price-online">Online: $${(p.priceOnline || 0).toLocaleString()}</span><br>
                            <span class="price-presencial">Presencial: $${(p.pricePresencial || 0).toLocaleString()}</span>
                        </td>
                        <td>${p.whatsapp ? `<a href="https://wa.me/${p.whatsapp.replace(/\+/g, '')}" target="_blank">${p.whatsapp}</a>` : '—'}</td>
                        <td>${p.instagram ? `<a href="https://instagram.com/${p.instagram.replace('@', '')}" target="_blank">@${p.instagram.replace('@', '')}</a>` : '—'}</td>
                        <td>
                            <span class="payment-indicator ${p.paymentLinks?.online ? 'active' : 'inactive'}">${p.paymentLinks?.online ? '✅' : '❌'} Online</span><br>
                            <span class="payment-indicator ${p.paymentLinks?.presencial ? 'active' : 'inactive'}">${p.paymentLinks?.presencial ? '✅' : '❌'} Presencial</span>
                        </td>
                        <td>
                            <button onclick="editTherapist('${p.id}')" class="btn-editar">✏️ Editar</button>
                            <button onclick="deleteStaff('${p.id}')" class="btn-eliminar">🗑️ Eliminar</button>
                        </td>
                    </tr>
                `;
            }).join('');
            console.log('✅ Tabla renderizada manualmente');
        }
    }
    return true;
}

// ============================================
// INTERFAZ DE ADMIN (PESTAÑAS, BOTONES DE EDICIÓN)
// ============================================

export function refrescarVistaPublica() {
    console.log('🔄 Refrescando vista pública...');
    const refreshFunctions = [
        'cargarInstagramData', 'cargarAboutTexts', 'cargarAtencionTexts',
        'cargarContactInfo', 'cargarLogo', 'cargarTextos', 'cargarFondo',
        'updateInstagramSection', 'updateAboutSection', 'updateAtencionSection', 'updateContactSection'
    ];
    refreshFunctions.forEach(fn => {
        if (typeof window[fn] === 'function') window[fn]();
    });
    if (typeof window.filterProfessionals === 'function') setTimeout(() => window.filterProfessionals(), 500);
    showToast('✅ Vista pública actualizada', 'success');
}

export function mostrarTabsAdmin() {
    console.log('👑 Mostrando pestañas de admin...');
    const tabsAdmin = [
        'adminTabProfesionales', 'adminTabEspecialidades', 'adminTabPagos',
        'adminTabFondo', 'adminTabTextos', 'adminTabLogo',
        'adminTabEstadisticas', 'adminTabReinicio', 'messagesTab',
        'adminTabConsentimientos'
    ];
    tabsAdmin.forEach(id => {
        const tab = document.getElementById(id);
        if (tab) tab.style.display = 'inline-block';
    });
    addEditButtonsToAdmin();
    if (state.currentUser?.role === 'admin') {
        setTimeout(() => asegurarTablaProfesionales(), 300);
    }
}

export function addEditButtonsToAdmin() {
    console.log('🔧 Agregando botones de edición al panel de admin...');
    setTimeout(() => {
        let tabPersonalizacion = document.getElementById('tabPersonalizacion');
        if (!tabPersonalizacion) {
            const dashboardTabs = document.getElementById('dashboardTabs');
            if (dashboardTabs && !document.getElementById('adminTabPersonalizacion')) {
                const newTab = document.createElement('div');
                newTab.className = 'tab';
                newTab.id = 'adminTabPersonalizacion';
                newTab.setAttribute('onclick', "switchTab('personalizacion')");
                newTab.innerText = '🎨 Personalización';
                dashboardTabs.appendChild(newTab);
            }
            if (!document.getElementById('tabPersonalizacion')) {
                const tabContent = document.createElement('div');
                tabContent.id = 'tabPersonalizacion';
                tabContent.className = 'tab-content';
                const lastTab = document.querySelector('.tab-content:last-of-type');
                if (lastTab) lastTab.parentNode.insertBefore(tabContent, lastTab.nextSibling);
                else document.getElementById('dashboard').appendChild(tabContent);
            }
            tabPersonalizacion = document.getElementById('tabPersonalizacion');
        }
        if (!tabPersonalizacion) return;
        
        tabPersonalizacion.innerHTML = `
            <h2>🎨 Personalización del Sitio</h2>
            <div class="admin-edit-buttons">
                <button class="btn-staff" onclick="showAboutModal()"><i class="fa fa-users"></i> Editar Quiénes Somos</button>
                <button class="btn-staff" onclick="showAtencionModal()"><i class="fa fa-list"></i> Editar Tipos de Atención</button>
                <button class="btn-staff" onclick="showContactModal()"><i class="fa fa-address-card"></i> Editar Contacto</button>
                <button class="btn-staff" onclick="showInstagramModal()"><i class="fab fa-instagram"></i> Editar Sección Instagram</button>
                <button class="btn-staff" onclick="showTextsModal()"><i class="fa fa-pen"></i> Editar Textos Hero</button>
                <button class="btn-staff" onclick="showLogoModal()"><i class="fa fa-image"></i> Editar Logo</button>
                <button class="btn-staff" onclick="showBackgroundImageModal()"><i class="fa fa-wallpaper"></i> Editar Fondo</button>
                <button class="btn-staff" onclick="refrescarVistaPublica()"><i class="fa fa-sync-alt"></i> Refrescar Vista Pública</button>
            </div>
            <div class="stats-summary">
                <h3>📊 Estado de Textos Editables</h3>
                <div class="stats-summary-grid">
                    <div class="stat-badge">Misión: ${state.missionText?.substring(0, 50)}...</div>
                    <div class="stat-badge">Visión: ${state.visionText?.substring(0, 50)}...</div>
                    <div class="stat-badge">Email Contacto: ${state.contactInfo?.email || 'No definido'}</div>
                    <div class="stat-badge">Teléfono: ${state.contactInfo?.phone || 'No definido'}</div>
                    <div class="stat-badge">Instagram: ${state.instagramData?.title || 'No configurado'}</div>
                </div>
            </div>
        `;
        console.log('✅ Botones de edición agregados');
    }, 500);
}

// ============================================
// ELIMINACIÓN MASIVA (MANTENIMIENTO)
// ============================================

export async function eliminarTodasLasFichasIngreso() {
    if (!state.currentUser?.role === 'admin') return showToast('Solo administradores', 'error');
    if (!await confirmAction('⚠️ ¿Eliminar TODAS las fichas de ingreso?')) return;
    const cantidad = state.fichasIngreso.length;
    state.setFichasIngreso([]);
    await save();
    showToast(`✅ ${cantidad} fichas de ingreso eliminadas`, 'success');
    actualizarContadoresReinicio();
}

export async function eliminarTodasLasSesiones() {
    if (!state.currentUser?.role === 'admin') return showToast('Solo administradores', 'error');
    if (!await confirmAction('⚠️ ¿Eliminar TODAS las sesiones/notas de evolución?')) return;
    const cantidad = state.sesiones.length;
    state.setSesiones([]);
    await save();
    showToast(`✅ ${cantidad} sesiones eliminadas`, 'success');
    actualizarContadoresReinicio();
}

export async function eliminarTodosLosInformes() {
    if (!state.currentUser?.role === 'admin') return showToast('Solo administradores', 'error');
    if (!await confirmAction('⚠️ ¿Eliminar TODOS los informes?')) return;
    const cantidad = state.informes.length;
    state.setInformes([]);
    await save();
    showToast(`✅ ${cantidad} informes eliminados`, 'success');
    actualizarContadoresReinicio();
}

export async function eliminarFichasDePaciente(patientId) {
    if (!state.currentUser?.role === 'admin') return showToast('Solo administradores', 'error');
    const patient = state.patients.find(p => p.id == patientId);
    if (!patient) return;
    if (!await confirmAction(`⚠️ ¿Eliminar TODAS las fichas clínicas de ${patient.name}?`)) return;
    state.setFichasIngreso(state.fichasIngreso.filter(f => f.patientId != patientId));
    state.setSesiones(state.sesiones.filter(s => s.patientId != patientId));
    state.setInformes(state.informes.filter(i => i.patientId != patientId));
    await save();
    showToast(`✅ Fichas de ${patient.name} eliminadas`, 'success');
    actualizarContadoresReinicio();
}

export async function limpiarFichasHuerfanas() {
    if (!state.currentUser?.role === 'admin') return showToast('Solo administradores', 'error');
    const patientIds = new Set(state.patients.map(p => p.id));
    const fichasHuerfanas = state.fichasIngreso.filter(f => !patientIds.has(f.patientId));
    const sesionesHuerfanas = state.sesiones.filter(s => !patientIds.has(s.patientId));
    const informesHuerfanos = state.informes.filter(i => !patientIds.has(i.patientId));
    if (fichasHuerfanas.length === 0 && sesionesHuerfanas.length === 0 && informesHuerfanos.length === 0) {
        showToast('No hay fichas huérfanas', 'info');
        return;
    }
    if (!await confirmAction(`¿Eliminar ${fichasHuerfanas.length} fichas, ${sesionesHuerfanas.length} sesiones y ${informesHuerfanos.length} informes huérfanos?`)) return;
    state.setFichasIngreso(state.fichasIngreso.filter(f => patientIds.has(f.patientId)));
    state.setSesiones(state.sesiones.filter(s => patientIds.has(s.patientId)));
    state.setInformes(state.informes.filter(i => patientIds.has(i.patientId)));
    await save();
    showToast('✅ Fichas huérfanas eliminadas', 'success');
    actualizarContadoresReinicio();
}

// ============================================
// IMPORTAR / EXPORTAR
// ============================================

export function exportarTodasLasFichas() {
    if (!state.currentUser?.role === 'admin') return showToast('Solo administradores', 'error');
    const backup = {
        fecha: new Date().toISOString(),
        version: '3.0',
        estadisticas: getEstadisticasGlobales(),
        textosEditables: {
            missionText: state.missionText,
            visionText: state.visionText,
            aboutTeamText: state.aboutTeamText,
            aboutImage: state.aboutImage,
            atencionTexts: state.atencionTexts,
            contactInfo: state.contactInfo,
            heroTexts: state.heroTexts,
            logoImage: state.logoImage,
            backgroundImage: state.backgroundImage,
            instagramData: state.instagramData
        },
        datos: {
            pacientes: state.patients,
            fichasIngreso: state.fichasIngreso,
            sesiones: state.sesiones,
            informes: state.informes,
            citas: state.appointments,
            mensajes: state.messages,
            profesionales: state.staff,
            boxes: state.boxes,
            specialties: state.specialties
        }
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vinculo_salud_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ Backup exportado correctamente', 'success');
}

export async function importarFichas() {
    if (!state.currentUser?.role === 'admin') return showToast('Solo administradores', 'error');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const backup = JSON.parse(ev.target.result);
                if (!await confirmAction('¿Importar datos del backup?')) return;
                if (backup.textosEditables) {
                    if (backup.textosEditables.missionText) state.missionText = backup.textosEditables.missionText;
                    if (backup.textosEditables.visionText) state.visionText = backup.textosEditables.visionText;
                    if (backup.textosEditables.aboutTeamText) state.aboutTeamText = backup.textosEditables.aboutTeamText;
                    if (backup.textosEditables.aboutImage) state.aboutImage = backup.textosEditables.aboutImage;
                    if (backup.textosEditables.atencionTexts) state.atencionTexts = backup.textosEditables.atencionTexts;
                    if (backup.textosEditables.contactInfo) state.contactInfo = backup.textosEditables.contactInfo;
                    if (backup.textosEditables.heroTexts) state.heroTexts = backup.textosEditables.heroTexts;
                    if (backup.textosEditables.logoImage) state.logoImage = backup.textosEditables.logoImage;
                    if (backup.textosEditables.backgroundImage) state.backgroundImage = backup.textosEditables.backgroundImage;
                    if (backup.textosEditables.instagramData) state.instagramData = backup.textosEditables.instagramData;
                }
                if (backup.datos?.pacientes) state.setPatients([...state.patients, ...backup.datos.pacientes]);
                if (backup.datos?.fichasIngreso) state.setFichasIngreso([...state.fichasIngreso, ...backup.datos.fichasIngreso]);
                if (backup.datos?.sesiones) state.setSesiones([...state.sesiones, ...backup.datos.sesiones]);
                if (backup.datos?.informes) state.setInformes([...state.informes, ...backup.datos.informes]);
                if (backup.datos?.citas) state.setAppointments([...state.appointments, ...backup.datos.citas]);
                if (backup.datos?.mensajes) state.setMessages([...state.messages, ...backup.datos.mensajes]);
                if (backup.datos?.profesionales) state.setStaff([...state.staff, ...backup.datos.profesionales]);
                if (backup.datos?.boxes) state.setBoxes([...state.boxes, ...backup.datos.boxes]);
                if (backup.datos?.specialties) state.setSpecialties([...state.specialties, ...backup.datos.specialties]);
                await save();
                showToast('✅ Datos importados correctamente', 'success');
                actualizarContadoresReinicio();
                if (typeof window.updateAboutSection === 'function') window.updateAboutSection();
                if (typeof window.updateAtencionSection === 'function') window.updateAtencionSection();
                if (typeof window.updateContactSection === 'function') window.updateContactSection();
                if (typeof window.updateInstagramSection === 'function') window.updateInstagramSection();
            } catch (error) {
                console.error('Error importando:', error);
                showToast('❌ Error al importar el archivo', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ============================================
// FUNCIONES DE EXPORTACIÓN A CSV
// ============================================

function descargarCSV(csv, nombreArchivo) {
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);
}

export function exportarDatosExcel(tipo) {
    if (!state.currentUser?.role === 'admin') {
        showToast('Solo administradores pueden exportar datos', 'error');
        return;
    }
    let datos = [], nombreArchivo = '', headers = [], csv = '';
    switch(tipo) {
        case 'pacientes':
            datos = state.patients.filter(p => !p.isHiddenAdmin);
            nombreArchivo = `pacientes_${new Date().toISOString().split('T')[0]}.csv`;
            headers = ['RUT','Nombre','Email','Teléfono','Fecha Nacimiento','Edad','Profesional','Notas'];
            csv = headers.join(',') + '\n';
            datos.forEach(p => {
                const profesional = state.staff.find(s => s.id == p.psychId)?.name || 'Sin asignar';
                const edad = p.birthdate ? calcularEdad(p.birthdate) : '';
                csv += `"${p.rut || ''}","${p.name || ''}","${p.email || ''}","${p.phone || ''}","${p.birthdate || ''}","${edad}","${profesional}","${(p.notes || '').replace(/"/g, '""')}"\n`;
            });
            break;
        case 'citas':
            datos = state.appointments;
            nombreArchivo = `citas_${new Date().toISOString().split('T')[0]}.csv`;
            headers = ['Fecha','Hora','Paciente','RUT','Profesional','Tipo','Valor','Pago','Estado'];
            csv = headers.join(',') + '\n';
            datos.forEach(c => {
                csv += `"${c.date || ''}","${c.time || ''}","${c.patient || ''}","${c.patientRut || ''}","${c.psych || ''}","${c.type || ''}",${c.price || 0},"${c.paymentStatus || ''}","${c.status || ''}"\n`;
            });
            break;
        case 'profesionales':
            datos = state.staff.filter(s => !s.isHiddenAdmin);
            nombreArchivo = `profesionales_${new Date().toISOString().split('T')[0]}.csv`;
            headers = ['Nombre','Email','Especialidades','WhatsApp','Instagram','Precio Online','Precio Presencial','Título','Experiencia'];
            csv = headers.join(',') + '\n';
            datos.forEach(p => {
                const specs = Array.isArray(p.spec) ? p.spec.join(' | ') : p.spec;
                csv += `"${p.name || ''}","${p.email || ''}","${specs || ''}","${p.whatsapp || ''}","${p.instagram || ''}",${p.priceOnline || 0},${p.pricePresencial || 0},"${p.title || ''}","${p.experience || 0}"\n`;
            });
            break;
        case 'mensajes':
            datos = state.messages;
            nombreArchivo = `mensajes_${new Date().toISOString().split('T')[0]}.csv`;
            headers = ['Fecha','Nombre','Profesional','Calificación','Mensaje'];
            csv = headers.join(',') + '\n';
            datos.forEach(m => {
                csv += `"${m.date || ''}","${m.name || ''}","${m.therapistName || 'General'}",${m.rating || 0},"${(m.text || '').replace(/"/g, '""')}"\n`;
            });
            break;
        case 'fichas':
            datos = state.fichasIngreso;
            nombreArchivo = `fichas_ingreso_${new Date().toISOString().split('T')[0]}.csv`;
            headers = ['Paciente ID','Fecha','Motivo Consulta','Psicólogo'];
            csv = headers.join(',') + '\n';
            datos.forEach(f => {
                const patient = state.patients.find(p => p.id == f.patientId);
                csv += `"${f.patientId || ''}","${f.fechaIngreso || ''}","${(f.motivoConsulta || '').replace(/"/g, '""')}","${patient?.name || 'Desconocido'}"\n`;
            });
            break;
        default: return;
    }
    descargarCSV(csv, nombreArchivo);
    showToast(`✅ ${datos.length} registros exportados`, 'success');
}

// ============================================
// HERRAMIENTAS DE ADMINISTRACIÓN (REINICIO COMPLETO, ETC.)
// ============================================

export async function reinicioCompleto() {
    if (!state.currentUser?.role === 'admin') return showToast('Solo administradores', 'error');
    if (!await confirmAction('🔥 ¿REINICIO COMPLETO? Esto eliminará TODOS los pacientes, mensajes, citas, solicitudes, FICHAS CLÍNICAS Y TEXTOS EDITABLES. Los profesionales se mantienen. ¿Continuar?')) return;
    if (!await confirmAction('ÚLTIMA CONFIRMACIÓN: ¿Estás ABSOLUTAMENTE SEGURO?')) return;
    state.setPatients([]);
    state.setMessages([]);
    state.setAppointments([]);
    state.setPendingRequests([]);
    state.setFichasIngreso([]);
    state.setSesiones([]);
    state.setInformes([]);
    state.missionText = 'Acompañar a las personas en su proceso de sanación emocional...';
    state.visionText = 'Ser un referente en salud mental en la región...';
    state.aboutTeamText = 'Nuestro equipo está formado por profesionales...';
    state.aboutImage = '';
    state.atencionTexts = {
        online: { title: 'Online', description: 'sesiones por videollamada' },
        presencial: { title: 'Presencial', description: 'Atención en consultorio' },
        pareja: { title: 'Pareja', description: 'Terapia de pareja' },
        familiar: { title: 'Familiar', description: 'Terapia familiar' }
    };
    state.contactInfo = { email: 'vinculosalid@gmail.com', phone: '+56 9 1234 5678', address: 'Ohiggins 263, Concepción' };
    await save();
    showToast('✅ Sistema reiniciado completamente', 'success');
    actualizarContadoresReinicio();
    const refreshFns = ['updateAboutSection', 'updateAtencionSection', 'updateContactSection', 'updateInstagramSection'];
    refreshFns.forEach(fn => { if (typeof window[fn] === 'function') window[fn](); });
}

export function verificarPermisosFirebase() {
    console.log('🔍 Verificando permisos de Firebase...');
    const testRef = db.ref('_test_permissions');
    testRef.set({ timestamp: Date.now(), user: state.currentUser?.data?.email })
        .then(() => {
            console.log('✅ Permisos de escritura OK');
            testRef.remove();
            showToast('✅ Permisos de Firebase correctos', 'success');
        })
        .catch(error => {
            console.error('❌ Error de permisos:', error);
            showToast('❌ Error de permisos en Firebase', 'error');
        });
}

// ============================================
// CONSENTIMIENTOS INFORMADOS - CON PERMISOS POR ROL
// ============================================

let consentimientosData = [];

async function cargarConsentimientosFirebase() {
    try {
        const snapshot = await db.ref('consentimientos').once('value');
        const data = snapshot.val();
        consentimientosData = [];
        
        if (data) {
            Object.keys(data).forEach(key => {
                const consentimiento = { id: key, ...data[key] };
                
                // Si es psicólogo, solo ver consentimientos de sus pacientes
                if (state.currentUser?.role === 'psych') {
                    const rutPaciente = consentimiento.paciente?.rut;
                    // Buscar si este paciente está asociado al psicólogo
                    const pacienteAsignado = state.patients.find(p => 
                        p.rut === rutPaciente && p.psychId === state.currentUser.data.id
                    );
                    // Si no es su paciente, no lo incluye
                    if (!pacienteAsignado) return;
                }
                
                consentimientosData.push(consentimiento);
            });
            consentimientosData.sort((a, b) => new Date(b.fechaFirma) - new Date(a.fechaFirma));
        }
        return consentimientosData;
    } catch (error) {
        console.error('Error cargando consentimientos:', error);
        return [];
    }
}

function generarLinkConsentimiento(rutPaciente, nombrePaciente) {
    if (!rutPaciente) return '#';
    const rutLimpio = rutPaciente.replace(/\./g, '').replace(/\-/g, '');
    const token = btoa(rutLimpio);
    const baseUrl = window.location.origin;
    return `${baseUrl}/consentimiento.html?token=${token}&nombre=${encodeURIComponent(nombrePaciente || '')}`;
}

export async function mostrarTabConsentimientos() {
    const container = document.getElementById('consentimientosTab');
    if (!container) {
        console.warn('No se encontró el contenedor consentimientosTab');
        return;
    }
    
    await cargarConsentimientosFirebase();
    const isAdmin = state.currentUser?.role === 'admin';
    const total = consentimientosData.length;
    const hoy = new Date().toISOString().split('T')[0];
    const hoyCount = consentimientosData.filter(c => c.fechaFirma?.startsWith(hoy)).length;
    
    container.innerHTML = `
        <h2>📋 Consentimientos Informados Firmados</h2>
        <div style="display: flex; gap: 20px; margin: 20px 0;">
            <div style="flex:1; background: #f0fdf4; padding: 20px; border-radius: 16px; text-align: center;">
                <div style="font-size: 2rem; font-weight: 800; color: #1A3C34;">${total}</div>
                <div>Total Firmas</div>
            </div>
            <div style="flex:1; background: #fef3c7; padding: 20px; border-radius: 16px; text-align: center;">
                <div style="font-size: 2rem; font-weight: 800; color: #B8860B;">${hoyCount}</div>
                <div>Firmas Hoy</div>
            </div>
        </div>
        
        <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
            <input type="text" id="consentSearchInput" placeholder="🔍 Buscar por nombre o RUT..." 
                   style="flex:1; padding: 10px; border-radius: 40px; border: 1px solid #ddd;">
            <input type="date" id="consentDateFilter" 
                   style="padding: 10px; border-radius: 40px; border: 1px solid #ddd;">
            <button id="consentRefreshBtn" class="btn-staff" style="padding: 10px 20px; border-radius: 40px;">
                <i class="fa fa-refresh"></i> Actualizar
            </button>
        </div>
        
        <div style="overflow-x: auto;">
            <table class="admin-table" style="width:100%;">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Paciente</th>
                        <th>RUT</th>
                        <th>Email</th>
                        <th>IP</th>
                        <th>Link</th>
                        <th>PDF</th>
                        ${isAdmin ? '<th>Acciones</th>' : ''}
                    </tr>
                </thead>
                <tbody id="consentTableBody">
                    ${renderFilasConsentimientos(consentimientosData, isAdmin)}
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('consentSearchInput')?.addEventListener('keyup', () => filtrarConsentimientosTabla());
    document.getElementById('consentDateFilter')?.addEventListener('change', () => filtrarConsentimientosTabla());
    document.getElementById('consentRefreshBtn')?.addEventListener('click', async () => {
        await cargarConsentimientosFirebase();
        mostrarTabConsentimientos();
        showToast('✅ Lista actualizada', 'success');
    });
}

function renderFilasConsentimientos(consentimientos, isAdmin = false) {
    if (!consentimientos.length) {
        const colSpan = isAdmin ? 8 : 7;
        return `<tr><td colspan="${colSpan}" style="text-align:center;">No hay consentimientos firmados</td></tr>`;
    }
    
    return consentimientos.map(c => {
        const fecha = new Date(c.fechaFirma).toLocaleString('es-CL');
        const rut = c.paciente?.rut || '';
        const nombre = c.paciente?.nombre || '';
        
        return `
            <tr>
                <td>${fecha}</td>
                <td>${c.paciente?.nombre || 'N/A'}</td>
                <td>${rut}</td>
                <td>${c.paciente?.email || 'N/A'}</td>
                <td>${c.ip || 'N/A'}</td>
                <td>
                    <button class="btn-small" onclick="window.copiarLinkConsentimiento('${rut.replace(/'/g, "\\'")}', '${nombre.replace(/'/g, "\\'")}')">
                        <i class="fa fa-link"></i> Copiar Link
                    </button>
                </td>
                <td>
                    <button class="btn-small" onclick="window.descargarPDFConsentimientoAdmin('${c.id}')">
                        <i class="fa fa-file-pdf"></i> PDF
                    </button>
                </td>
                ${isAdmin ? `
                    <td>
                        <button class="btn-small btn-danger" onclick="window.eliminarConsentimiento('${c.id}', '${rut.replace(/'/g, "\\'")}')" 
                                style="background: #dc2626; color: white; border: none; padding: 5px 10px; border-radius: 20px; cursor: pointer;">
                            <i class="fa fa-trash"></i> Eliminar
                        </button>
                    </td>
                ` : ''}
            </tr>
        `;
    }).join('');
}

function filtrarConsentimientosTabla() {
    const searchTerm = document.getElementById('consentSearchInput')?.value.toLowerCase() || '';
    const dateFilter = document.getElementById('consentDateFilter')?.value || '';
    
    const filtrados = consentimientosData.filter(c => {
        let match = true;
        if (searchTerm) {
            const nombre = (c.paciente?.nombre || '').toLowerCase();
            const rut = (c.paciente?.rut || '').toLowerCase();
            match = match && (nombre.includes(searchTerm) || rut.includes(searchTerm));
        }
        if (dateFilter) {
            match = match && (c.fechaFirma?.startsWith(dateFilter));
        }
        return match;
    });
    
    const tbody = document.getElementById('consentTableBody');
    if (tbody) {
        const isAdmin = state.currentUser?.role === 'admin';
        tbody.innerHTML = renderFilasConsentimientos(filtrados, isAdmin);
    }
}

// Funciones expuestas al window para consentimientos
window.copiarLinkConsentimiento = function(rut, nombre) {
    const link = generarLinkConsentimiento(rut, nombre);
    navigator.clipboard.writeText(link);
    showToast('✅ Link copiado al portapapeles', 'success');
};

window.descargarPDFConsentimientoAdmin = async function(consentimientoId) {
    try {
        showToast('📄 Generando PDF...', 'info');
        const snapshot = await db.ref(`consentimientos/${consentimientoId}`).once('value');
        const data = snapshot.val();
        if (!data) {
            showToast('No se encontró el consentimiento', 'error');
            return;
        }
        
        if (typeof window.jspdf === 'undefined' && typeof jsPDF === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => generarPDFConsentimientoDescarga(data);
            document.head.appendChild(script);
        } else {
            generarPDFConsentimientoDescarga(data);
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('❌ Error al generar PDF', 'error');
    }
};

function generarPDFConsentimientoDescarga(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.setTextColor(26, 60, 52);
    doc.text('CONSENTIMIENTO INFORMADO', 105, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Fecha firma: ${new Date(data.fechaFirma).toLocaleString('es-CL')}`, 20, 45);
    doc.text(`Paciente: ${data.paciente?.nombre || 'N/A'}`, 20, 60);
    doc.text(`RUT: ${data.paciente?.rut || 'N/A'}`, 20, 70);
    doc.text(`Email: ${data.paciente?.email || 'N/A'}`, 20, 80);
    doc.text(`IP: ${data.ip || 'N/A'}`, 20, 90);
    doc.text(`Profesional: ${data.profesionalAsignado || 'Equipo Vínculo Salud'}`, 20, 105);
    
    doc.text('___________________________________', 70, 170);
    doc.text(data.paciente?.nombre || 'Firma digital', 70, 180);
    doc.text('Firma digital del paciente', 70, 190);
    doc.text('(Nombre + RUT tiene valor de firma manuscrita según Ley 20.584)', 70, 200);
    
    doc.save(`consentimiento_${data.paciente?.rut?.replace(/[^0-9kK]/g, '') || 'paciente'}.pdf`);
    showToast('✅ PDF descargado', 'success');
}

// Función para eliminar consentimiento (SOLO ADMIN)
window.eliminarConsentimiento = async function(consentimientoId, rutPaciente) {
    // Solo admin puede eliminar
    if (state.currentUser?.role !== 'admin') {
        showToast('❌ Solo administradores pueden eliminar consentimientos', 'error');
        return;
    }
    
    const confirmar = confirm(`⚠️ ¿Eliminar consentimiento de ${rutPaciente}?\n\nEl paciente deberá firmar nuevamente.`);
    if (!confirmar) return;
    
    try {
        await db.ref(`consentimientos/${consentimientoId}`).remove();
        showToast(`✅ Consentimiento de ${rutPaciente} eliminado`, 'success');
        
        // Recargar la tabla
        await cargarConsentimientosFirebase();
        mostrarTabConsentimientos();
    } catch (error) {
        console.error('Error eliminando:', error);
        showToast('❌ Error al eliminar', 'error');
    }
};

window.mostrarTabConsentimientos = mostrarTabConsentimientos;

// ============================================
// EXPOSICIÓN AL OBJETO WINDOW (para compatibilidad con HTML)
// ============================================

if (typeof window !== 'undefined') {
    window.actualizarContadoresReinicio = actualizarContadoresReinicio;
    window.getEstadisticasGlobales = getEstadisticasGlobales;
    window.eliminarTodasLasFichasIngreso = eliminarTodasLasFichasIngreso;
    window.eliminarTodasLasSesiones = eliminarTodasLasSesiones;
    window.eliminarTodosLosInformes = eliminarTodosLosInformes;
    window.eliminarFichasDePaciente = eliminarFichasDePaciente;
    window.exportarTodasLasFichas = exportarTodasLasFichas;
    window.importarFichas = importarFichas;
    window.limpiarFichasHuerfanas = limpiarFichasHuerfanas;
    window.renderAdminPanel = renderAdminPanel;
    window.addEditButtonsToAdmin = addEditButtonsToAdmin;
    window.mostrarTabsAdmin = mostrarTabsAdmin;
    window.refrescarVistaPublica = refrescarVistaPublica;
    window.verificarPermisosFirebase = verificarPermisosFirebase;
    window.asegurarTablaProfesionales = asegurarTablaProfesionales;
    window.eliminarTodosLosPacientes = async () => {
        if (!state.currentUser?.role === 'admin') return showToast('Solo administradores', 'error');
        const pacientesAEliminar = state.patients.filter(p => !p.isHiddenAdmin);
        if (pacientesAEliminar.length === 0) return showToast('No hay pacientes para eliminar', 'info');
        if (!await confirmAction('⚠️ ¿Estás SEGURO de eliminar TODOS los pacientes? Esto también eliminará TODAS sus fichas clínicas.')) return;
        const patientIds = new Set(pacientesAEliminar.map(p => p.id));
        state.setPatients(state.patients.filter(p => p.isHiddenAdmin));
        state.setFichasIngreso(state.fichasIngreso.filter(f => !patientIds.has(f.patientId)));
        state.setSesiones(state.sesiones.filter(s => !patientIds.has(s.patientId)));
        state.setInformes(state.informes.filter(i => !patientIds.has(i.patientId)));
        await save();
        showToast(`✅ ${pacientesAEliminar.length} pacientes y sus fichas eliminados`, 'success');
        actualizarContadoresReinicio();
    };
    window.eliminarPacientesPrueba = async () => {
        if (!state.currentUser?.role === 'admin') return;
        if (!await confirmAction('¿Eliminar pacientes de prueba?')) return;
        const pacientesPrueba = state.patients.filter(p => p.email?.includes('test') || p.email?.includes('prueba') || p.name?.includes('Test') || p.name?.includes('Prueba') || p.rut === '11111111-1');
        const patientIds = new Set(pacientesPrueba.map(p => p.id));
        state.setPatients(state.patients.filter(p => !pacientesPrueba.includes(p)));
        state.setFichasIngreso(state.fichasIngreso.filter(f => !patientIds.has(f.patientId)));
        state.setSesiones(state.sesiones.filter(s => !patientIds.has(s.patientId)));
        state.setInformes(state.informes.filter(i => !patientIds.has(i.patientId)));
        await save();
        showToast(`✅ ${pacientesPrueba.length} pacientes de prueba y sus fichas eliminados`, 'success');
        actualizarContadoresReinicio();
    };
    window.eliminarTodosLosMensajes = async () => {
        if (!state.currentUser?.role === 'admin') return;
        if (!await confirmAction('⚠️ ¿Eliminar TODOS los mensajes?')) return;
        const cantidad = state.messages.length;
        state.setMessages([]);
        await save();
        showToast(`✅ ${cantidad} mensajes eliminados`, 'success');
        actualizarContadoresReinicio();
    };
    window.restaurarMensajesIniciales = async () => {
        if (!state.currentUser?.role === 'admin') return;
        const mensajesIniciales = [
            { id: Date.now() + 1, name: 'Carolina Méndez', rating: 5, text: 'Excelente profesional, me ayudó mucho con mi ansiedad. Muy recomendada.', date: new Date().toISOString().split('T')[0] },
            { id: Date.now() + 2, name: 'Roberto Campos', rating: 5, text: 'Muy buena página, encontré al especialista que necesitaba rápidamente.', date: new Date().toISOString().split('T')[0] },
            { id: Date.now() + 3, name: 'María José', rating: 4, text: 'Muy profesional, aunque los tiempos de espera a veces son largos.', date: new Date().toISOString().split('T')[0] }
        ];
        state.setMessages(mensajesIniciales);
        await save();
        showToast('✅ Mensajes iniciales restaurados', 'success');
        actualizarContadoresReinicio();
    };
    window.eliminarTodasLasCitas = async () => {
        if (!state.currentUser?.role === 'admin') return;
        if (!await confirmAction('⚠️ ¿Eliminar TODAS las citas?')) return;
        const cantidad = state.appointments.length;
        state.setAppointments([]);
        state.setPendingRequests([]);
        await save();
        showToast(`✅ ${cantidad} citas eliminadas`, 'success');
        actualizarContadoresReinicio();
    };
    window.eliminarCitasPrueba = async () => {
        if (!state.currentUser?.role === 'admin') return;
        if (!await confirmAction('¿Eliminar citas de prueba?')) return;
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 30);
        const citasPrueba = state.appointments.filter(a => new Date(a.date) < fechaLimite || a.patient?.includes('Test') || a.patient?.includes('Prueba'));
        state.setAppointments(state.appointments.filter(a => !citasPrueba.includes(a)));
        await save();
        showToast(`✅ ${citasPrueba.length} citas de prueba eliminadas`, 'success');
        actualizarContadoresReinicio();
    };
    window.reinicioCompleto = reinicioCompleto;

    setTimeout(() => {
        if (state.currentUser?.role === 'admin') {
            mostrarTabsAdmin();
        }
    }, 2000);
}

console.log('✅ admin.js actualizado con módulo de consentimientos (psicólogos ven solo sus pacientes, admin puede eliminar)');