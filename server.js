const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.send("Karaoke backend is running");
});

app.post("/generate", upload.single("audio"), async (req, res) => {
  try {
    const lyrics = req.body.lyrics;
    if (!req.file || !lyrics) {
      return res.status(400).json({ error: "Audio and lyrics required" });
    }

    const audioPath = req.file.path;
    const outputPath = `output_${Date.now()}.mp4`;

    // VERY SIMPLE placeholder FFmpeg command (we improve later)
    const cmd = `ffmpeg -y -i "${audioPath}" "${outputPath}"`;

    exec(cmd, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "FFmpeg failed" });
      }

      res.download(outputPath, () => {
        fs.unlinkSync(audioPath);
        fs.unlinkSync(outputPath);
      });
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
