import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
app.use(cors());
app.use(express.json());

// -------------------------------
// 1. CONNECT TO MONGODB
// -------------------------------
const MONGO_URI =
  "mongodb+srv://rafiqmohamed025_db_user:1924CY@cluster0.kxikrnk.mongodb.net/?retryWrites=true&w=majority";

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
    analyticsCollection = db.collection("analytics"); // analytics collection

    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
}

connectDB();

// -------------------------------
// 2. API — GET ALL SUBMISSIONS
// -------------------------------
app.get("/api/submissions", async (req, res) => {
  try {
    if (!submissions) return res.status(500).json({ error: "DB not connected yet" });
    const data = await submissions.find({}).toArray();
    res.json(data);
  } catch (err) {
    console.error("Error fetching submissions:", err);
    res.status(500).json({ error: "Server error fetching submissions" });
  }
});

// -------------------------------
// 3. API — GET ALL EMAILS
// -------------------------------
app.get("/api/emails", async (req, res) => {
  try {
    if (!emailsCollection) return res.status(500).json({ error: "DB not connected yet" });
    const data = await emailsCollection.find({}).toArray();
    res.json(data);
  } catch (err) {
    console.error("Error fetching emails:", err);
    res.status(500).json({ error: "Server error fetching emails" });
  }
});

// -------------------------------
// 4. API — GET ANALYTICS
// -------------------------------
app.get("/api/analytics", async (req, res) => {
  try {
    if (!analyticsCollection) return res.status(500).json({ error: "DB not connected yet" });
    const data = await analyticsCollection.find({}).sort({ date: 1 }).toArray();
    res.json(data);
  } catch (err) {
    console.error("Error fetching analytics:", err);
    res.status(500).json({ error: "Server error fetching analytics" });
  }
});

// -------------------------------
// 5. START SERVER
// -------------------------------
const PORT = 5000;
app.listen(PORT, () => console.log("Server running on port", PORT));
