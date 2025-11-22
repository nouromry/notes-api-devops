const express = require("express");
const { v4: uuidv4 } = require("uuid");
const client = require("prom-client");

const app = express();
app.use(express.json());

// In-memory database
let notes = {};
let requestCount = 0;

// ---------------- Prometheus Metrics ----------------
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"]
});

const noteCounter = new client.Gauge({
  name: "notes_count",
  help: "Current number of notes stored in memory"
});

// ---------------- Structured Logging ----------------
function log(message, traceId) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      traceId: traceId,
      message: message
    })
  );
}

// ---------------- Tracing Middleware ----------------
app.use((req, res, next) => {
  const traceId = uuidv4();
  req.traceId = traceId;
  req.startTime = Date.now();
  requestCount++;

  log(`Incoming ${req.method} ${req.url}`, traceId);

  res.on("finish", () => {
    const duration = Date.now() - req.startTime;

    log(`Completed ${res.statusCode} in ${duration}ms`, traceId);

    // Prometheus update after request
    httpRequestCounter
      .labels(req.method, req.route ? req.route.path : req.path, res.statusCode)
      .inc();
    noteCounter.set(Object.keys(notes).length);
  });

  next();
});

// ---------------- CRUD API ----------------

app.post("/notes", (req, res) => {
  const id = uuidv4();
  const note = {
    id,
    title: req.body.title,
    content: req.body.content
  };

  notes[id] = note;
  res.status(201).json(note);
});

app.get("/notes", (req, res) => {
  res.json(Object.values(notes));
});

app.get("/notes/:id", (req, res) => {
  const note = notes[req.params.id];
  if (!note) return res.status(404).json({ error: "Not found" });
  res.json(note);
});

app.put("/notes/:id", (req, res) => {
  const note = notes[req.params.id];
  if (!note) return res.status(404).json({ error: "Not found" });

  note.title = req.body.title ?? note.title;
  note.content = req.body.content ?? note.content;

  res.json(note);
});

app.delete("/notes/:id", (req, res) => {
  const note = notes[req.params.id];
  if (!note) return res.status(404).json({ error: "Not found" });

  delete notes[req.params.id];
  res.json({ message: "Deleted" });
});

// ---------------- Basic custom metrics endpoint ----------------
app.get("/basic-metrics", (req, res) => {
  res.json({
    requestCount: requestCount,
    notesCount: Object.keys(notes).length
  });
});

// ---------------- Prometheus Metrics Endpoint ----------------
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

// ---------------- Health Check ----------------
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// ---------------- Start Server ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
