// js/modules/personalizacion.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast } from './utils.js';

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
        mercadopago: document.getElementById('globalMercadoPago').checked,
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
        import('./main.js').then(main => main.save());
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
// CONFIGURACIÓN PERSONAL DEL PSICÓLOGO
// ============================================

export function loadMyConfig() {
    if (!state.currentUser?.data) return;
    const psych = state.currentUser.data;

    document.getElementById('myName').value = psych.name || '';
    document.getElementById('myEmail').value = psych.email || '';

    const mySpecialtiesDiv = document.getElementById('mySpecialties');
    if (mySpecialtiesDiv) {
        const specs = Array.isArray(psych.spec) ? psych.spec : [psych.spec];
        mySpecialtiesDiv.innerHTML = specs.map(s => `<span class="specialty-tag">${s}</span>`).join('');
    }

    document.getElementById('myPriceOnline').value = psych.priceOnline || '';
    document.getElementById('myPricePresencial').value = psych.pricePresencial || '';
    document.getElementById('myWhatsapp').value = psych.whatsapp || '';
    document.getElementById('myInstagram').value = psych.instagram || '';

    const bank = psych.bankDetails || {};
    document.getElementById('myBank').value = bank.bank || '';
    document.getElementById('myAccountType').value = bank.accountType || 'corriente';
    document.getElementById('myAccountNumber').value = bank.accountNumber || '';
    document.getElementById('myBankRut').value = bank.rut || '';
    document.getElementById('myBankEmail').value = bank.email || '';

    const methods = psych.paymentMethods || state.globalPaymentMethods;
    document.getElementById('myTransfer').checked = methods.transfer !== false;
    document.getElementById('myCardPresencial').checked = methods.cardPresencial !== false;
    document.getElementById('myCardOnline').checked = methods.cardOnline || false;
    document.getElementById('myCash').checked = methods.cash !== false;
    document.getElementById('myMercadoPago').checked = methods.mercadopago || false;
    document.getElementById('myWebpay').checked = methods.webpay || false;
}

export function saveMyConfig() {
    if (!state.currentUser?.data) return;
    const psych = state.currentUser.data;

    psych.priceOnline = parseInt(document.getElementById('myPriceOnline').value);
    psych.pricePresencial = parseInt(document.getElementById('myPricePresencial').value);
    psych.whatsapp = document.getElementById('myWhatsapp').value;
    psych.instagram = document.getElementById('myInstagram').value;

    psych.bankDetails = {
        bank: document.getElementById('myBank').value,
        accountType: document.getElementById('myAccountType').value,
        accountNumber: document.getElementById('myAccountNumber').value,
        rut: document.getElementById('myBankRut').value,
        email: document.getElementById('myBankEmail').value
    };

    psych.paymentMethods = {
        transfer: document.getElementById('myTransfer').checked,
        cardPresencial: document.getElementById('myCardPresencial').checked,
        cardOnline: document.getElementById('myCardOnline').checked,
        cash: document.getElementById('myCash').checked,
        mercadopago: document.getElementById('myMercadoPago').checked,
        webpay: document.getElementById('myWebpay').checked
    };

    const staffIndex = state.staff.findIndex(s => s.id == psych.id);
    if (staffIndex !== -1) state.staff[staffIndex] = psych;

    import('./main.js').then(main => main.save());
    showToast('Configuración guardada', 'success');
}