# FinanzPilot

A simple, mobile-first personal finance app to track daily expenses, manage monthly budgets, and reach savings goals.

## Features

- **Daily activity:** Quickly add income and expenses with automatic date and time, categories, and optional notes.
- **Monthly budgets:** Set your own category limits, track spending percentages, and see warnings when approaching or exceeding a limit.
- **Monthly payments:** Automatically record regular income and expenses, such as salary, rent, and subscriptions, when the app is opened.
- **Safe to spend:** Estimate how much you can spend per day within your remaining monthly budget.
- **Savings goals:** Create personal savings targets and track your progress separately from expenses.
- **Spending insights:** Explore daily and monthly spending charts and category breakdowns.
- **Backups:** Export and restore JSON backups or export monthly entries as CSV.
- **App updates:** Check for new releases directly from Settings.

## Live app — GitHub Pages

The app is designed to be hosted as a static website on GitHub Pages.

After deployment, open `https://<your-github-username>.github.io/finanzpilot/` (replace `<your-github-username>` with the repository owner). The actual published address is shown in the repository’s **Settings → Pages** screen.

## Getting started

1. Open the published GitHub Pages website.
2. Set your monthly budget limits.
3. Add your monthly income and regular expenses.
4. Record daily purchases using the **+** button.
5. Check your remaining budget and savings progress whenever you like.

## Project structure

```text
finanzpilot/
├── index.html      # App layout
├── style.css       # Responsive design
├── app.js          # App logic and local storage
├── version.json    # Release version for update checks
├── manifest.webmanifest # Installable app metadata
├── sw.js           # Offline app shell
├── icons/          # Home screen icons
└── README.md       # Project documentation
```

Built with HTML, CSS, and vanilla JavaScript. No external libraries or build tools are required.

## Deployment

1. Upload all project files and the `icons/` directory to the root of the public `finanzpilot` repository.
2. Open **Settings → Pages → Build and deployment**.
3. Under **Source**, select **Deploy from a branch**.
4. Choose `main` and `/ (root)`, then click **Save**.
5. Once deployment succeeds, open the URL shown on the Pages screen.

No server, database, Firebase project, account or build step is required.

### Publishing updates

Update the relevant source files and keep the version in `version.json`, the `APP_VERSION` constant in `app.js`, the `RELEASE` constant in `sw.js`, and the asset version query strings in `index.html` in sync. Commit to `main`. Once GitHub Pages has deployed the release, use **Settings → Check for updates** in the app. Updates do not intentionally clear local records.

## Privacy and storage

FinanzPilot is local-first by design. Financial records are saved in browser `localStorage`, not sent to GitHub or a cloud database. No login, Firebase or cloud synchronization is required or planned. GitHub Pages hosts the public application files; the update checker requests only the public release metadata.

Each browser profile and device has its own records. Clearing site data, private browsing, changing the site address or moving to another device can make records unavailable. Use JSON export/import to back up or manually transfer data. Backups contain personal financial information in plain text and should never be committed to a public repository. Local storage is not encrypted by the app.

The first visit and update checks require internet. Once Settings reports offline access is ready, the app shell is cached for offline reopening. Browser storage and cached files can still be cleared or evicted by the device.

Safe to spend is a budget estimate, not a live bank balance.

## Install on your phone

- **iPhone:** Open the published URL in Safari, use Share → Add to Home Screen, then open the home screen icon while online. Check Settings for offline readiness.
- **Android:** Open the URL in Chrome, choose Install app or Add to Home screen from the menu (or use Settings → Install when offered), and open it while online.

Anyone can use the public website without an account. Each browser/app storage context is separate. On some phones, a newly installed web app may not inherit records from the browser; export a JSON backup before installation and restore it if needed. No financial data is shared between users. Updates are distributed through GitHub Pages; review changes before publishing. Do not upload personal backup files.

## Version

Current release: **1.10.0**. See `version.json` for the release version used by the in-app update checker.

## License

No open-source license is currently provided.
