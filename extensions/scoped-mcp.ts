import { existsSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, sep } from "node:path";
import { getAgentDir, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

// Path-scoped MCP servers.
//
// Reads <agent dir>/scoped-mcp.json, which has the same shape as mcp.json
// plus a `paths` list per server. A server is registered only when the
// session's working directory is one of `paths` or inside one of them.
// Entries without `paths` load everywhere. `~/` expands to the home directory.
//
//   { "mcpServers": { "granola": { "url": "https://mcp.granola.ai/mcp", "paths": ["~/work"] } } }

type ServerConfig = Parameters<ExtensionAPI["registerMcpServer"]>[1];
type ScopedEntry = ServerConfig & { paths?: string[] };

const CONFIG_FILE = join(getAgentDir(), "scoped-mcp.json");

function canonical(path: string): string {
  const expanded = path === "~" ? homedir() : path.startsWith("~/") ? join(homedir(), path.slice(2)) : path;
  const absolute = resolve(expanded);
  try {
    return realpathSync(absolute);
  } catch {
    return absolute;
  }
}

function isWithin(dir: string, root: string): boolean {
  return dir === root || dir.startsWith(root.endsWith(sep) ? root : root + sep);
}

export default function (pi: ExtensionAPI) {
  if (!existsSync(CONFIG_FILE)) return;

  let servers: Record<string, ScopedEntry>;
  try {
    const parsed = JSON.parse(readFileSync(CONFIG_FILE, "utf8")) as { mcpServers?: Record<string, ScopedEntry> };
    servers = parsed.mcpServers ?? {};
  } catch (error) {
    console.error(`[scoped-mcp] cannot read ${CONFIG_FILE}: ${String(error)}`);
    return;
  }

  const cwd = canonical(process.cwd());
  for (const [name, { paths, ...config }] of Object.entries(servers)) {
    if (paths !== undefined && !paths.some((p) => isWithin(cwd, canonical(p)))) continue;
    try {
      pi.registerMcpServer(name, config);
    } catch (error) {
      console.error(`[scoped-mcp] cannot register "${name}": ${String(error)}`);
    }
  }
}
