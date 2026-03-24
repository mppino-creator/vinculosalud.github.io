// js/modules/profesionales.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast } from './utils.js';

// ============================================
// FUNCIONES DE ADMIN PARA PROFESIONALES
// ============================================

export function showAddStaffModal() {
    const modal = document.getElementById('addStaffModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    // Limpiar campos
    const addName = document.getElementById('addName');
    const addEmail = document.getElementById('addEmail');
    const addSpec = document.getElementById('addSpec');
    const addUser = document.getElementById('addUser');
    const addPass = document.getElementById('addPass');
    const addWhatsapp = document.getElementById('addWhatsapp');
    const addInstagram = document.getElementById('addInstagram');
    const addAddress = document.getElementById('addAddress');
    const addPhone = document.getElementById('addPhone');
    const addPriceOnline = document.getElementById('addPriceOnline');
    const addPricePresencial = document.getElementById('addPricePresencial');
    const addBank = document.getElementById('addBank');
    const addAccountType = document.getElementById('addAccountType');
    const addAccountNumber = document.getElementById('addAccountNumber');
    const addBankRut = document.getElementById('addBankRut');
    const addBankEmail = document.getElementById('addBankEmail');
    const addPaymentLinkOnline = document.getElementById('addPaymentLinkOnline');
    const addPaymentLinkPresencial = document.getElementById('addPaymentLinkPresencial');
    const addPhotoPreview = document.getElementById('addPhotoPreview');
    const addQrOnlinePreview = document.getElementById('addQrOnlinePreview');
    const addQrPresencialPreview = document.getElementById('addQrPresencialPreview');
    
    if (addName) addName.value = '';
    if (addEmail) addEmail.value = '';
    if (addSpec) addSpec.selectedIndex = -1;
    if (addUser) addUser.value = '';
    if (addPass) addPass.value = '';
    if (addWhatsapp) addWhatsapp.value = '';
    if (addInstagram) addInstagram.value = '';
    if (addAddress) addAddress.value = '';
    if (addPhone) addPhone.value = '';
    if (addPriceOnline) addPriceOnline.value = '';
    if (addPricePresencial) addPricePresencial.value = '';
    if (addBank) addBank.value = '';
    if (addAccountType) addAccountType.value = 'corriente';
    if (addAccountNumber) addAccountNumber.value = '';
    if (addBankRut) addBankRut.value = '';
    if (addBankEmail) addBankEmail.value = '';
    if (addPaymentLinkOnline) addPaymentLinkOnline.value = '';
    if (addPaymentLinkPresencial) addPaymentLinkPresencial.value = '';
    if (addPhotoPreview) addPhotoPreview.style.display = 'none';
    if (addQrOnlinePreview) addQrOnlinePreview.style.display = 'none';
    if (addQrPresencialPreview) addQrPresencialPreview.style.display = 'none';
    
    // Limpiar campo de género
    const addGenero = document.getElementById('addGenero');
    if (addGenero) addGenero.value = '';
    
    state.setTempImageData(null);
    state.setTempQrOnlineData(null);
    state.setTempQrPresencialData(null);
}

export function closeAddStaffModal() {
    const modal = document.getElementById('addStaffModal');
    if (modal) modal.style.display = 'none';
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
    const editMyName = document.getElementById('editMyName');
    const editMyEmail = document.getElementById('editMyEmail');
    const editMyTitle = document.getElementById('editMyTitle');
    const editMyGenero = document.getElementById('editMyGenero');
    const editMySpec = document.getElementById('editMySpec');
    const editMyBio = document.getElementById('editMyBio');
    const editMyProfessionalId = document.getElementById('editMyProfessionalId');
    const editMyExperience = document.getElementById('editMyExperience');
    const editMyEducation = document.getElementById('editMyEducation');
    const editMyLanguages = document.getElementById('editMyLanguages');
    const editMyLinkedin = document.getElementById('editMyLinkedin');
    const editMyInstagram = document.getElementById('editMyInstagram');
    const editMyWebsite = document.getElementById('editMyWebsite');
    const editMyPriceOnline = document.getElementById('editMyPriceOnline');
    const editMyPricePresencial = document.getElementById('editMyPricePresencial');
    const editMyDuration = document.getElementById('editMyDuration');
    const editMyBank = document.getElementById('editMyBank');
    const editMyAccountType = document.getElementById('editMyAccountType');
    const editMyAccountNumber = document.getElementById('editMyAccountNumber');
    const editMyBankRut = document.getElementById('editMyBankRut');
    const editMyBankEmail = document.getElementById('editMyBankEmail');
    const editMyPaymentLinkOnline = document.getElementById('editMyPaymentLinkOnline');
    const editMyPaymentLinkPresencial = document.getElementById('editMyPaymentLinkPresencial');
    const photoPreview = document.getElementById('editMyPhotoPreview');
    const qrOnlinePreview = document.getElementById('editMyQrOnlinePreview');
    const qrPresencialPreview = document.getElementById('editMyQrPresencialPreview');
    
    if (editMyName) editMyName.value = psych.name || '';
    if (editMyEmail) editMyEmail.value = psych.email || '';
    if (editMyTitle) editMyTitle.value = psych.title || '';
    
    // Género
    if (editMyGenero) editMyGenero.value = psych.genero || '';
    
    // Especialidades
    if (editMySpec) {
        const psychSpecs = Array.isArray(psych.spec) ? psych.spec : [psych.spec];
        Array.from(editMySpec.options).forEach(opt => {
            opt.selected = psychSpecs.includes(opt.value);
        });
    }
    
    // Biografía / Descripción
    if (editMyBio) editMyBio.value = psych.bio || '';
    
    // Registro profesional
    if (editMyProfessionalId) editMyProfessionalId.value = psych.professionalId || '';
    if (editMyExperience) editMyExperience.value = psych.experience || '';
    if (editMyEducation) editMyEducation.value = psych.education || '';
    if (editMyLanguages) editMyLanguages.value = psych.languages ? psych.languages.join(', ') : '';
    
    // Redes sociales
    if (editMyLinkedin) editMyLinkedin.value = psych.socialLinks?.linkedin || '';
    if (editMyInstagram) editMyInstagram.value = psych.socialLinks?.instagram || '';
    if (editMyWebsite) editMyWebsite.value = psych.socialLinks?.website || '';
    
    // Precios
    if (editMyPriceOnline) editMyPriceOnline.value = psych.priceOnline || '';
    if (editMyPricePresencial) editMyPricePresencial.value = psych.pricePresencial || '';
    if (editMyDuration) editMyDuration.value = psych.sessionDuration || 45;
    
    // Métodos de pago (checkboxes)
    const methods = psych.paymentMethods || state.globalPaymentMethods;
    const editMyPaymentTransfer = document.getElementById('editMyPaymentTransfer');
    const editMyPaymentCardPresencial = document.getElementById('editMyPaymentCardPresencial');
    const editMyPaymentCash = document.getElementById('editMyPaymentCash');
    const editMyPaymentCardOnline = document.getElementById('editMyPaymentCardOnline');
    const editMyPaymentMercadopago = document.getElementById('editMyPaymentMercadopago');
    const editMyPaymentWebpay = document.getElementById('editMyPaymentWebpay');
    
    if (editMyPaymentTransfer) editMyPaymentTransfer.checked = methods.transfer || false;
    if (editMyPaymentCardPresencial) editMyPaymentCardPresencial.checked = methods.cardPresencial || false;
    if (editMyPaymentCash) editMyPaymentCash.checked = methods.cash || false;
    if (editMyPaymentCardOnline) editMyPaymentCardOnline.checked = methods.cardOnline || false;
    if (editMyPaymentMercadopago) editMyPaymentMercadopago.checked = methods.mercadopago || false;
    if (editMyPaymentWebpay) editMyPaymentWebpay.checked = methods.webpay || false;
    
    // Datos bancarios
    const bank = psych.bankDetails || {};
    if (editMyBank) editMyBank.value = bank.bank || '';
    if (editMyAccountType) editMyAccountType.value = bank.accountType || 'corriente';
    if (editMyAccountNumber) editMyAccountNumber.value = bank.accountNumber || '';
    if (editMyBankRut) editMyBankRut.value = bank.rut || '';
    if (editMyBankEmail) editMyBankEmail.value = bank.email || '';
    
    // Links de pago
    if (editMyPaymentLinkOnline) editMyPaymentLinkOnline.value = psych.paymentLinks?.online || '';
    if (editMyPaymentLinkPresencial) editMyPaymentLinkPresencial.value = psych.paymentLinks?.presencial || '';
    
    // Foto de perfil
    if (photoPreview) {
        if (psych.img || psych.photoURL) {
            photoPreview.src = psych.img || psych.photoURL;
            photoPreview.style.display = 'block';
        } else {
            photoPreview.src = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500';
            photoPreview.style.display = 'block';
        }
    }
    
    // QR Online
    if (qrOnlinePreview) {
        if (psych.paymentLinks?.qrOnline) {
            qrOnlinePreview.src = psych.paymentLinks.qrOnline;
            qrOnlinePreview.style.display = 'block';
        } else {
            qrOnlinePreview.style.display = 'none';
        }
    }
    
    // QR Presencial
    if (qrPresencialPreview) {
        if (psych.paymentLinks?.qrPresencial) {
            qrPresencialPreview.src = psych.paymentLinks.qrPresencial;
            qrPresencialPreview.style.display = 'block';
        } else {
            qrPresencialPreview.style.display = 'none';
        }
    }
    
    // Mostrar modal
    const modal = document.getElementById('editMyProfileModal');
    if (modal) modal.style.display = 'flex';
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
                <button class="tab-btn" onclick="showMyProfileTab('password')" id="tabPasswordBtn">🔑 Contraseña</button>
            </div>
            
            <!-- TAB 1: DATOS BÁSICOS -->
            <div id="tabBasic" class="profile-tab" style="display: block;">
                <div style="display: flex; gap: 30px; margin-bottom: 20px; flex-wrap: wrap;">
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
                        
                        <div class="form-row" style="display: flex; gap: 15px; flex-wrap: wrap;">
                            <div class="form-group" style="flex: 1;">
                                <label>Email *</label>
                                <input type="email" id="editMyEmail" class="filter-input" required>
                            </div>
                            <div class="form-group" style="flex: 0.5; min-width: 150px;">
                                <label>Género</label>
                                <select id="editMyGenero" class="filter-input">
                                    <option value="">Selecciona</option>
                                    <option value="M">Masculino (Psicólogo)</option>
                                    <option value="F">Femenino (Psicóloga)</option>
                                    <option value="other">Otro / Prefiero no decir</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Título profesional</label>
                            <input type="text" id="editMyTitle" class="filter-input" placeholder="Ej: Psicólogo Clínico">
                        </div>
                        
                        <div class="form-group">
                            <label>Especialidades</label>
                            <select id="editMySpec" class="filter-input" multiple size="4">
                                ${specialtiesHtml}
                            </select>
                            <small>Ctrl+click para múltiples</small>
                        </div>
                        
                        <div class="form-group">
                            <label>Biografía / Descripción</label>
                            <textarea id="editMyBio" rows="3" class="filter-input" placeholder="Cuéntales a tus pacientes sobre ti..."></textarea>
                        </div>
                    </div>
                </div>
                
                <div style="border-top: 1px solid #eee; padding-top: 20px;">
                    <h4 style="margin-bottom: 15px;">📋 Información profesional</h4>
                    
                    <div class="form-row" style="display: flex; gap: 15px; flex-wrap: wrap;">
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
                
                <div class="form-row" style="display: flex; gap: 15px; flex-wrap: wrap;">
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
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
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
                
                <div class="form-row" style="display: flex; gap: 15px; flex-wrap: wrap;">
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
                
                <div class="form-row" style="display: flex; gap: 15px; flex-wrap: wrap;">
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
                
                <h4 style="margin: 30px 0 15px;">📱 Códigos QR de pago</h4>
                <div style="display: flex; gap: 30px; flex-wrap: wrap;">
                    <!-- QR para online -->
                    <div style="flex:1; min-width:200px;">
                        <label>QR para pagos online</label>
                        <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
                            <div style="width: 100px; height: 100px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                                <img id="editMyQrOnlinePreview" src="" style="width: 100%; height: 100%; object-fit: contain; display: none;">
                            </div>
                            <div>
                                <input type="file" id="editMyQrOnlineUpload" accept="image/*" style="display: none;" onchange="previewMyQROnline(this)">
                                <button onclick="document.getElementById('editMyQrOnlineUpload').click()" class="btn-secondary">
                                    <i class="fa fa-qrcode"></i> Subir QR Online
                                </button>
                            </div>
                        </div>
                    </div>
                    <!-- QR para presencial -->
                    <div style="flex:1; min-width:200px;">
                        <label>QR para pagos presenciales</label>
                        <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
                            <div style="width: 100px; height: 100px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                                <img id="editMyQrPresencialPreview" src="" style="width: 100%; height: 100%; object-fit: contain; display: none;">
                            </div>
                            <div>
                                <input type="file" id="editMyQrPresencialUpload" accept="image/*" style="display: none;" onchange="previewMyQRPresencial(this)">
                                <button onclick="document.getElementById('editMyQrPresencialUpload').click()" class="btn-secondary">
                                    <i class="fa fa-qrcode"></i> Subir QR Presencial
                                </button>
                            </div>
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
            
            <!-- TAB 5: CAMBIAR CONTRASEÑA -->
            <div id="tabPassword" class="profile-tab" style="display: none;">
                <h4 style="margin-bottom: 15px;">🔑 Cambiar Contraseña</h4>
                <div class="form-group">
                    <label>Contraseña actual *</label>
                    <input type="password" id="editMyCurrentPassword" class="filter-input" placeholder="Ingresa tu contraseña actual">
                </div>
                <div class="form-group">
                    <label>Nueva contraseña *</label>
                    <input type="password" id="editMyNewPassword" class="filter-input" placeholder="Mínimo 6 caracteres">
                </div>
                <div class="form-group">
                    <label>Confirmar nueva contraseña *</label>
                    <input type="password" id="editMyConfirmPassword" class="filter-input" placeholder="Repite la nueva contraseña">
                </div>
                <button class="btn-staff" onclick="cambiarMiPassword()" style="background: var(--exito);">
                    <i class="fa fa-key"></i> Actualizar contraseña
                </button>
            </div>
            
            <!-- BOTONES -->
            <div style="display: flex; gap: 15px; justify-content: flex-end; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; flex-wrap: wrap;">
                <button onclick="document.getElementById('editMyProfileModal').style.display='none'" class="btn-secondary" style="padding:12px 25px;">
                    Cancelar
                </button>
                <button onclick="saveMyProfile()" class="btn-primary" style="background: var(--exito); color:white; padding:12px 25px; border:none; border-radius:30px; cursor:pointer;">
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
        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const MAX_WIDTH = 400; // Para perfil, ancho más pequeño
                const scale = MAX_WIDTH / img.width;
                const newWidth = MAX_WIDTH;
                const newHeight = img.height * scale;

                const canvas = document.createElement('canvas');
                canvas.width = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                const reducedDataUrl = canvas.toDataURL('image/jpeg', 0.7);

                const preview = document.getElementById('editMyPhotoPreview');
                if (preview) preview.src = reducedDataUrl;
                state.setTempImageData(reducedDataUrl);
                showToast('✅ Foto optimizada', 'success');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

// ============================================
// 🆕 FUNCIÓN PARA PREVISUALIZAR QR ONLINE
// ============================================

window.previewMyQROnline = function(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('editMyQrOnlinePreview');
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
            state.setTempQrOnlineData(e.target.result);
        };
        reader.readAsDataURL(input.files[0]);
    }
};

// ============================================
// 🆕 FUNCIÓN PARA PREVISUALIZAR QR PRESENCIAL
// ============================================

window.previewMyQRPresencial = function(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('editMyQrPresencialPreview');
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
            state.setTempQrPresencialData(e.target.result);
        };
        reader.readAsDataURL(input.files[0]);
    }
};

// ============================================
// 🔥 FUNCIÓN PARA GUARDAR PERFIL PROFESIONAL (CORREGIDA)
// ============================================

export async function saveMyProfile() {
    if (!state.currentUser || state.currentUser.role !== 'psych') {
        showToast('No autorizado', 'error');
        return;
    }
    
    const user = firebase.auth().currentUser;
    if (!user) {
        showToast('Debes iniciar sesión en Firebase', 'error');
        return;
    }
    
    console.log('💾 Guardando perfil profesional para UID:', user.uid);
    
    const psych = state.currentUser.data;
    if (!psych) return;
    
    try {
        // 📝 DATOS BÁSICOS
        const editMyName = document.getElementById('editMyName');
        const editMyEmail = document.getElementById('editMyEmail');
        const editMyGenero = document.getElementById('editMyGenero');
        const editMyTitle = document.getElementById('editMyTitle');
        const editMySpec = document.getElementById('editMySpec');
        const editMyBio = document.getElementById('editMyBio');
        const editMyProfessionalId = document.getElementById('editMyProfessionalId');
        const editMyExperience = document.getElementById('editMyExperience');
        const editMyEducation = document.getElementById('editMyEducation');
        const editMyLanguages = document.getElementById('editMyLanguages');
        
        if (editMyName) psych.name = editMyName.value;
        if (editMyEmail) psych.email = editMyEmail.value;
        if (editMyGenero) psych.genero = editMyGenero.value;
        if (editMyTitle) psych.title = editMyTitle.value;
        
        // Especialidades
        if (editMySpec) {
            psych.spec = Array.from(editMySpec.selectedOptions).map(opt => opt.value);
        }
        
        // Biografía
        if (editMyBio) psych.bio = editMyBio.value;
        
        // Información profesional
        if (editMyProfessionalId) psych.professionalId = editMyProfessionalId.value;
        if (editMyExperience) psych.experience = parseInt(editMyExperience.value) || 0;
        if (editMyEducation) psych.education = editMyEducation.value;
        
        // Idiomas
        if (editMyLanguages) {
            const languagesInput = editMyLanguages.value;
            psych.languages = languagesInput ? languagesInput.split(',').map(l => l.trim()) : [];
        }
        
        // 💰 PRECIOS
        const editMyPriceOnline = document.getElementById('editMyPriceOnline');
        const editMyPricePresencial = document.getElementById('editMyPricePresencial');
        const editMyDuration = document.getElementById('editMyDuration');
        
        if (editMyPriceOnline) psych.priceOnline = parseInt(editMyPriceOnline.value) || 0;
        if (editMyPricePresencial) psych.pricePresencial = parseInt(editMyPricePresencial.value) || 0;
        if (editMyDuration) psych.sessionDuration = parseInt(editMyDuration.value) || 45;
        
        // 💳 MÉTODOS DE PAGO
        if (!psych.paymentMethods) psych.paymentMethods = {};
        
        const editMyPaymentTransfer = document.getElementById('editMyPaymentTransfer');
        const editMyPaymentCardPresencial = document.getElementById('editMyPaymentCardPresencial');
        const editMyPaymentCash = document.getElementById('editMyPaymentCash');
        const editMyPaymentCardOnline = document.getElementById('editMyPaymentCardOnline');
        const editMyPaymentMercadopago = document.getElementById('editMyPaymentMercadopago');
        const editMyPaymentWebpay = document.getElementById('editMyPaymentWebpay');
        
        if (editMyPaymentTransfer) psych.paymentMethods.transfer = editMyPaymentTransfer.checked;
        if (editMyPaymentCardPresencial) psych.paymentMethods.cardPresencial = editMyPaymentCardPresencial.checked;
        if (editMyPaymentCash) psych.paymentMethods.cash = editMyPaymentCash.checked;
        if (editMyPaymentCardOnline) psych.paymentMethods.cardOnline = editMyPaymentCardOnline.checked;
        if (editMyPaymentMercadopago) psych.paymentMethods.mercadopago = editMyPaymentMercadopago.checked;
        if (editMyPaymentWebpay) psych.paymentMethods.webpay = editMyPaymentWebpay.checked;
        
        // 🏦 DATOS BANCARIOS
        if (!psych.bankDetails) psych.bankDetails = {};
        
        const editMyBank = document.getElementById('editMyBank');
        const editMyAccountType = document.getElementById('editMyAccountType');
        const editMyAccountNumber = document.getElementById('editMyAccountNumber');
        const editMyBankRut = document.getElementById('editMyBankRut');
        const editMyBankEmail = document.getElementById('editMyBankEmail');
        
        if (editMyBank) psych.bankDetails.bank = editMyBank.value;
        if (editMyAccountType) psych.bankDetails.accountType = editMyAccountType.value;
        if (editMyAccountNumber) psych.bankDetails.accountNumber = editMyAccountNumber.value;
        if (editMyBankRut) psych.bankDetails.rut = editMyBankRut.value;
        if (editMyBankEmail) psych.bankDetails.email = editMyBankEmail.value;
        
        // 🔗 LINKS DE PAGO
        if (!psych.paymentLinks) psych.paymentLinks = {};
        
        const editMyPaymentLinkOnline = document.getElementById('editMyPaymentLinkOnline');
        const editMyPaymentLinkPresencial = document.getElementById('editMyPaymentLinkPresencial');
        
        if (editMyPaymentLinkOnline) psych.paymentLinks.online = editMyPaymentLinkOnline.value;
        if (editMyPaymentLinkPresencial) psych.paymentLinks.presencial = editMyPaymentLinkPresencial.value;
        
        // QR Online
        if (state.tempQrOnlineData) {
            psych.paymentLinks.qrOnline = state.tempQrOnlineData;
        }
        
        // QR Presencial
        if (state.tempQrPresencialData) {
            psych.paymentLinks.qrPresencial = state.tempQrPresencialData;
        }
        
        // 📸 FOTO
        if (state.tempImageData) {
            psych.img = state.tempImageData;
            psych.photoURL = state.tempImageData;
        }
        
        // 🌐 REDES SOCIALES
        if (!psych.socialLinks) psych.socialLinks = {};
        
        const editMyLinkedin = document.getElementById('editMyLinkedin');
        const editMyInstagram = document.getElementById('editMyInstagram');
        const editMyWebsite = document.getElementById('editMyWebsite');
        
        if (editMyLinkedin) psych.socialLinks.linkedin = editMyLinkedin.value;
        if (editMyInstagram) psych.socialLinks.instagram = editMyInstagram.value;
        if (editMyWebsite) psych.socialLinks.website = editMyWebsite.value;
        
        // Contacto
        const editMyWhatsapp = document.getElementById('editMyWhatsapp');
        const editMyPhone = document.getElementById('editMyPhone');
        const editMyAddress = document.getElementById('editMyAddress');
        
        if (editMyWhatsapp) psych.whatsapp = editMyWhatsapp.value;
        if (editMyPhone) psych.phone = editMyPhone.value;
        if (editMyAddress) psych.address = editMyAddress.value;
        
        // 🔥 GUARDAR DIRECTAMENTE EN FIREBASE USANDO EL ID DEL PROFESIONAL (NO EL UID)
        const cleanData = JSON.parse(JSON.stringify(psych));
        cleanData.updatedAt = new Date().toISOString();
        
        // ✅ CORRECCIÓN: Usar psych.id en lugar de user.uid
        await firebase.database().ref(`Staff/${psych.id}`).update(cleanData);
        
        console.log('✅ Perfil guardado correctamente en Firebase');
        showToast('✅ Perfil actualizado correctamente', 'success');
        
        // Actualizar estado local
        const staffIndex = state.staff.findIndex(s => s.id == psych.id);
        if (staffIndex !== -1) {
            state.staff[staffIndex] = { ...state.staff[staffIndex], ...cleanData };
        }
        
        state.currentUser.data = { ...state.currentUser.data, ...cleanData };
        
        // Guardar en localStorage
        localStorage.setItem('vinculoCurrentUser', JSON.stringify({
            role: 'psych',
            firebaseUid: user.uid,
            data: {
                id: psych.id,
                name: psych.name,
                email: psych.email,
                isAdmin: false,
                usuario: psych.usuario || '',
                genero: psych.genero || ''
            }
        }));
        
        state.setTempImageData(null);
        state.setTempQrOnlineData(null);
        state.setTempQrPresencialData(null);
        
        const modal = document.getElementById('editMyProfileModal');
        if (modal) modal.style.display = 'none';
        
        if (typeof window.filterProfessionals === 'function') {
            window.filterProfessionals();
        }
        
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
    
    const clientView = document.getElementById('clientView');
    const bookingPanel = document.getElementById('bookingPanel');
    const loginPanel = document.getElementById('loginPanel');
    
    if (clientView) clientView.style.display = 'block';
    if (bookingPanel) bookingPanel.style.display = 'none';
    if (loginPanel) loginPanel.style.display = 'none';
    
    setTimeout(() => {
        const psychCard = document.querySelector(`.therapist-card[data-id="${psychId}"], .staff-card[data-id="${psychId}"]`);
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
    
    if (state.currentUser?.role === 'psych' && state.currentUser.data) {
        const psych = state.currentUser.data;
        const psychSpecs = Array.isArray(psych.spec) ? psych.spec : [psych.spec];
        Array.from(editMySpec.options).forEach(opt => {
            opt.selected = psychSpecs.includes(opt.value);
        });
    }
}

// ============================================
// 🆕 FUNCIÓN PARA ENVIAR CORREO DE RESTABLECIMIENTO (ADMIN)
// ============================================
export async function sendPasswordResetEmailForProfessional(email) {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    if (!email) {
        showToast('Email no válido', 'error');
        return;
    }
    try {
        await firebase.auth().sendPasswordResetEmail(email);
        showToast(`✅ Correo de restablecimiento enviado a ${email}`, 'success');
    } catch (error) {
        console.error('Error enviando correo:', error);
        let mensaje = 'Error al enviar correo';
        if (error.code === 'auth/user-not-found') {
            mensaje = 'El usuario no existe en Authentication. Crea primero su cuenta.';
        }
        showToast(mensaje, 'error');
    }
}

// ============================================
// 🆕 FUNCIÓN PARA CAMBIAR CONTRASEÑA PROPIA
// ============================================
export async function cambiarMiPassword() {
    if (!state.currentUser || state.currentUser.role !== 'psych') {
        showToast('No autorizado', 'error');
        return;
    }

    const currentPassword = document.getElementById('editMyCurrentPassword')?.value;
    const newPassword = document.getElementById('editMyNewPassword')?.value;
    const confirmPassword = document.getElementById('editMyConfirmPassword')?.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Completa todos los campos', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast('Las contraseñas nuevas no coinciden', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showToast('La nueva contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
        showToast('No hay sesión activa', 'error');
        return;
    }

    // Reautenticar antes de cambiar contraseña (por seguridad)
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
    try {
        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(newPassword);
        showToast('✅ Contraseña actualizada correctamente', 'success');
        // Limpiar campos
        document.getElementById('editMyCurrentPassword').value = '';
        document.getElementById('editMyNewPassword').value = '';
        document.getElementById('editMyConfirmPassword').value = '';
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        let mensaje = 'Error al cambiar contraseña';
        if (error.code === 'auth/wrong-password') {
            mensaje = 'La contraseña actual es incorrecta';
        } else if (error.code === 'auth/weak-password') {
            mensaje = 'La nueva contraseña es muy débil';
        } else {
            mensaje = error.message;
        }
        showToast(mensaje, 'error');
    }
}

// ============================================
// RENDERIZAR TABLA DE PROFESIONALES
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
        `;
    }).join('');
}

// ============================================
// FUNCIÓN PARA AGREGAR PROFESIONAL (CON CREACIÓN EN AUTH)
// ============================================
export async function addStaff() {
    const name = document.getElementById('addName')?.value;
    const email = document.getElementById('addEmail')?.value;
    const specSelect = document.getElementById('addSpec');
    const selectedSpecs = specSelect ? Array.from(specSelect.selectedOptions).map(opt => opt.value) : [];
    const priceOnline = document.getElementById('addPriceOnline')?.value;
    const pricePresencial = document.getElementById('addPricePresencial')?.value;
    const usuario = document.getElementById('addUser')?.value;
    const pass = document.getElementById('addPass')?.value;
    
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

    // Verificar si el usuario ya existe en Firebase Auth
    try {
        // 1. Crear usuario en Firebase Authentication
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, pass);
        const uid = userCredential.user.uid;
        console.log('✅ Usuario creado en Auth con UID:', uid);
        
        // 2. Construir objeto del profesional (sin pass)
        const nuevoProfesional = {
            id: String(Date.now()),           // ID numérico para compatibilidad
            uid: uid,                         // Guardamos el UID de Auth
            name: name,
            email: email,
            spec: selectedSpecs,
            priceOnline: parseInt(priceOnline),
            pricePresencial: parseInt(pricePresencial),
            usuario: usuario,
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
                qrOnline: state.tempQrOnlineData || '',
                qrPresencial: state.tempQrPresencialData || ''
            },
            isAdmin: false,
            isHiddenAdmin: false,
            createdAt: new Date().toISOString()
        };
        
        // 3. Guardar en Realtime Database (sin campo pass)
        await firebase.database().ref(`Staff/${nuevoProfesional.id}`).set(nuevoProfesional);
        
        // 4. Actualizar estado local
        state.staff.push(nuevoProfesional);
        
        closeAddStaffModal();
        renderStaffTable();
        showToast('Profesional añadido correctamente', 'success');
        
    } catch (error) {
        console.error('❌ Error al crear profesional:', error);
        let mensaje = 'Error al crear profesional';
        if (error.code === 'auth/email-already-in-use') {
            mensaje = 'El email ya está registrado en el sistema';
        } else if (error.code === 'auth/weak-password') {
            mensaje = 'La contraseña es muy débil (mínimo 6 caracteres)';
        } else {
            mensaje = error.message;
        }
        showToast(mensaje, 'error');
    }
}

// ============================================
// FUNCIONES DE EDICIÓN Y ACTUALIZACIÓN (SIN CAMBIO DE CONTRASEÑA)
// ============================================
export function editTherapist(id) {
    const therapist = state.staff.find(s => s.id == id);
    if (!therapist) return;
    
    const editTherapistId = document.getElementById('editTherapistId');
    const editName = document.getElementById('editName');
    const editEmail = document.getElementById('editEmail');
    const editSpecSelect = document.getElementById('editSpec');
    const editUser = document.getElementById('editUser');
    // El campo de contraseña se puede dejar, pero no se usará para actualizar
    const editWhatsapp = document.getElementById('editWhatsapp');
    const editInstagram = document.getElementById('editInstagram');
    const editAddress = document.getElementById('editAddress');
    const editPhone = document.getElementById('editPhone');
    const editPriceOnline = document.getElementById('editPriceOnline');
    const editPricePresencial = document.getElementById('editPricePresencial');
    const editGenero = document.getElementById('editGenero');
    const editBank = document.getElementById('editBank');
    const editAccountType = document.getElementById('editAccountType');
    const editAccountNumber = document.getElementById('editAccountNumber');
    const editBankRut = document.getElementById('editBankRut');
    const editBankEmail = document.getElementById('editBankEmail');
    const editPaymentLinkOnline = document.getElementById('editPaymentLinkOnline');
    const editPaymentLinkPresencial = document.getElementById('editPaymentLinkPresencial');
    const editQrOnlinePreview = document.getElementById('editQrOnlinePreview');
    const editQrPresencialPreview = document.getElementById('editQrPresencialPreview');
    const editPhotoPreview = document.getElementById('editPhotoPreview');
    
    if (editTherapistId) editTherapistId.value = therapist.id;
    if (editName) editName.value = therapist.name || '';
    if (editEmail) editEmail.value = therapist.email || '';
    
    const therapistSpecs = Array.isArray(therapist.spec) ? therapist.spec : [therapist.spec];
    if (editSpecSelect) {
        Array.from(editSpecSelect.options).forEach(opt => {
            opt.selected = therapistSpecs.includes(opt.value);
        });
    }
    
    if (editUser) editUser.value = therapist.usuario || '';
    // No cargamos la contraseña
    if (editWhatsapp) editWhatsapp.value = therapist.whatsapp || '';
    if (editInstagram) editInstagram.value = therapist.instagram || '';
    if (editAddress) editAddress.value = therapist.address || '';
    if (editPhone) editPhone.value = therapist.phone || '';
    if (editPriceOnline) editPriceOnline.value = therapist.priceOnline || '';
    if (editPricePresencial) editPricePresencial.value = therapist.pricePresencial || '';
    
    if (editGenero) {
        editGenero.value = therapist.genero || '';
    }

    const bank = therapist.bankDetails || {};
    if (editBank) editBank.value = bank.bank || '';
    if (editAccountType) editAccountType.value = bank.accountType || 'corriente';
    if (editAccountNumber) editAccountNumber.value = bank.accountNumber || '';
    if (editBankRut) editBankRut.value = bank.rut || '';
    if (editBankEmail) editBankEmail.value = bank.email || '';
    
    if (editPaymentLinkOnline) editPaymentLinkOnline.value = therapist.paymentLinks?.online || '';
    if (editPaymentLinkPresencial) editPaymentLinkPresencial.value = therapist.paymentLinks?.presencial || '';
    
    if (editQrOnlinePreview) {
        if (therapist.paymentLinks?.qrOnline) {
            editQrOnlinePreview.src = therapist.paymentLinks.qrOnline;
            editQrOnlinePreview.style.display = 'block';
        } else {
            editQrOnlinePreview.style.display = 'none';
        }
    }
    
    if (editQrPresencialPreview) {
        if (therapist.paymentLinks?.qrPresencial) {
            editQrPresencialPreview.src = therapist.paymentLinks.qrPresencial;
            editQrPresencialPreview.style.display = 'block';
        } else {
            editQrPresencialPreview.style.display = 'none';
        }
    }
    
    if (editPhotoPreview) {
        if (therapist.img) {
            editPhotoPreview.src = therapist.img;
            editPhotoPreview.style.display = 'block';
        } else {
            editPhotoPreview.style.display = 'none';
        }
    }
    
    state.setTempImageData(null);
    state.setTempQrOnlineData(null);
    state.setTempQrPresencialData(null);
    
    const modal = document.getElementById('editTherapistModal');
    if (modal) modal.style.display = 'flex';
}

export function closeEditTherapistModal() {
    const modal = document.getElementById('editTherapistModal');
    if (modal) modal.style.display = 'none';
}

export async function updateTherapist() {
    const id = document.getElementById('editTherapistId')?.value;
    const therapist = state.staff.find(s => s.id == id);
    if (!therapist) return;

    const editName = document.getElementById('editName');
    const editEmail = document.getElementById('editEmail');
    const editSpecSelect = document.getElementById('editSpec');
    const editUser = document.getElementById('editUser');
    const editWhatsapp = document.getElementById('editWhatsapp');
    const editInstagram = document.getElementById('editInstagram');
    const editAddress = document.getElementById('editAddress');
    const editPhone = document.getElementById('editPhone');
    const editPriceOnline = document.getElementById('editPriceOnline');
    const editPricePresencial = document.getElementById('editPricePresencial');
    const editGenero = document.getElementById('editGenero');
    const editBank = document.getElementById('editBank');
    const editAccountType = document.getElementById('editAccountType');
    const editAccountNumber = document.getElementById('editAccountNumber');
    const editBankRut = document.getElementById('editBankRut');
    const editBankEmail = document.getElementById('editBankEmail');
    const editPaymentLinkOnline = document.getElementById('editPaymentLinkOnline');
    const editPaymentLinkPresencial = document.getElementById('editPaymentLinkPresencial');
    // No tomamos la contraseña, porque se maneja en Auth

    if (editName) therapist.name = editName.value;
    if (editEmail) therapist.email = editEmail.value;
    
    if (editSpecSelect) {
        therapist.spec = Array.from(editSpecSelect.selectedOptions).map(opt => opt.value);
    }
    
    if (editUser) therapist.usuario = editUser.value;
    if (editWhatsapp) therapist.whatsapp = editWhatsapp.value;
    if (editInstagram) therapist.instagram = editInstagram.value;
    if (editAddress) therapist.address = editAddress.value;
    if (editPhone) therapist.phone = editPhone.value;
    if (editPriceOnline) therapist.priceOnline = parseInt(editPriceOnline.value);
    if (editPricePresencial) therapist.pricePresencial = parseInt(editPricePresencial.value);
    
    if (editGenero) {
        therapist.genero = editGenero.value;
    }
    
    therapist.bankDetails = {
        bank: editBank?.value || '',
        accountType: editAccountType?.value || 'corriente',
        accountNumber: editAccountNumber?.value || '',
        rut: editBankRut?.value || '',
        email: editBankEmail?.value || ''
    };

    therapist.paymentLinks = {
        online: editPaymentLinkOnline?.value || '',
        presencial: editPaymentLinkPresencial?.value || '',
        qrOnline: state.tempQrOnlineData || therapist.paymentLinks?.qrOnline || '',
        qrPresencial: state.tempQrPresencialData || therapist.paymentLinks?.qrPresencial || ''
    };

    if (state.tempImageData) {
        therapist.img = state.tempImageData;
    }

    // Actualizar en Firebase (sin contraseña)
    try {
        await firebase.database().ref(`Staff/${id}`).update(therapist);
        
        // También actualizar el email en Firebase Auth si cambió
        if (therapist.email !== editEmail.value) {
            // Nota: cambiar el email de un usuario requiere que el admin tenga permiso.
            // En el cliente no es posible cambiar el email de otro usuario.
            // Se podría dejar un mensaje indicando que el cambio de email debe hacerse en Auth manualmente.
            showToast('⚠️ El email no se actualizó en Authentication. Si es necesario, cámbialo manualmente en Firebase Console.', 'warning');
        }
        
        // Actualizar estado local
        import('../main.js').then(main => main.save());
        closeEditTherapistModal();
        renderStaffTable();
        showToast('Profesional actualizado', 'success');
    } catch (error) {
        console.error('Error actualizando profesional:', error);
        showToast('Error al actualizar: ' + error.message, 'error');
    }
}

// ============================================
// ELIMINAR PROFESIONAL (CON ELIMINACIÓN DE DATOS ASOCIADOS)
// ============================================
export async function deleteStaff(id) {
    const therapist = state.staff.find(s => s.id == id);
    if (therapist?.isHiddenAdmin) {
        showToast('No se puede eliminar al admin', 'error');
        return;
    }
    
    if (!confirm('¿Eliminar profesional y todos sus datos?')) return;
    
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            showToast('Debes iniciar sesión', 'error');
            return;
        }
        
        console.log('🗑️ Eliminando profesional:', id);
        showToast('Eliminando profesional y sus datos...', 'info');
        
        // Buscar pacientes de este profesional
        const patientIds = state.patients
            .filter(p => p.psychId == id)
            .map(p => p.id);
        
        console.log(`📋 Profesional tiene ${patientIds.length} pacientes`);
        
        // 1. ELIMINAR DE STAFF
        await firebase.database().ref(`Staff/${id}`).remove();
        console.log('✅ Profesional eliminado de Staff');
        
        // 2. ELIMINAR CITAS
        const appointmentsToDelete = state.appointments.filter(a => a.psychId == id);
        for (const apt of appointmentsToDelete) {
            if (apt.id) {
                await firebase.database().ref(`Appointments/${apt.id}`).remove();
            }
        }
        console.log(`✅ ${appointmentsToDelete.length} citas eliminadas`);
        
        // 3. ELIMINAR SOLICITUDES
        const requestsToDelete = state.pendingRequests.filter(r => r.psychId == id);
        for (const req of requestsToDelete) {
            if (req.id) {
                await firebase.database().ref(`PendingRequests/${req.id}`).remove();
            }
        }
        console.log(`✅ ${requestsToDelete.length} solicitudes eliminadas`);
        
        // 4. ELIMINAR PACIENTES Y SUS DATOS
        for (const patientId of patientIds) {
            // Eliminar fichas de ingreso
            const fichasToDelete = state.fichasIngreso.filter(f => f.patientId == patientId);
            for (const ficha of fichasToDelete) {
                if (ficha.id) {
                    await firebase.database().ref(`fichasIngreso/${ficha.id}`).remove();
                }
            }
            
            // Eliminar sesiones
            const sesionesToDelete = state.sesiones.filter(s => s.patientId == patientId);
            for (const sesion of sesionesToDelete) {
                if (sesion.id) {
                    await firebase.database().ref(`sesiones/${sesion.id}`).remove();
                }
            }
            
            // Eliminar informes
            const informesToDelete = state.informes.filter(i => i.patientId == patientId);
            for (const informe of informesToDelete) {
                if (informe.id) {
                    await firebase.database().ref(`informes/${informe.id}`).remove();
                }
            }
            
            // Eliminar el paciente
            await firebase.database().ref(`Patients/${patientId}`).remove();
        }
        console.log(`✅ ${patientIds.length} pacientes y sus datos eliminados`);
        
        // 5. ACTUALIZAR ESTADO LOCAL
        state.setStaff(state.staff.filter(s => s.id != id));
        state.setAppointments(state.appointments.filter(a => a.psychId != id));
        state.setPendingRequests(state.pendingRequests.filter(r => r.psychId != id));
        state.setPatients(state.patients.filter(p => p.psychId != id));
        state.setFichasIngreso(state.fichasIngreso.filter(f => !patientIds.includes(f.patientId)));
        state.setSesiones(state.sesiones.filter(s => !patientIds.includes(s.patientId)));
        state.setInformes(state.informes.filter(i => !patientIds.includes(i.patientId)));
        
        // 6. ACTUALIZAR VISTA
        renderStaffTable();
        
        // 7. Disparar evento de actualización
        window.dispatchEvent(new CustomEvent('staff-updated'));
        
        showToast('✅ Profesional y todos sus datos eliminados', 'success');
        
    } catch (error) {
        console.error('❌ Error eliminando profesional:', error);
        showToast('Error al eliminar: ' + error.message, 'error');
    }
}

// ============================================
// FUNCIONES DE ESTADÍSTICAS Y UTILIDAD
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
// AGREGAR BOTÓN DE EDICIÓN EN EL DASHBOARD
// ============================================
export function addProfileButtonToDashboard() {
    const dashboardHeader = document.querySelector('.dashboard-header');
    if (!dashboardHeader) return;
    
    if (document.getElementById('editProfileButton')) return;
    
    const button = document.createElement('button');
    button.id = 'editProfileButton';
    button.className = 'btn-staff';
    button.style.marginLeft = '15px';
    button.style.background = 'var(--primario)';
    button.innerHTML = '<i class="fa fa-user-edit"></i> Editar Mi Perfil';
    button.onclick = openMyProfileModal;
    
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
    
    window.openMyProfileModal = openMyProfileModal;
    window.saveMyProfile = saveMyProfile;
    window.openMyAvailabilityModal = openMyAvailabilityModal;
    window.viewMyPublicProfile = viewMyPublicProfile;
    window.loadSpecialtiesInProfileSelects = loadSpecialtiesInProfileSelects;
    window.addProfileButtonToDashboard = addProfileButtonToDashboard;
    window.sendPasswordResetEmailForProfessional = sendPasswordResetEmailForProfessional;
    window.cambiarMiPassword = cambiarMiPassword;
    
    setTimeout(addProfileButtonToDashboard, 2000);
}

console.log('✅ profesionales.js cargado con funciones de fichas clínicas y edición de perfil profesional (sin contraseñas en DB)');