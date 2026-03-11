// js/config/firebase.js
// Inicializar Firebase y exportar la base de datos

// Verificar que Firebase esté cargado desde los scripts globales
if (typeof firebase === 'undefined') {
    console.error('❌ Firebase SDK no está cargado. Verifica los scripts en index.html');
    console.error('   Asegúrate de incluir:');
    console.error('   <script src="https://www.gstatic.com/firebasejs/9.17.1/firebase-app-compat.js"></script>');
    console.error('   <script src="https://www.gstatic.com/firebasejs/9.17.1/firebase-database-compat.js"></script>');
    console.error('   <script src="https://www.gstatic.com/firebasejs/9.17.1/firebase-auth-compat.js"></script>');
    throw new Error('Firebase SDK no cargado');
}

const firebaseConfig = {
    apiKey: "AIzaSyCj5jdc_FQ1H0l78VJj3qBmGYsGrSete3U",
    authDomain: "vinculosaludapp.firebaseapp.com",
    databaseURL: "https://vinculosaludapp-default-rtdb.firebaseio.com",
    projectId: "vinculosaludapp",
    storageBucket: "vinculosaludapp.firebasestorage.app",
    appId: "1:405876668483:web:8f19aef4dd63a70ecdbcf6"
};

console.log('🔥 Inicializando Firebase con config:', {
    ...firebaseConfig,
    apiKey: firebaseConfig.apiKey.substring(0, 10) + '...' // Ocultar parcialmente por seguridad
});

// Inicializar Firebase (solo si no está ya inicializado)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase App inicializada correctamente');
} else {
    console.log('⚠️ Firebase ya estaba inicializado, usando instancia existente');
}

// Obtener referencias
const db = firebase.database();
const auth = firebase.auth();

console.log('📊 Database reference obtenida:', !!db);
console.log('🔐 Auth reference obtenida:', !!auth);

// Verificar conexión a Firebase
if (db) {
    console.log('   - Database URL:', firebaseConfig.databaseURL);
    
    // Prueba de conexión silenciosa (opcional)
    db.ref('.info/connected').on('value', (snapshot) => {
        const connected = snapshot.val();
        if (connected === true) {
            console.log('✅ Firebase Realtime Database conectada exitosamente');
        } else if (connected === false) {
            console.warn('⚠️ Firebase Realtime Database desconectada');
        }
    });
}

// EXPORTAR para usar en módulos (ES6)
export { db, auth };

// Hacer disponible globalmente para scripts inline (importante para window.db)
if (typeof window !== 'undefined') {
    window.db = db;
    window.auth = auth;
    window.firebase = firebase;
    console.log('✅ Firebase expuesto globalmente en window');
    console.log('   - window.db:', !!window.db);
    console.log('   - window.auth:', !!window.auth);
    
    // Función de utilidad para verificar permisos manualmente
    window.verificarFirebase = function() {
        console.log('🔍 Verificando estado de Firebase...');
        console.log('   - firebase inicializado:', firebase.apps.length > 0);
        console.log('   - db disponible:', !!db);
        console.log('   - auth disponible:', !!auth);
        
        // Probar escritura
        const testRef = db.ref('_test_connection');
        testRef.set({ 
            timestamp: Date.now(), 
            test: 'conexión exitosa' 
        })
        .then(() => {
            console.log('✅ Firebase: escritura exitosa');
            testRef.remove();
            console.log('✅ Firebase: eliminación exitosa');
        })
        .catch(error => {
            console.error('❌ Firebase: error de escritura', error);
        });
        
        return { db: !!db, auth: !!auth };
    };
}

// Pequeña prueba para verificar que funciona
setTimeout(() => {
    if (window.db) {
        console.log('✅ window.db está funcionando correctamente');
        console.log('   - Puedes probar con: window.verificarFirebase()');
    } else {
        console.error('❌ window.db sigue siendo undefined después de 100ms');
    }
}, 100);

console.log('✅ firebase.js cargado completamente');