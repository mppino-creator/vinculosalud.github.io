// Función para cargar y mostrar la analítica
export async function cargarAnaliticaProfesionales() {
    const tbody = document.getElementById('analiticaTableBody');
    if (!tbody) return;
    
    const profesionales = state.staff.filter(s => !s.isAdmin);
    const analyticsData = {};
    
    // Obtener datos de Firebase
    const snapshot = await firebase.database().ref('analytics/profesionales').once('value');
    const analytics = snapshot.val() || {};
    
    let totalVisitas = 0;
    let totalConversiones = 0;
    
    // Preparar datos para la tabla
    const profesionalesData = profesionales.map(prof => {
        const visitas = analytics[prof.id]?.visitas || 0;
        const conversiones = analytics[prof.id]?.conversiones || 0;
        const tasa = visitas > 0 ? ((conversiones / visitas) * 100).toFixed(1) : 0;
        
        totalVisitas += visitas;
        totalConversiones += conversiones;
        
        // Determinar nivel de efectividad
        let efectividad = '';
        let efectividadColor = '';
        if (tasa >= 20) {
            efectividad = '🔥 Muy Alta';
            efectividadColor = '#28a745';
        } else if (tasa >= 10) {
            efectividad = '👍 Alta';
            efectividadColor = '#17a2b8';
        } else if (tasa >= 5) {
            efectividad = '📈 Media';
            efectividadColor = '#ffc107';
        } else {
            efectividad = '⚠️ Baja';
            efectividadColor = '#dc3545';
        }
        
        return {
            id: prof.id,
            nombre: prof.name,
            visitas,
            conversiones,
            tasa,
            efectividad,
            efectividadColor
        };
    });
    
    // Ordenar por visitas (los más vistos primero)
    profesionalesData.sort((a, b) => b.visitas - a.visitas);
    
    // Renderizar tabla
    tbody.innerHTML = profesionalesData.map(p => `
        <tr>
            <td><strong>${p.nombre}</strong></td>
            <td style="text-align:center; font-size:1.2rem;">${p.visitas.toLocaleString()}</td>
            <td style="text-align:center; font-size:1.2rem;">${p.conversiones.toLocaleString()}</td>
            <td style="text-align:center; font-weight:600; color:${p.tasa >= 10 ? '#28a745' : '#dc3545'};">${p.tasa}%</td>
            <td style="text-align:center;">
                <span style="background:${p.efectividadColor}; color:white; padding:4px 12px; border-radius:20px; font-size:0.8rem;">
                    ${p.efectividad}
                </span>
            </td>
        </tr>
    `).join('');
    
    // Actualizar resumen general
    const resumenDiv = document.getElementById('analiticaResumenGeneral');
    if (resumenDiv) {
        const promedioTasa = totalVisitas > 0 ? ((totalConversiones / totalVisitas) * 100).toFixed(1) : 0;
        resumenDiv.innerHTML = `
            <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <div class="stat-number">${totalVisitas.toLocaleString()}</div>
                <div class="stat-label">Total Visitas a Perfiles</div>
            </div>
            <div class="stat-card" style="background: linear-gradient(135deg, #34c759 0%, #30b0c0 100%);">
                <div class="stat-number">${totalConversiones.toLocaleString()}</div>
                <div class="stat-label">Total Citas Agendadas</div>
            </div>
            <div class="stat-card" style="background: linear-gradient(135deg, #f6b023 0%, #f98d39 100%);">
                <div class="stat-number">${promedioTasa}%</div>
                <div class="stat-label">Tasa de Conversión General</div>
            </div>
            <div class="stat-card" style="background: linear-gradient(135deg, #ff3b30 0%, #ff6b6b 100%);">
                <div class="stat-number">${profesionalesData.filter(p => p.tasa >= 10).length}</div>
                <div class="stat-label">Profesionales con Alta Efectividad</div>
            </div>
        `;
    }
}