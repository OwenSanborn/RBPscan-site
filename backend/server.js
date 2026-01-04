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

    const rProcess = spawn("/usr/bin/Rscript", ["analysis.r", tempJsonPath]);

    let output = "";
    let errorOutput = "";

    rProcess.stdout.on("data", (data) => {
      console.log("📊 R Output:", data.toString());
      output += data.toString();
    });

    rProcess.stderr.on("data", (data) => {
      console.error("🐛 R Error:", data.toString());
      errorOutput += data.toString();
    });

    rProcess.on("error", (error) => {
      console.error("💀 R Process Error:", error);
      return res.status(500).json({ error: "R process failed to start: " + error.message });
    });

    rProcess.on("close", (code) => {
      console.log(`✅ R process exited with code ${code}`);
      if (code !== 0) {
        console.error("❌ R script failed with error:", errorOutput);
        return res.status(500).json({ error: "R script failed: " + errorOutput });
      }
      try {
        const result = JSON.parse(output.trim().split("\n").pop());
        res.json(result);
      } catch (e) {
        console.error("❌ Failed to parse R output:", e);
        console.error("Raw output:", output);
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
