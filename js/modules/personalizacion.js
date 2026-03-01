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
// CONFIGURACIÓN PERSONAL DEL PSICÓLOGO (CORREGIDA)
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
    const mySpecialties = document.getElementById('mySpecialties');
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

    if (mySpecialties) {
        const specs = Array.isArray(psych.spec) ? psych.spec : [psych.spec];
        mySpecialties.innerHTML = specs.map(s => `<span class="specialty-tag">${s}</span>`).join('');
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

    // Métodos de pago (pueden no existir en el HTML)
    const methods = psych.paymentMethods || state.globalPaymentMethods;
    
    // Verificar cada elemento antes de asignar
    const myTransfer = document.getElementById('myTransfer');
    const myCardPresencial = document.getElementById('myCardPresencial');
    const myCardOnline = document.getElementById('myCardOnline');
    const myCash = document.getElementById('myCash');
    const myMercadoPago = document.getElementById('myMercadoPago');
    const myWebpay = document.getElementById('myWebpay');

    if (myTransfer) myTransfer.checked = methods.transfer !== false;
    if (myCardPresencial) myCardPresencial.checked = methods.cardPresencial !== false;
    if (myCardOnline) myCardOnline.checked = methods.cardOnline || false;
    if (myCash) myCash.checked = methods.cash !== false;
    if (myMercadoPago) myMercadoPago.checked = methods.mercadopago || false;
    if (myWebpay) myWebpay.checked = methods.webpay || false;

    console.log('✅ Configuración cargada');
}

export function saveMyConfig() {
    console.log('💾 Guardando configuración personal...');
    
    if (!state.currentUser?.data) {
        console.log('⚠️ No hay usuario logueado');
        showToast('Error: No hay sesión activa', 'error');
        return;
    }
    
    const psych = state.currentUser.data;

    // Solo guardar si los elementos existen
    const myPriceOnline = document.getElementById('myPriceOnline');
    const myPricePresencial = document.getElementById('myPricePresencial');
    const myWhatsapp = document.getElementById('myWhatsapp');
    const myInstagram = document.getElementById('myInstagram');
    const myBank = document.getElementById('myBank');
    const myAccountType = document.getElementById('myAccountType');
    const myAccountNumber = document.getElementById('myAccountNumber');
    const myBankRut = document.getElementById('myBankRut');
    const myBankEmail = document.getElementById('myBankEmail');

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
    }).catch(err => {
        console.error('❌ Error al guardar:', err);
        showToast('Error al guardar la configuración', 'error');
    });
}