# pi-scoped-mcp

A [pi](https://pi.dev) extension that loads MCP servers only in the directories where you need them.

Servers in pi's `mcp.json` load in every session. This extension reads a second file, `scoped-mcp.json`, where each server can list `paths`. A server is registered only when the session's working directory is one of those paths or inside one of them. Servers without `paths` load everywhere.

## Install

```bash
pi install git:github.com/baggiponte/pi-scoped-mcp
```

Try it for one run without installing:

```bash
pi -e git:github.com/baggiponte/pi-scoped-mcp
```

## Configure

Create `scoped-mcp.json` in the pi agent directory (`~/.pi/agent/` by default, or `$PI_CODING_AGENT_DIR`). It has the same shape as `mcp.json`, plus an optional `paths` array per server:

```json
{
  "mcpServers": {
    "granola": {
      "url": "https://mcp.granola.ai/mcp",
      "description": "Granola meeting notes and transcripts",
      "paths": ["~/work"]
    }
  }
}
```

- `paths` entries are absolute or start with `~/`. Symlinks are resolved before comparing.
- Every other field is passed unchanged to `pi.registerMcpServer` (see pi's MCP docs for `command`, `url`, `env`, `headers`, `exposure`, and so on).
- If the file is missing, the extension does nothing. Parse errors are logged and no servers are registered.

## Notes

- Paths are checked once, at session start, against the session's working directory. Changing directory during a session does not load or unload servers.
- A server with the same name in `mcp.json` (user or project) takes precedence over the one registered here; `/mcp` lists the overridden registration.

## License

MIT
