// js/modules/state.js
// Variables globales compartidas entre todos los módulos

export let staff = [];
export let patients = [];
export let appointments = [];
export let boxes = [];
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
export let selectedBoxId = null;
export let selectedTherapistBoxId = null;
export let tempImageData = null;
export let tempBackgroundImageData = null;
export let tempLogoData = null;
export let tempQrData = null;
export let selectedPatientForTherapist = null;
export let dataLoaded = false;
export const EDIT_HOURS = 24;

// Funciones para actualizar las variables (cuando sea necesario)
export function setStaff(newStaff) { staff = newStaff; }
export function setPatients(newPatients) { patients = newPatients; }
export function setAppointments(newApps) { appointments = newApps; }
export function setBoxes(newBoxes) { boxes = newBoxes; }
export function setMessages(newMessages) { messages = newMessages; }
export function setPendingRequests(newReqs) { pendingRequests = newReqs; }
export function setSpecialties(newSpecs) { specialties = newSpecs; }
export function setHeroTexts(newTexts) { heroTexts = newTexts; }
export function setGlobalPaymentMethods(newMethods) { globalPaymentMethods = newMethods; }
export function setBackgroundImage(newImg) { backgroundImage = newImg; }
export function setLogoImage(newLogo) { logoImage = newLogo; }
export function setCurrentUser(user) { currentUser = user; }
export function setSelectedPsych(psych) { selectedPsych = psych; }
export function setCurrentRating(rating) { currentRating = rating; }
export function setGeneratedSlots(slots) { generatedSlots = slots; }
export function setSelectedWeekdays(days) { selectedWeekdays = days; }
export function setSelectedBoxId(id) { selectedBoxId = id; }
export function setSelectedTherapistBoxId(id) { selectedTherapistBoxId = id; }
export function setTempImageData(data) { tempImageData = data; }
export function setTempBackgroundImageData(data) { tempBackgroundImageData = data; }
export function setTempLogoData(data) { tempLogoData = data; }
export function setTempQrData(data) { tempQrData = data; }
export function setSelectedPatientForTherapist(patient) { selectedPatientForTherapist = patient; }
export function setDataLoaded(loaded) { dataLoaded = loaded; }

// js/modules/state.js - AÑADE ESTO AL FINAL

// ============================================
// NUEVAS VARIABLES DE ESTADO PARA FICHAS CLÍNICAS
// ============================================

// Colecciones nuevas
state.fichasIngreso = [];           // Todas las fichas de ingreso
state.sesiones = [];                // Todas las notas de evolución por sesión
state.informes = [];                // Todos los informes (psicodiagnóstico/cierre)

// Estado UI para fichas
state.ui.fichas = {
  pacienteSeleccionadoId: null,
  fichaActivaId: null,
  sesionActivaId: null,
  informeActivoId: null,
  modoEdicion: false,
  pestanaActiva: 'perfil' // 'perfil' | 'fichaIngreso' | 'sesiones' | 'informes'
};

// Función para limpiar estado de fichas (útil al cambiar de paciente)
state.limpiarEstadoFichas = () => {
  state.ui.fichas = {
    pacienteSeleccionadoId: null,
    fichaActivaId: null,
    sesionActivaId: null,
    informeActivoId: null,
    modoEdicion: false,
    pestanaActiva: 'perfil'
  };
};

// Exportamos todo igual
export default state;