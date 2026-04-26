const API_URL = 'http://localhost:3000/api/shorten';
const API_KEY = 'test_key_123'; // Set this in your .env as API_KEY

async function testShorten() {
  console.log('Testing YOURLS Node API with API Key...');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        url: 'https://google.com',
        title: 'Google Test'
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fetch Error:', error);
  }
}

testShorten();
