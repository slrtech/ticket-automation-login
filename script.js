let API_TOKEN;
let API_URL;
let API_DB = window.API_DB || "";

// ✅ Listen for the "configLoaded" event before accessing API_TOKEN
document.addEventListener("configLoaded", function () {
    API_TOKEN = window.API_TOKEN || "";
    API_URL = window.API_URL || "";

    console.log("API Config Loaded:");
    console.log("API_TOKEN:", API_TOKEN);
    console.log("API_URL:", API_URL);

    if (!API_TOKEN || !API_URL) {
        console.error("API_TOKEN or API_URL is missing. Check config.js.");
    }
});

// You can now safely use API_URL and API_TOKEN in functions called after initialization
function loginAndActivate(loading = true) {
    // loader geral (se usado)
    const globalLoader = document.getElementById("loading");
    if (globalLoader) {
        globalLoader.style.display = loading ? "flex" : "none";
    }

    // container de roles
    const rolesList = document.getElementById("rolesList");
    // 1) mostra o spinner dentro de rolesList
    if (rolesList) {
        rolesList.innerHTML = `<div class="spinner"></div>`;
    }

    const email    = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Message-Distribution-Token", API_TOKEN);
    headers.append("org_id", window.org_id);
    headers.append("org_token_id", window.org_token_id);

    const requestBody = JSON.stringify({
        email,
        password,
        urlApi: `https://${API_URL}/api/v1/`
    });

    fetch(API_DB + "/getUser3", {
        method:  "POST",
        headers: headers,
        body:    requestBody,
        redirect:"follow"
    })
    .then(res => {
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        return res.json();
    })
    .then(data => {
        loggedInUser = data;
        if (!data.user || !data.automations) {
            throw new Error("Formato de resposta inesperado");
        }

        const userRoles   = data.user.roles;
        const automations = data.automations.data[0].automations;

        // displayRoles vai limpar e preencher rolesList
        displayRoles(userRoles, automations);

        // ajustes de UI pós-login
        document.getElementById("login")             .style.display = "none";
        document.getElementById("activationButtons") .style.display = "block";
        document.getElementById("email")             .style.display = "none";
        document.getElementById("password")          .style.display = "none";
        document.querySelector('.login-wrapper')     .classList.add('logged-in');
        document.getElementById('pageTitle')         .style.display = "none";
        if (data.user.isAdmin) {
            document.getElementById("adminDashboardButton").style.display = "block";
        }
    })
    .catch(err => {
        // em caso de erro, limpa o spinner
        if (rolesList) {
            rolesList.innerHTML = "";
        }
        console.error(err);
        showAlert({
            icon: "error",
            title: "Erro...",
            text:  "Senha incorreta ou erro no servidor."
        });
    })
    .finally(() => {
        // esconde loader geral, se houver
        if (globalLoader) {
            globalLoader.style.display = "none";
        }
    });
}



function redirectToAdminDashboard() {
    // window.location.href = `${window.location.origin}/tickets-automation/adminPage.html`;
    window.location.href = `${window.location.origin}/adminPage.html?org_id=${org_id}&org_token_id=${org_token_id}`;
}

function displayRoles(roles, automationsResponse) {
    let t = document.getElementById("rolesList");
    const selector1 = document.getElementById('selector1'); // Deactivation selector
    const selector2 = document.getElementById('selector2'); // Activation selector

    // console.log("Roles from API response:", roles);
    // console.log("automationsResponse:", automationsResponse);

    t.style.display = "block";

    // Clear selectors before adding new options
    selector1.innerHTML = '';
    selector2.innerHTML = '';

    // Extract automations from the new response structure
    const automations = automationsResponse || [];

    // console.log("automations:", automations);

    if (roles && roles.length > 0) {
        t.innerHTML = `
            <div class="roles-header">Automação está ativa para departamento(s):</div>
            <div class="roles-container">
                ${roles.map(role => `
                    <div class="role">
                        ${role.departmentName}
                    </div>
                `).join('')}
            </div>
        `;

        // Populate `selector1` with roles
        roles.forEach(role => {
            const option = document.createElement('option');
            option.value = role.roleId;
            option.textContent = role.departmentName;
            selector1.appendChild(option);
        });

        // Enable the deactivate button if there are active roles
        const deactivateBtn = document.querySelector('button[onclick="deactivateAccount()"]');
        if (deactivateBtn) {
            deactivateBtn.disabled = false;
            deactivateBtn.style.opacity = '1';
            deactivateBtn.style.cursor = 'pointer';
            deactivateBtn.removeAttribute('data-tooltip');
        }
    } else {
        t.innerHTML = `<div class="roles-empty">Nenhuma Automação ativa</div>`;

        // Add a disabled option to selector1
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "Nenhuma automação ativa";
        option.disabled = true;
        option.selected = true;
        selector1.appendChild(option);

        // Disable the deactivate button
        const deactivateBtn = document.querySelector('button[onclick="deactivateAccount()"]');
        if (deactivateBtn) {
            deactivateBtn.disabled = true;
            deactivateBtn.style.opacity = '0.5';
            deactivateBtn.style.cursor = 'not-allowed';
            deactivateBtn.setAttribute('data-tooltip', 'Nenhuma automação ativa');
        }
    }

    // Handle activation button based on automations
    const activateBtn = document.querySelector('button[onclick="activateAccount()"]');

    if (!automations || automations.length === 0) {
        if (activateBtn) {
            activateBtn.disabled = true;
            activateBtn.style.opacity = '0.5';
            activateBtn.style.cursor = 'not-allowed';
            activateBtn.setAttribute('data-tooltip', 'Nenhuma automação configurada');
        }

        // Add a disabled option to selector2
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "Nenhuma automação configurada";
        option.disabled = true;
        option.selected = true;
        selector2.appendChild(option);
    } else {
        // Enable the activate button if it was disabled
        if (activateBtn) {
            activateBtn.disabled = false;
            activateBtn.style.opacity = '1';
            activateBtn.style.cursor = 'pointer';
            activateBtn.removeAttribute('data-tooltip');
        }

        // Populate selector2 with available automations
        automations.forEach(automation => {
            const option = document.createElement('option');
            option.value = automation.settings.roleId;
            option.textContent = automation.settings.departmentName;
            option.setAttribute('data-department-id', automation.settings.departmentId);
            selector2.appendChild(option);
        });
    }
}

function activateAccount() {
    if (loggedInUser) {
        openModal("departmentModal");
    } else {
        showAlert({
            icon: "error",
            title: "Oops...",
            text: "Please log in first!"
        });
    }
}

function deactivateAccount() {
    if (loggedInUser) {
        openModal("deactivateModal");
    } else {
        showAlert({
            icon: "error",
            title: "Oops...",
            text: "Please log in first!"
        });
    }
}

let customReason = ""; // Store the custom reason temporarily

function promptCustomReason() {
    openModal("customReasonModal"); // Open custom reason modal
    document.getElementById("customReasonInput").focus(); // Autofocus
}

function submitCustomReason() {
    const input = document.getElementById("customReasonInput").value.trim();
    if (input === "") {
        showAlert({
            icon: "warning",
            text: "Por favor, insira um motivo válido.",
        });
        return;
    }
    customReason = input; // Save the reason
    closeModal("customReasonModal"); // Close modal
    confirmDeactivationWithReason(customReason);
}

function confirmDeactivation() {
    const reason = document.getElementById("reason").value;
    if (reason === "Outros") {
        promptCustomReason(); // Show Apple-style input if "Outros" selected
    } else {
        confirmDeactivationWithReason(reason);
    }
}

function confirmDeactivationWithReason(reason) {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");

    const selectorElement = document.getElementById("selector1");
    const departmentName = selectorElement.options[selectorElement.selectedIndex].text;
    const selectedRoleId = selectorElement.value;

    // Show loading spinner
    document.getElementById("loading").style.display = "flex";

    // Check if loggedInUser has the expected structure
    if (!loggedInUser || !loggedInUser.user) {
        document.getElementById("loading").style.display = "none";
        console.error("Invalid loggedInUser structure:", loggedInUser);
        showAlert({
            icon: "error",
            title: "Erro...",
            text: "Sessão inválida. Por favor, faça login novamente."
        });
        return;
    }

    const requestBody = JSON.stringify({
        user: loggedInUser.user,
        reason: reason,
        roleId: selectedRoleId,
        departmentName: departmentName
    });

    fetch(API_DB + "/deactivateUser3", {
        method: "POST",
        headers: headers,
        body: requestBody,
    })
        .then(response => response.json())
        .then(data => {
            if (data.error === 403) {
                document.getElementById("loading").style.display = "none";
                if (data.error_code === "ROLE_ARRAY_LENGHT_ONE") {
                    showAlert({
                        title: "Usuário possui apenas um cargo",
                        text: data.status,
                        icon: "info"
                    });
                } else {
                    showAlert({
                        title: "Erro de Validação",
                        text: data.status,
                        icon: "error"
                    });
                }

                return; // Prevent further execution
            };
            if (data.error === 404) {
                document.getElementById("loading").style.display = "none";
                if (data.error_code === "ROLE_NOT_FOUND") {
                    showAlert({
                        title: "Cargo não encontrado",
                        text: data.status,
                        icon: "warning"
                    });
                } else {
                    showAlert({
                        title: "Erro de Validação",
                        text: data.status,
                        icon: "error"
                    });
                }

                return; // Prevent further execution
            };
            if (data.error === 400) {
                document.getElementById("loading").style.display = "none";
                if (data.error_code === "AUTOMATION_ALREADY_DEACTIVATED") {
                    showAlert({
                        title: "Cargo já está desativado",
                        text: data.status,
                        icon: "info"
                    });
                } else {
                    showAlert({
                        title: "Erro de Validação",
                        text: data.status,
                        icon: "error"
                    });
                }

                return; // Prevent further execution
            }

            // Keep loading visible while refreshing UI
            loginAndActivate(false); // Refresh UI
            closeModal("deactivateModal");
            showAlert({
                title: "Desativação bem-sucedida!",
                text: data.status,
                icon: "success",
            });
            // Note: loading will be hidden by loginAndActivate when it completes
        })
        .catch(error => {
            document.getElementById("loading").style.display = "none";
            console.error("Erro:", error.message);
            showAlert({
                icon: "error",
                title: "Erro...",
                text: "Erro ao desativar. Por favor, tente novamente.",
            });
        });
}

function confirmActivation() {
    let e = new Headers();
    e.append("Content-Type", "application/json");

    const selectorElement = document.getElementById("selector2");
    const selectedIndex = selectorElement.selectedIndex;
    const roleId = selectorElement.value; // This is now the roleId from settings
    const departmentId = selectorElement.options[selectedIndex].getAttribute('data-department-id'); // Retrieve departmentId
    const departmentName = selectorElement.options[selectedIndex].textContent;

    // Show loading spinner
    document.getElementById("loading").style.display = "flex";

    // Check if loggedInUser has the expected structure
    if (!loggedInUser || !loggedInUser.user) {
        document.getElementById("loading").style.display = "none";
        console.error("Invalid loggedInUser structure:", loggedInUser);
        showAlert({
            icon: "error",
            title: "Erro...",
            text: "Sessão inválida. Por favor, faça login novamente."
        });
        return;
    }

    let t = JSON.stringify({
        user: loggedInUser.user,
        roleId: roleId,
        departmentName: departmentName,
        departmentId: departmentId
    });

    fetch(API_DB + "/activateUser3", {
        method: "POST",
        headers: e,
        body: t,
        redirect: "follow"
    })
        .then(response => response.json())
        .then(data => {
            if (data.error === 403) {
                document.getElementById("loading").style.display = "none";
                if (data.error_code === "USER_MISSING_DEPARTMENT") {
                    showAlert({
                        title: "Departamento não configurado",
                        text: data.status,
                        icon: "warning"
                    });
                } else {
                    showAlert({
                        title: "Erro de Validação",
                        text: data.status,
                        icon: "error"
                    });
                }

                return; // Prevent further execution
            };
            if (data.error === 404) {
                document.getElementById("loading").style.display = "none";
                if (data.error_code === "ROLE_NOT_FOUND") {
                    showAlert({
                        title: "Cargo não encontrado",
                        text: data.status,
                        icon: "warning"
                    });
                } else {
                    showAlert({
                        title: "Erro de Validação",
                        text: data.status,
                        icon: "error"
                    });
                }

                return; // Prevent further execution
            };
            if (data.error === 400) {
                document.getElementById("loading").style.display = "none";
                if (data.error_code === "AUTOMATION_ALREADY_ACTIVE") {
                    showAlert({
                        title: "Cargo já está ativo",
                        text: data.status,
                        icon: "info"
                    });
                } else {
                    showAlert({
                        title: "Erro de Validação",
                        text: data.status,
                        icon: "error"
                    });
                }

                return; // Prevent further execution
            }

            // Keep loading visible while refreshing UI
            loginAndActivate(false); // Refresh UI
            closeModal("departmentModal");
            showAlert({
                title: "Ativação bem-sucedida!",
                text: data.status,
                icon: "success"
            });
            // Note: loading will be hidden by loginAndActivate when it completes
        })
        .catch(error => {
            console.error("Error:", error.message);
            document.getElementById("loading").style.display = "none";
            showAlert({
                icon: "error",
                title: "Error...",
                text: "Unable to activate account. Please try again."
            });
        });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove("hidden");
    modal.classList.add("active");
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove("active");
    modal.classList.add("hidden");
}

document.addEventListener("click", function (e) {
    const deactivateModal = document.getElementById("deactivateModal");
    const departmentModal = document.getElementById("departmentModal");
    if (e.target.classList.contains("modal")) {
        closeModal(deactivateModal.id);
        closeModal(departmentModal.id);
    }
});

function processAutomations(data) {
    const departmentArray = []; // Use an array to store all departments

    data.forEach((automation) => {
        const { departmentName, departmentId, roleId } = automation.settings;

        // Add every department without checking for duplicates
        departmentArray.push([roleId, departmentName, departmentId]);
    });

    populateSelectors(departmentArray); // Populate selectors with all departments
}

function populateSelectors(departmentArray) {
    const selector2 = document.getElementById('selector2'); // Activation selector

    // Clear existing options
    selector2.innerHTML = '';

    departmentArray.forEach(([roleId, departmentName, departmentId]) => {
        const option2 = document.createElement('option');
        option2.value = roleId;  // Use roleId as the value for activation
        option2.textContent = departmentName; // Keep departmentName as the visible text
        option2.setAttribute('data-department-id', departmentId); // Store departmentId as a custom attribute
        selector2.appendChild(option2);
    });

    // Optionally store the map for activation lookups
    const roleToDepartmentMap = new Map(departmentArray.map(([roleId, departmentName, departmentId]) => [roleId, departmentName, departmentId]));
    window.roleToDepartmentMap = roleToDepartmentMap;
}

function showAlert(options) {
    return Swal.fire({
        position: 'center',
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

const loadingElement = document.getElementById("loading");
loadingElement.style.display = "none";
const loadingElementWorkflows = document.getElementById("loading_workflows");
loadingElementWorkflows.style.display = "none";