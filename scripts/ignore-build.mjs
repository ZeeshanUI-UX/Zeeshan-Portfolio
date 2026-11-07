// Vercel "Ignored Build Step": exit 0 = skip this commit, exit 1 = build it.
// Image uploads from the dashboard are committed with "[upload]" and published
// together with the next content save, so each upload doesn't trigger a build.
const msg = process.env.VERCEL_GIT_COMMIT_MESSAGE || '';
process.exit(msg.startsWith('[upload]') ? 0 : 1);
