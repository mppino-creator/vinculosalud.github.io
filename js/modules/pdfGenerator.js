// js/modules/pdfGenerator.js
// Módulo para generación de PDFs - Versión corregida sin imports de módulos

/**
 * Genera un PDF a partir de los datos de un informe
 * @param {Object} data - Datos del informe
 * @param {string} tipo - Tipo de informe ('psicodiagnostico' o 'cierre')
 * @returns {Promise<string>} URL del PDF generado
 */
export async function generarPDF(data, tipo) {
  try {
    console.log(`📄 Generando PDF de tipo: ${tipo}`, data);
    
    // Verificar si jsPDF está disponible globalmente
    if (typeof window.jspdf === 'undefined') {
      console.warn('⚠️ jsPDF no está disponible, usando modo simulado');
      return simuladorPDF(data, tipo);
    }
    
    // Crear nuevo documento PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Configurar fuente y tamaño
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    
    // Título del documento
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(tipo === 'psicodiagnostico' ? 'INFORME PSICODIAGNÓSTICO' : 'INFORME DE CIERRE DE PROCESO', 20, 20);
    
    // Línea de confidencialidad
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('(Confidencial)', 20, 28);
    
    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(20, 32, 190, 32);
    
    // Datos del paciente
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('I. IDENTIFICACIÓN', 20, 42);
    
    doc.setFont('helvetica', 'normal');
    let yPos = 50;
    
    if (data.patientName) {
      doc.text(`Nombre: ${data.patientName}`, 25, yPos);
      yPos += 7;
    }
    
    if (data.patientRut) {
      doc.text(`RUT: ${data.patientRut}`, 25, yPos);
      yPos += 7;
    }
    
    if (data.fechaEvaluacion) {
      doc.text(`Fecha de Evaluación: ${data.fechaEvaluacion}`, 25, yPos);
      yPos += 7;
    }
    
    yPos += 5;
    
    // Contenido específico según tipo
    doc.setFont('helvetica', 'bold');
    doc.text('II. MOTIVO DE CONSULTA', 20, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'normal');
    const motivo = data.motivoConsulta || data.contenidoCierre?.motivoConsulta || 'No especificado';
    const motivoLines = doc.splitTextToSize(motivo, 170);
    
    motivoLines.forEach(line => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 25, yPos);
      yPos += 7;
    });
    
    yPos += 5;
    
    // Firma
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text('Evaluador', 20, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'normal');
    doc.text('____________________________________', 25, yPos);
    yPos += 7;
    doc.text(data.realizadoPor ? `Ps. ${data.realizadoPor}` : 'Ps. _________________________', 25, yPos);
    
    // Fecha
    yPos += 10;
    const fechaActual = new Date().toLocaleDateString('es-CL');
    doc.text(`Concepción, ${fechaActual}`, 20, yPos);
    
    // Guardar PDF
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // En un entorno real, aquí subirías a Firebase Storage
    console.log('✅ PDF generado correctamente');
    
    return pdfUrl;
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    return simuladorPDF(data, tipo);
  }
}

/**
 * Versión simulada para cuando no hay jsPDF
 */
function simuladorPDF(data, tipo) {
  console.log('📄 Modo simulado - PDF generado:', {
    tipo,
    paciente: data.patientName,
    id: data.id
  });
  
  // Crear una URL simulada
  return `https://storage.vinculosalud.cl/informes/${data.id || 'temp'}_${Date.now()}.pdf`;
}

/**
 * Genera un informe de psicodiagnóstico completo
 * @param {Object} data - Datos del informe psicodiagnóstico
 * @returns {Promise<string>} URL del PDF
 */
export async function generarInformePsicodiagnostico(data) {
  return generarPDF(data, 'psicodiagnostico');
}

/**
 * Genera un informe de cierre de proceso
 * @param {Object} data - Datos del informe de cierre
 * @returns {Promise<string>} URL del PDF
 */
export async function generarInformeCierre(data) {
  return generarPDF(data, 'cierre');
}

/**
 * Exporta la ficha completa de un paciente (todos los documentos)
 * @param {string} patientId - ID del paciente
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function exportarFichaCompletaPaciente(patientId) {
  try {
    console.log('📦 Exportando ficha completa del paciente:', patientId);
    
    // Aquí iría la lógica para:
    // 1. Obtener todos los documentos del paciente
    // 2. Generar PDFs individuales
    // 3. Crear un ZIP con todos
    // 4. Subir a Storage o descargar directamente
    
    return { 
      success: true, 
      message: 'Función simulada - Próximamente: exportación completa en ZIP',
      patientId
    };
  } catch (error) {
    console.error('Error exportando ficha completa:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Genera una nota de evolución en PDF
 * @param {Object} sesion - Datos de la sesión
 * @returns {Promise<string>} URL del PDF
 */
export async function generarNotaSesionPDF(sesion) {
  try {
    console.log('📝 Generando PDF de sesión:', sesion.id);
    
    if (typeof window.jspdf === 'undefined') {
      return simuladorPDF(sesion, 'sesion');
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE LA ATENCIÓN', 20, 20);
    
    // Fecha
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha Atención: ${sesion.fechaAtencion || '___' }`, 20, 30);
    doc.text(`Tipo: ${sesion.tipoAtencion || 'Sesión Terapéutica'}`, 20, 37);
    
    // Notas
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Notas de la Atención:', 20, 50);
    
    doc.setFont('helvetica', 'normal');
    const notas = sesion.notas || 'Sin notas registradas';
    const notasLines = doc.splitTextToSize(notas, 170);
    
    let yPos = 58;
    notasLines.forEach(line => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 25, yPos);
      yPos += 7;
    });
    
    const pdfBlob = doc.output('blob');
    return URL.createObjectURL(pdfBlob);
  } catch (error) {
    console.error('Error generando nota de sesión:', error);
    return simuladorPDF(sesion, 'sesion');
  }
}

/**
 * Genera una ficha de ingreso en PDF
 * @param {Object} fichaIngreso - Datos de la ficha de ingreso
 * @returns {Promise<string>} URL del PDF
 */
export async function generarFichaIngresoPDF(fichaIngreso) {
  try {
    console.log('📋 Generando PDF de ficha de ingreso:', fichaIngreso.id);
    
    if (typeof window.jspdf === 'undefined') {
      return simuladorPDF(fichaIngreso, 'fichaIngreso');
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FICHA DE INGRESO', 20, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('(Pre-ingreso)', 20, 28);
    
    doc.line(20, 32, 190, 32);
    
    let yPos = 42;
    
    // Motivo de consulta
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Motivo de Consulta:', 20, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'normal');
    const motivo = fichaIngreso.motivoConsulta || 'No especificado';
    const motivoLines = doc.splitTextToSize(motivo, 170);
    motivoLines.forEach(line => {
      doc.text(line, 25, yPos);
      yPos += 7;
    });
    
    yPos += 5;
    
    // Sintomatología
    doc.setFont('helvetica', 'bold');
    doc.text('Sintomatología:', 20, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'normal');
    if (fichaIngreso.sintomatologia) {
      const s = fichaIngreso.sintomatologia;
      if (s.fechaInicio) doc.text(`- Fecha inicio: ${s.fechaInicio}`, 25, yPos);
      yPos += 7;
      if (s.progresion) {
        const progLines = doc.splitTextToSize(`- Progresión: ${s.progresion}`, 165);
        progLines.forEach(line => {
          doc.text(line, 25, yPos);
          yPos += 7;
        });
      }
      if (s.tratamientosPrevios) {
        const tratLines = doc.splitTextToSize(`- Tratamientos previos: ${s.tratamientosPrevios}`, 165);
        tratLines.forEach(line => {
          doc.text(line, 25, yPos);
          yPos += 7;
        });
      }
    }
    
    const pdfBlob = doc.output('blob');
    return URL.createObjectURL(pdfBlob);
  } catch (error) {
    console.error('Error generando ficha de ingreso:', error);
    return simuladorPDF(fichaIngreso, 'fichaIngreso');
  }
}

/**
 * Genera un resumen completo del paciente en PDF
 * @param {Object} patient - Datos del paciente
 * @param {Array} fichas - Fichas de ingreso
 * @param {Array} sesiones - sesiones
 * @param {Array} informes - informes
 * @returns {Promise<string>} URL del PDF
 */
export async function generarResumenPacientePDF(patient, fichas = [], sesiones = [], informes = []) {
  try {
    console.log('📊 Generando resumen completo del paciente:', patient.name);
    
    if (typeof window.jspdf === 'undefined') {
      return simuladorPDF(patient, 'resumen');
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN CLÍNICO DEL PACIENTE', 20, 20);
    
    // Línea
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    
    let yPos = 35;
    
    // Datos del paciente
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Datos del Paciente:', 20, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${patient.name}`, 25, yPos);
    yPos += 6;
    doc.text(`RUT: ${patient.rut || 'No registrado'}`, 25, yPos);
    yPos += 6;
    doc.text(`Email: ${patient.email || 'No registrado'}`, 25, yPos);
    yPos += 6;
    doc.text(`Teléfono: ${patient.phone || 'No registrado'}`, 25, yPos);
    yPos += 6;
    doc.text(`Fecha registro: ${patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'No registrada'}`, 25, yPos);
    yPos += 10;
    
    // Fichas de ingreso
    doc.setFont('helvetica', 'bold');
    doc.text(`Fichas de Ingreso (${fichas.length})`, 20, yPos);
    yPos += 7;
    
    if (fichas.length > 0) {
      fichas.forEach((f, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bolditalic');
        doc.text(`Ficha ${index + 1}:`, 25, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        const motivo = f.motivoConsulta || 'Sin motivo especificado';
        const motivoLines = doc.splitTextToSize(motivo, 160);
        motivoLines.forEach(line => {
          doc.text(line, 30, yPos);
          yPos += 5;
        });
        yPos += 5;
      });
    } else {
      doc.text('No hay fichas de ingreso registradas', 25, yPos);
      yPos += 7;
    }
    
    yPos += 5;
    
    // sesiones
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(`sesiones Registradas (${sesiones.length})`, 20, yPos);
    yPos += 7;
    
    if (sesiones.length > 0) {
      sesiones.slice(0, 10).forEach((s, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bolditalic');
        doc.text(`Sesión ${index + 1}: ${s.fechaAtencion || 'Fecha no especificada'}`, 25, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        const notas = s.notas ? s.notas.substring(0, 100) : 'Sin notas';
        doc.text(notas + (s.notas?.length > 100 ? '...' : ''), 30, yPos);
        yPos += 5;
      });
      
      if (sesiones.length > 10) {
        doc.text(`... y ${sesiones.length - 10} sesiones más`, 25, yPos);
        yPos += 7;
      }
    } else {
      doc.text('No hay sesiones registradas', 25, yPos);
      yPos += 7;
    }
    
    yPos += 5;
    
    // informes
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(`informes (${informes.length})`, 20, yPos);
    yPos += 7;
    
    if (informes.length > 0) {
      informes.forEach((inf, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bolditalic');
        doc.text(`${inf.tipo === 'psicodiagnostico' ? 'Psicodiagnóstico' : 'Cierre'} ${index + 1}:`, 25, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        doc.text(`Creado: ${new Date(inf.fechaCreacion).toLocaleDateString()}`, 30, yPos);
        yPos += 5;
      });
    } else {
      doc.text('No hay informes generados', 25, yPos);
    }
    
    const pdfBlob = doc.output('blob');
    return URL.createObjectURL(pdfBlob);
  } catch (error) {
    console.error('Error generando resumen del paciente:', error);
    return simuladorPDF(patient, 'resumen');
  }
}

// Exportar funciones al objeto window para uso global
if (typeof window !== 'undefined') {
  window.generarPDF = generarPDF;
  window.exportarFichaCompletaPaciente = exportarFichaCompletaPaciente;
  window.generarNotaSesionPDF = generarNotaSesionPDF;
  window.generarFichaIngresoPDF = generarFichaIngresoPDF;
  window.generarResumenPacientePDF = generarResumenPacientePDF;
}

console.log('✅ pdfGenerator.js cargado correctamente con generación de resúmenes de pacientes (sin boxes)');