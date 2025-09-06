# VIT Vellore Dating App (Frontend Demo)

Lovely, love-themed demo site with:
- Animated gradient and floating hearts background (plus heart sparkles on click)
- Preferences: choose your gender (“I am”) and whom to see (“Show me”), and the discover deck filters accordingly
- Discover deck with like/skip and cute effects
- Likes and demo "Matches" list
- Messaging: open chats with your matches, send messages, and see playful auto-replies

## Run locally
- Download all files into a folder.
- Open `index.html` in your browser.

No build step or backend required.

## Notes
- This is a purely front-end demonstration. Do not use real passwords.
- User data is stored in `localStorage` for demo purposes.
- Matches and message replies are randomly simulated to make the demo feel lively.

## Customize
- Edit `script.js`:
  - `seedProfiles()` to change default profiles and their genders (`male`, `female`, `nonbinary`).
  - Tweak the chance to auto-match after liking (search for "Random chance for a match").
  - Adjust or remove auto-replies in `sendMessage()`.
- Adjust theme colors and glow accents in `styles.css` under the `:root` variables and `.glow` effect.
- Background behavior can be tuned in `startHearts()` and the sparkle particle system in `initSparkles()`.

## Shortcuts
- Left/Right arrows: previous/next profile
- L: like current profile
- S: skip current profile