import http from 'http';

// Function to make a request to the development server
const checkHomepage = () => {
  console.log('Checking if homepage is accessible...');
  
  http.get('http://localhost:8080', (res) => {
    let data = '';
    
    // A chunk of data has been received
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    // The whole response has been received
    res.on('end', () => {
      console.log('Status code:', res.statusCode);
      console.log('Headers:', JSON.stringify(res.headers, null, 2));
      console.log('Body length:', data.length);
      console.log('Body preview:', data.substring(0, 200) + '...');
      
      if (data.includes('<div id="root"></div>')) {
        console.log('Root div found - app should be mounting here');
      } else {
        console.log('Warning: Root div not found in expected format');
      }
    });
  }).on('error', (err) => {
    console.error('Error accessing homepage:', err.message);
  });
};

// Run the check
checkHomepage(); 