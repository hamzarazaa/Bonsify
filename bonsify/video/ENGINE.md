# Bonsify engine on Google Cloud

One Cloud Run Job renders a brand end to end: crawl the store, narrate, record the video, make the deck PDF,
put the video in a public bucket, and commit the brand page and PDF to GitLab so Vercel deploys it.
Nothing runs between jobs, so nothing is billed between jobs.

```
gcloud run jobs execute bonsify-engine --region us-central1 --wait \
  --args="^@^--url@https://forth-lighting.com@--name@Forth Lighting@--contact@Ahsan"
```

## One-time setup (Cloud Shell, signed in as the owner of project `bonsify-engine`)

```bash
gcloud config set project bonsify-engine
gcloud billing projects describe bonsify-engine --format="value(billingEnabled)"   # must say True
REGION=us-central1
PN=$(gcloud projects describe bonsify-engine --format='value(projectNumber)')
SA=$PN-compute@developer.gserviceaccount.com

# 1. services
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  secretmanager.googleapis.com storage.googleapis.com

# 2. buckets: media is public (videos), cache is private (narration lines)
gcloud storage buckets create gs://bonsify-engine-media --location=$REGION --uniform-bucket-level-access
gcloud storage buckets create gs://bonsify-engine-cache --location=$REGION --uniform-bucket-level-access
gcloud storage buckets add-iam-policy-binding gs://bonsify-engine-media --member=allUsers --role=roles/storage.objectViewer
cat > /tmp/cors.json <<'EOF'
[{"origin":["*"],"method":["GET","HEAD"],"responseHeader":["Content-Type","Range"],"maxAgeSeconds":3600}]
EOF
gcloud storage buckets update gs://bonsify-engine-media --cors-file=/tmp/cors.json

# 3. secrets (typed silently, never printed)
gcloud secrets create elevenlabs-key --replication-policy=automatic
read -rsp "ElevenLabs key: " K; echo; printf '%s' "$K" | gcloud secrets versions add elevenlabs-key --data-file=-; unset K

gcloud secrets create gitlab-token --replication-policy=automatic
read -rsp "GitLab token: " K; echo; printf '%s' "$K" | gcloud secrets versions add gitlab-token --data-file=-; unset K

# 4. let the job read the secrets and use the buckets; let the build run
for S in elevenlabs-key gitlab-token; do
  gcloud secrets add-iam-policy-binding $S --member=serviceAccount:$SA --role=roles/secretmanager.secretAccessor
done
for B in bonsify-engine-media bonsify-engine-cache; do
  gcloud storage buckets add-iam-policy-binding gs://$B --member=serviceAccount:$SA --role=roles/storage.objectAdmin
done
for R in roles/cloudbuild.builds.builder roles/artifactregistry.writer roles/logging.logWriter; do
  gcloud projects add-iam-policy-binding bonsify-engine --member=serviceAccount:$SA --role=$R --condition=None
done
```

The GitLab token: GitLab project `hamzaraza/bonsify.io` > Settings > Access tokens > name `engine`,
role Maintainer (needed to push to protected `main`), scopes `api` and `read_repository`, no expiry or a long one.

## Deploy the job

```bash
read -rsp "GitLab token (to clone): " GT; echo
git clone https://oauth2:$GT@gitlab.com/hamzaraza/bonsify.io.git && unset GT
cd bonsify.io/bonsify

gcloud run jobs deploy bonsify-engine --source . --region us-central1 \
  --cpu 8 --memory 16Gi --task-timeout 30m --max-retries 0 --execution-environment gen2 \
  --set-env-vars VOICE_ID=qREDZhi8J1uvY1jmr1Z8,BUCKET_DIR=/mnt/media,CACHE_DIR=/mnt/cache,PUBLIC_BASE=https://storage.googleapis.com/bonsify-engine-media,GITLAB_PROJECT=hamzaraza/bonsify.io \
  --set-secrets ELEVENLABS_API_KEY=elevenlabs-key:latest,GITLAB_TOKEN=gitlab-token:latest \
  --add-volume name=media,type=cloud-storage,bucket=bonsify-engine-media --add-volume-mount volume=media,mount-path=/mnt/media \
  --add-volume name=cache,type=cloud-storage,bucket=bonsify-engine-cache --add-volume-mount volume=cache,mount-path=/mnt/cache
```

If Cloud Run refuses 8 CPUs (trial quota), use `--cpu 4 --memory 8Gi`; it is slower but works.

## Run a brand

Same command as at the top. Logs show timings per stage; the last line is a JSON result with the page link.
Run several at once by starting several executions; each is its own container.
A brand that already has a record can be redone with `--skip-crawl --slug <slug> --name "<Name>"`.

## What it writes

- Bucket `bonsify-engine-media`: `videos/<slug>.mp4`, `-poster.jpg`, `.vtt`, `-deck.pdf`; `results/<slug>.json`
- GitLab `main`: `bonsify/content/proposals/<slug>.json` (with the video links) and `bonsify/public/decks/<slug>-deck.pdf`
- Bucket `bonsify-engine-cache`: narration lines, so a line is only paid for once

## Cost, roughly

An 8 vCPU, 16 GiB job costs about $0.05 to $0.10 for a 4 to 5 minute run. Narration is billed by ElevenLabs separately.
