// js/notas.js
import { db, auth } from './firebase.js';
import { ref, onValue, push, set, update, remove, get } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js';

// Variable global para el profesional actual (usuario logueado)
let currentUser = null;
let currentRole = null;
let allNotas = [];      // almacena todas las notas cargadas
let allPatients = [];   // pacientes para el select

// Cargar pacientes según rol
function cargarPacientesParaNotas() {
    return new Promise((resolve, reject) => {
        const patientsRef = ref(db, 'patients');
        onValue(patientsRef, (snapshot) => {
            const data = snapshot.val() || {};
            allPatients = Object.entries(data).map(([id, patient]) => ({
                id,
                ...patient,
                nombreCompleto: patient.name || `${patient.firstName} ${patient.lastName}`,
                rut: patient.rut,
                psychId: patient.psychId
            }));
            // Filtrar según rol
            if (currentRole === 'psych') {
                allPatients = allPatients.filter(p => p.psychId === currentUser.uid);
            }
            // Llenar el select del modal
            const selectPaciente = document.getElementById('notaPacienteId');
            if (selectPaciente) {
                selectPaciente.innerHTML = '<option value="">Seleccionar paciente</option>';
                allPatients.forEach(patient => {
                    const option = document.createElement('option');
                    option.value = patient.id;
                    option.textContent = `${patient.nombreCompleto} (${patient.rut || 'sin RUT'})`;
                    selectPaciente.appendChild(option);
                });
            }
            // Llenar filtro de pacientes en la vista principal
            const filtroPaciente = document.getElementById('filtroNotaPaciente');
            if (filtroPaciente) {
                filtroPaciente.innerHTML = '<option value="">Todos los pacientes</option>';
                allPatients.forEach(patient => {
                    const option = document.createElement('option');
                    option.value = patient.id;
                    option.textContent = patient.nombreCompleto;
                    filtroPaciente.appendChild(option);
                });
            }
            resolve();
        }, { onlyOnce: false });
    });
}

// Cargar notas desde Firebase (nodo 'sesiones')
function cargarNotas() {
    const sesionesRef = ref(db, 'sesiones');
    onValue(sesionesRef, (snapshot) => {
        const data = snapshot.val() || {};
        allNotas = Object.entries(data).map(([id, nota]) => ({
            id,
            ...nota,
            pacienteNombre: allPatients.find(p => p.id === nota.patientId)?.nombreCompleto || 'Paciente desconocido'
        }));

        // Filtrar según rol
        if (currentRole === 'psych') {
            allNotas = allNotas.filter(nota => allPatients.some(p => p.id === nota.patientId && p.psychId === currentUser.uid));
        }

        renderNotasListado();
    });
}

// Renderizar listado de notas con filtros
function renderNotasListado() {
    const container = document.getElementById('notasListado');
    if (!container) return;

    // Obtener filtros
    const pacienteFiltro = document.getElementById('filtroNotaPaciente')?.value;
    const fechaFiltro = document.getElementById('filtroNotaFecha')?.value;
    const busquedaFiltro = document.getElementById('filtroNotaBusqueda')?.value.toLowerCase();

    let notasFiltradas = [...allNotas];
    if (pacienteFiltro) notasFiltradas = notasFiltradas.filter(n => n.patientId === pacienteFiltro);
    if (fechaFiltro) notasFiltradas = notasFiltradas.filter(n => n.date === fechaFiltro);
    if (busquedaFiltro) {
        notasFiltradas = notasFiltradas.filter(n =>
            n.content?.toLowerCase().includes(busquedaFiltro) ||
            n.pacienteNombre?.toLowerCase().includes(busquedaFiltro)
        );
    }

    // Ordenar por fecha descendente
    notasFiltradas.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (notasFiltradas.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">📭 No hay notas que coincidan con los filtros.</div>';
        return;
    }

    container.innerHTML = notasFiltradas.map(nota => `
        <div class="nota-card" style="background: white; border-radius: 16px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border-left: 4px solid var(--primario);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <strong style="font-size: 1.1rem;">${nota.pacienteNombre}</strong>
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
            <div style="margin-top: 12px; white-space: pre-line;">${nota.content?.replace(/\n/g, '<br>') || 'Sin contenido'}</div>
        </div>
    `).join('');
}

// Mostrar modal para nueva nota
window.mostrarModalNuevaNota = function() {
    document.getElementById('notaModalTitulo').innerText = 'Nueva Nota de Evolución';
    document.getElementById('notaId').value = '';
    document.getElementById('notaFecha').value = new Date().toISOString().slice(0,10);
    document.getElementById('notaContenido').value = '';
    // Habilitar select paciente
    document.getElementById('notaPacienteId').disabled = false;
    document.getElementById('notaPacienteId').value = '';
    document.getElementById('notaModal').style.display = 'flex';
};

// Editar nota existente
window.editarNota = async function(notaId) {
    const nota = allNotas.find(n => n.id === notaId);
    if (!nota) return;
    document.getElementById('notaModalTitulo').innerText = 'Editar Nota';
    document.getElementById('notaId').value = notaId;
    document.getElementById('notaPacienteId').value = nota.patientId;
    document.getElementById('notaPacienteId').disabled = true; // No cambiar paciente al editar
    document.getElementById('notaFecha').value = nota.date;
    document.getElementById('notaContenido').value = nota.content;
    document.getElementById('notaModal').style.display = 'flex';
};

// Guardar nota (crear o actualizar)
window.guardarNota = async function() {
    const id = document.getElementById('notaId').value;
    const patientId = document.getElementById('notaPacienteId').value;
    const date = document.getElementById('notaFecha').value;
    const content = document.getElementById('notaContenido').value.trim();

    if (!patientId) {
        alert('Debes seleccionar un paciente');
        return;
    }
    if (!date) {
        alert('Debes seleccionar una fecha');
        return;
    }
    if (!content) {
        alert('El contenido de la nota no puede estar vacío');
        return;
    }

    const notaData = {
        patientId,
        date,
        content,
        createdAt: Date.now(),
        createdBy: currentUser?.uid,
        professionalId: currentUser?.uid
    };

    const sesionesRef = ref(db, 'sesiones');
    try {
        if (id) {
            // Actualizar
            await update(ref(db, `sesiones/${id}`), notaData);
            alert('Nota actualizada');
        } else {
            // Crear nueva
            const newRef = push(sesionesRef);
            await set(newRef, notaData);
            alert('Nota creada');
        }
        cerrarModalNota();
        cargarNotas(); // recargar listado
    } catch (error) {
        console.error('Error guardando nota:', error);
        alert('Error al guardar nota');
    }
};

// Eliminar nota
window.eliminarNota = async function(notaId) {
    if (!confirm('¿Eliminar esta nota permanentemente?')) return;
    try {
        await remove(ref(db, `sesiones/${notaId}`));
        alert('Nota eliminada');
        cargarNotas();
    } catch (error) {
        console.error('Error eliminando nota:', error);
        alert('Error al eliminar nota');
    }
};

function cerrarModalNota() {
    document.getElementById('notaModal').style.display = 'none';
}

// Inicialización: obtener usuario y cargar datos
function initNotas() {
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            // Obtener rol desde state o de una consulta a profesionales
            const userState = window.state?.currentUser;
            currentRole = userState?.role || (userState?.data?.role === 'admin' ? 'admin' : 'psych');
            cargarPacientesParaNotas().then(() => {
                cargarNotas();
            });
        } else {
            // Si no hay usuario, no cargar nada
            currentUser = null;
            currentRole = null;
            document.getElementById('notasListado').innerHTML = '<div style="text-align:center; padding:40px;">🔒 Inicia sesión para ver notas</div>';
        }
    });
}

// Exponer funciones globales
window.cargarNotas = cargarNotas;
window.cerrarModalNota = cerrarModalNota;

// Arrancar
initNotas();