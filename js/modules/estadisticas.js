// js/modules/estadisticas.js
import * as state from './state.js';
import { showToast } from './utils.js';

// ============================================
// MÓDULO DE ESTADÍSTICAS GLOBALES - SOLO ADMIN
// ============================================

/**
 * Verifica si el usuario actual es administrador
 * @returns {boolean} true si es admin
 */
function isAdmin() {
    return state.currentUser?.data?.isAdmin === true || state.currentUser?.role === 'admin';
}

/**
 * Calcula la edad a partir de fecha de nacimiento
 * @param {string} birthdate - Fecha de nacimiento
 * @returns {number} Edad calculada
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

/**
 * Obtiene el método de pago más utilizado
 * @returns {string} Método de pago más usado
 */
function obtenerMetodoPagoMasUsado() {
    const metodos = {};
    state.appointments.forEach(a => {
        if (a.paymentMethod) {
            metodos[a.paymentMethod] = (metodos[a.paymentMethod] || 0) + 1;
        }
    });
    
    let maxMetodo = 'No disponible';
    let maxCount = 0;
    
    Object.entries(metodos).forEach(([metodo, count]) => {
        if (count > maxCount) {
            maxCount = count;
            maxMetodo = metodo;
        }
    });
    
    // Traducir métodos de pago
    const traducciones = {
        'transfer': 'Transferencia',
        'card-presencial': 'Tarjeta Presencial',
        'card-online': 'Tarjeta Online',
        'cash': 'Efectivo',
        'mercadopago': 'Mercado Pago',
        'webpay': 'Webpay'
    };
    
    return traducciones[maxMetodo] || maxMetodo;
}

/**
 * Calcula el crecimiento mensual de una métrica
 * @param {string} tipo - Tipo de métrica ('patients'|'appointments'|'ingresos')
 * @returns {Object} Crecimiento mensual
 */
function calcularCrecimientoMensual(tipo) {
    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const añoActual = ahora.getFullYear();
    
    let valorEsteMes = 0;
    let valorMesAnterior = 0;
    
    switch(tipo) {
        case 'patients':
            valorEsteMes = state.patients.filter(p => {
                if (!p.createdAt) return false;
                const fecha = new Date(p.createdAt);
                return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
            }).length;
            
            valorMesAnterior = state.patients.filter(p => {
                if (!p.createdAt) return false;
                const fecha = new Date(p.createdAt);
                return fecha.getMonth() === mesActual - 1 && fecha.getFullYear() === añoActual;
            }).length;
            break;
            
        case 'appointments':
            valorEsteMes = state.appointments.filter(a => {
                if (!a.date) return false;
                const [year, month] = a.date.split('-');
                return parseInt(year) === añoActual && parseInt(month) === mesActual + 1;
            }).length;
            
            valorMesAnterior = state.appointments.filter(a => {
                if (!a.date) return false;
                const [year, month] = a.date.split('-');
                return parseInt(year) === añoActual && parseInt(month) === mesActual;
            }).length;
            break;
            
        case 'ingresos':
            valorEsteMes = state.appointments
                .filter(a => {
                    if (!a.date || a.paymentStatus !== 'pagado') return false;
                    const [year, month] = a.date.split('-');
                    return parseInt(year) === añoActual && parseInt(month) === mesActual + 1;
                })
                .reduce((sum, a) => sum + (a.price || 0), 0);
                
            valorMesAnterior = state.appointments
                .filter(a => {
                    if (!a.date || a.paymentStatus !== 'pagado') return false;
                    const [year, month] = a.date.split('-');
                    return parseInt(year) === añoActual && parseInt(month) === mesActual;
                })
                .reduce((sum, a) => sum + (a.price || 0), 0);
            break;
    }
    
    const variacion = valorMesAnterior > 0 
        ? ((valorEsteMes - valorMesAnterior) / valorMesAnterior * 100).toFixed(1)
        : valorEsteMes > 0 ? 100 : 0;
    
    return {
        esteMes: valorEsteMes,
        mesAnterior: valorMesAnterior,
        variacion: parseFloat(variacion),
        tendencia: variacion > 0 ? '📈' : variacion < 0 ? '📉' : '➡️'
    };
}

// ============================================
// FUNCIÓN PRINCIPAL DE ESTADÍSTICAS
// ============================================

/**
 * Obtiene todas las estadísticas globales del sistema
 * @returns {Object} Estadísticas completas
 */
export function getEstadisticasCompletas() {
    if (!isAdmin()) {
        console.warn('⚠️ Intento de acceso a estadísticas por usuario no autorizado');
        return null;
    }

    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const añoActual = ahora.getFullYear();

    // ============================================
    // 1. ESTADÍSTICAS DE PACIENTES
    // ============================================
    const pacientes = state.patients.filter(p => !p.isHiddenAdmin);
    
    // Rangos de edad
    const rangosEdad = {
        '0-18': 0,
        '19-30': 0,
        '31-45': 0,
        '46-60': 0,
        '61+': 0,
        'sin especificar': 0
    };

    pacientes.forEach(p => {
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

    // Género (aproximado por nombre - simplificado)
    const genero = {
        femenino: pacientes.filter(p => p.name?.toLowerCase().match(/(a$|ia$|ina$)/)).length,
        masculino: pacientes.filter(p => p.name?.toLowerCase().match(/(o$|io$|ino$)/)).length,
        otro: 0
    };
    genero.otro = pacientes.length - genero.femenino - genero.masculino;

    // ============================================
    // 2. ESTADÍSTICAS DE ATENCIONES
    // ============================================
    const atenciones = {
        citas: state.appointments,
        sesiones: state.sesiones
    };

    // Atenciones por mes (últimos 12 meses)
    const atencionesPorMes = {};
    const ingresosPorMes = {};
    
    for (let i = 0; i < 12; i++) {
        const fecha = new Date(añoActual, mesActual - i, 1);
        const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        atencionesPorMes[key] = { citas: 0, sesiones: 0, ingresos: 0 };
    }

    // Procesar citas
    state.appointments.forEach(cita => {
        if (cita.date) {
            const [year, month] = cita.date.split('-');
            const key = `${year}-${month}`;
            if (atencionesPorMes[key]) {
                atencionesPorMes[key].citas++;
                if (cita.paymentStatus === 'pagado') {
                    atencionesPorMes[key].ingresos += cita.price || 0;
                }
            }
        }
    });

    // Procesar sesiones
    state.sesiones.forEach(sesion => {
        if (sesion.fechaAtencion) {
            // Formato esperado: DD-MM-YYYY
            const partes = sesion.fechaAtencion.split('-');
            if (partes.length === 3) {
                const [dia, mes, año] = partes;
                if (año && mes) {
                    const key = `${año}-${mes}`;
                    if (atencionesPorMes[key]) {
                        atencionesPorMes[key].sesiones++;
                    }
                }
            }
        }
    });

    // ============================================
    // 3. ESTADÍSTICAS POR PROFESIONAL
    // ============================================
    const statsPorProfesional = {};
    
    state.staff.filter(p => !p.isHiddenAdmin).forEach(prof => {
        const pacientesProf = state.patients.filter(p => p.psychId == prof.id);
        const citasProf = state.appointments.filter(a => a.psychId == prof.id);
        const sesionesProf = state.sesiones.filter(s => {
            const patient = state.patients.find(p => p.id == s.patientId);
            return patient && patient.psychId == prof.id;
        });
        const informesProf = state.informes.filter(i => i.patientId && 
            state.patients.find(p => p.id == i.patientId)?.psychId == prof.id);

        statsPorProfesional[prof.id] = {
            nombre: prof.name,
            pacientes: pacientesProf.length,
            citas: citasProf.length,
            sesiones: sesionesProf.length,
            informes: informesProf.length,
            ingresos: citasProf
                .filter(a => a.paymentStatus === 'pagado')
                .reduce((sum, a) => sum + (a.price || 0), 0),
            promedioSesionesPorPaciente: pacientesProf.length > 0 
                ? (sesionesProf.length / pacientesProf.length).toFixed(1) 
                : 0
        };
    });

    // ============================================
    // 4. ESTADÍSTICAS DE CORREOS
    // ============================================
    const correos = {
        pacientesConEmail: pacientes.filter(p => p.email).length,
        pacientesSinEmail: pacientes.filter(p => !p.email).length,
        profesionalesConEmail: state.staff.filter(p => p.email).length,
        emailsEnviados: state.appointments.filter(a => a.emailEnviado).length || 0
    };

    // ============================================
    // 5. ESTADÍSTICAS DE FICHAS CLÍNICAS
    // ============================================
    const fichas = {
        totalFichasIngreso: state.fichasIngreso.length,
        totalSesiones: state.sesiones.length,
        totalInformes: state.informes.length,
        promedioSesionesPorPaciente: pacientes.length > 0 
            ? (state.sesiones.length / pacientes.length).toFixed(1) 
            : 0,
        fichasPorCompletar: pacientes.length - state.fichasIngreso.length
    };

    // ============================================
    // 6. ESTADÍSTICAS DE PAGOS
    // ============================================
    const pagos = {
        totalIngresos: state.appointments
            .filter(a => a.paymentStatus === 'pagado')
            .reduce((sum, a) => sum + (a.price || 0), 0),
        ingresosEsteMes: state.appointments
            .filter(a => {
                if (!a.date || a.paymentStatus !== 'pagado') return false;
                const [year, month] = a.date.split('-');
                return parseInt(year) === añoActual && parseInt(month) === mesActual + 1;
            })
            .reduce((sum, a) => sum + (a.price || 0), 0),
        promedioPorCita: state.appointments.filter(a => a.paymentStatus === 'pagado').length > 0
            ? (state.appointments.filter(a => a.paymentStatus === 'pagado')
                .reduce((sum, a) => sum + (a.price || 0), 0) / 
               state.appointments.filter(a => a.paymentStatus === 'pagado').length).toFixed(0)
            : 0,
        metodoPagoMasUsado: obtenerMetodoPagoMasUsado(),
        deudaTotal: state.appointments
            .filter(a => a.paymentStatus === 'pendiente')
            .reduce((sum, a) => sum + (a.price || 0), 0)
    };

    // ============================================
    // 7. ESTADÍSTICAS DE CRECIMIENTO
    // ============================================
    const crecimiento = {
        pacientes: calcularCrecimientoMensual('patients'),
        citas: calcularCrecimientoMensual('appointments'),
        ingresos: calcularCrecimientoMensual('ingresos')
    };

    return {
        pacientes: {
            total: pacientes.length,
            rangosEdad,
            genero,
            correos,
            nuevosEsteMes: pacientes.filter(p => {
                if (!p.createdAt) return false;
                const fecha = new Date(p.createdAt);
                return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
            }).length
        },
        atenciones: {
            totalCitas: state.appointments.length,
            totalSesiones: state.sesiones.length,
            citasPendientes: state.appointments.filter(a => a.paymentStatus === 'pendiente').length,
            citasPagadas: state.appointments.filter(a => a.paymentStatus === 'pagado').length,
            citasRechazadas: state.appointments.filter(a => a.paymentStatus === 'rechazado').length,
            porMes: atencionesPorMes
        },
        profesionales: {
            total: state.staff.filter(p => !p.isHiddenAdmin).length,
            activos: Object.keys(statsPorProfesional).length,
            detalle: statsPorProfesional
        },
        fichasClinicas: fichas,
        pagos: pagos,
        crecimiento: crecimiento,
        timestamp: new Date().toISOString()
    };
}

// ============================================
// FUNCIONES DE RENDERIZADO
// ============================================

/**
 * Renderiza un gráfico de barras simple
 * @param {Object} datos - Datos para el gráfico
 * @returns {string} HTML del gráfico
 */
function renderGraficoBarras(datos) {
    const max = Math.max(...Object.values(datos));
    if (max === 0) return '<p style="text-align:center; color:#999;">Sin datos</p>';
    
    return Object.entries(datos).map(([label, valor]) => `
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
            <div style="width:80px; font-size:12px;">${label}</div>
            <div style="flex:1; height:25px; background:#f0f0f0; border-radius:12px; overflow:hidden;">
                <div style="height:100%; width:${(valor / max) * 100}%; background:#0071e3; display:flex; align-items:center; justify-content:flex-end; padding-right:10px; color:white; font-size:11px; font-weight:bold;">
                    ${valor}
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Renderiza un gráfico de torta simple
 * @param {Object} datos - Datos para el gráfico
 * @returns {string} HTML del gráfico
 */
function renderGraficoTorta(datos) {
    const total = Object.values(datos).reduce((a, b) => a + b, 0);
    if (total === 0) return '<p style="text-align:center; color:#999;">Sin datos</p>';
    
    const colores = ['#ff3b30', '#0071e3', '#34c759', '#ff9500', '#5856d6', '#af52de'];
    let acumulado = 0;
    
    const segmentos = Object.entries(datos).map(([label, valor], i) => {
        const porcentaje = total > 0 ? (valor / total * 100).toFixed(1) : 0;
        if (valor === 0) return '';
        
        const rotacion = (acumulado / total * 360);
        acumulado += valor;
        
        return `
            <div style="position:absolute; width:100%; height:100%; transform:rotate(${rotacion}deg); overflow:hidden; border-radius:50%;">
                <div style="position:absolute; width:50%; height:100%; left:50%; background:${colores[i % colores.length]}; transform-origin:0 50%; transform:rotate(${porcentaje * 3.6}deg);"></div>
            </div>
        `;
    }).join('');
    
    return `
        <div style="display:flex; align-items:center; gap:20px;">
            <div style="position:relative; width:120px; height:120px; border-radius:50%; background:#f0f0f0; overflow:hidden;">
                ${segmentos}
            </div>
            <div style="flex:1;">
                ${Object.entries(datos).map(([label, valor], i) => {
                    if (valor === 0) return '';
                    const porcentaje = (valor / total * 100).toFixed(1);
                    return `
                        <div style="display:flex; align-items:center; gap:5px; margin-bottom:5px;">
                            <div style="width:12px; height:12px; background:${colores[i % colores.length]}; border-radius:3px;"></div>
                            <span style="font-size:11px;">${label}: ${valor} (${porcentaje}%)</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

/**
 * Renderiza el panel completo de estadísticas
 */
export function renderPanelEstadisticas() {
    if (!isAdmin()) {
        showToast('Solo administradores pueden ver estadísticas', 'error');
        return;
    }
    
    let container = document.getElementById('estadisticasContainer');
    
    // Si el container no existe, crearlo
    if (!container) {
        console.warn('Container de estadísticas no encontrado, creándolo...');
        const tabContent = document.getElementById('tabEstadisticas');
        if (tabContent) {
            container = document.createElement('div');
            container.id = 'estadisticasContainer';
            tabContent.appendChild(container);
        } else {
            console.error('No se encontró tabEstadisticas');
            showToast('Error: No se encontró la pestaña de estadísticas', 'error');
            return;
        }
    }
    
    // Mostrar loader
    container.innerHTML = `
        <div style="text-align:center; padding:60px;">
            <div class="loader-spinner" style="margin:0 auto 20px;"></div>
            <p style="color:#666;">Cargando estadísticas...</p>
        </div>
    `;
    
    // Obtener datos (con timeout para no bloquear)
    setTimeout(() => {
        try {
            const stats = getEstadisticasCompletas();
            if (!stats) {
                container.innerHTML = `
                    <div style="text-align:center; padding:60px; background:white; border-radius:12px;">
                        <i class="fa fa-exclamation-triangle" style="font-size:48px; color:#ff3b30;"></i>
                        <p style="margin:20px 0; color:#666;">Error al cargar estadísticas</p>
                        <button class="btn-staff" onclick="window.estadisticas?.renderPanelEstadisticas()" 
                                style="background:var(--azul-apple);">
                            <i class="fa fa-refresh"></i> Reintentar
                        </button>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = `
                <div style="padding:20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h2 style="margin:0;">📊 Estadísticas Globales</h2>
                        <span style="color:#666; font-size:12px;">Actualizado: ${new Date().toLocaleTimeString()}</span>
                    </div>
                    
                    <!-- Tarjetas resumen -->
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin-bottom:30px;">
                        <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <div style="font-size:32px; font-weight:bold; color:white;">${stats.pacientes.total}</div>
                            <div style="color:rgba(255,255,255,0.9);">Pacientes</div>
                            <div style="font-size:12px; color:rgba(255,255,255,0.7);">+${stats.pacientes.nuevosEsteMes} este mes</div>
                        </div>
                        
                        <div class="stat-card" style="background: linear-gradient(135deg, #34c759 0%, #30b0c0 100%);">
                            <div style="font-size:32px; font-weight:bold; color:white;">${stats.atenciones.totalCitas}</div>
                            <div style="color:rgba(255,255,255,0.9);">Citas</div>
                            <div style="font-size:12px; color:rgba(255,255,255,0.7);">${stats.atenciones.citasPagadas} pagadas</div>
                        </div>
                        
                        <div class="stat-card" style="background: linear-gradient(135deg, #ff9500 0%, #ff6b6b 100%);">
                            <div style="font-size:32px; font-weight:bold; color:white;">${stats.fichasClinicas.totalSesiones}</div>
                            <div style="color:rgba(255,255,255,0.9);">sesiones</div>
                            <div style="font-size:12px; color:rgba(255,255,255,0.7);">${stats.fichasClinicas.totalFichasIngreso} fichas</div>
                        </div>
                        
                        <div class="stat-card" style="background: linear-gradient(135deg, #5856d6 0%, #af52de 100%);">
                            <div style="font-size:32px; font-weight:bold; color:white;">$${(stats.pagos.totalIngresos / 1000000).toFixed(1)}M</div>
                            <div style="color:rgba(255,255,255,0.9);">Ingresos totales</div>
                            <div style="font-size:12px; color:rgba(255,255,255,0.7);">$${(stats.pagos.ingresosEsteMes / 1000).toFixed(0)}k este mes</div>
                        </div>
                    </div>
                    
                    <!-- Crecimiento -->
                    <div style="background:white; border-radius:12px; padding:20px; margin-bottom:20px;">
                        <h3 style="margin:0 0 15px 0;">📈 Crecimiento vs Mes Anterior</h3>
                        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:15px;">
                            <div style="text-align:center; padding:15px; background:#f8fafc; border-radius:10px;">
                                <div style="font-size:24px; font-weight:bold;">${stats.crecimiento.pacientes.esteMes}</div>
                                <div style="font-size:14px; color:#666;">Pacientes nuevos</div>
                                <div style="font-size:12px; color:${stats.crecimiento.pacientes.variacion >= 0 ? '#34c759' : '#ff3b30'};">
                                    ${stats.crecimiento.pacientes.tendencia} ${stats.crecimiento.pacientes.variacion > 0 ? '+' : ''}${stats.crecimiento.pacientes.variacion}%
                                </div>
                            </div>
                            
                            <div style="text-align:center; padding:15px; background:#f8fafc; border-radius:10px;">
                                <div style="font-size:24px; font-weight:bold;">${stats.crecimiento.citas.esteMes}</div>
                                <div style="font-size:14px; color:#666;">Citas este mes</div>
                                <div style="font-size:12px; color:${stats.crecimiento.citas.variacion >= 0 ? '#34c759' : '#ff3b30'};">
                                    ${stats.crecimiento.citas.tendencia} ${stats.crecimiento.citas.variacion > 0 ? '+' : ''}${stats.crecimiento.citas.variacion}%
                                </div>
                            </div>
                            
                            <div style="text-align:center; padding:15px; background:#f8fafc; border-radius:10px;">
                                <div style="font-size:24px; font-weight:bold;">$${(stats.crecimiento.ingresos.esteMes / 1000).toFixed(0)}k</div>
                                <div style="font-size:14px; color:#666;">Ingresos este mes</div>
                                <div style="font-size:12px; color:${stats.crecimiento.ingresos.variacion >= 0 ? '#34c759' : '#ff3b30'};">
                                    ${stats.crecimiento.ingresos.tendencia} ${stats.crecimiento.ingresos.variacion > 0 ? '+' : ''}${stats.crecimiento.ingresos.variacion}%
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Gráficos en grid -->
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
                        <!-- Rangos de Edad -->
                        <div style="background:white; border-radius:12px; padding:20px;">
                            <h3 style="margin:0 0 15px 0;">📊 Rangos de Edad</h3>
                            ${renderGraficoBarras(stats.pacientes.rangosEdad)}
                        </div>
                        
                        <!-- Género -->
                        <div style="background:white; border-radius:12px; padding:20px;">
                            <h3 style="margin:0 0 15px 0;">🚻 Distribución por Género</h3>
                            ${renderGraficoTorta(stats.pacientes.genero)}
                        </div>
                    </div>
                    
                    <!-- Atenciones por Mes -->
                    <div style="background:white; border-radius:12px; padding:20px; margin-bottom:20px;">
                        <h3 style="margin:0 0 15px 0;">📅 Atenciones por Mes (últimos 12 meses)</h3>
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            ${Object.entries(stats.atenciones.porMes).sort().reverse().map(([mes, datos]) => {
                                const maxCitas = Math.max(...Object.values(stats.atenciones.porMes).map(d => d.citas), 1);
                                const maxSesiones = Math.max(...Object.values(stats.atenciones.porMes).map(d => d.sesiones), 1);
                                return `
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <div style="width:80px; font-size:12px;">${mes}</div>
                                    <div style="flex:1; height:30px; background:#f0f0f0; border-radius:15px; overflow:hidden; display:flex;">
                                        <div style="height:100%; width:${(datos.citas / maxCitas) * 100}%; background:#0071e3; display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:bold;">
                                            ${datos.citas > 0 ? datos.citas : ''}
                                        </div>
                                        <div style="height:100%; width:${(datos.sesiones / maxSesiones) * 100}%; background:#34c759; display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:bold;">
                                            ${datos.sesiones > 0 ? datos.sesiones : ''}
                                        </div>
                                    </div>
                                    <div style="width:100px; font-size:12px; text-align:right;">
                                        $${(datos.ingresos / 1000).toFixed(0)}k
                                    </div>
                                </div>
                            `}).join('')}
                        </div>
                        <div style="display:flex; gap:20px; margin-top:15px; font-size:12px; color:#666;">
                            <span><span style="display:inline-block; width:12px; height:12px; background:#0071e3; border-radius:3px;"></span> Citas</span>
                            <span><span style="display:inline-block; width:12px; height:12px; background:#34c759; border-radius:3px;"></span> sesiones</span>
                        </div>
                    </div>
                    
                    <!-- Top Profesionales -->
                    <div style="background:white; border-radius:12px; padding:20px; margin-bottom:20px;">
                        <h3 style="margin:0 0 15px 0;">👥 Rendimiento por Profesional</h3>
                        <div style="overflow-x:auto;">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead>
                                    <tr style="background:#f8fafc;">
                                        <th style="padding:10px; text-align:left;">Profesional</th>
                                        <th style="padding:10px; text-align:center;">Pacientes</th>
                                        <th style="padding:10px; text-align:center;">Citas</th>
                                        <th style="padding:10px; text-align:center;">sesiones</th>
                                        <th style="padding:10px; text-align:center;">informes</th>
                                        <th style="padding:10px; text-align:right;">Ingresos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${Object.values(stats.profesionales.detalle)
                                        .sort((a, b) => b.ingresos - a.ingresos)
                                        .map(p => `
                                        <tr style="border-bottom:1px solid #e2e8f0;">
                                            <td style="padding:10px; font-weight:500;">${p.nombre}</td>
                                            <td style="padding:10px; text-align:center;">${p.pacientes}</td>
                                            <td style="padding:10px; text-align:center;">${p.citas}</td>
                                            <td style="padding:10px; text-align:center;">${p.sesiones}</td>
                                            <td style="padding:10px; text-align:center;">${p.informes}</td>
                                            <td style="padding:10px; text-align:right;">$${(p.ingresos / 1000).toFixed(0)}k</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- KPIs y métricas adicionales -->
                    <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:15px; margin-bottom:20px;">
                        <div style="background:#f8fafc; padding:15px; border-radius:10px; text-align:center;">
                            <div style="font-size:20px; font-weight:bold;">$${stats.pagos.promedioPorCita}</div>
                            <div style="font-size:12px; color:#666;">Promedio por cita</div>
                        </div>
                        
                        <div style="background:#f8fafc; padding:15px; border-radius:10px; text-align:center;">
                            <div style="font-size:20px; font-weight:bold;">${stats.pacientes.correos.pacientesConEmail}</div>
                            <div style="font-size:12px; color:#666;">Pacientes con email</div>
                        </div>
                        
                        <div style="background:#f8fafc; padding:15px; border-radius:10px; text-align:center;">
                            <div style="font-size:20px; font-weight:bold;">${stats.fichasClinicas.promedioSesionesPorPaciente}</div>
                            <div style="font-size:12px; color:#666;">sesiones x paciente</div>
                        </div>
                        
                        <div style="background:#f8fafc; padding:15px; border-radius:10px; text-align:center;">
                            <div style="font-size:20px; font-weight:bold; color:${stats.pagos.deudaTotal > 0 ? '#ff3b30' : '#34c759'}">
                                $${(stats.pagos.deudaTotal / 1000).toFixed(0)}k
                            </div>
                            <div style="font-size:12px; color:#666;">Deuda pendiente</div>
                        </div>
                    </div>
                    
                    <!-- Método de pago más usado -->
                    <div style="background:#f8fafc; padding:15px; border-radius:10px; margin-bottom:20px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight:500;">💳 Método de pago más usado:</span>
                            <span style="background:#0071e3; color:white; padding:4px 12px; border-radius:20px; font-size:14px;">
                                ${stats.pagos.metodoPagoMasUsado}
                            </span>
                        </div>
                    </div>
                    
                    <!-- Botones de exportación -->
                    <div style="display:flex; gap:15px; margin-top:30px; justify-content:flex-end;">
                        <button class="btn-staff" onclick="window.estadisticas?.exportarEstadisticasJSON()" 
                                style="background:var(--azul-apple);">
                            <i class="fa fa-download"></i> Exportar JSON
                        </button>
                        <button class="btn-staff" onclick="window.estadisticas?.exportarEstadisticasCSV()" 
                                style="background:var(--verde-exito);">
                            <i class="fa fa-file-excel"></i> Exportar CSV
                        </button>
                        <button class="btn-staff" onclick="window.estadisticas?.imprimirEstadisticas()" 
                                style="background:var(--naranja-aviso);">
                            <i class="fa fa-print"></i> Imprimir
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error renderizando estadísticas:', error);
            container.innerHTML = `
                <div style="text-align:center; padding:60px; background:white; border-radius:12px;">
                    <i class="fa fa-exclamation-triangle" style="font-size:48px; color:#ff3b30;"></i>
                    <p style="margin:20px 0; color:#666;">Error al cargar estadísticas</p>
                    <button class="btn-staff" onclick="window.estadisticas?.renderPanelEstadisticas()" 
                            style="background:var(--azul-apple);">
                        <i class="fa fa-refresh"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }, 100);
}

// ============================================
// FUNCIONES DE EXPORTACIÓN
// ============================================

/**
 * Exporta estadísticas a JSON
 */
export function exportarEstadisticasJSON() {
    if (!isAdmin()) return;
    
    const stats = getEstadisticasCompletas();
    if (!stats) return;
    
    const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estadisticas_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('✅ Estadísticas exportadas', 'success');
}

/**
 * Exporta estadísticas a CSV
 */
export function exportarEstadisticasCSV() {
    if (!isAdmin()) return;
    
    const stats = getEstadisticasCompletas();
    if (!stats) return;
    
    // Crear CSV con datos planos
    let csv = 'Categoría,Métrica,Valor\n';
    
    // Pacientes
    csv += `Pacientes,Total,${stats.pacientes.total}\n`;
    csv += `Pacientes,Nuevos este mes,${stats.pacientes.nuevosEsteMes}\n`;
    
    // Rangos de edad
    Object.entries(stats.pacientes.rangosEdad).forEach(([rango, valor]) => {
        csv += `Edad,${rango},${valor}\n`;
    });
    
    // Género
    Object.entries(stats.pacientes.genero).forEach(([genero, valor]) => {
        csv += `Género,${genero},${valor}\n`;
    });
    
    // Atenciones
    csv += `Atenciones,Total citas,${stats.atenciones.totalCitas}\n`;
    csv += `Atenciones,Total sesiones,${stats.atenciones.totalSesiones}\n`;
    csv += `Atenciones,Citas pagadas,${stats.atenciones.citasPagadas}\n`;
    csv += `Atenciones,Citas pendientes,${stats.atenciones.citasPendientes}\n`;
    
    // Fichas clínicas
    csv += `Fichas,Fichas de ingreso,${stats.fichasClinicas.totalFichasIngreso}\n`;
    csv += `Fichas,informes,${stats.fichasClinicas.totalInformes}\n`;
    csv += `Fichas,Promedio sesiones x paciente,${stats.fichasClinicas.promedioSesionesPorPaciente}\n`;
    
    // Ingresos
    csv += `Financiero,Ingresos totales,${stats.pagos.totalIngresos}\n`;
    csv += `Financiero,Ingresos este mes,${stats.pagos.ingresosEsteMes}\n`;
    csv += `Financiero,Deuda total,${stats.pagos.deudaTotal}\n`;
    csv += `Financiero,Promedio por cita,${stats.pagos.promedioPorCita}\n`;
    csv += `Financiero,Método más usado,${stats.pagos.metodoPagoMasUsado}\n`;
    
    // Profesionales
    csv += `Profesionales,Total,${stats.profesionales.total}\n`;
    csv += `Profesionales,Activos,${stats.profesionales.activos}\n`;
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estadisticas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('✅ CSV exportado', 'success');
}

/**
 * Imprime las estadísticas
 */
export function imprimirEstadisticas() {
    if (!isAdmin()) return;
    
    const stats = getEstadisticasCompletas();
    if (!stats) return;
    
    const ventana = window.open('', '_blank');
    ventana.document.write(`
        <html>
        <head>
            <title>Estadísticas Vínculo Salud</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #0071e3; }
                h2 { color: #333; border-bottom: 2px solid #0071e3; padding-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th { background: #f0f0f0; padding: 10px; text-align: left; }
                td { padding: 8px; border-bottom: 1px solid #ddd; }
                .card { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 10px 0; }
                .grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 20px; }
                .stat { font-size: 24px; font-weight: bold; color: #0071e3; }
                .label { color: #666; font-size: 14px; }
                .footer { margin-top: 30px; font-size: 12px; color: #999; text-align: center; }
            </style>
        </head>
        <body>
            <h1>📊 Estadísticas Vínculo Salud</h1>
            <p>Generado: ${new Date().toLocaleString()}</p>
            
            <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:15px; margin:30px 0;">
                <div class="card" style="text-align:center;">
                    <div class="stat">${stats.pacientes.total}</div>
                    <div class="label">Pacientes</div>
                </div>
                <div class="card" style="text-align:center;">
                    <div class="stat">${stats.atenciones.totalCitas}</div>
                    <div class="label">Citas</div>
                </div>
                <div class="card" style="text-align:center;">
                    <div class="stat">${stats.fichasClinicas.totalSesiones}</div>
                    <div class="label">sesiones</div>
                </div>
                <div class="card" style="text-align:center;">
                    <div class="stat">$${(stats.pagos.totalIngresos / 1000000).toFixed(1)}M</div>
                    <div class="label">Ingresos</div>
                </div>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h2>Pacientes</h2>
                    <p><strong>Total:</strong> ${stats.pacientes.total}</p>
                    <p><strong>Nuevos este mes:</strong> ${stats.pacientes.nuevosEsteMes}</p>
                    <h3>Rangos de Edad</h3>
                    ${Object.entries(stats.pacientes.rangosEdad).map(([r, v]) => `<p>${r}: ${v}</p>`).join('')}
                </div>
                
                <div class="card">
                    <h2>Género</h2>
                    ${Object.entries(stats.pacientes.genero).map(([g, v]) => `<p>${g}: ${v}</p>`).join('')}
                </div>
            </div>
            
            <div class="card">
                <h2>Atenciones</h2>
                <p><strong>Citas totales:</strong> ${stats.atenciones.totalCitas}</p>
                <p><strong>sesiones registradas:</strong> ${stats.atenciones.totalSesiones}</p>
                <p><strong>informes:</strong> ${stats.fichasClinicas.totalInformes}</p>
                <p><strong>Fichas de ingreso:</strong> ${stats.fichasClinicas.totalFichasIngreso}</p>
            </div>
            
            <div class="card">
                <h2>Financiero</h2>
                <p><strong>Ingresos totales:</strong> $${stats.pagos.totalIngresos.toLocaleString()}</p>
                <p><strong>Ingresos este mes:</strong> $${stats.pagos.ingresosEsteMes.toLocaleString()}</p>
                <p><strong>Deuda pendiente:</strong> $${stats.pagos.deudaTotal.toLocaleString()}</p>
                <p><strong>Promedio por cita:</strong> $${stats.pagos.promedioPorCita}</p>
                <p><strong>Método más usado:</strong> ${stats.pagos.metodoPagoMasUsado}</p>
            </div>
            
            <div class="card">
                <h2>Profesionales</h2>
                <p><strong>Total:</strong> ${stats.profesionales.total}</p>
                <p><strong>Activos:</strong> ${stats.profesionales.activos}</p>
                <table>
                    <tr>
                        <th>Nombre</th>
                        <th>Pacientes</th>
                        <th>Citas</th>
                        <th>sesiones</th>
                        <th>Ingresos</th>
                    </tr>
                    ${Object.values(stats.profesionales.detalle).map(p => `
                        <tr>
                            <td>${p.nombre}</td>
                            <td>${p.pacientes}</td>
                            <td>${p.citas}</td>
                            <td>${p.sesiones}</td>
                            <td>$${(p.ingresos / 1000).toFixed(0)}k</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
            
            <div class="footer">
                Vínculo Salud - Sistema de Gestión de Centros de Bienestar
            </div>
        </body>
        </html>
    `);
    ventana.document.close();
    ventana.print();
}

// ============================================
// EXPORTAR FUNCIONES AL OBJETO WINDOW
// ============================================
if (typeof window !== 'undefined') {
    window.estadisticas = {
        getEstadisticasCompletas,
        renderPanelEstadisticas,
        exportarEstadisticasJSON,
        exportarEstadisticasCSV,
        imprimirEstadisticas
    };
}

console.log('✅ estadisticas.js cargado - Módulo exclusivo para admin (sin boxes)');