// js/modules/publico.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast, getPublicStaff } from './utils.js';
import { renderMessages, updateMarquee } from './mensajes.js';
import { cargarEspecialidades, cargarMetodosPago, cargarFondo, cargarTextos, cargarLogo } from './personalizacion.js';
import { renderStaffTable } from './profesionales.js';
import { renderBoxesTable, renderBoxOccupancy } from './boxes.js';
import { renderPatients } from './pacientes.js';
import { renderPendingRequests } from './citas.js';

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
            <h3 style="margin-bottom:20px;">Compartir perfil</h3>
            <div style="display:flex; gap:15px; justify-content:center; margin-bottom:20px;">
                <a href="${mensajeWhatsApp}" target="_blank" style="background:#25D366; color:white; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px; text-decoration:none;">
                    <i class="fab fa-whatsapp"></i>
                </a>
                <a href="${mensajeEmail}" style="background:#0071e3; color:white; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; text-decoration:none;">
                    <i class="fa fa-envelope"></i>
                </a>
                <button onclick="copiarAlPortapapeles('${url}')" style="background:#34c759; color:white; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; border:none; cursor:pointer;">
                    <i class="fa fa-link"></i>
                </button>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="background:#ff3b30; color:white; padding:10px 20px; border:none; border-radius:30px; cursor:pointer;">
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

export function filterProfessionals() {
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
        
        // ============================================
        // 🔥 MEJORA 1: Calcular disponibilidad REAL
        // ============================================
        const citasHoy = window.state?.appointments?.filter(a => 
            a.psychId == p.id && 
            a.date === today && 
            (a.status === 'confirmada' || a.status === 'pendiente')
        ) || [];
        
        const slotsHoy = p.availability && p.availability[today] ? p.availability[today] : [];
        const horasLibres = slotsHoy.length - citasHoy.length;
        const disponibilidadTexto = horasLibres > 0 ? `${horasLibres} horarios` : 'Sin cupos';
        const disponibilidadClase = horasLibres > 0 ? 'online' : 'offline';
        const disponibilidadBadge = horasLibres > 0 ? 'DISPONIBLE' : 'COMPLETO';
        
        // ============================================
        // 🔥 MEJORA 2: Especialidades limitadas a 3
        // ============================================
        const specialtiesList = Array.isArray(p.spec) ? p.spec : [p.spec];
        const specsMostrar = specialtiesList.slice(0, 3);
        const specsRestantes = specialtiesList.length - 3;
        const specialties = specsMostrar.join(' · ') + (specsRestantes > 0 ? ` +${specsRestantes}` : '');
        
        // ============================================
        // 🔥 MEJORA 3: Estrellas con número de reseñas
        // ============================================
        const avgRating = getAverageRating(p.id);
        const ratingDisplay = avgRating > 0 ? avgRating : 5;
        const starCount = Math.floor(ratingDisplay);
        const totalReseñas = state.messages.filter(m => m.therapistId == p.id).length;
        
        const whatsappMessage = encodeURIComponent('Hola buenas tardes, necesito una hora para atención psicológica. ¿Podría ayudarme?');
        const whatsappUrl = p.whatsapp ? `https://wa.me/${p.whatsapp.replace(/\+/g, '')}?text=${whatsappMessage}` : '#';
        const instagramUrl = p.instagram ? `https://instagram.com/${p.instagram.replace('@', '')}` : '#';

        return `
            <div class="therapist-card">
                <div class="img-container">
                    <!-- MEJORA: Badge de disponibilidad real -->
                    <div class="availability-badge ${disponibilidadClase}">
                        <div class="pulse"></div> 
                        ${horasLibres > 0 ? `${horasLibres} disponibles` : 'Sin cupos'}
                    </div>
                    
                    ${p.whatsapp ? `
                        <a href="${whatsappUrl}" target="_blank" class="whatsapp-badge" onclick="event.stopPropagation()" title="Contactar por WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </a>
                    ` : ''}
                    
                    ${p.instagram ? `
                        <a href="${instagramUrl}" target="_blank" class="instagram-badge" onclick="event.stopPropagation()" title="Ver Instagram">
                            <i class="fab fa-instagram"></i>
                        </a>
                    ` : ''}
                    
                    <img src="${p.img}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500'">
                </div>
                
                <div class="card-body" onclick="openBooking(${p.id})">
                    <!-- MEJORA: Especialidades limitadas -->
                    <span class="tag">${specialties}</span>
                    
                    <h3>${p.name}</h3>
                    
                    ${p.genero ? `<small style="display:block; color:var(--text-light); font-size:0.8rem; margin-top:-5px;">${p.genero === 'M' ? 'Psicólogo' : p.genero === 'F' ? 'Psicóloga' : ''}</small>` : ''}
                    
                    <!-- MEJORA: Estrellas con número de reseñas -->
                    <div class="stars" style="display:flex; align-items:center; justify-content:space-between; margin:10px 0;">
                        <div>
                            ${'★'.repeat(starCount)}${'☆'.repeat(5-starCount)}
                        </div>
                        <div style="background:var(--azul-apple); color:white; padding:4px 12px; border-radius:20px; font-size:0.8rem; font-weight:600; display:flex; align-items:center; gap:4px;">
                            <i class="fa fa-comment" style="font-size:0.7rem;"></i>
                            ${totalReseñas}
                        </div>
                    </div>
                    
                    <!-- MEJORA: Solo disponibilidad (el precio va dentro del botón) -->
<div style="display:flex; justify-content:center; align-items:center; margin:10px 0;">
    <span style="color:${horasLibres > 0 ? 'var(--verde-exito)' : 'var(--rojo-alerta)'}; font-size:0.9rem; font-weight:500;">
        <i class="fa ${horasLibres > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i> 
        ${horasLibres > 0 ? `${horasLibres} horario(s) disponible(s)` : 'Sin cupos disponibles'}
    </span>
</div>
                    
                    <div class="price-box">
                        <!-- MEJORA: Botón Agendar (corregido) -->
                        <button class="btn-book" onclick="event.stopPropagation(); openBooking(${p.id})" 
                                style="width: 100%; padding: 14px; font-size: 1.1rem; font-weight: 600; background: var(--azul-apple); border: none; border-radius: 30px; color: white; cursor: pointer; transition: all 0.3s; margin-top: 10px;">
                            <i class="fa fa-calendar-check"></i> Agendar hora
                        </button>
                        
                        <!-- MEJORA: Botón Compartir Perfil -->
                        <button class="btn-share" onclick="event.stopPropagation(); compartirPerfil('${p.id}', '${p.name}')" 
                                style="width:100%; margin-top:8px; padding:8px; background:transparent; border:2px solid var(--azul-apple); border-radius:30px; color:var(--azul-apple); font-size:0.9rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                            <i class="fa fa-share-alt"></i> Compartir
                        </button>
                    </div>
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
    const grid = document.getElementById('publicGrid');
    if (grid) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;"><i class="fa fa-spinner fa-spin fa-3x"></i><p>Cargando profesionales...</p></div>';
    }

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

    db.ref('Patients').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            state.setPatients(Object.keys(data).map(key => ({ id: key, ...data[key] })));
        } else {
            state.setPatients([]);
        }
        if (state.currentUser) renderPatients();
    });

    db.ref('Appointments').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            state.setAppointments(Object.keys(data).map(key => ({ id: key, ...data[key] })));
        } else {
            state.setAppointments([]);
        }
        if (state.currentUser) {
            if (typeof window.updateStats === 'function') {
                window.updateStats();
            } else {
                console.log('⏳ updateStats no disponible, se cargará después');
                import('./auth.js').then(mod => {
                    if (typeof mod.updateStats === 'function') {
                        window.updateStats = mod.updateStats;
                        window.updateStats();
                    }
                }).catch(err => console.warn('Error cargando updateStats:', err));
            }
            renderPendingRequests();
        }
        if (state.currentUser?.role === 'psych') renderBoxOccupancy();
    });

    db.ref('PendingRequests').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            state.setPendingRequests(Object.keys(data).map(key => ({ id: key, ...data[key] })));
        } else {
            state.setPendingRequests([]);
        }
        if (state.currentUser) renderPendingRequests();
    });

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

    cargarEspecialidades();
    cargarMetodosPago();
    cargarFondo();
    cargarTextos();
    cargarLogo();
}

export function forzarCargaDatos() {
    console.log('🔄 Forzando carga de datos...');
    if (!window.state?.dataLoaded) {
        cargarDatosIniciales();
    }
}

window.forzarCargaDatos = forzarCargaDatos;
console.log('✅ publico.js cargado con mejoras');