function handleSubmit() {
  console.log('Form submitted'); // Debugging line

  const apiUrl = document.getElementById('apiUrl').value;
  const token = document.getElementById('token').value;
  const api_db = "https://primary-production-4558.up.railway.app/webhook-test/organizations"
  const token_db = "ZKRg35%1j%7lTnw&"

  // Prepare the data to be sent
  const data = {
    apiUrl: apiUrl,
    token: token
  };

  // Make the POST request
  fetch(api_db, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'db_token': `${token_db}` // If your API requires token in the header
    },
    body: JSON.stringify(data)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Success:', data);
      // Handle success (e.g., display a message to the user)
    })
    .catch((error) => {
      console.error('Error:', error);
      // Handle error (e.g., display an error message to the user)
    });
}
