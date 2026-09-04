# Deploy on Render

1. Push this folder to a GitHub repository.
2. In Render, create **New Web Service** and select the repository.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Render supplies `PORT` automatically; the server binds to `0.0.0.0`.
6. Open the generated Render URL. The UI is served from `/public/index.html` and obfuscation uses `POST /api/obfuscate`.

Health check: `/health`
