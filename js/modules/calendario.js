// js/modules/calendario.js
import * as state from './state.js';

export function renderCalendar() {
    const container = document.getElementById('calendarContainer');
    if (!container) return;

    // Obtener citas según rol
    let citas = [];
    const user = state.currentUser;
    if (!user) return;

    if (user.role === 'admin') {
        citas = state.appointments;
    } else if (user.role === 'psych') {
        citas = state.appointments.filter(a => a.psychId == user.data.id);
    }

    // Agrupar citas por fecha
    const citasPorFecha = {};
    citas.forEach(cita => {
        if (!cita.date) return;
        if (!citasPorFecha[cita.date]) citasPorFecha[cita.date] = [];
        citasPorFecha[cita.date].push(cita);
    });

    // Obtener el mes actual (puedes añadir controles para cambiar mes)
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = hoy.getMonth();

    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaInicioSemana = primerDia.getDay(); // 0=domingo

    // Construir HTML de la tabla
    let html = `
        <div style="margin-bottom:20px;">
            <h4>${primerDia.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h4>
            <div style="display:flex; justify-content:flex-end;">
                <button class="btn-staff" onclick="window.calendario?.cambiarMes(-1)">◀ Mes anterior</button>
                <button class="btn-staff" onclick="window.calendario?.cambiarMes(1)">Mes siguiente ▶</button>
            </div>
        </div>
        <table class="calendar-table" style="width:100%; border-collapse:collapse;">
            <thead>
                <tr>
                    <th>Dom</th><th>Lun</th><th>Mar</th><th>Mié</th><th>Jue</th><th>Vie</th><th>Sáb</th>
                </tr>
            </thead>
            <tbody>
    `;

    let dia = 1;
    for (let i = 0; i < 6; i++) { // Máximo 6 filas
        if (dia > diasEnMes) break;
        html += '<tr>';
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < diaInicioSemana) {
                html += '<td class="calendar-cell empty"></td>';
            } else if (dia <= diasEnMes) {
                const fechaStr = `${año}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
                const citasDia = citasPorFecha[fechaStr] || [];
                html += `
                    <td class="calendar-cell" style="vertical-align:top; border:1px solid #ddd; padding:8px;">
                        <div style="font-weight:bold;">${dia}</div>
                        <div style="font-size:0.8rem;">
                            ${citasDia.map(c => `
                                <div style="margin:4px 0; background:#e8f4fd; padding:2px 4px; border-radius:4px;">
                                    <strong>${c.time}</strong> - ${c.patient}<br>
                                    <small>${c.psych}</small>
                                </div>
                            `).join('')}
                        </div>
                    </td>
                `;
                dia++;
            } else {
                html += '<td class="calendar-cell empty"></td>';
            }
        }
        html += '</tr>';
    }

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

// Variables para controlar el mes actual (puedes expandir)
let mesActual = new Date().getMonth();
let añoActual = new Date().getFullYear();

window.calendario = {
    cambiarMes: function(delta) {
        const nuevaFecha = new Date(añoActual, mesActual + delta);
        mesActual = nuevaFecha.getMonth();
        añoActual = nuevaFecha.getFullYear();
        renderCalendar();
    }
};