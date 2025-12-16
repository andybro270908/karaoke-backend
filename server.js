const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.send("Karaoke backend is running");
});

function escapeText(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/%/g, "%%");
}

app.post("/generate", upload.single("audio"), async (req, res) => {
  console.log(">>> /generate endpoint HIT");
  try {
    const lyricsText = req.body.lyrics;
    if (!req.file || !lyricsText) {
      return res.status(400).json({ error: "Audio and lyrics required" });
    }

    const audioPath = req.file.path;
    const outputPath = path.join(__dirname, `karaoke_${Date.now()}.mp4`);

    // Prepare lyrics (one line per second - simple)
    const lines = lyricsText
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    const drawtextFilters = lines.map((line, i) => {
      const safe = escapeText(line);
      return (
        "drawtext=" +
        `text='${safe}':` +
        "x=(w-text_w)/2:" +
        "y=h-100:" +
        "fontsize=32:" +
        "fontcolor=white:" +
        "box=1:" +
        "boxcolor=black@0.6:" +
        `enable='between(t,${i},${i + 1})'`
      );
    }).join(",");

    // Create black background + lyrics + audio
   const cmd = `ffmpeg -y -f lavfi -i color=c=black:s=640x480 -i "${audioPath}" -vf "${drawtextFilters}" -shortest "${outputPath}"`;

    console.log("Running FFmpeg:", cmd);
   
    console.log(">>> /generate endpoint HIT - sending test response");

// TEMPORARY TEST RESPONSE
res.json({
  success: true,
  message: "Backend received audio and lyrics successfully"
});

// Cleanup uploaded file
fs.unlinkSync(audioPath);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
