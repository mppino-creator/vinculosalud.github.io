// js/modules/personalizacion.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast } from './utils.js';

// ============================================
// VARIABLES PARA TEXTOS EDITABLES (NUEVAS v3.0)
// ============================================
export let missionText = 'Acompañar a las personas en su proceso de sanación emocional, proporcionando herramientas para el crecimiento personal y la mejora de la calidad de vida.';
export let visionText = 'Ser un referente en salud mental en la región, reconocido por nuestra calidad profesional, calidez humana y compromiso con la comunidad.';
export let aboutTeamText = 'Nuestro equipo está formado por profesionales de la salud mental con amplia formación y experiencia en terapia individual, familiar y de pareja. Todos compartimos una mirada humana, ética y especializada.';
export let aboutImage = '';
export let atencionTexts = {
    online: {
        title: 'Online',
        description: 'Sesiones por videollamada desde la comodidad de tu hogar'
    },
    presencial: {
        title: 'Presencial',
        description: 'Atención en nuestro consultorio con todos los protocolos'
    },
    pareja: {
        title: 'Pareja',
        description: 'Terapia para fortalecer vínculos y mejorar la comunicación'
    },
    familiar: {
        title: 'Familiar',
        description: 'Espacio de diálogo y crecimiento para toda la familia'
    }
};
export let contactInfo = {
    email: 'vinculosalud@gmail.com',
    phone: '+56 9 1234 5678',
    address: 'Ohiggins 263, Concepción'
};

// 🆕 NUEVA VARIABLE PARA SECCIÓN INSTAGRAM
export let instagramData = {
    title: 'Sigue Nuestro Instagram',
    subtitle: 'VÍNCULO',
    quote: '<strong>"SOLO HABLAMOS"</strong><br>JAVIERA TIENE EL ÉXITO,<br>pero no tiene con quién celebrarlo.',
    text: 'Detente aquí un segundo',
    message: 'Esto también se aprende.',
    link: 'https://instagram.com/vinculo.salud',
    image: ''
};

// ============================================
// FUNCIONES DE LOGO (AMBOS SIEMPRE VISIBLES)
// ============================================

export function cargarLogo() {
    db.ref('LogoImage').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            state.setLogoImage(data);
            
            // 🔥 CORREGIDO: Verificar que los elementos existen antes de usarlos
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
    db.ref('LogoImage').set(state.logoImage);

    // 🔥 CORREGIDO: Verificar elementos
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
        db.ref('LogoImage').set(state.logoImage);
        
        // 🔥 CORREGIDO: Verificar elementos
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
    db.ref('HeroTexts').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            state.setHeroTexts(data);
            
            const titleDisplay = document.getElementById('heroTitleDisplay');
            const subtitleDisplay = document.getElementById('heroSubtitleDisplay');
            
            if (titleDisplay) titleDisplay.innerHTML = state.heroTexts.title.replace(/\n/g, '<br>');
            if (subtitleDisplay) subtitleDisplay.innerText = state.heroTexts.subtitle;
        }
    });
}

export function showTextsModal() {
    const modal = document.getElementById('textsModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    
    if (heroTitle) heroTitle.value = state.heroTexts.title;
    if (heroSubtitle) heroSubtitle.value = state.heroTexts.subtitle;
}

export function closeTextsModal() {
    const modal = document.getElementById('textsModal');
    if (modal) modal.style.display = 'none';
}

export function saveHeroTexts() {
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    
    state.setHeroTexts({
        title: heroTitle?.value || '',
        subtitle: heroSubtitle?.value || ''
    });
    
    db.ref('HeroTexts').set(state.heroTexts);
    
    const titleDisplay = document.getElementById('heroTitleDisplay');
    const subtitleDisplay = document.getElementById('heroSubtitleDisplay');
    
    if (titleDisplay) titleDisplay.innerHTML = state.heroTexts.title.replace(/\n/g, '<br>');
    if (subtitleDisplay) subtitleDisplay.innerText = state.heroTexts.subtitle;
    
    closeTextsModal();
    showToast('Textos actualizados', 'success');
}

// ============================================
// FUNCIONES DE FONDO
// ============================================

export function cargarFondo() {
    db.ref('BackgroundImage').on('value', (snapshot) => {
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
    if (state.tempBackgroundImageData) {
        newBg.url = state.tempBackgroundImageData;
    }
    newBg.opacity = parseInt(opacityInput.value);
    state.setBackgroundImage(newBg);
    db.ref('BackgroundImage').set(state.backgroundImage);

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
        db.ref('BackgroundImage').set(state.backgroundImage);
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
    db.ref('PaymentMethods').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            state.setGlobalPaymentMethods(data);
        }
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
    
    db.ref('PaymentMethods').set(state.globalPaymentMethods);
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
// FUNCIONES DE ESPECIALIDADES
// ============================================

export function cargarEspecialidades() {
    db.ref('Specialties').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            state.setSpecialties(Object.keys(data).map(key => ({ id: key, name: data[key].name })));
        } else {
            state.setSpecialties([
                { id: 1, name: 'Psicología Clínica' },
                { id: 2, name: 'Psiquiatría' },
                { id: 3, name: 'Terapia de Pareja' },
                { id: 4, name: 'Terapia Familiar' },
                { id: 5, name: 'Mindfulness' },
                { id: 6, name: 'Ansiedad' },
                { id: 7, name: 'Depresión' },
                { id: 8, name: 'Terapia Infantil' },
                { id: 9, name: 'Neuropsicología' },
                { id: 10, name: 'Sexología' }
            ]);
        }
        actualizarSelectoresEspecialidades();
        renderAllSpecialties();
    });
}

function actualizarSelectoresEspecialidades() {
    const addSpecSelect = document.getElementById('addSpec');
    const editSpecSelect = document.getElementById('editSpec');
    const specialtyFilter = document.getElementById('specialtyFilter');

    const options = state.specialties.map(s => 
        `<option value="${s.name}">${s.name}</option>`
    ).join('');

    if (addSpecSelect) addSpecSelect.innerHTML = options;
    if (editSpecSelect) editSpecSelect.innerHTML = options;
    
    if (specialtyFilter) {
        specialtyFilter.innerHTML = '<option value="">🏷️ Todas las especialidades</option>' + options;
    }
}

function renderAllSpecialties() {
    const container = document.getElementById('allSpecialtiesList');
    if (!container) return;
    
    container.innerHTML = state.specialties.map(s => `
        <div class="specialty-item">
            <span>${s.name}</span>
            <button onclick="deleteSpecialty('${s.id}')"><i class="fa fa-times"></i></button>
        </div>
    `).join('');
}

export function showSpecialtiesModal() {
    const modal = document.getElementById('specialtiesModal');
    const input = document.getElementById('newSpecialty');
    
    if (modal) modal.style.display = 'flex';
    if (input) input.value = '';
    
    renderAllSpecialties();
}

export function closeSpecialtiesModal() {
    const modal = document.getElementById('specialtiesModal');
    if (modal) modal.style.display = 'none';
}

export function addSpecialty() {
    const input = document.getElementById('newSpecialty');
    if (!input) return;
    
    const name = input.value.trim();
    if (!name) {
        showToast('Ingresa un nombre para la especialidad', 'error');
        return;
    }
    if (state.specialties.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        showToast('La especialidad ya existe', 'error');
        return;
    }
    const newSpecialty = { id: Date.now(), name };
    state.setSpecialties([...state.specialties, newSpecialty]);
    guardarEspecialidades();
    input.value = '';
    showToast('Especialidad agregada', 'success');
}

export function deleteSpecialty(id) {
    if (confirm('¿Eliminar esta especialidad? Los profesionales que la tengan asignada la perderán.')) {
        state.setSpecialties(state.specialties.filter(s => s.id != id));
        // Actualizar profesionales
        state.staff.forEach(prof => {
            if (prof.spec) {
                const specArray = Array.isArray(prof.spec) ? prof.spec : [prof.spec];
                prof.spec = specArray.filter(s => state.specialties.some(sp => sp.name === s));
            }
        });
        guardarEspecialidades();
        import('../main.js').then(main => main.save());
        showToast('Especialidad eliminada', 'success');
    }
}

function guardarEspecialidades() {
    const specialtiesObj = {};
    state.specialties.forEach(item => {
        specialtiesObj[item.id] = { name: item.name };
    });
    db.ref('Specialties').set(specialtiesObj);
    actualizarSelectoresEspecialidades();
    renderAllSpecialties();
}

// ============================================
// 🆕 FUNCIONES PARA SECCIÓN INSTAGRAM
// ============================================

export function cargarInstagramData() {
    db.ref('InstagramData').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            instagramData = { ...instagramData, ...data };
        }
        updateInstagramSection();
    });
}

export function updateInstagramSection() {
    console.log('📸 Actualizando sección Instagram...');
    
    const titleEl = document.getElementById('instagramTitle');
    const subtitleEl = document.getElementById('instagramSubtitle');
    const quoteEl = document.getElementById('instagramQuote');
    const textEl = document.getElementById('instagramText');
    const messageEl = document.getElementById('instagramMessage');
    const linkEl = document.getElementById('instagramLink');
    const imageEl = document.getElementById('instagramImage');
    
    if (titleEl) titleEl.innerText = instagramData.title;
    if (subtitleEl) subtitleEl.innerText = instagramData.subtitle;
    if (quoteEl) quoteEl.innerHTML = instagramData.quote;
    if (textEl) textEl.innerText = instagramData.text;
    if (messageEl) messageEl.innerText = instagramData.message;
    if (linkEl) linkEl.href = instagramData.link;
    
    if (imageEl) {
        if (instagramData.image) {
            imageEl.src = instagramData.image;
            imageEl.style.display = 'block';
        } else {
            // Imagen por defecto si no hay personalizada
            imageEl.src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500';
            imageEl.style.display = 'block';
        }
    }
    
    console.log('✅ Sección Instagram actualizada');
}

export function showInstagramModal() {
    // Crear modal si no existe
    if (!document.getElementById('instagramModal')) {
        const modalHTML = `
        <div id="instagramModal" class="modal">
            <div class="modal-content" style="max-width: 600px;">
                <span class="modal-close" onclick="document.getElementById('instagramModal').style.display='none'">&times;</span>
                <h2 style="margin-bottom: 25px;">📸 Editar Sección Instagram</h2>
                
                <div class="form-group">
                    <label>Título (arriba)</label>
                    <input type="text" id="instagramTitleInput" class="filter-input" placeholder="Sigue Nuestro Instagram">
                </div>
                
                <div class="form-group">
                    <label>Subtítulo (PUNTO)</label>
                    <input type="text" id="instagramSubtitleInput" class="filter-input" placeholder="VÍNCULO">
                </div>
                
                <div class="form-group">
                    <label>Cita (con HTML permitido)</label>
                    <textarea id="instagramQuoteInput" rows="4" class="filter-input" placeholder='<strong>"SOLO HABLAMOS"</strong><br>JAVIERA TIENE EL ÉXITO,<br>pero no tiene con quién celebrarlo.'></textarea>
                    <small>Puedes usar &lt;strong&gt;texto&lt;/strong&gt; y &lt;br&gt; para saltos de línea</small>
                </div>
                
                <div class="form-group">
                    <label>Texto secundario</label>
                    <input type="text" id="instagramTextInput" class="filter-input" placeholder="Detente aquí un segundo">
                </div>
                
                <div class="form-group">
                    <label>Mensaje final</label>
                    <input type="text" id="instagramMessageInput" class="filter-input" placeholder="Esto también se aprende.">
                </div>
                
                <div class="form-group">
                    <label>Enlace a Instagram</label>
                    <input type="url" id="instagramLinkInput" class="filter-input" placeholder="https://instagram.com/vinculo.salud">
                </div>
                
                <div class="form-group">
                    <label>Imagen destacada</label>
                    <div class="file-upload" onclick="document.getElementById('instagramImageInput').click()">
                        <i class="fa fa-cloud-upload-alt"></i> Seleccionar imagen
                    </div>
                    <input type="file" id="instagramImageInput" accept="image/*" style="display:none;" onchange="uploadInstagramImage()">
                    <img id="instagramImagePreview" src="" style="max-width:100%; max-height:200px; margin-top:15px; border-radius:12px; display:none;">
                </div>
                
                <div style="display:flex; gap:15px;">
                    <button class="btn-staff" style="background:var(--exito); flex:1;" onclick="saveInstagramData()">Guardar</button>
                    <button class="btn-staff" style="background:var(--gris-oscuro); flex:0.5;" onclick="document.getElementById('instagramModal').style.display='none'">Cancelar</button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Cargar datos actuales
    const titleInput = document.getElementById('instagramTitleInput');
    const subtitleInput = document.getElementById('instagramSubtitleInput');
    const quoteInput = document.getElementById('instagramQuoteInput');
    const textInput = document.getElementById('instagramTextInput');
    const messageInput = document.getElementById('instagramMessageInput');
    const linkInput = document.getElementById('instagramLinkInput');
    const preview = document.getElementById('instagramImagePreview');
    
    if (titleInput) titleInput.value = instagramData.title;
    if (subtitleInput) subtitleInput.value = instagramData.subtitle;
    if (quoteInput) quoteInput.value = instagramData.quote;
    if (textInput) textInput.value = instagramData.text;
    if (messageInput) messageInput.value = instagramData.message;
    if (linkInput) linkInput.value = instagramData.link;
    
    if (instagramData.image && preview) {
        preview.src = instagramData.image;
        preview.style.display = 'block';
    } else if (preview) {
        preview.style.display = 'none';
    }
    
    const modal = document.getElementById('instagramModal');
    if (modal) modal.style.display = 'flex';
}

export function uploadInstagramImage() {
    const input = document.getElementById('instagramImageInput');
    if (!input || !input.files || !input.files[0]) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        instagramData.image = e.target.result;
        
        // Actualizar vista previa
        const preview = document.getElementById('instagramImagePreview');
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        
        showToast('✅ Imagen cargada, guarda los cambios', 'success');
    };
    reader.readAsDataURL(input.files[0]);
}

export function saveInstagramData() {
    const titleInput = document.getElementById('instagramTitleInput');
    const subtitleInput = document.getElementById('instagramSubtitleInput');
    const quoteInput = document.getElementById('instagramQuoteInput');
    const textInput = document.getElementById('instagramTextInput');
    const messageInput = document.getElementById('instagramMessageInput');
    const linkInput = document.getElementById('instagramLinkInput');
    
    instagramData = {
        title: titleInput?.value || instagramData.title,
        subtitle: subtitleInput?.value || instagramData.subtitle,
        quote: quoteInput?.value || instagramData.quote,
        text: textInput?.value || instagramData.text,
        message: messageInput?.value || instagramData.message,
        link: linkInput?.value || instagramData.link,
        image: instagramData.image // Mantener la imagen actual
    };
    
    db.ref('InstagramData').set(instagramData);
    updateInstagramSection();
    
    const modal = document.getElementById('instagramModal');
    if (modal) modal.style.display = 'none';
    
    showToast('Sección Instagram actualizada', 'success');
}

// ============================================
// 🆕 FUNCIONES PARA SECCIÓN QUIÉNES SOMOS
// ============================================

export function cargarAboutTexts() {
    db.ref('AboutTexts').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            missionText = data.mission || missionText;
            visionText = data.vision || visionText;
            aboutTeamText = data.teamText || aboutTeamText;
            aboutImage = data.image || aboutImage;
            
            // Actualizar vista
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
    // Crear modal si no existe
    if (!document.getElementById('aboutModal')) {
        const modalHTML = `
        <div id="aboutModal" class="modal">
            <div class="modal-content" style="max-width: 600px;">
                <span class="modal-close" onclick="document.getElementById('aboutModal').style.display='none'">&times;</span>
                <h2 style="margin-bottom: 25px;">📝 Editar Sección Quiénes Somos</h2>
                
                <div class="form-group">
                    <label>Imagen del equipo</label>
                    <div class="file-upload" onclick="document.getElementById('aboutImageInput').click()">
                        <i class="fa fa-cloud-upload-alt"></i> Seleccionar foto grupal
                    </div>
                    <input type="file" id="aboutImageInput" accept="image/*" style="display:none;" onchange="uploadAboutImage()">
                    <img id="aboutImagePreview" src="" style="max-width:100%; max-height:200px; margin-top:15px; border-radius:12px; display:none;">
                </div>
                
                <div class="form-group">
                    <label>Texto del equipo</label>
                    <textarea id="teamText" rows="4" class="filter-input" placeholder="Describe al equipo..."></textarea>
                </div>
                
                <div class="form-group">
                    <label>Misión</label>
                    <textarea id="missionText" rows="3" class="filter-input" placeholder="Nuestra misión..."></textarea>
                </div>
                
                <div class="form-group">
                    <label>Visión</label>
                    <textarea id="visionText" rows="3" class="filter-input" placeholder="Nuestra visión..."></textarea>
                </div>
                
                <div style="display:flex; gap:15px;">
                    <button class="btn-staff" style="background:var(--verde-exito); flex:1;" onclick="saveAboutTexts()">Guardar</button>
                    <button class="btn-staff" style="background:var(--gris-oscuro); flex:0.5;" onclick="document.getElementById('aboutModal').style.display='none'">Cancelar</button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Cargar datos actuales
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
    
    const reader = new FileReader();
    reader.onload = function(e) {
        aboutImage = e.target.result;
        
        // Actualizar vista
        const img = document.getElementById('aboutTeamImage');
        const preview = document.getElementById('aboutImagePreview');
        const placeholder = document.getElementById('aboutImagePlaceholder');
        
        if (img) {
            img.src = e.target.result;
            img.style.display = 'block';
        }
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';
        
        showToast('✅ Imagen cargada, guarda los cambios', 'success');
    };
    reader.readAsDataURL(input.files[0]);
}

export function saveAboutTexts() {
    const teamText = document.getElementById('teamText');
    const mission = document.getElementById('missionText');
    const vision = document.getElementById('visionText');
    const imagePreview = document.getElementById('aboutImagePreview');
    
    // Actualizar variables
    if (teamText) aboutTeamText = teamText.value;
    if (mission) missionText = mission.value;
    if (vision) visionText = vision.value;
    if (imagePreview && imagePreview.src && imagePreview.src.startsWith('data:image')) {
        aboutImage = imagePreview.src;
    }
    
    // Guardar en Firebase
    const aboutData = {
        teamText: aboutTeamText,
        mission: missionText,
        vision: visionText,
        image: aboutImage
    };
    
    db.ref('AboutTexts').set(aboutData);
    
    // Actualizar vista
    updateAboutSection();
    
    const modal = document.getElementById('aboutModal');
    if (modal) modal.style.display = 'none';
    
    showToast('Sección Quiénes Somos actualizada', 'success');
}

// ============================================
// 🆕 FUNCIONES PARA SECCIÓN TIPO DE ATENCIÓN
// ============================================

export function cargarAtencionTexts() {
    db.ref('AtencionTexts').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            atencionTexts = data;
        }
        updateAtencionSection();
    });
}

export function updateAtencionSection() {
    const onlineTitle = document.getElementById('atencionOnlineTitle');
    const onlineDesc = document.getElementById('atencionOnlineDesc');
    const presencialTitle = document.getElementById('atencionPresencialTitle');
    const presencialDesc = document.getElementById('atencionPresencialDesc');
    const parejaTitle = document.getElementById('atencionParejaTitle');
    const parejaDesc = document.getElementById('atencionParejaDesc');
    const familiarTitle = document.getElementById('atencionFamiliarTitle');
    const familiarDesc = document.getElementById('atencionFamiliarDesc');
    
    if (onlineTitle) onlineTitle.innerText = atencionTexts.online?.title || 'Online';
    if (onlineDesc) onlineDesc.innerText = atencionTexts.online?.description || 'Sesiones por videollamada desde la comodidad de tu hogar';
    if (presencialTitle) presencialTitle.innerText = atencionTexts.presencial?.title || 'Presencial';
    if (presencialDesc) presencialDesc.innerText = atencionTexts.presencial?.description || 'Atención en nuestro consultorio con todos los protocolos';
    if (parejaTitle) parejaTitle.innerText = atencionTexts.pareja?.title || 'Pareja';
    if (parejaDesc) parejaDesc.innerText = atencionTexts.pareja?.description || 'Terapia para fortalecer vínculos y mejorar la comunicación';
    if (familiarTitle) familiarTitle.innerText = atencionTexts.familiar?.title || 'Familiar';
    if (familiarDesc) familiarDesc.innerText = atencionTexts.familiar?.description || 'Espacio de diálogo y crecimiento para toda la familia';
}

export function showAtencionModal() {
    // Crear modal si no existe
    if (!document.getElementById('atencionModal')) {
        const modalHTML = `
        <div id="atencionModal" class="modal">
            <div class="modal-content" style="max-width: 600px;">
                <span class="modal-close" onclick="document.getElementById('atencionModal').style.display='none'">&times;</span>
                <h2 style="margin-bottom: 25px;">📝 Editar Tipos de Atención</h2>
                
                <div style="display: grid; gap: 20px;">
                    <div style="border: 1px solid var(--gris-claro); padding: 20px; border-radius: 16px;">
                        <h3 style="color: var(--verde-azulado-profundo); margin-bottom: 15px;">Online</h3>
                        <div class="form-group">
                            <label>Título</label>
                            <input type="text" id="atencionOnlineTitleInput" class="filter-input">
                        </div>
                        <div class="form-group">
                            <label>Descripción</label>
                            <textarea id="atencionOnlineDescInput" rows="2" class="filter-input"></textarea>
                        </div>
                    </div>
                    
                    <div style="border: 1px solid var(--gris-claro); padding: 20px; border-radius: 16px;">
                        <h3 style="color: var(--verde-azulado-profundo); margin-bottom: 15px;">Presencial</h3>
                        <div class="form-group">
                            <label>Título</label>
                            <input type="text" id="atencionPresencialTitleInput" class="filter-input">
                        </div>
                        <div class="form-group">
                            <label>Descripción</label>
                            <textarea id="atencionPresencialDescInput" rows="2" class="filter-input"></textarea>
                        </div>
                    </div>
                    
                    <div style="border: 1px solid var(--gris-claro); padding: 20px; border-radius: 16px;">
                        <h3 style="color: var(--verde-azulado-profundo); margin-bottom: 15px;">Pareja</h3>
                        <div class="form-group">
                            <label>Título</label>
                            <input type="text" id="atencionParejaTitleInput" class="filter-input">
                        </div>
                        <div class="form-group">
                            <label>Descripción</label>
                            <textarea id="atencionParejaDescInput" rows="2" class="filter-input"></textarea>
                        </div>
                    </div>
                    
                    <div style="border: 1px solid var(--gris-claro); padding: 20px; border-radius: 16px;">
                        <h3 style="color: var(--verde-azulado-profundo); margin-bottom: 15px;">Familiar</h3>
                        <div class="form-group">
                            <label>Título</label>
                            <input type="text" id="atencionFamiliarTitleInput" class="filter-input">
                        </div>
                        <div class="form-group">
                            <label>Descripción</label>
                            <textarea id="atencionFamiliarDescInput" rows="2" class="filter-input"></textarea>
                        </div>
                    </div>
                </div>
                
                <div style="display:flex; gap:15px; margin-top: 30px;">
                    <button class="btn-staff" style="background:var(--verde-exito); flex:1;" onclick="saveAtencionTexts()">Guardar</button>
                    <button class="btn-staff" style="background:var(--gris-oscuro); flex:0.5;" onclick="document.getElementById('atencionModal').style.display='none'">Cancelar</button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Cargar datos actuales
    const onlineTitle = document.getElementById('atencionOnlineTitleInput');
    const onlineDesc = document.getElementById('atencionOnlineDescInput');
    const presencialTitle = document.getElementById('atencionPresencialTitleInput');
    const presencialDesc = document.getElementById('atencionPresencialDescInput');
    const parejaTitle = document.getElementById('atencionParejaTitleInput');
    const parejaDesc = document.getElementById('atencionParejaDescInput');
    const familiarTitle = document.getElementById('atencionFamiliarTitleInput');
    const familiarDesc = document.getElementById('atencionFamiliarDescInput');
    
    if (onlineTitle) onlineTitle.value = atencionTexts.online?.title || 'Online';
    if (onlineDesc) onlineDesc.value = atencionTexts.online?.description || '';
    if (presencialTitle) presencialTitle.value = atencionTexts.presencial?.title || 'Presencial';
    if (presencialDesc) presencialDesc.value = atencionTexts.presencial?.description || '';
    if (parejaTitle) parejaTitle.value = atencionTexts.pareja?.title || 'Pareja';
    if (parejaDesc) parejaDesc.value = atencionTexts.pareja?.description || '';
    if (familiarTitle) familiarTitle.value = atencionTexts.familiar?.title || 'Familiar';
    if (familiarDesc) familiarDesc.value = atencionTexts.familiar?.description || '';
    
    const modal = document.getElementById('atencionModal');
    if (modal) modal.style.display = 'flex';
}

export function saveAtencionTexts() {
    const onlineTitle = document.getElementById('atencionOnlineTitleInput');
    const onlineDesc = document.getElementById('atencionOnlineDescInput');
    const presencialTitle = document.getElementById('atencionPresencialTitleInput');
    const presencialDesc = document.getElementById('atencionPresencialDescInput');
    const parejaTitle = document.getElementById('atencionParejaTitleInput');
    const parejaDesc = document.getElementById('atencionParejaDescInput');
    const familiarTitle = document.getElementById('atencionFamiliarTitleInput');
    const familiarDesc = document.getElementById('atencionFamiliarDescInput');
    
    atencionTexts = {
        online: {
            title: onlineTitle?.value || 'Online',
            description: onlineDesc?.value || 'Sesiones por videollamada desde la comodidad de tu hogar'
        },
        presencial: {
            title: presencialTitle?.value || 'Presencial',
            description: presencialDesc?.value || 'Atención en nuestro consultorio con todos los protocolos'
        },
        pareja: {
            title: parejaTitle?.value || 'Pareja',
            description: parejaDesc?.value || 'Terapia para fortalecer vínculos y mejorar la comunicación'
        },
        familiar: {
            title: familiarTitle?.value || 'Familiar',
            description: familiarDesc?.value || 'Espacio de diálogo y crecimiento para toda la familia'
        }
    };
    
    db.ref('AtencionTexts').set(atencionTexts);
    updateAtencionSection();
    
    const modal = document.getElementById('atencionModal');
    if (modal) modal.style.display = 'none';
    
    showToast('Tipos de atención actualizados', 'success');
}

// ============================================
// 🆕 FUNCIONES PARA SECCIÓN CONTACTO (con actualización del footer)
// ============================================

/**
 * Actualiza los elementos del footer con la información de contacto actual.
 */
function updateFooterFromContactInfo() {
    const footerPhone = document.getElementById('footerPhone');
    const footerEmail = document.getElementById('footerEmail');
    const footerAddress = document.getElementById('footerAddress');

    if (footerPhone) footerPhone.innerText = contactInfo.phone || '+56 9 1234 5678';
    if (footerEmail) footerEmail.innerText = contactInfo.email || 'vinculosalud@gmail.com';
    if (footerAddress) footerAddress.innerText = contactInfo.address || 'Ohiggins 263, Concepción';
    
    console.log('📞 Footer actualizado con:', {
        phone: contactInfo.phone,
        email: contactInfo.email,
        address: contactInfo.address
    });
}

export function cargarContactInfo() {
    db.ref('ContactInfo').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            contactInfo = data;
        }
        updateContactSection();
        updateFooterFromContactInfo(); // 🔥 Sincroniza el footer
    });
}

export function updateContactSection() {
    const contactEmail = document.getElementById('contactEmailDisplay');
    const contactPhone = document.getElementById('contactPhoneDisplay');
    const contactAddress = document.getElementById('contactAddressDisplay');
    
    if (contactEmail) contactEmail.innerText = contactInfo.email || 'vinculosalud@gmail.com';
    if (contactPhone) contactPhone.innerText = contactInfo.phone || '+56 9 1234 5678';
    if (contactAddress) contactAddress.innerText = contactInfo.address || 'Ohiggins 263, Concepción';
    
    // También actualizamos el footer aquí por si se llama directamente
    updateFooterFromContactInfo();
}

export function showContactModal() {
    // Crear modal si no existe
    if (!document.getElementById('contactModal')) {
        const modalHTML = `
        <div id="contactModal" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <span class="modal-close" onclick="document.getElementById('contactModal').style.display='none'">&times;</span>
                <h2 style="margin-bottom: 25px;">📝 Editar Información de Contacto</h2>
                
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="contactEmailInput" class="filter-input" placeholder="vinculosalud@gmail.com">
                </div>
                
                <div class="form-group">
                    <label>Teléfono</label>
                    <input type="text" id="contactPhoneInput" class="filter-input" placeholder="+56 9 1234 5678">
                </div>
                
                <div class="form-group">
                    <label>Dirección</label>
                    <input type="text" id="contactAddressInput" class="filter-input" placeholder="Av. Principal 123, Santiago">
                </div>
                
                <div style="display:flex; gap:15px;">
                    <button class="btn-staff" style="background:var(--verde-exito); flex:1;" onclick="saveContactInfo()">Guardar</button>
                    <button class="btn-staff" style="background:var(--gris-oscuro); flex:0.5;" onclick="document.getElementById('contactModal').style.display='none'">Cancelar</button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Cargar datos actuales
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
    
    db.ref('ContactInfo').set(contactInfo);
    updateContactSection();        // Actualiza sección contacto y footer
    updateFooterFromContactInfo(); // Doble actualización por seguridad
    
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

    // Elementos básicos que siempre deben existir
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

    // Asignar valores solo si los elementos existen
    if (myName) myName.value = psych.name || '';
    if (myEmail) myEmail.value = psych.email || '';

    // Cargar especialidades en el selector múltiple
    if (mySpecialtiesSelect) {
        // Limpiar opciones actuales
        mySpecialtiesSelect.innerHTML = '';
        
        // Cargar todas las especialidades desde state.specialties
        if (state.specialties && state.specialties.length > 0) {
            state.specialties.forEach(spec => {
                const option = document.createElement('option');
                option.value = spec.name;
                option.textContent = spec.name;
                mySpecialtiesSelect.appendChild(option);
            });
            
            // Preseleccionar las que ya tiene el psicólogo
            const psicologoSpecs = Array.isArray(psych.spec) ? psych.spec : [psych.spec];
            Array.from(mySpecialtiesSelect.options).forEach(option => {
                if (psicologoSpecs.includes(option.value)) {
                    option.selected = true;
                }
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

    // Mostrar estadísticas del psicólogo
    mostrarEstadisticasPsicologo(psych.id);

    console.log('✅ Configuración cargada');
}

// ============================================
// FUNCIONES PARA ESTADÍSTICAS PERSONALES
// ============================================

function mostrarEstadisticasPsicologo(psychId) {
    const statsContainer = document.getElementById('psychStatsContainer');
    if (!statsContainer) return;

    // Obtener pacientes del psicólogo
    const misPacientes = state.patients.filter(p => p.psychId == psychId);
    const misPatientIds = misPacientes.map(p => p.id);

    // Obtener citas
    const misCitas = state.appointments.filter(a => a.psychId == psychId);
    const citasPagadas = misCitas.filter(a => a.paymentStatus === 'pagado');
    
    // Estadísticas de fichas clínicas
    const fichasIngreso = state.fichasIngreso.filter(f => misPatientIds.includes(f.patientId));
    const sesiones = state.sesiones.filter(s => misPatientIds.includes(s.patientId));
    const informes = state.informes.filter(i => misPatientIds.includes(i.patientId));

    // Calcular ingresos
    const ingresosTotales = citasPagadas.reduce((sum, a) => sum + (a.price || 0), 0);
    const ingresosMes = citasPagadas
        .filter(a => {
            const fecha = new Date(a.date);
            const ahora = new Date();
            return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
        })
        .reduce((sum, a) => sum + (a.price || 0), 0);

    // Renderizar estadísticas
    statsContainer.innerHTML = `
        <div class="stats-container" style="margin: 20px 0;">
            <h4 style="margin-bottom: 15px; color: var(--texto-principal); font-size: 1.2rem;">📊 Mis Estadísticas</h4>
            
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                <div class="stat-box" style="background: white; padding: 20px; border-radius: 20px; text-align: center; border: 1px solid var(--gris-claro);">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--primario);">${misPacientes.length}</div>
                    <div style="font-size: 0.8rem; color: var(--texto-secundario); text-transform: uppercase;">Pacientes</div>
                </div>
                
                <div class="stat-box" style="background: white; padding: 20px; border-radius: 20px; text-align: center; border: 1px solid var(--gris-claro);">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--exito);">${sesiones.length}</div>
                    <div style="font-size: 0.8rem; color: var(--texto-secundario); text-transform: uppercase;">Sesiones</div>
                </div>
                
                <div class="stat-box" style="background: white; padding: 20px; border-radius: 20px; text-align: center; border: 1px solid var(--gris-claro);">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--atencion);">${fichasIngreso.length}</div>
                    <div style="font-size: 0.8rem; color: var(--texto-secundario); text-transform: uppercase;">Fichas</div>
                </div>
                
                <div class="stat-box" style="background: white; padding: 20px; border-radius: 20px; text-align: center; border: 1px solid var(--gris-claro);">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--box-color);">${informes.length}</div>
                    <div style="font-size: 0.8rem; color: var(--texto-secundario); text-transform: uppercase;">Informes</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                <div style="background: linear-gradient(135deg, var(--primario), var(--primario-hover)); padding: 20px; border-radius: 20px; color: white;">
                    <div style="font-size: 0.9rem; opacity: 0.9;">Ingresos Totales</div>
                    <div style="font-size: 1.8rem; font-weight: 700;">$${ingresosTotales.toLocaleString()}</div>
                </div>
                
                <div style="background: linear-gradient(135deg, var(--primario), var(--primario-hover)); padding: 20px; border-radius: 20px; color: white;">
                    <div style="font-size: 0.9rem; opacity: 0.9;">Ingresos este Mes</div>
                    <div style="font-size: 1.8rem; font-weight: 700;">$${ingresosMes.toLocaleString()}</div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// FUNCIÓN PARA ACTUALIZAR TODOS LOS DATOS DE PERSONALIZACIÓN
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
    cargarContactInfo(); // Ya incluye updateFooterFromContactInfo internamente
    cargarInstagramData();
    
    // 🔥 NUEVO: Forzar actualización del footer después de cargar todo
    setTimeout(() => {
        updateFooterFromContactInfo();
        console.log('✅ Footer sincronizado con datos de contacto');
    }, 500);
    
    console.log('✅ Personalización cargada');
}

// ============================================
// FUNCIÓN PARA FORZAR ACTUALIZACIÓN DEL FOOTER (DEBUG)
// ============================================

export function forceUpdateFooter() {
    console.log('🔧 Forzando actualización del footer...');
    updateFooterFromContactInfo();
    showToast('Footer actualizado', 'success');
}

// ============================================
// CONFIGURACIÓN PERSONAL (guardar)
// ============================================

export function saveMyConfig() {
    console.log('💾 Guardando configuración personal...');
    
    if (!state.currentUser?.data) {
        console.log('⚠️ No hay usuario logueado');
        showToast('Error: No hay sesión activa', 'error');
        return;
    }
    
    const psych = state.currentUser.data;

    // Obtener referencias a los campos del formulario
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

    // Asignar valores (si los campos existen)
    if (myName) psych.name = myName.value;
    if (myEmail) psych.email = myEmail.value;
    
    // Guardar especialidades seleccionadas
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

    // Métodos de pago (solo si existen)
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

    // Actualizar en el array de staff
    const staffIndex = state.staff.findIndex(s => s.id == psych.id);
    if (staffIndex !== -1) {
        state.staff[staffIndex] = psych;
        console.log('✅ Psicólogo actualizado en staff');
    } else {
        console.warn('⚠️ Psicólogo no encontrado en staff');
    }

    // Guardar en Firebase
    import('../main.js').then(main => {
        main.save();
        console.log('✅ Configuración guardada en Firebase');
        showToast('Configuración guardada', 'success');
        
        // Actualizar estadísticas
        mostrarEstadisticasPsicologo(psych.id);
    }).catch(err => {
        console.error('❌ Error al guardar:', err);
        showToast('Error al guardar la configuración', 'error');
    });
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

export function getRecentPatientsWithSessions(psychId, limit = 5) {
    const misPacientes = state.patients.filter(p => p.psychId == psychId);
    
    return misPacientes
        .map(patient => {
            const sesiones = state.sesiones
                .filter(s => s.patientId == patient.id)
                .sort((a, b) => new Date(b.fechaAtencion) - new Date(a.fechaAtencion));
            
            return {
                ...patient,
                ultimaSesion: sesiones.length > 0 ? sesiones[0] : null,
                totalSesiones: sesiones.length,
                tieneFichaIngreso: state.fichasIngreso.some(f => f.patientId == patient.id)
            };
        })
        .sort((a, b) => {
            if (!a.ultimaSesion) return 1;
            if (!b.ultimaSesion) return -1;
            return new Date(b.ultimaSesion.fechaAtencion) - new Date(a.ultimaSesion.fechaAtencion);
        })
        .slice(0, limit);
}

export function exportMyConfig() {
    if (!state.currentUser?.data) return null;
    
    const psych = state.currentUser.data;
    
    return {
        personal: {
            nombre: psych.name,
            email: psych.email,
            especialidades: psych.spec,
            whatsapp: psych.whatsapp,
            instagram: psych.instagram
        },
        precios: {
            online: psych.priceOnline,
            presencial: psych.pricePresencial
        },
        bancarios: psych.bankDetails || {},
        metodosPago: psych.paymentMethods || state.globalPaymentMethods,
        estadisticas: {
            totalPacientes: state.patients.filter(p => p.psychId == psych.id).length,
            totalSesiones: state.sesiones.filter(s => {
                const patient = state.patients.find(p => p.id == s.patientId);
                return patient && patient.psychId == psych.id;
            }).length
        }
    };
}

// ============================================
// EXPORTAR FUNCIONES AL OBJETO WINDOW
// ============================================
if (typeof window !== 'undefined') {
    window.getRecentPatientsWithSessions = getRecentPatientsWithSessions;
    window.exportMyConfig = exportMyConfig;
    window.cargarTodaPersonalizacion = cargarTodaPersonalizacion;
    window.forceUpdateFooter = forceUpdateFooter; // 🆕 NUEVO
    
    // Funciones para secciones editables
    window.showAboutModal = showAboutModal;
    window.uploadAboutImage = uploadAboutImage;
    window.saveAboutTexts = saveAboutTexts;
    window.showAtencionModal = showAtencionModal;
    window.saveAtencionTexts = saveAtencionTexts;
    window.showContactModal = showContactModal;
    window.saveContactInfo = saveContactInfo;
    
    // 🆕 Funciones para Instagram
    window.showInstagramModal = showInstagramModal;
    window.uploadInstagramImage = uploadInstagramImage;
    window.saveInstagramData = saveInstagramData;
    window.cargarInstagramData = cargarInstagramData;
    
    // Funciones de configuración personal
    window.loadMyConfig = loadMyConfig;
    window.saveMyConfig = saveMyConfig;
}

console.log('✅ personalizacion.js cargado con estadísticas de fichas clínicas, secciones editables, SECCIÓN INSTAGRAM y FOOTER SINCRONIZADO v3.0');