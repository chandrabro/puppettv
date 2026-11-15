# Almost Television

A surreal puppet show that writes and performs itself. Three puppets (Bloop, Gus and Nimbus) talk, move, and make sound effects, all inside your browser. AI can write brand new episodes on any topic.

No framework, no build step, no paid services. It is plain HTML, CSS and JavaScript, plus one small server function for the AI writing.

## What it can do

| Feature | How it works |
| --- | --- |
| Self-running show | Press **Turn on TV**. Episodes play one after another ("channels"). |
| 3 puppets with moving mouths | Drawn in SVG. The speaker steps forward, and the script can trigger bounce, shake, spin, grow, duck and wave. |
| Different voices | The browser's built-in speech (Web Speech API). Free, but voices depend on the device. |
| Sound effects | Boing, ding, whoosh, rimshot, sad trombone, applause. Made in code, so there are no audio files. |
| TV static between shows | Retro touch with a title card for each episode. |
| Captions | On by default, and burned into the picture so screen recordings include them. |
| **Vertical 9:16 mode** | For YouTube Shorts, Reels and TikTok. The speaker zooms in. |
| **Write with AI** | Type a topic, the AI writes an episode. English, Nepali or Hindi. |
| **Paste a script** | No API key needed. Ask Claude (or any chatbot) to write a script, paste it in. |
| **Endless TV** | When an episode ends, the AI writes the next one by itself. |
| Save and download | Episodes you add are saved in your browser. You can also download any script as JSON. |
| Fullscreen and shortcuts | Space = play/pause, N = next channel, F = fullscreen. |

## Files

```
index.html        the page
style.css         the look (TV, curtains, puppets, animations)
app.js            the player: puppets, voices, sounds, buttons
episodes.js       the 3 built-in episodes (easy to edit!)
api/generate.js   server function that asks the AI to write an episode
vercel.json       Vercel settings
test/             automatic tests for the server function (npm test)
.env.example      shows which secret keys can be set
```

## 1. Try it on your computer (30 seconds)

Double-click `index.html`. The built-in episodes work right away. The "Write with AI" button needs the deployed version (steps below). "Paste a script" works everywhere.

## 2. Put it on GitHub

**Easiest way (no commands):**
1. Go to github.com and click **New repository**. Name it `almost-television`. Click **Create repository**.
2. Click **uploading an existing file**.
3. Unzip the project, then drag **everything inside the folder** (including the `api` and `test` folders) into the page.
4. Click **Commit changes**.

**With the terminal:**
```bash
cd almost-television
git init
git add .
git commit -m "Almost Television"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/almost-television.git
git push -u origin main
```

## 3. Deploy on Vercel

1. Go to vercel.com and sign in with GitHub.
2. Click **Add New... > Project**, and import your `almost-television` repository.
3. Leave the settings as they are. If it asks for a Framework Preset, choose **Other**. Click **Deploy**.
4. In about a minute you get a live link like `almost-television.vercel.app`.

Every time you push a change to GitHub, Vercel updates the site automatically.

## 4. Turn on AI writing (free)

1. Get a free key at https://aistudio.google.com/apikey (Google Gemini). A Mistral key also works.
2. In Vercel, open your project, then **Settings > Environment Variables**.
3. Add a variable named `GEMINI_API_KEY` and paste your key as the value. (For Mistral, the name is `MISTRAL_API_KEY`.)
4. Go to **Deployments**, open the latest one, and choose **Redeploy** so the new variable takes effect.

**Keep the key secret.** It only lives in Vercel and is used by `api/generate.js` on the server. Never paste it into `app.js` or any file on GitHub.

Because your site is public, anyone who visits can press "Write with AI" and use your free quota. The server function limits each visitor to 12 episodes per hour (change it with `RATE_LIMIT_PER_HOUR`), but that limit is only best-effort. If you are worried, share the link only with people you trust, or leave the key out and use "Paste a script". Free-tier limits can change, so check them in Google AI Studio.

## Add your own episodes

**Option A: in the website.** Open **Paste a script**, click **Copy prompt for a chatbot**, paste it into Claude (or any AI chat), then paste the JSON answer back and press **Add & play**. This costs nothing and needs no key.

**Option B: in the code.** Open `episodes.js`, copy one episode block, and change the text. The format:

```js
{
  id: 'ep-my-show',
  title: 'My Show',
  lang: 'en',            // en, ne (Nepali) or hi (Hindi)
  lines: [
    { who: 'bloop', text: 'Hello everyone!', action: 'bounce', sfx: 'ding' },
    { who: 'gus',   text: 'Hmm.' }
  ]
}
```

- `who`: `bloop`, `gus` or `nimbus`
- `action` (optional): `bounce`, `shake`, `spin`, `grow`, `duck`, `wave`
- `sfx` (optional): `boing`, `ding`, `whoosh`, `rimshot`, `trombone`, `applause`

## Making videos with it

1. Turn on **Vertical 9:16** for Shorts, Reels and TikTok.
2. Click **Fullscreen**, then record your screen (Windows: Win+G, Mac: Shift+Cmd+5, phone: built-in screen recorder). Captions are part of the picture, so they are recorded too.
3. To record audio from the show, record "system audio" or the device's internal sound where your recorder allows it. Some phones block this, in which case use a computer.

## Troubleshooting

- **No sound or a robot voice:** voices come from your device. Chrome and Edge on a computer or Android usually have the most. Pick different ones under **Settings > Choose voices**.
- **Nepali is captions only or sounds odd:** many devices have no Nepali voice. The show then tries a Hindi voice, and if there is none it shows captions only. On Android you can add voices in the phone's text-to-speech settings.
- **"AI writer is not set up":** the key is missing. Do step 4 above, and remember to redeploy.
- **"AI writer had a problem":** the default model name is `gemini-flash-latest`. If your key does not accept it, add `GEMINI_MODEL` in Vercel set to a Flash model name shown in Google AI Studio, then redeploy.
- **Endless TV uses your free quota** each time it writes a new episode, so turn it off when you are not watching.

## Tests

`npm test` checks the server function (needs Node 18 or newer, nothing to install).
