// SCRIPT DE BACKUP COMPLETO
(async function backupTotal() {
    console.log('💾 INICIANDO BACKUP COMPLETO...');
    const dbRef = firebase.database();
    
    const nodos = ['patients', 'staff', 'appointments', 'pendingRequests', 
                   'messages', 'fichasIngreso', 'sesiones', 'informes', 
                   'specialties', 'textosEditables', 'contactInfo', 
                   'instagramData', 'logoImage', 'backgroundImage', 
                   'heroTexts', 'aboutTexts', 'atencionTexts', 
                   'paymentMethods', 'consentimientos'];
    
    const backup = {};
    
    for (const nodo of nodos) {
        const snap = await dbRef.ref(nodo).once('value');
        backup[nodo] = snap.val();
        console.log(`✅ ${nodo}: ${backup[nodo] ? Object.keys(backup[nodo]).length : 0} elementos`);
    }
    
    // Descargar archivo
    const dataStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_vinculo_${new Date().toISOString().slice(0,19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('✅ BACKUP COMPLETADO Y DESCARGADO');
})();