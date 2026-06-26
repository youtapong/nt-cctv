# Web CCTV

Angular frontend for CCTV clip search and playback.

## Development server

To start a local development server, run:

```bash
npm run dev
```

Once the server is running, open your browser and navigate to `http://127.0.0.1:4200/`.

Mock login:

```text
username: admin
password: admin
```

## Video Source Config

Local video source settings are stored in `.env`.

```env
CCTV_VIDEO_SERVER_PATH=/mnt/data/video
CCTV_VIDEO_FILENAME_FORMAT={cameraName}_{yyyy}-{MM}-{dd}_{HH}-{mm}.mp4
CCTV_VIDEO_FILENAME_EXAMPLE=cctv10_2026-06-25_07-44.mp4
CCTV_API_BASE_URL=http://localhost:3000/api
CCTV_VIDEO_PUBLIC_ROUTE=/videos
```

The browser frontend cannot read `/mnt/data/video` directly. The backend should read files from `CCTV_VIDEO_SERVER_PATH`, search filenames using the configured pattern, and expose playable URLs through an API or static route such as `/videos/...`.

Use `.env.example` as the shared template and keep real `.env` values local.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Docker Deployment

### 1. Build and Push Image (Local/CI)

To build the Docker image and push it to Docker Hub with tag `1.2`, run:

```bash
# Build the Docker image with tag 1.2
docker build --platform linux/amd64 -t youtapong/ntcctv:1.2 .


# Login to Docker Hub
docker login

# Push the tag to Docker Hub
docker push youtapong/ntcctv:1.2
```

# mix command in Mac

docker build --platform linux/amd64 -t youtapong/ntcctv:1.2 .
docker push youtapong/ntcctv:1.2

### 2. Deploy on Ubuntu Server

1. Copy the `docker-compose.yml` to your server.
2. Ensure `/mnt/data/video` exists on the host or adjust the volume mapping accordingly.
3. Start the container in detached mode:

### rebuild and run in Server

docker compose down
docker compose pull
docker compose up -d

```bash
docker compose up -d
```
