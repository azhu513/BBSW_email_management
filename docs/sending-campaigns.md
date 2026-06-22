# Sending Campaigns

All sending features are accessible via the **Admin Tools** menu in the spreadsheet.

> ⚠️ **Send actions are non-destructive.** They never delete rows from the "Email List" sheet — not for duplicates, not for unsubscribed addresses, not for failed sends. Use the Admin Tools menu items in [Managing Subscribers](managing-subscribers.md) to clean the list before sending if needed.

## Send now (Sidebar)

Opens an interactive sidebar to compose and send emails. This is the main interface for campaigns.

![Admin Sidebar](../Sidebar.png)

### Step 1: Choose Recipients

**Send to** — Select who receives this email:
- **All subscribers** — Sends to all currently subscribed emails (default)
- **Partition 0, 1, 2, ...** — Sends only to a specific partition. Use this to split large campaigns across multiple sendings to avoid hitting Gmail's rate limits. See [Partitions and Quotas](partitions-and-quotas.md).

### Step 2: Compose Subject

**Subject** — Email subject line. You can use placeholders like `{{First Name}}` to personalize:
- Example: `Welcome {{First Name}} — BBSW Update`
- Placeholders are replaced with each recipient's data from the Email List

### Step 3: Choose Body Format

**Body mode** — Controls how your email body is formatted and edited:

- **Plain Text (auto-convert to HTML)** — Best for simple text emails. You type plain text; the script automatically converts it to HTML. Line breaks become paragraphs, multiple line breaks create space. Good for most emails.

- **HTML Textarea** — For advanced users. You write raw HTML directly. The script sends it as-is without modifications. Use this if you need fine-grained control over formatting, `<table>` layouts, or custom styling.

- **Rich Text Editor (WYSIWYG)** — Visual editor with toolbar. Click the formatting buttons (B, I, U) to bold/italicize/underline selected text. Use the Size and Font dropdowns to change font size and family. Best if you're not comfortable with HTML.

### Step 4: Format Body Content

Enter your email body in the text area (Plain/HTML) or editor (Rich mode).

**Personalization** — In subject and body, use these placeholders to personalize messages:

- `{{First Name}}`
- `{{Last Name}}`
- `{{Affiliation}}`
- `{{Role}}`
- `{{Email Address}}`

Example (Plain Text mode):

```
Hi {{First Name}},

Thank you for subscribing to BBSW updates. Your affiliation is {{Affiliation}} and your role is {{Role}}.

Best regards,
The Team
```

Each recipient sees their own data substituted in place of the placeholders.

### Adding Images to Email Body (Rich Text Editor Only)

Images can only be embedded in **Rich Text Editor** mode. There are two ways to insert images:

**Option 1: Paste from Clipboard**
1. Copy an image to your clipboard (take a screenshot, right-click an image in your browser and select "Copy image", or copy an image file from Finder)
2. Click into the Rich Text Editor area
3. Press **⌘V** (Mac) or **Ctrl+V** (Windows/Linux)
4. The image will be inserted into the editor

**Option 2: Drag and Drop**
1. Drag an image file from Finder directly into the Rich Text Editor area
2. Or, drag an image from another browser tab into the editor
3. The image will be inserted

> ⚠️ **Caveat:** Images inserted from a local file or clipboard are embedded as base64 data URIs. They will preview correctly in the editor, but **Gmail and Outlook commonly strip or block data-URI images**, so recipients often won't see them. For reliable image delivery, host the image on a public URL and use `<img src="https://...">` in **HTML Textarea** mode instead.

### Step 5: Add Attachments (Optional)

**Attachments (Drive IDs / URLs, comma or newline separated)** — Attach files to the email:

- **Google Drive files** — Paste the file URL: `https://drive.google.com/file/d/1abc123XYZ/view?usp=sharing` or just the file ID
- **Public URLs** — Paste any public link: `https://example.com/document.pdf`
- **Upload files** — Use the "Upload files" input below to pick files directly from your computer (this sending only; not saved)

Examples:

```
https://drive.google.com/file/d/1abc123XYZ/view
1abc123XYZ
https://example.com/flyer.pdf
```

### Step 6: Send or Save

- **Send** — Sends the campaign to all selected recipients using all attachments (Drive files, URLs, and uploaded files). Before sending, the script checks your remaining Gmail quota and warns if it's insufficient.

- **Save inputs** — Stores the subject, body, body mode, and attachments for later. Useful if you want to tweak formatting or use the same email again. **Note:** Only Drive files and URLs are saved; uploaded files are included only in this send and won't be available for re-use.

## Send now (use saved inputs)

Sends using previously saved subject, body, body mode, partition filter, and attachments (Drive files and URLs only) without opening the sidebar. Useful for quick re-sends.

**Note:** Uploaded files are not saved, so they won't be re-sent — only Drive files and public URLs attached to the saved inputs will be included.

## Schedule Re-Send in 1 Week

Creates a time-based trigger to automatically re-send the last campaign (same subject, body, attachments, partition filter) after 7 days. The trigger runs in the background. Check the Apps Script log (Extensions → Apps Script → Executions) to see when it ran and whether any sends failed.

To cancel a pending re-send, use **Admin Tools → Remove All Re-Send Triggers**.

## What happens when a send fails

The sidebar reports the result in an alert. If the run was stopped by a Gmail quota or account restriction, the alert says so explicitly and tells you how many recipients were skipped. **No rows are removed from the sheet in any case.**

Per-recipient error details are written to the Apps Script Executions log (Extensions → Apps Script → Executions) — click the failing run to see each error message. See [Troubleshooting Quotas](partitions-and-quotas.md#troubleshooting-quota-issues) for common causes.

---

**Next:** [Managing Subscribers](managing-subscribers.md) · [Partitions and Quotas](partitions-and-quotas.md)
