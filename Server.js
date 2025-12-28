import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import crypto from "crypto";

const app = express();
app.use(cors());
app.use(express.json());

// -------------------------------
// 0. SIMPLE TOKEN STORE
// -------------------------------
const VALID_TOKENS = new Set();

// -------------------------------
// 1. CONNECT TO MONGODB
// -------------------------------
const MONGO_URI = process.env.MONGO_URI;

let submissions;
let emailsCollection;
let analyticsCollection;

async function connectDB() {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();

    const db = client.db("Inclusio_Survey");
    submissions = db.collection("Survey_enteries");
    emailsCollection = db.collection("emails");
    analyticsCollection = db.collection("analytics");

    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
}

connectDB();

// -------------------------------
// 2. AUTH ROUTES
// -------------------------------
app.post("/login", (req, res) => {
  const { password } = req.body;

  if (password !== process.env.SITE_PASSWORD) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const token = crypto.randomUUID();
  VALID_TOKENS.add(token);

  res.json({ token });
});

app.post("/verify", (req, res) => {
  const { token } = req.body;

  if (VALID_TOKENS.has(token)) {
    return res.json({ valid: true });
  }

  res.status(401).json({ valid: false });
});

// -------------------------------
// 3. AUTH MIDDLEWARE
// -------------------------------
function requireAuth(req, res, next) {
  const token = req.headers.authorization;

  if (!token || !VALID_TOKENS.has(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

// -------------------------------
// 4. API — GET ALL SUBMISSIONS (PROTECTED)
// -------------------------------
app.get("/api/submissions", requireAuth, async (req, res) => {
  try {
    if (!submissions) {
      return res.status(500).json({ error: "DB not connected yet" });
    }

    const data = await submissions.find({}).toArray();
    res.json(data);
  } catch (err) {
    console.error("Error fetching submissions:", err);
    res.status(500).json({ error: "Server error fetching submissions" });
  }
});

// -------------------------------
// 5. API — GET ALL EMAILS (PROTECTED)
// -------------------------------
app.get("/api/emails", requireAuth, async (req, res) => {
  try {
    if (!emailsCollection) {
      return res.status(500).json({ error: "DB not connected yet" });
    }

    const data = await emailsCollection.find({}).toArray();
    res.json(data);
  } catch (err) {
    console.error("Error fetching emails:", err);
    res.status(500).json({ error: "Server error fetching emails" });
  }
});

// -------------------------------
// 6. API — GET ANALYTICS (PROTECTED)
// -------------------------------
app.get("/api/analytics", requireAuth, async (req, res) => {
  try {
    if (!analyticsCollection) {
      return res.status(500).json({ error: "DB not connected yet" });
    }

    const data = await analyticsCollection
      .find({})
      .sort({ date: 1 })
      .toArray();

    res.json(data);
  } catch (err) {
    console.error("Error fetching analytics:", err);
    res.status(500).json({ error: "Server error fetching analytics" });
  }
});

// -------------------------------
// 7. START SERVER
// -------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log("Server running on port", PORT)
);
