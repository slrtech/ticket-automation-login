// Configuration for the application
window.API_DB = "https://primary-production-4558.up.railway.app/webhook";  // Replace with your actual API URL

function showAlert(options) {
  return Swal.fire({
    // position: 'center',
    heightAuto: false,
    widthAuto: true,
    customClass: {
      popup: 'custom-alert-popup',
      confirmButton: 'custom-alert-button',
      cancelButton: 'custom-alert-button'
    },
    confirmButtonColor: '#339989', // Your theme's primary green color
    ...options
  });
}

function checkOrgIdParameter() {
  const urlParams = new URLSearchParams(window.location.search);
  const org_id = urlParams.get('org_id');

  if (!org_id) {
    showAlert({
      icon: "error",
      title: "Error...",
      text: "Parâmetro org_id não encontrado na URL. Verifique com o administrador."
    });
    return null;
  }
  return org_id;
}

function checkOrgTokenIdParameter() {
  const urlParams = new URLSearchParams(window.location.search);
  const org_token_id = urlParams.get('org_token_id');

  if (!org_token_id) {
    showAlert({
      icon: "error",
      title: "Error...",
      text: "Parâmetro org_token_id não encontrado na URL. Verifique com o administrador."
    });
    return null;
  }
  return org_token_id;
}

// Make org_id globally available
window.org_id = checkOrgIdParameter();
window.org_token_id = checkOrgTokenIdParameter();

async function initializeConfig(callback) {
  document.getElementById("loading").style.display = "flex";
  let requestBody = JSON.stringify({
    org_id: window.org_id,
    org_token_id: window.org_token_id
  });
  let headers = new Headers();
  headers.append("Content-Type", "application/json");

  try {
    // Fetch credentials from database
    const response = await fetch(window.API_DB + "/credentials", {
      method: "POST",
      headers: headers,
      body: requestBody
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar credenciais.");
    }

    const data = await response.json();
    document.getElementById("loading").style.display = "none";

    if (data.error === 401) {
      document.getElementById("login").disabled = true;
      showAlert({
        title: "Erro de Validação",
        text: data.status,
        icon: "error"
      });
      return;
    }

    // ✅ Set global variables
    window.API_URL = data.urlAPI;
    window.API_TOKEN = data.token;

    // ✅ Dispatch an event so script.js knows the config is ready
    document.dispatchEvent(new Event("configLoaded"));

    // ✅ Call the provided callback function (if exists)
    if (callback) callback();

  } catch (error) {
    console.error('Failed to initialize configuration:', error.message || error);
    document.getElementById("login").disabled = true;
    document.getElementById("loading").style.display = "none";
    showAlert({
      title: "Erro de Conexão",
      text: "Falha ao carregar a configuração crítica. Verifique sua conexão e tente novamente.",
      icon: "error"
    });
  }
}

// Call the initialization function when the script loads
initializeConfig(() => {
  console.log("Config initialized successfully.");
});
