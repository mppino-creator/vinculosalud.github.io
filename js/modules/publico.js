// js/modules/publico.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast, getPublicStaff } from './utils.js';
import { renderMessages, updateMarquee } from './mensajes.js';
import { 
    cargarEspecialidades, 
    cargarMetodosPago, 
    cargarFondo, 
    cargarTextos, 
    cargarLogo,
    cargarAboutTexts,
    cargarAtencionTexts,
    cargarContactInfo,
    updateAboutSection,
    updateAtencionSection,
    updateContactSection
} from './personalizacion.js';
import { renderStaffTable } from './profesionales.js';
// ⚠️ Boxes desactivado - no se importa
// import { renderBoxesTable, renderBoxOccupancy } from './boxes.js';
import { renderPatients } from './pacientes.js';
import { renderPendingRequests } from './citas.js';

// ============================================
// FUNCIÓN AUXILIAR PARA CALIFICACIONES
// ============================================
function getAverageRating(psychId) {
    const messages = state.messages || [];
    const psychMessages = messages.filter(m => m && m.therapistId == psychId);
    if (psychMessages.length === 0) return 0;
    const sum = psychMessages.reduce((sum, m) => sum + (m.rating || 0), 0);
    return sum / psychMessages.length;
}

// ============================================
// FUNCIÓN PARA TOGGLE DE INFORMACIÓN (ACCORDION)
// ============================================
window.toggleInfo = function(button) {
    const card = button?.closest('.professional-card, .therapist-card');
    if (!card) return;
    
    const psychId = card.getAttribute('data-id');
    const psych = state.staff?.find(p => p.id == psychId);
    if (!psych) return;
    
    let infoSection = card.querySelector('.card-info');
    
    if (!infoSection) {
        infoSection = document.createElement('div');
        infoSection.className = 'card-info';
        infoSection.style.display = 'none';
        
        let infoHTML = '';
        
        if (psych.education) {
            infoHTML += `<div class="info-section"><h4><i class="fa fa-graduation-cap"></i> Formación</h4><p>${psych.education}</p></div>`;
        }
        
        if (psych.spec && psych.spec.length) {
            const specs = Array.isArray(psych.spec) ? psych.spec : [psych.spec];
            infoHTML += `<div class="info-section"><h4><i class="fa fa-tags"></i> Especialidades</h4><div class="specialties-list">${specs.filter(s => s).map(s => `<span class="specialty-tag">${s}</span>`).join('')}</div></div>`;
        }
        
        if (psych.experience) {
            infoHTML += `<div class="info-section"><h4><i class="fa fa-briefcase"></i> Experiencia</h4><p>${psych.experience} años de experiencia clínica</p></div>`;
        }
        
        if (psych.clinicalExperience) {
            infoHTML += `<div class="info-section"><h4><i class="fa fa-heart"></i> Enfoque clínico</h4><p>${psych.clinicalExperience}</p></div>`;
        }
        
        if (psych.languages) {
            const langs = Array.isArray(psych.languages) ? psych.languages.join(', ') : psych.languages;
            infoHTML += `<div class="info-section"><h4><i class="fa fa-language"></i> Idiomas</h4><p>${langs}</p></div>`;
        }
        
        if (psych.whatsapp) {
            infoHTML += `<div class="info-section"><h4><i class="fa fa-phone"></i> Contacto</h4><a href="https://wa.me/${psych.whatsapp.replace(/\+/g, '')}?text=${encodeURIComponent('Hola, necesito información sobre tus atenciones.')}" target="_blank" class="whatsapp-link"><i class="fab fa-whatsapp"></i> Contactar por WhatsApp</a></div>`;
        }
        
        infoSection.innerHTML = infoHTML;
        card.appendChild(infoSection);
    }
    
    const isHidden = infoSection.style.display === 'none' || !infoSection.style.display;
    infoSection.style.display = isHidden ? 'block' : 'none';
    
    button.innerHTML = isHidden ? 
        '<i class="fa fa-chevron-up"></i> <span>Menos información</span>' : 
        '<i class="fa fa-chevron-down"></i> <span>Más información</span>';
    
    if (infoSection.style.display === 'block') {
        infoSection.style.animation = 'slideDown 0.3s ease';
    }
};

// ============================================
// 🆕 FUNCIÓN DE NAVEGACIÓN MEJORADA - VERSIÓN CORREGIDA CON ACTUALIZACIÓN DE INSTAGRAM
// ============================================
export function showSection(sectionId) {
    console.log('🔄 Mostrando sección:', sectionId);
    
    // 1. DEFINIR TODAS LAS SECCIONES DISPONIBLES
    const secciones = ['inicio', 'about', 'equipo', 'atencion', 'contacto'];
    
    // 2. OCULTAR TODAS LAS SECCIONES (esto es clave)
    secciones.forEach(sec => {
        const elemento = document.getElementById(sec);
        if (elemento) {
            elemento.style.display = 'none';
        }
    });
    
    // 3. MOSTRAR SOLO LA SECCIÓN SELECCIONADA
    const seccionAMostrar = document.getElementById(sectionId);
    if (seccionAMostrar) {
        seccionAMostrar.style.display = 'block';
        seccionAMostrar.scrollIntoView({ behavior: 'smooth' });
    }
    
    // 4. ACTUALIZAR CLASES ACTIVAS EN EL MENÚ
    document.querySelectorAll('.public-nav a').forEach(link => {
        link.classList.remove('active');
        link.style.borderBottom = 'none';
        link.style.paddingBottom = '0';
        
        if (link.getAttribute('onclick')?.includes(sectionId)) {
            link.classList.add('active');
            link.style.borderBottom = '2px solid var(--ocre-calido)';
            link.style.paddingBottom = '5px';
        }
    });
    
    // 5. ACTUALIZAR BREADCRUMBS
    const breadcrumbs = document.querySelector('.breadcrumbs');
    const currentPageSpan = document.getElementById('currentPage');
    
    if (breadcrumbs) {
        if (sectionId !== 'inicio') {
            breadcrumbs.style.display = 'block';
            const nombres = {
                'about': 'Quiénes Somos',
                'equipo': 'Equipo',
                'atencion': 'Tipo de Atención',
                'contacto': 'Contacto'
            };
            if (currentPageSpan) currentPageSpan.textContent = nombres[sectionId] || sectionId;
        } else {
            breadcrumbs.style.display = 'none';
        }
    }
    
    // 6. 🔥 NUEVO: Cuando se muestra la sección equipo, actualizar Instagram
    if (sectionId === 'equipo') {
        // Pequeño retraso para asegurar que la sección es visible
        setTimeout(() => {
            if (window.personalizacion && typeof window.personalizacion.updateInstagramSection === 'function') {
                console.log('📸 Forzando actualización de Instagram al mostrar sección equipo');
                window.personalizacion.updateInstagramSection();
            }
        }, 300);
    }
    
    // 7. LÓGICA ESPECÍFICA POR SECCIÓN
    if (sectionId === 'equipo') {
        // Solo en EQUIPO se muestran los profesionales
        const grid = document.getElementById('equipo');
        if (grid) grid.style.display = 'block';
        
        const filtros = document.querySelector('.filters');
        if (filtros) filtros.style.display = 'flex';
        
        // Cargar profesionales
        if (typeof filterProfessionals === 'function') {
            filterProfessionals();
        }
    } else {
        // En las demás secciones, ocultar filtros
        const filtros = document.querySelector('.filters');
        if (filtros) filtros.style.display = 'none';
        
        // Cargar contenido específico de cada sección
        if (sectionId === 'about') {
            updateAboutSection();
        } else if (sectionId === 'atencion') {
            updateAtencionSection();
        } else if (sectionId === 'contacto') {
            updateContactSection();
        }
    }
    
    console.log(`✅ Sección ${sectionId} mostrada correctamente`);
}

// ============================================
// FUNCIÓN PARA ABRIR AGENDA
// ============================================
export function abrirAgenda() {
    console.log('📅 Abriendo agenda con profesionales y filtros...');
    showSection('equipo');
    
    const filtros = document.querySelector('.filters');
    if (filtros) filtros.style.display = 'flex';
    
    const grid = document.getElementById('equipo');
    if (grid) grid.style.display = 'block';
    
    showToast('Selecciona un profesional para ver su disponibilidad y agendar tu hora', 'info', 3000);
}

// ============================================
// FUNCIÓN PARA ENVIAR CONTACTO
// ============================================
export function enviarContacto() {
    const nombre = document.getElementById('contactName')?.value;
    const email = document.getElementById('contactEmail')?.value;
    const mensaje = document.getElementById('contactMessage')?.value;
    
    if (!nombre || !email || !mensaje) {
        showToast('Completa todos los campos', 'error');
        return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
        showToast('Ingresa un email válido', 'error');
        return;
    }
    
    console.log('📧 Mensaje de contacto:', { nombre, email, mensaje });
    showToast('✅ Mensaje enviado, te contactaremos pronto', 'success');
    
    document.getElementById('contactName').value = '';
    document.getElementById('contactEmail').value = '';
    document.getElementById('contactMessage').value = '';
}

// ============================================
// COMPARTIR PERFIL
// ============================================
export function compartirPerfil(psychId, psychName) {
    const url = window.location.href.split('?')[0] + '?profesional=' + psychId;
    
    if (navigator.share) {
        navigator.share({
            title: `${psychName} - Vínculo Salud`,
            text: `Conoce a ${psychName} y agenda tu cita`,
            url: url,
        }).catch(() => mostrarOpcionesCompartir(url, psychName));
    } else {
        mostrarOpcionesCompartir(url, psychName);
    }
}

function mostrarOpcionesCompartir(url, psychName) {
    const mensajeWhatsApp = `https://wa.me/?text=${encodeURIComponent(`📋 ${psychName} - Vínculo Salud\n${url}`)}`;
    const mensajeEmail = `mailto:?subject=${encodeURIComponent(`Perfil de ${psychName} en Vínculo Salud`)}&body=${encodeURIComponent(`Te recomiendo este profesional:\n${url}`)}`;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); 
        display:flex; justify-content:center; align-items:center; z-index:10000;
    `;
    modal.innerHTML = `
        <div style="background:white; padding:25px; border-radius:20px; max-width:300px; text-align:center;">
            <h3 style="margin-bottom:20px; color:var(--texto-principal);">Compartir perfil</h3>
            <div style="display:flex; gap:15px; justify-content:center; margin-bottom:20px;">
                <a href="${mensajeWhatsApp}" target="_blank" style="background:var(--whatsapp); color:white; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px; text-decoration:none;"><i class="fab fa-whatsapp"></i></a>
                <a href="${mensajeEmail}" style="background:var(--primario); color:white; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; text-decoration:none;"><i class="fa fa-envelope"></i></a>
                <button onclick="copiarAlPortapapeles('${url}')" style="background:var(--exito); color:white; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; border:none; cursor:pointer;"><i class="fa fa-link"></i></button>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="background:var(--peligro); color:white; padding:10px 20px; border:none; border-radius:30px; cursor:pointer;">Cerrar</button>
        </div>
    `;
    document.body.appendChild(modal);
}

export function copiarAlPortapapeles(texto) {
    navigator.clipboard.writeText(texto).then(() => showToast('✅ Enlace copiado', 'success'))
        .catch(() => showToast('❌ Error al copiar', 'error'));
}

// ============================================
// FUNCIÓN LEGACY PARA COMPATIBILIDAD
// ============================================
export function showTherapistInfo(psychId) {
    console.log('📋 Usando nuevo sistema accordion para profesional:', psychId);
    const button = document.querySelector(`.therapist-card[data-id="${psychId}"] .btn-mas-info`);
    if (button) {
        window.toggleInfo(button);
    }
}

// ============================================
// FILTRO Y RENDERIZADO DE PROFESIONALES
// ============================================
export function filterProfessionals() {
    console.log('🔄 filterProfessionals ejecutándose...');
    
    const staff = state.staff || [];
    console.log('📊 Total staff en state antes de filtrar:', staff.length);
    
    const searchTerm = document.getElementById('searchFilter')?.value?.toLowerCase() || '';
    const specialtyTerm = document.getElementById('specialtyFilter')?.value || '';
    const availabilityFilter = document.getElementById('availabilityFilter')?.value || '';

    let filtered = getPublicStaff().filter(p => {
        if (!p) return false;
        
        const name = p.name || '';
        const specs = p.spec ? (Array.isArray(p.spec) ? p.spec : [p.spec]) : [];
        const specsText = specs.join(' ').toLowerCase();
        
        const matchesSearch = name.toLowerCase().includes(searchTerm) || specsText.includes(searchTerm);

        let matchesSpecialty = true;
        if (specialtyTerm) {
            matchesSpecialty = specs.some(s => s && s.toLowerCase().includes(specialtyTerm.toLowerCase()));
        }

        let matchesAvailability = true;
        if (availabilityFilter === 'available' || availabilityFilter === 'today') {
            const today = new Date().toISOString().split('T')[0];
            const slotsHoy = p.availability && p.availability[today] ? p.availability[today] : [];
            matchesAvailability = slotsHoy.length > 0;
        } else if (availabilityFilter === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            const slotsManana = p.availability && p.availability[tomorrowStr] ? p.availability[tomorrowStr] : [];
            matchesAvailability = slotsManana.length > 0;
        }

        return matchesSearch && matchesSpecialty && matchesAvailability;
    });

    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    console.log('📊 Profesionales después de filtro:', filtered.length);
    renderProfessionals(filtered);
}

export function renderProfessionals(professionals) {
    const grid = document.getElementById('equipo');
    if (!grid) {
        console.error('❌ Grid de profesionales no encontrado (id="equipo")');
        return;
    }

    if (!professionals || professionals.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:60px; background:white; border-radius:20px;"><i class="fa fa-user-md" style="font-size:48px; color:#ccc;"></i><p style="margin-top:20px; color:#666;">No se encontraron profesionales</p></div>';
        return;
    }

    grid.innerHTML = professionals.map(p => {
        const today = new Date().toISOString().split('T')[0];
        const citasHoy = window.state?.appointments?.filter(a => a.psychId == p.id && a.date === today && (a.status === 'confirmada' || a.status === 'pendiente')) || [];
        const solicitudesHoy = window.state?.pendingRequests?.filter(r => r.psychId == p.id && r.date === today && r.time && r.time !== 'Pendiente') || [];
        const totalOcupadosHoy = citasHoy.length + solicitudesHoy.length;
        const slotsHoy = p.availability && p.availability[today] ? p.availability[today] : [];
        const horasLibres = slotsHoy.length - totalOcupadosHoy;

        const rating = getAverageRating(p.id);
        const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
        const totalReseñas = (state.messages || []).filter(m => m && m.therapistId == p.id).length;

        const name = p.name || 'Profesional';
        const title = p.title || (p.genero === 'M' ? 'Psicólogo' : p.genero === 'F' ? 'Psicóloga' : 'Psicólogo/a');
        const img = p.img || p.photoURL || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500';
        const address = p.address || 'Dirección no especificada';
        const disponibilidad = horasLibres > 0 ? `${horasLibres} disponible(s) hoy` : 'Sin disponibilidad hoy';

        return `
            <div class="professional-card therapist-card" data-id="${p.id}">
                <div class="img-container">
                    <img src="${img}" alt="${name}" loading="lazy">
                </div>
                <div class="card-body">
                    <h3>${name}</h3>
                    <p class="card-subtitle">${title}</p>
                    
                    ${rating > 0 ? `
                    <div class="rating">
                        <span class="stars">${stars}</span>
                        <span class="reviews">(${totalReseñas})</span>
                    </div>
                    ` : ''}
                    
                    <div class="card-meta">
                        <span><i class="fa fa-map-marker-alt"></i> <span class="meta-text">${address}</span></span>
                        <span><i class="fa fa-clock"></i> <span class="meta-text">${disponibilidad}</span></span>
                    </div>
                    
                    <div class="card-actions">
                        <button class="btn-mas-info" onclick="event.stopPropagation(); window.toggleInfo(this)">
                            <i class="fa fa-chevron-down"></i> <span>Más info</span>
                        </button>
                        <button class="btn-agendar" onclick="event.stopPropagation(); openBooking('${p.id}')">
                            <i class="fa fa-calendar-check"></i> <span>Agendar</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    console.log(`✅ Renderizados ${professionals.length} profesionales con botones optimizados`);
}

// ============================================
// CARGA INICIAL DE DATOS
// ============================================
export function cargarDatosIniciales() {
    console.log('🚀 Cargando datos iniciales...');
    
    const grid = document.getElementById('equipo');
    if (grid) grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:60px;"><div class="loader-spinner" style="margin:0 auto 20px;"></div><p style="color:#666;">Cargando profesionales...</p></div>';

    const filtros = document.querySelector('.filters');
    if (filtros) filtros.style.display = 'none';

    console.log('🔍 Intentando cargar profesionales desde Firebase (ruta: Staff)...');
    db.ref('Staff').once('value', (snapshot) => {
        const data = snapshot.val();
        console.log('📦 Datos recibidos de Firebase (Staff):', data ? '✅ existen datos' : '❌ vacío o null');
        
        if (data) {
            const staffArray = Object.keys(data).map(key => {
                const item = data[key];
                return { 
                    id: key, 
                    ...item,
                    usuario: item.usuario || item.user || '',
                    email: item.email || '',
                    spec: item.spec || ['Profesional'],
                    priceOnline: item.priceOnline || 0,
                    pricePresencial: item.pricePresencial || 0,
                    img: item.img || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500',
                    whatsapp: item.whatsapp || '',
                    instagram: item.instagram || '',
                    stars: item.stars || 5,
                    genero: item.genero || '',
                    address: item.address || '',
                    phone: item.phone || '',
                    title: item.title || '',
                    bio: item.bio || '',
                    education: item.education || '',
                    experience: item.experience || 0,
                    languages: item.languages || ['Español'],
                    clinicalExperience: item.clinicalExperience || '',
                    bankDetails: item.bankDetails || { bank: '', accountType: 'corriente', accountNumber: '', rut: '', email: '' },
                    paymentMethods: item.paymentMethods || state.globalPaymentMethods,
                    sessionDuration: item.sessionDuration || 45,
                    breakBetween: item.breakBetween || 10,
                    availability: item.availability || {},
                    paymentLinks: item.paymentLinks || { online: '', presencial: '', qrCode: '' }
                };
            });
            
            console.log(`✅ Profesionales procesados: ${staffArray.length}`);
            state.setStaff(staffArray);
        } else {
            console.warn('⚠️ No hay datos de profesionales en Firebase. Verifica la ruta "Staff".');
            state.setStaff([]);
        }

        const adminExists = state.staff.some(s => s.id == 9999 || s.name === 'Administrador');
        if (!adminExists) {
            state.staff.push({
                id: 9999,
                name: 'Administrador',
                spec: ['ADMIN_HIDDEN'],
                priceOnline: 0,
                pricePresencial: 0,
                usuario: 'Admin',
                pass: 'Nina2026',
                email: 'admin@vinculosalud.cl',
                img: '',
                whatsapp: '',
                instagram: '',
                stars: 0,
                genero: '',
                address: '',
                phone: '',
                title: '',
                bio: '',
                education: '',
                experience: 0,
                languages: ['Español'],
                bankDetails: {},
                isHiddenAdmin: true,
                isAdmin: true,
                paymentMethods: {},
                sessionDuration: 45,
                breakBetween: 10,
                availability: {},
                paymentLinks: { online: '', presencial: '', qrCode: '' }
            });
            console.log('👤 Administrador oculto agregado');
        }

        console.log('📊 Total staff después de procesar (incluyendo admin):', state.staff.length);
        filterProfessionals();
        if (state.currentUser?.role === 'admin') renderStaffTable();
        state.setDataLoaded(true);
    }, (error) => {
        console.error('❌ Error al cargar profesionales:', error);
        showToast('Error al cargar profesionales', 'error');
        state.setStaff([]);
        filterProfessionals();
    });

    db.ref('Patients').on('value', (snapshot) => {
        const data = snapshot.val();
        console.log('📋 Cargando pacientes desde Firebase...', data ? Object.keys(data).length : 0);
        state.setPatients(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []);
        if (state.currentUser) renderPatients();
        setTimeout(() => filterProfessionals(), 100);
    });

    db.ref('Appointments').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const newApps = Object.keys(data).map(key => ({ id: key, ...data[key] }));
            if (JSON.stringify(newApps) !== JSON.stringify(state.appointments)) {
                state.setAppointments(newApps);
                if (state.currentUser) {
                    if (typeof window.updateStats === 'function') window.updateStats();
                    renderPendingRequests();
                }
            }
        } else if (state.appointments.length > 0) state.setAppointments([]);
    });

    db.ref('PendingRequests').on('value', (snapshot) => {
        const data = snapshot.val();
        state.setPendingRequests(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []);
        if (state.currentUser) renderPendingRequests();
    });

    db.ref('Messages').on('value', (snapshot) => {
        const data = snapshot.val();
        state.setMessages(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [
            { id: 1, name: 'Carolina Méndez', rating: 5, text: 'Excelente profesional, me ayudó mucho con mi ansiedad.', date: '2024-02-15' },
            { id: 2, name: 'Roberto Campos', rating: 5, text: 'Muy buena página, encontré al especialista que necesitaba rápidamente.', date: '2024-02-16' },
            { id: 3, name: 'María José', rating: 4, text: 'Muy profesional, aunque los tiempos de espera a veces son largos.', date: '2024-02-17' }
        ]);
        renderMessages();
        updateMarquee();
        if (state.currentUser?.role === 'admin') import('./mensajes.js').then(mod => mod.renderMessagesTable());
    });

    console.log('📝 Cargando textos editables...');
    cargarEspecialidades();
    cargarMetodosPago();
    cargarFondo();
    cargarTextos();
    cargarLogo();
    cargarAboutTexts();
    cargarAtencionTexts();
    cargarContactInfo();
    
    setTimeout(() => {
        updateAboutSection();
        updateAtencionSection();
        updateContactSection();
    }, 500);
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================
export function actualizarTodasLasSecciones() {
    console.log('🔄 Actualizando todas las secciones...');
    updateAboutSection();
    updateAtencionSection();
    updateContactSection();
    if (typeof filterProfessionals === 'function') filterProfessionals();
}

export function forzarCargaDatos() {
    console.log('🔄 Forzando carga de datos...');
    if (!window.state?.dataLoaded) cargarDatosIniciales();
}

// ============================================
// EXPORTACIÓN AL OBJETO WINDOW
// ============================================
if (typeof window !== 'undefined') {
    console.log('🔧 Asignando funciones de publico.js a window...');
    
    window.showSection = showSection;
    window.abrirAgenda = abrirAgenda;
    window.enviarContacto = enviarContacto;
    window.compartirPerfil = compartirPerfil;
    window.copiarAlPortapapeles = copiarAlPortapapeles;
    window.showTherapistInfo = showTherapistInfo;
    window.toggleInfo = window.toggleInfo;
    window.filterProfessionals = filterProfessionals;
    window.forzarCargaDatos = forzarCargaDatos;
    window.forceRenderProfessionals = () => filterProfessionals();
    window.actualizarTodasLasSecciones = actualizarTodasLasSecciones;
    
    console.log('✅ Funciones de publico.js asignadas correctamente');
}

console.log('✅ publico.js cargado con botones optimizados y responsive (sin boxes)');