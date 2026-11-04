/* Firebase web configuration for Nutrigenomics Health Coach.
   This is client-side configuration, not a service-account credential.
   Restrict the API key to the required APIs and approved web origins in Google Cloud. */
(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyBsd8z8q-EKqItp8wo_K4Cbe7qudwX09fU",
    authDomain: "nutrigenomics-health-coach.firebaseapp.com",
    projectId: "nutrigenomics-health-coach",
    storageBucket: "nutrigenomics-health-coach.firebasestorage.app",
    messagingSenderId: "411756806887",
    appId: "1:411756806887:web:3a0f69929bdd4bb97d1842",
    measurementId: "G-NWGPDYNYEY"
  };
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  // Firestore queues writes locally while offline. Multi-tab persistence may
  // be unavailable in some browsers; the app still keeps its own local backup.
  firebase.firestore().enablePersistence({ synchronizeTabs: true }).catch(function (err) {
    console.info("Firestore persistence fallback:", err.code || err.message);
  });
})();