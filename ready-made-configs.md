# Ready-Made Site Configurations | إعدادات المواقع الجاهزة

> Extracted from Multi-RTL extension v6.2.1 for transfer to the new extension.
> 
> **Total sites: 7** | **Total selectors: 26**

---

## How to Use | طريقة الاستخدام

Each configuration contains:
- **Domain**: The website domain the config applies to
- **loadDelay**: Delay (ms) before applying selectors (optional, for SPAs)
- **Selectors**: Array of CSS selectors targeting specific elements

### Selector Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `id` | string | auto | Unique identifier for the selector |
| `selector` | string | required | CSS selector string |
| `description` | string | "" | Human-readable description |
| `isEnabled` | boolean | true | Whether the selector is active |
| `autoApply` | boolean | true | Apply automatically on page load |
| `applyDirection` | boolean | true | Apply `direction: rtl` to matched elements |
| `applyTextAlign` | boolean | true | Apply `text-align` to matched elements |
| `forceRTL` | boolean | false | Force RTL even if content doesn't contain RTL characters |
| `contentSelector` | string | "" | Optional: CSS selector for inner content element |

---

## 1. Slack (`app.slack.com`)

- **loadDelay**: `8000ms`
- **Selectors**: 3

```json
{
  "app.slack.com": {
    "loadDelay": 8000,
    "masterEnabled": true,
    "selectors": [
      {
        "id": "slack_content",
        "selector": ".p-rich_text_block",
        "description": "Message content alignment",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "slack_header",
        "selector": ".c-message_kit__gutter",
        "description": "Message header alignment",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": true,
        "contentSelector": ""
      },
      {
        "id": "slack_editor",
        "selector": ".ql-editor",
        "description": "Text input box alignment",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      }
    ]
  }
}
```

---

## 2. ChatGPT (`chatgpt.com`)

- **loadDelay**: none
- **Selectors**: 3

```json
{
  "chatgpt.com": {
    "masterEnabled": true,
    "selectors": [
      {
        "id": "chatgpt_prompt",
        "selector": "[id^=\"prompt-textarea\"]",
        "description": "ChatGPT prompt textarea",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": false,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "chatgpt_katex",
        "selector": "span.katex-display",
        "description": "KaTeX display blocks",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1771317328680_cuz1xmwo5",
        "selector": "a[data-sidebar-item=\"true\"]",
        "description": "Side bar",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      }
    ]
  }
}
```

---

## 3. Claude (`claude.ai`)

- **loadDelay**: `3500ms`
- **Selectors**: 13

```json
{
  "claude.ai": {
    "loadDelay": 3500,
    "masterEnabled": true,
    "selectors": [
      {
        "id": "sel_1772280097991_76gzu1hmr",
        "selector": "div.flex.w-full.items-center.gap-2\\.5.px-2\\.5.text-left.rounded-xl.hover\\:bg-bg-100.transition-colors.py-2\\.5.bg-bg-100",
        "description": "Prompt input box in Claude Code Web",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "claude_response",
        "selector": ".font-claude-response",
        "description": "Response containers",
        "isEnabled": false,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": false,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "claude_response_body",
        "selector": ".font-claude-response-body",
        "description": "Response body",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": false,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "claude_editor",
        "selector": ".tiptap",
        "description": "Prompt Textbox",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": false,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "claude_chat_title",
        "selector": "[data-testid=\"chat-title-button\"]",
        "description": "Chat title",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": false,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "claude_user_message",
        "selector": "[data-testid=\"user-message\"]",
        "description": "User's messages in the chat",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": false,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "claude_standard_markdown",
        "selector": ".standard-markdown",
        "description": "Standard markdown content",
        "isEnabled": false,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1766348927056_y6klxlmzn",
        "selector": "a[data-dd-action-name=\"sidebar-project-item\"]",
        "description": "Sidebar project items",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1766349005312_wbd1z2ffx",
        "selector": "a[data-dd-action-name=\"sidebar-chat-item\"]",
        "description": "Sidebar chat items",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1766349117064_xvinbasig",
        "selector": "textarea.can-focus",
        "description": "Editing existing user message",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1771070836031_5we18vxcj",
        "selector": "div.relative.bg-bg-200.rounded-lg.px-3.py-2.font-base.break-words.min-w-0.overflow-hidden.text-text-000",
        "description": "User message bubbles in Claude Code Web",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1771071053033_1adn74fdc",
        "selector": "h3.font-semibold",
        "description": "Agent message headings in Claude Code Web",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1771071069316_zz2421tjr",
        "selector": "div.group\\/message.flex.items-start.gap-1.max-w-full.min-w-0.text-sm.text-text-100",
        "description": "Message headings in Claude Code Web",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1771071143348_ize2g4x13",
        "selector": "li",
        "description": "List items in Claude Code Web",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1771071505760_p0ov8jskb",
        "selector": "textarea.hide-focus-ring.font-base.w-full.pt-3\\.5.px-3\\.5.bg-transparent.border-0.resize-none.text-text-000.placeholder-text-500.disabled\\:opacity-50.disabled\\:cursor-not-allowed.overflow-auto.focus\\:outline-none.outline-none.shadow-none.appearance-none.min-h-10.max-h-\\[40vh\\]",
        "description": "Left panel textarea in Claude Code Web",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      }
    ]
  }
}
```

> **Note**: Claude has 13 selectors but 2 are disabled by default (`claude_response` and `claude_standard_markdown`). Some selectors use complex class-based selectors that may break when Claude updates their UI. The `data-testid` and `data-dd-action-name` attribute selectors are more stable.

---

## 4. Gemini (`gemini.google.com`)

- **loadDelay**: `3000ms`
- **Selectors**: 1

```json
{
  "gemini.google.com": {
    "loadDelay": 3000,
    "masterEnabled": true,
    "selectors": [
      {
        "id": "gemini_default",
        "selector": "[id^=\"model-response-message\"]",
        "description": "Gemini response containers",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      }
    ]
  }
}
```

---

## 5. NotebookLM (`notebooklm.google.com`)

- **loadDelay**: none
- **Selectors**: 4

```json
{
  "notebooklm.google.com": {
    "masterEnabled": true,
    "selectors": [
      {
        "id": "notebooklm_followup",
        "selector": "div.follow-up-vertical-container",
        "description": "Follow-up suggestions",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": false,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "notebooklm_title",
        "selector": "h1.notebook-title",
        "description": "Notebook title",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "notebooklm_summary",
        "selector": "span.notebook-summary",
        "description": "Notebook summary",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": false,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1771178138133_jno6642n3",
        "selector": "div.message-text-content",
        "description": "Message text content",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      }
    ]
  }
}
```

---

## 6. WhatsApp Web (`web.whatsapp.com`)

- **loadDelay**: none
- **Selectors**: 1

```json
{
  "web.whatsapp.com": {
    "masterEnabled": true,
    "selectors": [
      {
        "id": "whatsapp_message_in",
        "selector": ".message-in",
        "description": "WhatsApp incoming messages",
        "isEnabled": false,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      }
    ]
  }
}
```

> **Note**: WhatsApp selector is **disabled by default** (`isEnabled: false`). WhatsApp Web has dynamic class names that change frequently, so `.message-in` may need updating.

---

## 7. Perplexity (`www.perplexity.ai`)

- **loadDelay**: none
- **Selectors**: 2

```json
{
  "www.perplexity.ai": {
    "masterEnabled": true,
    "selectors": [
      {
        "id": "sel_1771154837411_ktx5vrggy",
        "selector": "div.gap-y-md.after\\:clear-both.after\\:block.after\\:content-\\[\\'\\'\\]",
        "description": "Agent messages in conversation",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1771154899154_auiurya06",
        "selector": "div.group\\/title.relative.inline-flex.flex-col",
        "description": "User messages in conversation",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      }
    ]
  }
}
```

> **Note**: Perplexity selectors use Tailwind-based class names which may change on site updates.

---

## Summary Table | جدول الملخص

| # | Domain | Selectors | loadDelay | Notes |
|---|--------|-----------|-----------|-------|
| 1 | `app.slack.com` | 3 | 8000ms | Stable selectors |
| 2 | `chatgpt.com` | 3 | — | Stable selectors |
| 3 | `claude.ai` | 13 | 3500ms | 2 disabled; some fragile class selectors |
| 4 | `gemini.google.com` | 1 | 3000ms | Stable attribute selector |
| 5 | `notebooklm.google.com` | 4 | — | Stable selectors |
| 6 | `web.whatsapp.com` | 1 | — | Disabled by default; fragile |
| 7 | `www.perplexity.ai` | 2 | — | Fragile Tailwind class selectors |

---

## Stability Rating | تقييم الاستقرار

Selectors rated by how likely they are to survive UI updates:

### ✅ Stable (attribute/data-testid based)
- `chatgpt.com`: `[id^="prompt-textarea"]`, `a[data-sidebar-item="true"]`
- `claude.ai`: `[data-testid="chat-title-button"]`, `[data-testid="user-message"]`, `a[data-dd-action-name="sidebar-project-item"]`, `a[data-dd-action-name="sidebar-chat-item"]`
- `gemini.google.com`: `[id^="model-response-message"]`
- `notebooklm.google.com`: `div.follow-up-vertical-container`, `h1.notebook-title`, `span.notebook-summary`, `div.message-text-content`
- `app.slack.com`: `.p-rich_text_block`, `.c-message_kit__gutter`, `.ql-editor`

### ⚠️ Fragile (Tailwind/utility class based)
- `claude.ai`: Complex class selectors for Claude Code Web elements
- `www.perplexity.ai`: Tailwind-based class selectors
- `web.whatsapp.com`: `.message-in` (may change)

---

## Full JSON Export (copy-paste ready)

```json
{
  "app.slack.com": {
    "loadDelay": 8000,
    "masterEnabled": true,
    "selectors": [
      {
        "id": "slack_content",
        "selector": ".p-rich_text_block",
        "description": "Message content alignment",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "slack_header",
        "selector": ".c-message_kit__gutter",
        "description": "Message header alignment",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": true,
        "contentSelector": ""
      },
      {
        "id": "slack_editor",
        "selector": ".ql-editor",
        "description": "Text input box alignment",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      }
    ]
  },
  "chatgpt.com": {
    "masterEnabled": true,
    "selectors": [
      {
        "id": "chatgpt_prompt",
        "selector": "[id^=\"prompt-textarea\"]",
        "description": "ChatGPT prompt textarea",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": false,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "chatgpt_katex",
        "selector": "span.katex-display",
        "description": "KaTeX display blocks",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1771317328680_cuz1xmwo5",
        "selector": "a[data-sidebar-item=\"true\"]",
        "description": "Side bar",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      }
    ]
  },
  "claude.ai": {
    "loadDelay": 3500,
    "masterEnabled": true,
    "selectors": [
      {
        "id": "sel_1772280097991_76gzu1hmr",
        "selector": "div.flex.w-full.items-center.gap-2\\.5.px-2\\.5.text-left.rounded-xl.hover\\:bg-bg-100.transition-colors.py-2\\.5.bg-bg-100",
        "description": "Prompt input box in Claude Code Web",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "claude_response",
        "selector": ".font-claude-response",
        "description": "Response containers",
        "isEnabled": false,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": false,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "claude_response_body",
        "selector": ".font-claude-response-body",
        "description": "Response body",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": false,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "claude_editor",
        "selector": ".tiptap",
        "description": "Prompt Textbox",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": false,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "claude_chat_title",
        "selector": "[data-testid=\"chat-title-button\"]",
        "description": "Chat title",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": false,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "claude_user_message",
        "selector": "[data-testid=\"user-message\"]",
        "description": "User's messages in the chat",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": false,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "claude_standard_markdown",
        "selector": ".standard-markdown",
        "description": "Standard markdown content",
        "isEnabled": false,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1766348927056_y6klxlmzn",
        "selector": "a[data-dd-action-name=\"sidebar-project-item\"]",
        "description": "Sidebar project items",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1766349005312_wbd1z2ffx",
        "selector": "a[data-dd-action-name=\"sidebar-chat-item\"]",
        "description": "Sidebar chat items",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1766349117064_xvinbasig",
        "selector": "textarea.can-focus",
        "description": "Editing existing user message",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1771070836031_5we18vxcj",
        "selector": "div.relative.bg-bg-200.rounded-lg.px-3.py-2.font-base.break-words.min-w-0.overflow-hidden.text-text-000",
        "description": "User message bubbles in Claude Code Web",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1771071053033_1adn74fdc",
        "selector": "h3.font-semibold",
        "description": "Agent message headings in Claude Code Web",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1771071069316_zz2421tjr",
        "selector": "div.group\\/message.flex.items-start.gap-1.max-w-full.min-w-0.text-sm.text-text-100",
        "description": "Message headings in Claude Code Web",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1771071143348_ize2g4x13",
        "selector": "li",
        "description": "List items in Claude Code Web",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1771071505760_p0ov8jskb",
        "selector": "textarea.hide-focus-ring.font-base.w-full.pt-3\\.5.px-3\\.5.bg-transparent.border-0.resize-none.text-text-000.placeholder-text-500.disabled\\:opacity-50.disabled\\:cursor-not-allowed.overflow-auto.focus\\:outline-none.outline-none.shadow-none.appearance-none.min-h-10.max-h-\\[40vh\\]",
        "description": "Left panel textarea in Claude Code Web",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      }
    ]
  },
  "gemini.google.com": {
    "loadDelay": 3000,
    "masterEnabled": true,
    "selectors": [
      {
        "id": "gemini_default",
        "selector": "[id^=\"model-response-message\"]",
        "description": "Gemini response containers",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      }
    ]
  },
  "notebooklm.google.com": {
    "masterEnabled": true,
    "selectors": [
      {
        "id": "notebooklm_followup",
        "selector": "div.follow-up-vertical-container",
        "description": "Follow-up suggestions",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": false,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "notebooklm_title",
        "selector": "h1.notebook-title",
        "description": "Notebook title",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "notebooklm_summary",
        "selector": "span.notebook-summary",
        "description": "Notebook summary",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": false,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1771178138133_jno6642n3",
        "selector": "div.message-text-content",
        "description": "Message text content",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      }
    ]
  },
  "web.whatsapp.com": {
    "masterEnabled": true,
    "selectors": [
      {
        "id": "whatsapp_message_in",
        "selector": ".message-in",
        "description": "WhatsApp incoming messages",
        "isEnabled": false,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      }
    ]
  },
  "www.perplexity.ai": {
    "masterEnabled": true,
    "selectors": [
      {
        "id": "sel_1771154837411_ktx5vrggy",
        "selector": "div.gap-y-md.after\\:clear-both.after\\:block.after\\:content-\\[\\'\\'\\]",
        "description": "Agent messages in conversation",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      },
      {
        "id": "sel_1771154899154_auiurya06",
        "selector": "div.group\\/title.relative.inline-flex.flex-col",
        "description": "User messages in conversation",
        "isEnabled": true,
        "autoApply": true,
        "applyDirection": true,
        "applyTextAlign": true,
        "forceRTL": false,
        "contentSelector": ""
      }
    ]
  }
}
```
