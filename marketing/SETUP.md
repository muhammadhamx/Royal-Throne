# Automated Marketing Setup

The GitHub Action `.github/workflows/daily-marketing.yml` posts to social media daily at 7pm PKT (2pm UTC).

## How It Works

1. Picks a post from `marketing/posts.json` based on day-of-year (cycles through 21 posts)
2. Posts to whichever platforms have secrets configured
3. If a platform's secrets are missing, it silently skips that platform
4. You can add more posts to `posts.json` anytime

## Platform Setup

### Twitter/X (Free Tier - 1,500 tweets/month)

1. Go to https://developer.twitter.com/en/portal
2. Create a project + app (free tier)
3. Generate API keys and access tokens
4. Add these GitHub repo secrets:
   - `TWITTER_API_KEY`
   - `TWITTER_API_SECRET`
   - `TWITTER_ACCESS_TOKEN`
   - `TWITTER_ACCESS_SECRET`

### Bluesky (Completely Free)

1. Create account at https://bsky.app
2. Go to Settings > App Passwords > Create
3. Add these GitHub repo secrets:
   - `BLUESKY_HANDLE` (e.g., `yourname.bsky.social`)
   - `BLUESKY_PASSWORD` (the app password, NOT your main password)

### Mastodon (Completely Free)

1. Create account at https://mastodon.social (or any instance)
2. Go to Preferences > Development > New Application
3. Create app with `write:statuses` scope
4. Copy the access token
5. Add these GitHub repo secrets:
   - `MASTODON_INSTANCE` (e.g., `https://mastodon.social`)
   - `MASTODON_ACCESS_TOKEN`

## Adding Secrets

Go to: https://github.com/muhammadhamx/Your-Throne/settings/secrets/actions

Click "New repository secret" for each one.

## Testing

Run manually: Go to Actions tab > "Daily Social Media Marketing" > "Run workflow"

## Adding More Posts

Edit `marketing/posts.json` and add new entries. The system cycles through all posts based on day-of-year.
