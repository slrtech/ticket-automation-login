// Info tooltips content
const tooltips = {
  'url-info': 'A URL da plataforma é o endereço base da sua API. Exemplo: https://sua-plataforma.com',
  'token-info': 'O token é uma chave de autenticação única fornecida pela plataforma. Você pode encontrá-lo nas configurações da sua conta.'
};

const API_DB = 'http://137.131.142.36:5678/webhook/';

// Function to extract domain from URL
function extractDomain(url) {
  try {
    // Remove protocol (http:// or https://)
    let domain = url.replace(/^https?:\/\//, '');

    // Remove any path after domain
    domain = domain.split('/')[0];

    // Remove any port number if present
    domain = domain.split(':')[0];

    return domain;
  } catch (error) {
    console.error('Error extracting domain:', error);
    return url; // Return original URL if extraction fails
  }
}

// Add tooltips to info buttons
document.addEventListener('DOMContentLoaded', function () {
  const infoButtons = document.querySelectorAll('.info-button');

  infoButtons.forEach(button => {
    const infoType = button.getAttribute('data-info');
    const tooltip = document.createElement('div');
    tooltip.className = 'info-balloon';
    tooltip.textContent = tooltips[infoType];
    button.appendChild(tooltip);
  });
});

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
    confirmButtonColor: '#339989',
    ...options
  });
}

async function handleSubmit() {
  const apiUrl = document.getElementById('apiUrl').value.trim();
  const token = document.getElementById('token').value.trim();

  if (!apiUrl || !token) {
    showAlert({
      icon: "error",
      title: "Erro...",
      text: "Por favor, preencha todos os campos."
    });
    return;
  }

  // Extract domain from URL
  const domain = extractDomain(apiUrl);

  // Show loading overlay
  document.getElementById('loading').style.display = 'flex';

  try {
    const response = await fetch(API_DB + 'organizations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiUrl: domain,
        token
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao criar organização');
    }

    showAlert({
      icon: "success",
      title: "Sucesso!",
      text: "Organização criada com sucesso."
    });

    // Clear form
    document.getElementById('apiForm').reset();

  } catch (error) {
    console.error('Error:', error);
    showAlert({
      icon: "error",
      title: "Erro...",
      text: error.message || "Ocorreu um erro ao criar a organização."
    });
  } finally {
    // Hide loading overlay
    document.getElementById('loading').style.display = 'none';
  }
}
