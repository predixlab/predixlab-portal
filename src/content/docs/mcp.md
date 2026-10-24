---
lang: en
title: "Connect an AI agent to PredixLab with MCP"
shortTitle: "MCP integration"
description: "Connect an MCP-capable agent to PredixLab's read-only daily data. Create a key, configure the connection, and check tools, dates and plan access."
summary: "Connect an AI agent with a dedicated MCP key, explore the 18 read-only tools, and understand data dates and plan access."
h1: "Connect an AI agent to PredixLab with MCP"
date: "2026-10-24"
updated: "2026-10-24"
order: "4"
translationKey: mcp
---

# Connect an AI agent to PredixLab with MCP

PredixLab's MCP server lets an AI agent query daily stock signals, market summaries, screeners and options analysis. MCP is a standard way for agents to use outside tools. The connection is read-only: it cannot place trades or change your account.

The endpoint is `https://api.predixlab.com/mcp/`, using **Streamable HTTP MCP**. Every request needs an `Authorization: Bearer YOUR_API_KEY` header with a dedicated PredixLab MCP API key. Its only scope is `mcp:read`. Website login sessions and website access tokens are not accepted by MCP, and MCP keys cannot call the ordinary REST API.

## Which agents can connect

Use Grok Bot, or any agent or client that can add a custom remote HTTP MCP server with a custom Bearer header.

**OAuth is not supported for MCP.** There is no MCP OAuth discovery or dynamic client registration. Clients that require OAuth cannot connect yet, even if they support other MCP servers.

## Set up the connection

1. Sign in to the [PredixLab dashboard](https://dashboard.predixlab.com/profile), open **Profile**, and find **Agent connections**.
2. Choose **Create key**. In **Create MCP API key**, enter a **Key name**, choose **Expires after**, and select **Create key**.
3. In **Save your new key**, copy the **One-time API key** into your client's secure secret storage. The secret is shown only once after creation or rotation; it cannot be retrieved later.
4. Add a custom HTTP MCP server at `https://api.predixlab.com/mcp/`. Set its `Authorization` header to `Bearer` followed by a space and your full key.
5. Reconnect the client or start a new conversation. Ask it to call `list_signal_dates`, `list_option_activity_dates` or `list_screener_presets` to discover available sessions or preset IDs.

This generic configuration uses `mcpServers`. Adapt the outer structure to your client's documented format and preserve unrelated entries. Replace `YOUR_API_KEY` with your key through the client's supported secure credential input; do not send the placeholder literally.

```json
{
  "mcpServers": {
    "predixlab": {
      "type": "http",
      "url": "https://api.predixlab.com/mcp/",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

The dashboard also provides an **Agent configuration example**. Whatever format you use, confirm that the client sends the complete Bearer header with every request.

## Available tools

All 18 tools are read-only. Start with `list_signal_dates`, `list_option_activity_dates` or `list_screener_presets` rather than guessing dates or preset IDs. Optional `date` arguments use `YYYY-MM-DD`; omitting one selects the latest session visible to your account for that tool and symbol, where applicable.

| Tool | What it returns |
| --- | --- |
| `list_signal_dates` | Published signal sessions visible to your account, newest first. |
| `get_signals` | The combined Pivot and AlphaRank signal board for a session. |
| `get_pivot_signals` | Pivot signals for a session, optionally filtered by direction and event. |
| `get_alpharank_signals` | The AlphaRank top-15 rankings for a session. |
| `get_alpharank_history` | Visible AlphaRank publications for one symbol, oldest first. |
| `get_market_snapshot` | The complete latest daily market snapshot. |
| `get_market_overview` | Daily market breadth, sentiment and leading movers in one overview. |
| `get_market_movers` | Daily rankings for gainers, losers, activity, unusual volume, gaps or 52-week extremes. |
| `get_quotes` | Latest-session quotes for up to 50 symbols. |
| `get_technical_analysis` | A symbol's trend, momentum, key levels and technical interpretation. |
| `run_screener` | Daily snapshot matches for custom filters, sorting and pagination supplied under `request`. |
| `list_screener_presets` | Built-in screener preset IDs and their criteria. |
| `run_screener_preset` | Matches for a built-in screener preset in a chosen index universe, without saving a strategy. |
| `list_option_activity_dates` | Unusual-options activity sessions visible to your account. |
| `get_unusual_options` | Unusual options activity grouped by symbol for a session, with up to 20 symbol groups. |
| `get_option_activity` | Unusual options activity across visible sessions with symbol-level pagination. |
| `get_gamma_exposure` | Gamma exposure analysis for a symbol and session. |
| `get_options_structure` | The latest visible implied-volatility and positioning structure for a symbol. |

The client's `tools/list` response provides parameter and output schemas. Tools that need a symbol take the stock identifier you want to research; use `SYMBOL` as a placeholder when drafting a request.

## Coverage and data dates

PredixLab tracks S&P 500 and Nasdaq-100 constituents. Some tools may cover a different set; check what each result includes. Daily end-of-day data is published once per trading day after the US close. Quotes and snapshots are daily observations, **not live prices**.

Market results are tied to a data date. Ask the agent to include that date in every answer based on those results, and check it before comparing figures. Different tools may return different sessions. Non-trading days do not produce a new session. See [how PredixLab works](/docs/how-it-works/) for coverage, the update schedule and the methods behind the signals.

## Free and Premium access

MCP uses the same account entitlements as the REST API. A key does not bypass your plan.

- **Free:** the 10-day delay applies to signal sessions, Pivot signals, AlphaRank rankings and publication history, unusual options activity, gamma exposure, and options structure. Their date-discovery tools also respect this delay. Accessible sessions are dated on or before the date 10 calendar days ago, not 10 trading sessions ago. The corresponding REST API endpoints use the same delay.
- **Other MCP market tools:** market snapshots, overviews, movers, quotes, technical analysis and screening do not have this 10-day gate. They still use daily published data.
- **Premium:** access to the latest published data without the Free delay. This does not change model accuracy or remove data limitations.

See [pricing](/pricing/) for plan details and [known limitations](/docs/limitations/) before interpreting results.

## Keep your key safe

Treat the key like a password. Prefer client-managed secret storage. Never put it in URLs, shared files, source-controlled files or public chats. Do not include it in screenshots or logs.

If a key leaks, open **Profile** > **Agent connections** and choose **Revoke key** or **Rotate key**. Revocation stops access immediately. Rotation invalidates the old secret immediately and shows a new secret only once; replace the saved key in every client that used it, then reconnect.

## Developer code

The signal, backtest, API and dashboard code is open source (Apache-2.0). Market data is not included. See [Signal code](/docs/self-hosting/) for the public repositories and [MCP agent access in the API README](https://github.com/predixlab/predixlab-api#mcp-agent-access) for the developer reference.

## Important information

For research and education only, not investment advice. Agents can make mistakes; check the data date and figures before relying on an answer.
