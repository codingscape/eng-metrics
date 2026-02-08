# eng-metrics (WIP)

A multi-client, config-driven CLI that pulls GitHub activity and generates weekly engineering metrics.

## Goals
- Works across multiple client engagements (different GitHub orgs + auth)
- Onboarding via CLI (`init` / `reinit`)
- Runnable on-demand (defaults to “past 7 days”) and automatable (cron/GitHub Actions)
- Output: Markdown report + JSON metrics
- Persist raw data so you can later generate last-month / last-quarter views

## Status
WIP — initial GitHub-only implementation in progress.
