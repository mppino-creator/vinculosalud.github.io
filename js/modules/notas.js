// js/modules/notas.js - VERSIÓN DEFINITIVA (CON SERIALIZACIÓN Y SIN RECARGA AUTOMÁTICA)
import { db, auth } from '../config/firebase.js';
import { ref, push, set, update, remove, get } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js';
import * as state from './state.js';

console.log('📦 Cargando módulo notas.js (versión completa y segura)...');

let currentUser = null;
let currentRole = null;
let allNotas = [];
let allPatients = [];
let cargandoNotas = false;

// ---------------------------------------------------------------------
// 1. Obtener pacientes (carga única, sin escucha)
// ---------------------------------------------------------------------
async function cargarPacientesParaNotas() {
    if (!currentUser) {
        console.warn('⚠️ No hay usuario logueado');
        allPatients = [];
        actualizarSelects();
        return;
    }

    console.log(`👤 Cargando pacientes para rol: ${currentRole}, UID: ${currentUser.uid}`);

    try {
        const citasSnap = await get(ref(db, 'appointments'));
        const citas = citasSnap.val() || {};

        let citasDelProfesional = Object.values(citas);
        if (currentRole !== 'admin' && currentUser.uid) {
            citasDelProfesional = citasDelProfesional.filter(cita => cita.psychId === currentUser.uid);
            console.log(`🔍 Citas filtradas (psicólogo): ${citasDelProfesional.length}`);
        } else if (currentRole === 'admin') {
            console.log(`🔍 Citas totales (admin): ${citasDelProfesional.length}`);
        } else {
            allPatients = [];
            actualizarSelects();
            return;
        }

        const patientIds = [...new Set(citasDelProfesional.map(cita => cita.patientId).filter(id => id))];
        if (patientIds.length === 0) {
            allPatients = [];
            actualizarSelects();
            return;
        }

        const patientsSnap = await get(ref(db, 'patients'));
        const allPatientsData = patientsSnap.val() || {};

        allPatients = patientIds.map(id => {
            const p = allPatientsData[id] || {};
            return {
                id: String(id),
                nombreCompleto: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Paciente sin nombre',
                rut: p.rut || ''
            };
        }).filter(p => p.id);

        console.log(`✅ Pacientes cargados:`, allPatients.map(p => p.nombreCompleto));
        actualizarSelects();
    } catch (error) {
        console.error('❌ Error cargando pacientes:', error);
        allPatients = [];
        actualizarSelects();
    }
}

function actualizarSelects() {
    const selectPaciente = document.getElementById('notaPacienteId');
    const filtroPaciente = document.getElementById('filtroNotaPaciente');

    if (selectPaciente) {
        selectPaciente.innerHTML = '<option value="">Seleccionar paciente</option>';
        allPatients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id;
            option.textContent = `${patient.nombreCompleto} (${patient.rut || 'sin RUT'})`;
            selectPaciente.appendChild(option);
        });
    }

    if (filtroPaciente) {
        filtroPaciente.innerHTML = '<option value="">Todos los pacientes</option>';
        allPatients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id;
            option.textContent = patient.nombreCompleto;
            filtroPaciente.appendChild(option);
        });
    }
}

// ---------------------------------------------------------------------
// 2. Cargar notas (extracción manual, sin recursión)
// ---------------------------------------------------------------------
async function cargarNotas() {
    if (!currentUser) {
        console.warn('⚠️ No hay usuario, no se cargan notas');
        allNotas = [];
        renderNotasListado();
        return;
    }

    if (cargandoNotas) {
        console.log('⏳ Ya se están cargando las notas, omitiendo...');
        return;
    }

    cargandoNotas = true;
    try {
        const sesionesSnap = await get(ref(db, 'sesiones'));
        const data = sesionesSnap.val() || {};

        // Extracción manual de datos (evita JSON.parse/stringify)
        const nuevasNotas = [];
        for (const [id, nota] of Object.entries(data)) {
            if (!nota || typeof nota !== 'object') continue;
            const patient = allPatients.find(p => p.id == nota.patientId);
            nuevasNotas.push({
                id: String(id),
                patientId: String(nota.patientId || ''),
                date: String(nota.date || ''),
                content: String(nota.content || ''),
                createdAt: nota.createdAt || Date.now(),
                updatedAt: nota.updatedAt || Date.now(),
                createdBy: String(nota.createdBy || ''),
                professionalId: String(nota.professionalId || ''),
                pacienteNombre: patient ? patient.nombreCompleto : 'Paciente desconocido'
            });
        }

        if (currentRole === 'psych') {
            allNotas = nuevasNotas.filter(nota => allPatients.some(p => p.id == nota.patientId));
        } else {
            allNotas = nuevasNotas;
        }

        renderNotasListado();
        console.log(`✅ Notas cargadas: ${allNotas.length} registros`);
    } catch (error) {
        console.error('Error cargando notas:', error);
        allNotas = [];
        renderNotasListado();
    } finally {
        cargandoNotas = false;
    }
}

function renderNotasListado() {
    const container = document.getElementById('notasListado');
    if (!container) return;

    const pacienteFiltro = document.getElementById('filtroNotaPaciente')?.value;
    const fechaFiltro = document.getElementById('filtroNotaFecha')?.value;
    const busquedaFiltro = document.getElementById('filtroNotaBusqueda')?.value?.toLowerCase();

    let notasFiltradas = [...allNotas];
    if (pacienteFiltro) notasFiltradas = notasFiltradas.filter(n => n.patientId === pacienteFiltro);
    if (fechaFiltro) notasFiltradas = notasFiltradas.filter(n => n.date === fechaFiltro);
    if (busquedaFiltro) {
        notasFiltradas = notasFiltradas.filter(n =>
            n.content?.toLowerCase().includes(busquedaFiltro) ||
            n.pacienteNombre?.toLowerCase().includes(busquedaFiltro)
        );
    }

    notasFiltradas.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (notasFiltradas.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">📭 No hay notas que coincidan con los filtros.</div>';
        return;
    }

    container.innerHTML = notasFiltradas.map(nota => `
        <div class="nota-card" style="background: white; border-radius: 16px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border-left: 4px solid var(--primario);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <strong style="font-size: 1.1rem;">${escapeHtml(nota.pacienteNombre)}</strong>
                    <span style="margin-left: 15px; color: #666;">📅 ${new Date(nota.date).toLocaleDateString()}</span>
                </div>
                <div>
                    <button class="btn-staff" style="background: var(--atencion); padding: 4px 12px; margin-right: 8px;" onclick="editarNota('${nota.id}')">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button class="btn-staff" style="background: var(--rojo-alerta); padding: 4px 12px;" onclick="eliminarNota('${nota.id}')">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </div>
            <div style="margin-top: 12px; white-space: pre-line;">${escapeHtml(nota.content || '').replace(/\n/g, '<br>')}</div>
        </div>
    `).join('');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

// ---------------------------------------------------------------------
// 3. Funciones del modal (con serialización forzada y sin recarga automática)
// ---------------------------------------------------------------------
window.mostrarModalNuevaNota = function() {
    document.getElementById('notaModalTitulo').innerText = 'Nueva Nota de Evolución';
    document.getElementById('notaId').value = '';
    document.getElementById('notaFecha').value = new Date().toISOString().slice(0,10);
    document.getElementById('notaContenido').value = '';
    document.getElementById('notaPacienteId').disabled = false;
    document.getElementById('notaPacienteId').value = '';
    document.getElementById('notaModal').style.display = 'flex';
};

window.editarNota = function(notaId) {
    const nota = allNotas.find(n => n.id === notaId);
    if (!nota) return;
    document.getElementById('notaModalTitulo').innerText = 'Editar Nota';
    document.getElementById('notaId').value = notaId;
    document.getElementById('notaPacienteId').value = nota.patientId;
    document.getElementById('notaPacienteId').disabled = true;
    document.getElementById('notaFecha').value = nota.date;
    document.getElementById('notaContenido').value = nota.content;
    document.getElementById('notaModal').style.display = 'flex';
};

window.guardarNota = async function() {
    const id = document.getElementById('notaId').value;
    const patientId = document.getElementById('notaPacienteId').value;
    const date = document.getElementById('notaFecha').value;
    const content = document.getElementById('notaContenido').value.trim();

    if (!patientId) { alert('Selecciona un paciente'); return; }
    if (!date) { alert('Selecciona una fecha'); return; }
    if (!content) { alert('El contenido no puede estar vacío'); return; }
    if (!state.currentUser || !state.currentUser.data?.id) { alert('No hay usuario logueado'); return; }

    // Objeto plano base
    const rawData = {
        patientId: String(patientId),
        date: String(date),
        content: String(content),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: String(state.currentUser.data.id),
        professionalId: String(state.currentUser.data.id)
    };

    // 🔥 Limpieza extrema: serializar y deserializar para eliminar cualquier referencia circular
    let cleanData;
    try {
        cleanData = JSON.parse(JSON.stringify(rawData));
    } catch (e) {
        console.error('Error al serializar la nota:', e);
        alert('Error al procesar la nota. Intenta con menos caracteres o sin caracteres especiales.');
        return;
    }

    console.log('📝 Nota a guardar (datos limpios):', cleanData);

    try {
        if (id) {
            await update(ref(db, `sesiones/${id}`), cleanData);
            alert('Nota actualizada');
        } else {
            const newRef = push(ref(db, 'sesiones'));
            await set(newRef, cleanData);
            alert('Nota creada');
        }
        cerrarModalNota();
        // ❌ NO recargar automáticamente – usuario debe usar botón "Actualizar"
        console.log('✅ Nota guardada. Usa el botón "Actualizar" para ver los cambios.');
    } catch (error) {
        console.error('Error guardando nota:', error);
        alert('Error al guardar nota: ' + error.message);
    }
};

window.eliminarNota = async function(notaId) {
    if (!confirm('¿Eliminar esta nota permanentemente?')) return;
    try {
        await remove(ref(db, `sesiones/${notaId}`));
        alert('Nota eliminada');
        await cargarNotas(); // Eliminar es seguro, no genera ciclo
    } catch (error) {
        console.error('Error eliminando nota:', error);
        alert('Error al eliminar nota');
    }
};

// Botón de actualización manual
window.recargarNotas = function() {
    cargarNotas().then(() => {
        alert('Notas recargadas correctamente');
    }).catch(e => {
        console.error('Error al recargar notas:', e);
        alert('Error al recargar notas. Revisa la consola.');
    });
};

function cerrarModalNota() {
    document.getElementById('notaModal').style.display = 'none';
}
window.cerrarModalNota = cerrarModalNota;

// ---------------------------------------------------------------------
// 4. Exportar PDF
// ---------------------------------------------------------------------
window.exportarNotasPDF = async function() {
    const startDate = document.getElementById('fechaInicio')?.value;
    const endDate = document.getElementById('fechaFin')?.value;

    let notasFiltradas = [...allNotas];
    if (startDate) notasFiltradas = notasFiltradas.filter(n => n.date >= startDate);
    if (endDate) notasFiltradas = notasFiltradas.filter(n => n.date <= endDate);

    if (notasFiltradas.length === 0) {
        alert('No hay notas en el rango seleccionado.');
        return;
    }

    notasFiltradas.sort((a, b) => new Date(b.date) - new Date(a.date));

    let htmlContent = `
        <html>
        <head><meta charset="UTF-8"><title>Notas de Evolución</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; color: #2c7da0; }
            .nota { border: 1px solid #ccc; margin-bottom: 20px; padding: 15px; border-radius: 8px; page-break-inside: avoid; }
            .header { font-weight: bold; margin-bottom: 10px; }
            .contenido { white-space: pre-line; margin-top: 10px; }
        </style>
        </head>
        <body>
            <h1>Notas de Evolución</h1>
            ${notasFiltradas.map(nota => `
                <div class="nota">
                    <div class="header">${escapeHtml(nota.pacienteNombre)} | ${new Date(nota.date).toLocaleDateString()}</div>
                    <div class="contenido">${escapeHtml(nota.content || '').replace(/\n/g, '<br>')}</div>
                </div>
            `).join('')}
        </body>
        </html>
    `;

    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    document.body.appendChild(element);
    try {
        await html2pdf().from(element).set({ margin: 0.5, filename: 'notas_evolucion.pdf' }).save();
    } catch (error) {
        console.error('Error generando PDF:', error);
        alert('Error al generar PDF');
    }
    document.body.removeChild(element);
};

// ---------------------------------------------------------------------
// 5. Inicialización (carga única)
// ---------------------------------------------------------------------
function initNotas() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            if (window.state?.currentUser) {
                currentRole = window.state.currentUser.role;
                console.log(`✅ Rol asignado: ${currentRole} para usuario ${user.uid}`);
                await cargarPacientesParaNotas();
                await cargarNotas();
            } else {
                const checkState = () => {
                    if (window.state?.currentUser) {
                        currentRole = window.state.currentUser.role;
                        console.log(`✅ Rol asignado (después de espera): ${currentRole} para usuario ${user.uid}`);
                        cargarPacientesParaNotas().then(() => cargarNotas());
                    } else {
                        setTimeout(checkState, 100);
                    }
                };
                checkState();
            }
        } else {
            currentUser = null;
            currentRole = null;
            allNotas = [];
            allPatients = [];
            const container = document.getElementById('notasListado');
            if (container) container.innerHTML = '<div style="text-align:center; padding:40px;">🔒 Inicia sesión para ver notas</div>';
        }
    });
}

window.cargarNotas = cargarNotas;

initNotas();
console.log('✅ notas.js cargado correctamente (versión completa con serialización segura)');