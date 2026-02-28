// ============================================
// CONFIGURACIÓN DE FIREBASE
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyCj5jdc_FQ1H0l78VJj3qBmGYsGrSete3U",
    authDomain: "vinculosaludapp.firebaseapp.com",
    databaseURL: "https://vinculosaludapp-default-rtdb.firebaseio.com",
    projectId: "vinculosaludapp",
    storageBucket: "vinculosaludapp.firebasestorage.app",
    appId: "1:405876668483:web:8f19aef4dd63a70ecdbcf6"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ============================================
// VARIABLES GLOBALES
// ============================================

let staff = [];
let patients = [];
let appointments = [];
let boxes = [];
let messages = [];
let pendingRequests = [];
let specialties = [];
let heroTexts = {
    title: 'Bienestar a tu alcance',
    subtitle: 'Encuentra al profesional ideal y agenda tu sesión'
};
let globalPaymentMethods = {
    transfer: true,
    cardPresencial: true,
    cardOnline: false,
    cash: true,
    mercadopago: false,
    webpay: false
};
let backgroundImage = {
    url: '',
    opacity: 10
};
let logoImage = {
    url: '',
    text: 'Vínculo Salud'
};
let selectedPsych = null;
let currentUser = null;
let currentRating = 5;
let generatedSlots = [];
let selectedWeekdays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];
let selectedBoxId = null;
let selectedTherapistBoxId = null;
let tempImageData = null;
let tempBackgroundImageData = null;
let tempLogoData = null;
let tempQrData = null;
let selectedPatientForTherapist = null;
let dataLoaded = false;
const EDIT_HOURS = 24;

// Recuperar sesión guardada
const savedUser = localStorage.getItem('vinculoCurrentUser');
if (savedUser) {
    try {
        currentUser = JSON.parse(savedUser);
        // Esperar a que los datos carguen y luego mostrar el dashboard
        const checkData = setInterval(() => {
            if (dataLoaded) {
                clearInterval(checkData);
                showDashboard();
            }
        }, 100);
    } catch (e) {
        localStorage.removeItem('vinculoCurrentUser');
    }
}

function getPublicStaff() {
    return staff.filter(s => s.spec && s.spec.length > 0 && !s.isHiddenAdmin);
}

// ============================================
// FUNCIÓN DE TOAST
// ============================================

function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fa ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================
// FUNCIÓN DE FORMATEO DE RUT
// ============================================
function formatRut(input) {
    let value = input.value.replace(/[^0-9kK]/g, '');
    if (value.length <= 1) {
        input.value = value;
        return;
    }

    let rut = value.slice(0, -1);
    let dv = value.slice(-1).toUpperCase();

    rut = rut.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    input.value = `${rut}-${dv}`;
}

// ============================================
// VALIDACIÓN DE RUT
// ============================================
function validarRut(rutCompleto) {
    if (!rutCompleto) return false;
    const rutLimpio = rutCompleto.replace(/[.-]/g, '');
    if (rutLimpio.length < 2) return false;
    
    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1).toUpperCase();
    
    let suma = 0;
    let multiplo = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo.charAt(i)) * multiplo;
        multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }
    const dvEsperado = 11 - (suma % 11);
    const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : String(dvEsperado);
    
    return dvCalculado === dv;
}

// ============================================
// FUNCIÓN DE CORREO (SIMULACIÓN)
// ============================================

function sendEmailNotification(to, subject, message) {
    console.log(`📧 Simulación de correo a: ${to}`);
    console.log(`📧 Asunto: ${subject}`);
    console.log(`📧 Mensaje: ${message}`);
    
    // Mostrar en la interfaz (opcional)
    const emailDiv = document.getElementById('emailSimulation');
    if (emailDiv) {
        emailDiv.innerHTML = `<strong>📧 Correo enviado a ${to}</strong><br>Asunto: ${subject}<br>${message.substring(0, 100)}...`;
        emailDiv.style.display = 'block';
        setTimeout(() => { emailDiv.style.display = 'none'; }, 5000);
    }
    
    showToast(`Correo simulado enviado a ${to}`, 'success');
    return true;
}

// ============================================
// FUNCIONES DE CORREO
// ============================================

function sendAppointmentEmails(appointment, isReminder = false) {
    const patientEmail = appointment.patientEmail;
    const psych = staff.find(s => s.id == appointment.psychId);
    const psychEmail = psych?.email || '';
    
    let subject, message;
    
    if (isReminder) {
        subject = `Recordatorio: Cita con ${appointment.psych} - Mañana`;
        message = `Hola ${appointment.patient},\n\nTe recordamos que tienes una cita MAÑANA con ${appointment.psych}.\n\n📅 Fecha: ${appointment.date}\n⏰ Hora: ${appointment.time}\n💻 Tipo: ${appointment.type === 'online' ? 'Online' : 'Presencial'}${appointment.boxName ? `\n📍 Box: ${appointment.boxName}` : ''}\n📍 Dirección: ${appointment.type === 'presencial' ? (psych?.address || 'Dirección no especificada') : 'El enlace de videollamada se enviará 1 hora antes'}\n\nPor favor, confirma tu asistencia.\n\nVínculo Salud`;
    } else {
        subject = `Confirmación de cita - Vínculo Salud`;
        message = `Hola ${appointment.patient},\n\nTu cita ha sido confirmada con ${appointment.psych}.\n\n📅 Fecha: ${appointment.date}\n⏰ Hora: ${appointment.time}\n💻 Tipo: ${appointment.type === 'online' ? 'Online' : 'Presencial'}${appointment.boxName ? `\n📍 Box: ${appointment.boxName}` : ''}\n📍 Dirección: ${appointment.type === 'presencial' ? (psych?.address || 'Dirección no especificada') : 'El enlace de videollamada se enviará 1 hora antes'}\n\n💳 Método de pago: ${appointment.paymentMethod === 'transfer' ? 'Transferencia bancaria' : appointment.paymentMethod === 'cash' ? 'Efectivo' : appointment.paymentMethod === 'mercadopago' ? 'Mercado Pago' : appointment.paymentMethod === 'webpay' ? 'Webpay' : 'Tarjeta'}\n\nSi necesitas modificar o cancelar tu cita, contáctanos con al menos 24 horas de anticipación.\n\nVínculo Salud`;
    }
    
    if (patientEmail) {
        sendEmailNotification(patientEmail, subject, message);
    }
    
    if (!isReminder && psychEmail) {
        const psychSubject = `Nueva cita confirmada - ${appointment.patient}`;
        const psychMessage = `Hola ${appointment.psych},\n\nSe ha confirmado una nueva cita.\n\nPaciente: ${appointment.patient}\nEmail: ${appointment.patientEmail}\nTeléfono: ${appointment.patientPhone}\n📅 Fecha: ${appointment.date}\n⏰ Hora: ${appointment.time}\n💻 Tipo: ${appointment.type === 'online' ? 'Online' : 'Presencial'}${appointment.boxName ? `\n📍 Box: ${appointment.boxName}` : ''}\n📝 Notas: ${appointment.msg || 'Sin observaciones'}\n\nVínculo Salud`;
        sendEmailNotification(psychEmail, psychSubject, psychMessage);
    }
}

function sendRequestEmail(request) {
    const patientEmail = request.patientEmail;
    const psych = staff.find(s => s.id == request.psychId);
    const psychEmail = psych?.email || '';
    
    if (patientEmail) {
        const patientSubject = `Solicitud de cita recibida - Vínculo Salud`;
        const patientMessage = `Hola ${request.patient},\n\nHemos recibido tu solicitud de cita con ${request.psych}.\n\n📅 Fecha solicitada: ${request.preferredDate}\n⏰ Hora solicitada: ${request.preferredTime}\n💻 Tipo: ${request.type === 'online' ? 'Online' : 'Presencial'}\n\nEl profesional revisará tu solicitud y te confirmará la hora exacta a la brevedad.\n\nPara consultas, puedes contactarnos directamente.\n\nVínculo Salud`;
        sendEmailNotification(patientEmail, patientSubject, patientMessage);
    }
    
    if (psychEmail) {
        const psychSubject = `Nueva solicitud de cita - ${request.patient}`;
        const psychMessage = `Hola ${request.psych},\n\nHas recibido una nueva solicitud de cita.\n\nPaciente: ${request.patient}\nEmail: ${request.patientEmail}\nTeléfono: ${request.patientPhone}\n📅 Fecha solicitada: ${request.preferredDate}\n⏰ Hora solicitada: ${request.preferredTime}\n💻 Tipo: ${request.type === 'online' ? 'Online' : 'Presencial'}\n📝 Motivo: ${request.msg || 'No especificado'}\n\nPor favor, ingresa al sistema para confirmar o reprogramar esta cita.\n\nVínculo Salud`;
        sendEmailNotification(psychEmail, psychSubject, psychMessage);
    }
}

function sendConfirmationEmail(request, appointment) {
    const patientEmail = request.patientEmail;
    const psych = staff.find(s => s.id == appointment.psychId);
    
    if (patientEmail) {
        const subject = `Cita confirmada - Vínculo Salud`;
        const message = `Hola ${request.patient},\n\nTu solicitud de cita ha sido confirmada.\n\n📅 Fecha: ${appointment.date}\n⏰ Hora: ${appointment.time}\n💻 Tipo: ${appointment.type === 'online' ? 'Online' : 'Presencial'}${appointment.boxName ? `\n📍 Box: ${appointment.boxName}` : ''}\n📍 Dirección: ${appointment.type === 'presencial' ? (psych?.address || 'Dirección no especificada') : 'El enlace de videollamada se enviará 1 hora antes'}\n\nPor favor, llega 10 minutos antes de tu hora agendada.\n\nVínculo Salud`;
        sendEmailNotification(patientEmail, subject, message);
    }
}

function sendCancellationEmail(appointment) {
    if (appointment?.patientEmail) {
        const subject = 'Cita cancelada - Vínculo Salud';
        const message = `Hola ${appointment.patient},\n\nTu cita con ${appointment.psych} para el ${appointment.date} a las ${appointment.time} ha sido cancelada.\n\nSi necesitas reagendar, contáctanos.\n\nVínculo Salud`;
        sendEmailNotification(appointment.patientEmail, subject, message);
    }
}

// ============================================
// FUNCIONES DE LOGO (MEJORADAS)
// ============================================

function cargarLogo() {
    db.ref('LogoImage').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            logoImage = data;
            if (logoImage.url) {
                document.getElementById('headerLogo').src = logoImage.url;
                document.getElementById('headerLogo').style.display = 'inline-block';
                document.getElementById('headerLogoText').style.display = 'none';
            } else {
                document.getElementById('headerLogo').style.display = 'none';
                document.getElementById('headerLogoText').style.display = 'inline-block';
                document.getElementById('headerLogoText').innerText = logoImage.text || 'Vínculo Salud';
            }
        } else {
            document.getElementById('headerLogo').style.display = 'none';
            document.getElementById('headerLogoText').style.display = 'inline-block';
        }
    });
}

function showLogoModal() {
    document.getElementById('logoModal').style.display = 'flex';
    document.getElementById('logoText').value = logoImage.text || 'Vínculo Salud';
    if (logoImage.url) {
        document.getElementById('logoPreview').src = logoImage.url;
        document.getElementById('logoPreview').style.display = 'block';
    }
}

function closeLogoModal() {
    document.getElementById('logoModal').style.display = 'none';
    tempLogoData = null;
}

function previewLogo(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('logoPreview').src = e.target.result;
            document.getElementById('logoPreview').style.display = 'block';
            tempLogoData = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function saveLogo() {
    logoImage.text = document.getElementById('logoText').value || 'Vínculo Salud';
    
    if (tempLogoData) {
        logoImage.url = tempLogoData;
    } else {
        logoImage.url = '';
    }
    
    db.ref('LogoImage').set(logoImage);
    
    if (logoImage.url) {
        document.getElementById('headerLogo').src = logoImage.url;
        document.getElementById('headerLogo').style.display = 'inline-block';
        document.getElementById('headerLogoText').style.display = 'none';
    } else {
        document.getElementById('headerLogo').style.display = 'none';
        document.getElementById('headerLogoText').style.display = 'inline-block';
        document.getElementById('headerLogoText').innerText = logoImage.text;
    }
    
    closeLogoModal();
    showToast('Logo guardado correctamente', 'success');
}

function removeLogo() {
    if (confirm('¿Eliminar el logo?')) {
        logoImage = { url: '', text: document.getElementById('logoText').value || 'Vínculo Salud' };
        db.ref('LogoImage').set(logoImage);
        
        document.getElementById('headerLogo').style.display = 'none';
        document.getElementById('headerLogoText').style.display = 'inline-block';
        document.getElementById('headerLogoText').innerText = logoImage.text;
        
        closeLogoModal();
        showToast('Logo eliminado', 'success');
    }
}

// ============================================
// FUNCIONES DE TEXTOS
// ============================================

function cargarTextos() {
    db.ref('HeroTexts').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            heroTexts = data;
            document.getElementById('heroTitleDisplay').innerHTML = heroTexts.title.replace(/\n/g, '<br>');
            document.getElementById('heroSubtitleDisplay').innerText = heroTexts.subtitle;
        }
    });
}

function showTextsModal() {
    document.getElementById('textsModal').style.display = 'flex';
    document.getElementById('heroTitle').value = heroTexts.title;
    document.getElementById('heroSubtitle').value = heroTexts.subtitle;
}

function closeTextsModal() {
    document.getElementById('textsModal').style.display = 'none';
}

function saveHeroTexts() {
    heroTexts = {
        title: document.getElementById('heroTitle').value,
        subtitle: document.getElementById('heroSubtitle').value
    };
    
    db.ref('HeroTexts').set(heroTexts);
    
    document.getElementById('heroTitleDisplay').innerHTML = heroTexts.title.replace(/\n/g, '<br>');
    document.getElementById('heroSubtitleDisplay').innerText = heroTexts.subtitle;
    
    closeTextsModal();
    showToast('Textos actualizados', 'success');
}

// ============================================
// FUNCIONES DE FONDO
// ============================================

function cargarFondo() {
    db.ref('BackgroundImage').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            backgroundImage = data;
            if (backgroundImage.url) {
                document.body.style.backgroundImage = `url('${backgroundImage.url}')`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
                document.body.style.backgroundAttachment = 'fixed';
                document.body.classList.add('has-background-image');
                updateBackgroundOpacity();
            }
        }
    });
}

function showBackgroundImageModal() {
    document.getElementById('backgroundImageModal').style.display = 'flex';
    document.getElementById('backgroundOpacity').value = backgroundImage.opacity || 10;
    document.getElementById('opacityValue').innerText = (backgroundImage.opacity || 10) + '%';
    if (backgroundImage.url) {
        document.getElementById('backgroundPreview').src = backgroundImage.url;
        document.getElementById('backgroundPreview').style.display = 'block';
    }
}

function closeBackgroundImageModal() {
    document.getElementById('backgroundImageModal').style.display = 'none';
    tempBackgroundImageData = null;
}

function previewBackgroundImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('backgroundPreview').src = e.target.result;
            document.getElementById('backgroundPreview').style.display = 'block';
            tempBackgroundImageData = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function updateBackgroundOpacity() {
    const opacity = document.getElementById('backgroundOpacity').value;
    document.getElementById('opacityValue').innerText = opacity + '%';
    if (backgroundImage.url) {
        document.body.style.backgroundImage = `url('${backgroundImage.url}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.opacity = opacity / 100;
    }
}

function saveBackgroundImage() {
    if (tempBackgroundImageData) {
        backgroundImage.url = tempBackgroundImageData;
    }
    backgroundImage.opacity = parseInt(document.getElementById('backgroundOpacity').value);
    
    db.ref('BackgroundImage').set(backgroundImage);
    
    document.body.style.backgroundImage = `url('${backgroundImage.url}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.classList.add('has-background-image');
    document.body.style.opacity = backgroundImage.opacity / 100;
    
    closeBackgroundImageModal();
    showToast('Fondo actualizado', 'success');
}

function removeBackgroundImage() {
    if (confirm('¿Eliminar la imagen de fondo?')) {
        backgroundImage = { url: '', opacity: 10 };
        db.ref('BackgroundImage').set(backgroundImage);
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

function cargarMetodosPago() {
    db.ref('PaymentMethods').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            globalPaymentMethods = data;
        }
        updatePaymentMethodsInfo();
    });
}

function showPaymentMethodsModal() {
    document.getElementById('paymentMethodsModal').style.display = 'flex';
    document.getElementById('globalTransfer').checked = globalPaymentMethods.transfer;
    document.getElementById('globalCardPresencial').checked = globalPaymentMethods.cardPresencial;
    document.getElementById('globalCardOnline').checked = globalPaymentMethods.cardOnline;
    document.getElementById('globalCash').checked = globalPaymentMethods.cash;
    document.getElementById('globalMercadoPago').checked = globalPaymentMethods.mercadopago;
    document.getElementById('globalWebpay').checked = globalPaymentMethods.webpay;
}

function closePaymentMethodsModal() {
    document.getElementById('paymentMethodsModal').style.display = 'none';
}

function saveGlobalPaymentMethods() {
    globalPaymentMethods = {
        transfer: document.getElementById('globalTransfer').checked,
        cardPresencial: document.getElementById('globalCardPresencial').checked,
        cardOnline: document.getElementById('globalCardOnline').checked,
        cash: document.getElementById('globalCash').checked,
        mercadopago: document.getElementById('globalMercadoPago').checked,
        webpay: document.getElementById('globalWebpay').checked
    };
    
    db.ref('PaymentMethods').set(globalPaymentMethods);
    closePaymentMethodsModal();
    showToast('Métodos de pago globales guardados', 'success');
}

function updatePaymentMethodsInfo() {
    const info = document.getElementById('globalPaymentMethodsInfo');
    if (info) {
        info.innerHTML = `
            <h4>Métodos de Pago Globales</h4>
            <p>✅ Transferencia Bancaria: ${globalPaymentMethods.transfer ? 'Activado' : 'Desactivado'}</p>
            <p>✅ Tarjeta Presencial: ${globalPaymentMethods.cardPresencial ? 'Activado' : 'Desactivado'}</p>
            <p>✅ Tarjeta Online: ${globalPaymentMethods.cardOnline ? 'Activado' : 'Desactivado'}</p>
            <p>✅ Efectivo: ${globalPaymentMethods.cash ? 'Activado' : 'Desactivado'}</p>
            <p>✅ Mercado Pago: ${globalPaymentMethods.mercadopago ? 'Activado' : 'Desactivado'}</p>
            <p>✅ Webpay: ${globalPaymentMethods.webpay ? 'Activado' : 'Desactivado'}</p>
        `;
    }
}

// ============================================
// FUNCIONES DE ESPECIALIDADES
// ============================================

function cargarEspecialidades() {
    db.ref('Specialties').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            specialties = Object.keys(data).map(key => ({ id: key, name: data[key].name }));
        } else {
            specialties = [
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
            ];
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
        addSpecSelect.innerHTML = specialties.map(s => 
            `<option value="${s.name}">${s.name}</option>`
        ).join('');
    }
    
    if (editSpecSelect) {
        editSpecSelect.innerHTML = specialties.map(s => 
            `<option value="${s.name}">${s.name}</option>`
        ).join('');
    }
    
    if (specialtyFilter) {
        specialtyFilter.innerHTML = '<option value="">🏷️ Todas las especialidades</option>' +
            specialties.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
    }
}

function renderAllSpecialties() {
    const container = document.getElementById('allSpecialtiesList');
    if (!container) return;
    
    container.innerHTML = specialties.map(s => `
        <div class="specialty-item">
            <span>${s.name}</span>
            <button onclick="deleteSpecialty('${s.id}')"><i class="fa fa-times"></i></button>
        </div>
    `).join('');
}

function showSpecialtiesModal() {
    document.getElementById('specialtiesModal').style.display = 'flex';
    document.getElementById('newSpecialty').value = '';
    renderAllSpecialties();
}

function closeSpecialtiesModal() {
    document.getElementById('specialtiesModal').style.display = 'none';
}

function addSpecialty() {
    const name = document.getElementById('newSpecialty').value.trim();
    if (!name) {
        showToast('Ingresa un nombre para la especialidad', 'error');
        return;
    }
    
    if (specialties.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        showToast('La especialidad ya existe', 'error');
        return;
    }
    
    const newSpecialty = {
        id: String(Date.now()),
        name: name
    };
    
    specialties.push(newSpecialty);
    guardarEspecialidades();
    document.getElementById('newSpecialty').value = '';
    showToast('Especialidad agregada', 'success');
}

function deleteSpecialty(id) {
    if (confirm('¿Eliminar esta especialidad? Los profesionales que la tengan asignada la perderán.')) {
        specialties = specialties.filter(s => s.id != id);
        
        staff.forEach(prof => {
            if (prof.spec) {
                const specArray = Array.isArray(prof.spec) ? prof.spec : [prof.spec];
                prof.spec = specArray.filter(s => {
                    const specialtyExists = specialties.some(sp => sp.name === s);
                    return specialtyExists;
                });
            }
        });
        
        guardarEspecialidades();
        save();
        showToast('Especialidad eliminada', 'success');
    }
}

function guardarEspecialidades() {
    const specialtiesObj = {};
    specialties.forEach(item => {
        specialtiesObj[item.id] = { name: item.name };
    });
    db.ref('Specialties').set(specialtiesObj);
    actualizarSelectoresEspecialidades();
    renderAllSpecialties();
}

// ============================================
// CARGAR DATOS DESDE FIREBASE CON MEJORA DE CARGA
// ============================================

function cargarDatosIniciales() {
    // Mostrar un indicador de carga
    document.getElementById('publicGrid').innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;"><i class="fa fa-spinner fa-spin fa-3x"></i><p>Cargando profesionales...</p></div>';
    
    db.ref('Staff').once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            staff = Object.keys(data).map(key => {
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
                        paymentMethods: item.paymentMethods || globalPaymentMethods,
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
                        paymentMethods: item.paymentMethods || globalPaymentMethods,
                        sessionDuration: item.sessionDuration || 45,
                        breakBetween: item.breakBetween || 10,
                        availability: item.availability || {},
                        paymentLinks: item.paymentLinks || { online: '', presencial: '', qrCode: '' }
                    };
                }
            });
        } else {
            staff = [];
        }
        
        // Agregar administrador
        staff.push({
            id: '9999',
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
            paymentMethods: {},
            sessionDuration: 45,
            breakBetween: 10,
            availability: {},
            paymentLinks: { online: '', presencial: '', qrCode: '' }
        });
        
        filterProfessionals();
        if (currentUser?.role === 'admin') renderStaffTable();
        
        // Marcar datos cargados
        dataLoaded = true;
    });
    
    db.ref('Boxes').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            boxes = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        } else {
            boxes = [];
        }
        if (currentUser?.role === 'admin') renderBoxesTable();
        if (currentUser?.role === 'psych') renderBoxOccupancy();
    });
    
    db.ref('Patients').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            patients = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        } else {
            patients = [];
        }
        if (currentUser) renderPatients();
    });
    
    db.ref('Appointments').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            appointments = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        } else {
            appointments = [];
        }
        if (currentUser) {
            updateStats();
            renderPendingRequests();
        }
        if (currentUser?.role === 'psych') renderBoxOccupancy();
    });
    
    db.ref('PendingRequests').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            pendingRequests = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        } else {
            pendingRequests = [];
        }
        if (currentUser) {
            renderPendingRequests();
        }
    });
    
    db.ref('Messages').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            messages = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        } else {
            messages = [
                { id: '1', name: 'Carolina Méndez', email: '', whatsapp: '', therapistId: 1, therapistName: 'Psic. Alison Gutiérrez', rating: 5, text: 'Excelente profesional, me ayudó mucho con mi ansiedad. Muy recomendada.', date: '2024-02-15' },
                { id: '2', name: 'Roberto Campos', email: 'roberto@email.com', whatsapp: '+56912345678', therapistId: null, therapistName: null, rating: 5, text: 'Muy buena página, encontré al especialista que necesitaba rápidamente.', date: '2024-02-16' },
                { id: '3', name: 'María José', email: '', whatsapp: '', therapistId: 2, therapistName: 'Dr. Julián Sossa', rating: 4, text: 'Muy profesional, aunque los tiempos de espera a veces son largos.', date: '2024-02-17' }
            ];
        }
        renderMessages();
        updateMarquee();
        if (currentUser?.role === 'admin') renderMessagesTable();
    });

    cargarEspecialidades();
    cargarMetodosPago();
    cargarFondo();
    cargarTextos();
    cargarLogo();
}

// ============================================
// FUNCIÓN PARA GUARDAR EN FIREBASE (OPTIMIZADA)
// ============================================

function save() {
    const updates = {};
    
    updates['/Staff'] = staff.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});
    updates['/Boxes'] = boxes.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});
    updates['/Patients'] = patients.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});
    updates['/Appointments'] = appointments.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});
    updates['/PendingRequests'] = pendingRequests.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});
    updates['/Messages'] = messages.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});
    
    db.ref().update(updates)
        .then(() => console.log('Datos guardados'))
        .catch(err => console.error('Error al guardar:', err));
    
    guardarEspecialidades(); // Esta función ya usa set
    
    if (currentUser) {
        updateStats();
        renderPendingRequests();
        if (currentUser.role === 'admin') {
            renderStaffTable();
            renderMessagesTable();
            renderBoxesTable();
        }
        if (currentUser.role === 'psych') {
            renderPatients();
            renderBoxOccupancy();
            if (document.getElementById('tabDisponibilidad')?.classList.contains('active')) {
                loadTimeSlots();
            }
        }
    }
    filterProfessionals();
    renderMessages();
    updateMarquee();
}

// ============================================
// FUNCIONES DE SOLICITUDES
// ============================================

function renderPendingRequests() {
    const tb = document.getElementById('pendingRequestsTable');
    if (!tb) return;

    let requestsToShow = [];
    if (currentUser.role === 'admin') {
        requestsToShow = pendingRequests;
    } else if (currentUser.role === 'psych') {
        requestsToShow = pendingRequests.filter(r => r.psychId == currentUser.data.id);
    }

    if (requestsToShow.length === 0) {
        tb.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:40px;">No hay solicitudes pendientes</td></tr>';
        return;
    }

    tb.innerHTML = requestsToShow.reverse().map(r => `
        <tr>
            <td>${r.createdAt || '—'}</td>
            <td><strong>${r.patient}</strong><br><small>${r.patientRut}</small></td>
            <td>${r.psych}</td>
            <td>${r.preferredDate}</td>
            <td>${r.preferredTime}</td>
            <td><span class="badge ${r.type}">${r.type === 'online' ? 'Online' : 'Presencial'}</span></td>
            <td>${r.boxName || '—'}</td>
            <td>${r.msg || '—'}</td>
            <td>
                <button onclick="showConfirmRequestModal('${r.id}')" class="btn-icon" style="background:var(--verde-exito); color:white;">
                    <i class="fa fa-check"></i> Confirmar
                </button>
                <button onclick="rejectRequest('${r.id}')" class="btn-icon" style="background:var(--rojo-alerta); color:white;">
                    <i class="fa fa-times"></i> Rechazar
                </button>
            </td>
        </tr>
    `).join('');
}

function showConfirmRequestModal(requestId) {
    const request = pendingRequests.find(r => r.id == requestId);
    if (!request) return;

    selectedPatientForTherapist = patients.find(p => p.id == request.patientId);
    document.getElementById('therapistRut').value = selectedPatientForTherapist?.rut || '';
    document.getElementById('patientInfoName').innerText = selectedPatientForTherapist?.name || '';
    document.getElementById('patientInfoEmail').innerText = selectedPatientForTherapist?.email || '';
    document.getElementById('patientInfoPhone').innerText = selectedPatientForTherapist?.phone || '';
    document.getElementById('patientInfo').style.display = 'block';
    document.getElementById('therapistPatientName').innerText = selectedPatientForTherapist?.name || '';
    document.getElementById('therapistAppointmentType').value = request.type;
    document.getElementById('therapistDate').value = request.preferredDate;
    document.getElementById('therapistMsg').value = request.msg;
    document.getElementById('therapistPaymentMethod').value = 'transfer';
    
    if (request.boxId) {
        selectedTherapistBoxId = request.boxId;
    }

    window.currentRequestId = requestId;

    updateTherapistBookingDetails();
    setTimeout(() => {
        updateTherapistAvailableSlots();
        document.getElementById('therapistTime').value = request.preferredTime;
        document.getElementById('therapistTimeDisplay').innerText = request.preferredTime;
        if (request.boxId) {
            updateTherapistBoxSelector(request.preferredDate, request.preferredTime);
        }
    }, 500);

    switchTab('agendar');
}

function rejectRequest(requestId) {
    if (confirm('¿Rechazar esta solicitud? Se notificará al paciente.')) {
        const request = pendingRequests.find(r => r.id == requestId);
        pendingRequests = pendingRequests.filter(r => r.id != requestId);
        
        if (request?.patientEmail) {
            const subject = 'Solicitud de cita no confirmada - Vínculo Salud';
            const message = `Hola ${request.patient},\n\nLamentamos informarte que no ha sido posible confirmar tu solicitud de cita con ${request.psych} para el ${request.preferredDate} a las ${request.preferredTime}.\n\nPor favor, contacta directamente con el profesional para acordar una nueva fecha.\n\nVínculo Salud`;
            sendEmailNotification(request.patientEmail, subject, message);
        }
        
        save();
        showToast('Solicitud rechazada', 'success');
    }
}

// ============================================
// FUNCIONES DE RESERVA (PACIENTES)
// ============================================

function openBooking(id) {
    selectedPsych = staff.find(p => p.id == id);
    selectedBoxId = null;
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('clientView').style.display = 'none';
    document.getElementById('bookingPanel').style.display = 'block';
    document.getElementById('psychName').innerText = selectedPsych.name;
    document.getElementById('psychSelectedName').innerText = selectedPsych.name;
    document.getElementById('psychSelectedSpec').innerText = Array.isArray(selectedPsych.spec) ? selectedPsych.spec.join(' · ') : selectedPsych.spec;
    
    document.getElementById('custDate').min = today;
    document.getElementById('custDate').value = today;
    
    // Cargar duración de sesión
    document.getElementById('bookingDuration').innerText = (selectedPsych.sessionDuration || 45) + ' minutos';
    
    loadPaymentMethods();
    updateBookingDetails();
    document.getElementById('emailSimulation').style.display = 'none';
    
    // Verificar disponibilidad inicial
    updateAvailableTimes();
}

function loadPaymentMethods() {
    const select = document.getElementById('paymentMethod');
    select.innerHTML = '<option value="">Selecciona método</option>';
    
    const methods = selectedPsych.paymentMethods || globalPaymentMethods;
    
    if (methods.transfer) {
        select.innerHTML += '<option value="transfer">Transferencia Bancaria</option>';
    }
    if (methods.cardPresencial) {
        select.innerHTML += '<option value="card-presencial">Tarjeta (en consulta)</option>';
    }
    if (methods.cardOnline) {
        select.innerHTML += '<option value="card-online">Tarjeta (pago online)</option>';
    }
    if (methods.cash) {
        select.innerHTML += '<option value="cash">Efectivo (en consulta)</option>';
    }
    if (methods.mercadopago) {
        select.innerHTML += '<option value="mercadopago">Mercado Pago</option>';
    }
    if (methods.webpay) {
        select.innerHTML += '<option value="webpay">Webpay</option>';
    }
}

function showPaymentDetails() {
    const method = document.getElementById('paymentMethod').value;
    const detailsDiv = document.getElementById('paymentDetails');
    
    if (method === 'transfer' && selectedPsych.bankDetails) {
        const bank = selectedPsych.bankDetails;
        detailsDiv.style.display = 'block';
        detailsDiv.innerHTML = `
            <h4 style="margin-bottom:10px;">Datos para Transferencia</h4>
            <p><strong>Banco:</strong> ${bank.bank || 'No especificado'}</p>
            <p><strong>Cuenta:</strong> ${bank.accountType || ''} ${bank.accountNumber || ''}</p>
            <p><strong>RUT:</strong> ${bank.rut || ''}</p>
            <p><strong>Email:</strong> ${bank.email || ''}</p>
        `;
    } else {
        detailsDiv.style.display = 'none';
    }
}

function updateAvailableTimes() {
    const date = document.getElementById('custDate').value;
    const type = document.getElementById('appointmentType').value;
    const timeSelect = document.getElementById('custTime');
    
    if (!date || !selectedPsych) return;
    
    // Limpiar opciones
    timeSelect.innerHTML = '<option value="">Cargando horarios...</option>';
    
    if (type === 'presencial') {
        timeSelect.innerHTML = '<option value="">Selecciona un día (la hora se coordinará)</option>';
        return;
    }
    
    // Obtener slots disponibles
    const availableSlots = selectedPsych.availability?.[date] || [];
    const bookedTimes = appointments
        .filter(a => a.psychId == selectedPsych.id && a.date === date)
        .map(a => a.time);
    
    // Filtrar slots no reservados y no pasados
    const now = new Date();
    const availableTimes = availableSlots
        .filter(slot => !bookedTimes.includes(slot.time))
        .filter(slot => {
            const slotDateTime = new Date(date + 'T' + slot.time);
            return slotDateTime > now;
        })
        .sort((a, b) => a.time.localeCompare(b.time));
    
    if (availableTimes.length === 0) {
        timeSelect.innerHTML = '<option value="">No hay horarios disponibles</option>';
        return;
    }
    
    timeSelect.innerHTML = '<option value="">Selecciona un horario</option>';
    availableTimes.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot.time;
        option.textContent = slot.time + (slot.isOvercupo ? ' (Sobrecupo)' : '');
        if (slot.isOvercupo) option.style.color = '#f59e0b';
        timeSelect.appendChild(option);
    });
}

function checkOnlineAvailability() {
    const date = document.getElementById('custDate').value;
    const time = document.getElementById('custTime').value;
    const type = document.getElementById('appointmentType').value;
    
    if (type === 'presencial') {
        document.getElementById('onlineAvailabilityMsg').style.display = 'none';
        return true;
    }
    
    if (type === 'online' && date && time) {
        // Verificar si la fecha/hora ya pasó
        const selectedDateTime = new Date(date + 'T' + time);
        const now = new Date();
        
        if (selectedDateTime < now) {
            document.getElementById('onlineAvailabilityMsg').style.display = 'block';
            document.getElementById('onlineAvailabilityMsg').innerHTML = '<i class="fa fa-exclamation-circle"></i> No puedes seleccionar una hora que ya pasó.';
            document.getElementById('onlineAvailabilityMsg').style.background = '#fff3cd';
            return false;
        }
        
        const existingAppointment = appointments.find(a => 
            a.psychId == selectedPsych.id && 
            a.date === date && 
            a.time === time
        );
        
        const isAvailable = !existingAppointment && 
            selectedPsych.availability?.[date]?.some(s => s.time === time);
        
        if (isAvailable) {
            document.getElementById('onlineAvailabilityMsg').style.display = 'block';
            document.getElementById('onlineAvailabilityMsg').innerHTML = '<i class="fa fa-check-circle"></i> Horario disponible para reserva inmediata.';
            document.getElementById('onlineAvailabilityMsg').style.background = '#e6f7e6';
            return true;
        } else {
            document.getElementById('onlineAvailabilityMsg').style.display = 'block';
            document.getElementById('onlineAvailabilityMsg').innerHTML = '<i class="fa fa-exclamation-circle"></i> Horario no disponible. Por favor selecciona otro.';
            document.getElementById('onlineAvailabilityMsg').style.background = '#fff3cd';
            return false;
        }
    }
}

function updateBookingDetails() {
    const type = document.getElementById('appointmentType').value;
    const price = type === 'online' ? selectedPsych.priceOnline : selectedPsych.pricePresencial;
    
    document.getElementById('bookingPrice').innerText = `$${price.toLocaleString()}`;
    document.getElementById('bookingType').innerText = type === 'online' ? 'Online' : 'Presencial';
    
    const warning = document.getElementById('presencialWarning');
    const onlineMsg = document.getElementById('onlineAvailabilityMsg');
    
    if (type === 'presencial') {
        warning.style.display = 'block';
        onlineMsg.style.display = 'none';
    } else {
        warning.style.display = 'none';
        onlineMsg.style.display = 'block';
    }
    
    // Actualizar horarios disponibles
    updateAvailableTimes();
}

function searchPatientByRutBooking() {
    const rut = document.getElementById('custRut').value;
    if (!rut) return;

    const patient = patients.find(p => p.rut === rut);
    if (patient) {
        document.getElementById('custName').value = patient.name || '';
        document.getElementById('custEmail').value = patient.email || '';
        document.getElementById('custPhone').value = patient.phone || '';
        showToast('Datos del paciente cargados', 'success');
    }
}

function executeBooking() {
    const rut = document.getElementById('custRut').value;
    const name = document.getElementById('custName').value;
    const email = document.getElementById('custEmail').value;
    const phone = document.getElementById('custPhone').value;
    const date = document.getElementById('custDate').value;
    const time = document.getElementById('custTime').value;
    const type = document.getElementById('appointmentType').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const msg = document.getElementById('custMsg').value;
    const acceptPolicy = document.getElementById('acceptPolicy').checked;

    if (!rut || !name || !email || !date || !paymentMethod) {
        showToast('Completa todos los campos obligatorios (RUT, nombre, email, fecha y método de pago)', 'error');
        return;
    }

    if (!validarRut(rut)) {
        showToast('RUT inválido', 'error');
        return;
    }

    if (type === 'online' && !time) {
        showToast('Para atención online debes seleccionar una hora', 'error');
        return;
    }

    if (!acceptPolicy) {
        showToast('Debes aceptar la política de cancelación', 'error');
        return;
    }

    // Validar que la hora no haya pasado (solo para online)
    if (type === 'online') {
        const selectedDateTime = new Date(date + 'T' + time);
        const now = new Date();
        
        if (selectedDateTime < now) {
            showToast('No puedes agendar una hora que ya pasó', 'error');
            return;
        }
    }

    // Verificar disponibilidad para online
    if (type === 'online') {
        const existingAppointment = appointments.find(a => 
            a.psychId == selectedPsych.id && 
            a.date === date && 
            a.time === time
        );

        if (existingAppointment) {
            showToast('El profesional ya tiene una cita agendada en este horario', 'error');
            return;
        }

        const isAvailable = selectedPsych.availability?.[date]?.some(s => s.time === time);
        if (!isAvailable) {
            showToast('Horario no disponible', 'error');
            return;
        }
    }

    const bookBtn = document.getElementById('bookBtn');
    bookBtn.innerHTML = '<span class="spinner"></span> Procesando...';
    bookBtn.disabled = true;

    setTimeout(() => {
        let patient = patients.find(p => p.rut === rut);
        if (!patient) {
            patient = {
                id: String(Date.now()),
                rut: rut,
                name: name,
                email: email,
                phone: phone,
                birthdate: '',
                notes: '',
                psychId: selectedPsych.id,
                createdAt: new Date().toISOString(),
                appointments: []
            };
            patients.push(patient);
        }
        
        const price = type === 'online' ? selectedPsych.priceOnline : selectedPsych.pricePresencial;
        
        // Mostrar link de pago después de crear la cita/solicitud
        const paymentContainer = document.getElementById('paymentLinkContainer');
        let paymentLink = '';
        let qrCode = '';
        
        if (type === 'online' && selectedPsych.paymentLinks?.online) {
            paymentLink = selectedPsych.paymentLinks.online;
        } else if (type === 'presencial' && selectedPsych.paymentLinks?.presencial) {
            paymentLink = selectedPsych.paymentLinks.presencial;
            qrCode = selectedPsych.paymentLinks?.qrCode || '';
        }
        
        // Personalizar link con datos del paciente
        if (paymentLink) {
            const separator = paymentLink.includes('?') ? '&' : '?';
            paymentLink = `${paymentLink}${separator}description=Atención ${type} - ${encodeURIComponent(name)}&customer_email=${encodeURIComponent(email)}&customer_name=${encodeURIComponent(name)}`;
        }
        
        if (paymentContainer) {
            let qrHtml = '';
            if (qrCode) {
                qrHtml = `
                    <div style="text-align: center; margin: 20px 0;">
                        <p style="font-weight:600; margin-bottom:10px;">📱 Escanea para pagar (presencial):</p>
                        <img src="${qrCode}" 
                             style="width: 200px; height: 200px; border-radius: 12px; border: 3px solid var(--azul-medico); box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    </div>
                `;
            }
            
            paymentContainer.innerHTML = `
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 20px; color: white; text-align: center;">
                    <h4 style="margin-bottom: 15px; font-size:1.5rem;">💰 ${type === 'online' ? 'Pago online' : 'Pago presencial'}</h4>
                    <p style="font-size: 2rem; font-weight:700; margin-bottom:10px;">$${price.toLocaleString()}</p>
                    
                    ${qrHtml}
                    
                    ${paymentLink ? `
                        <a href="${paymentLink}" target="_blank" class="btn-staff" style="background: var(--verde-exito); text-decoration: none; padding: 15px 40px; font-size:1.2rem; margin-top:15px; display:inline-block;">
                            <i class="fab fa-cc-visa"></i> Pagar con Tarjeta
                        </a>
                        <p style="margin-top:15px; font-size:0.9rem; opacity:0.8;">
                            <i class="fas fa-lock"></i> Pago seguro procesado por SumUp
                        </p>
                    ` : ''}
                    
                    <p style="margin-top:20px; font-size:0.8rem; background: rgba(0,0,0,0.2); padding:10px; border-radius:10px;">
                        ⏰ Una vez realizado el pago, la cita se confirmará automáticamente y recibirás un email.
                    </p>
                </div>
            `;
            paymentContainer.style.display = 'block';
        }
        
        if (type === 'online') {
            // Reserva online directa
            const appointment = {
                id: String(Date.now()),
                patientId: patient.id,
                patient: name,
                patientRut: rut,
                patientEmail: email,
                patientPhone: phone,
                psych: selectedPsych.name,
                psychId: selectedPsych.id,
                date: date,
                time: time,
                type: type,
                boxId: null,
                boxName: null,
                price: price,
                paymentMethod: paymentMethod,
                paymentStatus: paymentLink ? 'pendiente' : 'pagado',
                msg: msg,
                status: paymentLink ? 'pendiente' : 'confirmada',
                createdAt: new Date().toISOString(),
                editableUntil: new Date(Date.now() + EDIT_HOURS * 60 * 60 * 1000).toISOString()
            };
            
            appointments.push(appointment);
            sendAppointmentEmails(appointment);
            showToast(paymentLink ? '¡Cita creada! Realiza el pago para confirmar' : '¡Cita confirmada!', 'success');
        } else {
            // Solicitud presencial
            const request = {
                id: String(Date.now()),
                patientId: patient.id,
                patient: name,
                patientRut: rut,
                patientEmail: email,
                patientPhone: phone,
                psych: selectedPsych.name,
                psychId: selectedPsych.id,
                preferredDate: date,
                preferredTime: 'A coordinar',
                type: type,
                boxId: null,
                boxName: null,
                paymentMethod: paymentMethod,
                msg: msg,
                status: 'pendiente',
                createdAt: new Date().toLocaleString()
            };
            
            pendingRequests.push(request);
            sendRequestEmail(request);
            showToast('¡Solicitud enviada! El profesional te confirmará la hora', 'success');
        }
        
        save();
        
        bookBtn.innerHTML = 'SOLICITAR CITA';
        bookBtn.disabled = false;
    }, 1500);
}

// ============================================
// FUNCIONES DE RESERVA (TERAPEUTAS)
// ============================================

function showTherapistBookingModal() {
    selectedTherapistBoxId = null;
    selectedPatientForTherapist = null;
    window.currentRequestId = null;
    
    document.getElementById('therapistRut').value = '';
    document.getElementById('patientInfo').style.display = 'none';
    document.getElementById('therapistAppointmentType').value = 'online';
    document.getElementById('therapistDate').value = '';
    document.getElementById('therapistTime').innerHTML = '<option value="">Selecciona una fecha</option>';
    document.getElementById('therapistMsg').value = '';
    document.getElementById('therapistPaymentMethod').value = 'transfer';
    document.getElementById('therapistPsychName').innerText = currentUser.data.name;
    document.getElementById('therapistPatientName').innerText = '—';
    document.getElementById('therapistDateDisplay').innerText = '—';
    document.getElementById('therapistTimeDisplay').innerText = '—';
    document.getElementById('therapistTypeDisplay').innerText = 'Online';
    document.getElementById('therapistPrice').innerText = '$0';
    document.getElementById('therapistBoxDisplay').style.display = 'none';
    document.getElementById('therapistBoxField').style.display = 'none';
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('therapistDate').min = today;
    
    switchTab('agendar');
}

function searchPatientByRutTherapist() {
    const rut = document.getElementById('therapistRut').value;
    if (!rut) return;

    const patient = patients.find(p => p.rut === rut);
    if (patient) {
        selectedPatientForTherapist = patient;
        document.getElementById('patientInfoName').innerText = patient.name || '';
        document.getElementById('patientInfoEmail').innerText = patient.email || '';
        document.getElementById('patientInfoPhone').innerText = patient.phone || '';
        document.getElementById('patientInfo').style.display = 'block';
        document.getElementById('therapistPatientName').innerText = patient.name;
        showToast('Paciente encontrado', 'success');
    } else {
        if (confirm('Paciente no encontrado. ¿Desea crearlo?')) {
            document.getElementById('patientRut').value = rut;
            document.getElementById('patientName').value = '';
            document.getElementById('patientEmail').value = '';
            document.getElementById('patientPhone').value = '';
            document.getElementById('patientModalTitle').innerText = 'Nuevo Paciente';
            document.getElementById('patientHistoryContainer').style.display = 'none';
            document.getElementById('patientStatsContainer').style.display = 'none';
            document.getElementById('patientModal').style.display = 'flex';
        }
    }
}

function updateTherapistBookingDetails() {
    const type = document.getElementById('therapistAppointmentType').value;
    const price = type === 'online' ? currentUser.data.priceOnline : currentUser.data.pricePresencial;
    document.getElementById('therapistPrice').innerText = `$${price.toLocaleString()}`;
    document.getElementById('therapistTypeDisplay').innerText = type === 'online' ? 'Online' : 'Presencial';
    
    if (type === 'presencial') {
        document.getElementById('therapistBoxField').style.display = 'block';
        updateTherapistAvailableSlots();
    } else {
        document.getElementById('therapistBoxField').style.display = 'none';
        document.getElementById('therapistBoxDisplay').style.display = 'none';
        updateTherapistAvailableSlots();
    }
}

function updateTherapistAvailableSlots() {
    const date = document.getElementById('therapistDate').value;
    const timeSelect = document.getElementById('therapistTime');
    const type = document.getElementById('therapistAppointmentType').value;
    
    if (!date || !currentUser) return;

    const bookedTimes = appointments
        .filter(a => a.psychId == currentUser.data.id && a.date === date)
        .map(a => a.time);

    const availableSlots = currentUser.data.availability?.[date] || [];

    timeSelect.innerHTML = '<option value="">Selecciona un horario</option>';
    
    // Filtrar slots no pasados
    const now = new Date();
    availableSlots.forEach(slot => {
        if (!bookedTimes.includes(slot.time)) {
            const slotDateTime = new Date(date + 'T' + slot.time);
            if (slotDateTime > now) {
                const option = document.createElement('option');
                option.value = slot.time;
                option.textContent = slot.time + (slot.isOvercupo ? ' (⚠️ Sobrecupo)' : '');
                if (slot.isOvercupo) option.style.color = '#f59e0b';
                
                if (type === 'presencial') {
                    const availableBoxes = getAvailableBoxes(date, slot.time);
                    if (availableBoxes.length === 0) {
                        option.disabled = true;
                        option.textContent += ' (sin boxes disponibles)';
                        option.style.color = 'var(--text-light)';
                    }
                }
                
                timeSelect.appendChild(option);
            }
        }
    });

    if (timeSelect.children.length === 1) {
        timeSelect.innerHTML = '<option value="">No hay horarios disponibles</option>';
    }

    const time = document.getElementById('therapistTime').value;
    if (time) {
        document.getElementById('therapistTimeDisplay').innerText = time;
        updateTherapistBoxSelector(date, time);
    }
}

function updateTherapistBoxSelector(date, time) {
    const boxSelector = document.getElementById('therapistBoxSelector');
    const boxAvailabilityMsg = document.getElementById('therapistBoxAvailabilityMsg');
    
    if (!date || !time) {
        boxSelector.innerHTML = '';
        boxAvailabilityMsg.innerHTML = 'Selecciona fecha y horario primero';
        return;
    }

    const availableBoxes = getAvailableBoxes(date, time);
    
    if (availableBoxes.length === 0) {
        boxSelector.innerHTML = '';
        boxAvailabilityMsg.innerHTML = 'No hay boxes disponibles para este horario';
        document.getElementById('therapistBoxDisplay').style.display = 'none';
        selectedTherapistBoxId = null;
        return;
    }

    boxSelector.innerHTML = availableBoxes.map(box => `
        <div class="box-option ${selectedTherapistBoxId == box.id ? 'selected' : ''}" 
             onclick="selectTherapistBox(${box.id}, this)"
             title="${box.description || ''}">
            📦 ${box.name} ${box.location ? `- ${box.location}` : ''}
        </div>
    `).join('');

    boxAvailabilityMsg.innerHTML = `${availableBoxes.length} box(es) disponible(s)`;
}

function selectTherapistBox(boxId, element) {
    selectedTherapistBoxId = boxId;
    const box = boxes.find(b => b.id == boxId);
    
    document.querySelectorAll('#therapistBoxSelector .box-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
    
    if (box) {
        document.getElementById('therapistBoxName').innerText = `${box.name} ${box.location ? `(${box.location})` : ''}`;
        document.getElementById('therapistBoxDisplay').style.display = 'flex';
    }
}

function executeTherapistBooking() {
    if (!selectedPatientForTherapist) {
        showToast('Debes buscar y seleccionar un paciente', 'error');
        return;
    }

    const date = document.getElementById('therapistDate').value;
    const time = document.getElementById('therapistTime').value;
    const type = document.getElementById('therapistAppointmentType').value;
    const paymentMethod = document.getElementById('therapistPaymentMethod').value;
    const msg = document.getElementById('therapistMsg').value;
    
    if (!date || !time) {
        showToast('Selecciona fecha y horario', 'error');
        return;
    }

    // Verificar si ya tiene una cita a la misma hora
    const existingAppointment = appointments.find(a => 
        a.psychId == currentUser.data.id && 
        a.date === date && 
        a.time === time
    );

    if (existingAppointment) {
        showToast('Ya tienes una cita agendada en este horario', 'error');
        return;
    }

    if (type === 'presencial' && !selectedTherapistBoxId) {
        showToast('Debes seleccionar un box para atención presencial', 'error');
        return;
    }

    const bookBtn = document.getElementById('therapistBookBtn');
    bookBtn.innerHTML = '<span class="spinner"></span> Procesando...';
    bookBtn.disabled = true;

    setTimeout(() => {
        const price = type === 'online' ? currentUser.data.priceOnline : currentUser.data.pricePresencial;
        const box = type === 'presencial' ? boxes.find(b => b.id == selectedTherapistBoxId) : null;
        
        const appointment = {
            id: String(Date.now()),
            patientId: selectedPatientForTherapist.id,
            patient: selectedPatientForTherapist.name,
            patientRut: selectedPatientForTherapist.rut,
            patientEmail: selectedPatientForTherapist.email,
            patientPhone: selectedPatientForTherapist.phone,
            psych: currentUser.data.name,
            psychId: currentUser.data.id,
            date: date,
            time: time,
            type: type,
            boxId: type === 'presencial' ? selectedTherapistBoxId : null,
            boxName: box ? box.name : null,
            price: price,
            paymentMethod: paymentMethod,
            paymentStatus: 'pagado',
            msg: msg,
            status: 'confirmada',
            createdAt: new Date().toISOString(),
            editableUntil: new Date(Date.now() + EDIT_HOURS * 60 * 60 * 1000).toISOString(),
            createdBy: currentUser.data.name
        };
        
        appointments.push(appointment);
        
        selectedPatientForTherapist.appointments = selectedPatientForTherapist.appointments || [];
        selectedPatientForTherapist.appointments.push(appointment.id);
        
        if (window.currentRequestId) {
            pendingRequests = pendingRequests.filter(r => r.id != window.currentRequestId);
            const request = pendingRequests.find(r => r.id == window.currentRequestId);
            if (request) {
                sendConfirmationEmail(request, appointment);
            }
            window.currentRequestId = null;
        } else {
            sendAppointmentEmails(appointment);
        }
        
        save();
        
        showToast(`Cita confirmada con ${selectedPatientForTherapist.name}`, 'success');
        
        bookBtn.innerHTML = 'Confirmar Cita';
        bookBtn.disabled = false;
        
        document.getElementById('therapistRut').value = '';
        document.getElementById('patientInfo').style.display = 'none';
        document.getElementById('therapistDate').value = '';
        document.getElementById('therapistTime').innerHTML = '<option value="">Selecciona una fecha</option>';
        document.getElementById('therapistMsg').value = '';
        document.getElementById('therapistPatientName').innerText = '—';
        document.getElementById('therapistDateDisplay').innerText = '—';
        document.getElementById('therapistTimeDisplay').innerText = '—';
        document.getElementById('therapistBoxDisplay').style.display = 'none';
        selectedPatientForTherapist = null;
        selectedTherapistBoxId = null;
        
        renderBoxOccupancy();
        switchTab('citas');
    }, 1500);
}

// ============================================
// FUNCIONES DE BOXES
// ============================================

function renderBoxOccupancy() {
    const container = document.getElementById('boxOccupancy');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(a => a.date === today && a.type === 'presencial' && a.status === 'confirmada');
    
    if (todayAppointments.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">No hay boxes ocupados hoy</p>';
        return;
    }

    const sortedApps = todayAppointments.sort((a, b) => a.time.localeCompare(b.time));
    
    container.innerHTML = sortedApps.map(a => {
        const box = boxes.find(b => b.id == a.boxId);
        return `
            <div class="schedule-item">
                <span class="schedule-time">${a.time}</span>
                <span class="schedule-professional"><strong>${a.psych}</strong> - ${a.patient}</span>
                <span class="schedule-box">${box ? box.name : 'Box no asignado'}</span>
            </div>
        `;
    }).join('');
}

function showBoxModal() {
    document.getElementById('boxModal').style.display = 'flex';
    document.getElementById('boxName').value = '';
    document.getElementById('boxLocation').value = '';
    document.getElementById('boxStartTime').value = '09:00';
    document.getElementById('boxEndTime').value = '20:00';
    document.getElementById('boxDescription').value = '';
    document.querySelectorAll('.box-day').forEach(cb => cb.checked = false);
    [1,2,3,4,5].forEach(d => {
        const cb = document.querySelector(`.box-day[value="${d}"]`);
        if (cb) cb.checked = true;
    });
    document.getElementById('saveBoxBtn').onclick = saveBox;
}

function closeBoxModal() {
    document.getElementById('boxModal').style.display = 'none';
}

function saveBox() {
    const name = document.getElementById('boxName').value;
    const location = document.getElementById('boxLocation').value;
    const startTime = document.getElementById('boxStartTime').value;
    const endTime = document.getElementById('boxEndTime').value;
    const description = document.getElementById('boxDescription').value;
    const days = Array.from(document.querySelectorAll('.box-day:checked')).map(cb => parseInt(cb.value));

    if (!name || !startTime || !endTime || days.length === 0) {
        showToast('Nombre, horario y días son obligatorios', 'error');
        return;
    }

    const newBox = {
        id: String(Date.now()),
        name: name,
        location: location,
        startTime: startTime,
        endTime: endTime,
        days: days,
        description: description,
        active: true
    };

    boxes.push(newBox);
    save();
    closeBoxModal();
    renderBoxesTable();
    showToast('Box guardado correctamente', 'success');
}

function renderBoxesTable() {
    const tbModal = document.getElementById('boxTableBody');
    const tbDashboard = document.getElementById('boxTableBodyDashboard');
    
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    
    const rows = boxes.map(b => {
        const daysStr = b.days.map(d => dayNames[d]).join(', ');
        return `
            <tr>
                <td><strong>${b.name}</strong></td>
                <td>${b.location || '—'}</td>
                <td>${b.startTime} - ${b.endTime}</td>
                <td>${daysStr}</td>
                <td><span class="badge" style="background:${b.active ? 'var(--verde-exito)' : 'var(--text-light)'}; color:white;">${b.active ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <button onclick="editBox(${b.id})" class="btn-icon" style="background:var(--azul-medico); color:white;">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button onclick="toggleBoxStatus(${b.id})" class="btn-icon" style="background:var(--naranja-aviso); color:white;">
                        <i class="fa ${b.active ? 'fa-ban' : 'fa-check'}"></i>
                    </button>
                    <button onclick="deleteBox(${b.id})" class="btn-icon" style="background:var(--rojo-alerta); color:white;">
                        <i class="fa fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    if (tbModal) tbModal.innerHTML = rows;
    if (tbDashboard) tbDashboard.innerHTML = rows;
}

function editBox(id) {
    const box = boxes.find(b => b.id == id);
    if (!box) return;

    document.getElementById('boxName').value = box.name;
    document.getElementById('boxLocation').value = box.location || '';
    document.getElementById('boxStartTime').value = box.startTime;
    document.getElementById('boxEndTime').value = box.endTime;
    document.getElementById('boxDescription').value = box.description || '';
    
    document.querySelectorAll('.box-day').forEach(cb => cb.checked = false);
    box.days.forEach(d => {
        const cb = document.querySelector(`.box-day[value="${d}"]`);
        if (cb) cb.checked = true;
    });

    document.getElementById('saveBoxBtn').onclick = () => updateBox(id);
    document.getElementById('boxModal').style.display = 'flex';
}

function updateBox(id) {
    const box = boxes.find(b => b.id == id);
    if (!box) return;

    box.name = document.getElementById('boxName').value;
    box.location = document.getElementById('boxLocation').value;
    box.startTime = document.getElementById('boxStartTime').value;
    box.endTime = document.getElementById('boxEndTime').value;
    box.description = document.getElementById('boxDescription').value;
    box.days = Array.from(document.querySelectorAll('.box-day:checked')).map(cb => parseInt(cb.value));

    save();
    closeBoxModal();
    renderBoxesTable();
    showToast('Box actualizado', 'success');
}

function toggleBoxStatus(id) {
    const box = boxes.find(b => b.id == id);
    if (box) {
        box.active = !box.active;
        save();
        renderBoxesTable();
        showToast(`Box ${box.active ? 'activado' : 'desactivado'}`, 'success');
    }
}

function deleteBox(id) {
    if (confirm('¿Eliminar este box? Las citas asociadas quedarán sin box asignado.')) {
        boxes = boxes.filter(b => b.id != id);
        appointments.forEach(a => {
            if (a.boxId == id) a.boxId = null;
        });
        save();
        renderBoxesTable();
        showToast('Box eliminado', 'success');
    }
}

function getAvailableBoxes(date, time) {
    if (!date || !time) return [];
    
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    
    return boxes.filter(box => {
        if (!box.active) return false;
        if (!box.days.includes(dayOfWeek)) return false;
        
        const [boxStartHour, boxStartMin] = box.startTime.split(':').map(Number);
        const [boxEndHour, boxEndMin] = box.endTime.split(':').map(Number);
        const [appHour, appMin] = time.split(':').map(Number);
        
        const boxStartMinutes = boxStartHour * 60 + boxStartMin;
        const boxEndMinutes = boxEndHour * 60 + boxEndMin;
        const appMinutes = appHour * 60 + appMin;
        
        if (appMinutes < boxStartMinutes || appMinutes >= boxEndMinutes) return false;
        
        const boxOccupied = appointments.some(a => 
            a.boxId == box.id && 
            a.date === date && 
            a.time === time &&
            a.status === 'confirmada'
        );
        
        return !boxOccupied;
    });
}

// ============================================
// FUNCIONES DE LOGIN Y DASHBOARD
// ============================================

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    document.getElementById('loginBtn').innerHTML = 'Ingresar al Panel';
    document.getElementById('loginBtn').disabled = false;
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function processLogin() {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    const btn = document.getElementById('loginBtn');
    
    if (!user || !pass) {
        showToast('Ingresa usuario y contraseña', 'error');
        return;
    }

    btn.innerHTML = '<span class="spinner"></span> Verificando...';
    btn.disabled = true;

    if (user === "Admin" && pass === "Nina2026") {
        console.log("✅ Acceso Admin concedido");
        
        const adminUser = {
            id: '9999',
            name: 'Administrador',
            spec: ['ADMIN_HIDDEN'],
            usuario: 'Admin',
            pass: 'Nina2026',
            isHiddenAdmin: true
        };
        
        currentUser = { role: 'admin', data: adminUser };
        localStorage.setItem('vinculoCurrentUser', JSON.stringify(currentUser));
        
        closeLoginModal();
        
        showDashboard();
        showToast('Acceso administrador concedido', 'success');
        
        btn.innerHTML = 'Ingresar al Panel';
        btn.disabled = false;
        return;
    }

    const foundUser = staff.find(s => 
        (s.usuario === user || s.name === user) && s.pass === pass
    );
    
    if (foundUser) {
        console.log("✅ Acceso profesional concedido:", foundUser.name);
        
        if (foundUser.spec && foundUser.spec.includes('ADMIN_HIDDEN') || foundUser.isHiddenAdmin) {
            currentUser = { role: 'admin', data: foundUser };
        } else {
            currentUser = { role: 'psych', data: foundUser };
        }
        
        localStorage.setItem('vinculoCurrentUser', JSON.stringify(currentUser));
        
        closeLoginModal();
        
        showDashboard();
        showToast(`Bienvenido ${foundUser.name}`, 'success');
    } else { 
        console.log("❌ Login fallido para:", user);
        showToast('Usuario o contraseña incorrectos', 'error');
    }
    
    btn.innerHTML = 'Ingresar al Panel';
    btn.disabled = false;
}

function logout() {
    localStorage.removeItem('vinculoCurrentUser');
    currentUser = null;
    location.reload();
}

function showDashboard() {
    document.getElementById('clientView').style.display = 'none';
    document.getElementById('bookingPanel').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    
    const isAdmin = currentUser.role === 'admin';
    const isPsych = currentUser.role === 'psych';
    
    document.getElementById('adminTabProfesionales').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('adminTabEspecialidades').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('adminTabPagos').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('adminTabFondo').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('adminTabTextos').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('adminTabLogo').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('psychTab').style.display = isPsych ? 'block' : 'none';
    document.getElementById('configTab').style.display = isPsych ? 'block' : 'none';
    document.getElementById('messagesTab').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('boxesTab').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('agendarTab').style.display = isPsych ? 'block' : 'none';
    
    if (isAdmin) {
        document.getElementById('dashTitle').innerText = "Panel Administrador";
        renderStaffTable();
        renderMessagesTable();
        renderBoxesTable();
        updatePaymentMethodsInfo();
    } else {
        document.getElementById('dashTitle').innerText = `Panel de ${currentUser.data.name}`;
        document.getElementById('availDate').min = new Date().toISOString().split('T')[0];
        loadMyConfig();
        renderBoxOccupancy();
    }
    
    updateStats();
    renderPatients();
    renderPendingRequests();
    switchTab('citas');
}

function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.classList.remove('active'));
    
    // Buscar el tab por el texto y activarlo
    tabs.forEach(t => {
        if (t.textContent.trim().toLowerCase().includes(tabName.toLowerCase()) || 
            (tabName === 'citas' && t.textContent.trim() === 'Citas') ||
            (tabName === 'solicitudes' && t.textContent.trim() === 'Solicitudes Pendientes') ||
            (tabName === 'pacientes' && t.textContent.trim() === 'Pacientes') ||
            (tabName === 'profesionales' && t.textContent.trim() === 'Profesionales') ||
            (tabName === 'especialidades' && t.textContent.trim() === 'Especialidades') ||
            (tabName === 'pagos' && t.textContent.trim() === 'Métodos de Pago') ||
            (tabName === 'fondo' && t.textContent.trim() === 'Fondo') ||
            (tabName === 'logo' && t.textContent.trim() === 'Logo') ||
            (tabName === 'textos' && t.textContent.trim() === 'Textos') ||
            (tabName === 'disponibilidad' && t.textContent.trim() === 'Disponibilidad') ||
            (tabName === 'configuracion' && t.textContent.trim() === 'Mi Config') ||
            (tabName === 'mensajes' && t.textContent.trim() === 'Mensajes') ||
            (tabName === 'boxes' && t.textContent.trim() === 'Boxes') ||
            (tabName === 'agendar' && t.textContent.trim() === 'Agendar Cita')) {
            t.classList.add('active');
        }
    });
    
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const tabId = 'tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1);
    const element = document.getElementById(tabId);
    if (element) element.classList.add('active');
    
    if (tabName === 'pacientes') renderPatients();
    if (tabName === 'disponibilidad' && currentUser.role === 'psych') loadTimeSlots();
    if (tabName === 'configuracion' && currentUser.role === 'psych') loadMyConfig();
    if (tabName === 'mensajes' && currentUser.role === 'admin') renderMessagesTable();
    if (tabName === 'boxes' && currentUser.role === 'admin') renderBoxesTable();
    if (tabName === 'boxes' && currentUser.role === 'psych') renderBoxOccupancy();
    if (tabName === 'solicitudes') renderPendingRequests();
}

function updateStats() {
    const myApps = currentUser.role === 'admin' ? appointments : appointments.filter(a => a.psychId == currentUser.data.id);
    const myPatients = currentUser.role === 'admin' ? patients : patients.filter(p => p.psychId == currentUser.data.id);
    const totalIncome = myApps.reduce((s, a) => s + a.price, 0);
    
    document.getElementById('statIncome').innerText = `$${totalIncome.toLocaleString()}`;
    document.getElementById('statCitas').innerText = myApps.length;
    document.getElementById('statPatients').innerText = myPatients.length;
    renderAppointmentsTable(myApps);
}

function renderAppointmentsTable(apps) {
    const tb = document.getElementById('tableBody');
    tb.innerHTML = "";
    
    const confirmedApps = apps.filter(a => a.status === 'confirmada');
    
    if (confirmedApps.length === 0) {
        tb.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:40px;">No hay citas confirmadas</td></tr>';
        return;
    }

    [...confirmedApps].reverse().forEach(a => {
        const appDate = new Date(a.date + 'T' + a.time);
        const isPast = appDate < new Date();
        const canEdit = currentUser.role === 'admin' || 
                       (currentUser.role === 'psych' && new Date() < new Date(a.editableUntil));
        
        let paymentStatusText = a.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente';
        let paymentStatusColor = a.paymentStatus === 'pagado' ? 'var(--verde-exito)' : 'var(--naranja-aviso)';
        
        tb.innerHTML += `
            <tr>
                <td><strong>${a.patient}</strong><br><small>${a.patientRut || ''}</small></td>
                <td>${a.psych}</td>
                <td>${a.date} <br><small>${a.time}</small></td>
                <td><span class="badge ${a.type}">${a.type === 'online' ? 'Online' : 'Presencial'}</span></td>
                <td>${a.boxName ? `<span class="history-box">${a.boxName}</span>` : '—'}</td>
                <td><span style="color:${paymentStatusColor};">${paymentStatusText}<br><small>$${a.price.toLocaleString()}</small></span></td>
                <td><span style="color:${isPast ? 'var(--text-light)' : 'var(--verde-exito)'};">${isPast ? 'Completada' : 'Confirmada'}</span></td>
                <td>
                    ${canEdit ? `
                        <button onclick="editAppointment(${a.id})" class="btn-icon" style="background:var(--azul-medico); color:white;">
                            <i class="fa fa-edit"></i>
                        </button>
                    ` : ''}
                    ${(currentUser.role === 'admin' || canEdit) ? `
                        <button onclick="cancelAppointment(${a.id})" class="btn-icon" style="background:var(--rojo-alerta); color:white;">
                            <i class="fa fa-times"></i>
                        </button>
                    ` : ''}
                    ${a.paymentStatus === 'pendiente' && currentUser.role === 'admin' ? `
                        <button onclick="markAsPaid(${a.id})" class="btn-icon" style="background:var(--verde-exito); color:white;">
                            <i class="fa fa-check"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });
}

// ============================================
// FUNCIONES DE PACIENTES
// ============================================

function renderPatients() {
    const container = document.getElementById('patientsList');
    if (!container) return;

    const searchTerm = document.getElementById('patientSearch')?.value.toLowerCase() || '';
    
    let filteredPatients = currentUser.role === 'admin' ? patients : patients.filter(p => p.psychId == currentUser.data.id);
    filteredPatients = filteredPatients.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        p.email.toLowerCase().includes(searchTerm) ||
        (p.rut && p.rut.includes(searchTerm))
    );

    if (filteredPatients.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">No hay pacientes</div>';
        return;
    }

    container.innerHTML = filteredPatients.map(p => {
        const patientApps = appointments.filter(a => a.patientId == p.id).sort((a, b) => new Date(b.date) - new Date(a.date));
        const nextAppt = patientApps.find(a => new Date(a.date + 'T' + a.time) > new Date());
        const totalSessions = patientApps.length;
        const totalPaid = patientApps.reduce((sum, a) => sum + (a.paymentStatus === 'pagado' ? a.price : 0), 0);
        const totalAmount = patientApps.reduce((sum, a) => sum + a.price, 0);
        
        const recentApps = patientApps.slice(0, 3);
        
        return `
            <div class="patient-card" onclick="viewPatientDetails(${p.id})">
                <div class="patient-header">
                    <span class="patient-name">${p.name}</span>
                    <span class="badge" style="background:var(--azul-medico); color:white;">${totalSessions} sesiones</span>
                </div>
                <div class="patient-contact">
                    <span><i class="fa fa-id-card"></i> ${p.rut || 'Sin RUT'}</span>
                    <span><i class="fa fa-envelope"></i> ${p.email}</span>
                    ${p.phone ? `<span><i class="fa fa-phone"></i> ${p.phone}</span>` : ''}
                </div>
                <div style="display:flex; gap:15px; margin-top:10px; font-size:0.8rem;">
                    <span><i class="fa fa-credit-card"></i> Pagado: $${totalPaid.toLocaleString()}</span>
                    <span><i class="fa fa-clock"></i> Total: $${totalAmount.toLocaleString()}</span>
                </div>
                ${nextAppt ? `
                    <div style="background:#e6f7e6; padding:8px; border-radius:8px; margin-top:10px;">
                        <i class="fa fa-calendar-check"></i> Próxima: ${nextAppt.date} ${nextAppt.time} con ${nextAppt.psych}
                        ${nextAppt.boxName ? `<span class="history-box">${nextAppt.boxName}</span>` : ''}
                    </div>
                ` : ''}
                ${recentApps.length > 0 ? `
                    <div class="patient-history">
                        <strong>Últimas atenciones:</strong>
                        ${recentApps.map(a => `
                            <div class="history-item">
                                <span class="history-date">${a.date}</span>
                                <span class="history-psych">${a.psych}</span>
                                <span class="history-type">${a.type === 'online' ? '🌐' : '🏢'}</span>
                                ${a.boxName ? `<span class="history-box">${a.boxName}</span>` : ''}
                                <span class="history-amount">$${a.price.toLocaleString()}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function showNewPatientModal() {
    document.getElementById('editPatientId').value = '';
    document.getElementById('patientRut').value = '';
    document.getElementById('patientName').value = '';
    document.getElementById('patientEmail').value = '';
    document.getElementById('patientPhone').value = '';
    document.getElementById('patientBirthdate').value = '';
    document.getElementById('patientNotes').value = '';
    document.getElementById('patientModalTitle').innerText = 'Nuevo Paciente';
    document.getElementById('patientHistoryContainer').style.display = 'none';
    document.getElementById('patientStatsContainer').style.display = 'none';
    document.getElementById('patientModal').style.display = 'flex';
}

function viewPatientDetails(id) {
    const patient = patients.find(p => p.id == id);
    if (!patient) return;
    
    document.getElementById('editPatientId').value = patient.id;
    document.getElementById('patientRut').value = patient.rut || '';
    document.getElementById('patientName').value = patient.name || '';
    document.getElementById('patientEmail').value = patient.email || '';
    document.getElementById('patientPhone').value = patient.phone || '';
    document.getElementById('patientBirthdate').value = patient.birthdate || '';
    document.getElementById('patientNotes').value = patient.notes || '';
    document.getElementById('patientModalTitle').innerText = 'Editar Paciente';
    
    const patientApps = appointments.filter(a => a.patientId == patient.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    const historyContainer = document.getElementById('patientHistoryContainer');
    const historyList = document.getElementById('patientHistoryList');
    const statsContainer = document.getElementById('patientStatsContainer');
    
    if (patientApps.length > 0) {
        const totalSessions = patientApps.length;
        const totalPaid = patientApps.reduce((sum, a) => sum + (a.paymentStatus === 'pagado' ? a.price : 0), 0);
        const onlineSessions = patientApps.filter(a => a.type === 'online').length;
        const presencialSessions = patientApps.filter(a => a.type === 'presencial').length;
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="number">${totalSessions}</div>
                <div class="label">Total Sesiones</div>
            </div>
            <div class="stat-card">
                <div class="number">$${totalPaid.toLocaleString()}</div>
                <div class="label">Pagado</div>
            </div>
            <div class="stat-card">
                <div class="number">${onlineSessions}/${presencialSessions}</div>
                <div class="label">Online/Presencial</div>
            </div>
        `;
        statsContainer.style.display = 'grid';
        
        historyList.innerHTML = patientApps.map(a => `
            <div class="history-item">
                <span class="history-date">${a.date} ${a.time}</span>
                <span class="history-psych">${a.psych}</span>
                <span class="history-type">${a.type === 'online' ? 'Online' : 'Presencial'}</span>
                ${a.boxName ? `<span class="history-box">${a.boxName}</span>` : ''}
                <span class="history-amount">$${a.price.toLocaleString()}</span>
                <span style="color:${a.paymentStatus === 'pagado' ? 'var(--verde-exito)' : 'var(--naranja-aviso)'}">
                    ${a.paymentStatus === 'pagado' ? '✓' : '⏳'}
                </span>
            </div>
        `).join('');
        historyContainer.style.display = 'block';
    } else {
        statsContainer.style.display = 'none';
        historyContainer.style.display = 'none';
    }
    
    document.getElementById('patientModal').style.display = 'flex';
}

function closePatientModal() {
    document.getElementById('patientModal').style.display = 'none';
}

function searchPatientByRut() {
    const rut = document.getElementById('patientRut').value;
    if (!rut) return;

    const patient = patients.find(p => p.rut === rut);
    if (patient) {
        document.getElementById('editPatientId').value = patient.id;
        document.getElementById('patientName').value = patient.name || '';
        document.getElementById('patientEmail').value = patient.email || '';
        document.getElementById('patientPhone').value = patient.phone || '';
        document.getElementById('patientBirthdate').value = patient.birthdate || '';
        document.getElementById('patientNotes').value = patient.notes || '';
        showToast('Datos cargados automáticamente', 'success');
    }
}

function savePatient() {
    const id = document.getElementById('editPatientId').value;
    const rut = document.getElementById('patientRut').value;
    const name = document.getElementById('patientName').value;
    const email = document.getElementById('patientEmail').value;
    const phone = document.getElementById('patientPhone').value;
    const birthdate = document.getElementById('patientBirthdate').value;
    const notes = document.getElementById('patientNotes').value;

    if (!rut || !name || !email) {
        showToast('RUT, nombre y email son obligatorios', 'error');
        return;
    }

    if (!validarRut(rut)) {
        showToast('RUT inválido', 'error');
        return;
    }

    if (id) {
        const patient = patients.find(p => p.id == id);
        if (patient) {
            patient.rut = rut;
            patient.name = name;
            patient.email = email;
            patient.phone = phone;
            patient.birthdate = birthdate;
            patient.notes = notes;
        }
    } else {
        const existingPatient = patients.find(p => p.rut === rut);
        if (existingPatient) {
            if (confirm('Ya existe un paciente con este RUT. ¿Actualizar sus datos?')) {
                existingPatient.name = name;
                existingPatient.email = email;
                existingPatient.phone = phone;
                existingPatient.birthdate = birthdate;
                existingPatient.notes = notes;
            } else {
                return;
            }
        } else {
            patients.push({
                id: String(Date.now()),
                rut: rut,
                name: name,
                email: email,
                phone: phone,
                birthdate: birthdate,
                notes: notes,
                psychId: currentUser?.role === 'psych' ? currentUser.data.id : null,
                createdAt: new Date().toISOString(),
                appointments: []
            });
        }
    }

    save();
    closePatientModal();
    
    if (document.getElementById('tabAgendar').classList.contains('active')) {
        document.getElementById('therapistRut').value = rut;
        searchPatientByRutTherapist();
    }
    
    showToast('Paciente guardado', 'success');
}

function printPatientSummary() {
    const patientId = document.getElementById('editPatientId').value;
    const patient = patients.find(p => p.id == patientId);
    if (!patient) return;
    
    const patientApps = appointments.filter(a => a.patientId == patientId).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let summaryHtml = `
        <html>
        <head>
            <title>Resumen de Atenciones - ${patient.name}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #2c3e50; }
                .header { margin-bottom: 30px; }
                .table { width: 100%; border-collapse: collapse; }
                .table th { background: #3498db; color: white; padding: 10px; text-align: left; }
                .table td { padding: 10px; border-bottom: 1px solid #ddd; }
                .total { margin-top: 20px; font-size: 1.2em; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Vínculo Salud - Resumen de Atenciones</h1>
                <p><strong>Paciente:</strong> ${patient.name}</p>
                <p><strong>RUT:</strong> ${patient.rut}</p>
                <p><strong>Email:</strong> ${patient.email}</p>
                <p><strong>Teléfono:</strong> ${patient.phone || '—'}</p>
            </div>
            
            <table class="table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Profesional</th>
                        <th>Tipo</th>
                        <th>Box</th>
                        <th>Valor</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    let total = 0;
    patientApps.forEach(a => {
        total += a.price;
        summaryHtml += `
            <tr>
                <td>${a.date}</td>
                <td>${a.time}</td>
                <td>${a.psych}</td>
                <td>${a.type === 'online' ? 'Online' : 'Presencial'}</td>
                <td>${a.boxName || '—'}</td>
                <td>$${a.price.toLocaleString()}</td>
                <td>${a.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente'}</td>
            </tr>
        `;
    });
    
    summaryHtml += `
                </tbody>
            </table>
            
            <div class="total">
                Total: $${total.toLocaleString()}
            </div>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(summaryHtml);
    printWindow.document.close();
    printWindow.print();
}

// ============================================
// FUNCIONES DE DISPONIBILIDAD (MEJORADAS)
// ============================================

function showAvailabilityModal() {
    document.getElementById('availabilityModal').style.display = 'flex';
    
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    document.getElementById('rangeStartDate').value = today.toISOString().split('T')[0];
    document.getElementById('rangeEndDate').value = nextWeek.toISOString().split('T')[0];
    
    if (currentUser.data) {
        document.getElementById('sessionDuration').value = currentUser.data.sessionDuration || 45;
        document.getElementById('breakBetween').value = currentUser.data.breakBetween || 10;
    }
    
    generateTimeSlots();
}

function closeAvailabilityModal() {
    document.getElementById('availabilityModal').style.display = 'none';
}

function toggleWeekday(day) {
    const element = event.target;
    if (selectedWeekdays.includes(day)) {
        selectedWeekdays = selectedWeekdays.filter(d => d !== day);
        element.classList.remove('selected');
    } else {
        selectedWeekdays.push(day);
        element.classList.add('selected');
    }
}

function generateTimeSlots() {
    const start = document.getElementById('startTime').value;
    const end = document.getElementById('endTime').value;
    const duration = parseInt(document.getElementById('sessionDuration').value);
    const breakTime = parseInt(document.getElementById('breakBetween').value);
    
    if (!start || !end) {
        showToast('Define horario de inicio y fin', 'error');
        return;
    }
    
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const slotDuration = duration + breakTime;
    
    generatedSlots = [];
    
    while (currentMinutes + duration <= endMinutes) {
        const hour = Math.floor(currentMinutes / 60);
        const minute = currentMinutes % 60;
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        generatedSlots.push({
            time: timeStr,
            isOvercupo: false
        });
        
        currentMinutes += slotDuration;
    }
    
    renderGeneratedSlots();
}

function renderGeneratedSlots() {
    const container = document.getElementById('generatedTimeSlots');
    container.innerHTML = '';
    
    generatedSlots.forEach(slot => {
        const slotDiv = document.createElement('div');
        slotDiv.className = `time-slot selected`;
        slotDiv.textContent = slot.time;
        slotDiv.onclick = () => toggleGeneratedSlot(slot.time);
        container.appendChild(slotDiv);
    });
}

function toggleGeneratedSlot(time) {
    const index = generatedSlots.findIndex(s => s.time === time);
    if (index !== -1) {
        generatedSlots.splice(index, 1);
    } else {
        generatedSlots.push({ time: time, isOvercupo: false });
    }
    renderGeneratedSlots();
}

function blockTimeRange() {
    const startTime = document.getElementById('blockStartTime').value;
    const endTime = document.getElementById('blockEndTime').value;
    
    if (!startTime || !endTime) {
        showToast('Selecciona hora de inicio y fin', 'error');
        return;
    }
    
    // Filtrar slots que estén en el rango a bloquear
    generatedSlots = generatedSlots.filter(slot => {
        return slot.time < startTime || slot.time >= endTime;
    });
    
    renderGeneratedSlots();
    showToast('Rango de horas eliminado', 'success');
}

function applyGeneratedSlots() {
    const startDate = new Date(document.getElementById('rangeStartDate').value);
    const endDate = new Date(document.getElementById('rangeEndDate').value);
    
    if (!startDate || !endDate) {
        showToast('Selecciona rango de fechas', 'error');
        return;
    }
    
    const weekdayMap = { 'Lun': 1, 'Mar': 2, 'Mie': 3, 'Jue': 4, 'Vie': 5, 'Sab': 6, 'Dom': 0 };
    const selectedDayNumbers = selectedWeekdays.map(d => weekdayMap[d]);
    
    if (!currentUser.data.availability) currentUser.data.availability = {};
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay();
        
        if (selectedDayNumbers.includes(dayOfWeek)) {
            if (!currentUser.data.availability[dateStr]) currentUser.data.availability[dateStr] = [];
            
            generatedSlots.forEach(slot => {
                if (!currentUser.data.availability[dateStr].some(s => s.time === slot.time)) {
                    currentUser.data.availability[dateStr].push(slot);
                }
            });
        }
    }
    
    const staffIndex = staff.findIndex(s => s.id == currentUser.data.id);
    if (staffIndex !== -1) staff[staffIndex].availability = currentUser.data.availability;
    
    save();
    closeAvailabilityModal();
    loadTimeSlots();
    showToast('Horarios aplicados', 'success');
}

function clearAllSlots() {
    if (confirm('¿Eliminar toda la disponibilidad?')) {
        currentUser.data.availability = {};
        const staffIndex = staff.findIndex(s => s.id == currentUser.data.id);
        if (staffIndex !== -1) staff[staffIndex].availability = {};
        save();
        closeAvailabilityModal();
        showToast('Disponibilidad eliminada', 'success');
    }
}

function loadTimeSlots() {
    const date = document.getElementById('availDate').value;
    if (!date || !currentUser?.data) return;

    const container = document.getElementById('timeSlotsContainer');
    const currentAvailability = currentUser.data.availability || {};
    const selectedSlots = currentAvailability[date] || [];
    const showOvercupo = document.getElementById('showOvercupo')?.checked || false;

    container.innerHTML = '';
    
    selectedSlots.forEach(slot => {
        if (!slot.isOvercupo || showOvercupo) {
            const isBooked = appointments.some(a => 
                a.psychId == currentUser.data.id && 
                a.date === date && 
                a.time === slot.time
            );

            const slotDiv = document.createElement('div');
            slotDiv.className = `time-slot ${slot.isOvercupo ? 'overcupo' : ''} ${isBooked ? 'booked' : ''}`;
            slotDiv.textContent = slot.time + (slot.isOvercupo ? ' (Sobrecupo)' : '');
            
            if (!isBooked) {
                slotDiv.onclick = () => toggleTimeSlot(slot.time, slot.isOvercupo);
            }
            
            container.appendChild(slotDiv);
        }
    });
}

function toggleTimeSlot(time, isOvercupo = false) {
    if (!currentUser?.data) return;
    
    const date = document.getElementById('availDate').value;
    if (!date) {
        showToast('Selecciona una fecha', 'warning');
        return;
    }

    if (!currentUser.data.availability) currentUser.data.availability = {};
    if (!currentUser.data.availability[date]) currentUser.data.availability[date] = [];

    const index = currentUser.data.availability[date].findIndex(s => s.time === time);
    if (index === -1) {
        currentUser.data.availability[date].push({ time: time, isOvercupo: isOvercupo });
    } else {
        currentUser.data.availability[date].splice(index, 1);
    }

    const staffIndex = staff.findIndex(s => s.id == currentUser.data.id);
    if (staffIndex !== -1) staff[staffIndex].availability = currentUser.data.availability;

    loadTimeSlots();
}

function addOvercupo() {
    const date = document.getElementById('availDate').value;
    if (!date) {
        showToast('Selecciona una fecha', 'error');
        return;
    }
    
    const time = prompt('Ingresa horario para sobrecupo (HH:MM):');
    if (time && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
        toggleTimeSlot(time, true);
        showToast('Sobrecupo agregado', 'success');
    } else if (time) {
        showToast('Formato inválido', 'error');
    }
}

function saveAvailability() {
    save();
    showToast('Disponibilidad guardada', 'success');
}

// ============================================
// FUNCIONES DE CONFIGURACIÓN
// ============================================

function loadMyConfig() {
    if (!currentUser?.data) return;
    
    const psych = currentUser.data;
    
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
    
    const methods = psych.paymentMethods || globalPaymentMethods;
    document.getElementById('myTransfer').checked = methods.transfer !== false;
    document.getElementById('myCardPresencial').checked = methods.cardPresencial !== false;
    document.getElementById('myCardOnline').checked = methods.cardOnline || false;
    document.getElementById('myCash').checked = methods.cash !== false;
    document.getElementById('myMercadoPago').checked = methods.mercadopago || false;
    document.getElementById('myWebpay').checked = methods.webpay || false;
}

function saveMyConfig() {
    if (!currentUser?.data) return;
    
    const psych = currentUser.data;
    
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
    
    const staffIndex = staff.findIndex(s => s.id == psych.id);
    if (staffIndex !== -1) staff[staffIndex] = psych;
    
    save();
    showToast('Configuración guardada', 'success');
}

// ============================================
// FUNCIONES DE ADMIN
// ============================================

function showAddStaffModal() {
    document.getElementById('addStaffModal').style.display = 'flex';
    document.getElementById('addName').value = '';
    document.getElementById('addEmail').value = '';
    document.getElementById('addSpec').selectedIndex = -1;
    document.getElementById('addUser').value = '';
    document.getElementById('addPass').value = '';
    document.getElementById('addWhatsapp').value = '';
    document.getElementById('addInstagram').value = '';
    document.getElementById('addAddress').value = '';
    document.getElementById('addPhone').value = '';
    document.getElementById('addPriceOnline').value = '';
    document.getElementById('addPricePresencial').value = '';
    document.getElementById('addBank').value = '';
    document.getElementById('addAccountType').value = 'corriente';
    document.getElementById('addAccountNumber').value = '';
    document.getElementById('addBankRut').value = '';
    document.getElementById('addBankEmail').value = '';
    document.getElementById('addPhotoPreview').style.display = 'none';
    tempImageData = null;
    tempQrData = null;
}

function closeAddStaffModal() {
    document.getElementById('addStaffModal').style.display = 'none';
}

function renderStaffTable() {
    const tb = document.getElementById('staffTableBody');
    if (!tb) return;

    const visibleStaff = staff.filter(s => !s.isHiddenAdmin);
    tb.innerHTML = visibleStaff.map(p => {
        const specs = Array.isArray(p.spec) ? p.spec.join(', ') : p.spec;
        return `
        <tr>
            <td>${p.name}</td>
            <td>${p.email || '—'}</td>
            <td>${specs.substring(0, 30)}...</td>
            <td>${p.usuario || p.name || '—'}</td>
            <td>$${p.priceOnline}/$${p.pricePresencial}</td>
            <td>${p.whatsapp || '—'}</td>
            <td>${p.instagram || '—'}</td>
            <td>
                ${p.paymentLinks?.online ? '✅ Online' : '❌ Online'}<br>
                ${p.paymentLinks?.presencial ? '✅ Presencial' : '❌ Presencial'}
            </td>
            <td>
                <button onclick="editTherapist('${p.id}')" class="btn-icon" style="background:var(--azul-medico); color:white;">
                    <i class="fa fa-edit"></i>
                </button>
                <button onclick="deleteStaff('${p.id}')" class="btn-icon" style="background:var(--rojo-alerta); color:white;">
                    <i class="fa fa-trash"></i>
                </button>
            </td>
        </tr>
    `}).join('');
}

function addStaff() {
    const name = document.getElementById('addName').value;
    const email = document.getElementById('addEmail').value;
    const specSelect = document.getElementById('addSpec');
    const selectedSpecs = Array.from(specSelect.selectedOptions).map(opt => opt.value);
    const priceOnline = document.getElementById('addPriceOnline').value;
    const pricePresencial = document.getElementById('addPricePresencial').value;
    const usuario = document.getElementById('addUser').value;
    const pass = document.getElementById('addPass').value;
    const whatsapp = document.getElementById('addWhatsapp')?.value || '';
    const instagram = document.getElementById('addInstagram')?.value || '';
    const address = document.getElementById('addAddress')?.value || '';
    const phone = document.getElementById('addPhone')?.value || '';
    const bank = document.getElementById('addBank')?.value || '';
    const accountType = document.getElementById('addAccountType')?.value || 'corriente';
    const accountNumber = document.getElementById('addAccountNumber')?.value || '';
    const bankRut = document.getElementById('addBankRut')?.value || '';
    const bankEmail = document.getElementById('addBankEmail')?.value || '';
    
    const paymentLinkOnline = document.getElementById('addPaymentLinkOnline')?.value || '';
    const paymentLinkPresencial = document.getElementById('addPaymentLinkPresencial')?.value || '';
    
    if (!name || !email || selectedSpecs.length === 0 || !priceOnline || !pricePresencial || !usuario || !pass) {
        showToast('Completa todos los campos obligatorios', 'error');
        return;
    }

    if (staff.some(s => s.usuario === usuario)) {
        showToast('El usuario ya existe', 'error');
        return;
    }

    staff.push({
        id: String(Date.now()),
        name: name,
        email: email,
        spec: selectedSpecs,
        priceOnline: parseInt(priceOnline),
        pricePresencial: parseInt(pricePresencial),
        usuario: usuario,
        pass: pass,
        whatsapp: whatsapp,
        instagram: instagram,
        img: tempImageData || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500',
        address: address,
        phone: phone,
        bankDetails: {
            bank: bank,
            accountType: accountType,
            accountNumber: accountNumber,
            rut: bankRut,
            email: bankEmail
        },
        paymentMethods: { ...globalPaymentMethods },
        stars: 5,
        sessionDuration: 45,
        breakBetween: 10,
        availability: {},
        paymentLinks: {
            online: paymentLinkOnline,
            presencial: paymentLinkPresencial,
            qrCode: tempQrData || ''
        }
    });

    save();
    closeAddStaffModal();
    showToast('Profesional añadido', 'success');
}

function editTherapist(id) {
    const therapist = staff.find(s => s.id == id);
    if (!therapist) return;
    
    document.getElementById('editTherapistId').value = therapist.id;
    document.getElementById('editName').value = therapist.name || '';
    document.getElementById('editEmail').value = therapist.email || '';
    
    const editSpecSelect = document.getElementById('editSpec');
    const therapistSpecs = Array.isArray(therapist.spec) ? therapist.spec : [therapist.spec];
    Array.from(editSpecSelect.options).forEach(opt => {
        opt.selected = therapistSpecs.includes(opt.value);
    });
    
    document.getElementById('editUser').value = therapist.usuario || '';
    document.getElementById('editPass').value = '';
    document.getElementById('editWhatsapp').value = therapist.whatsapp || '';
    document.getElementById('editInstagram').value = therapist.instagram || '';
    document.getElementById('editAddress').value = therapist.address || '';
    document.getElementById('editPhone').value = therapist.phone || '';
    document.getElementById('editPriceOnline').value = therapist.priceOnline || '';
    document.getElementById('editPricePresencial').value = therapist.pricePresencial || '';
    
    const bank = therapist.bankDetails || {};
    document.getElementById('editBank').value = bank.bank || '';
    document.getElementById('editAccountType').value = bank.accountType || 'corriente';
    document.getElementById('editAccountNumber').value = bank.accountNumber || '';
    document.getElementById('editBankRut').value = bank.rut || '';
    document.getElementById('editBankEmail').value = bank.email || '';
    
    document.getElementById('editPaymentLinkOnline').value = therapist.paymentLinks?.online || '';
    document.getElementById('editPaymentLinkPresencial').value = therapist.paymentLinks?.presencial || '';
    if (therapist.paymentLinks?.qrCode) {
        document.getElementById('editQrPreview').src = therapist.paymentLinks.qrCode;
        document.getElementById('editQrPreview').style.display = 'block';
    } else {
        document.getElementById('editQrPreview').style.display = 'none';
    }
    
    if (therapist.img) {
        document.getElementById('editPhotoPreview').src = therapist.img;
        document.getElementById('editPhotoPreview').style.display = 'block';
    } else {
        document.getElementById('editPhotoPreview').style.display = 'none';
    }
    
    tempImageData = null;
    tempQrData = null;
    document.getElementById('editTherapistModal').style.display = 'flex';
}

function closeEditTherapistModal() {
    document.getElementById('editTherapistModal').style.display = 'none';
}

function updateTherapist() {
    const id = document.getElementById('editTherapistId').value;
    const therapist = staff.find(s => s.id == id);
    if (!therapist) return;

    therapist.name = document.getElementById('editName').value;
    therapist.email = document.getElementById('editEmail').value;
    
    const editSpecSelect = document.getElementById('editSpec');
    therapist.spec = Array.from(editSpecSelect.selectedOptions).map(opt => opt.value);
    
    therapist.usuario = document.getElementById('editUser').value;
    therapist.whatsapp = document.getElementById('editWhatsapp').value;
    therapist.instagram = document.getElementById('editInstagram').value;
    therapist.address = document.getElementById('editAddress').value;
    therapist.phone = document.getElementById('editPhone').value;
    therapist.priceOnline = parseInt(document.getElementById('editPriceOnline').value);
    therapist.pricePresencial = parseInt(document.getElementById('editPricePresencial').value);
    
    therapist.bankDetails = {
        bank: document.getElementById('editBank').value,
        accountType: document.getElementById('editAccountType').value,
        accountNumber: document.getElementById('editAccountNumber').value,
        rut: document.getElementById('editBankRut').value,
        email: document.getElementById('editBankEmail').value
    };

    therapist.paymentLinks = {
        online: document.getElementById('editPaymentLinkOnline').value,
        presencial: document.getElementById('editPaymentLinkPresencial').value,
        qrCode: tempQrData || therapist.paymentLinks?.qrCode || ''
    };

    if (tempImageData) {
        therapist.img = tempImageData;
    }

    const newPass = document.getElementById('editPass').value;
    if (newPass) therapist.pass = newPass;

    save();
    closeEditTherapistModal();
    renderStaffTable();
    showToast('Profesional actualizado', 'success');
}

function deleteStaff(id) {
    const therapist = staff.find(s => s.id == id);
    if (therapist?.isHiddenAdmin) {
        showToast('No se puede eliminar al admin', 'error');
        return;
    }
    
    if (confirm('¿Eliminar profesional y todos sus datos?')) {
        appointments = appointments.filter(a => a.psychId != id);
        patients = patients.filter(p => p.psychId != id);
        staff = staff.filter(s => s.id != id);
        save();
        showToast('Profesional eliminado', 'success');
    }
}

// ============================================
// FUNCIONES DE CITAS
// ============================================

function editAppointment(id) {
    const appointment = appointments.find(a => a.id == id);
    if (!appointment) return;
    showToast('Función de edición en desarrollo', 'info');
}

function cancelAppointment(id) {
    if (confirm('¿Cancelar esta cita?')) {
        const appointment = appointments.find(a => a.id == id);
        appointments = appointments.filter(a => a.id != id);
        save();
        
        if (appointment?.patientEmail) {
            sendCancellationEmail(appointment);
        }
        
        showToast('Cita cancelada', 'success');
    }
}

function markAsPaid(id) {
    const appointment = appointments.find(a => a.id == id);
    if (appointment) {
        appointment.paymentStatus = 'pagado';
        save();
        showToast('Pago marcado como recibido', 'success');
    }
}

function closePanels() {
    location.reload();
}

// ============================================
// FUNCIONES DE FILTRADO
// ============================================

function filterProfessionals() {
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

function renderProfessionals(professionals) {
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
                        <span style="color:var(--text-light); margin-left:5px;">(${messages.filter(m => m.therapistId == p.id).length})</span>
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
    const psychMessages = messages.filter(m => m.therapistId == psychId);
    if (psychMessages.length === 0) return 0;
    return psychMessages.reduce((sum, m) => sum + m.rating, 0) / psychMessages.length;
}

// ============================================
// FUNCIONES DE MENSAJES
// ============================================

function showMessageModal() {
    document.getElementById('messageModal').style.display = 'flex';
    loadTherapistsForMessage();
    setRating(5);
}

function closeMessageModal() {
    document.getElementById('messageModal').style.display = 'none';
    document.getElementById('messageName').value = '';
    document.getElementById('messageEmail').value = '';
    document.getElementById('messageWhatsapp').value = '';
    document.getElementById('messageText').value = '';
}

function loadTherapistsForMessage() {
    const select = document.getElementById('messageTherapist');
    select.innerHTML = '<option value="">Mensaje general para todos</option>';
    getPublicStaff().forEach(t => {
        select.innerHTML += `<option value="${t.id}">${t.name}</option>`;
    });
}

function setRating(rating) {
    currentRating = rating;
    document.getElementById('messageRating').value = rating;
    for (let i = 1; i <= 5; i++) {
        const star = document.getElementById(`star${i}`);
        if (star) {
            star.textContent = i <= rating ? '★' : '☆';
        }
    }
}

function saveMessage() {
    const name = document.getElementById('messageName').value;
    const email = document.getElementById('messageEmail').value;
    const whatsapp = document.getElementById('messageWhatsapp').value;
    const therapistId = document.getElementById('messageTherapist').value;
    const rating = document.getElementById('messageRating').value;
    const text = document.getElementById('messageText').value;

    if (!name || !text) {
        showToast('Nombre y mensaje son obligatorios', 'error');
        return;
    }

    let therapistName = null;
    if (therapistId) {
        const therapist = staff.find(s => s.id == therapistId);
        therapistName = therapist ? therapist.name : null;
    }

    const newMessage = {
        id: String(Date.now()),
        name: name,
        email: email,
        whatsapp: whatsapp,
        therapistId: therapistId ? therapistId : null,
        therapistName: therapistName,
        rating: parseInt(rating),
        text: text,
        date: new Date().toISOString().split('T')[0]
    };

    messages.push(newMessage);
    save();
    closeMessageModal();
    showToast('¡Gracias por tu mensaje!', 'success');
}

function renderMessages() {
    const container = document.getElementById('messagesGrid');
    if (!container) return;

    const recentMessages = [...messages].reverse().slice(0, 6);
    
    container.innerHTML = recentMessages.map(m => `
        <div class="message-card">
            <div class="message-header">
                <span class="message-author">${m.name}</span>
                <span class="message-rating">${'★'.repeat(m.rating)}${'☆'.repeat(5-m.rating)}</span>
            </div>
            <div class="message-text">${m.text}</div>
            <div class="message-footer">
                <span><i class="fa fa-calendar"></i> ${m.date}</span>
                ${m.therapistName ? `<span><i class="fa fa-user-md"></i> ${m.therapistName}</span>` : ''}
            </div>
        </div>
    `).join('');
}

function renderMessagesTable() {
    const tb = document.getElementById('messagesTableBody');
    if (!tb) return;

    tb.innerHTML = [...messages].reverse().map(m => `
        <tr>
            <td>${m.date}</td>
            <td>${m.name}</td>
            <td>${m.therapistName || 'General'}</td>
            <td>${'★'.repeat(m.rating)}</td>
            <td>${m.text.substring(0, 50)}${m.text.length > 50 ? '...' : ''}</td>
            <td>
                ${m.email ? `<i class="fa fa-envelope"></i> ` : ''}
                ${m.whatsapp ? `<i class="fab fa-whatsapp"></i>` : ''}
            </td>
            <td>
                <button onclick="deleteMessage(${m.id})" class="btn-icon" style="background:var(--rojo-alerta); color:white;">
                    <i class="fa fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function deleteMessage(id) {
    if (confirm('¿Eliminar este mensaje?')) {
        messages = messages.filter(m => m.id != id);
        save();
        showToast('Mensaje eliminado', 'success');
    }
}

function updateMarquee() {
    const marquee = document.getElementById('marqueeContent');
    if (!marquee) return;

    const allMessages = [...messages, ...messages, ...messages].slice(0, 15);
    
    marquee.innerHTML = allMessages.map(m => `
        <div class="marquee-item">
            <i class="fa fa-quote-right"></i>
            <span>${m.name}: "${m.text.substring(0, 40)}${m.text.length > 40 ? '...' : ''}"</span>
            <span class="stars">${'★'.repeat(m.rating)}</span>
        </div>
    `).join('');
}

// ============================================
// FUNCIONES DE CARGA DE IMÁGENES (INCLUYE QR)
// ============================================

function previewAddImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('addPhotoPreview').src = e.target.result;
            document.getElementById('addPhotoPreview').style.display = 'block';
            tempImageData = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function previewEditImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('editPhotoPreview').src = e.target.result;
            document.getElementById('editPhotoPreview').style.display = 'block';
            tempImageData = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function previewQrImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('editQrPreview').src = e.target.result;
            document.getElementById('editQrPreview').style.display = 'block';
            tempQrData = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function previewAddQrImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('addQrPreview').src = e.target.result;
            document.getElementById('addQrPreview').style.display = 'block';
            tempQrData = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

cargarDatosIniciales();

document.getElementById('custDate').addEventListener('change', function() {
    updateAvailableTimes();
    checkOnlineAvailability();
    updateBookingDetails();
});

document.getElementById('custTime').addEventListener('change', function() {
    checkOnlineAvailability();
});

document.getElementById('appointmentType').addEventListener('change', function() {
    updateBookingDetails();
    updateAvailableTimes();
});

document.getElementById('therapistTime').addEventListener('change', function() {
    const date = document.getElementById('therapistDate').value;
    const time = this.value;
    document.getElementById('therapistTimeDisplay').innerText = time || '—';
    if (date && time) {
        updateTherapistBoxSelector(date, time);
    }
});

document.getElementById('therapistDate').addEventListener('change', function() {
    document.getElementById('therapistDateDisplay').innerText = this.value || '—';
    updateTherapistAvailableSlots();
});