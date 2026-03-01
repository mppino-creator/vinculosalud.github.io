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
        const hasAvailability = p.availability && p.availability[today] && p.availability[today].length > 0;
        const avgRating = getAverageRating(p.id);
        const ratingDisplay = avgRating > 0 ? avgRating.toFixed(1) : p.stars;
        const specialties = Array.isArray(p.spec) ? p.spec.join(' · ') : p.spec;

        const whatsappMessage = encodeURIComponent('Hola buenas tardes, necesito una hora para atención psicológica. ¿Podría ayudarme?');
        const whatsappUrl = p.whatsapp ? `https://wa.me/${p.whatsapp.replace(/\+/g, '')}?text=${whatsappMessage}` : '#';
        const instagramUrl = p.instagram ? `https://instagram.com/${p.instagram.replace('@', '')}` : '#';

        return `
            <div class="therapist-card">
                <div class="img-container">
                    <div class="availability-badge ${hasAvailability ? 'online' : 'offline'}">
                        <div class="pulse"></div> 
                        ${hasAvailability ? 'DISPONIBLE HOY' : 'VER HORARIOS'}
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
                    <span class="tag">${specialties}</span>
                    <h3>${p.name}</h3>
                    <div class="stars">
                        ${'★'.repeat(Math.floor(ratingDisplay))}${'☆'.repeat(5-Math.floor(ratingDisplay))}
                        <span style="color:var(--text-light); margin-left:5px;">(${state.messages.filter(m => m.therapistId == p.id).length})</span>
                    </div>
                    <div class="price-box">
                        <button class="btn-book" onclick="event.stopPropagation(); openBooking(${p.id})">
                            Agendar
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

        // Agregar administrador con isAdmin = true
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
            address: '',
            phone: '',
            bankDetails: {},
            isHiddenAdmin: true,
            isAdmin: true, // ← CAMPO CRUCIAL AGREGADO
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
            import('./auth.js').then(mod => mod.updateStats());
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

// js/modules/publico.js - AÑADE ESTO AL FINAL

// Forzar carga de datos iniciales si no se hizo
export function forzarCargaDatos() {
    console.log('🔄 Forzando carga de datos...');
    if (!window.state?.dataLoaded) {
        cargarDatosIniciales();
    }
}

// Exponer función global
window.forzarCargaDatos = forzarCargaDatos;