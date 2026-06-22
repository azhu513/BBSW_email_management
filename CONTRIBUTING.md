# Contributing

Pull requests are welcome! Because this is a small, volunteer-maintained
project, a few notes will save us both time.

## Before you start

1. **Read the relevant [docs](docs/) page first.** A surprising number of
   feature ideas turn out to already be supported by an existing menu
   item or workflow. Skim at least:
   - [Sending Campaigns](docs/sending-campaigns.md) — body modes,
     attachments, saved inputs, scheduled re-send.
   - [Managing Subscribers](docs/managing-subscribers.md) — clean/dedup,
     imports, unsubscribes, bounce audit.
   - [Partitions and Gmail Quotas](docs/partitions-and-quotas.md) —
     splitting large sends, multi-sender workflows.
2. **Open an Issue or Discussion first** for any non-trivial change.
   A five-minute "is this in scope?" conversation can save a two-hour PR.
   - For "I think the tool should also do X" → file a
     [Feature request](../../issues/new?template=feature_request.md).
   - For "I'm not sure how to accomplish Y with the current tool" →
     ask in [Discussions → Q&A](../../discussions) **before** writing code.
3. **Search existing Issues and Discussions** to see if your idea has
   already been raised.

## Pull request guidelines

- **Keep changes focused.** One concern per PR. Refactors and new features
  in separate PRs.
- **Preserve existing menu item names** unless you're explicitly proposing
  a UI change — users have docs and habits that reference them.
- **Match the existing code style.** No build tools or formatters are in
  use; just follow the surrounding code.
- **Update the README** if your change affects user-visible behavior.
- **Test in a real Google Sheet** before submitting. Apps Script behaves
  differently than the editor in places — triggers, quotas, and authorization
  scopes are common gotchas.
- **Be cautious with destructive operations.** Any change that deletes
  rows from the Email List needs a clear opt-in flow (confirmation dialog,
  dry-run mode, or explicit menu item).

## License of contributions

By submitting a pull request, you agree that your changes are released
under the project's license ([GPLv3](LICENSE)).

## Review timeline

I review PRs when I have time. If you don't hear back within two weeks,
feel free to bump the thread with a polite comment.

## Out of scope

Some kinds of changes are unlikely to be accepted:

- Adding tracking, analytics, or telemetry of any kind.
- Adding paid/commercial features or hooks for them.
- Major architectural rewrites without a prior Discussion.
- Dependencies on external services beyond Google Workspace
  (Gmail, Drive, Sheets, Apps Script).
- Features that are outside the intended purpose of this tool
  (managing a subscriber list and batch-sending email campaigns from a
  Google Sheet).
- Features that the current tool can already do under a different menu
  item or workflow — please check the [docs](docs/) and ask in
  [Discussions → Q&A](../../discussions) if you're unsure.
