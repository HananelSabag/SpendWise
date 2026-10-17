# Dependency security update — 2026-10-17

The starting GitHub report contained 26 open Dependabot alerts, including the critical `proxy-addr` trust-subnet issue. A fresh local audit also found vulnerable development-tool chains. Both the client and server now report **zero vulnerabilities**, including development dependencies.

## Changes

- Client: Axios 1.20, React Router 7.18.4, Tailwind CSS/PostCSS 4.3.3 and tailwind-merge 3.7. The Router v7 behaviors were already enabled through v6 future flags; the obsolete flags were removed.
- Tailwind's official migration updated utility names and registered existing helpers for `@apply`. The existing JavaScript theme/plugin configuration is retained through `@config`, together with border-color compatibility styles. Remaining global helper rules retain their original cascade.
- Server: Nodemailer 10.1.2 and Multer 2.4, plus patched locked versions of `proxy-addr`, compression, Moment and brace-expansion.
- Replaced the vulnerable Nodemon/Chokidar/Braces development chain with native `node --watch`. Production still starts with `npm start`.
- Scoped the YAML override to `@istanbuljs/load-nyc-config`: `js-yaml` 4.3.2 removes its legacy Argparse/sprintf-js dependency chain while retaining the `.load()` API used by the coverage configuration loader. Jest was not downgraded.
- Added full dependency audits to both CI test jobs. Vulnerabilities at any severity now fail those jobs.

## Validation

- Server: 350/350 Jest tests passed.
- Client: 188/188 Vitest tests passed, including a repeat after updating tailwind-merge.
- Client production build passed; ESLint reported zero errors (158 existing warnings).
- Full `npm audit` is clean for both projects.
- Offline SMTP message generation and YAML coverage-configuration parsing passed without sending email or connecting to a database.
- Parsed all 70 migrated JavaScript/JSX files: changes other than strings/formatting are confined to removing the obsolete Router future flags in `src/app.jsx`.
- Browser smoke checks: synthetic Family Hub overview/flow, Hebrew RTL, dark mode and a 390px mobile viewport; synthetic dashboard → financial-cycle navigation. No real account credentials or financial records were used. The synthetic cycle harness emitted a translation-bootstrap update-depth warning; navigation and rendering completed. Authenticated production flows were not exercised.

## Compatibility

Tailwind v4 requires Safari 16.4+, Chrome 111+ or Firefox 128+. The installed Node 24 runtime and existing Node 20.19+/22.12+ client requirement are compatible with these upgrades. There are no database migrations in this change.

References: [Tailwind upgrade guide](https://tailwindcss.com/docs/upgrade-guide), [React Router v6 → v7 guide](https://reactrouter.com/7.13.2/upgrading/v6), [Nodemailer changelog](https://github.com/nodemailer/nodemailer/blob/master/CHANGELOG.md).
