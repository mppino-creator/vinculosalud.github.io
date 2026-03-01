// js/modules/informes.js
import { db } from '../config/firebase.js';
import state from './state.js';
import { puedeEditarFichas } from './permisos.js';
import { generarPDF } from './pdfGenerator.js';

export async function guardarInforme(patientId, tipo, data) {
  if (!puedeEditarFichas(patientId)) {
    throw new Error('No tienes permisos');
  }
  
  const informe = {
    patientId,
    patientName: state.patients.find(p => p.id === patientId)?.nombre || 'Desconocido',
    patientRut: state.patients.find(p => p.id === patientId)?.rut,
    tipo, // 'psicodiagnostico' o 'cierre'
    ...data,
    realizadoPor: state.currentUser.data.id,
    fechaCreacion: new Date().toISOString(),
    fechaModificacion: new Date().toISOString()
  };
  
  try {
    let docRef;
    if (data.id) {
      await db.collection('informes').doc(data.id).update(informe);
      docRef = { id: data.id };
      
      // Actualizar state
      const index = state.informes.findIndex(i => i.id === data.id);
      if (index !== -1) state.informes[index] = { ...informe, id: data.id };
    } else {
      docRef = await db.collection('informes').add(informe);
      state.informes.push({ ...informe, id: docRef.id });
    }
    
    // Generar PDF automáticamente
    const pdfUrl = await generarPDF(informe, tipo);
    
    // Guardar URL del PDF
    await db.collection('informes').doc(docRef.id).update({ pdfUrl });
    
    return { success: true, id: docRef.id, pdfUrl };
  } catch (error) {
    console.error('Error guardando informe:', error);
    throw error;
  }
}

export async function obtenerInformesDePaciente(patientId) {
  try {
    const snapshot = await db.collection('informes')
      .where('patientId', '==', patientId)
      .orderBy('fechaCreacion', 'desc')
      .get();
      
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error obteniendo informes:', error);
    return [];
  }
}