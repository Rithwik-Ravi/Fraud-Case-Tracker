import fs from "fs";
import path from "path";

/**
 * Robust helper to resolve OPENAI_API_KEY from environment or .env file.
 * Guards against placeholder strings like 'your_api_key_here' in parent shell.
 */
export function getOpenAiApiKey(): string | undefined {
  let key = process.env.OPENAI_API_KEY;

  if (!key || key.includes("your_api") || key === "your_api_key_here" || key.length < 20) {
    try {
      const envPath = path.resolve(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        const match = content.match(/OPENAI_API_KEY=([^\r\n]+)/);
        if (match && match[1].trim().startsWith("sk-")) {
          key = match[1].trim();
        }
      }
    } catch (err) {
      // Fallback silently
    }
  }

  if (key && !key.includes("your_api") && key.startsWith("sk-")) {
    return key.trim();
  }

  return undefined;
}
