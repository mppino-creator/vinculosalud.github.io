import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCj5jdc_FQ1H0l78VJj3qBmGYsGrSete3U",
    authDomain: "vinculosaludapp.firebaseapp.com",
    databaseURL: "https://vinculosaludapp-default-rtdb.firebaseio.com",
    projectId: "vinculosaludapp",
    storageBucket: "vinculosaludapp.firebasestorage.app",
    appId: "1:405876668483:web:8f19aef4dd63a70ecdbcf6"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };