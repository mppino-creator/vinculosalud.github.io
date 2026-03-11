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
    const psychMessages = state.messages.filter(m => m.therapistId == psychId);
    if (psychMessages.length === 0) return 0;
    return psychMessages.reduce((sum, m) => sum + m.rating, 0) / psychMessages.length;
}

// ============================================
// FUNCIÓN PARA TOGGLE DE INFORMACIÓN (ACCORDION)
// ============================================
window.toggleInfo = function(button) {
    // Buscar la tarjeta más cercana
    const card = button.closest('.professional-card, .therapist-card');
    if (!card) return;
    
    // Buscar o crear la sección de información
    let infoSection = card.querySelector('.card-info');
    
    if (!infoSection) {
        // Si no existe, obtener el ID del profesional
        const psychId = card.getAttribute('data-id');
        const psych = state.staff.find(p => p.id == psychId);
        if (!psych) return;
        
        // Crear la sección de información
        infoSection = document.createElement('div');
        infoSection.className = 'card-info';
        infoSection.style.display = 'none';
        
        // Construir el contenido
        let infoHTML = '';
        
        if (psych.education) {
            infoHTML += `
                <div class="info-section">
                    <h4>Formación</h4>
                    <p>${psych.education}</p>
                </div>
            `;
        }
        
        if (psych.spec && psych.spec.length) {
            const specs = Array.isArray(psych.spec) ? psych.spec : [psych.spec];
            infoHTML += `
                <div class="info-section">
                    <h4>Especialidades</h4>
                    <div class="specialties-list">
                        ${specs.map(s => `<span class="specialty-tag">${s}</span>`).join('')}
                    </div>
                </div>
            `;
        }
        
        if (psych.experience) {
            infoHTML += `
                <div class="info-section">
                    <h4>Experiencia clínica</h4>
                    <p>${psych.experience}</p>
                </div>
            `;
        }
        
        if (psych.clinicalExperience) {
            infoHTML += `
                <div class="info-section">
                    <h4>Experiencia detallada</h4>
                    <p>${psych.clinicalExperience}</p>
                </div>
            `;
        }
        
        if (psych.languages) {
            const langs = Array.isArray(psych.languages) ? psych.languages.join(', ') : psych.languages;
            infoHTML += `
                <div class="info-section">
                    <h4>Idiomas</h4>
                    <p>${langs}</p>
                </div>
            `;
        }
        
        if (psych.whatsapp) {
            infoHTML += `
                <div class="info-section">
                    <h4>Contacto</h4>
                    <a href="https://wa.me/${psych.whatsapp.replace(/\+/g, '')}?text=${encodeURIComponent('Hola, necesito información sobre tus atenciones.')}" target="_blank" class="whatsapp-link">
                        <i class="fab fa-whatsapp"></i> Contactar por WhatsApp
                    </a>
                </div>
            `;
        }
        
        infoSection.innerHTML = infoHTML;
        card.appendChild(infoSection);
    }
    
    // Toggle visibility
    const isHidden = infoSection.style.display === 'none' || !infoSection.style.display;
    infoSection.style.display = isHidden ? 'block' : 'none';
    
    // Cambiar el icono del botón
    const icon = button.querySelector('i');
    if (icon) {
        icon.className = isHidden ? 'fa fa-chevron-up' : 'fa fa-chevron-down';
    }
    
    // Cambiar el texto del botón
    const buttonText = button.innerHTML.replace(/<i.*<\/i>/, '').trim();
    button.innerHTML = isHidden ? `Menos Información <i class="fa fa-chevron-up"></i>` : `Más Información <i class="fa fa-chevron-down"></i>`;
}

// ============================================
// FUNCIONES DE NAVEGACIÓN DEL MENÚ
// ============================================
export function showSection(sectionId) {
    console.log('🔄 Mostrando sección:', sectionId);
    
    // Breadcrumbs
    const breadcrumbs = document.querySelector('.breadcrumbs');
    const currentPageSpan = document.getElementById('currentPage');
    
    const sections = {
        'inicio': document.getElementById('inicio'),
        'about': document.getElementById('about'),
        'equipo': document.getElementById('equipo'),
        'atencion': document.getElementById('atencion'),
        'contacto': document.getElementById('contacto')
    };
    
    Object.values(sections).forEach(section => {
        if (section) section.style.display = 'none';
    });
    
    if (sections[sectionId]) {
        sections[sectionId].style.display = 'block';
        sections[sectionId].scrollIntoView({ behavior: 'smooth' });
        
        if (sectionId === 'about') updateAboutSection();
        else if (sectionId === 'atencion') updateAtencionSection();
        else if (sectionId === 'contacto') updateContactSection();
    }
    
    const grid = document.getElementById('equipo');
    const messages = document.getElementById('messagesGrid');
    const filtros = document.querySelector('.filters');
    
    if (grid) grid.style.display = 'grid';
    if (messages) messages.style.display = 'grid';
    if (filtros) filtros.style.display = sectionId === 'equipo' ? 'flex' : 'none';
    
    // Actualizar breadcrumbs
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
    
    document.querySelectorAll('.public-nav a').forEach(link => {
        link.classList.remove('active');
        link.style.borderBottom = 'none';
        link.style.paddingBottom = '0';
    });
    
    const activeLink = document.querySelector(`.public-nav a[onclick*="${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
        activeLink.style.borderBottom = '2px solid var(--ocre-calido)';
        activeLink.style.paddingBottom = '5px';
    }
    
    console.log(`✅ Sección ${sectionId} mostrada correctamente`);
}

export function abrirAgenda() {
    console.log('📅 Abriendo agenda con profesionales y filtros...');
    showSection('equipo');
    
    const filtros = document.querySelector('.filters');
    if (filtros) filtros.style.display = 'flex';
    
    const grid = document.getElementById('equipo');
    if (grid) grid.style.display = 'grid';
    
    showToast('Selecciona un profesional para ver su disponibilidad y agendar tu hora', 'info', 3000);
}

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
    console.log('📊 Total staff en state antes de filtrar:', state.staff.length);
    
    const searchTerm = document.getElementById('searchFilter')?.value.toLowerCase() || '';
    const specialtyTerm = document.getElementById('specialtyFilter')?.value || '';
    const availabilityFilter = document.getElementById('availabilityFilter')?.value || '';

    let filtered = getPublicStaff().filter(p => {
        const specs = Array.isArray(p.spec) ? p.spec.join(' ') : p.spec;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm) || (specs && specs.toLowerCase().includes(searchTerm));

        let matchesSpecialty = true;
        if (specialtyTerm) {
            const pSpecs = Array.isArray(p.spec) ? p.spec : [p.spec];
            matchesSpecialty = pSpecs.some(s => s && s.toLowerCase().includes(specialtyTerm.toLowerCase()));
        }

        let matchesAvailability = true;
        if (availabilityFilter === 'available') {
            const today = new Date().toISOString().split('T')[0];
            matchesAvailability = p.availability && p.availability[today] && p.availability[today].length > 0;
        } else if (availabilityFilter === 'today') {
            const today = new Date().toISOString().split('T')[0];
            matchesAvailability = p.availability && p.availability[today] && p.availability[today].length > 0;
        } else if (availabilityFilter === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            matchesAvailability = p.availability && p.availability[tomorrowStr] && p.availability[tomorrowStr].length > 0;
        }

        return matchesSearch && matchesSpecialty && matchesAvailability;
    });

    filtered.sort((a, b) => a.name.localeCompare(b.name));
    console.log('📊 Profesionales después de filtro:', filtered.length);
    renderProfessionals(filtered);
}

export function renderProfessionals(professionals) {
    const grid = document.getElementById('equipo');
    if (!grid) {
        console.error('❌ Grid de profesionales no encontrado (id="equipo")');
        return;
    }

    if (professionals.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;">No se encontraron profesionales</div>';
        return;
    }

    grid.innerHTML = professionals.map(p => {
        const today = new Date().toISOString().split('T')[0];
        const citasHoy = window.state?.appointments?.filter(a => a.psychId == p.id && a.date === today && (a.status === 'confirmada' || a.status === 'pendiente')) || [];
        const solicitudesHoy = window.state?.pendingRequests?.filter(r => r.psychId == p.id && r.date === today && r.time && r.time !== 'Pendiente') || [];
        const totalOcupadosHoy = citasHoy.length + solicitudesHoy.length;
        const slotsHoy = p.availability && p.availability[today] ? p.availability[today] : [];
        const horasLibres = slotsHoy.length - totalOcupadosHoy;

        // Calcular calificación y estrellas
        const rating = getAverageRating(p.id);
        const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
        const totalReseñas = state.messages.filter(m => m.therapistId == p.id).length;

        // Construir HTML de la tarjeta con estructura accordion
        return `
            <div class="professional-card therapist-card" data-id="${p.id}">
                <!-- HEADER DE LA TARJETA (SIEMPRE VISIBLE) -->
                <div class="card-header">
                    <div class="img-container">
                        <img src="${p.img || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500'}" alt="${p.name}" loading="lazy">
                    </div>
                    <h3>${p.name}</h3>
                    <p class="card-subtitle">${p.title || 'Psicólogo Clínico de Adultos y Adolescentes, Terapeuta Familiar y de Parejas.'}</p>
                    
                    ${rating > 0 ? `
                    <div class="rating">
                        <span style="color: var(--gold);">${stars}</span>
                        <span style="color: var(--texto-secundario); font-size: 0.85rem;">(${totalReseñas} reseñas)</span>
                    </div>
                    ` : ''}
                    
                    <div class="card-meta">
                        <span><i class="fa fa-map-marker-alt"></i> ${p.address || 'Dirección no especificada'}</span>
                        <span><i class="fa fa-clock"></i> ${horasLibres > 0 ? `${horasLibres} horario(s) disponible(s) hoy` : 'Sin disponibilidad hoy'}</span>
                    </div>
                    
                    <div class="card-actions">
                        <button class="btn-mas-info" onclick="event.stopPropagation(); window.toggleInfo(this)">
                            Más Información <i class="fa fa-chevron-down"></i>
                        </button>
                        <button class="btn-agendar" onclick="event.stopPropagation(); openBooking('${p.id}')">
                            AGENDA TU HORA
                        </button>
                    </div>
                </div>
                
                <!-- INFORMACIÓN ADICIONAL (SE GENERA DINÁMICAMENTE AL HACER CLIC) -->
            </div>
        `;
    }).join('');
    
    console.log(`✅ Renderizados ${professionals.length} profesionales con estilo accordion`);
}

// ============================================
// CARGA INICIAL DE DATOS (ACTUALIZADA - SIN BOXES)
// ============================================
export function cargarDatosIniciales() {
    console.log('🚀 Cargando datos iniciales...');
    
    const grid = document.getElementById('equipo');
    if (grid) grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;"><i class="fa fa-spinner fa-spin fa-3x" style="color:var(--primario);"></i><p>Cargando profesionales...</p></div>';

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

        // Agregar administrador oculto
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

    // ⚠️ Boxes desactivado - no se carga
    // db.ref('Boxes').on('value', (snapshot) => {
    //     const data = snapshot.val();
    //     state.setBoxes(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []);
    //     if (state.currentUser?.role === 'admin') renderBoxesTable();
    //     if (state.currentUser?.role === 'psych') renderBoxOccupancy();
    // });

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
                // ⚠️ Boxes desactivado - no se renderiza ocupación
                // if (state.currentUser?.role === 'psych') renderBoxOccupancy();
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

console.log('✅ publico.js cargado con navegación corregida, estilo accordion v4.0 y SIN BOXES');