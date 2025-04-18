const { writeFile } = require("fs").promises;
const { spawn } = require("child_process");
const path = require("path");

exports.handler = async (event, context) => {
  if (event.httpMethod === "POST") {
    // Parse incoming data from the event body
    const body = JSON.parse(event.body);
    const { guideSeq, groups, replicates, files } = body;

    // Write the uploaded file(s) to the temporary file system
    const parsedData = [];
    for (const file of files) {
      const fileBuffer = Buffer.from(file.content, "base64");  // Assuming base64 encoded file content
      const filePath = path.join("/tmp", `${Date.now()}-${file.name}`);
      await writeFile(filePath, fileBuffer);
      parsedData.push({ fileName: filePath });
    }

    // Create the JSON data for R script input
    const inputJson = JSON.stringify({
      parsed_data: parsedData,
      guide_seq: guideSeq,
      groups,
      replicates
    });

    const inputJsonPath = path.join("/tmp", `input-${Date.now()}.json`);
    await writeFile(inputJsonPath, inputJson);

    // Execute the R script (you may need to deploy this elsewhere or via Docker)
    const rProcess = spawn("Rscript", ["analysis.r", inputJsonPath]);

    let output = "";
    rProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    rProcess.stderr.on("data", (data) => {
      console.error("R Error:", data.toString());
    });

    return new Promise((resolve, reject) => {
      rProcess.on("close", (code) => {
        if (code !== 0) {
          return reject({
            statusCode: 500,
            body: JSON.stringify({ error: "R script execution failed" })
          });
        }
        try {
          const result = JSON.parse(output.trim().split("\n").pop());
          resolve({
            statusCode: 200,
            body: JSON.stringify(result)
          });
        } catch (e) {
          console.error("Failed to parse R output:", e);
          reject({
            statusCode: 500,
            body: JSON.stringify({ error: "Invalid output from R" })
          });
        }
      });
    });

  } else {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }
};
