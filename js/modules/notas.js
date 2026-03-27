// js/modules/notas.js
import { db, auth } from '../config/firebase.js';
import { ref, onValue, push, set, update, remove, get } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js';

console.log('📦 Cargando módulo notas.js...');

let currentUser = null;
let currentRole = null;
let allNotas = [];
let allPatients = [];

let notasListenerActive = false;

// ---------------------------------------------------------------------
// 1. Obtener pacientes a partir de las citas del profesional
// ---------------------------------------------------------------------
function cargarPacientesParaNotas() {
    return new Promise((resolve) => {
        if (!currentUser) {
            console.warn('⚠️ No hay usuario logueado');
            resolve([]);
            return;
        }

        console.log(`👤 Cargando pacientes para rol: ${currentRole}, UID: ${currentUser.uid}`);

        const appointmentsRef = ref(db, 'appointments');
        onValue(appointmentsRef, (snapshot) => {
            const citas = snapshot.val() || {};

            let citasDelProfesional = Object.values(citas);
            if (currentRole !== 'admin') {
                citasDelProfesional = citasDelProfesional.filter(cita => cita.psychId === currentUser.uid);
                console.log(`🔍 Citas filtradas (psicólogo): ${citasDelProfesional.length}`);
            } else {
                console.log(`🔍 Citas totales (admin): ${citasDelProfesional.length}`);
            }

            const patientIds = [...new Set(citasDelProfesional.map(cita => cita.patientId).filter(id => id))];
            console.log(`📋 IDs de pacientes únicos:`, patientIds);

            if (patientIds.length === 0) {
                allPatients = [];
                actualizarSelects();
                resolve();
                return;
            }

            const patientsRef = ref(db, 'patients');
            onValue(patientsRef, (snapshot) => {
                const allPatientsData = snapshot.val() || {};
                allPatients = patientIds.map(id => ({
                    id,
                    ...allPatientsData[id],
                    nombreCompleto: allPatientsData[id]?.name ||
                                    `${allPatientsData[id]?.firstName} ${allPatientsData[id]?.lastName}` ||
                                    'Paciente sin nombre',
                    rut: allPatientsData[id]?.rut || ''
                })).filter(p => p.id);

                console.log(`✅ Pacientes cargados:`, allPatients.map(p => p.nombreCompleto));
                actualizarSelects();
                resolve();
            }, { onlyOnce: false });
        }, { onlyOnce: false });
    });
}

function actualizarSelects() {
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
}

// ---------------------------------------------------------------------
// 2. Cargar y renderizar notas (usando un único listener en tiempo real)
// ---------------------------------------------------------------------
function cargarNotas() {
    if (notasListenerActive) {
        console.log('⚠️ Listener de notas ya activo, no se añade otro');
        return;
    }
    notasListenerActive = true;

    const sesionesRef = ref(db, 'sesiones');
    onValue(sesionesRef, (snapshot) => {
        const data = snapshot.val() || {};
        allNotas = Object.entries(data).map(([id, nota]) => ({
            id,
            ...nota,
            pacienteNombre: allPatients.find(p => p.id === nota.patientId)?.nombreCompleto || 'Paciente desconocido'
        }));

        if (currentRole === 'psych') {
            allNotas = allNotas.filter(nota => allPatients.some(p => p.id === nota.patientId));
        }
        renderNotasListado();
    });
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
            <div style="margin-top: 12px; white-space: pre-line;">${(nota.content || '').replace(/\n/g, '<br>')}</div>
        </div>
    `).join('');
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

    const notaData = {
        patientId,
        date,
        content,
        updatedAt: Date.now(),
        createdBy: currentUser?.uid,
        professionalId: currentUser?.uid
    };

    const sesionesRef = ref(db, 'sesiones');
    try {
        if (id) {
            await update(ref(db, `sesiones/${id}`), notaData);
            alert('Nota actualizada');
        } else {
            const newRef = push(sesionesRef);
            await set(newRef, { ...notaData, createdAt: Date.now() });
            alert('Nota creada');
        }
        cerrarModalNota();
        // ✅ NO llamamos a cargarNotas() manualmente; el listener actualizará.
    } catch (error) {
        console.error('Error guardando nota:', error);
        alert('Error al guardar nota');
    }
};

window.eliminarNota = async function(notaId) {
    if (!confirm('¿Eliminar esta nota permanentemente?')) return;
    try {
        await remove(ref(db, `sesiones/${notaId}`));
        alert('Nota eliminada');
        // ✅ El listener actualizará.
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
// 4. Exportar notas a PDF (con rango de fechas)
// ---------------------------------------------------------------------
window.exportarNotasPDF = async function() {
    const startDate = document.getElementById('fechaInicio')?.value;
    const endDate = document.getElementById('fechaFin')?.value;

    let notasFiltradas = [...allNotas];
    if (startDate) {
        notasFiltradas = notasFiltradas.filter(n => n.date >= startDate);
    }
    if (endDate) {
        notasFiltradas = notasFiltradas.filter(n => n.date <= endDate);
    }

    if (notasFiltradas.length === 0) {
        alert('No hay notas en el rango seleccionado.');
        return;
    }

    // Ordenar por fecha descendente
    notasFiltradas.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Crear contenido HTML para el PDF
    let htmlContent = `
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Notas de Evolución</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { text-align: center; color: #2c7da0; }
                .nota { border: 1px solid #ccc; margin-bottom: 20px; padding: 15px; border-radius: 8px; page-break-inside: avoid; }
                .header { font-weight: bold; margin-bottom: 10px; }
                .fecha { color: #666; }
                .contenido { white-space: pre-line; margin-top: 10px; }
            </style>
        </head>
        <body>
            <h1>Notas de Evolución</h1>
            ${notasFiltradas.map(nota => `
                <div class="nota">
                    <div class="header">${nota.pacienteNombre} | ${new Date(nota.date).toLocaleDateString()}</div>
                    <div class="contenido">${nota.content.replace(/\n/g, '<br>')}</div>
                </div>
            `).join('')}
        </body>
        </html>
    `;

    // Usar html2pdf para generar PDF
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
// 5. Inicialización
// ---------------------------------------------------------------------
async function initNotas() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            try {
                const staffRef = ref(db, `staff/${user.uid}`);
                const snapshot = await get(staffRef);
                const staffData = snapshot.val();
                if (staffData && staffData.isAdmin) {
                    currentRole = 'admin';
                } else {
                    currentRole = 'psych';
                }
                console.log(`✅ Rol asignado: ${currentRole} para usuario ${user.uid}`);
            } catch (error) {
                console.error('❌ Error al obtener rol desde staff:', error);
                currentRole = 'psych';
            }

            await cargarPacientesParaNotas();
            cargarNotas(); // inicia el listener (solo si no está activo)
        } else {
            currentUser = null;
            currentRole = null;
            notasListenerActive = false;
            const container = document.getElementById('notasListado');
            if (container) container.innerHTML = '<div style="text-align:center; padding:40px;">🔒 Inicia sesión para ver notas</div>';
        }
    });
}

// Exponer funciones globales
window.cargarNotas = cargarNotas;

initNotas();
console.log('✅ notas.js cargado correctamente');