// js/modules/state.js
// Variables globales compartidas entre todos los módulos

// ============================================
// VARIABLES EXISTENTES
// ============================================
export let staff = [];
export let patients = [];
export let appointments = [];
export let boxes = [];               // Se mantiene por compatibilidad, aunque desactivado
export let messages = [];
export let pendingRequests = [];
export let specialties = [];
export let heroTexts = {
    title: 'Bienestar a tu alcance',
    subtitle: 'Encuentra al profesional ideal y agenda tu sesión'
};
export let globalPaymentMethods = {
    transfer: true,
    cardPresencial: true,
    cardOnline: false,
    cash: true,
    mercadopago: false,
    webpay: false
};
export let backgroundImage = { url: '', opacity: 10 };
export let logoImage = { url: '', text: 'Vínculo Salud' };
export let selectedPsych = null;
export let currentUser = null;
export let currentRating = 5;
export let generatedSlots = [];
export let selectedWeekdays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];
export let selectedBoxId = null;           // Se mantiene por compatibilidad
export let selectedTherapistBoxId = null;  // Se mantiene por compatibilidad
export let tempImageData = null;
export let tempBackgroundImageData = null;
export let tempLogoData = null;
export let tempQrData = null;
export let selectedPatientForTherapist = null;
export let dataLoaded = false;
export const EDIT_HOURS = 24;

// ============================================
// NUEVAS VARIABLES PARA FICHAS CLÍNICAS
// ============================================
export let fichasIngreso = [];           // Todas las fichas de ingreso
export let sesiones = [];                // Todas las notas de evolución por sesión
export let informes = [];                // Todos los informes (psicodiagnóstico/cierre)

// ============================================
// 🆕 NUEVAS VARIABLES PARA SECCIONES EDITABLES (v3.0)
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
    subtitle: 'VINCULO',
    quote: '<strong>"SOLO HABLAMOS"</strong><br>JAVIERA TIENE EL ÉXITO,<br>pero no tiene con quién celebrarlo.',
    text: 'Detente aquí un segundo',
    message: 'Esto también se aprende.',
    link: 'https://instagram.com/vinculo.salud',
    image: ''
};

// Estado UI para fichas
export let ui = {
    fichas: {
        pacienteSeleccionadoId: null,
        fichaActivaId: null,
        sesionActivaId: null,
        informeActivoId: null,
        modoEdicion: false,
        pestanaActiva: 'perfil' // 'perfil' | 'fichaIngreso' | 'sesiones' | 'informes'
    }
};

// ============================================
// FUNCIONES PARA ACTUALIZAR VARIABLES EXISTENTES
// ============================================
export function setStaff(newStaff) { staff = newStaff; }
export function setPatients(newPatients) { patients = newPatients; }
export function setAppointments(newApps) { appointments = newApps; }
export function setBoxes(newBoxes) { boxes = newBoxes; }  // Se mantiene por compatibilidad
export function setMessages(newMessages) { messages = newMessages; }
export function setPendingRequests(newReqs) { pendingRequests = newReqs; }
export function setSpecialties(newSpecs) { specialties = newSpecs; }
export function setHeroTexts(newTexts) { heroTexts = newTexts; }
export function setGlobalPaymentMethods(newMethods) { globalPaymentMethods = newMethods; }
export function setBackgroundImage(newImg) { backgroundImage = newImg; }
export function setLogoImage(newLogo) { logoImage = newLogo; }

// ============================================
// 🆕 NUEVAS FUNCIONES SETTER PARA SECCIONES EDITABLES
// ============================================
export function setMissionText(text) { missionText = text; }
export function setVisionText(text) { visionText = text; }
export function setAboutTeamText(text) { aboutTeamText = text; }
export function setAboutImage(url) { aboutImage = url; }
export function setAtencionTexts(data) { atencionTexts = data; }
export function setContactInfo(data) { contactInfo = data; }
export function setInstagramData(data) { instagramData = { ...instagramData, ...data }; }

// ============================================
// FUNCIÓN setCurrentUser CORREGIDA (con manejo de errores de localStorage)
// ============================================
export function setCurrentUser(user) { 
    currentUser = user; 
    
    // Guardar en localStorage con manejo de errores
    if (user) {
        try {
            // Limitar los datos guardados (solo lo esencial para no llenar localStorage)
            const userToStore = {
                role: user.role,
                data: {
                    id: user.data.id,
                    name: user.data.name,
                    email: user.data.email,
                    isAdmin: user.data.isAdmin || false,
                    usuario: user.data.usuario || '',
                    // Incluir género para mostrarlo correctamente
                    genero: user.data.genero || '',
                    // No guardar datos grandes como availability, paymentLinks, etc.
                }
            };
            
            // Intentar guardar
            localStorage.setItem('vinculoCurrentUser', JSON.stringify(userToStore));
            console.log('✅ Usuario guardado en localStorage');
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.warn('⚠️ localStorage lleno, limpiando espacio...');
                
                // Limpiar SOLO items de Vínculo Salud (no afecta otras páginas)
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('vinculo')) {
                        keysToRemove.push(key);
                    }
                }
                
                keysToRemove.forEach(key => localStorage.removeItem(key));
                console.log(`✅ Eliminados ${keysToRemove.length} items de Vínculo Salud del localStorage`);
                
                // Reintentar guardar
                try {
                    localStorage.setItem('vinculoCurrentUser', JSON.stringify(userToStore));
                    console.log('✅ Usuario guardado después de limpiar');
                } catch (err) {
                    console.error('❌ No se pudo guardar en localStorage incluso después de limpiar');
                    // El usuario sigue existiendo en memoria, solo no se persiste
                }
            } else {
                console.error('❌ Error guardando en localStorage:', e);
            }
        }
    } else {
        // Eliminar usuario de localStorage al hacer logout
        try {
            localStorage.removeItem('vinculoCurrentUser');
        } catch (e) {
            console.warn('⚠️ Error al eliminar de localStorage:', e);
        }
    }
}

export function setSelectedPsych(psych) { selectedPsych = psych; }
export function setCurrentRating(rating) { currentRating = rating; }
export function setGeneratedSlots(slots) { generatedSlots = slots; }
export function setSelectedWeekdays(days) { selectedWeekdays = days; }
export function setSelectedBoxId(id) { selectedBoxId = id; }        // Se mantiene por compatibilidad
export function setSelectedTherapistBoxId(id) { selectedTherapistBoxId = id; }  // Se mantiene por compatibilidad
export function setTempImageData(data) { tempImageData = data; }
export function setTempBackgroundImageData(data) { tempBackgroundImageData = data; }
export function setTempLogoData(data) { tempLogoData = data; }
export function setTempQrData(data) { tempQrData = data; }
export function setSelectedPatientForTherapist(patient) { selectedPatientForTherapist = patient; }
export function setDataLoaded(loaded) { dataLoaded = loaded; }

// ============================================
// NUEVAS FUNCIONES PARA FICHAS CLÍNICAS
// ============================================
export function setFichasIngreso(newFichas) { fichasIngreso = newFichas; }
export function setSesiones(newSesiones) { sesiones = newSesiones; }
export function setInformes(newInformes) { informes = newInformes; }

// Función para agregar una ficha de ingreso
export function addFichaIngreso(ficha) {
    fichasIngreso.push(ficha);
    return ficha;
}

// Función para actualizar una ficha de ingreso
export function updateFichaIngreso(id, updatedFicha) {
    const index = fichasIngreso.findIndex(f => f.id === id);
    if (index !== -1) {
        fichasIngreso[index] = { ...fichasIngreso[index], ...updatedFicha };
        return fichasIngreso[index];
    }
    return null;
}

// Función para agregar una sesión/nota de evolución
export function addSesion(sesion) {
    sesiones.push(sesion);
    return sesion;
}

// Función para actualizar una sesión
export function updateSesion(id, updatedSesion) {
    const index = sesiones.findIndex(s => s.id === id);
    if (index !== -1) {
        sesiones[index] = { ...sesiones[index], ...updatedSesion };
        return sesiones[index];
    }
    return null;
}

// Función para agregar un informe
export function addInforme(informe) {
    informes.push(informe);
    return informe;
}

// Función para actualizar un informe
export function updateInforme(id, updatedInforme) {
    const index = informes.findIndex(i => i.id === id);
    if (index !== -1) {
        informes[index] = { ...informes[index], ...updatedInforme };
        return informes[index];
    }
    return null;
}

// Función para obtener fichas de ingreso de un paciente específico
export function getFichasIngresoByPatient(patientId) {
    return fichasIngreso.filter(f => f.patientId == patientId);
}

// Función para obtener sesiones de un paciente específico (ordenadas por fecha)
export function getSesionesByPatient(patientId) {
    return sesiones
        .filter(s => s.patientId == patientId)
        .sort((a, b) => new Date(b.fechaAtencion) - new Date(a.fechaAtencion));
}

// Función para obtener informes de un paciente específico
export function getInformesByPatient(patientId) {
    return informes.filter(i => i.patientId == patientId);
}

// Función para limpiar estado de fichas (útil al cambiar de paciente)
export function limpiarEstadoFichas() {
    ui.fichas = {
        pacienteSeleccionadoId: null,
        fichaActivaId: null,
        sesionActivaId: null,
        informeActivoId: null,
        modoEdicion: false,
        pestanaActiva: 'perfil'
    };
}

// Función para establecer la pestaña activa
export function setPestanaActiva(pestana) {
    ui.fichas.pestanaActiva = pestana;
}

// Función para establecer el paciente seleccionado
export function setPacienteSeleccionado(patientId) {
    ui.fichas.pacienteSeleccionadoId = patientId;
    limpiarEstadoFichas(); // Limpia el resto pero mantiene el paciente
    ui.fichas.pacienteSeleccionadoId = patientId;
}

// ============================================
// FUNCIÓN PARA OBTENER PROFESIONAL ACTUAL CON TODOS SUS DATOS
// ============================================
export function getCurrentPsychFullData() {
    if (!currentUser || currentUser.role !== 'psych') return null;
    
    // Buscar en staff por ID para obtener todos los datos (incluyendo los que no se guardan en currentUser)
    const psychFullData = staff.find(s => s.id == currentUser.data.id);
    return psychFullData || currentUser.data;
}

// ============================================
// FUNCIÓN PARA ACTUALIZAR DATOS DE PROFESIONAL EN STAFF
// ============================================
export function updatePsychData(psychId, updatedData) {
    const index = staff.findIndex(s => s.id == psychId);
    if (index !== -1) {
        staff[index] = { ...staff[index], ...updatedData };
        
        // Si el profesional actualizado es el usuario actual, actualizar también currentUser
        if (currentUser && currentUser.role === 'psych' && currentUser.data.id == psychId) {
            currentUser.data = { ...currentUser.data, ...updatedData };
            // Actualizar localStorage con datos básicos actualizados
            setCurrentUser(currentUser);
        }
        
        return staff[index];
    }
    return null;
}

// ============================================
// FUNCIONES DE UTILIDAD GENERAL
// ============================================

// Función para reiniciar todo el estado (útil para logout)
export function resetAllState() {
    staff = [];
    patients = [];
    appointments = [];
    boxes = [];              // Se mantiene por compatibilidad
    messages = [];
    pendingRequests = [];
    specialties = [];
    heroTexts = {
        title: 'Bienestar a tu alcance',
        subtitle: 'Encuentra al profesional ideal y agenda tu sesión'
    };
    globalPaymentMethods = {
        transfer: true,
        cardPresencial: true,
        cardOnline: false,
        cash: true,
        mercadopago: false,
        webpay: false
    };
    backgroundImage = { url: '', opacity: 10 };
    logoImage = { url: '', text: 'Vínculo Salud' };
    selectedPsych = null;
    currentUser = null;
    currentRating = 5;
    generatedSlots = [];
    selectedWeekdays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];
    selectedBoxId = null;
    selectedTherapistBoxId = null;
    tempImageData = null;
    tempBackgroundImageData = null;
    tempLogoData = null;
    tempQrData = null;
    selectedPatientForTherapist = null;
    dataLoaded = false;
    
    // Nuevas variables
    fichasIngreso = [];
    sesiones = [];
    informes = [];
    
    // Nuevas variables de secciones editables
    missionText = 'Acompañar a las personas en su proceso de sanación emocional, proporcionando herramientas para el crecimiento personal y la mejora de la calidad de vida.';
    visionText = 'Ser un referente en salud mental en la región, reconocido por nuestra calidad profesional, calidez humana y compromiso con la comunidad.';
    aboutTeamText = 'Nuestro equipo está formado por profesionales de la salud mental con amplia formación y experiencia en terapia individual, familiar y de pareja. Todos compartimos una mirada humana, ética y especializada.';
    aboutImage = '';
    
    atencionTexts = {
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
    
    contactInfo = {
        email: 'vinculosalud@gmail.com',
        phone: '+56 9 1234 5678',
        address: 'Ohiggins 263, Concepción'
    };
    
    // 🆕 Reiniciar Instagram data
    instagramData = {
        title: 'Sigue Nuestro Instagram',
        subtitle: 'VINCULO',
        quote: '<strong>"SOLO HABLAMOS"</strong><br>JAVIERA TIENE EL ÉXITO,<br>pero no tiene con quién celebrarlo.',
        text: 'Detente aquí un segundo',
        message: 'Esto también se aprende.',
        link: 'https://instagram.com/vinculo.salud',
        image: ''
    };
    
    ui = {
        fichas: {
            pacienteSeleccionadoId: null,
            fichaActivaId: null,
            sesionActivaId: null,
            informeActivoId: null,
            modoEdicion: false,
            pestanaActiva: 'perfil'
        }
    };
    
    // Limpiar localStorage
    try {
        localStorage.removeItem('vinculoCurrentUser');
    } catch (e) {
        console.warn('Error al limpiar localStorage:', e);
    }
}

// Función para obtener un resumen del estado (útil para debugging)
export function getStateSummary() {
    return {
        staff: staff.length,
        patients: patients.length,
        appointments: appointments.length,
        boxes: boxes.length,              // Se mantiene por compatibilidad
        messages: messages.length,
        pendingRequests: pendingRequests.length,
        specialties: specialties.length,
        fichasIngreso: fichasIngreso.length,
        sesiones: sesiones.length,
        informes: informes.length,
        instagramConfigurado: instagramData.image ? '✅' : '❌',
        currentUser: currentUser ? `${currentUser.data?.name} (${currentUser.role})` : 'No logueado',
        dataLoaded
    };
}

// ============================================
// EXPORTAR TODO COMO OBJETO ÚNICO (para compatibilidad)
// ============================================
const state = {
    // Variables
    staff,
    patients,
    appointments,
    boxes,                     // Se mantiene por compatibilidad
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
    selectedBoxId,             // Se mantiene por compatibilidad
    selectedTherapistBoxId,    // Se mantiene por compatibilidad
    tempImageData,
    tempBackgroundImageData,
    tempLogoData,
    tempQrData,
    selectedPatientForTherapist,
    dataLoaded,
    EDIT_HOURS,
    
    // Nuevas variables de fichas clínicas
    fichasIngreso,
    sesiones,
    informes,
    
    // Nuevas variables de secciones editables
    missionText,
    visionText,
    aboutTeamText,
    aboutImage,
    atencionTexts,
    contactInfo,
    
    // 🆕 Nueva variable de Instagram
    instagramData,
    
    ui,
    
    // Funciones existentes
    setStaff,
    setPatients,
    setAppointments,
    setBoxes,                  // Se mantiene por compatibilidad
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
    setSelectedBoxId,          // Se mantiene por compatibilidad
    setSelectedTherapistBoxId, // Se mantiene por compatibilidad
    setTempImageData,
    setTempBackgroundImageData,
    setTempLogoData,
    setTempQrData,
    setSelectedPatientForTherapist,
    setDataLoaded,
    
    // Nuevas funciones de fichas clínicas
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
    
    // Nuevas funciones para secciones editables
    setMissionText,
    setVisionText,
    setAboutTeamText,
    setAboutImage,
    setAtencionTexts,
    setContactInfo,
    
    // 🆕 Nueva función para Instagram
    setInstagramData,
    
    // Funciones para profesionales
    getCurrentPsychFullData,
    updatePsychData,
    
    // Utilidades
    resetAllState,
    getStateSummary
};

export default state;

// ============================================
// EXPONER ESTADO GLOBALMENTE PARA DEPURACIÓN
// ============================================
if (typeof window !== 'undefined') {
    window.state = state;
    console.log('📦 state.js cargado con fichas clínicas, datos de profesionales, secciones editables y SECCIÓN INSTAGRAM v3.0 (boxes desactivado - mantenido por compatibilidad)');
    
    // Función de ayuda en consola
    window.estado = function() {
        console.table(state.getStateSummary());
        return state.getStateSummary();
    };
    
    // Función para ver datos del profesional actual
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
    
    // Función para ver textos editables
    window.verTextos = function() {
        console.log('📝 Textos editables:');
        console.log('- Misión:', state.missionText);
        console.log('- Visión:', state.visionText);
        console.log('- Equipo:', state.aboutTeamText);
        console.log('- Tipos de Atención:', state.atencionTexts);
        console.log('- Contacto:', state.contactInfo);
        console.log('- Instagram:', state.instagramData);
    };
    
    // Función para limpiar localStorage manualmente si es necesario
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