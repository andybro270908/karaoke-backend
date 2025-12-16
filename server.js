const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.options("*", cors());

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.send("Karaoke backend is running");
});

app.post("/generate", upload.single("audio"), async (req, res) => {
  console.log(">>> /generate endpoint HIT");

  try {
    const lyricsText = req.body.lyrics;
    if (!req.file || !lyricsText) {
      return res.status(400).send("Audio and lyrics required");
    }

    const audioPath = req.file.path;
    const outputPath = path.join(__dirname, `karaoke_${Date.now()}.mp4`);

    const lines = lyricsText
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    const drawtextFilters = lines.map((line, i) => {
      const safe = line
        .replace(/\\/g, "\\\\")
        .replace(/:/g, "\\:")
        .replace(/'/g, "\\'")
        .replace(/%/g, "%%");

      return (
        "drawtext=" +
        `text='${safe}':` +
        "x=(w-text_w)/2:" +
        "y=h-80:" +
        "fontsize=28:" +
        "fontcolor=white:" +
        "box=1:" +
        "boxcolor=black@0.6:" +
        `enable='between(t,${i},${i + 1})'`
      );
    }).join(",");

    const cmd = `ffmpeg -y -f lavfi -i color=c=black:s=640x480 -i "${audioPath}" -vf "${drawtextFilters}" -shortest "${outputPath}"`;

    console.log("Running FFmpeg:", cmd);

    exec(cmd, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("FFmpeg failed");
      }

      res.sendFile(outputPath, () => {
        fs.unlinkSync(audioPath);
        fs.unlinkSync(outputPath);
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
