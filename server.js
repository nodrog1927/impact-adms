const http = require("http");

const GAS_URL = process.env.GAS_URL;
const TOKEN = "Impact2005!!";

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  console.log(new Date().toISOString(), req.method, url.pathname + url.search);

  if (req.method === "GET") {
    const sn = url.searchParams.get("SN") || "PROXTIME";
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(
      `GET OPTION FROM: ${sn}\nStamp=0\nOpStamp=0\nErrorDelay=30\nDelay=10\nTransTimes=00:00;14:05\nTransInterval=1\nTransFlag=1111000000\nTimeZone=0\nRealtime=1\nEncrypt=0\n`
    );
    return;
  }

  if (req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk.toString(); });
    req.on("end", async () => {
      const table = (url.searchParams.get("table") || "").toUpperCase();
      console.log("POST TABLE:", table, "BODY:", body);

      if (table === "ATTLOG" || body.includes("\t")) {
        const punches = [];
        body.trim().split(/\r?\n/).forEach(line => {
          const parts = line.trim().split("\t");
          if (parts.length >= 3) {
            const uid = parts.at(0).trim();
            const ts = parts.at(1).trim();
            const pCode = parts.at(2).trim();
            const status = (pCode === "0") ? "IN" : (pCode === "1") ? "OUT" : "OFFSITE";
            punches.push({ user_id: uid, timestamp: ts, status: status });
          }
        });

        if (punches.length > 0 && GAS_URL) {
          try {
            const gRes = await fetch(GAS_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: TOKEN, punches: punches })
            });
            console.log("GAS REPLY:", await gRes.text());
          } catch (err) {
            console.error("GAS ERR:", err);
          }
        }
      }

      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("OK\n");
    });
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("OK\n");
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log("Impact ADMS Relay listening on", PORT));
