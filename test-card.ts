import { extractSinglePage } from "./src/crawler.js";
import fs from "fs";

async function run() {
    const markdown = await extractSinglePage("https://www.saltdesignsystem.com/salt/components/card/usage");
    fs.writeFileSync("card-usage.md", markdown);
    console.log("Extraction complete!");
    process.exit(0);
}
run();
