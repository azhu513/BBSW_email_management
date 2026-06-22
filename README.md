# BBSW Email Management

A Google Apps Script tool for managing email subscriber lists and batch sending campaigns with partition-based rate limiting.

![Admin Sidebar](Sidebar.png)

## Features

- **Email list management** — Subscribe/unsubscribe tracking with deduplication, CSV import, and unsubscribe-list import.
- **Partitioned sending** — Split large lists into balanced buckets to send across multiple days or among multiple senders without hitting Gmail's daily quota.
- **Flexible body formats** — Plain text (auto-converted to HTML), raw HTML, or rich-text editing.
- **Attachments** — Files from Google Drive, public URLs, or direct upload from the sidebar.
- **Bounce auditing** — Scan Gmail for delivery-failure messages and (optionally) remove bounced addresses.
- **Quota-aware** — Pre-send quota check; non-destructive sends never delete rows on failure.
- **Re-send scheduling** — Schedule a campaign to re-send after a configurable delay.

## Quick start

1. Create a new Google Sheet.
2. Open **Extensions → Apps Script** and paste in `Bootstrap.gs`, `Admin.gs`, and `Shared.gs` from this repo.
3. Add a sheet tab named **"Email List"** with the headers described in [docs/setup.md](docs/setup.md).
4. Refresh the spreadsheet — an **Admin Tools** menu appears.

Full installation walkthrough → [docs/setup.md](docs/setup.md)

## Documentation

- 📦 **[Setup](docs/setup.md)** — Install the tool in a new Google Sheet.
- 👥 **[Managing Subscribers](docs/managing-subscribers.md)** — Clean/dedup, CSV import, unsubscribe import, bounce audit.
- 📤 **[Sending Campaigns](docs/sending-campaigns.md)** — The Send sidebar, body modes, attachments, images, saved inputs, scheduled re-send.
- 🗂 **[Partitions and Gmail Quotas](docs/partitions-and-quotas.md)** — Quota reference, single-sender and multi-sender workflows, troubleshooting "100 sent then failed."
- ⚙️ **[Configuration](docs/configuration.md)** — `CONFIG` keys, file layout, Script Properties, logs.

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

You are free to use, modify, and distribute this software — including for commercial purposes — provided that any distributed version (modified or not) is also released under GPLv3 with full source code available.

This software is provided "AS IS", without warranty of any kind. See the [LICENSE](LICENSE) file for the full disclaimer of warranty and limitation of liability.

## Support and Feedback

This is a volunteer-maintained project — there is no SLA and responses are best-effort. Feedback, bug reports, and pull requests are very welcome.

- **Bugs or unexpected behavior** → [open an Issue](../../issues/new/choose)
- **"How do I…" questions** → [start a Q&A Discussion](../../discussions)
- **Feature ideas** → [start an Ideas Discussion](../../discussions)
- **Contributing code** → see [CONTRIBUTING.md](CONTRIBUTING.md)
- **Full support policy** → see [SUPPORT.md](SUPPORT.md)
