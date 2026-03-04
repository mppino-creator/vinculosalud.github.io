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
// FUNCIONES DE NAVEGACIÓN DEL MENÚ - CORREGIDAS CON DOBLE EXPORTACIÓN
// ============================================

// Versión exportable para usar en otros módulos
export function showSection(sectionId) {
    console.log('🔄 Mostrando sección:', sectionId);
    
    // Definir las secciones principales que pueden ocultarse/mostrarse (se eliminó 'blog')
    const sections = {
        'inicio': document.getElementById('inicio'),
        'about': document.getElementById('about'),
        'equipo': document.getElementById('equipo'),
        'atencion': document.getElementById('atencion'),
        'contacto': document.getElementById('contacto')
    };
    
    // Ocultar TODAS las secciones principales
    Object.values(sections).forEach(section => {
        if (section) section.style.display = 'none';
    });
    
    // Mostrar la sección seleccionada
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
    
    // 👉 REGLA DE ORO: El GRID DE PROFESIONALES SIEMPRE debe ser visible
    const grid = document.getElementById('equipo');
    const messages = document.getElementById('messagesGrid');
    const filtros = document.querySelector('.filters');
    
    // El grid de profesionales SIEMPRE visible
    if (grid) {
        grid.style.display = 'grid';
    }
    
    // Los mensajes SIEMPRE visibles
    if (messages) {
        messages.style.display = 'grid';
    }
    
    // Los filtros solo se muestran en la sección equipo
    if (filtros) {
        filtros.style.display = sectionId === 'equipo' ? 'flex' : 'none';
    }
    
    // Actualizar clase activa en el menú
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

// Versión exportable para usar en otros módulos
export function abrirAgenda() {
    console.log('📅 Abriendo agenda con profesionales y filtros...');
    
    // Mostrar la sección equipo
    showSection('equipo');
    
    // Asegurar que los filtros estén visibles
    const filtros = document.querySelector('.filters');
    if (filtros) {
        filtros.style.display = 'flex';
    }
    
    // Asegurar que el grid de profesionales esté visible
    const grid = document.getElementById('equipo');
    if (grid) {
        grid.style.display = 'grid';
    }
    
    // Mensaje amigable para el usuario
    showToast('Selecciona un profesional para ver su disponibilidad y agendar tu hora', 'info', 3000);
}

// Versión exportable para usar en otros módulos
export function enviarContacto() {
    const nombre = document.getElementById('contactName')?.value;
    const email = document.getElementById('contactEmail')?.value;
    const mensaje = document.getElementById('contactMessage')?.value;
    
    if (!nombre || !email || !mensaje) {
        showToast('Completa todos los campos', 'error');
        return;
    }
    
    // Validar email simple
    if (!email.includes('@') || !email.includes('.')) {
        showToast('Ingresa un email válido', 'error');
        return;
    }
    
    // Aquí puedes agregar la lógica para enviar el mensaje
    console.log('📧 Mensaje de contacto:', { nombre, email, mensaje });
    
    showToast('✅ Mensaje enviado, te contactaremos pronto', 'success');
    
    // Limpiar formulario
    document.getElementById('contactName').value = '';
    document.getElementById('contactEmail').value = '';
    document.getElementById('contactMessage').value = '';
}

// ============================================
// FUNCIÓN PARA COMPARTIR PERFIL
// ============================================
export function compartirPerfil(psychId, psychName) {
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

export function copiarAlPortapapeles(texto) {
    navigator.clipboard.writeText(texto).then(() => {
        showToast('✅ Enlace copiado al portapapeles', 'success');
    }).catch(() => {
        showToast('❌ Error al copiar', 'error');
    });
}

// ============================================
// FUNCIÓN PARA MOSTRAR MÁS INFORMACIÓN DEL PROFESIONAL (ESTILO PUNTOTERAPIA MEJORADO)
// ============================================
export function showTherapistInfo(psychId) {
    const psych = state.staff.find(p => p.id == psychId);
    if (!psych) return;
    
    // Crear modal con información detallada estilo Puntoterapia
    const modal = document.createElement('div');
    modal.className = 'modal therapist-info-modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <span class="modal-close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            
            <!-- Cabecera con nombre y título -->
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: var(--verde-azulado-profundo); font-size: 2rem; margin-bottom: 5px;">${psych.name}</h2>
                <p style="color: var(--texto-secundario); font-size: 1.1rem;">${psych.title || 'Psicólogo Clínico'}</p>
            </div>
            
            <!-- Biografía / Descripción breve (si existe) -->
            ${psych.bio ? `
            <div style="margin-bottom: 25px; background: var(--verde-grisaceo-claro); padding: 20px; border-radius: 20px;">
                <p style="color: var(--texto-principal); line-height: 1.6; font-size: 1rem;">${psych.bio}</p>
            </div>
            ` : ''}
            
            <!-- Grid de información detallada -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                
                <!-- Columna izquierda: Formación y Educación -->
                <div>
                    <h4 style="color: var(--verde-azulado-profundo); margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa fa-graduation-cap"></i> Formación
                    </h4>
                    ${psych.education ? `
                        <p style="color: var(--texto-secundario); margin-bottom: 10px; line-height: 1.5; white-space: pre-line;">${psych.education}</p>
                    ` : '<p style="color: var(--texto-secundario);">No especificada</p>'}
                    
                    <h4 style="color: var(--verde-azulado-profundo); margin: 20px 0 15px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa fa-clock"></i> Experiencia
                    </h4>
                    <p style="color: var(--texto-secundario);">${psych.experience || '0'} años de experiencia clínica</p>
                </div>
                
                <!-- Columna derecha: Especialidades y áreas de trabajo -->
                <div>
                    <h4 style="color: var(--verde-azulado-profundo); margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa fa-stethoscope"></i> Especialidades
                    </h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
                        ${Array.isArray(psych.spec) ? psych.spec.map(s => `<span class="specialty-tag" style="background: var(--verde-azulado-claro); color: white;">${s}</span>`).join('') : `<span class="specialty-tag" style="background: var(--verde-azulado-claro); color: white;">${psych.spec || 'Especialista'}</span>`}
                    </div>
                    
                    <h4 style="color: var(--verde-azulado-profundo); margin: 20px 0 15px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa fa-language"></i> Idiomas
                    </h4>
                    <p style="color: var(--texto-secundario);">${psych.languages ? (Array.isArray(psych.languages) ? psych.languages.join(', ') : psych.languages) : 'Español'}</p>
                </div>
            </div>
            
            <!-- Experiencia clínica detallada (si existe) -->
            ${psych.clinicalExperience ? `
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid var(--gris-claro);">
                <h4 style="color: var(--verde-azulado-profundo); margin-bottom: 15px;">Experiencia Clínica</h4>
                <p style="color: var(--texto-secundario); line-height: 1.6; white-space: pre-line;">${psych.clinicalExperience}</p>
            </div>
            ` : ''}
            
            <!-- Botón para agendar -->
            <div style="margin-top: 30px; text-align: center;">
                <button onclick="this.closest('.modal').remove(); window.openBooking('${psych.id}')" class="btn-staff" style="background: var(--verde-azulado-profundo); padding: 14px 40px; font-size: 1.1rem;">
                    <i class="fa fa-calendar-check"></i> AGENDA TU HORA
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

export function filterProfessionals() {
    console.log('🔄 filterProfessionals ejecutándose...');
    console.log('📊 Total staff en state antes de filtrar:', state.staff.length);
    
    const searchTerm = document.getElementById('searchFilter')?.value.toLowerCase() || '';
    const specialtyTerm = document.getElementById('specialtyFilter')?.value || '';
    const availabilityFilter = document.getElementById('availabilityFilter')?.value || '';

    let filtered = getPublicStaff().filter(p => {
        const specs = Array.isArray(p.spec) ? p.spec.join(' ') : p.spec;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm) || 
                             (specs && specs.toLowerCase().includes(searchTerm));

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
        console.log('📭 No hay profesionales para mostrar');
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
        // 🎨 TARJETA ESTILO PUNTOTERAPIA - EXACTA CON CLASES CSS
        // ============================================
        return `
            <div class="therapist-card" data-id="${p.id}">
                <!-- Imagen del profesional -->
                <div class="img-container">
                    <img src="${p.img || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500'}" alt="${p.name}" loading="lazy">
                </div>
                
                <!-- Contenido de la tarjeta -->
                <div class="card-body">
                    <!-- Nombre en MAYÚSCULAS -->
                    <h3>${p.name}</h3>
                    
                    <!-- Título profesional -->
                    <p>${p.title || 'Psicólogo Clínico de Adultos y Adolescentes, Terapeuta Familiar y de Parejas.'}</p>
                    
                    <!-- Botones en fila con clases específicas -->
                    <div class="price-box">
                        <button class="btn-mas-info" onclick="event.stopPropagation(); showTherapistInfo('${p.id}')">
                            Más Información
                        </button>
                        <button class="btn-agendar" onclick="event.stopPropagation(); openBooking('${p.id}')">
                            AGENDA TU HORA
                        </button>
                    </div>
                    
                    <!-- Dirección -->
                    <div class="direccion">
                        <i class="fa fa-map-marker-alt"></i>
                        <span>${p.address || 'Dirección no especificada'}</span>
                    </div>
                    
                    <!-- Disponibilidad -->
                    <div class="disponibilidad ${horasLibres > 0 ? 'disponible' : 'no-disponible'}">
                        <i class="fa ${horasLibres > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        <span>${horasLibres > 0 ? `${horasLibres} horario(s) disponible(s) hoy` : 'Sin disponibilidad hoy'}</span>
                    </div>
                    
                    <!-- WhatsApp si existe -->
                    ${p.whatsapp ? `
                        <div class="whatsapp-link">
                            <a href="https://wa.me/${p.whatsapp.replace(/\+/g, '')}?text=${encodeURIComponent('Hola, necesito información sobre tus atenciones.')}" target="_blank">
                                <i class="fab fa-whatsapp"></i> Contactar por WhatsApp
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    console.log(`✅ Renderizados ${professionals.length} profesionales en #equipo`);
}

function getAverageRating(psychId) {
    const psychMessages = state.messages.filter(m => m.therapistId == psychId);
    if (psychMessages.length === 0) return 0;
    return psychMessages.reduce((sum, m) => sum + m.rating, 0) / psychMessages.length;
}

export function cargarDatosIniciales() {
    console.log('🚀 Cargando datos iniciales...');
    
    const grid = document.getElementById('equipo');
    if (grid) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;"><i class="fa fa-spinner fa-spin fa-3x" style="color:var(--primario);"></i><p>Cargando profesionales...</p></div>';
    }

    // Ocultar filtros inicialmente (solo se muestran en equipo)
    const filtros = document.querySelector('.filters');
    if (filtros) {
        filtros.style.display = 'none';
    }

    // 🚨 CARGA DE PROFESIONALES CON LOGS DETALLADOS
    console.log('🔍 Intentando cargar profesionales desde Firebase (ruta: Staff)...');
    db.ref('Staff').once('value', (snapshot) => {
        const data = snapshot.val();
        console.log('📦 Datos recibidos de Firebase (Staff):', data ? '✅ existen datos' : '❌ vacío o null');
        
        if (data) {
            const staffArray = Object.keys(data).map(key => {
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
                        clinicalExperience: item.clinicalExperience || '', // Campo adicional opcional
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
                        clinicalExperience: item.clinicalExperience || '',
                        bankDetails: item.bankDetails || { bank: '', accountType: 'corriente', accountNumber: '', rut: '', email: '' },
                        paymentMethods: item.paymentMethods || state.globalPaymentMethods,
                        sessionDuration: item.sessionDuration || 45,
                        breakBetween: item.breakBetween || 10,
                        availability: item.availability || {},
                        paymentLinks: item.paymentLinks || { online: '', presencial: '', qrCode: '' }
                    };
                }
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
// 🚨 EXPORTACIÓN EXPLÍCITA AL OBJETO WINDOW
// ============================================

if (typeof window !== 'undefined') {
    console.log('🔧 Asignando funciones de publico.js a window...');
    
    window.showSection = showSection;
    window.abrirAgenda = abrirAgenda;
    window.enviarContacto = enviarContacto;
    window.compartirPerfil = compartirPerfil;
    window.copiarAlPortapapeles = copiarAlPortapapeles;
    window.showTherapistInfo = showTherapistInfo;
    window.filterProfessionals = filterProfessionals;
    window.forzarCargaDatos = forzarCargaDatos;
    window.forceRenderProfessionals = function() {
        console.log('🔄 Forzando renderizado de profesionales...');
        if (typeof filterProfessionals === 'function') {
            filterProfessionals();
        }
    };
    window.actualizarTodasLasSecciones = actualizarTodasLasSecciones;
    
    console.log('✅ Funciones de publico.js asignadas correctamente a window:', {
        showSection: typeof window.showSection,
        abrirAgenda: typeof window.abrirAgenda,
        enviarContacto: typeof window.enviarContacto,
        compartirPerfil: typeof window.compartirPerfil,
        showTherapistInfo: typeof window.showTherapistInfo
    });
}

console.log('✅ publico.js cargado con navegación corregida y estilo Puntoterapia exacto v3.0');