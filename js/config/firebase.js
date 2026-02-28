// js/config/firebase.js
// Inicializar Firebase y exportar la base de datos

const firebaseConfig = {
    apiKey: "AIzaSyCj5jdc_FQ1H0l78VJj3qBmGYsGrSete3U",
    authDomain: "vinculosaludapp.firebaseapp.com",
    databaseURL: "https://vinculosaludapp-default-rtdb.firebaseio.com",
    projectId: "vinculosaludapp",
    storageBucket: "vinculosaludapp.firebasestorage.app",
    appId: "1:405876668483:web:8f19aef4dd63a70ecdbcf6"
};

// Inicializar Firebase (esto crea la app por defecto)
firebase.initializeApp(firebaseConfig);

// Exportar la referencia a la base de datos
const db = firebase.database();
export { db };