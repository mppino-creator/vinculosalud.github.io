// js/modules/admin.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast } from './utils.js';

// ============================================
// FUNCIONES DE REINICIO PARA ADMIN
// ============================================

// Actualizar contadores en la interfaz
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
    
    // Contadores de fichas clínicas
    if (totalFichas) totalFichas.innerText = state.fichasIngreso.length;
    if (totalSesiones) totalSesiones.innerText = state.sesiones.length;
    if (totalInformes) totalInformes.innerText = state.informes.length;
}

// ============================================
// 🆕 FUNCIÓN PARA REFRESCAR LA VISTA PÚBLICA
// ============================================

window.refrescarVistaPublica = function() {
    console.log('🔄 Refrescando vista pública...');
    
    // Recargar todos los datos editables desde Firebase
    if (typeof window.cargarInstagramData === 'function') {
        window.cargarInstagramData();
    }
    if (typeof window.cargarAboutTexts === 'function') {
        window.cargarAboutTexts();
    }
    if (typeof window.cargarAtencionTexts === 'function') {
        window.cargarAtencionTexts();
    }
    if (typeof window.cargarContactInfo === 'function') {
        window.cargarContactInfo();
    }
    if (typeof window.cargarLogo === 'function') {
        window.cargarLogo();
    }
    if (typeof window.cargarTextos === 'function') {
        window.cargarTextos();
    }
    if (typeof window.cargarFondo === 'function') {
        window.cargarFondo();
    }
    
    // Forzar actualización de las secciones visuales
    if (typeof window.updateInstagramSection === 'function') {
        window.updateInstagramSection();
    }
    if (typeof window.updateAboutSection === 'function') {
        window.updateAboutSection();
    }
    if (typeof window.updateAtencionSection === 'function') {
        window.updateAtencionSection();
    }
    if (typeof window.updateContactSection === 'function') {
        window.updateContactSection();
    }
    
    // Recargar profesionales para asegurar que todo está actualizado
    if (typeof window.filterProfessionals === 'function') {
        setTimeout(() => window.filterProfessionals(), 500);
    }
    
    showToast('✅ Vista pública actualizada', 'success');
    console.log('✅ Vista pública refrescada correctamente');
};

// ============================================
// 🆕 FUNCIÓN PARA MOSTRAR PESTAÑAS DE ADMIN INMEDIATAMENTE
// ============================================
export function mostrarTabsAdmin() {
    console.log('👑 Mostrando pestañas de admin...');
    
    // Lista de IDs de pestañas de admin
    const tabsAdmin = [
        'adminTabProfesionales',
        'adminTabEspecialidades',
        'adminTabPagos',
        'adminTabFondo',
        'adminTabTextos',
        'adminTabLogo',
        'adminTabEstadisticas',
        'adminTabReinicio',
        'messagesTab'
    ];
    
    // Mostrar cada pestaña
    tabsAdmin.forEach(id => {
        const tab = document.getElementById(id);
        if (tab) {
            tab.style.display = 'inline-block';
            console.log(`✅ Mostrando tab: ${id}`);
        }
    });
    
    // También agregar los botones de edición
    addEditButtonsToAdmin();
}

// ============================================
// 🆕 FUNCIÓN PARA AGREGAR BOTONES DE EDICIÓN EN EL DASHBOARD (ACTUALIZADA - SIN BOXES)
// ============================================

export function addEditButtonsToAdmin() {
    console.log('🔧 Agregando botones de edición al panel de admin...');
    
    // Esperar a que exista la pestaña de personalización
    setTimeout(() => {
        // Buscar la pestaña de personalización o crear una nueva sección
        let tabPersonalizacion = document.getElementById('tabPersonalizacion');
        
        // Si no existe la pestaña, buscar en el dashboard
        if (!tabPersonalizacion) {
            // Buscar en las pestañas existentes
            const dashboardTabs = document.getElementById('dashboardTabs');
            if (dashboardTabs) {
                // Crear nueva pestaña si no existe
                if (!document.getElementById('adminTabPersonalizacion')) {
                    const newTab = document.createElement('div');
                    newTab.className = 'tab';
                    newTab.id = 'adminTabPersonalizacion';
                    newTab.setAttribute('onclick', "switchTab('personalizacion')");
                    newTab.innerText = '🎨 Personalización';
                    dashboardTabs.appendChild(newTab);
                }
                
                // Crear contenido de la pestaña si no existe
                if (!document.getElementById('tabPersonalizacion')) {
                    const tabContent = document.createElement('div');
                    tabContent.id = 'tabPersonalizacion';
                    tabContent.className = 'tab-content';
                    
                    // Insertar después de la última pestaña existente
                    const lastTab = document.querySelector('.tab-content:last-of-type');
                    if (lastTab) {
                        lastTab.parentNode.insertBefore(tabContent, lastTab.nextSibling);
                    } else {
                        document.getElementById('dashboard').appendChild(tabContent);
                    }
                }
            }
            
            tabPersonalizacion = document.getElementById('tabPersonalizacion');
        }
        
        if (!tabPersonalizacion) return;
        
        // Limpiar contenido existente
        tabPersonalizacion.innerHTML = '';
        
        // Crear título
        const title = document.createElement('h2');
        title.innerText = '🎨 Personalización del Sitio';
        title.style.marginBottom = '20px';
        tabPersonalizacion.appendChild(title);
        
        // Crear contenedor de botones con estilo mejorado
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'admin-edit-buttons';
        buttonContainer.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 20px 0;';
        
        buttonContainer.innerHTML = `
            <button class="btn-staff" onclick="showAboutModal()" style="background: var(--primario); padding: 15px; font-size: 1rem;">
                <i class="fa fa-users"></i> Editar Quiénes Somos
            </button>
            <button class="btn-staff" onclick="showAtencionModal()" style="background: var(--ocre-calido); padding: 15px; font-size: 1rem;">
                <i class="fa fa-list"></i> Editar Tipos de Atención
            </button>
            <button class="btn-staff" onclick="showContactModal()" style="background: var(--verde-azulado-claro); padding: 15px; font-size: 1rem;">
                <i class="fa fa-address-card"></i> Editar Contacto
            </button>
            <button class="btn-staff" onclick="showInstagramModal()" style="background: #d62976; padding: 15px; font-size: 1rem;">
                <i class="fab fa-instagram"></i> Editar Sección Instagram
            </button>
            <button class="btn-staff" onclick="showTextsModal()" style="background: var(--verde-azulado-profundo); padding: 15px; font-size: 1rem;">
                <i class="fa fa-pen"></i> Editar Textos Hero
            </button>
            <button class="btn-staff" onclick="showLogoModal()" style="background: var(--box-color); padding: 15px; font-size: 1rem;">
                <i class="fa fa-image"></i> Editar Logo
            </button>
            <button class="btn-staff" onclick="showBackgroundImageModal()" style="background: var(--exito); padding: 15px; font-size: 1rem;">
                <i class="fa fa-wallpaper"></i> Editar Fondo
            </button>
            <!-- 🆕 NUEVO BOTÓN DE REFRESCAR -->
            <button class="btn-staff" onclick="refrescarVistaPublica()" style="background: #17a2b8; padding: 15px; font-size: 1rem;">
                <i class="fa fa-sync-alt"></i> Refrescar Vista Pública
            </button>
        `;
        
        tabPersonalizacion.appendChild(buttonContainer);
        
        // Agregar sección de estadísticas de textos
        const statsContainer = document.createElement('div');
        statsContainer.style.cssText = 'margin-top: 30px; background: white; border-radius: 20px; padding: 20px; border: 1px solid var(--gris-claro);';
        statsContainer.innerHTML = `
            <h3 style="margin-bottom: 15px; color: var(--verde-azulado-profundo);">📊 Estado de Textos Editables</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div style="background: var(--verde-grisaceo-claro); padding: 15px; border-radius: 12px;">
                    <div style="font-weight: bold; margin-bottom: 5px;">Misión</div>
                    <div style="font-size: 0.9rem; color: var(--texto-secundario);">${state.missionText?.substring(0, 50)}...</div>
                </div>
                <div style="background: var(--verde-grisaceo-claro); padding: 15px; border-radius: 12px;">
                    <div style="font-weight: bold; margin-bottom: 5px;">Visión</div>
                    <div style="font-size: 0.9rem; color: var(--texto-secundario);">${state.visionText?.substring(0, 50)}...</div>
                </div>
                <div style="background: var(--verde-grisaceo-claro); padding: 15px; border-radius: 12px;">
                    <div style="font-weight: bold; margin-bottom: 5px;">Email Contacto</div>
                    <div style="font-size: 0.9rem; color: var(--texto-secundario);">${state.contactInfo?.email || 'No definido'}</div>
                </div>
                <div style="background: var(--verde-grisaceo-claro); padding: 15px; border-radius: 12px;">
                    <div style="font-weight: bold; margin-bottom: 5px;">Teléfono</div>
                    <div style="font-size: 0.9rem; color: var(--texto-secundario);">${state.contactInfo?.phone || 'No definido'}</div>
                </div>
                <!-- 🆕 Instagram preview -->
                <div style="background: var(--verde-grisaceo-claro); padding: 15px; border-radius: 12px;">
                    <div style="font-weight: bold; margin-bottom: 5px;">Instagram</div>
                    <div style="font-size: 0.9rem; color: var(--texto-secundario);">${state.instagramData?.title || 'No configurado'}</div>
                </div>
            </div>
        `;
        
        tabPersonalizacion.appendChild(statsContainer);
        
        console.log('✅ Botones de edición agregados al panel de admin');
    }, 500); // Reducido de 2000ms a 500ms para que aparezca más rápido
}

// ============================================
// FUNCIONES DE ESTADÍSTICAS GLOBALES
// ============================================

/**
 * Obtiene estadísticas globales del sistema
 * @returns {Object} Estadísticas completas
 */
export function getEstadisticasGlobales() {
    // Pacientes
    const totalPacientes = state.patients.filter(p => !p.isHiddenAdmin).length;
    const pacientesConFicha = state.fichasIngreso.length;
    const pacientesSinFicha = totalPacientes - pacientesConFicha;
    
    // Sesiones
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
    
    // Informes
    const totalInformes = state.informes.length;
    const informesPorTipo = {
        psicodiagnostico: state.informes.filter(i => i.tipo === 'psicodiagnostico').length,
        cierre: state.informes.filter(i => i.tipo === 'cierre').length
    };
    
    // Citas y financiero
    const totalCitas = state.appointments.length;
    const ingresosTotales = state.appointments
        .filter(a => a.paymentStatus === 'pagado')
        .reduce((sum, a) => sum + (a.price || 0), 0);
    
    const ingresosPorMes = {};
    state.appointments
        .filter(a => a.paymentStatus === 'pagado')
        .forEach(a => {
            if (a.date) {
                const [año, mes] = a.date.split('-');
                if (año && mes) {
                    const key = `${año}-${mes}`;
                    ingresosPorMes[key] = (ingresosPorMes[key] || 0) + (a.price || 0);
                }
            }
        });
    
    // Profesionales activos
    const profesionalesActivos = new Set();
    state.appointments.forEach(a => profesionalesActivos.add(a.psychId));
    state.sesiones.forEach(s => {
        const patient = state.patients.find(p => p.id == s.patientId);
        if (patient) profesionalesActivos.add(patient.psychId);
    });
    
    // Rangos de edad
    const rangosEdad = {
        '0-18': 0,
        '19-30': 0,
        '31-45': 0,
        '46-60': 0,
        '61+': 0,
        'sin especificar': 0
    };

    state.patients.forEach(p => {
        if (!p.birthdate) {
            rangosEdad['sin especificar']++;
            return;
        }
        const edad = calcularEdad(p.birthdate);
        if (edad <= 18) rangosEdad['0-18']++;
        else if (edad <= 30) rangosEdad['19-30']++;
        else if (edad <= 45) rangosEdad['31-45']++;
        else if (edad <= 60) rangosEdad['46-60']++;
        else rangosEdad['61+']++;
    });
    
    return {
        pacientes: {
            total: totalPacientes,
            conFicha: pacientesConFicha,
            sinFicha: pacientesSinFicha,
            rangosEdad,
            porcentajeConFicha: totalPacientes > 0 ? ((pacientesConFicha / totalPacientes) * 100).toFixed(1) : 0
        },
        fichasClinicas: {
            fichasIngreso: state.fichasIngreso.length,
            sesiones: totalSesiones,
            informes: totalInformes,
            sesionesPorMes,
            informesPorTipo
        },
        citas: {
            total: totalCitas,
            pendientes: state.appointments.filter(a => a.paymentStatus === 'pendiente').length,
            pagadas: state.appointments.filter(a => a.paymentStatus === 'pagado').length,
            rechazadas: state.appointments.filter(a => a.paymentStatus === 'rechazado').length
        },
        financiero: {
            ingresosTotales,
            ingresosPorMes,
            promedioPorCita: totalCitas > 0 ? (ingresosTotales / totalCitas).toFixed(0) : 0
        },
        profesionales: {
            total: state.staff.filter(s => !s.isHiddenAdmin).length,
            activos: profesionalesActivos.size
        }
    };
}

/**
 * Calcula la edad a partir de fecha de nacimiento
 */
function calcularEdad(birthdate) {
    if (!birthdate) return 0;
    const hoy = new Date();
    const nacimiento = new Date(birthdate);
    if (isNaN(nacimiento.getTime())) return 0;
    
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    return edad;
}

// ============================================
// FUNCIONES DE GESTIÓN DE FICHAS CLÍNICAS
// ============================================

/**
 * Eliminar todas las fichas de ingreso
 */
export function eliminarTodasLasFichasIngreso() {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    
    if (confirm('⚠️ ¿Eliminar TODAS las fichas de ingreso? Esta acción no se puede deshacer.')) {
        const cantidad = state.fichasIngreso.length;
        state.setFichasIngreso([]);
        import('../main.js').then(main => main.save());
        showToast(`✅ ${cantidad} fichas de ingreso eliminadas`, 'success');
        actualizarContadoresReinicio();
    }
}

/**
 * Eliminar todas las sesiones
 */
export function eliminarTodasLasSesiones() {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    
    if (confirm('⚠️ ¿Eliminar TODAS las sesiones/notas de evolución? Esta acción no se puede deshacer.')) {
        const cantidad = state.sesiones.length;
        state.setSesiones([]);
        import('../main.js').then(main => main.save());
        showToast(`✅ ${cantidad} sesiones eliminadas`, 'success');
        actualizarContadoresReinicio();
    }
}

/**
 * Eliminar todos los informes
 */
export function eliminarTodosLosInformes() {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    
    if (confirm('⚠️ ¿Eliminar TODOS los informes? Esta acción no se puede deshacer.')) {
        const cantidad = state.informes.length;
        state.setInformes([]);
        import('../main.js').then(main => main.save());
        showToast(`✅ ${cantidad} informes eliminados`, 'success');
        actualizarContadoresReinicio();
    }
}

/**
 * Eliminar fichas de un paciente específico
 */
export function eliminarFichasDePaciente(patientId) {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    
    const patient = state.patients.find(p => p.id == patientId);
    if (!patient) return;
    
    if (confirm(`⚠️ ¿Eliminar TODAS las fichas clínicas de ${patient.name}?`)) {
        state.setFichasIngreso(state.fichasIngreso.filter(f => f.patientId != patientId));
        state.setSesiones(state.sesiones.filter(s => s.patientId != patientId));
        state.setInformes(state.informes.filter(i => i.patientId != patientId));
        
        import('../main.js').then(main => main.save());
        showToast(`✅ Fichas de ${patient.name} eliminadas`, 'success');
        actualizarContadoresReinicio();
    }
}

// ============================================
// FUNCIONES DE RESPALDO Y RESTAURACIÓN
// ============================================

/**
 * Exportar todas las fichas clínicas a JSON
 */
export function exportarTodasLasFichas() {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    
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
            boxes: state.boxes, // Se mantiene por compatibilidad
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

/**
 * Importar fichas clínicas desde JSON
 */
export function importarFichas() {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(ev) {
            try {
                const backup = JSON.parse(ev.target.result);
                
                if (confirm(`¿Importar datos del backup?`)) {
                    
                    // Importar textos editables si existen
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
                    
                    // Importar datos
                    if (backup.datos?.pacientes) {
                        state.setPatients([...state.patients, ...backup.datos.pacientes]);
                    }
                    if (backup.datos?.fichasIngreso) {
                        state.setFichasIngreso([...state.fichasIngreso, ...backup.datos.fichasIngreso]);
                    }
                    if (backup.datos?.sesiones) {
                        state.setSesiones([...state.sesiones, ...backup.datos.sesiones]);
                    }
                    if (backup.datos?.informes) {
                        state.setInformes([...state.informes, ...backup.datos.informes]);
                    }
                    if (backup.datos?.citas) {
                        state.setAppointments([...state.appointments, ...backup.datos.citas]);
                    }
                    if (backup.datos?.mensajes) {
                        state.setMessages([...state.messages, ...backup.datos.mensajes]);
                    }
                    if (backup.datos?.profesionales) {
                        state.setStaff([...state.staff, ...backup.datos.profesionales]);
                    }
                    if (backup.datos?.boxes) {
                        state.setBoxes([...state.boxes, ...backup.datos.boxes]); // Se mantiene por compatibilidad
                    }
                    if (backup.datos?.specialties) {
                        state.setSpecialties([...state.specialties, ...backup.datos.specialties]);
                    }
                    
                    import('../main.js').then(main => main.save());
                    showToast('✅ Datos importados correctamente', 'success');
                    actualizarContadoresReinicio();
                    
                    // Actualizar vistas
                    if (typeof window.updateAboutSection === 'function') window.updateAboutSection();
                    if (typeof window.updateAtencionSection === 'function') window.updateAtencionSection();
                    if (typeof window.updateContactSection === 'function') window.updateContactSection();
                    if (typeof window.updateInstagramSection === 'function') window.updateInstagramSection();
                }
            } catch (error) {
                console.error('Error importando:', error);
                showToast('❌ Error al importar el archivo', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

/**
 * Limpiar fichas huérfanas (sin paciente asociado)
 */
export function limpiarFichasHuerfanas() {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    
    const patientIds = new Set(state.patients.map(p => p.id));
    
    const fichasHuerfanas = state.fichasIngreso.filter(f => !patientIds.has(f.patientId));
    const sesionesHuerfanas = state.sesiones.filter(s => !patientIds.has(s.patientId));
    const informesHuerfanos = state.informes.filter(i => !patientIds.has(i.patientId));
    
    if (fichasHuerfanas.length === 0 && sesionesHuerfanas.length === 0 && informesHuerfanos.length === 0) {
        showToast('No hay fichas huérfanas', 'info');
        return;
    }
    
    if (confirm(`¿Eliminar ${fichasHuerfanas.length} fichas, ${sesionesHuerfanas.length} sesiones y ${informesHuerfanos.length} informes huérfanos?`)) {
        state.setFichasIngreso(state.fichasIngreso.filter(f => patientIds.has(f.patientId)));
        state.setSesiones(state.sesiones.filter(s => patientIds.has(s.patientId)));
        state.setInformes(state.informes.filter(i => patientIds.has(i.patientId)));
        
        import('../main.js').then(main => main.save());
        showToast('✅ Fichas huérfanas eliminadas', 'success');
        actualizarContadoresReinicio();
    }
}

// ============================================
// FUNCIONES DE REINICIO (ASIGNADAS A WINDOW)
// ============================================

// Eliminar todos los pacientes
window.eliminarTodosLosPacientes = function() {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    
    if (confirm('⚠️ ¿Estás SEGURO de eliminar TODOS los pacientes? Esto también eliminará TODAS sus fichas clínicas. Esta acción no se puede deshacer.')) {
        const pacientesAEliminar = state.patients.filter(p => !p.isHiddenAdmin);
        
        if (pacientesAEliminar.length === 0) {
            showToast('No hay pacientes para eliminar', 'info');
            return;
        }
        
        const patientIds = new Set(pacientesAEliminar.map(p => p.id));
        
        state.setPatients(state.patients.filter(p => p.isHiddenAdmin));
        state.setFichasIngreso(state.fichasIngreso.filter(f => !patientIds.has(f.patientId)));
        state.setSesiones(state.sesiones.filter(s => !patientIds.has(s.patientId)));
        state.setInformes(state.informes.filter(i => !patientIds.has(i.patientId)));
        
        import('../main.js').then(main => main.save());
        showToast(`✅ ${pacientesAEliminar.length} pacientes y sus fichas eliminados`, 'success');
        actualizarContadoresReinicio();
    }
};

// Eliminar solo pacientes de prueba
window.eliminarPacientesPrueba = function() {
    if (!state.currentUser || state.currentUser.role !== 'admin') return;
    
    if (confirm('¿Eliminar pacientes de prueba?')) {
        const pacientesPrueba = state.patients.filter(p => 
            p.email?.includes('test') || 
            p.email?.includes('prueba') || 
            p.name?.includes('Test') || 
            p.name?.includes('Prueba') ||
            p.rut === '11111111-1'
        );
        
        const patientIds = new Set(pacientesPrueba.map(p => p.id));
        
        state.setPatients(state.patients.filter(p => !pacientesPrueba.includes(p)));
        state.setFichasIngreso(state.fichasIngreso.filter(f => !patientIds.has(f.patientId)));
        state.setSesiones(state.sesiones.filter(s => !patientIds.has(s.patientId)));
        state.setInformes(state.informes.filter(i => !patientIds.has(i.patientId)));
        
        import('../main.js').then(main => main.save());
        showToast(`✅ ${pacientesPrueba.length} pacientes de prueba y sus fichas eliminados`, 'success');
        actualizarContadoresReinicio();
    }
};

// Eliminar todos los mensajes
window.eliminarTodosLosMensajes = function() {
    if (!state.currentUser || state.currentUser.role !== 'admin') return;
    
    if (confirm('⚠️ ¿Eliminar TODOS los mensajes?')) {
        const mensajesAEliminar = state.messages.length;
        state.setMessages([]);
        import('../main.js').then(main => main.save());
        showToast(`✅ ${mensajesAEliminar} mensajes eliminados`, 'success');
        actualizarContadoresReinicio();
    }
};

// Restaurar mensajes iniciales
window.restaurarMensajesIniciales = function() {
    if (!state.currentUser || state.currentUser.role !== 'admin') return;
    
    const mensajesIniciales = [
        { id: Date.now() + 1, name: 'Carolina Méndez', rating: 5, text: 'Excelente profesional, me ayudó mucho con mi ansiedad. Muy recomendada.', date: new Date().toISOString().split('T')[0] },
        { id: Date.now() + 2, name: 'Roberto Campos', rating: 5, text: 'Muy buena página, encontré al especialista que necesitaba rápidamente.', date: new Date().toISOString().split('T')[0] },
        { id: Date.now() + 3, name: 'María José', rating: 4, text: 'Muy profesional, aunque los tiempos de espera a veces son largos.', date: new Date().toISOString().split('T')[0] }
    ];
    
    state.setMessages(mensajesIniciales);
    import('../main.js').then(main => main.save());
    showToast('✅ Mensajes iniciales restaurados', 'success');
    actualizarContadoresReinicio();
};

// Eliminar todas las citas
window.eliminarTodasLasCitas = function() {
    if (!state.currentUser || state.currentUser.role !== 'admin') return;
    
    if (confirm('⚠️ ¿Eliminar TODAS las citas?')) {
        const citasAEliminar = state.appointments.length;
        state.setAppointments([]);
        state.setPendingRequests([]);
        import('../main.js').then(main => main.save());
        showToast(`✅ ${citasAEliminar} citas eliminadas`, 'success');
        actualizarContadoresReinicio();
    }
};

// Eliminar citas de prueba
window.eliminarCitasPrueba = function() {
    if (!state.currentUser || state.currentUser.role !== 'admin') return;
    
    if (confirm('¿Eliminar citas de prueba?')) {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 30);
        
        const citasPrueba = state.appointments.filter(a => {
            const fechaCita = new Date(a.date);
            return fechaCita < fechaLimite || a.patient?.includes('Test') || a.patient?.includes('Prueba');
        });
        
        state.setAppointments(state.appointments.filter(a => !citasPrueba.includes(a)));
        import('../main.js').then(main => main.save());
        showToast(`✅ ${citasPrueba.length} citas de prueba eliminadas`, 'success');
        actualizarContadoresReinicio();
    }
};

// Reinicio completo del sistema
window.reinicioCompleto = function() {
    if (!state.currentUser || state.currentUser.role !== 'admin') return;
    
    if (confirm('🔥 ¿REINICIO COMPLETO? Esto eliminará TODOS los pacientes, mensajes, citas, solicitudes, FICHAS CLÍNICAS Y TEXTOS EDITABLES. Los profesionales se mantienen. ¿Continuar?')) {
        if (confirm('ÚLTIMA CONFIRMACIÓN: ¿Estás ABSOLUTAMENTE SEGURO?')) {
            state.setPatients([]);
            state.setMessages([]);
            state.setAppointments([]);
            state.setPendingRequests([]);
            state.setFichasIngreso([]);
            state.setSesiones([]);
            state.setInformes([]);
            
            // Reiniciar textos editables
            state.missionText = 'Acompañar a las personas en su proceso de sanación emocional...';
            state.visionText = 'Ser un referente en salud mental en la región...';
            state.aboutTeamText = 'Nuestro equipo está formado por profesionales...';
            state.aboutImage = '';
            state.atencionTexts = {
                online: { title: 'Online', description: 'Sesiones por videollamada' },
                presencial: { title: 'Presencial', description: 'Atención en consultorio' },
                pareja: { title: 'Pareja', description: 'Terapia de pareja' },
                familiar: { title: 'Familiar', description: 'Terapia familiar' }
            };
            state.contactInfo = {
                email: 'vinculosalid@gmail.com',
                phone: '+56 9 1234 5678',
                address: 'Ohiggins 263, Concepción'
            };
            
            import('../main.js').then(main => main.save());
            showToast('✅ Sistema reiniciado completamente', 'success');
            actualizarContadoresReinicio();
            
            // Actualizar vistas
            if (typeof window.updateAboutSection === 'function') window.updateAboutSection();
            if (typeof window.updateAtencionSection === 'function') window.updateAtencionSection();
            if (typeof window.updateContactSection === 'function') window.updateContactSection();
            if (typeof window.updateInstagramSection === 'function') window.updateInstagramSection();
        }
    }
};

// ============================================
// FUNCIÓN PARA RENDERIZAR PANEL DE ADMIN
// ============================================

export function renderAdminPanel() {
    const container = document.getElementById('adminPanelStats');
    if (!container) return;
    
    const stats = getEstadisticasGlobales();
    
    container.innerHTML = `
        <div style="padding:20px;">
            <h2 style="margin-bottom:20px;">📊 Panel de Administración</h2>
            
            <!-- Tarjetas resumen -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin-bottom:30px;">
                <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <div style="font-size:32px; font-weight:bold; color:white;">${stats.pacientes.total}</div>
                    <div style="color:rgba(255,255,255,0.9);">Pacientes</div>
                    <div style="font-size:12px; color:rgba(255,255,255,0.7);">${stats.pacientes.conFicha} con ficha</div>
                </div>
                
                <div class="stat-card" style="background: linear-gradient(135deg, #f6b023 0%, #f98d39 100%);">
                    <div style="font-size:32px; font-weight:bold; color:white;">${stats.fichasClinicas.fichasIngreso}</div>
                    <div style="color:rgba(255,255,255,0.9);">Fichas de Ingreso</div>
                </div>
                
                <div class="stat-card" style="background: linear-gradient(135deg, #34c759 0%, #30b0c0 100%);">
                    <div style="font-size:32px; font-weight:bold; color:white;">${stats.fichasClinicas.sesiones}</div>
                    <div style="color:rgba(255,255,255,0.9);">Sesiones Registradas</div>
                </div>
                
                <div class="stat-card" style="background: linear-gradient(135deg, #ff3b30 0%, #ff6b6b 100%);">
                    <div style="font-size:32px; font-weight:bold; color:white;">${stats.fichasClinicas.informes}</div>
                    <div style="color:rgba(255,255,255,0.9);">Informes</div>
                </div>
            </div>
            
            <!-- Botón para ver estadísticas completas -->
            <div style="margin-top:30px; text-align:center;">
                <button class="btn-staff" onclick="switchTab('estadisticas')" 
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding:15px 30px; font-size:16px;">
                    <i class="fa fa-chart-line"></i> Ver Estadísticas Completas
                </button>
            </div>
        </div>
    `;
}

// ============================================
// EXPORTAR DATOS A EXCEL
// ============================================

window.exportarDatosExcel = function(tipo) {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden exportar datos', 'error');
        return;
    }
    
    let datos = [];
    let nombreArchivo = '';
    let headers = [];
    
    switch(tipo) {
        case 'pacientes':
            datos = state.patients.filter(p => !p.isHiddenAdmin);
            nombreArchivo = `pacientes_${new Date().toISOString().split('T')[0]}.csv`;
            headers = ['RUT', 'Nombre', 'Email', 'Teléfono', 'Fecha Nacimiento', 'Edad', 'Profesional', 'Notas'];
            
            let csvPacientes = headers.join(',') + '\n';
            datos.forEach(p => {
                const profesional = state.staff.find(s => s.id == p.psychId)?.name || 'Sin asignar';
                const edad = p.birthdate ? calcularEdad(p.birthdate) : '';
                csvPacientes += `"${p.rut || ''}","${p.name || ''}","${p.email || ''}","${p.phone || ''}","${p.birthdate || ''}","${edad}","${profesional}","${(p.notes || '').replace(/"/g, '""')}"\n`;
            });
            
            descargarCSV(csvPacientes, nombreArchivo);
            showToast(`✅ ${datos.length} pacientes exportados`, 'success');
            break;
            
        case 'citas':
            datos = state.appointments;
            nombreArchivo = `citas_${new Date().toISOString().split('T')[0]}.csv`;
            headers = ['Fecha', 'Hora', 'Paciente', 'RUT', 'Profesional', 'Tipo', 'Valor', 'Pago', 'Estado'];
            
            let csvCitas = headers.join(',') + '\n';
            datos.forEach(c => {
                csvCitas += `"${c.date || ''}","${c.time || ''}","${c.patient || ''}","${c.patientRut || ''}","${c.psych || ''}","${c.type || ''}",${c.price || 0},"${c.paymentStatus || ''}","${c.status || ''}"\n`;
            });
            
            descargarCSV(csvCitas, nombreArchivo);
            showToast(`✅ ${datos.length} citas exportadas`, 'success');
            break;
            
        case 'profesionales':
            datos = state.staff.filter(s => !s.isHiddenAdmin);
            nombreArchivo = `profesionales_${new Date().toISOString().split('T')[0]}.csv`;
            headers = ['Nombre', 'Email', 'Especialidades', 'WhatsApp', 'Instagram', 'Precio Online', 'Precio Presencial', 'Título', 'Experiencia'];
            
            let csvProfesionales = headers.join(',') + '\n';
            datos.forEach(p => {
                const specs = Array.isArray(p.spec) ? p.spec.join(' | ') : p.spec;
                csvProfesionales += `"${p.name || ''}","${p.email || ''}","${specs || ''}","${p.whatsapp || ''}","${p.instagram || ''}",${p.priceOnline || 0},${p.pricePresencial || 0},"${p.title || ''}","${p.experience || 0}"\n`;
            });
            
            descargarCSV(csvProfesionales, nombreArchivo);
            showToast(`✅ ${datos.length} profesionales exportados`, 'success');
            break;
            
        case 'mensajes':
            datos = state.messages;
            nombreArchivo = `mensajes_${new Date().toISOString().split('T')[0]}.csv`;
            headers = ['Fecha', 'Nombre', 'Profesional', 'Calificación', 'Mensaje'];
            
            let csvMensajes = headers.join(',') + '\n';
            datos.forEach(m => {
                csvMensajes += `"${m.date || ''}","${m.name || ''}","${m.therapistName || 'General'}",${m.rating || 0},"${(m.text || '').replace(/"/g, '""')}"\n`;
            });
            
            descargarCSV(csvMensajes, nombreArchivo);
            showToast(`✅ ${datos.length} mensajes exportados`, 'success');
            break;
            
        case 'fichas':
            datos = state.fichasIngreso;
            nombreArchivo = `fichas_ingreso_${new Date().toISOString().split('T')[0]}.csv`;
            headers = ['Paciente ID', 'Fecha', 'Motivo Consulta', 'Psicólogo'];
            
            let csvFichas = headers.join(',') + '\n';
            datos.forEach(f => {
                const patient = state.patients.find(p => p.id == f.patientId);
                csvFichas += `"${f.patientId || ''}","${f.fechaIngreso || ''}","${(f.motivoConsulta || '').replace(/"/g, '""')}","${patient?.name || 'Desconocido'}"\n`;
            });
            
            descargarCSV(csvFichas, nombreArchivo);
            showToast(`✅ ${datos.length} fichas exportadas`, 'success');
            break;
    }
};

function descargarCSV(csv, nombreArchivo) {
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================
// 🆕 FUNCIÓN PARA VERIFICAR PERMISOS DE FIREBASE
// ============================================

window.verificarPermisosFirebase = function() {
    console.log('🔍 Verificando permisos de Firebase...');
    
    // Intentar escribir un dato de prueba
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
};

// ============================================
// EXPORTAR FUNCIONES AL OBJETO WINDOW
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
    window.mostrarTabsAdmin = mostrarTabsAdmin; // ✅ NUEVA LÍNEA
    window.refrescarVistaPublica = refrescarVistaPublica;
    window.verificarPermisosFirebase = verificarPermisosFirebase;
    
    // Llamar a la función para agregar botones después de un tiempo
    setTimeout(() => {
        if (state.currentUser?.role === 'admin') {
            mostrarTabsAdmin(); // ✅ Cambiado de addEditButtonsToAdmin a mostrarTabsAdmin
        }
    }, 2000); // Reducido de 3000ms a 2000ms
}

console.log('✅ admin.js cargado con estadísticas integradas, botones de edición, sección Instagram, REFRESCO DE VISTA v3.0 y MOSTRAR TABS INMEDIATO (sin boxes)');