import express from "express";
import multer from "multer";
import cors from "cors";
import { spawn } from "child_process";
import { tmpdir } from "os";
import { writeFile } from "fs/promises";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3001;

// Store files in memory before saving
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

app.post("/analyze", upload.array("files"), async (req, res) => {
  try {
    const guideSeq = req.body.guide_seq || "";
    const groups = req.body.groups ? JSON.parse(req.body.groups) : ["1"];
    const replicates = req.body.replicates ? JSON.parse(req.body.replicates) : ["1"];

    const parsedData = [];

    for (const file of req.files) {
      const tempAb1Path = path.join(tmpdir(), `${Date.now()}-${file.originalname}`);
      await writeFile(tempAb1Path, file.buffer); // Save uploaded buffer to temp file

      parsedData.push({
        fileName: tempAb1Path
      });
    }

    const inputJson = JSON.stringify({
      parsed_data: parsedData,
      guide_seq: guideSeq,
      groups,
      replicates
    });

    const tempJsonPath = path.join(tmpdir(), `input-${Date.now()}.json`);
    await writeFile(tempJsonPath, inputJson);

    const rProcess = spawn("Rscript", ["analysis.r", tempJsonPath]);

    let output = "";

    rProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    rProcess.stderr.on("data", (data) => {
      console.error("🐛 R Error:", data.toString());
    });

    rProcess.on("close", (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: "R script failed." });
      }
      try {
        const result = JSON.parse(output.trim().split("\n").pop());
        res.json(result);
      } catch (e) {
        console.error("❌ Failed to parse R output:", e);
        res.status(500).json({ error: "Invalid JSON output from R." });
      }
    });
  } catch (err) {
    console.error("💥 Upload processing error:", err);
    res.status(500).json({ error: "Failed to process uploaded files." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
