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
import { renderBoxesTable, renderBoxOccupancy } from './boxes.js';
import { renderPatients } from './pacientes.js';
import { renderPendingRequests } from './citas.js';

// ============================================
// FUNCIONES DE NAVEGACIÓN DEL MENÚ
// ============================================

window.showSection = function(sectionId) {
    console.log('🔄 Mostrando sección:', sectionId);
    
    // Mostrar todas las secciones principales
    const sections = {
        'inicio': document.getElementById('inicio'),
        'about': document.getElementById('about'),
        'equipo': document.getElementById('equipo'),
        'atencion': document.getElementById('atencion'),
        'blog': document.getElementById('blog'),
        'contacto': document.getElementById('contacto')
    };
    
    // Ocultar todas primero
    Object.values(sections).forEach(section => {
        if (section) section.style.display = 'none';
    });
    
    // Mostrar la seleccionada
    if (sections[sectionId]) {
        sections[sectionId].style.display = 'block';
        sections[sectionId].scrollIntoView({ behavior: 'smooth' });
        
        // Actualizar contenido dinámico según la sección
        if (sectionId === 'about') {
            updateAboutSection();
        } else if (sectionId === 'atencion') {
            updateAtencionSection();
        } else if (sectionId === 'contacto') {
            updateContactSection();
        }
    }
    
    // Siempre mostrar el grid de profesionales y mensajes
    const grid = document.getElementById('publicGrid');
    const messages = document.getElementById('messagesGrid');
    if (grid) grid.style.display = 'grid';
    if (messages) messages.style.display = 'grid';
    
    // Actualizar clase activa en el menú
    document.querySelectorAll('.public-nav a').forEach(link => {
        link.style.borderBottom = 'none';
        link.style.paddingBottom = '0';
    });
    
    const activeLink = document.querySelector(`.public-nav a[onclick*="${sectionId}"]`);
    if (activeLink) {
        activeLink.style.borderBottom = '2px solid var(--ocre-calido)';
        activeLink.style.paddingBottom = '5px';
    }
};

window.abrirAgenda = function() {
    console.log('📅 Abriendo agenda...');
    // Mostrar la sección equipo primero
    window.showSection('equipo');
    showToast('Selecciona un profesional para agendar tu hora', 'info');
};

window.enviarContacto = function() {
    const nombre = document.getElementById('contactName')?.value;
    const email = document.getElementById('contactEmail')?.value;
    const mensaje = document.getElementById('contactMessage')?.value;
    
    if (!nombre || !email || !mensaje) {
        showToast('Completa todos los campos', 'error');
        return;
    }
    
    // Aquí puedes agregar la lógica para enviar el mensaje
    showToast('Mensaje enviado, te contactaremos pronto', 'success');
    
    // Limpiar formulario
    document.getElementById('contactName').value = '';
    document.getElementById('contactEmail').value = '';
    document.getElementById('contactMessage').value = '';
};

// ============================================
// FUNCIÓN PARA COMPARTIR PERFIL
// ============================================
window.compartirPerfil = function(psychId, psychName) {
    const url = window.location.href.split('?')[0] + '?profesional=' + psychId;
    
    if (navigator.share) {
        navigator.share({
            title: `${psychName} - Vínculo Salud`,
            text: `Conoce a ${psychName} y agenda tu cita`,
            url: url,
        }).catch(() => {
            mostrarOpcionesCompartir(url, psychName);
        });
    } else {
        mostrarOpcionesCompartir(url, psychName);
    }
};

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
                <a href="${mensajeWhatsApp}" target="_blank" style="background:var(--whatsapp); color:white; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px; text-decoration:none;">
                    <i class="fab fa-whatsapp"></i>
                </a>
                <a href="${mensajeEmail}" style="background:var(--primario); color:white; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; text-decoration:none;">
                    <i class="fa fa-envelope"></i>
                </a>
                <button onclick="copiarAlPortapapeles('${url}')" style="background:var(--exito); color:white; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; border:none; cursor:pointer;">
                    <i class="fa fa-link"></i>
                </button>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="background:var(--peligro); color:white; padding:10px 20px; border:none; border-radius:30px; cursor:pointer;">
                Cerrar
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

window.copiarAlPortapapeles = function(texto) {
    navigator.clipboard.writeText(texto).then(() => {
        showToast('✅ Enlace copiado al portapapeles', 'success');
    }).catch(() => {
        showToast('❌ Error al copiar', 'error');
    });
};

// ============================================
// FUNCIÓN PARA MOSTRAR MÁS INFORMACIÓN DEL PROFESIONAL
// ============================================
window.showTherapistInfo = function(psychId) {
    const psych = state.staff.find(p => p.id == psychId);
    if (!psych) return;
    
    // Crear modal con información detallada
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <span class="modal-close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2 style="color: var(--verde-azulado-profundo); margin-bottom: 20px;">${psych.name}</h2>
            <div style="margin-bottom: 20px;">
                <p style="color: var(--texto-principal); line-height: 1.6;">${psych.bio || 'Especialista en salud mental con amplia experiencia en terapia individual, familiar y de pareja.'}</p>
            </div>
            <div style="border-top: 1px solid var(--gris-claro); padding-top: 20px;">
                <p style="margin: 10px 0;"><i class="fa fa-graduation-cap" style="color: var(--ocre-calido); width: 25px;"></i> ${psych.education || 'Formación no especificada'}</p>
                <p style="margin: 10px 0;"><i class="fa fa-clock" style="color: var(--ocre-calido); width: 25px;"></i> ${psych.experience || '0'} años de experiencia</p>
                <p style="margin: 10px 0;"><i class="fa fa-language" style="color: var(--ocre-calido); width: 25px;"></i> ${psych.languages ? psych.languages.join(', ') : 'Español'}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove(); openBooking('${psych.id}')" class="btn-staff" style="width:100%; margin-top:20px; background: var(--verde-azulado-profundo);">
                AGENDAR HORA
            </button>
        </div>
    `;
    document.body.appendChild(modal);
};

export function filterProfessionals() {
    console.log('🔄 filterProfessionals ejecutándose...');
    const searchTerm = document.getElementById('searchFilter')?.value.toLowerCase() || '';
    const specialtyTerm = document.getElementById('specialtyFilter')?.value || '';
    const availabilityFilter = document.getElementById('availabilityFilter')?.value || '';

    let filtered = getPublicStaff().filter(p => {
        const specs = Array.isArray(p.spec) ? p.spec.join(' ') : p.spec;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm) || 
                             specs.toLowerCase().includes(searchTerm);

        let matchesSpecialty = true;
        if (specialtyTerm) {
            const pSpecs = Array.isArray(p.spec) ? p.spec : [p.spec];
            matchesSpecialty = pSpecs.some(s => s.toLowerCase().includes(specialtyTerm.toLowerCase()));
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
    renderProfessionals(filtered);
}

export function renderProfessionals(professionals) {
    const grid = document.getElementById('publicGrid');
    if (!grid) return;

    if (professionals.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;">No se encontraron profesionales</div>';
        return;
    }

    grid.innerHTML = professionals.map(p => {
        const today = new Date().toISOString().split('T')[0];
        
        // Calcular disponibilidad
        const citasHoy = window.state?.appointments?.filter(a => 
            a.psychId == p.id && 
            a.date === today && 
            (a.status === 'confirmada' || a.status === 'pendiente')
        ) || [];
        
        const solicitudesHoy = window.state?.pendingRequests?.filter(r => 
            r.psychId == p.id && 
            r.date === today && 
            r.time && 
            r.time !== 'Pendiente'
        ) || [];
        
        const totalOcupadosHoy = citasHoy.length + solicitudesHoy.length;
        const slotsHoy = p.availability && p.availability[today] ? p.availability[today] : [];
        const horasLibres = slotsHoy.length - totalOcupadosHoy;

        // ============================================
        // 🎨 TARJETA ESTILO PUNTOTERAPIA - EXACTA
        // ============================================
        return `
            <div class="therapist-card" data-id="${p.id}" style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid var(--gris-claro);">
                <!-- Imagen del profesional -->
                <div style="width: 100%; height: 280px; overflow: hidden;">
                    <img src="${p.img || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500'}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                
                <!-- Contenido de la tarjeta -->
                <div style="padding: 25px;">
                    <!-- Nombre en MAYÚSCULAS -->
                    <h3 style="font-size: 1.4rem; font-weight: 700; color: var(--texto-principal); margin-bottom: 10px; text-transform: uppercase;">${p.name}</h3>
                    
                    <!-- Título profesional (formato específico) -->
                    <p style="color: var(--texto-secundario); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">
                        ${p.title || 'Psicólogo Clínico de Adultos y Adolescentes, Terapeuta Familiar y de Parejas.'}
                    </p>
                    
                    <!-- Botones en fila -->
                    <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                        <button onclick="showTherapistInfo('${p.id}')" style="background: transparent; border: 2px solid var(--verde-azulado-claro); color: var(--verde-azulado-claro); padding: 12px 25px; border-radius: 40px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.3s; flex: 1;">
                            Más Información
                        </button>
                        <button onclick="openBooking('${p.id}')" style="background: var(--verde-azulado-profundo); border: none; color: white; padding: 12px 25px; border-radius: 40px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.3s; flex: 1;">
                            AGENDA TU HORA
                        </button>
                    </div>
                    
                    <!-- Dirección -->
                    <div style="display: flex; align-items: center; gap: 8px; color: var(--texto-secundario); font-size: 0.9rem; margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--gris-claro);">
                        <i class="fa fa-map-marker-alt" style="color: var(--ocre-calido);"></i>
                        <span>${p.address || 'Dirección no especificada'}</span>
                    </div>
                    
                    <!-- Disponibilidad (opcional) -->
                    ${horasLibres > 0 ? `
                        <div style="margin-top: 10px; display: flex; align-items: center; gap: 5px;">
                            <span style="color: var(--exito); font-size: 0.8rem;">
                                <i class="fa fa-check-circle"></i> ${horasLibres} horario(s) disponible(s) hoy
                            </span>
                        </div>
                    ` : `
                        <div style="margin-top: 10px; display: flex; align-items: center; gap: 5px;">
                            <span style="color: var(--peligro); font-size: 0.8rem;">
                                <i class="fa fa-times-circle"></i> Sin disponibilidad hoy
                            </span>
                        </div>
                    `}
                    
                    <!-- Badge de WhatsApp si existe -->
                    ${p.whatsapp ? `
                        <div style="margin-top: 10px;">
                            <a href="https://wa.me/${p.whatsapp.replace(/\+/g, '')}?text=${encodeURIComponent('Hola, necesito información sobre tus atenciones.')}" target="_blank" style="color: var(--whatsapp); text-decoration: none; font-size: 0.9rem;">
                                <i class="fab fa-whatsapp"></i> Contactar por WhatsApp
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function getAverageRating(psychId) {
    const psychMessages = state.messages.filter(m => m.therapistId == psychId);
    if (psychMessages.length === 0) return 0;
    return psychMessages.reduce((sum, m) => sum + m.rating, 0) / psychMessages.length;
}

export function cargarDatosIniciales() {
    console.log('🚀 Cargando datos iniciales...');
    
    const grid = document.getElementById('publicGrid');
    if (grid) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;"><i class="fa fa-spinner fa-spin fa-3x" style="color:var(--primario);"></i><p>Cargando profesionales...</p></div>';
    }

    // Cargar profesionales
    db.ref('Staff').once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            state.setStaff(Object.keys(data).map(key => {
                const item = data[key];
                if (item.name && item.pass && !item.usuario && !item.user) {
                    return {
                        id: key,
                        name: item.name,
                        usuario: item.name.split(' ')[0] || item.name,
                        pass: item.pass,
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
                        bankDetails: item.bankDetails || { bank: '', accountType: 'corriente', accountNumber: '', rut: '', email: '' },
                        paymentMethods: item.paymentMethods || state.globalPaymentMethods,
                        sessionDuration: item.sessionDuration || 45,
                        breakBetween: item.breakBetween || 10,
                        availability: item.availability || {},
                        paymentLinks: item.paymentLinks || { online: '', presencial: '', qrCode: '' }
                    };
                } else {
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
                        bankDetails: item.bankDetails || { bank: '', accountType: 'corriente', accountNumber: '', rut: '', email: '' },
                        paymentMethods: item.paymentMethods || state.globalPaymentMethods,
                        sessionDuration: item.sessionDuration || 45,
                        breakBetween: item.breakBetween || 10,
                        availability: item.availability || {},
                        paymentLinks: item.paymentLinks || { online: '', presencial: '', qrCode: '' }
                    };
                }
            }));
        } else {
            state.setStaff([]);
        }

        // Agregar administrador
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

        filterProfessionals();
        if (state.currentUser?.role === 'admin') renderStaffTable();
        state.setDataLoaded(true);
    });

    // Cargar boxes
    db.ref('Boxes').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            state.setBoxes(Object.keys(data).map(key => ({ id: key, ...data[key] })));
        } else {
            state.setBoxes([]);
        }
        if (state.currentUser?.role === 'admin') renderBoxesTable();
        if (state.currentUser?.role === 'psych') renderBoxOccupancy();
    });

    // Cargar pacientes
    db.ref('Patients').on('value', (snapshot) => {
        const data = snapshot.val();
        console.log('📋 Cargando pacientes desde Firebase...', data ? Object.keys(data).length : 0);
        
        if (data) {
            const patientsArray = Object.keys(data).map(key => ({ 
                id: key, 
                ...data[key] 
            }));
            state.setPatients(patientsArray);
            console.log('✅ Pacientes cargados:', patientsArray.length);
        } else {
            state.setPatients([]);
            console.log('📋 No hay pacientes en Firebase');
        }
        
        if (state.currentUser) {
            renderPatients();
        }
        
        setTimeout(() => {
            if (typeof filterProfessionals === 'function') {
                filterProfessionals();
            }
        }, 100);
    });

    // Listener de Appointments
    db.ref('Appointments').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const newAppointments = Object.keys(data).map(key => ({ id: key, ...data[key] }));
            
            if (JSON.stringify(newAppointments) !== JSON.stringify(state.appointments)) {
                state.setAppointments(newAppointments);
                console.log('📅 Citas actualizadas en Firebase');
                
                if (state.currentUser) {
                    if (typeof window.updateStats === 'function') window.updateStats();
                    renderPendingRequests();
                }
                if (state.currentUser?.role === 'psych') renderBoxOccupancy();
            }
        } else {
            if (state.appointments.length > 0) state.setAppointments([]);
        }
    });

    // Cargar solicitudes pendientes
    db.ref('PendingRequests').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            state.setPendingRequests(Object.keys(data).map(key => ({ id: key, ...data[key] })));
        } else {
            state.setPendingRequests([]);
        }
        if (state.currentUser) renderPendingRequests();
    });

    // Cargar mensajes
    db.ref('Messages').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            state.setMessages(Object.keys(data).map(key => ({ id: key, ...data[key] })));
        } else {
            state.setMessages([
                { id: 1, name: 'Carolina Méndez', email: '', whatsapp: '', therapistId: 1, therapistName: 'Psic. Alison Gutiérrez', rating: 5, text: 'Excelente profesional, me ayudó mucho con mi ansiedad. Muy recomendada.', date: '2024-02-15' },
                { id: 2, name: 'Roberto Campos', email: 'roberto@email.com', whatsapp: '+56912345678', therapistId: null, therapistName: null, rating: 5, text: 'Muy buena página, encontré al especialista que necesitaba rápidamente.', date: '2024-02-16' },
                { id: 3, name: 'María José', email: '', whatsapp: '', therapistId: 2, therapistName: 'Dr. Julián Sossa', rating: 4, text: 'Muy profesional, aunque los tiempos de espera a veces son largos.', date: '2024-02-17' }
            ]);
        }
        renderMessages();
        updateMarquee();
        if (state.currentUser?.role === 'admin') {
            import('./mensajes.js').then(mod => mod.renderMessagesTable());
        }
    });

    // ============================================
    // CARGAR TODOS LOS TEXTOS EDITABLES
    // ============================================
    console.log('📝 Cargando textos editables...');
    
    // Cargar configuraciones básicas
    cargarEspecialidades();
    cargarMetodosPago();
    cargarFondo();
    cargarTextos();
    cargarLogo();
    
    // Cargar nuevas secciones editables
    cargarAboutTexts();
    cargarAtencionTexts();
    cargarContactInfo();
    
    // Actualizar vistas después de cargar
    setTimeout(() => {
        updateAboutSection();
        updateAtencionSection();
        updateContactSection();
    }, 500);
}

// ============================================
// FUNCIÓN PARA ACTUALIZAR TODAS LAS SECCIONES
// ============================================

export function actualizarTodasLasSecciones() {
    console.log('🔄 Actualizando todas las secciones...');
    updateAboutSection();
    updateAtencionSection();
    updateContactSection();
    if (typeof filterProfessionals === 'function') {
        filterProfessionals();
    }
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

export function forzarCargaDatos() {
    console.log('🔄 Forzando carga de datos...');
    if (!window.state?.dataLoaded) {
        cargarDatosIniciales();
    }
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================
window.forzarCargaDatos = forzarCargaDatos;
window.forceRenderProfessionals = function() {
    console.log('🔄 Forzando renderizado de profesionales...');
    if (typeof filterProfessionals === 'function') {
        filterProfessionals();
    }
};
window.actualizarTodasLasSecciones = actualizarTodasLasSecciones;

console.log('✅ publico.js cargado con estilo Puntoterapia exacto, funciones de navegación y secciones editables v3.0');