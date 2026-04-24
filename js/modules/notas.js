// js/modules/notas.js - VERSIÓN DEFINITIVA (SIN RECURSIÓN, CON MANEJO SEGURO DE GUARDADO)
import { db, auth } from '../config/firebase.js';
import { ref, push, set, update, remove, get } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js';
import * as state from './state.js';

console.log('📦 Cargando módulo notas.js (versión segura)...');

let currentUser = null;
let currentRole = null;
let allNotas = [];
let allPatients = [];
let datosCargados = false;

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

        console.log(`✅ Pacientes cargados: ${allPatients.length}`);
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
        allNotas = [];
        renderNotasListado();
        return;
    }
    if (datosCargados) return;
    datosCargados = true;

    try {
        const sesionesSnap = await get(ref(db, 'sesiones'));
        const data = sesionesSnap.val() || {};

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

        allNotas = (currentRole === 'psych') 
            ? nuevasNotas.filter(n => allPatients.some(p => p.id == n.patientId)) 
            : nuevasNotas;
        renderNotasListado();
        console.log(`✅ Notas cargadas: ${allNotas.length} registros`);
    } catch (error) {
        console.error('Error cargando notas:', error);
        allNotas = [];
        renderNotasListado();
    } finally {
        datosCargados = false;
    }
}

function renderNotasListado() {
    const container = document.getElementById('notasListado');
    if (!container) return;

    const pacienteFiltro = document.getElementById('filtroNotaPaciente')?.value;
    const fechaFiltro = document.getElementById('filtroNotaFecha')?.value;
    const busqueda = document.getElementById('filtroNotaBusqueda')?.value?.toLowerCase();

    let filtradas = [...allNotas];
    if (pacienteFiltro) filtradas = filtradas.filter(n => n.patientId === pacienteFiltro);
    if (fechaFiltro) filtradas = filtradas.filter(n => n.date === fechaFiltro);
    if (busqueda) {
        filtradas = filtradas.filter(n =>
            n.content?.toLowerCase().includes(busqueda) ||
            n.pacienteNombre?.toLowerCase().includes(busqueda)
        );
    }

    filtradas.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtradas.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">📭 No hay notas que coincidan con los filtros.</div>';
        return;
    }

    container.innerHTML = filtradas.map(nota => `
        <div class="nota-card" style="background: white; border-radius: 16px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border-left: 4px solid var(--primario);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <strong>${escapeHtml(nota.pacienteNombre)}</strong>
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
// 3. Funciones del modal (con guardado extremadamente seguro)
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
    if (!state.currentUser?.data?.id) { alert('No hay usuario logueado'); return; }

    // Construir objeto plano y forzar serialización para eliminar cualquier referencia circular
    const rawData = {
        patientId: String(patientId),
        date: String(date),
        content: String(content),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: String(state.currentUser.data.id),
        professionalId: String(state.currentUser.data.id)
    };

    // Limpieza extrema: serializar y deserializar
    let notaData;
    try {
        notaData = JSON.parse(JSON.stringify(rawData));
    } catch (e) {
        console.error('Error al serializar la nota:', e);
        alert('Error al procesar la nota. Intenta con menos caracteres o sin caracteres especiales.');
        return;
    }

    console.log('📝 Nota a guardar (datos limpios):', notaData);

    try {
        if (id) {
            await update(ref(db, `sesiones/${id}`), notaData);
            alert('Nota actualizada');
        } else {
            const newRef = push(ref(db, 'sesiones'));
            await set(newRef, notaData);
            alert('Nota creada');
        }
        cerrarModalNota();
        
        // Recargar notas después de un pequeño retraso para evitar conflictos
        setTimeout(() => {
            cargarNotas().catch(e => console.error('Error recargando notas:', e));
        }, 300);
    } catch (error) {
        console.error('Error guardando nota:', error);
        alert('Error al guardar nota: ' + (error.message || 'Verifique su conexión'));
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
// 4. Exportar PDF (simplificado)
// ---------------------------------------------------------------------
window.exportarNotasPDF = async function() {
    const startDate = document.getElementById('fechaInicio')?.value;
    const endDate = document.getElementById('fechaFin')?.value;
    let notasFiltradas = [...allNotas];
    if (startDate) notasFiltradas = notasFiltradas.filter(n => n.date >= startDate);
    if (endDate) notasFiltradas = notasFiltradas.filter(n => n.date <= endDate);
    if (!notasFiltradas.length) { alert('No hay notas en el rango seleccionado.'); return; }
    notasFiltradas.sort((a, b) => new Date(b.date) - new Date(a.date));
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Notas de Evolución</title>
        <style>body{font-family:Arial;margin:20px}h1{text-align:center;color:#2c7da0}.nota{border:1px solid #ccc;margin-bottom:20px;padding:15px;border-radius:8px;page-break-inside:avoid}.header{font-weight:bold;margin-bottom:10px}.contenido{white-space:pre-line}</style>
        </head><body><h1>Notas de Evolución</h1>`;
    for (const nota of notasFiltradas) {
        html += `<div class="nota"><div class="header">${escapeHtml(nota.pacienteNombre)} | ${new Date(nota.date).toLocaleDateString()}</div>
                 <div class="contenido">${escapeHtml(nota.content || '').replace(/\n/g, '<br>')}</div></div>`;
    }
    html += '</body></html>';
    const element = document.createElement('div');
    element.innerHTML = html;
    document.body.appendChild(element);
    try {
        await html2pdf().from(element).set({ margin: 0.5, filename: 'notas_evolucion.pdf' }).save();
    } catch(e) { console.error(e); alert('Error al generar PDF'); }
    document.body.removeChild(element);
};

// ---------------------------------------------------------------------
// 5. Inicialización (carga única)
// ---------------------------------------------------------------------
let inicializado = false;
function initNotas() {
    if (inicializado) return;
    inicializado = true;
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            const esperarState = () => {
                if (window.state?.currentUser) {
                    currentRole = window.state.currentUser.role;
                    console.log(`✅ Rol asignado: ${currentRole} para usuario ${user.uid}`);
                    cargarPacientesParaNotas().then(() => cargarNotas());
                } else {
                    setTimeout(esperarState, 200);
                }
            };
            esperarState();
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
console.log('✅ notas.js cargado (versión ultra segura, sin recursión)');