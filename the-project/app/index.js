const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const CACHE_DIR = '/cache';
const IMAGE_FILE = path.join(CACHE_DIR, 'image.jpg');
const METADATA_FILE = path.join(CACHE_DIR, 'metadata.json');
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function downloadImage() {
  return new Promise((resolve, reject) => {
    const url = 'https://picsum.photos/1200';
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        https.get(response.headers.location, (redirectResponse) => {
          const fileStream = fs.createWriteStream(IMAGE_FILE);
          redirectResponse.pipe(fileStream);
          fileStream.on('finish', () => {
            const metadata = {
              timestamp: Date.now(),
              url: response.headers.location || url
            };
            fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata));
            console.log('Image downloaded and cached');
            resolve();
          });
        }).on('error', reject);
      } else {
        const fileStream = fs.createWriteStream(IMAGE_FILE);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          const metadata = {
            timestamp: Date.now(),
            url: url
          };
          fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata));
          console.log('Image downloaded and cached');
          resolve();
        });
      }
    }).on('error', reject);
  });
}

function getImage() {
  return new Promise(async (resolve) => {
    let shouldDownload = false;
    let showOld = false;

    if (fs.existsSync(METADATA_FILE) && fs.existsSync(IMAGE_FILE)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
        const age = Date.now() - metadata.timestamp;
        
        if (age > CACHE_DURATION * 2) {
          // More than 20 minutes - definitely need new image
          shouldDownload = true;
        } else if (age > CACHE_DURATION) {
          // Between 10-20 minutes - show old one more time, then download new
          showOld = true;
          shouldDownload = true;
        }
        // Less than 10 minutes - use cached image
      } catch (error) {
        console.error('Error reading metadata:', error);
        shouldDownload = true;
      }
    } else {
      shouldDownload = true;
    }

    if (showOld && fs.existsSync(IMAGE_FILE)) {
      // Show old image one more time
      resolve(fs.readFileSync(IMAGE_FILE));
    } else if (shouldDownload) {
      // Download new image
      try {
        await downloadImage();
        resolve(fs.readFileSync(IMAGE_FILE));
      } catch (error) {
        console.error('Error downloading image:', error);
        // Fallback to cached image if available
        if (fs.existsSync(IMAGE_FILE)) {
          resolve(fs.readFileSync(IMAGE_FILE));
        } else {
          resolve(null);
        }
      }
    } else {
      // Use cached image
      resolve(fs.readFileSync(IMAGE_FILE));
    }
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    const image = await getImage();
    
    if (image) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      const imageBase64 = image.toString('base64');
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>The project App</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                max-width: 1200px;
                margin: 50px auto;
                padding: 20px;
                background-color: #f5f5f5;
              }
              h1 {
                color: #333;
                text-align: center;
              }
              .container {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              img {
                width: 100%;
                height: auto;
                border-radius: 8px;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                color: #666;
                margin-top: 20px;
              }
              .todo-section {
                margin-top: 30px;
              }
              .todo-form {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
              }
              .todo-input {
                flex: 1;
                padding: 10px;
                font-size: 16px;
                border: 1px solid #ddd;
                border-radius: 4px;
              }
              .todo-input:focus {
                outline: none;
                border-color: #4CAF50;
              }
              .create-button {
                padding: 10px 20px;
                font-size: 16px;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
              }
              .create-button:hover {
                background-color: #45a049;
              }
              .todo-list {
                list-style-type: none;
                padding: 0;
                margin: 0;
              }
              .todo-item {
                padding: 10px;
                margin-bottom: 8px;
                background-color: #f9f9f9;
                border-left: 3px solid #4CAF50;
                border-radius: 4px;
              }
            </style>
            <script>
              const TODO_BACKEND_URL = '/api/todos';
              
              function validateInput(input) {
                if (input.value.length > 140) {
                  input.value = input.value.substring(0, 140);
                  alert('Todo cannot be longer than 140 characters');
                }
              }
              
              async function loadTodos() {
                try {
                  const response = await fetch(TODO_BACKEND_URL);
                  const todos = await response.json();
                  renderTodos(todos);
                } catch (error) {
                  console.error('Error loading todos:', error);
                }
              }
              
              function renderTodos(todos) {
                const todoList = document.getElementById('todo-list');
                todoList.innerHTML = '';
                todos.forEach(todo => {
                  const li = document.createElement('li');
                  li.className = 'todo-item';
                  li.textContent = todo.text;
                  todoList.appendChild(li);
                });
              }
              
              async function createTodo() {
                const input = document.querySelector('.todo-input');
                const text = input.value.trim();
                
                if (text.length === 0) {
                  alert('Todo cannot be empty');
                  return;
                }
                
                if (text.length > 140) {
                  alert('Todo cannot be longer than 140 characters');
                  return;
                }
                
                try {
                  const response = await fetch(TODO_BACKEND_URL, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ text: text })
                  });
                  
                  if (response.ok) {
                    input.value = '';
                    loadTodos();
                  } else {
                    const error = await response.json();
                    alert(error.error || 'Error creating todo');
                  }
                } catch (error) {
                  console.error('Error creating todo:', error);
                  alert('Error creating todo');
                }
              }
              
              document.addEventListener('DOMContentLoaded', function() {
                loadTodos();
                document.querySelector('.create-button').addEventListener('click', createTodo);
                document.querySelector('.todo-input').addEventListener('keypress', function(e) {
                  if (e.key === 'Enter') {
                    createTodo();
                  }
                });
              });
            </script>
          </head>
          <body>
            <div class="container">
              <h1>The project App</h1>
              <img src="data:image/jpeg;base64,${imageBase64}" alt="Random image from Lorem Picsum" />
              <div class="todo-section">
                <form class="todo-form" onsubmit="event.preventDefault();">
                  <input 
                    type="text" 
                    class="todo-input" 
                    placeholder="Enter todo (max 140 characters)" 
                    maxlength="140"
                    oninput="validateInput(this)"
                  />
                  <button type="button" class="create-button">Create todo</button>
                </form>
                <ul class="todo-list" id="todo-list">
                  <li class="todo-item">Loading todos...</li>
                </ul>
              </div>
              <div class="footer">
                <p>DevOps with Kubernetes 2025</p>
              </div>
            </div>
          </body>
        </html>
      `);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>The project App</title>
          </head>
          <body>
            <h1>Loading image...</h1>
          </body>
        </html>
      `);
    }
  } else if (req.url === '/shutdown' && req.method === 'POST') {
    // For testing purposes - shutdown the container
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Shutting down...\n');
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});

