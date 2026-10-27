// appointment-service registers itself with Consul and deregisters on shutdown.
import express from 'express';

const NAME = 'appointment-service';
const PORT = 4002;
const ADDRESS = '127.0.0.1';
const ID = `${NAME}-1`;
const CONSUL = 'http://127.0.0.1:8500';
const app = express();

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/appointments', (req, res) => res.json([{ id: 1, name: "Bouquet Styling", date: "2026-11-02", status: "confirmed" }, { id: 2, name: "Flower Workshop", date: "2026-11-04", status: "upcoming" }, { id: 3, name: "Surprise Delivery", date: "2026-11-06", status: "pending" }]));

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`${NAME} is running on http://${ADDRESS}:${PORT}`);
  register();
});

async function register() {
  try {
    const response = await fetch(`${CONSUL}/v1/agent/service/register`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ID, Name: NAME, Address: ADDRESS, Port: PORT,
        Check: { HTTP: `http://${ADDRESS}:${PORT}/health`, Interval: '5s' }
      })
    });
    if (!response.ok) throw new Error(`Consul answered ${response.status}`);
    console.log(`💕 REGISTERED in Consul as "${NAME}" (${ADDRESS}:${PORT})`);
  } catch (error) {
    console.log(`Could not register (${error.message}). Is Consul running? Retrying in 5 seconds...`);
    setTimeout(register, 5000);
  }
}

async function deregister() {
  try {
    await fetch(`${CONSUL}/v1/agent/service/deregister/${ID}`, { method: 'PUT' });
    console.log(`🌸 DEREGISTERED "${NAME}" from Consul`);
  } catch (error) { console.log(`Could not deregister: ${error.message}`); }
  server.close(); process.exit(0);
}
process.on('SIGINT', deregister);
process.on('SIGTERM', deregister);
