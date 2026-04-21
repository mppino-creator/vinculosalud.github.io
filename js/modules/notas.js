// js/modules/notas.js - VERSIÓN DEFINITIVA (con escucha controlada y sin recursión)
import { db, auth } from '../config/firebase.js';
import { ref, push, set, update, remove, get, onValue, off } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js';
import * as state from './state.js'; // 👈 Importar state correctamente

console.log('📦 Cargando módulo notas.js (versión estable)...');

let currentUser = null;
let currentRole = null;
let allNotas = [];
let allPatients = [];

// Referencias para limpiar listeners
let appointmentsUnsubscribe = null;
let patientsUnsubscribe = null;

// ---------------------------------------------------------------------
// 1. Obtener pacientes (con escucha única + limpieza)
// ---------------------------------------------------------------------
function cargarPacientesParaNotas() {
    return new Promise((resolve) => {
        if (!currentUser) {
            console.warn('⚠️ No hay usuario logueado');
            resolve([]);
            return;
        }

        console.log(`👤 Cargando pacientes para rol: ${currentRole}, UID: ${currentUser.uid}`);

        // Limpiar listeners previos para evitar duplicación
        if (appointmentsUnsubscribe) off(appointmentsUnsubscribe);
        if (patientsUnsubscribe) off(patientsUnsubscribe);

        const appointmentsRef = ref(db, 'appointments');
        appointmentsUnsubscribe = onValue(appointmentsRef, (snapshot) => {
            if (!currentUser) {
                console.warn('⚠️ Usuario ya no está autenticado');
                resolve([]);
                return;
            }

            const citas = snapshot.val() || {};
            let citasDelProfesional = Object.values(citas);
            if (currentRole !== 'admin' && currentUser.uid) {
                citasDelProfesional = citasDelProfesional.filter(cita => cita.psychId === currentUser.uid);
                console.log(`🔍 Citas filtradas (psicólogo): ${citasDelProfesional.length}`);
            } else if (currentRole === 'admin') {
                console.log(`🔍 Citas totales (admin): ${citasDelProfesional.length}`);
            } else {
                allPatients = [];
                actualizarSelects();
                resolve();
                return;
            }

            const patientIds = [...new Set(citasDelProfesional.map(cita => cita.patientId).filter(id => id))];
            if (patientIds.length === 0) {
                allPatients = [];
                actualizarSelects();
                resolve();
                return;
            }

            const patientsRef = ref(db, 'patients');
            patientsUnsubscribe = onValue(patientsRef, (snap) => {
                if (!currentUser) return;
                const allPatientsData = snap.val() || {};
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
                resolve();
            });
        });
    });
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
// 2. Cargar notas (carga única, con limpieza de datos)
// ---------------------------------------------------------------------
async function cargarNotas() {
    if (!currentUser) {
        console.warn('⚠️ No hay usuario, no se cargan notas');
        allNotas = [];
        renderNotasListado();
        return;
    }

    try {
        const sesionesSnap = await get(ref(db, 'sesiones'));
        const data = sesionesSnap.val() || {};

        // Limpiar referencias circulares
        const cleanData = JSON.parse(JSON.stringify(data));

        allNotas = Object.entries(cleanData).map(([id, nota]) => ({
            id: String(id),
            patientId: String(nota.patientId || ''),
            date: String(nota.date || ''),
            content: String(nota.content || ''),
            createdAt: nota.createdAt || Date.now(),
            updatedAt: nota.updatedAt || Date.now(),
            createdBy: String(nota.createdBy || ''),
            professionalId: String(nota.professionalId || ''),
            pacienteNombre: allPatients.find(p => p.id == nota.patientId)?.nombreCompleto || 'Paciente desconocido'
        }));

        if (currentRole === 'psych') {
            allNotas = allNotas.filter(nota => allPatients.some(p => p.id == nota.patientId));
        }
        renderNotasListado();
        console.log(`✅ Notas cargadas: ${allNotas.length} registros`);
    } catch (error) {
        console.error('Error cargando notas:', error);
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
// 3. Funciones del modal
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

    const cleanData = {
        patientId: String(patientId),
        date: String(date),
        content: String(content),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: String(state.currentUser.data.id),
        professionalId: String(state.currentUser.data.id)
    };

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
        await cargarNotas();
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
        await cargarNotas();
    } catch (error) {
        console.error('Error eliminando nota:', error);
        alert('Error al eliminar nota');
    }
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
// 5. Inicialización (con limpieza de listeners al logout)
// ---------------------------------------------------------------------
function initNotas() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            const checkState = setInterval(() => {
                if (window.state?.currentUser) {
                    clearInterval(checkState);
                    currentRole = window.state.currentUser.role;
                    console.log(`✅ Rol asignado: ${currentRole} para usuario ${user.uid}`);
                    cargarPacientesParaNotas().then(() => cargarNotas());
                }
            }, 100);
        } else {
            // Limpiar listeners al cerrar sesión
            if (appointmentsUnsubscribe) off(appointmentsUnsubscribe);
            if (patientsUnsubscribe) off(patientsUnsubscribe);
            appointmentsUnsubscribe = null;
            patientsUnsubscribe = null;
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
console.log('✅ notas.js cargado correctamente (versión con escucha controlada)');