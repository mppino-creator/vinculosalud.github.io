// js/config/firebase.js
// Inicializar Firebase y exportar la base de datos

// Importar Firebase desde los scripts globales (versión compat)
// Esto asume que los scripts de Firebase ya están cargados en el HTML
// <script src="https://www.gstatic.com/firebasejs/9.17.1/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.17.1/firebase-database-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.17.1/firebase-auth-compat.js"></script>

const firebaseConfig = {
    apiKey: "AIzaSyCj5jdc_FQ1H0l78VJj3qBmGYsGrSete3U",
    authDomain: "vinculosaludapp.firebaseapp.com",
    databaseURL: "https://vinculosaludapp-default-rtdb.firebaseio.com",
    projectId: "vinculosaludapp",
    storageBucket: "vinculosaludapp.firebasestorage.app",
    appId: "1:405876668483:web:8f19aef4dd63a70ecdbcf6"
};

// Verificar que Firebase esté cargado
if (typeof firebase === 'undefined') {
    console.error('❌ Firebase SDK no está cargado. Verifica los scripts en index.html');
} else {
    console.log('✅ Firebase SDK detectado');
}

// Inicializar Firebase (solo si no está ya inicializado)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('🔥 Firebase inicializado correctamente');
} else {
    console.log('⚠️ Firebase ya estaba inicializado');
}

// Obtener referencia a la base de datos
const db = firebase.database();
const auth = firebase.auth();

// Exportar para usar en módulos ES6
export { db, auth };

// Hacer disponible globalmente para scripts inline y consola
if (typeof window !== 'undefined') {
    window.db = db;
    window.auth = auth;
    window.firebase = firebase; // Opcional, útil para depuración
    console.log('✅ Firebase expuesto globalmente en window');
    console.log('📊 window.db disponible:', !!window.db);
}