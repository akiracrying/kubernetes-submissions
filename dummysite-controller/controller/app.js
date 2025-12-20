const http = require('http');
const https = require('https');
const url = require('url');
const k8s = require('@kubernetes/client-node');

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.AppsV1Api);
const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sCustomApi = kc.makeApiClient(k8s.CustomObjectsApi);

const GROUP = 'example.com';
const VERSION = 'v1';
const PLURAL = 'dummysites';

const PORT = process.env.PORT || 3000;

// Fetch HTML from URL
function fetchHTML(urlString) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(urlString);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Create ConfigMap with HTML content
async function createConfigMap(namespace, name, htmlContent) {
  const configMap = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name: `${name}-html`,
      namespace: namespace
    },
    data: {
      'index.html': htmlContent
    }
  };

  try {
    await k8sCoreApi.createNamespacedConfigMap(namespace, configMap);
    console.log(`Created ConfigMap ${name}-html in namespace ${namespace}`);
  } catch (error) {
    if (error.body && error.body.code === 409) {
      // ConfigMap already exists, update it
      await k8sCoreApi.replaceNamespacedConfigMap(`${name}-html`, namespace, configMap);
      console.log(`Updated ConfigMap ${name}-html in namespace ${namespace}`);
    } else {
      throw error;
    }
  }
}

// Create Deployment
async function createDeployment(namespace, name, websiteUrl) {
  const deployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: name,
      namespace: namespace,
      labels: {
        app: name
      }
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: name
        }
      },
      template: {
        metadata: {
          labels: {
            app: name
          }
        },
        spec: {
          containers: [
            {
              name: 'nginx',
              image: 'nginx:alpine',
              ports: [
                {
                  containerPort: 80
                }
              ],
              volumeMounts: [
                {
                  name: 'html',
                  mountPath: '/usr/share/nginx/html'
                }
              ]
            }
          ],
          volumes: [
            {
              name: 'html',
              configMap: {
                name: `${name}-html`
              }
            }
          ]
        }
      }
    }
  };

  try {
    await k8sApi.createNamespacedDeployment(namespace, deployment);
    console.log(`Created Deployment ${name} in namespace ${namespace}`);
  } catch (error) {
    if (error.body && error.body.code === 409) {
      // Deployment already exists, update it
      await k8sApi.replaceNamespacedDeployment(name, namespace, deployment);
      console.log(`Updated Deployment ${name} in namespace ${namespace}`);
    } else {
      throw error;
    }
  }
}

// Create Service
async function createService(namespace, name) {
  const service = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: name,
      namespace: namespace,
      labels: {
        app: name
      }
    },
    spec: {
      type: 'LoadBalancer',
      ports: [
        {
          port: 80,
          targetPort: 80,
          protocol: 'TCP'
        }
      ],
      selector: {
        app: name
      }
    }
  };

  try {
    await k8sCoreApi.createNamespacedService(namespace, service);
    console.log(`Created Service ${name} in namespace ${namespace}`);
  } catch (error) {
    if (error.body && error.body.code === 409) {
      // Service already exists, update it
      await k8sCoreApi.replaceNamespacedService(name, namespace, service);
      console.log(`Updated Service ${name} in namespace ${namespace}`);
    } else {
      throw error;
    }
  }
}

// Handle DummySite resource
async function handleDummySite(dummySite) {
  const name = dummySite.metadata.name;
  const namespace = dummySite.metadata.namespace || 'default';
  const websiteUrl = dummySite.spec.website_url;

  console.log(`Processing DummySite ${name} with URL: ${websiteUrl}`);

  try {
    // Fetch HTML from URL
    console.log(`Fetching HTML from ${websiteUrl}...`);
    const htmlContent = await fetchHTML(websiteUrl);
    console.log(`Fetched ${htmlContent.length} bytes of HTML`);

    // Create ConfigMap with HTML
    await createConfigMap(namespace, name, htmlContent);

    // Create Deployment
    await createDeployment(namespace, name, websiteUrl);

    // Create Service
    await createService(namespace, name);

    console.log(`Successfully created resources for DummySite ${name}`);
  } catch (error) {
    console.error(`Error processing DummySite ${name}:`, error);
  }
}

// List all existing DummySite resources
async function listExistingDummySites() {
  try {
    const response = await k8sCustomApi.listClusterCustomObject(GROUP, VERSION, PLURAL);
    const dummysites = response.body.items || [];
    console.log(`Found ${dummysites.length} existing DummySite resources`);
    
    for (const ds of dummysites) {
      await handleDummySite(ds);
    }
  } catch (error) {
    console.error('Error listing existing DummySite resources:', error);
  }
}

// Watch for DummySite resources
async function watchDummySites() {
  console.log('Starting to watch for DummySite resources...');

  const watch = new k8s.Watch(kc);
  
  const path = `/apis/${GROUP}/${VERSION}/${PLURAL}`;
  
  watch.watch(
    path,
    {},
    (type, obj) => {
      console.log(`Received event: ${type} for DummySite ${obj.metadata.name}`);
      if (type === 'ADDED' || type === 'MODIFIED') {
        handleDummySite(obj).catch(console.error);
      }
    },
    (err) => {
      console.error('Watch error:', err);
      // Retry after 5 seconds
      setTimeout(() => {
        watchDummySites();
      }, 5000);
    }
  );
}

// Health check server
const server = http.createServer((req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Controller listening on port ${PORT}`);
  
  // Process existing resources first
  listExistingDummySites().then(() => {
    // Then start watching for new ones
    watchDummySites();
  });
});

