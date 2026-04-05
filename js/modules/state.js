// js/modules/state.js
// Variables globales compartidas entre todos los módulos

// ============================================
// CONSTANTES DE VALORES POR DEFECTO
// ============================================

const DEFAULT_HERO_TEXTS = {
    title: 'Un espacio seguro para sanar, comprender y crecer',
    subtitle: 'En Vínculo Salud te ofrecemos un lugar de contención emocional donde puedes hablar sin juicios, explorar tus emociones y reencontrarte contigo y con los demás.',
    slides: [
        {
            image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1600',
            title: 'Todo cambio comienza en un Vínculo',
            subtitle: '',
            buttonText: 'Agenda tu hora',
            buttonLink: '#equipo'
        },
        {
            image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1600',
            title: 'Punto de referencia en terapia',
            subtitle: 'profesionalismo, cuidado y confianza',
            buttonText: 'Conoce nuestros tipos de atención',
            buttonLink: '#atencion'
        },
        {
            image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1600',
            title: 'Trabajo colaborativo como base en nuestro quehacer',
            subtitle: '',
            buttonText: 'Conócenos más',
            buttonLink: '#about'
        }
    ]
};

const DEFAULT_GLOBAL_PAYMENT_METHODS = {
    transfer: true,
    cardPresencial: true,
    cardOnline: false,
    cash: true,
    mercadopago: false,
    webpay: false
};

const DEFAULT_BACKGROUND_IMAGE = { url: '', opacity: 10 };
const DEFAULT_LOGO_IMAGE = { url: '', text: 'Vínculo Salud' };
const DEFAULT_SELECTED_WEEKDAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];

const DEFAULT_MISSION_TEXT = 'Acompañar a las personas en su proceso de sanación emocional, proporcionando herramientas para el crecimiento personal y la mejora de la calidad de vida.';
const DEFAULT_VISION_TEXT = 'Ser un referente en salud mental en la región, reconocido por nuestra calidad profesional, calidez humana y compromiso con la comunidad.';
const DEFAULT_ABOUT_TEAM_TEXT = 'Nuestro equipo está formado por profesionales de la salud mental con amplia formación y experiencia en terapia individual, familiar y de pareja. Todos compartimos una mirada humana, ética y especializada.';

const DEFAULT_ATENCION_TEXTS = {
    adultos: {
    title: 'Atención Adultos',
    description: 'Espacio terapéutico para adultos enfocado en ansiedad, depresión, estrés y desarrollo personal. Modalidad online y presencial.'
},
infantil: {
    title: 'Atención Infantil',
    description: 'Acompañamiento emocional y conductual para niños, incluyendo orientación a padres. Modalidad online y presencial.'
},
adolescente: {
    title: 'Atención Adolescente',
    description: 'Apoyo psicológico en etapa adolescente: emociones, identidad, relaciones sociales y dificultades escolares. Modalidad online y presencial.'
},
pareja: {
    title: 'Terapia de Pareja',
    description: 'Intervención enfocada en mejorar la comunicación, resolver conflictos y fortalecer la relación. Modalidad online y presencial.'
},
familiar: {
    title: 'Terapia Familiar',
    description: 'Espacio terapéutico para mejorar la dinámica familiar y resolver conflictos. Modalidad online y presencial.'
},
evaluacion: {
    title: 'Evaluación Psicológica',
    description: 'Proceso de evaluación mediante entrevistas y test psicológicos para diagnóstico y orientación profesional.'
},
informes: {
    title: 'Informes Psicológicos',
    description: 'Elaboración de informes y certificados psicológicos para fines clínicos, escolares o laborales.'
},
primera_consulta: {
    title: 'Primera Consulta',
    description: 'Sesión inicial para evaluar el motivo de consulta y definir objetivos terapéuticos.'
},
empresas: {
    title: 'Servicios para Empresas',
    description: 'Charlas, talleres y programas de bienestar laboral, manejo del estrés y clima organizacional para equipos de trabajo.'
}
};

const DEFAULT_CONTACT_INFO = {
    email: 'vinculosalud@hotmail.com',
    phone: '+56 9 1234 5678',
    address: 'Ohiggins 263, Concepción'
};

const DEFAULT_INSTAGRAM_DATA = {
    title: 'Sigue Nuestro CONECTAMOS CONTIGO TAMBIÉN EN REDES',
    subtitle: 'VínReflexiones para tu proceso',
    quote: '"El cambio comienza contigo',
    text: 'No tienes que poder con todo',
    message: 'Pedir ayuda es avanzar Tu historia importa Sanar es posible',
    link: 'https://instagram.com/vinculo.salud',
    image: ''
};

const DEFAULT_UI_FICHAS = {
    pacienteSeleccionadoId: null,
    fichaActivaId: null,
    sesionActivaId: null,
    informeActivoId: null,
    modoEdicion: false,
    pestanaActiva: 'perfil'
};

// ============================================
// VARIABLES PRINCIPALES
// ============================================
export let staff = [];
export let patients = [];
export let appointments = [];
export let messages = [];
export let pendingRequests = [];
export let specialties = [];
export let heroTexts = { ...DEFAULT_HERO_TEXTS };
export let globalPaymentMethods = { ...DEFAULT_GLOBAL_PAYMENT_METHODS };
export let backgroundImage = { ...DEFAULT_BACKGROUND_IMAGE };
export let logoImage = { ...DEFAULT_LOGO_IMAGE };
export let selectedPsych = null;
export let currentUser = null;
export let currentRating = 5;
export let generatedSlots = [];
export let selectedWeekdays = [...DEFAULT_SELECTED_WEEKDAYS];
export let tempImageData = null;
export let tempBackgroundImageData = null;
export let tempLogoData = null;

// QR separados
export let tempQrOnlineData = null;
export let tempQrPresencialData = null;
export let tempQrData = null; // Mantener por compatibilidad

export let selectedPatientForTherapist = null;
export let dataLoaded = false;
export const EDIT_HOURS = 24;

// 🔥 NUEVA VARIABLE PARA ADMIN (confirmación de solicitudes)
export let selectedPsychForBooking = null;

// 🔥 NUEVA VARIABLE PARA BOOKING (profesional actual)
export let currentPsychId = null;

// ============================================
// VARIABLES PARA FICHAS CLÍNICAS
// ============================================
export let fichasIngreso = [];
export let sesiones = [];
export let informes = [];

// ============================================
// VARIABLES PARA SECCIONES EDITABLES
// ============================================
export let missionText = DEFAULT_MISSION_TEXT;
export let visionText = DEFAULT_VISION_TEXT;
export let aboutTeamText = DEFAULT_ABOUT_TEAM_TEXT;
export let aboutImage = '';
export let atencionTexts = { ...DEFAULT_ATENCION_TEXTS };
export let contactInfo = { ...DEFAULT_CONTACT_INFO };
export let instagramData = { ...DEFAULT_INSTAGRAM_DATA };

// ============================================
// ESTADO UI PARA FICHAS
// ============================================
export let ui = {
    fichas: { ...DEFAULT_UI_FICHAS }
};

// ============================================
// FUNCIONES SETTER
// ============================================
export function setStaff(newStaff) { staff = newStaff; }
export function setPatients(newPatients) { patients = newPatients; }
export function setAppointments(newApps) { appointments = newApps; }
export function setMessages(newMessages) { messages = newMessages; }
export function setPendingRequests(newReqs) { pendingRequests = newReqs; }
export function setSpecialties(newSpecs) { specialties = newSpecs; }
export function setHeroTexts(newTexts) { heroTexts = newTexts; }
export function setGlobalPaymentMethods(newMethods) { globalPaymentMethods = newMethods; }
export function setBackgroundImage(newImg) { backgroundImage = newImg; }
export function setLogoImage(newLogo) { logoImage = newLogo; }

// Setters para secciones editables
export function setMissionText(text) { missionText = text; }
export function setVisionText(text) { visionText = text; }
export function setAboutTeamText(text) { aboutTeamText = text; }
export function setAboutImage(url) { aboutImage = url; }
export function setAtencionTexts(data) { atencionTexts = data; }
export function setContactInfo(data) { contactInfo = data; }
export function setInstagramData(data) { instagramData = { ...instagramData, ...data }; }

// Setters para fichas clínicas
export function setFichasIngreso(newFichas) { fichasIngreso = newFichas; }
export function setSesiones(newSesiones) { sesiones = newSesiones; }
export function setInformes(newInformes) { informes = newInformes; }

// 🔥 Setter para currentPsychId
export function setCurrentPsychId(id) { currentPsychId = id; }

// ============================================
// FUNCIÓN setCurrentUser (con manejo de errores)
// ============================================
export function setCurrentUser(user) {
    currentUser = user;

    if (user) {
        try {
            const userToStore = {
                role: user.role,
                data: {
                    id: user.data.id,
                    name: user.data.name,
                    email: user.data.email,
                    isAdmin: user.data.isAdmin || false,
                    usuario: user.data.usuario || '',
                    genero: user.data.genero || '',
                }
            };
            localStorage.setItem('vinculoCurrentUser', JSON.stringify(userToStore));

            if (user.role === 'psych' || user.role === 'admin') {
                localStorage.setItem('vinculo_user', JSON.stringify({ role: user.role, data: user.data }));
            }

            console.log('✅ Usuario guardado en localStorage (básico + completo)');
        } catch (e) {
            console.warn('⚠️ Error guardando usuario en localStorage:', e);
        }
    } else {
        try {
            localStorage.removeItem('vinculoCurrentUser');
            localStorage.removeItem('vinculo_user');
        } catch (e) {
            console.warn('⚠️ Error eliminando localStorage:', e);
        }
    }
}

// ============================================
// OTROS SETTERS
// ============================================
export function setSelectedPsych(psych) { selectedPsych = psych; }
export function setCurrentRating(rating) { currentRating = rating; }
export function setGeneratedSlots(slots) { generatedSlots = slots; }
export function setSelectedWeekdays(days) { selectedWeekdays = days; }
export function setTempImageData(data) { tempImageData = data; }
export function setTempBackgroundImageData(data) { tempBackgroundImageData = data; }
export function setTempLogoData(data) { tempLogoData = data; }
export function setTempQrOnlineData(data) { tempQrOnlineData = data; }
export function setTempQrPresencialData(data) { tempQrPresencialData = data; }
export function setTempQrData(data) {
    tempQrData = data;
    tempQrOnlineData = data; // compatibilidad
}
export function setSelectedPatientForTherapist(patient) { selectedPatientForTherapist = patient; }
export function setDataLoaded(loaded) { dataLoaded = loaded; }

// 🔥 SETTER PARA selectedPsychForBooking
export function setSelectedPsychForBooking(psych) { selectedPsychForBooking = psych; }

// ============================================
// FUNCIONES PARA FICHAS CLÍNICAS
// ============================================

/**
 * Agrega una ficha de ingreso
 * @param {Object} ficha - Datos de la ficha
 * @returns {Object} Ficha agregada
 */
export function addFichaIngreso(ficha) {
    fichasIngreso.push(ficha);
    return ficha;
}

/**
 * Actualiza una ficha de ingreso existente
 * @param {string|number} id - ID de la ficha
 * @param {Object} updatedFicha - Datos actualizados
 * @returns {Object|null} Ficha actualizada o null si no existe
 */
export function updateFichaIngreso(id, updatedFicha) {
    const index = fichasIngreso.findIndex(f => f.id === id);
    if (index !== -1) {
        fichasIngreso[index] = { ...fichasIngreso[index], ...updatedFicha };
        return fichasIngreso[index];
    }
    return null;
}

/**
 * Agrega una nota de sesión
 * @param {Object} sesion - Datos de la sesión
 * @returns {Object} Sesión agregada
 */
export function addSesion(sesion) {
    sesiones.push(sesion);
    return sesion;
}

/**
 * Actualiza una nota de sesión existente
 * @param {string|number} id - ID de la sesión
 * @param {Object} updatedSesion - Datos actualizados
 * @returns {Object|null} Sesión actualizada o null si no existe
 */
export function updateSesion(id, updatedSesion) {
    const index = sesiones.findIndex(s => s.id === id);
    if (index !== -1) {
        sesiones[index] = { ...sesiones[index], ...updatedSesion };
        return sesiones[index];
    }
    return null;
}

/**
 * Agrega un informe
 * @param {Object} informe - Datos del informe
 * @returns {Object} Informe agregado
 */
export function addInforme(informe) {
    informes.push(informe);
    return informe;
}

/**
 * Actualiza un informe existente
 * @param {string|number} id - ID del informe
 * @param {Object} updatedInforme - Datos actualizados
 * @returns {Object|null} Informe actualizado o null si no existe
 */
export function updateInforme(id, updatedInforme) {
    const index = informes.findIndex(i => i.id === id);
    if (index !== -1) {
        informes[index] = { ...informes[index], ...updatedInforme };
        return informes[index];
    }
    return null;
}

/**
 * Obtiene fichas de ingreso de un paciente
 * @param {string|number} patientId - ID del paciente
 * @returns {Array} Lista de fichas
 */
export function getFichasIngresoByPatient(patientId) {
    return fichasIngreso.filter(f => f.patientId == patientId);
}

/**
 * Obtiene sesiones de un paciente (ordenadas por fecha descendente)
 * @param {string|number} patientId - ID del paciente
 * @returns {Array} Lista de sesiones ordenadas
 */
export function getSesionesByPatient(patientId) {
    return sesiones
        .filter(s => s.patientId == patientId)
        .sort((a, b) => new Date(b.fechaAtencion) - new Date(a.fechaAtencion));
}

/**
 * Obtiene informes de un paciente
 * @param {string|number} patientId - ID del paciente
 * @returns {Array} Lista de informes
 */
export function getInformesByPatient(patientId) {
    return informes.filter(i => i.patientId == patientId);
}

/**
 * Limpia el estado de fichas (excepto paciente seleccionado)
 */
export function limpiarEstadoFichas() {
    ui.fichas = { ...DEFAULT_UI_FICHAS };
}

/**
 * Establece la pestaña activa en la vista de fichas
 * @param {string} pestana - Nombre de la pestaña
 */
export function setPestanaActiva(pestana) {
    ui.fichas.pestanaActiva = pestana;
}

/**
 * Establece el paciente seleccionado en la vista de fichas
 * @param {string|number} patientId - ID del paciente
 */
export function setPacienteSeleccionado(patientId) {
    ui.fichas.pacienteSeleccionadoId = patientId;
    limpiarEstadoFichas();
    ui.fichas.pacienteSeleccionadoId = patientId;
}

// ============================================
// FUNCIONES PARA PROFESIONALES
// ============================================

/**
 * Obtiene los datos completos del profesional actual
 * @returns {Object|null} Datos del profesional o null si no es psicólogo
 */
export function getCurrentPsychFullData() {
    if (!currentUser || currentUser.role !== 'psych') return null;
    const psychFullData = staff.find(s => s.id == currentUser.data.id);
    return psychFullData || currentUser.data;
}

/**
 * Actualiza los datos de un profesional en el estado
 * @param {string|number} psychId - ID del profesional
 * @param {Object} updatedData - Datos a actualizar
 * @returns {Object|null} Profesional actualizado o null si no existe
 */
export function updatePsychData(psychId, updatedData) {
    const index = staff.findIndex(s => s.id == psychId);
    if (index !== -1) {
        staff[index] = { ...staff[index], ...updatedData };

        if (currentUser && currentUser.role === 'psych' && currentUser.data.id == psychId) {
            currentUser.data = { ...currentUser.data, ...updatedData };
            setCurrentUser(currentUser);
        }

        return staff[index];
    }
    return null;
}

// ============================================
// FUNCIONES DE UTILIDAD GENERAL
// ============================================

/**
 * Reinicia todo el estado a sus valores por defecto (útil para logout)
 */
export function resetAllState() {
    staff = [];
    patients = [];
    appointments = [];
    messages = [];
    pendingRequests = [];
    specialties = [];
    heroTexts = { ...DEFAULT_HERO_TEXTS };
    globalPaymentMethods = { ...DEFAULT_GLOBAL_PAYMENT_METHODS };
    backgroundImage = { ...DEFAULT_BACKGROUND_IMAGE };
    logoImage = { ...DEFAULT_LOGO_IMAGE };
    selectedPsych = null;
    currentUser = null;
    currentRating = 5;
    generatedSlots = [];
    selectedWeekdays = [...DEFAULT_SELECTED_WEEKDAYS];
    tempImageData = null;
    tempBackgroundImageData = null;
    tempLogoData = null;
    tempQrOnlineData = null;
    tempQrPresencialData = null;
    tempQrData = null;
    selectedPatientForTherapist = null;
    selectedPsychForBooking = null;
    currentPsychId = null; // 🔥 Reiniciar también
    dataLoaded = false;

    fichasIngreso = [];
    sesiones = [];
    informes = [];

    missionText = DEFAULT_MISSION_TEXT;
    visionText = DEFAULT_VISION_TEXT;
    aboutTeamText = DEFAULT_ABOUT_TEAM_TEXT;
    aboutImage = '';
    atencionTexts = { ...DEFAULT_ATENCION_TEXTS };
    contactInfo = { ...DEFAULT_CONTACT_INFO };
    instagramData = { ...DEFAULT_INSTAGRAM_DATA };

    ui = {
        fichas: { ...DEFAULT_UI_FICHAS }
    };

    try {
        localStorage.removeItem('vinculoCurrentUser');
        localStorage.removeItem('vinculo_user');
    } catch (e) {
        console.warn('⚠️ Error al limpiar localStorage:', e);
    }
}

/**
 * Obtiene un resumen del estado actual (para debugging)
 * @returns {Object} Resumen del estado
 */
export function getStateSummary() {
    return {
        staff: staff.length,
        patients: patients.length,
        appointments: appointments.length,
        messages: messages.length,
        pendingRequests: pendingRequests.length,
        specialties: specialties.length,
        fichasIngreso: fichasIngreso.length,
        sesiones: sesiones.length,
        informes: informes.length,
        instagramConfigurado: instagramData.image ? '✅' : '❌',
        instagramData: instagramData,
        currentUser: currentUser ? `${currentUser.data?.name} (${currentUser.role})` : 'No logueado',
        dataLoaded,
        currentPsychId
    };
}

/**
 * Función de depuración para verificar datos de Instagram
 * @returns {Object} Datos de Instagram desde state, personalizacion y DOM
 */
export function verInstagram() {
    console.log('📸 Datos de Instagram:');
    console.log('- En estado global:', instagramData);
    console.log('- En personalizacion:', window.personalizacion?.instagramData);
    console.log('- En el DOM:', document.getElementById('instagramQuote')?.innerHTML);
    return {
        state: instagramData,
        personalizacion: window.personalizacion?.instagramData,
        dom: document.getElementById('instagramQuote')?.innerHTML
    };
}

// ============================================
// EXPORTAR OBJETO ÚNICO (para compatibilidad)
// ============================================
const state = {
    // Variables
    staff,
    patients,
    appointments,
    messages,
    pendingRequests,
    specialties,
    heroTexts,
    globalPaymentMethods,
    backgroundImage,
    logoImage,
    selectedPsych,
    currentUser,
    currentRating,
    generatedSlots,
    selectedWeekdays,
    tempImageData,
    tempBackgroundImageData,
    tempLogoData,
    tempQrOnlineData,
    tempQrPresencialData,
    tempQrData,
    selectedPatientForTherapist,
    selectedPsychForBooking,
    currentPsychId, // 🔥 Incluida en el objeto
    dataLoaded,
    EDIT_HOURS,

    // Fichas clínicas
    fichasIngreso,
    sesiones,
    informes,

    // Secciones editables
    missionText,
    visionText,
    aboutTeamText,
    aboutImage,
    atencionTexts,
    contactInfo,
    instagramData,

    ui,

    // Setters
    setStaff,
    setPatients,
    setAppointments,
    setMessages,
    setPendingRequests,
    setSpecialties,
    setHeroTexts,
    setGlobalPaymentMethods,
    setBackgroundImage,
    setLogoImage,
    setCurrentUser,
    setSelectedPsych,
    setCurrentRating,
    setGeneratedSlots,
    setSelectedWeekdays,
    setTempImageData,
    setTempBackgroundImageData,
    setTempLogoData,
    setTempQrOnlineData,
    setTempQrPresencialData,
    setTempQrData,
    setSelectedPatientForTherapist,
    setSelectedPsychForBooking,
    setCurrentPsychId, // 🔥 Setter para la nueva variable
    setDataLoaded,

    // Setters de secciones editables
    setMissionText,
    setVisionText,
    setAboutTeamText,
    setAboutImage,
    setAtencionTexts,
    setContactInfo,
    setInstagramData,

    // Funciones de fichas clínicas
    setFichasIngreso,
    setSesiones,
    setInformes,
    addFichaIngreso,
    updateFichaIngreso,
    addSesion,
    updateSesion,
    addInforme,
    updateInforme,
    getFichasIngresoByPatient,
    getSesionesByPatient,
    getInformesByPatient,
    limpiarEstadoFichas,
    setPestanaActiva,
    setPacienteSeleccionado,

    // Funciones para profesionales
    getCurrentPsychFullData,
    updatePsychData,

    // Utilidades
    resetAllState,
    getStateSummary,
    verInstagram
};

export default state;

// ============================================
// EXPONER ESTADO GLOBALMENTE PARA DEPURACIÓN
// ============================================
if (typeof window !== 'undefined') {
    window.state = state;
    window.verInstagram = verInstagram;

    console.log('📦 state.js cargado con fichas clínicas, datos de profesionales, secciones editables y SECCIÓN INSTAGRAM v3.0 (boxes eliminado)');

    window.estado = function() {
        console.table(state.getStateSummary());
        return state.getStateSummary();
    };

    window.miPerfil = function() {
        if (!state.currentUser) {
            console.log('❌ No hay usuario logueado');
            return null;
        }
        if (state.currentUser.role === 'psych') {
            const fullData = state.getCurrentPsychFullData();
            console.log('👤 Mi perfil completo:', fullData);
            return fullData;
        } else {
            console.log('👑 Usuario admin:', state.currentUser.data);
            return state.currentUser.data;
        }
    };

    window.verTextos = function() {
        console.log('📝 Textos editables:');
        console.log('- Misión:', state.missionText);
        console.log('- Visión:', state.visionText);
        console.log('- Equipo:', state.aboutTeamText);
        console.log('- Tipos de Atención:', state.atencionTexts);
        console.log('- Contacto:', state.contactInfo);
        console.log('- Instagram:', state.instagramData);
    };

    window.limpiarStorage = function() {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('vinculo')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`✅ Eliminados ${keysToRemove.length} items de Vínculo Salud`);
        return keysToRemove.length;
    };
}