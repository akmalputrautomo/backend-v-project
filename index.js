import express from "express";
import cors from "cors";
import requestRoute from "./routes/request.js";
import commentRoute from "./routes/komentar.js";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/request", requestRoute);
app.use("/comment", commentRoute);

app.get("/", (req, res) => {
  res.send("V-Project Band API Ready 🚀");
});

// 🔥 INI YANG PENTING
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
