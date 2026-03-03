// js/modules/profesionales.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast } from './utils.js';

// ============================================
// FUNCIONES DE ADMIN PARA PROFESIONALES
// ============================================

export function showAddStaffModal() {
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
    document.getElementById('addPaymentLinkOnline').value = '';
    document.getElementById('addPaymentLinkPresencial').value = '';
    document.getElementById('addPhotoPreview').style.display = 'none';
    document.getElementById('addQrPreview').style.display = 'none';
    
    // Limpiar campo de género
    const addGenero = document.getElementById('addGenero');
    if (addGenero) addGenero.value = '';
    
    state.setTempImageData(null);
    state.setTempQrData(null);
}

export function closeAddStaffModal() {
    document.getElementById('addStaffModal').style.display = 'none';
}

// ============================================
// 🆕 FUNCIÓN PARA QUE EL PROFESIONAL EDITE SU PERFIL
// ============================================

export function openMyProfileModal() {
    // Verificar que hay un profesional logueado
    if (!state.currentUser || state.currentUser.role !== 'psych') {
        showToast('Debes iniciar sesión como profesional', 'error');
        return;
    }
    
    const psych = state.currentUser.data;
    if (!psych) {
        showToast('Error al cargar datos del profesional', 'error');
        return;
    }
    
    console.log('🔓 Abriendo edición de perfil para:', psych.name);
    
    // Crear modal si no existe
    crearModalEdicionProfesional();
    
    // Llenar el modal con los datos actuales
    document.getElementById('editMyName').value = psych.name || '';
    document.getElementById('editMyEmail').value = psych.email || '';
    document.getElementById('editMyTitle').value = psych.title || '';
    
    // Género
    const editMyGenero = document.getElementById('editMyGenero');
    if (editMyGenero) editMyGenero.value = psych.genero || '';
    
    // Especialidades
    const editMySpec = document.getElementById('editMySpec');
    if (editMySpec) {
        const psychSpecs = Array.isArray(psych.spec) ? psych.spec : [psych.spec];
        Array.from(editMySpec.options).forEach(opt => {
            opt.selected = psychSpecs.includes(opt.value);
        });
    }
    
    // Biografía / Descripción
    document.getElementById('editMyBio').value = psych.bio || '';
    
    // Registro profesional
    document.getElementById('editMyProfessionalId').value = psych.professionalId || '';
    document.getElementById('editMyExperience').value = psych.experience || '';
    document.getElementById('editMyEducation').value = psych.education || '';
    document.getElementById('editMyLanguages').value = psych.languages ? psych.languages.join(', ') : '';
    
    // Redes sociales
    document.getElementById('editMyLinkedin').value = psych.socialLinks?.linkedin || '';
    document.getElementById('editMyInstagram').value = psych.socialLinks?.instagram || '';
    document.getElementById('editMyWebsite').value = psych.socialLinks?.website || '';
    
    // Precios
    document.getElementById('editMyPriceOnline').value = psych.priceOnline || '';
    document.getElementById('editMyPricePresencial').value = psych.pricePresencial || '';
    document.getElementById('editMyDuration').value = psych.sessionDuration || 45;
    
    // Métodos de pago (checkboxes)
    const methods = psych.paymentMethods || state.globalPaymentMethods;
    document.getElementById('editMyPaymentTransfer').checked = methods.transfer || false;
    document.getElementById('editMyPaymentCardPresencial').checked = methods.cardPresencial || false;
    document.getElementById('editMyPaymentCash').checked = methods.cash || false;
    document.getElementById('editMyPaymentCardOnline').checked = methods.cardOnline || false;
    document.getElementById('editMyPaymentMercadopago').checked = methods.mercadopago || false;
    document.getElementById('editMyPaymentWebpay').checked = methods.webpay || false;
    
    // Datos bancarios
    const bank = psych.bankDetails || {};
    document.getElementById('editMyBank').value = bank.bank || '';
    document.getElementById('editMyAccountType').value = bank.accountType || 'corriente';
    document.getElementById('editMyAccountNumber').value = bank.accountNumber || '';
    document.getElementById('editMyBankRut').value = bank.rut || '';
    document.getElementById('editMyBankEmail').value = bank.email || '';
    
    // Links de pago
    document.getElementById('editMyPaymentLinkOnline').value = psych.paymentLinks?.online || '';
    document.getElementById('editMyPaymentLinkPresencial').value = psych.paymentLinks?.presencial || '';
    
    // Foto de perfil
    const photoPreview = document.getElementById('editMyPhotoPreview');
    if (photoPreview) {
        if (psych.img || psych.photoURL) {
            photoPreview.src = psych.img || psych.photoURL;
            photoPreview.style.display = 'block';
        } else {
            photoPreview.src = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500';
            photoPreview.style.display = 'block';
        }
    }
    
    // QR
    const qrPreview = document.getElementById('editMyQrPreview');
    if (qrPreview) {
        if (psych.paymentLinks?.qrCode) {
            qrPreview.src = psych.paymentLinks.qrCode;
            qrPreview.style.display = 'block';
        } else {
            qrPreview.style.display = 'none';
        }
    }
    
    // Mostrar modal
    document.getElementById('editMyProfileModal').style.display = 'flex';
}

// ============================================
// 🆕 FUNCIÓN PARA CREAR MODAL DE EDICIÓN (si no existe)
// ============================================

function crearModalEdicionProfesional() {
    // Verificar si ya existe el modal
    if (document.getElementById('editMyProfileModal')) return;
    
    // Obtener especialidades para los selects
    const specialtiesHtml = state.specialties
        .map(s => `<option value="${s.name}">${s.name}</option>`)
        .join('');
    
    // Crear el modal HTML
    const modalHTML = `
    <div id="editMyProfileModal" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
            <span class="close" onclick="document.getElementById('editMyProfileModal').style.display='none'">&times;</span>
            <h2 style="margin-bottom: 20px;">✏️ Editar Mi Perfil Profesional</h2>
            
            <!-- TABS PARA ORGANIZAR -->
            <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                <button class="tab-btn active" onclick="showMyProfileTab('basic')" id="tabBasicBtn">📋 Básico</button>
                <button class="tab-btn" onclick="showMyProfileTab('prices')" id="tabPricesBtn">💰 Precios</button>
                <button class="tab-btn" onclick="showMyProfileTab('payment')" id="tabPaymentBtn">💳 Pagos</button>
                <button class="tab-btn" onclick="showMyProfileTab('social')" id="tabSocialBtn">🌐 Redes</button>
            </div>
            
            <!-- TAB 1: DATOS BÁSICOS -->
            <div id="tabBasic" class="profile-tab" style="display: block;">
                <div style="display: flex; gap: 30px; margin-bottom: 20px;">
                    <!-- Foto de perfil -->
                    <div style="flex: 0 0 150px; text-align: center;">
                        <div style="width: 150px; height: 150px; border-radius: 50%; overflow: hidden; margin-bottom: 10px; border: 3px solid var(--primario);">
                            <img id="editMyPhotoPreview" src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <input type="file" id="editMyPhotoUpload" accept="image/*" style="display: none;" onchange="previewMyPhoto(this)">
                        <button onclick="document.getElementById('editMyPhotoUpload').click()" class="btn-secondary" style="font-size: 12px;">
                            <i class="fa fa-camera"></i> Cambiar foto
                        </button>
                    </div>
                    
                    <!-- Datos principales -->
                    <div style="flex: 1;">
                        <div class="form-group">
                            <label>Nombre completo *</label>
                            <input type="text" id="editMyName" class="filter-input" required>
                        </div>
                        
                        <div class="form-row" style="display: flex; gap: 15px;">
                            <div class="form-group" style="flex: 1;">
                                <label>Email *</label>
                                <input type="email" id="editMyEmail" class="filter-input" required>
                            </div>
                            <div class="form-group" style="flex: 0.5;">
                                <label>Género</label>
                                <select id="editMyGenero" class="filter-input">
                                    <option value="">Selecciona</option>
                                    <option value="M">Masculino (Psicólogo)</option>
                                    <option value="F">Femenino (Psicóloga)</option>
                                    <option value="other">Otro / Prefiero no decir</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row" style="display: flex; gap: 15px;">
                            <div class="form-group" style="flex: 1;">
                                <label>Título profesional</label>
                                <input type="text" id="editMyTitle" class="filter-input" placeholder="Ej: Psicólogo Clínico">
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label>Especialidades</label>
                                <select id="editMySpec" class="filter-input" multiple size="4">
                                    ${specialtiesHtml}
                                </select>
                                <small>Ctrl+click para múltiples</small>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Biografía / Descripción</label>
                            <textarea id="editMyBio" rows="3" class="filter-input" placeholder="Cuéntales a tus pacientes sobre ti..."></textarea>
                        </div>
                    </div>
                </div>
                
                <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 10px;">
                    <h4 style="margin-bottom: 15px;">📋 Información profesional</h4>
                    
                    <div class="form-row" style="display: flex; gap: 15px;">
                        <div class="form-group" style="flex: 1;">
                            <label>Número de registro profesional</label>
                            <input type="text" id="editMyProfessionalId" class="filter-input" placeholder="Ej: 12345">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Años de experiencia</label>
                            <input type="number" id="editMyExperience" class="filter-input" placeholder="Ej: 10">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Formación académica</label>
                        <input type="text" id="editMyEducation" class="filter-input" placeholder="Ej: Universidad de Chile, 2015">
                    </div>
                    
                    <div class="form-group">
                        <label>Idiomas (separados por coma)</label>
                        <input type="text" id="editMyLanguages" class="filter-input" placeholder="Ej: Español, Inglés, Portugués">
                    </div>
                </div>
            </div>
            
            <!-- TAB 2: PRECIOS Y HORARIOS -->
            <div id="tabPrices" class="profile-tab" style="display: none;">
                <h4 style="margin-bottom: 15px;">💰 Precios de consulta</h4>
                
                <div class="form-row" style="display: flex; gap: 15px;">
                    <div class="form-group" style="flex: 1;">
                        <label>Precio consulta ONLINE ($)</label>
                        <input type="number" id="editMyPriceOnline" class="filter-input" required>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label>Precio consulta PRESENCIAL ($)</label>
                        <input type="number" id="editMyPricePresencial" class="filter-input" required>
                    </div>
                    <div class="form-group" style="flex: 0.5;">
                        <label>Duración (min)</label>
                        <input type="number" id="editMyDuration" class="filter-input" value="45">
                    </div>
                </div>
                
                <div style="margin-top: 30px;">
                    <h4 style="margin-bottom: 15px;">📅 Configurar mi disponibilidad</h4>
                    <p style="margin-bottom: 15px;">
                        <button onclick="openMyAvailabilityModal()" class="btn-primary" style="background: var(--primario);">
                            <i class="fa fa-calendar-alt"></i> Gestionar horarios
                        </button>
                        <span style="margin-left: 15px; color: var(--texto-secundario);">
                            Define tus horas disponibles por día
                        </span>
                    </p>
                </div>
            </div>
            
            <!-- TAB 3: MÉTODOS DE PAGO -->
            <div id="tabPayment" class="profile-tab" style="display: none;">
                <h4 style="margin-bottom: 15px;">💳 Métodos de pago que acepto</h4>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px;">
                    <label style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" id="editMyPaymentTransfer"> Transferencia bancaria
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" id="editMyPaymentCardPresencial"> Tarjeta (en consulta)
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" id="editMyPaymentCash"> Efectivo
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" id="editMyPaymentCardOnline"> Tarjeta Online
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" id="editMyPaymentMercadopago"> Mercado Pago
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" id="editMyPaymentWebpay"> Webpay
                    </label>
                </div>
                
                <h4 style="margin-bottom: 15px;">🏦 Datos bancarios (para transferencias)</h4>
                
                <div class="form-row" style="display: flex; gap: 15px;">
                    <div class="form-group" style="flex: 1;">
                        <label>Banco</label>
                        <input type="text" id="editMyBank" class="filter-input">
                    </div>
                    <div class="form-group" style="flex: 0.5;">
                        <label>Tipo cuenta</label>
                        <select id="editMyAccountType" class="filter-input">
                            <option value="corriente">Corriente</option>
                            <option value="vista">Vista</option>
                            <option value="ahorros">Ahorros</option>
                            <option value="rut">RUT</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row" style="display: flex; gap: 15px;">
                    <div class="form-group" style="flex: 1;">
                        <label>Número de cuenta</label>
                        <input type="text" id="editMyAccountNumber" class="filter-input">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label>RUT asociado</label>
                        <input type="text" id="editMyBankRut" class="filter-input" placeholder="12.345.678-9">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Email para notificaciones de pago</label>
                    <input type="email" id="editMyBankEmail" class="filter-input">
                </div>
                
                <h4 style="margin: 30px 0 15px;">🔗 Links de pago online</h4>
                
                <div class="form-group">
                    <label>Link de pago online (general)</label>
                    <input type="url" id="editMyPaymentLinkOnline" class="filter-input" placeholder="https://...">
                </div>
                
                <div class="form-group">
                    <label>Link para pagos presenciales</label>
                    <input type="url" id="editMyPaymentLinkPresencial" class="filter-input" placeholder="https://...">
                </div>
                
                <div class="form-group">
                    <label>Código QR de pago</label>
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <div style="width: 100px; height: 100px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                            <img id="editMyQrPreview" src="" style="width: 100%; height: 100%; object-fit: contain; display: none;">
                        </div>
                        <div>
                            <input type="file" id="editMyQrUpload" accept="image/*" style="display: none;" onchange="previewMyQR(this)">
                            <button onclick="document.getElementById('editMyQrUpload').click()" class="btn-secondary">
                                <i class="fa fa-qrcode"></i> Subir QR
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- TAB 4: REDES SOCIALES -->
            <div id="tabSocial" class="profile-tab" style="display: none;">
                <h4 style="margin-bottom: 15px;">🌐 Redes sociales y contacto</h4>
                
                <div class="form-group">
                    <label><i class="fa fa-linkedin" style="color: #0077B5;"></i> LinkedIn</label>
                    <input type="url" id="editMyLinkedin" class="filter-input" placeholder="https://linkedin.com/in/...">
                </div>
                
                <div class="form-group">
                    <label><i class="fa fa-instagram" style="color: #E1306C;"></i> Instagram</label>
                    <input type="text" id="editMyInstagram" class="filter-input" placeholder="@usuario o https://...">
                </div>
                
                <div class="form-group">
                    <label><i class="fa fa-globe"></i> Sitio web personal</label>
                    <input type="url" id="editMyWebsite" class="filter-input" placeholder="https://...">
                </div>
                
                <div class="form-group">
                    <label><i class="fa fa-whatsapp" style="color: #25D366;"></i> WhatsApp</label>
                    <input type="text" id="editMyWhatsapp" class="filter-input" placeholder="+56 9 1234 5678">
                </div>
                
                <div class="form-group">
                    <label><i class="fa fa-phone"></i> Teléfono de contacto</label>
                    <input type="text" id="editMyPhone" class="filter-input" placeholder="+56 2 1234 5678">
                </div>
                
                <div class="form-group">
                    <label><i class="fa fa-map-marker-alt"></i> Dirección consulta</label>
                    <input type="text" id="editMyAddress" class="filter-input" placeholder="Dirección de tu consulta presencial">
                </div>
            </div>
            
            <!-- BOTONES -->
            <div style="display: flex; gap: 15px; justify-content: flex-end; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                <button onclick="document.getElementById('editMyProfileModal').style.display='none'" class="btn-secondary">
                    Cancelar
                </button>
                <button onclick="saveMyProfile()" class="btn-primary" style="background: var(--exito);">
                    <i class="fa fa-save"></i> Guardar cambios
                </button>
            </div>
        </div>
    </div>
    `;
    
    // Agregar al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Agregar estilos para tabs si no existen
    if (!document.getElementById('profileTabStyles')) {
        const styles = document.createElement('style');
        styles.id = 'profileTabStyles';
        styles.textContent = `
            .tab-btn {
                padding: 10px 20px;
                background: none;
                border: none;
                border-bottom: 2px solid transparent;
                cursor: pointer;
                font-size: 14px;
                color: var(--texto-secundario);
                transition: all 0.3s;
            }
            .tab-btn:hover {
                color: var(--primario);
            }
            .tab-btn.active {
                border-bottom-color: var(--primario);
                color: var(--primario);
                font-weight: 500;
            }
        `;
        document.head.appendChild(styles);
    }
}

// ============================================
// 🆕 FUNCIÓN PARA CAMBIAR TABS
// ============================================

window.showMyProfileTab = function(tabName) {
    // Ocultar todos los tabs
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Mostrar el tab seleccionado
    document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).style.display = 'block';
    
    // Actualizar botones activos
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Btn`).classList.add('active');
};

// ============================================
// 🆕 FUNCIÓN PARA PREVISUALIZAR FOTO
// ============================================

window.previewMyPhoto = function(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('editMyPhotoPreview').src = e.target.result;
            state.setTempImageData(e.target.result);
        };
        reader.readAsDataURL(input.files[0]);
    }
};

// ============================================
// 🆕 FUNCIÓN PARA PREVISUALIZAR QR
// ============================================

window.previewMyQR = function(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('editMyQrPreview').src = e.target.result;
            document.getElementById('editMyQrPreview').style.display = 'block';
            state.setTempQrData(e.target.result);
        };
        reader.readAsDataURL(input.files[0]);
    }
};

// ============================================
// 🆕 FUNCIÓN PARA GUARDAR PERFIL PROFESIONAL
// ============================================

export function saveMyProfile() {
    if (!state.currentUser || state.currentUser.role !== 'psych') {
        showToast('No autorizado', 'error');
        return;
    }
    
    const psych = state.currentUser.data;
    if (!psych) return;
    
    try {
        // 📝 DATOS BÁSICOS
        psych.name = document.getElementById('editMyName').value;
        psych.email = document.getElementById('editMyEmail').value;
        psych.genero = document.getElementById('editMyGenero').value;
        psych.title = document.getElementById('editMyTitle').value;
        
        // Especialidades
        const editMySpec = document.getElementById('editMySpec');
        if (editMySpec) {
            psych.spec = Array.from(editMySpec.selectedOptions).map(opt => opt.value);
        }
        
        // Biografía
        psych.bio = document.getElementById('editMyBio').value;
        
        // Información profesional
        psych.professionalId = document.getElementById('editMyProfessionalId').value;
        psych.experience = parseInt(document.getElementById('editMyExperience').value) || 0;
        psych.education = document.getElementById('editMyEducation').value;
        
        // Idiomas
        const languagesInput = document.getElementById('editMyLanguages').value;
        psych.languages = languagesInput ? languagesInput.split(',').map(l => l.trim()) : [];
        
        // 💰 PRECIOS
        psych.priceOnline = parseInt(document.getElementById('editMyPriceOnline').value) || 0;
        psych.pricePresencial = parseInt(document.getElementById('editMyPricePresencial').value) || 0;
        psych.sessionDuration = parseInt(document.getElementById('editMyDuration').value) || 45;
        
        // 💳 MÉTODOS DE PAGO
        if (!psych.paymentMethods) psych.paymentMethods = {};
        psych.paymentMethods.transfer = document.getElementById('editMyPaymentTransfer').checked;
        psych.paymentMethods.cardPresencial = document.getElementById('editMyPaymentCardPresencial').checked;
        psych.paymentMethods.cash = document.getElementById('editMyPaymentCash').checked;
        psych.paymentMethods.cardOnline = document.getElementById('editMyPaymentCardOnline').checked;
        psych.paymentMethods.mercadopago = document.getElementById('editMyPaymentMercadopago').checked;
        psych.paymentMethods.webpay = document.getElementById('editMyPaymentWebpay').checked;
        
        // 🏦 DATOS BANCARIOS
        if (!psych.bankDetails) psych.bankDetails = {};
        psych.bankDetails.bank = document.getElementById('editMyBank').value;
        psych.bankDetails.accountType = document.getElementById('editMyAccountType').value;
        psych.bankDetails.accountNumber = document.getElementById('editMyAccountNumber').value;
        psych.bankDetails.rut = document.getElementById('editMyBankRut').value;
        psych.bankDetails.email = document.getElementById('editMyBankEmail').value;
        
        // 🔗 LINKS DE PAGO
        if (!psych.paymentLinks) psych.paymentLinks = {};
        psych.paymentLinks.online = document.getElementById('editMyPaymentLinkOnline').value;
        psych.paymentLinks.presencial = document.getElementById('editMyPaymentLinkPresencial').value;
        
        // QR
        if (state.tempQrData) {
            psych.paymentLinks.qrCode = state.tempQrData;
        }
        
        // 📸 FOTO
        if (state.tempImageData) {
            psych.img = state.tempImageData;
            psych.photoURL = state.tempImageData;
        }
        
        // 🌐 REDES SOCIALES
        if (!psych.socialLinks) psych.socialLinks = {};
        psych.socialLinks.linkedin = document.getElementById('editMyLinkedin').value;
        psych.socialLinks.instagram = document.getElementById('editMyInstagram').value;
        psych.socialLinks.website = document.getElementById('editMyWebsite').value;
        
        // Contacto
        psych.whatsapp = document.getElementById('editMyWhatsapp').value;
        psych.phone = document.getElementById('editMyPhone').value;
        psych.address = document.getElementById('editMyAddress').value;
        
        // Guardar en Firebase
        import('../main.js').then(main => {
            main.save();
            showToast('✅ Perfil actualizado correctamente', 'success');
            
            // Limpiar datos temporales
            state.setTempImageData(null);
            state.setTempQrData(null);
            
            // Cerrar modal
            document.getElementById('editMyProfileModal').style.display = 'none';
            
            // Actualizar vista si es necesario
            if (typeof window.filterProfessionals === 'function') {
                window.filterProfessionals();
            }
        });
        
    } catch (error) {
        console.error('❌ Error guardando perfil:', error);
        showToast('Error al guardar: ' + error.message, 'error');
    }
}

// ============================================
// 🆕 FUNCIÓN PARA ABRIR MODAL DE DISPONIBILIDAD
// ============================================

export function openMyAvailabilityModal() {
    if (!state.currentUser || state.currentUser.role !== 'psych') {
        showToast('Debes iniciar sesión', 'error');
        return;
    }
    
    // Verificar que existe la función en disponibilidad.js
    if (typeof window.openAvailabilityModal === 'function') {
        window.openAvailabilityModal(state.currentUser.data.id);
    } else {
        showToast('Módulo de disponibilidad no disponible', 'error');
    }
}

// ============================================
// 🆕 FUNCIÓN PARA VER MI PERFIL PÚBLICO
// ============================================

export function viewMyPublicProfile() {
    if (!state.currentUser || state.currentUser.role !== 'psych') {
        showToast('Debes iniciar sesión', 'error');
        return;
    }
    
    const psychId = state.currentUser.data.id;
    
    // Cambiar a vista pública y seleccionar este profesional
    document.getElementById('clientView').style.display = 'block';
    document.getElementById('bookingPanel').style.display = 'none';
    document.getElementById('loginPanel').style.display = 'none';
    
    // Seleccionar el profesional en la vista pública
    setTimeout(() => {
        const psychCard = document.querySelector(`.staff-card[data-id="${psychId}"]`);
        if (psychCard) {
            psychCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            psychCard.style.boxShadow = '0 0 0 3px var(--exito)';
            setTimeout(() => {
                psychCard.style.boxShadow = '';
            }, 2000);
        }
        
        showToast('Vista previa de tu perfil público', 'info');
    }, 500);
}

// ============================================
// 🆕 FUNCIÓN PARA CARGAR ESPECIALIDADES EN SELECTS
// ============================================

export function loadSpecialtiesInProfileSelects() {
    const editMySpec = document.getElementById('editMySpec');
    if (!editMySpec) return;
    
    const specialtiesHtml = state.specialties
        .map(s => `<option value="${s.name}">${s.name}</option>`)
        .join('');
    
    editMySpec.innerHTML = specialtiesHtml;
    
    // Si hay un profesional logueado, seleccionar sus especialidades
    if (state.currentUser?.role === 'psych' && state.currentUser.data) {
        const psych = state.currentUser.data;
        const psychSpecs = Array.isArray(psych.spec) ? psych.spec : [psych.spec];
        Array.from(editMySpec.options).forEach(opt => {
            opt.selected = psychSpecs.includes(opt.value);
        });
    }
}

// ============================================
// RENDERIZAR TABLA DE PROFESIONALES (EXISTENTE)
// ============================================
export function renderStaffTable() {
    const tb = document.getElementById('staffTableBody');
    if (!tb) return;

    const visibleStaff = state.staff.filter(s => !s.isHiddenAdmin);
    tb.innerHTML = visibleStaff.map(p => {
        const specs = Array.isArray(p.spec) ? p.spec.join(', ') : p.spec;
        const generoTexto = p.genero === 'M' ? '♂️' : p.genero === 'F' ? '♀️' : '';
        
        return `
        <tr>
            <td><strong>${p.name}</strong> ${generoTexto}</td>
            <td>${p.email || '—'}</td>
            <td>${specs ? specs.substring(0, 30) + (specs.length > 30 ? '...' : '') : '—'}</td>
            <td>${p.usuario || p.name || '—'}</td>
            <td>
                <span style="display:flex; flex-direction:column; gap:2px;">
                    <span style="color:var(--verde-exito);">Online: $${(p.priceOnline || 0).toLocaleString()}</span>
                    <span style="color:var(--azul-medico);">Presencial: $${(p.pricePresencial || 0).toLocaleString()}</span>
                </span>
            </td>
            <td>${p.whatsapp ? `<a href="https://wa.me/${p.whatsapp.replace(/\+/g, '')}" target="_blank" style="color:var(--verde-exito);">${p.whatsapp}</a>` : '—'}</td>
            <td>${p.instagram ? `<a href="https://instagram.com/${p.instagram.replace('@', '')}" target="_blank" style="color:#E1306C;">@${p.instagram.replace('@', '')}</a>` : '—'}</td>
            <td>
                <span style="display:flex; flex-direction:column; gap:2px;">
                    <span style="color:${p.paymentLinks?.online ? 'var(--verde-exito)' : 'var(--text-light)'}">
                        ${p.paymentLinks?.online ? '✅' : '❌'} Online
                    </span>
                    <span style="color:${p.paymentLinks?.presencial ? 'var(--verde-exito)' : 'var(--text-light)'}">
                        ${p.paymentLinks?.presencial ? '✅' : '❌'} Presencial
                    </span>
                </span>
            </td>
            <td style="min-width: 160px;">
                <div style="display:flex; gap:5px;">
                    <button onclick="editTherapist('${p.id}')" 
                        style="background:var(--azul-medico); color:white; padding:8px 12px; border:none; border-radius:6px; cursor:pointer; display:flex; align-items:center; gap:5px; font-size:14px;">
                        <span style="font-size:16px;">✏️</span> Editar
                    </button>
                    <button onclick="deleteStaff('${p.id}')" 
                        style="background:var(--rojo-alerta); color:white; padding:8px 12px; border:none; border-radius:6px; cursor:pointer; display:flex; align-items:center; gap:5px; font-size:14px;">
                        <span style="font-size:16px;">🗑️</span> Eliminar
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
}

export function addStaff() {
    const name = document.getElementById('addName').value;
    const email = document.getElementById('addEmail').value;
    const specSelect = document.getElementById('addSpec');
    const selectedSpecs = Array.from(specSelect.selectedOptions).map(opt => opt.value);
    const priceOnline = document.getElementById('addPriceOnline').value;
    const pricePresencial = document.getElementById('addPricePresencial').value;
    const usuario = document.getElementById('addUser').value;
    const pass = document.getElementById('addPass').value;
    
    const genero = document.getElementById('addGenero')?.value || '';
    
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

    if (state.staff.some(s => s.usuario === usuario)) {
        showToast('El usuario ya existe', 'error');
        return;
    }

    const nuevoProfesional = {
        id: String(Date.now()),
        name: name,
        email: email,
        spec: selectedSpecs,
        priceOnline: parseInt(priceOnline),
        pricePresencial: parseInt(pricePresencial),
        usuario: usuario,
        pass: pass,
        genero: genero,
        whatsapp: whatsapp,
        instagram: instagram,
        img: state.tempImageData || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500',
        address: address,
        phone: phone,
        bankDetails: {
            bank: bank,
            accountType: accountType,
            accountNumber: accountNumber,
            rut: bankRut,
            email: bankEmail
        },
        paymentMethods: { ...state.globalPaymentMethods },
        stars: 5,
        sessionDuration: 45,
        breakBetween: 10,
        availability: {},
        paymentLinks: {
            online: paymentLinkOnline,
            presencial: paymentLinkPresencial,
            qrCode: state.tempQrData || ''
        },
        isAdmin: false,
        isHiddenAdmin: false,
        createdAt: new Date().toISOString()
    };

    state.staff.push(nuevoProfesional);
    import('../main.js').then(main => main.save());
    closeAddStaffModal();
    renderStaffTable();
    showToast('Profesional añadido', 'success');
}

export function editTherapist(id) {
    const therapist = state.staff.find(s => s.id == id);
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
    
    const editGenero = document.getElementById('editGenero');
    if (editGenero) {
        editGenero.value = therapist.genero || '';
    }

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
    
    state.setTempImageData(null);
    state.setTempQrData(null);
    document.getElementById('editTherapistModal').style.display = 'flex';
}

export function closeEditTherapistModal() {
    document.getElementById('editTherapistModal').style.display = 'none';
}

export function updateTherapist() {
    const id = document.getElementById('editTherapistId').value;
    const therapist = state.staff.find(s => s.id == id);
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
    
    const editGenero = document.getElementById('editGenero');
    if (editGenero) {
        therapist.genero = editGenero.value;
    }
    
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
        qrCode: state.tempQrData || therapist.paymentLinks?.qrCode || ''
    };

    if (state.tempImageData) {
        therapist.img = state.tempImageData;
    }

    const newPass = document.getElementById('editPass').value;
    if (newPass) therapist.pass = newPass;

    import('../main.js').then(main => main.save());
    closeEditTherapistModal();
    renderStaffTable();
    showToast('Profesional actualizado', 'success');
}

export function deleteStaff(id) {
    const therapist = state.staff.find(s => s.id == id);
    if (therapist?.isHiddenAdmin) {
        showToast('No se puede eliminar al admin', 'error');
        return;
    }
    
    if (confirm('¿Eliminar profesional y todos sus datos?')) {
        const patientIds = state.patients
            .filter(p => p.psychId == id)
            .map(p => p.id);
        
        state.appointments = state.appointments.filter(a => a.psychId != id);
        state.patients = state.patients.filter(p => p.psychId != id);
        state.fichasIngreso = state.fichasIngreso.filter(f => !patientIds.includes(f.patientId));
        state.sesiones = state.sesiones.filter(s => !patientIds.includes(s.patientId));
        state.informes = state.informes.filter(i => !patientIds.includes(i.patientId));
        state.staff = state.staff.filter(s => s.id != id);
        
        import('../main.js').then(main => main.save());
        renderStaffTable();
        showToast('Profesional y todos sus datos eliminados', 'success');
    }
}

// ============================================
// FUNCIONES PARA GESTIÓN DE PROFESIONALES
// ============================================

export function getPsychologistSummary(psychId) {
    const psych = state.staff.find(s => s.id == psychId);
    if (!psych) return null;
    
    const misPacientes = state.patients.filter(p => p.psychId == psychId);
    const misPatientIds = misPacientes.map(p => p.id);
    
    const misCitas = state.appointments.filter(a => a.psychId == psychId);
    const citasPagadas = misCitas.filter(a => a.paymentStatus === 'pagado');
    
    const ingresosTotales = citasPagadas.reduce((sum, a) => sum + (a.price || 0), 0);
    const ingresosMes = citasPagadas
        .filter(a => {
            const fecha = new Date(a.date);
            const ahora = new Date();
            return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
        })
        .reduce((sum, a) => sum + (a.price || 0), 0);
    
    const fichasIngreso = state.fichasIngreso.filter(f => misPatientIds.includes(f.patientId));
    const sesiones = state.sesiones.filter(s => misPatientIds.includes(s.patientId));
    const informes = state.informes.filter(i => misPatientIds.includes(i.patientId));
    
    return {
        profesional: {
            id: psych.id,
            nombre: psych.name,
            email: psych.email,
            genero: psych.genero
        },
        pacientes: {
            total: misPacientes.length,
            conFichaIngreso: fichasIngreso.length,
            sinFichaIngreso: misPacientes.length - fichasIngreso.length
        },
        citas: {
            total: misCitas.length,
            pagadas: citasPagadas.length,
            pendientes: misCitas.filter(a => a.paymentStatus === 'pendiente').length
        },
        ingresos: {
            total: ingresosTotales,
            mes: ingresosMes
        },
        fichasClinicas: {
            fichasIngreso: fichasIngreso.length,
            sesiones: sesiones.length,
            informes: informes.length,
            promedioSesionesPorPaciente: misPacientes.length > 0 
                ? (sesiones.length / misPacientes.length).toFixed(1) 
                : 0
        }
    };
}

export function getPatientsWithClinicalData(psychId) {
    const misPacientes = state.patients.filter(p => p.psychId == psychId);
    
    return misPacientes.map(patient => {
        const fichas = state.fichasIngreso.filter(f => f.patientId == patient.id);
        const sesiones = state.sesiones.filter(s => s.patientId == patient.id);
        const informes = state.informes.filter(i => i.patientId == patient.id);
        const citas = state.appointments.filter(a => a.patientId == patient.id);
        
        return {
            ...patient,
            estadisticas: {
                totalSesiones: sesiones.length,
                totalCitas: citas.length,
                totalPagado: citas
                    .filter(a => a.paymentStatus === 'pagado')
                    .reduce((sum, a) => sum + (a.price || 0), 0),
                tieneFichaIngreso: fichas.length > 0,
                ultimaSesion: sesiones.length > 0 
                    ? sesiones.sort((a, b) => new Date(b.fechaAtencion) - new Date(a.fechaAtencion))[0]?.fechaAtencion
                    : null,
                informes: informes.length
            }
        };
    });
}

export function canPsychologistAccessPatient(psychId, patientId) {
    const patient = state.patients.find(p => p.id == patientId);
    return patient && patient.psychId == psychId;
}

export function getRecentSessions(psychId, limit = 10) {
    const misPatientIds = state.patients
        .filter(p => p.psychId == psychId)
        .map(p => p.id);
    
    return state.sesiones
        .filter(s => misPatientIds.includes(s.patientId))
        .sort((a, b) => new Date(b.fechaAtencion) - new Date(a.fechaAtencion))
        .slice(0, limit)
        .map(s => {
            const patient = state.patients.find(p => p.id == s.patientId);
            return {
                ...s,
                patientName: patient?.name || 'Desconocido',
                patientRut: patient?.rut || ''
            };
        });
}

export function loadSpecialtiesInSelects() {
    const addSpecSelect = document.getElementById('addSpec');
    const editSpecSelect = document.getElementById('editSpec');
    
    if (!addSpecSelect || !editSpecSelect) return;
    
    const specialtiesHtml = state.specialties
        .map(s => `<option value="${s.name}">${s.name}</option>`)
        .join('');
    
    addSpecSelect.innerHTML = specialtiesHtml;
    editSpecSelect.innerHTML = specialtiesHtml;
}

// ============================================
// 🆕 AGREGAR BOTÓN DE EDICIÓN EN EL DASHBOARD
// ============================================

export function addProfileButtonToDashboard() {
    // Buscar el header del dashboard
    const dashboardHeader = document.querySelector('.dashboard-header');
    if (!dashboardHeader) return;
    
    // Verificar si ya existe el botón
    if (document.getElementById('editProfileButton')) return;
    
    // Crear botón
    const button = document.createElement('button');
    button.id = 'editProfileButton';
    button.className = 'btn-staff';
    button.style.marginLeft = '15px';
    button.style.background = 'var(--primario)';
    button.innerHTML = '<i class="fa fa-user-edit"></i> Editar Mi Perfil';
    button.onclick = openMyProfileModal;
    
    // Agregar al header
    dashboardHeader.appendChild(button);
}

// ============================================
// EXPORTAR FUNCIONES AL OBJETO WINDOW
// ============================================
if (typeof window !== 'undefined') {
    window.showAddStaffModal = showAddStaffModal;
    window.closeAddStaffModal = closeAddStaffModal;
    window.renderStaffTable = renderStaffTable;
    window.addStaff = addStaff;
    window.editTherapist = editTherapist;
    window.closeEditTherapistModal = closeEditTherapistModal;
    window.updateTherapist = updateTherapist;
    window.deleteStaff = deleteStaff;
    window.getPsychologistSummary = getPsychologistSummary;
    window.getPatientsWithClinicalData = getPatientsWithClinicalData;
    window.canPsychologistAccessPatient = canPsychologistAccessPatient;
    window.getRecentSessions = getRecentSessions;
    window.loadSpecialtiesInSelects = loadSpecialtiesInSelects;
    
    // NUEVAS FUNCIONES EXPORTADAS
    window.openMyProfileModal = openMyProfileModal;
    window.saveMyProfile = saveMyProfile;
    window.openMyAvailabilityModal = openMyAvailabilityModal;
    window.viewMyPublicProfile = viewMyPublicProfile;
    window.loadSpecialtiesInProfileSelects = loadSpecialtiesInProfileSelects;
    window.addProfileButtonToDashboard = addProfileButtonToDashboard;
    
    // Agregar botón al dashboard cuando se carga
    setTimeout(addProfileButtonToDashboard, 2000);
}

console.log('✅ profesionales.js cargado con funciones de fichas clínicas y edición de perfil profesional');