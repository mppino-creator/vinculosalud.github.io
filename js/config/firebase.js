// js/config/firebase.js
// Usamos la versión compat para mantener la sintaxis db.ref()
import firebase from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app-compat.js";
import "https://www.gstatic.com/firebasejs/9.17.1/firebase-database-compat.js";

const firebaseConfig = {
    apiKey: "AIzaSyCj5jdc_FQ1H0l78VJj3qBmGYsGrSete3U",
    authDomain: "vinculosaludapp.firebaseapp.com",
    databaseURL: "https://vinculosaludapp-default-rtdb.firebaseio.com",
    projectId: "vinculosaludapp",
    storageBucket: "vinculosaludapp.firebasestorage.app",
    appId: "1:405876668483:web:8f19aef4dd63a70ecdbcf6"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

export { db };