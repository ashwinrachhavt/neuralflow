# Serena – MCP Server Integration

This repo includes a ready-to-use setup to run the Serena MCP server alongside your workflow and connect it to your favorite MCP-enabled clients.

Serena adds powerful symbolic tools and a small dashboard. Below are the quickest paths for Codex CLI and alternatives.

## 1) Codex CLI (recommended here)

Codex works best when Serena runs with the `codex` context.

1. Create or edit `~/.codex/config.toml` and add the MCP server entry. Example using `uvx`:

```
[mcp_servers.serena]
command = "uvx"
args = ["--from", "git+https://github.com/oraios/serena", "serena", "start-mcp-server", "--context", "codex"]
```

You can also copy `./.codex/config.serena.example.toml` to your home config and merge it.

2. Start Codex and say:

> Activate the current dir as project using serena

If you don’t activate the project, tools won’t be available.

Notes:
- Serena’s dashboard runs at http://localhost:24282/dashboard/index.html (open manually if Codex can’t auto-open due to sandboxing).
- Codex may display tool calls as “failed” even when they executed successfully (known issue). Functionality still works.

## 2) Docker (HTTP/SSE)

You can run Serena in a container and expose the dashboard and HTTP transport.

Quick start with docker compose (separate file to keep concerns isolated):

```
docker compose -f docker-compose.serena.yml up -d
```

This starts Serena at `http://localhost:24282` and mounts the project for tooling. Then, in your client, configure an MCP HTTP/SSE endpoint to `http://localhost:24282` (refer to the client’s docs).

## 3) Package scripts (optional)

Added convenience scripts:

- `pnpm serena:mcp:http` – run Serena via `uvx` in HTTP mode for browsers/UI.
- `pnpm serena:mcp:stdio` – run Serena via `uvx` in stdio mode (for clients that spawn the server).

These require `uvx` to be installed locally.

## 4) Other clients

- Claude Code: use `--context ide-assistant` when adding the server.
- Claude Desktop: add a JSON entry in settings; see Serena docs.
- IDE assistants (Cursor, Windsurf, Cline, etc.): add custom MCP server using stdio or HTTP.

## 5) Tips

- Keep Serena’s context minimal to avoid duplicating tools your client already has.
- If the port 24282 is taken, Serena will auto-increment to a free port (check logs).

