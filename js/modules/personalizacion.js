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
    email: 'contacto@vinculosalud.cl',
    phone: '+56 9 1234 5678',
    address: 'Av. Principal 123, Santiago'
};

// 🆕 NUEVA VARIABLE PARA SECCIÓN INSTAGRAM
export let instagramData = {
    title: 'Sigue Nuestro Instagram',
    subtitle: 'VÍNCULO',
    quote: '<strong>"SOLO HABLAMOS"</strong><br>JAVIERA TIENE EL ÉXITO,<br>pero no tiene con quién celebrarlo.',
    text: 'Detente aquí un segundo',
    message: 'Esto también se aprende.',
    link: 'https://instagram.com/vinculosalud',
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
            if (state.logoImage.url) {
                document.getElementById('headerLogo').src = state.logoImage.url;
                document.getElementById('headerLogo').style.display = 'inline-block';
            } else {
                document.getElementById('headerLogo').style.display = 'none';
            }
            document.getElementById('headerLogoText').style.display = 'inline-block';
            document.getElementById('headerLogoText').innerText = state.logoImage.text || 'Vínculo Salud';
        } else {
            document.getElementById('headerLogo').style.display = 'none';
            document.getElementById('headerLogoText').style.display = 'inline-block';
            document.getElementById('headerLogoText').innerText = 'Vínculo Salud';
        }
    });
}

export function showLogoModal() {
    document.getElementById('logoModal').style.display = 'flex';
    document.getElementById('logoText').value = state.logoImage.text || 'Vínculo Salud';
    if (state.logoImage.url) {
        document.getElementById('logoPreview').src = state.logoImage.url;
        document.getElementById('logoPreview').style.display = 'block';
    }
}

export function closeLogoModal() {
    document.getElementById('logoModal').style.display = 'none';
    state.setTempLogoData(null);
}

export function previewLogo(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('logoPreview').src = e.target.result;
            document.getElementById('logoPreview').style.display = 'block';
            state.setTempLogoData(e.target.result);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

export function saveLogo() {
    const newLogo = { ...state.logoImage, text: document.getElementById('logoText').value || 'Vínculo Salud' };
    if (state.tempLogoData) {
        newLogo.url = state.tempLogoData;
    }
    state.setLogoImage(newLogo);
    db.ref('LogoImage').set(state.logoImage);

    if (state.logoImage.url) {
        document.getElementById('headerLogo').src = state.logoImage.url;
        document.getElementById('headerLogo').style.display = 'inline-block';
    } else {
        document.getElementById('headerLogo').style.display = 'none';
    }
    document.getElementById('headerLogoText').style.display = 'inline-block';
    document.getElementById('headerLogoText').innerText = state.logoImage.text;

    closeLogoModal();
    showToast('Logo guardado correctamente', 'success');
}

export function removeLogo() {
    if (confirm('¿Eliminar el logo?')) {
        state.setLogoImage({ url: '', text: document.getElementById('logoText').value || 'Vínculo Salud' });
        db.ref('LogoImage').set(state.logoImage);
        document.getElementById('headerLogo').style.display = 'none';
        document.getElementById('headerLogoText').style.display = 'inline-block';
        document.getElementById('headerLogoText').innerText = state.logoImage.text;
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
            document.getElementById('heroTitleDisplay').innerHTML = state.heroTexts.title.replace(/\n/g, '<br>');
            document.getElementById('heroSubtitleDisplay').innerText = state.heroTexts.subtitle;
        }
    });
}

export function showTextsModal() {
    document.getElementById('textsModal').style.display = 'flex';
    document.getElementById('heroTitle').value = state.heroTexts.title;
    document.getElementById('heroSubtitle').value = state.heroTexts.subtitle;
}

export function closeTextsModal() {
    document.getElementById('textsModal').style.display = 'none';
}

export function saveHeroTexts() {
    state.setHeroTexts({
        title: document.getElementById('heroTitle').value,
        subtitle: document.getElementById('heroSubtitle').value
    });
    db.ref('HeroTexts').set(state.heroTexts);
    document.getElementById('heroTitleDisplay').innerHTML = state.heroTexts.title.replace(/\n/g, '<br>');
    document.getElementById('heroSubtitleDisplay').innerText = state.heroTexts.subtitle;
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
    document.getElementById('backgroundImageModal').style.display = 'flex';
    document.getElementById('backgroundOpacity').value = state.backgroundImage.opacity || 10;
    document.getElementById('opacityValue').innerText = (state.backgroundImage.opacity || 10) + '%';
    if (state.backgroundImage.url) {
        document.getElementById('backgroundPreview').src = state.backgroundImage.url;
        document.getElementById('backgroundPreview').style.display = 'block';
    }
}

export function closeBackgroundImageModal() {
    document.getElementById('backgroundImageModal').style.display = 'none';
    state.setTempBackgroundImageData(null);
}

export function previewBackgroundImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('backgroundPreview').src = e.target.result;
            document.getElementById('backgroundPreview').style.display = 'block';
            state.setTempBackgroundImageData(e.target.result);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

export function updateBackgroundOpacity() {
    const opacity = document.getElementById('backgroundOpacity').value;
    document.getElementById('opacityValue').innerText = opacity + '%';
    if (state.backgroundImage.url) {
        document.body.style.backgroundImage = `url('${state.backgroundImage.url}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.opacity = opacity / 100;
    }
}

export function saveBackgroundImage() {
    const newBg = { ...state.backgroundImage };
    if (state.tempBackgroundImageData) {
        newBg.url = state.tempBackgroundImageData;
    }
    newBg.opacity = parseInt(document.getElementById('backgroundOpacity').value);
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
    document.getElementById('paymentMethodsModal').style.display = 'flex';
    document.getElementById('globalTransfer').checked = state.globalPaymentMethods.transfer;
    document.getElementById('globalCardPresencial').checked = state.globalPaymentMethods.cardPresencial;
    document.getElementById('globalCardOnline').checked = state.globalPaymentMethods.cardOnline;
    document.getElementById('globalCash').checked = state.globalPaymentMethods.cash;
    document.getElementById('globalMercadoPago').checked = state.globalPaymentMethods.mercadopago;
    document.getElementById('globalWebpay').checked = state.globalPaymentMethods.webpay;
}

export function closePaymentMethodsModal() {
    document.getElementById('paymentMethodsModal').style.display = 'none';
}

export function saveGlobalPaymentMethods() {
    state.setGlobalPaymentMethods({
        transfer: document.getElementById('globalTransfer').checked,
        cardPresencial: document.getElementById('globalCardPresencial').checked,
        cardOnline: document.getElementById('globalCardOnline').checked,
        cash: document.getElementById('globalCash').checked,
        mercadopago: document.getElementById('globalMercadopago').checked,
        webpay: document.getElementById('globalWebpay').checked
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

    if (addSpecSelect) {
        addSpecSelect.innerHTML = state.specialties.map(s => 
            `<option value="${s.name}">${s.name}</option>`
        ).join('');
    }

    if (editSpecSelect) {
        editSpecSelect.innerHTML = state.specialties.map(s => 
            `<option value="${s.name}">${s.name}</option>`
        ).join('');
    }

    if (specialtyFilter) {
        specialtyFilter.innerHTML = '<option value="">🏷️ Todas las especialidades</option>' +
            state.specialties.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
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
    document.getElementById('specialtiesModal').style.display = 'flex';
    document.getElementById('newSpecialty').value = '';
    renderAllSpecialties();
}

export function closeSpecialtiesModal() {
    document.getElementById('specialtiesModal').style.display = 'none';
}

export function addSpecialty() {
    const name = document.getElementById('newSpecialty').value.trim();
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
    document.getElementById('newSpecialty').value = '';
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
    
    if (imageEl && instagramData.image) {
        imageEl.src = instagramData.image;
        imageEl.style.display = 'block';
    } else if (imageEl) {
        imageEl.style.display = 'none';
    }
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
                    <input type="url" id="instagramLinkInput" class="filter-input" placeholder="https://instagram.com/vinculosalud">
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
    document.getElementById('instagramTitleInput').value = instagramData.title;
    document.getElementById('instagramSubtitleInput').value = instagramData.subtitle;
    document.getElementById('instagramQuoteInput').value = instagramData.quote;
    document.getElementById('instagramTextInput').value = instagramData.text;
    document.getElementById('instagramMessageInput').value = instagramData.message;
    document.getElementById('instagramLinkInput').value = instagramData.link;
    
    if (instagramData.image) {
        document.getElementById('instagramImagePreview').src = instagramData.image;
        document.getElementById('instagramImagePreview').style.display = 'block';
    } else {
        document.getElementById('instagramImagePreview').style.display = 'none';
    }
    
    document.getElementById('instagramModal').style.display = 'flex';
}

export function uploadInstagramImage() {
    const input = document.getElementById('instagramImageInput');
    if (!input.files || !input.files[0]) return;
    
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
    instagramData = {
        title: document.getElementById('instagramTitleInput').value,
        subtitle: document.getElementById('instagramSubtitleInput').value,
        quote: document.getElementById('instagramQuoteInput').value,
        text: document.getElementById('instagramTextInput').value,
        message: document.getElementById('instagramMessageInput').value,
        link: document.getElementById('instagramLinkInput').value,
        image: instagramData.image // Mantener la imagen actual
    };
    
    db.ref('InstagramData').set(instagramData);
    updateInstagramSection();
    
    document.getElementById('instagramModal').style.display = 'none';
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
    document.getElementById('teamText').value = aboutTeamText;
    document.getElementById('missionText').value = missionText;
    document.getElementById('visionText').value = visionText;
    
    if (aboutImage) {
        document.getElementById('aboutImagePreview').src = aboutImage;
        document.getElementById('aboutImagePreview').style.display = 'block';
    }
    
    document.getElementById('aboutModal').style.display = 'flex';
}

export function uploadAboutImage() {
    const input = document.getElementById('aboutImageInput');
    if (!input.files || !input.files[0]) return;
    
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
    const teamText = document.getElementById('teamText')?.value;
    const mission = document.getElementById('missionText')?.value;
    const vision = document.getElementById('visionText')?.value;
    const imagePreview = document.getElementById('aboutImagePreview')?.src;
    
    // Actualizar variables
    if (teamText) aboutTeamText = teamText;
    if (mission) missionText = mission;
    if (vision) visionText = vision;
    if (imagePreview && imagePreview.startsWith('data:image')) {
        aboutImage = imagePreview;
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
    
    document.getElementById('aboutModal').style.display = 'none';
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
    document.getElementById('atencionOnlineTitleInput').value = atencionTexts.online?.title || 'Online';
    document.getElementById('atencionOnlineDescInput').value = atencionTexts.online?.description || '';
    document.getElementById('atencionPresencialTitleInput').value = atencionTexts.presencial?.title || 'Presencial';
    document.getElementById('atencionPresencialDescInput').value = atencionTexts.presencial?.description || '';
    document.getElementById('atencionParejaTitleInput').value = atencionTexts.pareja?.title || 'Pareja';
    document.getElementById('atencionParejaDescInput').value = atencionTexts.pareja?.description || '';
    document.getElementById('atencionFamiliarTitleInput').value = atencionTexts.familiar?.title || 'Familiar';
    document.getElementById('atencionFamiliarDescInput').value = atencionTexts.familiar?.description || '';
    
    document.getElementById('atencionModal').style.display = 'flex';
}

export function saveAtencionTexts() {
    atencionTexts = {
        online: {
            title: document.getElementById('atencionOnlineTitleInput').value,
            description: document.getElementById('atencionOnlineDescInput').value
        },
        presencial: {
            title: document.getElementById('atencionPresencialTitleInput').value,
            description: document.getElementById('atencionPresencialDescInput').value
        },
        pareja: {
            title: document.getElementById('atencionParejaTitleInput').value,
            description: document.getElementById('atencionParejaDescInput').value
        },
        familiar: {
            title: document.getElementById('atencionFamiliarTitleInput').value,
            description: document.getElementById('atencionFamiliarDescInput').value
        }
    };
    
    db.ref('AtencionTexts').set(atencionTexts);
    updateAtencionSection();
    
    document.getElementById('atencionModal').style.display = 'none';
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
    if (footerEmail) footerEmail.innerText = contactInfo.email || 'contacto@vinculosalud.cl';
    if (footerAddress) footerAddress.innerText = contactInfo.address || 'Av. Principal 123, Santiago';
}

export function cargarContactInfo() {
    db.ref('ContactInfo').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            contactInfo = data;
        }
        updateContactSection();
        updateFooterFromContactInfo(); // 🔥 NUEVO: Sincroniza el footer
    });
}

export function updateContactSection() {
    const contactEmail = document.getElementById('contactEmailDisplay');
    const contactPhone = document.getElementById('contactPhoneDisplay');
    const contactAddress = document.getElementById('contactAddressDisplay');
    
    if (contactEmail) contactEmail.innerText = contactInfo.email || 'contacto@vinculosalud.cl';
    if (contactPhone) contactPhone.innerText = contactInfo.phone || '+56 9 1234 5678';
    if (contactAddress) contactAddress.innerText = contactInfo.address || 'Av. Principal 123, Santiago';
    
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
                    <input type="email" id="contactEmailInput" class="filter-input" placeholder="contacto@vinculosalud.cl">
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
    document.getElementById('contactEmailInput').value = contactInfo.email || '';
    document.getElementById('contactPhoneInput').value = contactInfo.phone || '';
    document.getElementById('contactAddressInput').value = contactInfo.address || '';
    
    document.getElementById('contactModal').style.display = 'flex';
}

export function saveContactInfo() {
    contactInfo = {
        email: document.getElementById('contactEmailInput').value,
        phone: document.getElementById('contactPhoneInput').value,
        address: document.getElementById('contactAddressInput').value
    };
    
    db.ref('ContactInfo').set(contactInfo);
    updateContactSection();        // Actualiza sección contacto y footer
    updateFooterFromContactInfo(); // Doble actualización por seguridad
    
    document.getElementById('contactModal').style.display = 'none';
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
    console.log('✅ Personalización cargada');
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
}

console.log('✅ personalizacion.js cargado con estadísticas de fichas clínicas, secciones editables, SECCIÓN INSTAGRAM y FOOTER SINCRONIZADO v3.0');