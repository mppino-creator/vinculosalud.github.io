// js/config/firebase.js
// Inicializar Firebase y exportar la base de datos

// Verificar que Firebase esté cargado desde los scripts globales
if (typeof firebase === 'undefined') {
    console.error('❌ Firebase SDK no está cargado. Verifica los scripts en index.html');
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

console.log('🔥 Inicializando Firebase con config:', firebaseConfig);

// Inicializar Firebase (solo si no está ya inicializado)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase App inicializada');
} else {
    console.log('⚠️ Firebase ya estaba inicializado');
}

// Obtener referencias
const db = firebase.database();
const auth = firebase.auth();

console.log('📊 Database reference obtenida:', !!db);
console.log('🔐 Auth reference obtenida:', !!auth);

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
}

// Pequeña prueba para verificar que funciona
setTimeout(() => {
    if (window.db) {
        console.log('✅ window.db está funcionando');
    } else {
        console.error('❌ window.db sigue siendo undefined');
    }
}, 100);