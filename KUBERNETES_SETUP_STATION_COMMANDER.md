# Kubernetes Setup Guide - Station Commander Feature

## 🚢 Kubernetes-Specific Setup

Since your application and database run on Kubernetes, follow these steps:

### Step 1: Run Database Migration in Kubernetes

#### Option A: Using kubectl exec (Recommended)
```bash
# Find your postgres pod name
kubectl get pods -n <your-namespace> | grep postgres

# Copy migration file to the pod
kubectl cp migrations/002_add_station_commander_features.sql \
  <postgres-pod-name>:/tmp/migration.sql \
  -n <your-namespace>

# Execute the migration
kubectl exec -it <postgres-pod-name> -n <your-namespace> -- \
  psql -U <db-user> -d <db-name> -f /tmp/migration.sql
```

#### Option B: Using a Job
```bash
# Create a Kubernetes Job to run the migration
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: army-recruiter-migration-002
  namespace: <your-namespace>
spec:
  template:
    spec:
      containers:
      - name: migration
        image: postgres:15
        command:
        - sh
        - -c
        - |
          cat <<'MIGRATION_EOF' | psql -h <db-host> -U <db-user> -d <db-name>
          -- Paste the contents of 002_add_station_commander_features.sql here
          MIGRATION_EOF
        env:
        - name: PGPASSWORD
          valueFrom:
            secretKeyRef:
              name: <your-db-secret>
              key: password
      restartPolicy: Never
  backoffLimit: 3
EOF

# Check job status
kubectl get jobs -n <your-namespace>
kubectl logs job/army-recruiter-migration-002 -n <your-namespace>
```

#### Option C: Port-forward and Run Locally
```bash
# Port-forward the database service
kubectl port-forward svc/<postgres-service-name> 5432:5432 -n <your-namespace>

# In another terminal, run the migration locally
psql -h localhost -U <db-user> -d <db-name> -f migrations/002_add_station_commander_features.sql
```

### Step 2: Make Yourself an Admin

```bash
# Option A: Using kubectl exec
kubectl exec -it <postgres-pod-name> -n <your-namespace> -- \
  psql -U <db-user> -d <db-name> -c \
  "UPDATE users SET role = 'admin' WHERE email = 'alex.cybitdevs@gmail.com';"

# Option B: Using port-forward (from Step 1, Option C)
psql -h localhost -U <db-user> -d <db-name> -c \
  "UPDATE users SET role = 'admin' WHERE email = 'alex.cybitdevs@gmail.com';"
```

### Step 3: Restart Application Pods

```bash
# Option A: Rolling restart (no downtime)
kubectl rollout restart deployment/<app-deployment-name> -n <your-namespace>

# Option B: Delete pods (they'll recreate automatically)
kubectl delete pods -l app=<your-app-label> -n <your-namespace>

# Option C: Scale down and up
kubectl scale deployment/<app-deployment-name> --replicas=0 -n <your-namespace>
kubectl scale deployment/<app-deployment-name> --replicas=3 -n <your-namespace>

# Watch the restart
kubectl get pods -n <your-namespace> -w
```

### Step 4: Verify Deployment

```bash
# Check pod status
kubectl get pods -n <your-namespace>

# Check application logs
kubectl logs -f deployment/<app-deployment-name> -n <your-namespace>

# Check for any errors
kubectl logs deployment/<app-deployment-name> -n <your-namespace> --tail=50 | grep -i error
```

## 🔍 Verification Commands

### Verify Database Changes
```bash
# Port-forward or exec into postgres pod, then:
psql -U <db-user> -d <db-name>

# Check tables exist
\dt stations
\dt station_commander_requests

# Check new columns in users table
\d users

# Check your admin role
SELECT id, email, role FROM users WHERE email = 'alex.cybitdevs@gmail.com';

# Check sample data
SELECT * FROM stations WHERE station_code = 'DEFAULT-001';
```

### Verify Application is Running
```bash
# Check pod health
kubectl get pods -n <your-namespace>

# Check service endpoints
kubectl get svc -n <your-namespace>

# Test the application endpoint
kubectl port-forward svc/<app-service-name> 8080:5000 -n <your-namespace>
# Then open: http://localhost:8080
```

## 🔧 Environment Variables Check

Make sure your Kubernetes deployment has the required SMTP environment variables:

```yaml
# Check current env vars
kubectl get deployment <app-deployment-name> -n <your-namespace> -o yaml | grep -A 10 env

# If missing, update deployment:
apiVersion: apps/v1
kind: Deployment
metadata:
  name: <app-deployment-name>
spec:
  template:
    spec:
      containers:
      - name: app
        env:
        - name: SMTP_HOST
          value: "smtp.gmail.com"
        - name: SMTP_PORT
          value: "587"
        - name: SMTP_USER
          valueFrom:
            secretKeyRef:
              name: smtp-credentials
              key: username
        - name: SMTP_PASSWORD
          valueFrom:
            secretKeyRef:
              name: smtp-credentials
              key: password
```

## 📊 Complete Setup Script (Copy-Paste Ready)

```bash
#!/bin/bash
# Setup script for Station Commander feature on Kubernetes

# Configuration - UPDATE THESE
NAMESPACE="your-namespace"
POSTGRES_POD="postgres-pod-name"
POSTGRES_SERVICE="postgres-service"
APP_DEPLOYMENT="army-recruiter-app"
DB_USER="your-db-user"
DB_NAME="your-db-name"
ADMIN_EMAIL="alex.cybitdevs@gmail.com"

echo "🚀 Starting Station Commander Feature Setup..."

# Step 1: Copy and run migration
echo "📦 Step 1: Running database migration..."
kubectl cp migrations/002_add_station_commander_features.sql \
  $POSTGRES_POD:/tmp/migration.sql -n $NAMESPACE

kubectl exec -it $POSTGRES_POD -n $NAMESPACE -- \
  psql -U $DB_USER -d $DB_NAME -f /tmp/migration.sql

echo "✅ Migration completed"

# Step 2: Set admin role
echo "👤 Step 2: Setting admin role..."
kubectl exec -it $POSTGRES_POD -n $NAMESPACE -- \
  psql -U $DB_USER -d $DB_NAME -c \
  "UPDATE users SET role = 'admin' WHERE email = '$ADMIN_EMAIL';"

echo "✅ Admin role set"

# Step 3: Restart application
echo "🔄 Step 3: Restarting application..."
kubectl rollout restart deployment/$APP_DEPLOYMENT -n $NAMESPACE

# Wait for rollout
kubectl rollout status deployment/$APP_DEPLOYMENT -n $NAMESPACE

echo "✅ Application restarted"

# Step 4: Verify
echo "🔍 Step 4: Verifying setup..."
kubectl exec -it $POSTGRES_POD -n $NAMESPACE -- \
  psql -U $DB_USER -d $DB_NAME -c \
  "SELECT email, role FROM users WHERE email = '$ADMIN_EMAIL';"

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Access your application"
echo "2. Login as $ADMIN_EMAIL"
echo "3. Navigate to 'Admin Requests' in the menu"
echo "4. Test by creating a station commander request"
echo ""
```

## 🐛 Troubleshooting

### Issue: Can't find postgres pod
```bash
# List all pods
kubectl get pods -n <namespace>

# Look for pods with postgres in the name
kubectl get pods -n <namespace> | grep -i postgres

# Or check all pods in all namespaces
kubectl get pods --all-namespaces | grep -i postgres
```

### Issue: Permission denied running migration
```bash
# Check if you're using the correct database user
kubectl exec -it <postgres-pod> -n <namespace> -- \
  psql -U postgres -c "\du"

# Try using postgres superuser
kubectl exec -it <postgres-pod> -n <namespace> -- \
  psql -U postgres -d <db-name> -f /tmp/migration.sql
```

### Issue: Application not picking up changes
```bash
# Force restart by deleting pods
kubectl delete pods -l app=<app-label> -n <namespace>

# Check if new pods are running
kubectl get pods -n <namespace> -w

# Check application logs
kubectl logs -f <new-pod-name> -n <namespace>
```

### Issue: Database connection issues
```bash
# Check database service
kubectl get svc <postgres-service> -n <namespace>

# Check if app can reach database
kubectl exec -it <app-pod-name> -n <namespace> -- \
  nc -zv <postgres-service> 5432

# Check database pod logs
kubectl logs <postgres-pod> -n <namespace>
```

### Issue: Can't access admin page (404)
```bash
# Check if the app build includes new files
kubectl exec -it <app-pod-name> -n <namespace> -- ls -la /app/client/dist

# May need to rebuild and redeploy
docker build -t <your-registry>/army-recruiter:latest .
docker push <your-registry>/army-recruiter:latest
kubectl rollout restart deployment/<app-deployment> -n <namespace>
```

## 📦 If You Need to Rebuild the Docker Image

Since you made code changes, you may need to rebuild:

```bash
# From your project root
cd /Users/alexmoran/Documents/programming/ArmyRecruitTool

# Build new image
docker build -t <your-registry>/army-recruiter-tool:latest .

# Tag with version
docker tag <your-registry>/army-recruiter-tool:latest \
  <your-registry>/army-recruiter-tool:v1.1.0

# Push to registry
docker push <your-registry>/army-recruiter-tool:latest
docker push <your-registry>/army-recruiter-tool:v1.1.0

# Update Kubernetes deployment
kubectl set image deployment/<app-deployment> \
  <container-name>=<your-registry>/army-recruiter-tool:v1.1.0 \
  -n <namespace>

# Or update deployment yaml and apply
kubectl apply -f k8s/deployment.yaml -n <namespace>
```

## 🎯 Quick Command Reference

```bash
# Get pod names
kubectl get pods -n <namespace>

# Check logs
kubectl logs -f <pod-name> -n <namespace>

# Execute SQL
kubectl exec -it <postgres-pod> -n <namespace> -- psql -U <user> -d <db>

# Port forward database
kubectl port-forward svc/<db-service> 5432:5432 -n <namespace>

# Port forward application
kubectl port-forward svc/<app-service> 8080:5000 -n <namespace>

# Restart deployment
kubectl rollout restart deployment/<app-deployment> -n <namespace>

# Watch pod status
kubectl get pods -n <namespace> -w

# Describe pod (for troubleshooting)
kubectl describe pod <pod-name> -n <namespace>
```

## 📚 Access URLs After Setup

```bash
# Port-forward to access locally
kubectl port-forward svc/<app-service> 8080:5000 -n <namespace>

# Then access:
# - Admin Dashboard: http://localhost:8080/admin/requests
# - Station Commander: http://localhost:8080/station-commander
# - Registration: http://localhost:8080/register

# Or if you have an ingress:
# - https://your-domain.com/admin/requests
# - https://your-domain.com/station-commander
```

## ✅ Success Checklist

- [ ] Migration file copied to postgres pod
- [ ] Migration executed successfully
- [ ] Admin role set in database
- [ ] Application pods restarted
- [ ] New pods are running and healthy
- [ ] Can access application
- [ ] Can see admin menu when logged in
- [ ] Registration form shows account type selection
- [ ] Can create test station commander request
- [ ] Email notification received
- [ ] Can approve/deny from admin dashboard

---

**Environment:** Kubernetes  
**Setup Time:** ~10 minutes  
**Prerequisites:** kubectl access, database credentials, docker registry access

