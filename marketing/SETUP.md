# Automated Marketing Setup — Complete Guide

Everything here is **100% free**. No credit card required anywhere.

The system: GitHub Actions runs daily at 7pm PKT, picks a post from 28 pre-written viral posts, generates a branded 1080x1080 image, and publishes to all configured platforms automatically.

---

## Step 1: Create Accounts (20 minutes total)

### 1a. Bluesky (EASIEST — Start Here)
1. Go to https://bsky.app and sign up (free, no phone needed)
2. Use handle like `oopsstudio.bsky.social`
3. Fill out profile: name "Oops Studio", bio with app description, link to website
4. After signup: Settings > App Passwords > Add App Password
5. Name it "marketing-bot", copy the generated password

**Secrets to add:**
- `BLUESKY_HANDLE` = `oopsstudio.bsky.social`
- `BLUESKY_PASSWORD` = (the app password you copied)

### 1b. Mastodon (EASY — Big Tech Community)
1. Go to https://mastodon.social and sign up (free)
2. Use display name "Oops Studio", username `oopsstudio`
3. Fill bio, add website link, add profile pic
4. Go to: Preferences > Development > New Application
5. Name: "Marketing Bot"
6. Scopes: check `write:statuses` and `write:media`
7. Click Submit, then click the app name to see your access token

**Secrets to add:**
- `MASTODON_INSTANCE` = `https://mastodon.social`
- `MASTODON_ACCESS_TOKEN` = (the token shown on app page)

### 1c. Facebook Page (FREE — No App Review Needed)

#### Create Facebook Page
1. Go to https://facebook.com/pages/create
2. Page name: **"Oops Studios"** (or whatever you chose)
3. Category: "App" or "Software"
4. Add profile pic (use app icon), cover photo, and description
5. Once created, go to the page > About > note the **Page ID** (numeric, in URL or page info)

#### Create Facebook Developer App
1. Go to https://developers.facebook.com
2. Click "My Apps" > "Create App"
3. Choose "Business" type > Next
4. App name: "Oops Studio Marketing" (anything works)
5. Click "Create App"
6. **No app review needed** — Development Mode works for your own page

#### Get Long-Lived Page Access Token
1. Go to https://developers.facebook.com/tools/explorer/
2. Select your app from the dropdown
3. Click "Get User Access Token"
4. Under Permissions, check:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_show_list`
5. Click "Generate Access Token" and authorize
6. Copy the short-lived token shown

**Extend to long-lived token:**
```
curl -s "https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_TOKEN"
```
Copy the `access_token` from the response.

**Get permanent Page Token:**
```
curl -s "https://graph.facebook.com/v19.0/me/accounts?access_token=YOUR_LONG_LIVED_USER_TOKEN"
```
Find your page in the response — the `access_token` there is your **permanent page token**.

**Secrets to add:**
- `FACEBOOK_PAGE_ID` = (numeric page ID)
- `FACEBOOK_PAGE_TOKEN` = (permanent page access token from above)

### 1d. Instagram Business Account (FREE — Uses Same FB Token)

#### Link Instagram to Facebook Page
1. You need an **Instagram Business Account** (or Creator Account)
2. On Instagram app: Settings > Account > Switch to Professional Account > Business
3. Link it to your Facebook Page when prompted

#### Get Instagram Account ID
1. Using your Facebook Page Token from above:
```
curl -s "https://graph.facebook.com/v19.0/YOUR_PAGE_ID?fields=instagram_business_account&access_token=YOUR_PAGE_TOKEN"
```
2. The `instagram_business_account.id` is your Instagram Account ID

#### Add Instagram permissions to your FB App
1. In Facebook Developer dashboard, go to your app
2. Add the "Instagram Content Publishing" product
3. In Graph API Explorer, also request:
   - `instagram_basic`
   - `instagram_content_publish`
4. Re-generate and extend the token (same steps as Facebook above)

**Secrets to add:**
- `INSTAGRAM_ACCOUNT_ID` = (Instagram business account ID from above)
- (Uses the same `FACEBOOK_PAGE_TOKEN` — no extra token needed)

### 1e. Twitter/X (DISABLED — $100/month)
Twitter API free tier no longer supports posting. Requires Basic plan at $100/month. Kept disabled in the workflow.

---

## Step 2: Add Secrets to GitHub (2 minutes)

1. Go to: https://github.com/muhammadhamx/Royal-Throne/settings/secrets/actions
2. Click **"New repository secret"** for each key
3. Paste the name and value exactly

### All Secrets Reference

| Secret | Platform | Required |
|--------|----------|----------|
| `BLUESKY_HANDLE` | Bluesky | For Bluesky |
| `BLUESKY_PASSWORD` | Bluesky | For Bluesky |
| `MASTODON_INSTANCE` | Mastodon | For Mastodon |
| `MASTODON_ACCESS_TOKEN` | Mastodon | For Mastodon |
| `FACEBOOK_PAGE_ID` | Facebook | For Facebook |
| `FACEBOOK_PAGE_TOKEN` | Facebook + Instagram | For both |
| `INSTAGRAM_ACCOUNT_ID` | Instagram | For Instagram |

The system auto-detects which platforms have secrets. Missing = skipped silently.

---

## Step 3: Test It (1 minute)

1. Go to: https://github.com/muhammadhamx/Royal-Throne/actions
2. Click "Daily Social Media Marketing"
3. Click "Run workflow" > "Run workflow"
4. Check your social media accounts — posts should appear with images

---

## Step 4: Free Manual Marketing Blitz (Do This Once)

These one-time posts can go viral. Do them on day 1:

### Reddit (Biggest Free Reach)
Post to these subreddits (READ THEIR RULES FIRST):
- r/androidapps — "I built a poop tracker that matches you with someone pooping at the same time"
- r/opensource — "I built an open source poop tracker with React Native + Supabase"
- r/reactnative — "My first React Native app: a gamified poop tracker with ML predictions"
- r/SideProject — "I'm too broke for the Play Store so I'm giving my app away as an APK"
- r/IndieHackers — same angle as SideProject
- r/InternetIsBeautiful — link to the website
- r/funny — "I built an app that predicts when you'll poop and I'm too broke to put it on the Play Store"

**Tips:** Be genuine, tell your story (broke dev from Pakistan), don't be spammy. Reddit loves underdog stories.

### Hacker News
Post: "Show HN: Royal Throne – Open source poop tracker with ML predictions and real-time buddy matching"
URL: https://muhammadhamx.github.io/Royal-Throne/

### Product Hunt
1. Go to https://producthunt.com and sign up (free)
2. Submit Royal Throne as a new product
3. Use your best screenshot + the website link
4. Best day to launch: Tuesday or Wednesday

### Dev.to / Hashnode (Developer Blogs)
Write a post: "I Built a Poop Tracker App With Zero Budget — Here's What Happened"
- Tell your story
- Share the tech stack
- Link to GitHub and website
- These platforms have huge reach for dev content

### Discord Servers
Join servers for: React Native, Expo, Indie Hackers, App Development
Share your project in #showcase or #projects channels

### Facebook Groups
Post in: React Native Community, Indie App Developers, Open Source Projects, Pakistani Developers

### WhatsApp
Share the website link with friends. Ask them to share it. Word of mouth is free and powerful.

---

## How the Daily Posts Work

- `marketing/posts.json` has 28 posts covering different viral angles
- GitHub Actions picks one per day based on day-of-year (no repeats for 28 days)
- Each post generates a branded 1080x1080 image with one of 6 templates
- Posts go to all configured platforms with image + caption
- All steps use `continue-on-error` — one platform failing doesn't block others
- Runs at 7pm PKT (2pm UTC) — peak engagement time

### Image Templates
1. **Bold Statement** — Big white text on navy, gold separator
2. **Split Card** — Navy top + teal gradient bottom
3. **Centered Quote** — Gold quotation mark, centered text
4. **Stats Card** — Huge faded number background
5. **List Card** — Title + bulleted list items
6. **CTA Card** — Crown icon + headline + download button

---

## Cost Breakdown

| Item | Cost |
|------|------|
| GitHub Actions | Free (public repo) |
| Bluesky | Free |
| Mastodon | Free |
| Facebook Page | Free (dev mode) |
| Instagram | Free (dev mode) |
| Image generation | Free (Pillow) |
| Twitter/X API | ~~$100/month~~ DISABLED |
| **Total** | **$0** |

---

## Troubleshooting

### Facebook/Instagram not posting?
- Make sure the FB App is in **Development Mode** (no review needed for your own page)
- Page Token must be a **permanent page token**, not a user token
- Instagram must be a **Business** or **Creator** account, linked to the FB Page

### Image not generating?
- Check the "Generate marketing image" step in workflow logs
- Pillow installs automatically, Inter font downloads from GitHub

### Bluesky post too long?
- Bluesky has a 300-character limit
- The workflow auto-truncates if the post + tags exceed 300 chars
- Image still gets attached regardless of text truncation
