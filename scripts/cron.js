import fetch from "node-fetch";

const url = "https://roundbox-media-workstation-4d638s106-daniels-projects-00dbb33a.vercel.app/api/cron/publish";

async function run() {
  try {
    const res = await fetch(url, {
      method: "GET",
    });

    const data = await res.text();
    console.log("Cron success:", data);
  } catch (err) {
    console.error("Cron failed:", err);
    process.exit(1);
  }
}

run();
