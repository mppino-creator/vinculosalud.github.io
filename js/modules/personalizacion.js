// js/modules/personalizacion.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast } from './utils.js';

// ============================================
// FUNCIONES DE LOGO
// ============================================

export function cargarLogo() {
    db.ref('LogoImage').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            state.logoImage = data;
            if (state.logoImage.url) {
                document.getElementById('headerLogo').src = state.logoImage.url;
                document.getElementById('headerLogo').style.display = 'inline-block';
                document.getElementById('headerLogoText').style.display = 'none';
            } else {
                document.getElementById('headerLogo').style.display = 'none';
                document.getElementById('headerLogoText').style.display = 'inline-block';
                document.getElementById('headerLogoText').innerText = state.logoImage.text || 'Vínculo Salud';
            }
        } else {
            document.getElementById('headerLogo').style.display = 'none';
            document.getElementById('headerLogoText').style.display = 'inline-block';
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
    state.tempLogoData = null;
}

export function previewLogo(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('logoPreview').src = e.target.result;
            document.getElementById('logoPreview').style.display = 'block';
            state.tempLogoData = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

export function saveLogo() {
    state.logoImage.text = document.getElementById('logoText').value || 'Vínculo Salud';
    
    if (state.tempLogoData) {
        state.logoImage.url = state.tempLogoData;
    } else {
        state.logoImage.url = '';
    }
    
    db.ref('LogoImage').set(state.logoImage);
    
    if (state.logoImage.url) {
        document.getElementById('headerLogo').src = state.logoImage.url;
        document.getElementById('headerLogo').style.display = 'inline-block';
        document.getElementById('headerLogoText').style.display = 'none';
    } else {
        document.getElementById('headerLogo').style.display = 'none';
        document.getElementById('headerLogoText').style.display = 'inline-block';
        document.getElementById('headerLogoText').innerText = state.logoImage.text;
    }
    
    closeLogoModal();
    showToast('Logo guardado correctamente', 'success');
}

export function removeLogo() {
    if (confirm('¿Eliminar el logo?')) {
        state.logoImage = { url: '', text: document.getElementById('logoText').value || 'Vínculo Salud' };
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
            state.heroTexts = data;
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
    state.heroTexts = {
        title: document.getElementById('heroTitle').value,
        subtitle: document.getElementById('heroSubtitle').value
    };
    
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
            state.backgroundImage = data;
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
    state.tempBackgroundImageData = null;
}

export function previewBackgroundImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('backgroundPreview').src = e.target.result;
            document.getElementById('backgroundPreview').style.display = 'block';
            state.tempBackgroundImageData = e.target.result;
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
    if (state.tempBackgroundImageData) {
        state.backgroundImage.url = state.tempBackgroundImageData;
    }
    state.backgroundImage.opacity = parseInt(document.getElementById('backgroundOpacity').value);
    
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
        state.backgroundImage = { url: '', opacity: 10 };
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
            state.globalPaymentMethods = data;
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
    state.globalPaymentMethods = {
        transfer: document.getElementById('globalTransfer').checked,
        cardPresencial: document.getElementById('globalCardPresencial').checked,
        cardOnline: document.getElementById('globalCardOnline').checked,
        cash: document.getElementById('globalCash').checked,
        mercadopago: document.getElementById('globalMercadoPago').checked,
        webpay: document.getElementById('globalWebpay').checked
    };
    
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
        mySpecialtiesDiv.innerHTML = specs.map(s => 
            `<span class="specialty-tag">${s}</span>`
        ).join('');
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
    
    // 🔁 Guardar usando la función save de main.js (importación dinámica)
    import('./main.js').then(main => main.save());
    
    showToast('Configuración guardada', 'success');
}