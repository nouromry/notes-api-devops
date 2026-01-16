const request = require("supertest");
const app = require("./server"); // IMPORTANT: see note below

describe("Notes API - Unit & Integration Tests", () => {
  let createdNoteId;

  it("GET /health → should return healthy status", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("healthy");
  });

  it("POST /notes → should create a note", async () => {
    const res = await request(app)
      .post("/notes")
      .send({ title: "Test Note", content: "Test Content" });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    createdNoteId = res.body.id;
  });

  it("GET /notes → should return list of notes", async () => {
    const res = await request(app).get("/notes");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /notes/:id → should return a single note", async () => {
    const res = await request(app).get(`/notes/${createdNoteId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(createdNoteId);
  });

  it("PUT /notes/:id → should update a note", async () => {
    const res = await request(app)
      .put(`/notes/${createdNoteId}`)
      .send({ title: "Updated Title" });

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("Updated Title");
  });

  it("DELETE /notes/:id → should delete a note", async () => {
    const res = await request(app).delete(`/notes/${createdNoteId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Deleted");
  });

  it("GET /notes/:id → should return 404 for deleted note", async () => {
    const res = await request(app).get(`/notes/${createdNoteId}`);
    expect(res.statusCode).toBe(404);
  });

  it("GET /basic-metrics → should return basic metrics", async () => {
    const res = await request(app).get("/basic-metrics");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("requestCount");
    expect(res.body).toHaveProperty("notesCount");
  });

  it("GET /metrics → should expose Prometheus metrics", async () => {
    const res = await request(app).get("/metrics");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("http_requests_total");
  });
});
