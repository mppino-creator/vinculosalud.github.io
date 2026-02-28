// js/modules/pacientes.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast, validarRut, formatRut } from './utils.js';

// ============================================
// FUNCIONES DE PACIENTES
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
        
        return `
            <div class="patient-card" onclick="viewPatientDetails(${p.id})">
                <div class="patient-header">
                    <span class="patient-name">${p.name}</span>
                    <span class="badge" style="background:var(--azul-medico); color:white;">${totalSessions} sesiones</span>
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
            </div>
        `;
    }).join('');
}

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
                id: String(Date.now()),
                rut: rut,
                name: name,
                email: email,
                phone: phone,
                birthdate: birthdate,
                notes: notes,
                psychId: state.currentUser?.role === 'psych' ? state.currentUser.data.id : null,
                createdAt: new Date().toISOString(),
                appointments: []
            });
        }
    }

    import('./main.js').then(main => main.save());
    closePatientModal();
    
    if (document.getElementById('tabAgendar')?.classList.contains('active')) {
        document.getElementById('therapistRut').value = rut;
        // Llamar a función de búsqueda en el módulo de citas (se manejará en citas.js)
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