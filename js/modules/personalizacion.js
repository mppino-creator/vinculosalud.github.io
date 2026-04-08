// js/modules/personalizacion.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast } from './utils.js';

// ============================================
// VARIABLES PARA TEXTOS EDITABLES
// ============================================
export let missionText = 'Acompañar a las personas en su proceso de sanación emocional, proporcionando herramientas para el crecimiento personal y la mejora de la calidad de vida.';
export let visionText = 'Ser un referente en salud mental en la región, reconocido por nuestra calidad profesional, calidez humana y compromiso con la comunidad.';
export let aboutTeamText = 'Nuestro equipo está formado por profesionales de la salud mental con amplia formación y experiencia en terapia individual, familiar y de pareja. Todos compartimos una mirada humana, ética y especializada.';
export let aboutImage = '';

export let atencionTexts = {
    adultos: {
        title: 'Atención Adultos',
        description: 'Espacio terapéutico para adultos enfocado en ansiedad, depresión, estrés y desarrollo personal. Modalidad online y presencial.',
        icon: 'user',
        price: 'Desde $25.000',
        active: true
    },
    infantil: {
        title: 'Atención Infantil',
        description: 'Acompañamiento emocional y conductual para niños, incluyendo orientación a padres. Modalidad online y presencial.',
        icon: 'child',
        price: 'Desde $25.000',
        active: true
    },
    adolescente: {
        title: 'Atención Adolescente',
        description: 'Apoyo psicológico en etapa adolescente: emociones, identidad, relaciones sociales y dificultades escolares. Modalidad online y presencial.',
        icon: 'user-graduate',
        price: 'Desde $25.000',
        active: true
    },
    pareja: {
        title: 'Terapia de Pareja',
        description: 'Intervención enfocada en mejorar la comunicación, resolver conflictos y fortalecer la relación. Modalidad online y presencial.',
        icon: 'heart',
        price: 'Desde $35.000',
        active: true
    },
    familiar: {
        title: 'Terapia Familiar',
        description: 'Espacio terapéutico para mejorar la dinámica familiar y resolver conflictos. Modalidad online y presencial.',
        icon: 'users',
        price: 'Desde $40.000',
        active: true
    },
    evaluacion: {
        title: 'Evaluación Psicológica',
        description: 'Proceso de evaluación mediante entrevistas y test psicológicos para diagnóstico y orientación profesional.',
        icon: 'clipboard-check',
        price: 'Desde $60.000',
        active: true
    },
    informes: {
        title: 'Informes Psicológicos',
        description: 'Elaboración de informes y certificados psicológicos para fines clínicos, escolares o laborales.',
        icon: 'file-alt',
        price: 'Desde $35.000',
        active: true
    },
    primera_consulta: {
        title: 'Primera Consulta',
        description: 'Sesión inicial para evaluar el motivo de consulta y definir objetivos terapéuticos.',
        icon: 'star',
        price: '$20.000 - $25.000',
        active: true
    },
    empresas: {
        title: 'Servicios para Empresas',
        description: 'Charlas, talleres y programas de bienestar laboral, manejo del estrés y clima organizacional para equipos de trabajo.',
        icon: 'briefcase',
        price: 'Desde $120.000',
        active: true
    }
};

export let contactInfo = {
    email: 'vinculosalud@hotmail.com',
    phone: '+56',
    address: 'Ohiggins 263, Concepción'
};

// DATOS DE INSTAGRAM - MODIFICADO PARA EMBED
export let instagramData = {
    title: 'Sigue Nuestro Instagram',
    subtitle: '@vinculo.salud',
    link: 'https://instagram.com/vinculo.salud',
    embed_code: ''  // Aquí se guardará el código HTML de inserción
};

// ============================================
// FUNCIONES DE LOGO
// ============================================
export function cargarLogo() {
    db.ref('logoImage').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            state.setLogoImage(data);
            const headerLogo = document.getElementById('headerLogo');
            const headerLogoText = document.getElementById('headerLogoText');
            if (state.logoImage.url) {
                if (headerLogo) {
                    headerLogo.src = state.logoImage.url;
                    headerLogo.style.display = 'inline-block';
                }
            } else {
                if (headerLogo) headerLogo.style.display = 'none';
            }
            if (headerLogoText) {
                headerLogoText.style.display = 'inline-block';
                headerLogoText.innerText = state.logoImage.text || 'Vínculo Salud';
            }
        } else {
            const headerLogo = document.getElementById('headerLogo');
            const headerLogoText = document.getElementById('headerLogoText');
            if (headerLogo) headerLogo.style.display = 'none';
            if (headerLogoText) {
                headerLogoText.style.display = 'inline-block';
                headerLogoText.innerText = 'Vínculo Salud';
            }
        }
    });
}

export function showLogoModal() {
    const modal = document.getElementById('logoModal');
    if (!modal) return;
    modal.style.display = 'flex';
    const logoText = document.getElementById('logoText');
    if (logoText) logoText.value = state.logoImage.text || 'Vínculo Salud';
    const logoPreview = document.getElementById('logoPreview');
    if (state.logoImage.url && logoPreview) {
        logoPreview.src = state.logoImage.url;
        logoPreview.style.display = 'block';
    }
}

export function closeLogoModal() {
    const modal = document.getElementById('logoModal');
    if (modal) modal.style.display = 'none';
    state.setTempLogoData(null);
}

export function previewLogo(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const logoPreview = document.getElementById('logoPreview');
            if (logoPreview) {
                logoPreview.src = e.target.result;
                logoPreview.style.display = 'block';
            }
            state.setTempLogoData(e.target.result);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

export function saveLogo() {
    const logoText = document.getElementById('logoText');
    const newLogo = { ...state.logoImage, text: logoText?.value || 'Vínculo Salud' };
    if (state.tempLogoData) {
        newLogo.url = state.tempLogoData;
    }
    state.setLogoImage(newLogo);
    db.ref('logoImage').set(state.logoImage);

    const headerLogo = document.getElementById('headerLogo');
    const headerLogoText = document.getElementById('headerLogoText');
    if (state.logoImage.url) {
        if (headerLogo) {
            headerLogo.src = state.logoImage.url;
            headerLogo.style.display = 'inline-block';
        }
    } else {
        if (headerLogo) headerLogo.style.display = 'none';
    }
    if (headerLogoText) {
        headerLogoText.style.display = 'inline-block';
        headerLogoText.innerText = state.logoImage.text;
    }

    closeLogoModal();
    showToast('Logo guardado correctamente', 'success');
}

export function removeLogo() {
    if (confirm('¿Eliminar el logo?')) {
        const logoText = document.getElementById('logoText');
        state.setLogoImage({ url: '', text: logoText?.value || 'Vínculo Salud' });
        db.ref('logoImage').set(state.logoImage);
        const headerLogo = document.getElementById('headerLogo');
        const headerLogoText = document.getElementById('headerLogoText');
        if (headerLogo) headerLogo.style.display = 'none';
        if (headerLogoText) {
            headerLogoText.style.display = 'inline-block';
            headerLogoText.innerText = state.logoImage.text;
        }
        closeLogoModal();
        showToast('Logo eliminado', 'success');
    }
}

// ============================================
// FUNCIONES DE TEXTOS (Hero)
// ============================================
export function cargarTextos() {
    db.ref('heroTexts').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            state.setHeroTexts({
                ...state.heroTexts,
                title: data.title || state.heroTexts.title,
                subtitle: data.subtitle || state.heroTexts.subtitle,
                slides: data.slides || state.heroTexts.slides
            });
            const titleDisplay = document.getElementById('heroTitleDisplay');
            const subtitleDisplay = document.getElementById('heroSubtitleDisplay');
            if (titleDisplay) titleDisplay.innerHTML = state.heroTexts.title.replace(/\n/g, '<br>');
            if (subtitleDisplay) subtitleDisplay.innerText = state.heroTexts.subtitle;
            updateHeroSlider();
        } else {
            if (!state.heroTexts.slides) {
                state.heroTexts.slides = [
                    { image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1600', title: 'Todo cambio comienza en un VÍNCULO', subtitle: '', buttonText: 'Agenda tu hora', buttonLink: '#equipo' },
                    { image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1600', title: 'Punto de referencia en terapia', subtitle: 'profesionalismo, cuidado y confianza', buttonText: 'Conoce nuestros tipos de atención', buttonLink: '#atencion' },
                    { image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1600', title: 'Trabajo colaborativo como base en nuestro quehacer', subtitle: '', buttonText: 'Conócenos más', buttonLink: '#about' }
                ];
                updateHeroSlider();
            }
        }
    });
}

export function showTextsModal() {
    const modal = document.getElementById('textsModal');
    if (!modal) return;
    modal.style.display = 'flex';
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    const slidesInput = document.getElementById('heroSlidesInput');
    if (heroTitle) heroTitle.value = state.heroTexts.title;
    if (heroSubtitle) heroSubtitle.value = state.heroTexts.subtitle;
    if (slidesInput) slidesInput.value = JSON.stringify(state.heroTexts.slides || [], null, 2);
}

export function closeTextsModal() {
    const modal = document.getElementById('textsModal');
    if (modal) modal.style.display = 'none';
}

export function saveHeroTexts() {
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    const slidesInput = document.getElementById('heroSlidesInput');
    let slides = state.heroTexts.slides || [];
    if (slidesInput) {
        try {
            const parsed = JSON.parse(slidesInput.value);
            if (Array.isArray(parsed)) slides = parsed;
            else showToast('El formato JSON es inválido. Se mantienen los slides actuales.', 'warning');
        } catch (e) {
            showToast('Error al parsear JSON. Se mantienen los slides actuales.', 'error');
            console.error(e);
        }
    }
    state.setHeroTexts({
        title: heroTitle?.value || '',
        subtitle: heroSubtitle?.value || '',
        slides: slides
    });
    db.ref('heroTexts').set(state.heroTexts);
    const titleDisplay = document.getElementById('heroTitleDisplay');
    const subtitleDisplay = document.getElementById('heroSubtitleDisplay');
    if (titleDisplay) titleDisplay.innerHTML = state.heroTexts.title.replace(/\n/g, '<br>');
    if (subtitleDisplay) subtitleDisplay.innerText = state.heroTexts.subtitle;
    updateHeroSlider();
    closeTextsModal();
    showToast('Textos y slider actualizados', 'success');
}

export function updateHeroSlider() {
    const sliderContainer = document.querySelector('.hero-slider .slides');
    if (!sliderContainer) return;
    const slides = state.heroTexts.slides || [];
    if (slides.length === 0) return;
    sliderContainer.innerHTML = slides.map((slide, index) => `
        <div class="slide ${index === 0 ? 'active' : ''}" style="background-image: linear-gradient(180deg, rgba(123,132,113,0.89) 1%, rgba(123,132,113,0.31) 100%), url('${slide.image}');">
            <div class="slide-content">
                <h2>${slide.title}</h2>
                ${slide.subtitle ? `<p>${slide.subtitle}</p>` : ''}
                <a href="${slide.buttonLink}" class="btn-slide" onclick="showSection('${slide.buttonLink.replace('#', '')}'); return false;">${slide.buttonText}</a>
            </div>
        </div>
    `).join('');
    if (typeof window.initHeroSlider === 'function') {
        window.initHeroSlider();
    } else {
        setTimeout(() => {
            const slidesEl = document.querySelectorAll('.hero-slider .slide');
            const dotsContainer = document.querySelector('.hero-slider .dots');
            if (!dotsContainer) return;
            dotsContainer.innerHTML = '';
            slidesEl.forEach((_, i) => {
                const dot = document.createElement('span');
                dot.classList.add('dot');
                if (i === 0) dot.classList.add('active');
                dot.addEventListener('click', () => goToSlide(i));
                dotsContainer.appendChild(dot);
            });
            let currentSlide = 0;
            let slideInterval;
            function goToSlide(index) {
                slidesEl.forEach(slide => slide.classList.remove('active'));
                const dots = document.querySelectorAll('.hero-slider .dot');
                if (dots.length) dots.forEach(dot => dot.classList.remove('active'));
                dots[index].classList.add('active');
                slidesEl[index].classList.add('active');
                currentSlide = index;
            }
            function nextSlide() {
                let newIndex = (currentSlide + 1) % slidesEl.length;
                goToSlide(newIndex);
            }
            function startAutoSlide() {
                if (slideInterval) clearInterval(slideInterval);
                slideInterval = setInterval(nextSlide, 5000);
            }
            function stopAutoSlide() {
                clearInterval(slideInterval);
            }
            const heroSlider = document.querySelector('.hero-slider');
            if (heroSlider) {
                heroSlider.removeEventListener('mouseenter', stopAutoSlide);
                heroSlider.removeEventListener('mouseleave', startAutoSlide);
                heroSlider.addEventListener('mouseenter', stopAutoSlide);
                heroSlider.addEventListener('mouseleave', startAutoSlide);
                const prevBtn = heroSlider.querySelector('.prev');
                const nextBtn = heroSlider.querySelector('.next');
                if (prevBtn) {
                    prevBtn.replaceWith(prevBtn.cloneNode(true));
                    const newPrev = heroSlider.querySelector('.prev');
                    newPrev.addEventListener('click', () => {
                        stopAutoSlide();
                        let newIndex = (currentSlide - 1 + slidesEl.length) % slidesEl.length;
                        goToSlide(newIndex);
                        startAutoSlide();
                    });
                }
                if (nextBtn) {
                    nextBtn.replaceWith(nextBtn.cloneNode(true));
                    const newNext = heroSlider.querySelector('.next');
                    newNext.addEventListener('click', () => {
                        stopAutoSlide();
                        nextSlide();
                        startAutoSlide();
                    });
                }
                startAutoSlide();
            }
        }, 50);
    }
}

// ============================================
// FUNCIONES DE FONDO
// ============================================
export function cargarFondo() {
    db.ref('backgroundImage').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            state.setBackgroundImage(data);
            if (state.backgroundImage.url) {
                document.body.style.backgroundImage = `url('${state.backgroundImage.url}')`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
                document.body.style.backgroundAttachment = 'fixed';
                document.body.classList.add('has-background-image');
                updateBackgroundOpacity();
            }
        }
    });
}

export function showBackgroundImageModal() {
    const modal = document.getElementById('backgroundImageModal');
    if (!modal) return;
    modal.style.display = 'flex';
    const opacityInput = document.getElementById('backgroundOpacity');
    const opacityValue = document.getElementById('opacityValue');
    const preview = document.getElementById('backgroundPreview');
    if (opacityInput) opacityInput.value = state.backgroundImage.opacity || 10;
    if (opacityValue) opacityValue.innerText = (state.backgroundImage.opacity || 10) + '%';
    if (state.backgroundImage.url && preview) {
        preview.src = state.backgroundImage.url;
        preview.style.display = 'block';
    }
}

export function closeBackgroundImageModal() {
    const modal = document.getElementById('backgroundImageModal');
    if (modal) modal.style.display = 'none';
    state.setTempBackgroundImageData(null);
}

export function previewBackgroundImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('backgroundPreview');
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
            state.setTempBackgroundImageData(e.target.result);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

export function updateBackgroundOpacity() {
    const opacityInput = document.getElementById('backgroundOpacity');
    const opacityValue = document.getElementById('opacityValue');
    if (!opacityInput || !opacityValue) return;
    const opacity = opacityInput.value;
    opacityValue.innerText = opacity + '%';
    if (state.backgroundImage.url) {
        document.body.style.backgroundImage = `url('${state.backgroundImage.url}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.opacity = opacity / 100;
    }
}

export function saveBackgroundImage() {
    const opacityInput = document.getElementById('backgroundOpacity');
    if (!opacityInput) return;
    const newBg = { ...state.backgroundImage };
    if (state.tempBackgroundImageData) newBg.url = state.tempBackgroundImageData;
    newBg.opacity = parseInt(opacityInput.value);
    state.setBackgroundImage(newBg);
    db.ref('backgroundImage').set(state.backgroundImage);
    document.body.style.backgroundImage = `url('${state.backgroundImage.url}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.classList.add('has-background-image');
    document.body.style.opacity = state.backgroundImage.opacity / 100;
    closeBackgroundImageModal();
    showToast('Fondo actualizado', 'success');
}

export function removeBackgroundImage() {
    if (confirm('¿Eliminar la imagen de fondo?')) {
        state.setBackgroundImage({ url: '', opacity: 10 });
        db.ref('backgroundImage').set(state.backgroundImage);
        document.body.style.backgroundImage = '';
        document.body.classList.remove('has-background-image');
        document.body.style.opacity = 1;
        closeBackgroundImageModal();
        showToast('Fondo eliminado', 'success');
    }
}

// ============================================
// FUNCIONES DE MÉTODOS DE PAGO
// ============================================
export function cargarMetodosPago() {
    db.ref('paymentMethods').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) state.setGlobalPaymentMethods(data);
        updatePaymentMethodsInfo();
    });
}

export function showPaymentMethodsModal() {
    const modal = document.getElementById('paymentMethodsModal');
    if (!modal) return;
    modal.style.display = 'flex';
    const transfer = document.getElementById('globalTransfer');
    const cardPresencial = document.getElementById('globalCardPresencial');
    const cardOnline = document.getElementById('globalCardOnline');
    const cash = document.getElementById('globalCash');
    const mercadopago = document.getElementById('globalMercadoPago');
    const webpay = document.getElementById('globalWebpay');
    if (transfer) transfer.checked = state.globalPaymentMethods.transfer;
    if (cardPresencial) cardPresencial.checked = state.globalPaymentMethods.cardPresencial;
    if (cardOnline) cardOnline.checked = state.globalPaymentMethods.cardOnline;
    if (cash) cash.checked = state.globalPaymentMethods.cash;
    if (mercadopago) mercadopago.checked = state.globalPaymentMethods.mercadopago;
    if (webpay) webpay.checked = state.globalPaymentMethods.webpay;
}

export function closePaymentMethodsModal() {
    const modal = document.getElementById('paymentMethodsModal');
    if (modal) modal.style.display = 'none';
}

export function saveGlobalPaymentMethods() {
    const transfer = document.getElementById('globalTransfer');
    const cardPresencial = document.getElementById('globalCardPresencial');
    const cardOnline = document.getElementById('globalCardOnline');
    const cash = document.getElementById('globalCash');
    const mercadopago = document.getElementById('globalMercadoPago');
    const webpay = document.getElementById('globalWebpay');
    state.setGlobalPaymentMethods({
        transfer: transfer ? transfer.checked : false,
        cardPresencial: cardPresencial ? cardPresencial.checked : false,
        cardOnline: cardOnline ? cardOnline.checked : false,
        cash: cash ? cash.checked : false,
        mercadopago: mercadopago ? mercadopago.checked : false,
        webpay: webpay ? webpay.checked : false
    });
    db.ref('paymentMethods').set(state.globalPaymentMethods);
    closePaymentMethodsModal();
    showToast('Métodos de pago globales guardados', 'success');
}

export function updatePaymentMethodsInfo() {
    const info = document.getElementById('globalPaymentMethodsInfo');
    if (info) {
        info.innerHTML = `
            <h4>Métodos de Pago Globales</h4>
            <p>✅ Transferencia Bancaria: ${state.globalPaymentMethods.transfer ? 'Activado' : 'Desactivado'}</p>
            <p>✅ Tarjeta Presencial: ${state.globalPaymentMethods.cardPresencial ? 'Activado' : 'Desactivado'}</p>
            <p>✅ Tarjeta Online: ${state.globalPaymentMethods.cardOnline ? 'Activado' : 'Desactivado'}</p>
            <p>✅ Efectivo: ${state.globalPaymentMethods.cash ? 'Activado' : 'Desactivado'}</p>
            <p>✅ Mercado Pago: ${state.globalPaymentMethods.mercadopago ? 'Activado' : 'Desactivado'}</p>
            <p>✅ Webpay: ${state.globalPaymentMethods.webpay ? 'Activado' : 'Desactivado'}</p>
        `;
    }
}

// ============================================
// FUNCIONES DE ESPECIALIDADES (CRUD COMPLETO)
// ============================================
export function cargarEspecialidades() {
    db.ref('specialties').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const specialtiesArray = Object.keys(data).map(key => ({ id: key, name: data[key].name }));
            state.setSpecialties(specialtiesArray);
        } else {
            // Especialidades por defecto
            const defaultSpecialties = [
                { id: '1', name: 'Psicología Clínica' },
                { id: '2', name: 'Psiquiatría' },
                { id: '3', name: 'Terapia de Pareja' },
                { id: '4', name: 'Terapia Familiar' },
                { id: '5', name: 'Mindfulness' },
                { id: '6', name: 'Ansiedad' },
                { id: '7', name: 'Depresión' },
                { id: '8', name: 'Terapia Infantil' },
                { id: '9', name: 'Neuropsicología' },
                { id: '10', name: 'Sexología' }
            ];
            state.setSpecialties(defaultSpecialties);
            // Guardar en Firebase
            const specialtiesObj = {};
            defaultSpecialties.forEach(s => { specialtiesObj[s.id] = { name: s.name }; });
            db.ref('specialties').set(specialtiesObj);
        }
        actualizarSelectoresEspecialidades();
        renderSpecialtiesTable();
    });
}

function actualizarSelectoresEspecialidades() {
    const addSpecSelect = document.getElementById('addSpec');
    const editSpecSelect = document.getElementById('editSpec');
    const specialtyFilter = document.getElementById('specialtyFilter');
    const options = state.specialties.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
    if (addSpecSelect) addSpecSelect.innerHTML = options;
    if (editSpecSelect) editSpecSelect.innerHTML = options;
    if (specialtyFilter) specialtyFilter.innerHTML = '<option value="">🏷️ Todas las especialidades</option>' + options;
    // También actualizar el selector de perfil profesional si existe
    const editMySpec = document.getElementById('editMySpec');
    if (editMySpec) editMySpec.innerHTML = options;
}

export function renderSpecialtiesTable() {
    const container = document.getElementById('specialtiesTableBody');
    if (!container) return;

    const specialties = state.specialties || [];
    if (specialties.length === 0) {
        container.innerHTML = '<tr><td colspan="3" style="text-align:center;">No hay especialidades registradas</td></tr>';
        return;
    }

    container.innerHTML = specialties.map(spec => `
        <tr id="spec-${spec.id}">
            <td><strong>${spec.name}</strong></td>
            <td style="text-align:right;">
                <button onclick="window.editSpecialty('${spec.id}')" class="btn-editar">✏️ Editar</button>
                <button onclick="window.deleteSpecialty('${spec.id}')" class="btn-eliminar">🗑️ Eliminar</button>
            </td>
        </tr>
    `).join('');
}

export function showAddSpecialtyModal() {
    const modal = document.getElementById('addSpecialtyModal');
    if (modal) modal.style.display = 'flex';
    const input = document.getElementById('newSpecialtyName');
    if (input) input.value = '';
}

export function closeAddSpecialtyModal() {
    const modal = document.getElementById('addSpecialtyModal');
    if (modal) modal.style.display = 'none';
}

export async function addSpecialty() {
    const input = document.getElementById('newSpecialtyName');
    const name = input?.value?.trim();
    if (!name) {
        showToast('Ingresa un nombre para la especialidad', 'error');
        return;
    }

    if (state.specialties.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        showToast('La especialidad ya existe', 'error');
        return;
    }

    try {
        const newId = Date.now().toString();
        await db.ref(`specialties/${newId}`).set({ name });
        const newSpecialty = { id: newId, name };
        state.setSpecialties([...state.specialties, newSpecialty]);
        actualizarSelectoresEspecialidades();
        renderSpecialtiesTable();
        closeAddSpecialtyModal();
        showToast(`✅ Especialidad "${name}" agregada`, 'success');
    } catch (error) {
        console.error('Error agregando especialidad:', error);
        showToast('Error al agregar', 'error');
    }
}

export function showEditSpecialtyModal(id) {
    const specialty = state.specialties.find(s => s.id == id);
    if (!specialty) return;

    const modal = document.getElementById('editSpecialtyModal');
    if (!modal) {
        const modalHTML = `
        <div id="editSpecialtyModal" class="modal">
            <div class="modal-content" style="max-width: 400px;">
                <span class="modal-close" onclick="window.closeEditSpecialtyModal()">&times;</span>
                <h3>Editar Especialidad</h3>
                <input type="text" id="editSpecialtyName" placeholder="Nombre" class="filter-input" style="width:100%; margin:15px 0;">
                <button id="saveSpecialtyBtn" class="btn-staff">Guardar cambios</button>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    const input = document.getElementById('editSpecialtyName');
    const saveBtn = document.getElementById('saveSpecialtyBtn');

    if (input) input.value = specialty.name;
    if (saveBtn) {
        saveBtn.onclick = () => updateSpecialty(id);
    }
    modal.style.display = 'flex';
}

export function closeEditSpecialtyModal() {
    const modal = document.getElementById('editSpecialtyModal');
    if (modal) modal.style.display = 'none';
}

export async function updateSpecialty(id) {
    const input = document.getElementById('editSpecialtyName');
    const newName = input?.value?.trim();
    if (!newName) {
        showToast('El nombre no puede estar vacío', 'error');
        return;
    }

    if (state.specialties.some(s => s.id != id && s.name.toLowerCase() === newName.toLowerCase())) {
        showToast('Ya existe otra especialidad con ese nombre', 'error');
        return;
    }

    try {
        await db.ref(`specialties/${id}`).update({ name: newName });
        const updated = state.specialties.map(s => s.id == id ? { ...s, name: newName } : s);
        state.setSpecialties(updated);
        actualizarSelectoresEspecialidades();
        renderSpecialtiesTable();
        closeEditSpecialtyModal();
        showToast('✅ Especialidad actualizada', 'success');
    } catch (error) {
        console.error('Error actualizando especialidad:', error);
        showToast('Error al actualizar', 'error');
    }
}

export async function deleteSpecialty(id) {
    if (!confirm('¿Eliminar esta especialidad? Se eliminará de todos los profesionales que la tengan asignada.')) return;

    try {
        await db.ref(`specialties/${id}`).remove();
        const newList = state.specialties.filter(s => s.id != id);
        state.setSpecialties(newList);
        actualizarSelectoresEspecialidades();
        renderSpecialtiesTable();
        showToast('✅ Especialidad eliminada', 'success');
    } catch (error) {
        console.error('Error eliminando especialidad:', error);
        showToast('Error al eliminar', 'error');
    }
}

// ============================================
// FUNCIONES PARA SECCIÓN INSTAGRAM CON EMBED
// ============================================
export function cargarInstagramData() {
    db.ref('instagramData').once('value', (snapshot) => {
        console.log('🔥 InstagramData carga inicial:', snapshot.val());
        const data = snapshot.val();
        if (data) {
            instagramData.title = data.title || instagramData.title;
            instagramData.subtitle = data.subtitle || instagramData.subtitle;
            instagramData.link = data.link || instagramData.link;
            instagramData.embed_code = data.embed_code || '';
        }
        updateInstagramSection();
    }).then(() => {
        db.ref('instagramData').on('value', (snapshot) => {
            console.log('🔥 InstagramData cambio:', snapshot.val());
            const data = snapshot.val();
            if (data) {
                instagramData.title = data.title || instagramData.title;
                instagramData.subtitle = data.subtitle || instagramData.subtitle;
                instagramData.link = data.link || instagramData.link;
                instagramData.embed_code = data.embed_code || '';
            }
            updateInstagramSection();
        });
    });
}

export function actualizarInstagramData(nuevosDatos) {
    console.log('📝 Actualizando datos locales de Instagram:', nuevosDatos);
    if (nuevosDatos) {
        instagramData.title = nuevosDatos.title || instagramData.title;
        instagramData.subtitle = nuevosDatos.subtitle || instagramData.subtitle;
        instagramData.link = nuevosDatos.link || instagramData.link;
        instagramData.embed_code = nuevosDatos.embed_code || instagramData.embed_code;
    }
}

export function updateInstagramSection() {
    console.log('📸 Actualizando sección Instagram con embed real...');
    
    const titleEl = document.getElementById('instagramTitle');
    const subtitleEl = document.getElementById('instagramSubtitle');
    const linkEl = document.getElementById('instagramLink');
    const feedContainer = document.querySelector('.instagram-feed');
    const contentContainer = document.querySelector('.instagram-content');
    
    if (titleEl) titleEl.innerText = instagramData.title;
    if (subtitleEl) subtitleEl.innerText = instagramData.subtitle;
    
    // Ocultar el contenido de texto que ya no usaremos
    if (contentContainer) {
        contentContainer.style.display = 'none';
    }
    
    // Mostrar el embed de Instagram
    if (feedContainer && instagramData.embed_code) {
        feedContainer.innerHTML = `
            <div style="display: flex; justify-content: center; margin: 20px 0;">
                ${instagramData.embed_code}
            </div>
            <script async src="//www.instagram.com/embed.js"><\/script>
        `;
    } else if (feedContainer) {
        feedContainer.innerHTML = `
            <div style="display: flex; justify-content: center; margin: 20px 0; padding: 40px; background: #f5f5f5; border-radius: 20px; text-align: center;">
                <p style="color: #999;">No hay publicación de Instagram configurada.</p>
                <p style="color: #999; font-size: 0.8rem;">Ve al panel de administrador y pega el código de inserción.</p>
            </div>
        `;
    }
    
    if (linkEl) {
        linkEl.href = instagramData.link || 'https://instagram.com/vinculo.salud';
        linkEl.style.display = 'inline-flex';
    }
    
    console.log('✅ Sección Instagram actualizada con embed real');
}

export function showInstagramModal() {
    if (!document.getElementById('instagramModal')) {
        const modalHTML = `
        <div id="instagramModal" class="modal">
            <div class="modal-content" style="max-width: 700px;">
                <span class="modal-close" onclick="document.getElementById('instagramModal').style.display='none'">&times;</span>
                <h2 style="margin-bottom: 25px;">📸 Configurar Instagram</h2>
                
                <div class="form-group">
                    <label>🔗 URL del perfil de Instagram</label>
                    <input type="url" id="instagramLinkInput" class="filter-input" placeholder="https://www.instagram.com/vinculo.salud/">
                    <small>Enlace a tu perfil (para el botón "Ver en Instagram")</small>
                </div>
                
                <div class="form-group">
                    <label>📷 Código de inserción (Embed) de Instagram</label>
                    <textarea id="instagramEmbedInput" rows="12" class="filter-input" placeholder='Pega aquí el código completo que te da Instagram al hacer clic en "Insertar"...'></textarea>
                    <small>Copia el código desde Instagram: ve a tu publicación → ⋮ → Insertar → Copiar código</small>
                </div>
                
                <div style="background:#f0f7f0; padding:15px; border-radius:12px; margin:15px 0;">
                    <p style="margin:0 0 10px 0;"><strong>💡 ¿Cómo obtener el código?</strong></p>
                    <ol style="margin:0; padding-left:20px;">
                        <li>Ve a <strong>instagram.com</strong> desde tu computador</li>
                        <li>Abre la publicación que quieres mostrar</li>
                        <li>Haz clic en los <strong>3 puntos (⋯)</strong></li>
                        <li>Selecciona <strong>"Insertar"</strong></li>
                        <li>Copia TODO el código y pégalo arriba</li>
                    </ol>
                </div>
                
                <div style="display:flex; gap:15px; margin-top:20px;">
                    <button class="btn-staff" style="background:var(--verde-exito); flex:1;" onclick="window.personalizacion.guardarInstagramEmbed()">Guardar</button>
                    <button class="btn-staff" style="background:var(--gris-oscuro); flex:0.5;" onclick="document.getElementById('instagramModal').style.display='none'">Cancelar</button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    const linkInput = document.getElementById('instagramLinkInput');
    const embedInput = document.getElementById('instagramEmbedInput');
    
    if (linkInput) linkInput.value = instagramData.link || 'https://instagram.com/vinculo.salud';
    if (embedInput) embedInput.value = instagramData.embed_code || '';
    
    const modal = document.getElementById('instagramModal');
    if (modal) modal.style.display = 'flex';
}

export function guardarInstagramEmbed() {
    const linkInput = document.getElementById('instagramLinkInput');
    const embedInput = document.getElementById('instagramEmbedInput');
    
    if (linkInput) instagramData.link = linkInput.value;
    if (embedInput) instagramData.embed_code = embedInput.value;
    
    console.log('💾 Guardando embed de Instagram:', { link: instagramData.link, hasEmbed: !!instagramData.embed_code });
    
    db.ref('instagramData').set({
        title: instagramData.title,
        subtitle: instagramData.subtitle,
        link: instagramData.link,
        embed_code: instagramData.embed_code
    })
    .then(() => {
        console.log('✅ Embed guardado en Firebase');
        updateInstagramSection();
        showToast('Instagram actualizado correctamente', 'success');
    })
    .catch((error) => {
        console.error('❌ Error guardando:', error);
        showToast('Error al guardar', 'error');
    });
    
    const modal = document.getElementById('instagramModal');
    if (modal) modal.style.display = 'none';
}

// Función antigua de subir imagen (ya no se usa, pero la mantengo por compatibilidad)
export function uploadInstagramImage() {
    showToast('Esta función ha sido reemplazada. Usa el código de inserción de Instagram.', 'info');
}

export function saveInstagramData() {
    // Redirigir a la nueva función
    guardarInstagramEmbed();
}

// ============================================
// FUNCIONES PARA SECCIÓN QUIÉNES SOMOS
// ============================================
export function cargarAboutTexts() {
    db.ref('aboutTexts').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            missionText = data.mission || missionText;
            visionText = data.vision || visionText;
            aboutTeamText = data.teamText || aboutTeamText;
            aboutImage = data.image || aboutImage;
            updateAboutSection();
        }
    });
}

export function updateAboutSection() {
    const missionEl = document.getElementById('missionDisplay');
    const visionEl = document.getElementById('visionDisplay');
    const teamTextEl = document.getElementById('teamTextDisplay');
    const aboutImg = document.getElementById('aboutTeamImage');
    const placeholder = document.getElementById('aboutImagePlaceholder');
    if (missionEl) missionEl.innerText = missionText;
    if (visionEl) visionEl.innerText = visionText;
    if (teamTextEl) teamTextEl.innerText = aboutTeamText;
    if (aboutImg && aboutImage) {
        aboutImg.src = aboutImage;
        aboutImg.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
    } else if (aboutImg && placeholder) {
        aboutImg.style.display = 'none';
        placeholder.style.display = 'flex';
    }
}

export function showAboutModal() {
    if (!document.getElementById('aboutModal')) {
        const modalHTML = `
        <div id="aboutModal" class="modal">
            <div class="modal-content" style="max-width: 600px;">
                <span class="modal-close" onclick="document.getElementById('aboutModal').style.display='none'">&times;</span>
                <h2 style="margin-bottom: 25px;">📝 Editar Sección Quiénes Somos</h2>
                <div class="form-group"><label>Imagen del equipo</label><div class="file-upload" onclick="document.getElementById('aboutImageInput').click()"><i class="fa fa-cloud-upload-alt"></i> Seleccionar foto grupal</div><input type="file" id="aboutImageInput" accept="image/*" style="display:none;" onchange="uploadAboutImage()"><img id="aboutImagePreview" src="" style="max-width:100%; max-height:200px; margin-top:15px; border-radius:12px; display:none;"></div>
                <div class="form-group"><label>Texto del equipo</label><textarea id="teamText" rows="4" class="filter-input" placeholder="Describe al equipo..."></textarea></div>
                <div class="form-group"><label>Misión</label><textarea id="missionText" rows="3" class="filter-input" placeholder="Nuestra misión..."></textarea></div>
                <div class="form-group"><label>Visión</label><textarea id="visionText" rows="3" class="filter-input" placeholder="Nuestra visión..."></textarea></div>
                <div style="display:flex; gap:15px;"><button class="btn-staff" style="background:var(--verde-exito); flex:1;" onclick="saveAboutTexts()">Guardar</button><button class="btn-staff" style="background:var(--gris-oscuro); flex:0.5;" onclick="document.getElementById('aboutModal').style.display='none'">Cancelar</button></div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    const teamText = document.getElementById('teamText');
    const mission = document.getElementById('missionText');
    const vision = document.getElementById('visionText');
    const preview = document.getElementById('aboutImagePreview');
    if (teamText) teamText.value = aboutTeamText;
    if (mission) mission.value = missionText;
    if (vision) vision.value = visionText;
    if (aboutImage && preview) {
        preview.src = aboutImage;
        preview.style.display = 'block';
    }
    const modal = document.getElementById('aboutModal');
    if (modal) modal.style.display = 'flex';
}

export function uploadAboutImage() {
    const input = document.getElementById('aboutImageInput');
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const MAX_WIDTH = 800;
            const scale = MAX_WIDTH / img.width;
            const newWidth = MAX_WIDTH;
            const newHeight = img.height * scale;
            const canvas = document.createElement('canvas');
            canvas.width = newWidth;
            canvas.height = newHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            const reducedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            aboutImage = reducedDataUrl;
            const teamImg = document.getElementById('aboutTeamImage');
            const preview = document.getElementById('aboutImagePreview');
            const placeholder = document.getElementById('aboutImagePlaceholder');
            if (teamImg) {
                teamImg.src = reducedDataUrl;
                teamImg.style.display = 'block';
            }
            if (preview) {
                preview.src = reducedDataUrl;
                preview.style.display = 'block';
            }
            if (placeholder) placeholder.style.display = 'none';
            showToast('✅ Imagen optimizada y cargada, guarda los cambios', 'success');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

export function saveAboutTexts() {
    const teamText = document.getElementById('teamText');
    const mission = document.getElementById('missionText');
    const vision = document.getElementById('visionText');
    const imagePreview = document.getElementById('aboutImagePreview');
    if (teamText) aboutTeamText = teamText.value;
    if (mission) missionText = mission.value;
    if (vision) visionText = vision.value;
    if (imagePreview && imagePreview.src && imagePreview.src.startsWith('data:image')) aboutImage = imagePreview.src;
    const aboutData = { teamText: aboutTeamText, mission: missionText, vision: visionText, image: aboutImage };
    db.ref('aboutTexts').set(aboutData);
    updateAboutSection();
    const modal = document.getElementById('aboutModal');
    if (modal) modal.style.display = 'none';
    showToast('Sección Quiénes Somos actualizada', 'success');
}

// ============================================
// SISTEMA COMPLETO PARA GESTIONAR TIPOS DE ATENCIÓN (CRUD) CON LIMPIEZA DE DATOS
// ============================================
export function cargarAtencionTexts() {
    db.ref('atencionTexts').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && typeof data === 'object') {
            const cleaned = {};
            for (const [key, tipo] of Object.entries(data)) {
                cleaned[key] = {
                    title: (tipo.title || '').toString(),
                    description: (tipo.description || '').toString(),
                    icon: (tipo.icon || '').toString(),
                    price: (tipo.price || '').toString(),
                    active: tipo.active !== false
                };
            }
            atencionTexts = cleaned;
        } else {
            if (Object.keys(atencionTexts).length === 0) {
                atencionTexts = {
                    online: { title: 'Online', description: 'sesiones por videollamada desde la comodidad de tu hogar', icon: 'video', price: 'Desde $25.000', active: true },
                    presencial: { title: 'Presencial', description: 'Atención en nuestro consultorio con todos los protocolos', icon: 'users', price: 'Desde $30.000', active: true },
                    pareja: { title: 'Pareja', description: 'Terapia para fortalecer vínculos y mejorar la comunicación', icon: 'heart', price: 'Desde $40.000', active: true },
                    familiar: { title: 'Familiar', description: 'Espacio de diálogo y crecimiento para toda la familia', icon: 'home', price: 'Desde $45.000', active: true }
                };
            }
        }
        updateAtencionSection();
    });
}

export function updateAtencionSection() {
    console.log('🔄 Actualizando sección de atención...');
    const container = document.querySelector('.atencion-grid');
    if (!container) return;
    let html = '';
    for (const [key, tipo] of Object.entries(atencionTexts)) {
        if (tipo.active === false) continue;
        html += `
        <div class="atencion-card" style="background: white; border-radius: 24px; padding: 30px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid var(--gris-claro);">
            <div style="width: 80px; height: 80px; background: var(--verde-grisaceo-claro); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                <i class="fa fa-${tipo.icon || 'circle'}" style="font-size: 2rem; color: var(--verde-azulado-profundo);"></i>
            </div>
            <h3 style="color: var(--verde-azulado-profundo); font-size: 1.5rem; margin-bottom: 10px;">${tipo.title}</h3>
            <p style="color: var(--texto-secundario); margin-bottom: 15px;">${tipo.description}</p>
            <span style="color: var(--verde-azulado-profundo); font-weight: 600; font-size: 1.1rem; display: block; margin-top: 8px;">${tipo.price}</span>
        </div>
        `;
    }
    container.innerHTML = html;
}

export function showAtencionModal() {
    if (!document.getElementById('atencionModal')) {
        const modalHTML = `
        <div id="atencionModal" class="modal">
            <div class="modal-content" style="max-width: 800px;">
                <span class="modal-close" onclick="document.getElementById('atencionModal').style.display='none'">&times;</span>
                <h2 style="margin-bottom: 25px;">📝 Gestionar Tipos de Atención</h2>
                <div style="margin-bottom: 30px; display: flex; justify-content: flex-end;"><button class="btn-staff" onclick="agregarNuevoTipoAtencion()" style="background: var(--exito);"><i class="fa fa-plus"></i> Agregar Nuevo Tipo</button></div>
                <div id="tiposAtencionList" style="display: grid; gap: 20px; max-height: 500px; overflow-y: auto; padding-right: 10px;"></div>
                <div style="display:flex; gap:15px; margin-top: 30px;"><button class="btn-staff" style="background:var(--verde-exito); flex:1;" onclick="guardarTodosLosTiposAtencion()">Guardar Todos</button><button class="btn-staff" style="background:var(--gris-oscuro); flex:0.5;" onclick="document.getElementById('atencionModal').style.display='none'">Cancelar</button></div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    renderizarTiposAtencion();
    const modal = document.getElementById('atencionModal');
    if (modal) modal.style.display = 'flex';
}

function renderizarTiposAtencion() {
    const container = document.getElementById('tiposAtencionList');
    if (!container) return;
    let html = '';
    for (const [key, tipo] of Object.entries(atencionTexts)) {
        html += `
        <div class="tipo-atencion-card" data-key="${key}" style="background: white; border: 1px solid var(--gris-claro); border-radius: 16px; padding: 20px; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin:0; color: var(--verde-azulado-profundo);">${tipo.title || 'Nuevo Tipo'}</h3>
                <div style="display: flex; gap: 10px;"><button class="btn-icon" onclick="eliminarTipoAtencion('${key}')" style="background: var(--peligro); color: white; width: 36px; height: 36px;"><i class="fa fa-trash"></i></button></div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group"><label>Título</label><input type="text" class="filter-input tipo-titulo" value="${tipo.title || ''}" placeholder="Ej: Online"></div>
                <div class="form-group"><label>Icono (Font Awesome)</label><input type="text" class="filter-input tipo-icono" value="${tipo.icon || 'video'}" placeholder="Ej: video, users, heart, home"><small style="color: var(--texto-secundario);">Usa nombres de <a href="https://fontawesome.com/icons" target="_blank">Font Awesome</a></small></div>
                <div class="form-group"><label>Descripción</label><input type="text" class="filter-input tipo-descripcion" value="${tipo.description || ''}" placeholder="Descripción breve"></div>
                <div class="form-group"><label>Precio (texto)</label><input type="text" class="filter-input tipo-precio" value="${tipo.price || 'Desde $25.000'}" placeholder="Ej: Desde $25.000"></div>
                <div class="form-group" style="grid-column: 1/-1;"><label style="display: flex; align-items: center; gap: 10px;"><input type="checkbox" class="tipo-activo" ${tipo.active !== false ? 'checked' : ''}> Activo (mostrar en la página)</label></div>
            </div>
        </div>
        `;
    }
    container.innerHTML = html;
}

window.agregarNuevoTipoAtencion = function() {
    const nuevoKey = 'tipo_' + Date.now();
    atencionTexts[nuevoKey] = { title: 'Nuevo Tipo', description: 'Descripción del servicio', icon: 'circle', price: 'Desde $30.000', active: true };
    renderizarTiposAtencion();
    showToast('Nuevo tipo agregado. Completa los datos y guarda.', 'success');
};

window.eliminarTipoAtencion = function(key) {
    if (confirm('¿Estás seguro de eliminar este tipo de atención?')) {
        delete atencionTexts[key];
        renderizarTiposAtencion();
        showToast('Tipo de atención eliminado', 'success');
    }
};

window.guardarTodosLosTiposAtencion = function() {
    const cards = document.querySelectorAll('.tipo-atencion-card');
    const nuevosTipos = {};
    cards.forEach(card => {
        const key = card.dataset.key;
        const titulo = card.querySelector('.tipo-titulo')?.value || 'Sin título';
        const icono = card.querySelector('.tipo-icono')?.value || 'circle';
        const descripcion = card.querySelector('.tipo-descripcion')?.value || '';
        const precio = card.querySelector('.tipo-precio')?.value || 'Desde $25.000';
        const activo = card.querySelector('.tipo-activo')?.checked || false;
        if (activo && titulo.trim() !== '') {
            nuevosTipos[key] = { 
                title: titulo, 
                description: descripcion, 
                icon: icono, 
                price: precio, 
                active: activo 
            };
        }
    });
    atencionTexts = nuevosTipos;
    db.ref('atencionTexts').set(atencionTexts)
        .then(() => {
            updateAtencionSection();
            const modal = document.getElementById('atencionModal');
            if (modal) modal.style.display = 'none';
            showToast('✅ Tipos de atención guardados correctamente', 'success');
        })
        .catch(err => {
            console.error('❌ Error guardando tipos de atención:', err);
            showToast('Error al guardar', 'error');
        });
};

// ============================================
// FUNCIONES PARA SECCIÓN CONTACTO
// ============================================
function updateFooterFromContactInfo() {
    const footerPhone = document.getElementById('footerPhone');
    const footerEmail = document.getElementById('footerEmail');
    const footerAddress = document.getElementById('footerAddress');
    if (footerPhone) footerPhone.innerText = contactInfo.phone || '+56';
    if (footerEmail) footerEmail.innerText = contactInfo.email || 'vinculosalud@hotmail.com';
    if (footerAddress) footerAddress.innerText = contactInfo.address || 'Ohiggins 263, Concepción';
    console.log('📞 Footer actualizado con:', { phone: contactInfo.phone, email: contactInfo.email, address: contactInfo.address });
}

export function cargarContactInfo() {
    db.ref('contactInfo').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) contactInfo = data;
        updateContactSection();
        updateFooterFromContactInfo();
    });
}

export function updateContactSection() {
    const contactEmail = document.getElementById('contactEmailDisplay');
    const contactPhone = document.getElementById('contactPhoneDisplay');
    const contactAddress = document.getElementById('contactAddressDisplay');
    if (contactEmail) contactEmail.innerText = contactInfo.email || 'vinculosalud@hotmail.com';
    if (contactPhone) contactPhone.innerText = contactInfo.phone || '+56';
    if (contactAddress) contactAddress.innerText = contactInfo.address || 'Ohiggins 263, Concepción';
    updateFooterFromContactInfo();
}

export function showContactModal() {
    if (!document.getElementById('contactModal')) {
        const modalHTML = `
        <div id="contactModal" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <span class="modal-close" onclick="document.getElementById('contactModal').style.display='none'">&times;</span>
                <h2 style="margin-bottom: 25px;">📝 Editar Información de Contacto</h2>
                <div class="form-group"><label>Email</label><input type="email" id="contactEmailInput" class="filter-input" placeholder="vinculosalud@hotmail.com"></div>
                <div class="form-group"><label>Teléfono</label><input type="text" id="contactPhoneInput" class="filter-input" placeholder="+56"></div>
                <div class="form-group"><label>Dirección</label><input type="text" id="contactAddressInput" class="filter-input" placeholder="Av. Principal 123, Santiago"></div>
                <div style="display:flex; gap:15px;"><button class="btn-staff" style="background:var(--verde-exito); flex:1;" onclick="saveContactInfo()">Guardar</button><button class="btn-staff" style="background:var(--gris-oscuro); flex:0.5;" onclick="document.getElementById('contactModal').style.display='none'">Cancelar</button></div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    const emailInput = document.getElementById('contactEmailInput');
    const phoneInput = document.getElementById('contactPhoneInput');
    const addressInput = document.getElementById('contactAddressInput');
    if (emailInput) emailInput.value = contactInfo.email || '';
    if (phoneInput) phoneInput.value = contactInfo.phone || '';
    if (addressInput) addressInput.value = contactInfo.address || '';
    const modal = document.getElementById('contactModal');
    if (modal) modal.style.display = 'flex';
}

export function saveContactInfo() {
    const emailInput = document.getElementById('contactEmailInput');
    const phoneInput = document.getElementById('contactPhoneInput');
    const addressInput = document.getElementById('contactAddressInput');
    contactInfo = {
        email: emailInput?.value || '',
        phone: phoneInput?.value || '',
        address: addressInput?.value || ''
    };
    db.ref('contactInfo').set(contactInfo);
    updateContactSection();
    updateFooterFromContactInfo();
    const modal = document.getElementById('contactModal');
    if (modal) modal.style.display = 'none';
    showToast('Información de contacto actualizada', 'success');
}

// ============================================
// CONFIGURACIÓN PERSONAL DEL PSICÓLOGO
// ============================================
export function loadMyConfig() {
    console.log('⚙️ Cargando configuración personal...');
    if (!state.currentUser?.data) {
        console.log('⚠️ No hay usuario logueado');
        return;
    }
    const psych = state.currentUser.data;
    console.log('👤 Psicólogo:', psych.name);
    const myName = document.getElementById('myName');
    const myEmail = document.getElementById('myEmail');
    const mySpecialtiesSelect = document.getElementById('mySpecialtiesSelect');
    const myPriceOnline = document.getElementById('myPriceOnline');
    const myPricePresencial = document.getElementById('myPricePresencial');
    const myWhatsapp = document.getElementById('myWhatsapp');
    const myInstagram = document.getElementById('myInstagram');
    const myBank = document.getElementById('myBank');
    const myAccountType = document.getElementById('myAccountType');
    const myAccountNumber = document.getElementById('myAccountNumber');
    const myBankRut = document.getElementById('myBankRut');
    const myBankEmail = document.getElementById('myBankEmail');
    if (myName) myName.value = psych.name || '';
    if (myEmail) myEmail.value = psych.email || '';
    if (mySpecialtiesSelect) {
        mySpecialtiesSelect.innerHTML = '';
        if (state.specialties && state.specialties.length > 0) {
            state.specialties.forEach(spec => {
                const option = document.createElement('option');
                option.value = spec.name;
                option.textContent = spec.name;
                mySpecialtiesSelect.appendChild(option);
            });
            const psicologoSpecs = Array.isArray(psych.spec) ? psych.spec : [psych.spec];
            Array.from(mySpecialtiesSelect.options).forEach(option => {
                if (psicologoSpecs.includes(option.value)) option.selected = true;
            });
        }
    }
    if (myPriceOnline) myPriceOnline.value = psych.priceOnline || '';
    if (myPricePresencial) myPricePresencial.value = psych.pricePresencial || '';
    if (myWhatsapp) myWhatsapp.value = psych.whatsapp || '';
    if (myInstagram) myInstagram.value = psych.instagram || '';
    const bank = psych.bankDetails || {};
    if (myBank) myBank.value = bank.bank || '';
    if (myAccountType) myAccountType.value = bank.accountType || 'corriente';
    if (myAccountNumber) myAccountNumber.value = bank.accountNumber || '';
    if (myBankRut) myBankRut.value = bank.rut || '';
    if (myBankEmail) myBankEmail.value = bank.email || '';
    mostrarEstadisticasPsicologo(psych.id);
    console.log('✅ Configuración cargada');
}

function mostrarEstadisticasPsicologo(psychId) {
    const statsContainer = document.getElementById('psychStatsContainer');
    if (!statsContainer) return;
    const misPacientes = state.patients.filter(p => p.psychId == psychId);
    const misPatientIds = misPacientes.map(p => p.id);
    const misCitas = state.appointments.filter(a => a.psychId == psychId);
    const citasPagadas = misCitas.filter(a => a.paymentStatus === 'pagado');
    const fichasIngreso = state.fichasIngreso.filter(f => misPatientIds.includes(f.patientId));
    const sesiones = state.sesiones.filter(s => misPatientIds.includes(s.patientId));
    const informes = state.informes.filter(i => misPatientIds.includes(i.patientId));
    const ingresosTotales = citasPagadas.reduce((sum, a) => sum + (a.price || 0), 0);
    const ingresosMes = citasPagadas.filter(a => {
        const fecha = new Date(a.date);
        const ahora = new Date();
        return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
    }).reduce((sum, a) => sum + (a.price || 0), 0);
    statsContainer.innerHTML = `
        <div class="stats-container" style="margin: 20px 0;">
            <h4 style="margin-bottom: 15px; color: var(--texto-principal); font-size: 1.2rem;">📊 Mis Estadísticas</h4>
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                <div class="stat-box" style="background: white; padding: 20px; border-radius: 20px; text-align: center; border: 1px solid var(--gris-claro);"><div style="font-size: 2rem; font-weight: 700; color: var(--primario);">${misPacientes.length}</div><div style="font-size: 0.8rem; color: var(--texto-secundario); text-transform: uppercase;">Pacientes</div></div>
                <div class="stat-box" style="background: white; padding: 20px; border-radius: 20px; text-align: center; border: 1px solid var(--gris-claro);"><div style="font-size: 2rem; font-weight: 700; color: var(--exito);">${sesiones.length}</div><div style="font-size: 0.8rem; color: var(--texto-secundario); text-transform: uppercase;">sesiones</div></div>
                <div class="stat-box" style="background: white; padding: 20px; border-radius: 20px; text-align: center; border: 1px solid var(--gris-claro);"><div style="font-size: 2rem; font-weight: 700; color: var(--atencion);">${fichasIngreso.length}</div><div style="font-size: 0.8rem; color: var(--texto-secundario); text-transform: uppercase;">Fichas</div></div>
                <div class="stat-box" style="background: white; padding: 20px; border-radius: 20px; text-align: center; border: 1px solid var(--gris-claro);"><div style="font-size: 2rem; font-weight: 700; color: var(--box-color);">${informes.length}</div><div style="font-size: 0.8rem; color: var(--texto-secundario); text-transform: uppercase;">informes</div></div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                <div style="background: linear-gradient(135deg, var(--primario), var(--primario-hover)); padding: 20px; border-radius: 20px; color: white;"><div style="font-size: 0.9rem; opacity: 0.9;">Ingresos Totales</div><div style="font-size: 1.8rem; font-weight: 700;">$${ingresosTotales.toLocaleString()}</div></div>
                <div style="background: linear-gradient(135deg, var(--primario), var(--primario-hover)); padding: 20px; border-radius: 20px; color: white;"><div style="font-size: 0.9rem; opacity: 0.9;">Ingresos este Mes</div><div style="font-size: 1.8rem; font-weight: 700;">$${ingresosMes.toLocaleString()}</div></div>
            </div>
        </div>
    `;
}

export function saveMyConfig() {
    console.log('💾 Guardando configuración personal...');
    if (!state.currentUser?.data) {
        console.log('⚠️ No hay usuario logueado');
        showToast('Error: No hay sesión activa', 'error');
        return;
    }
    const psych = state.currentUser.data;
    const myName = document.getElementById('myName');
    const myEmail = document.getElementById('myEmail');
    const mySpecialtiesSelect = document.getElementById('mySpecialtiesSelect');
    const myPriceOnline = document.getElementById('myPriceOnline');
    const myPricePresencial = document.getElementById('myPricePresencial');
    const myWhatsapp = document.getElementById('myWhatsapp');
    const myInstagram = document.getElementById('myInstagram');
    const myBank = document.getElementById('myBank');
    const myAccountType = document.getElementById('myAccountType');
    const myAccountNumber = document.getElementById('myAccountNumber');
    const myBankRut = document.getElementById('myBankRut');
    const myBankEmail = document.getElementById('myBankEmail');
    if (myName) psych.name = myName.value;
    if (myEmail) psych.email = myEmail.value;
    if (mySpecialtiesSelect) {
        const selectedSpecs = Array.from(mySpecialtiesSelect.selectedOptions).map(opt => opt.value);
        psych.spec = selectedSpecs;
    }
    if (myPriceOnline) psych.priceOnline = parseInt(myPriceOnline.value) || 0;
    if (myPricePresencial) psych.pricePresencial = parseInt(myPricePresencial.value) || 0;
    if (myWhatsapp) psych.whatsapp = myWhatsapp.value;
    if (myInstagram) psych.instagram = myInstagram.value;
    psych.bankDetails = {
        bank: myBank?.value || '',
        accountType: myAccountType?.value || 'corriente',
        accountNumber: myAccountNumber?.value || '',
        rut: myBankRut?.value || '',
        email: myBankEmail?.value || ''
    };
    const myTransfer = document.getElementById('myTransfer');
    const myCardPresencial = document.getElementById('myCardPresencial');
    const myCardOnline = document.getElementById('myCardOnline');
    const myCash = document.getElementById('myCash');
    const myMercadoPago = document.getElementById('myMercadoPago');
    const myWebpay = document.getElementById('myWebpay');
    psych.paymentMethods = {
        transfer: myTransfer ? myTransfer.checked : true,
        cardPresencial: myCardPresencial ? myCardPresencial.checked : true,
        cardOnline: myCardOnline ? myCardOnline.checked : false,
        cash: myCash ? myCash.checked : true,
        mercadopago: myMercadoPago ? myMercadoPago.checked : false,
        webpay: myWebpay ? myWebpay.checked : false
    };
    const staffIndex = state.staff.findIndex(s => s.id == psych.id);
    if (staffIndex !== -1) state.staff[staffIndex] = psych;
    else console.warn('⚠️ Psicólogo no encontrado en staff');
    const staffObj = {};
    state.staff.forEach(item => { staffObj[item.id] = item; });
    db.ref('staff').set(staffObj)
        .then(() => {
            console.log('✅ Configuración guardada en Firebase');
            showToast('Configuración guardada', 'success');
            mostrarEstadisticasPsicologo(psych.id);
        })
        .catch(err => {
            console.error('❌ Error al guardar:', err);
            showToast('Error al guardar la configuración', 'error');
        });
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
export function getRecentPatientsWithSessions(psychId, limit = 5) {
    const misPacientes = state.patients.filter(p => p.psychId == psychId);
    return misPacientes.map(patient => {
        const sesiones = state.sesiones.filter(s => s.patientId == patient.id).sort((a, b) => new Date(b.fechaAtencion) - new Date(a.fechaAtencion));
        return { ...patient, ultimaSesion: sesiones.length > 0 ? sesiones[0] : null, totalSesiones: sesiones.length, tieneFichaIngreso: state.fichasIngreso.some(f => f.patientId == patient.id) };
    }).sort((a, b) => {
        if (!a.ultimaSesion) return 1;
        if (!b.ultimaSesion) return -1;
        return new Date(b.ultimaSesion.fechaAtencion) - new Date(a.ultimaSesion.fechaAtencion);
    }).slice(0, limit);
}

export function exportMyConfig() {
    if (!state.currentUser?.data) return null;
    const psych = state.currentUser.data;
    return {
        personal: { nombre: psych.name, email: psych.email, especialidades: psych.spec, whatsapp: psych.whatsapp, instagram: psych.instagram },
        precios: { online: psych.priceOnline, presencial: psych.pricePresencial },
        bancarios: psych.bankDetails || {},
        metodosPago: psych.paymentMethods || state.globalPaymentMethods,
        estadisticas: {
            totalPacientes: state.patients.filter(p => p.psychId == psych.id).length,
            totalSesiones: state.sesiones.filter(s => { const patient = state.patients.find(p => p.id == s.patientId); return patient && patient.psychId == psych.id; }).length
        }
    };
}

// ============================================
// CARGA TOTAL DE PERSONALIZACIÓN
// ============================================
export function cargarTodaPersonalizacion() {
    console.log('🎨 Cargando toda la personalización...');
    cargarLogo();
    cargarTextos();
    cargarFondo();
    cargarMetodosPago();
    cargarEspecialidades();
    cargarAboutTexts();
    cargarAtencionTexts();
    cargarContactInfo();
    cargarInstagramData();
    setTimeout(() => {
        updateFooterFromContactInfo();
        console.log('✅ Footer sincronizado con datos de contacto');
    }, 500);
    console.log('✅ Personalización cargada');
}

export function forceUpdateFooter() {
    console.log('🔧 Forzando actualización del footer...');
    updateFooterFromContactInfo();
    showToast('Footer actualizado', 'success');
}

// ============================================
// EXPORTAR TODO COMO OBJETO WINDOW.PERSONALIZACION
// ============================================
if (typeof window !== 'undefined') {
    window.personalizacion = {
        missionText, visionText, aboutTeamText, aboutImage, atencionTexts, contactInfo, instagramData,
        cargarLogo, showLogoModal, closeLogoModal, previewLogo, saveLogo, removeLogo,
        cargarTextos, showTextsModal, closeTextsModal, saveHeroTexts, updateHeroSlider,
        cargarFondo, showBackgroundImageModal, closeBackgroundImageModal, previewBackgroundImage,
        updateBackgroundOpacity, saveBackgroundImage, removeBackgroundImage,
        cargarMetodosPago, showPaymentMethodsModal, closePaymentMethodsModal, saveGlobalPaymentMethods, updatePaymentMethodsInfo,
        cargarEspecialidades, renderSpecialtiesTable, showAddSpecialtyModal, closeAddSpecialtyModal, addSpecialty,
        showEditSpecialtyModal, closeEditSpecialtyModal, updateSpecialty, deleteSpecialty,
        cargarInstagramData, actualizarInstagramData, updateInstagramSection, showInstagramModal, uploadInstagramImage, saveInstagramData,
        guardarInstagramEmbed,
        cargarAboutTexts, updateAboutSection, showAboutModal, uploadAboutImage, saveAboutTexts,
        cargarAtencionTexts, updateAtencionSection, showAtencionModal,
        cargarContactInfo, updateContactSection, showContactModal, saveContactInfo,
        loadMyConfig, saveMyConfig,
        getRecentPatientsWithSessions, exportMyConfig, cargarTodaPersonalizacion, forceUpdateFooter,
        agregarNuevoTipoAtencion, eliminarTipoAtencion, guardarTodosLosTiposAtencion
    };
    console.log('✅ personalizacion.js exportado a window.personalizacion');
}