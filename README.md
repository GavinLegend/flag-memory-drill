# Flag Memory Drill

A mobile-friendly English flag quiz for iPhone browsers.

## Features

- Random four-choice flag questions
- Green feedback for correct answers
- Red feedback for wrong answers
- Persistent mistake book saved in the browser
- Per-flag miss counter for focused review
- Two study modes: `All Flags` and `Mistake Book`

## Project Structure

- `docs/`: production-ready static files for GitHub Pages or Netlify
- `index.html`, `styles.css`, `app.js`, `data.js`: local working copy
- `netlify.toml`: tells Netlify to publish from `docs`

## Deploy to GitHub Pages

1. Create a new GitHub repository and upload the contents of this `flag-quiz` folder.
2. On GitHub, open the repository.
3. Go to `Settings` -> `Pages`.
4. Under `Build and deployment`, choose `Deploy from a branch`.
5. Select your branch, usually `main`.
6. Select the `/docs` folder.
7. Save.

GitHub Pages will publish the files inside `docs/`.

## Deploy to Netlify

### Option 1: Drag and Drop

1. Open Netlify Drop in your browser.
2. Drag the whole `docs` folder into the upload area.
3. Netlify will create a public URL immediately.

### Option 2: Connect a Git Repository

1. Push this `flag-quiz` folder to GitHub.
2. Import the repository into Netlify.
3. Netlify will detect `netlify.toml`.
4. The site will publish from the `docs` directory.

## Local Use

- Open `index.html` directly in a browser, or
- Serve the folder with a local static server for best compatibility

## Notes

- Mistake records are stored in `localStorage`, so they stay on the same device and browser.
- If you clear browser website data, the mistake book will also be cleared.
