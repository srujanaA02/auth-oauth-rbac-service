# Deployment Guide

This guide covers deploying the OAuth 2.0 Authentication Service to production environments.

## Table of Contents

1. [AWS Deployment](#aws-deployment)
2. [Heroku Deployment](#heroku-deployment)
3. [DigitalOcean Deployment](#digitalocean-deployment)
4. [Docker Registry Setup](#docker-registry-setup)
5. [Production Checklist](#production-checklist)
6. [Monitoring & Logging](#monitoring--logging)
7. [Security Best Practices](#security-best-practices)

---

## AWS Deployment

### Using AWS ECS (Elastic Container Service)

#### Prerequisites
- AWS Account with appropriate permissions
- AWS CLI configured
- Docker image pushed to ECR (Elastic Container Registry)

#### Step 1: Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name oauth-auth-service \
  --region us-east-1
```

#### Step 2: Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag image
docker build -t oauth-auth-service:latest .
docker tag oauth-auth-service:latest <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/oauth-auth-service:latest

# Push to ECR
docker push <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/oauth-auth-service:latest
```

#### Step 3: Create ECS Task Definition

Create `ecs-task-definition.json`:

```json
{
  "family": "oauth-auth-service",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "<aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/oauth-auth-service:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "API_PORT",
          "value": "8080"
        },
        {
          "name": "DATABASE_URL",
          "value": "postgresql://user:password@db.region.rds.amazonaws.com/oauth_db"
        },
        {
          "name": "REDIS_URL",
          "value": "redis://cache.region.cache.amazonaws.com:6379"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/oauth-auth-service",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Step 4: Register Task Definition

```bash
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json
```

#### Step 5: Create ECS Service

```bash
aws ecs create-service \
  --cluster oauth-cluster \
  --service-name oauth-auth-service \
  --task-definition oauth-auth-service \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=app,containerPort=8080
```

---

## Heroku Deployment

### Prerequisites
- Heroku Account
- Heroku CLI installed
- GitHub repository

### Step 1: Create Procfile

```
web: npm start
```

### Step 2: Create app.json

```json
{
  "name": "oauth-auth-service",
  "description": "Production-ready OAuth 2.0 authentication service",
  "repository": "https://github.com/srujanaA02/auth-oauth-rbac-service",
  "keywords": ["oauth", "authentication", "jwt", "rbac"],
  "buildpacks": [
    {
      "url": "heroku/nodejs"
    }
  ],
  "env": {
    "API_PORT": {
      "description": "API port",
      "value": "3000"
    },
    "DATABASE_URL": {
      "description": "PostgreSQL connection URL"
    },
    "REDIS_URL": {
      "description": "Redis connection URL"
    },
    "JWT_SECRET": {
      "description": "JWT secret key",
      "generator": "secret"
    },
    "JWT_REFRESH_SECRET": {
      "description": "JWT refresh secret",
      "generator": "secret"
    }
  },
  "addons": [
    "heroku-postgresql:standard-0",
    "heroku-redis:premium-0"
  ]
}
```

### Step 3: Deploy

```bash
# Login to Heroku
heroku login

# Create app
heroku create oauth-auth-service

# Add buildpacks
heroku buildpacks:add heroku/nodejs

# Set environment variables
heroku config:set JWT_SECRET=your-secret-key
heroku config:set JWT_REFRESH_SECRET=your-refresh-secret

# Deploy
git push heroku main

# Run migrations
heroku run npx prisma db push

# View logs
heroku logs --tail
```

---

## DigitalOcean Deployment

### Using DigitalOcean App Platform

#### Step 1: Connect Repository

1. Go to DigitalOcean App Platform
2. Click "Create App"
3. Select GitHub repository
4. Authorize GitHub

#### Step 2: Configure App

```yaml
name: oauth-auth-service
services:
- name: api
  github:
    branch: main
    repo: srujanaA02/auth-oauth-rbac-service
  build_command: npm install
  run_command: npm start
  http_port: 8080
  envs:
  - key: API_PORT
    value: "8080"
  - key: DATABASE_URL
    scope: RUN_TIME
  - key: REDIS_URL
    scope: RUN_TIME
  - key: JWT_SECRET
    scope: RUN_TIME
    value: ${JWT_SECRET}

databases:
- engine: PG
  name: postgres
  version: "13"

- engine: REDIS
  name: redis
  version: "6"
```

#### Step 3: Deploy

1. Click "Deploy"
2. Wait for deployment to complete (5-10 minutes)
3. Access your app via provided URL

---

## Docker Registry Setup

### Setup Private Docker Registry

```bash
# Create Docker image
docker build -t oauth-auth-service:1.0.0 .

# Tag for registry
docker tag oauth-auth-service:1.0.0 registry.example.com/oauth-auth-service:1.0.0

# Push to registry
docker push registry.example.com/oauth-auth-service:1.0.0

# Deploy from registry
docker pull registry.example.com/oauth-auth-service:1.0.0
docker-compose up
```

---

## Production Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL/TLS certificates obtained
- [ ] Domain configured
- [ ] Backup strategy in place

### Deployment
- [ ] Code deployed successfully
- [ ] Services running and healthy
- [ ] Health checks passing
- [ ] Logs accessible
- [ ] Monitoring configured

### Post-Deployment
- [ ] Smoke tests passed
- [ ] Performance metrics baseline established
- [ ] Alerts configured
- [ ] Runbook documented
- [ ] Incident response plan reviewed

---

## Monitoring & Logging

### CloudWatch (AWS)

```bash
# Create log group
aws logs create-log-group --log-group-name /oauth-auth-service

# Put retention policy
aws logs put-retention-policy \
  --log-group-name /oauth-auth-service \
  --retention-in-days 30
```

### Datadog Integration

```javascript
// Add to your app.js
const StatsD = require('node-statsd').StatsD;

const statsd = new StatsD({
  host: process.env.DATADOG_AGENT_HOST || 'localhost',
  port: 8125,
  tags: ['env:production', 'service:oauth-auth']
});

// Track metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    statsd.timing('http.request.duration', duration);
    statsd.increment('http.request.count', 1, [`method:${req.method}`, `path:${req.path}`]);
  });
  next();
});
```

### Sentry Configuration

```javascript
// Add to your server.js
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

---

## Security Best Practices

### 1. Environment Variables
```bash
# Use strong secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Never commit secrets
echo ".env" >> .gitignore
```

### 2. HTTPS Only
```nginx
# Nginx configuration
server {
    listen 443 ssl http2;
    server_name api.example.com;
    
    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
    
    # Force HTTPS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
}

server {
    listen 80;
    return 301 https://$server_name$request_uri;
}
```

### 3. Database Security
```sql
-- Create dedicated app user
CREATE USER oauth_app WITH PASSWORD 'strong_password';

-- Grant minimal permissions
GRANT CONNECT ON DATABASE oauth_db TO oauth_app;
GRANT USAGE ON SCHEMA public TO oauth_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO oauth_app;

-- Enable SSL
-- Add to postgresql.conf:
-- ssl = on
-- ssl_cert_file = '/path/to/cert.pem'
-- ssl_key_file = '/path/to/key.pem'
```

### 4. Rate Limiting Configuration
```javascript
// Production rate limiting
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Requests per window
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:', // Rate limit prefix
  }),
  message: 'Too many requests, please try again later',
  standardHeaders: true,
});

app.use('/api/', limiter);
```

### 5. API Key Management
```bash
# Rotate API keys regularly
# Use Azure Key Vault or AWS Secrets Manager

# Example AWS Secrets Manager
aws secretsmanager create-secret \
  --name oauth-service/jwt-secret \
  --secret-string $(openssl rand -base64 32)
```

---

## Rollback Procedure

### AWS ECS
```bash
# Revert to previous task definition
aws ecs update-service \
  --cluster oauth-cluster \
  --service oauth-auth-service \
  --task-definition oauth-auth-service:previous-version

# Monitor rollout
aws ecs describe-services \
  --cluster oauth-cluster \
  --services oauth-auth-service
```

### Heroku
```bash
# View release history
heroku releases

# Rollback to previous release
heroku releases:rollback
```

### DigitalOcean
1. Go to App Platform
2. Click "Deployments"
3. Select previous deployment
4. Click "Revert"

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Services won't start | Check logs: `docker-compose logs` |
| Database connection fails | Verify DATABASE_URL format and network connectivity |
| Redis errors | Check REDIS_URL and Redis service status |
| 502 Bad Gateway | Verify app is listening on correct port |
| SSL certificate error | Renew certificate using Certbot or provider |

### Debug Commands

```bash
# Check service status
docker-compose ps
systemctl status oauth-service

# View logs
docker-compose logs -f
journalctl -u oauth-service -f

# Database connection test
psql $DATABASE_URL -c "SELECT 1"

# Redis connection test
redis-cli -u $REDIS_URL ping
```

---

## Support & Resources

- [Docker Documentation](https://docs.docker.com/)
- [AWS ECS Guide](https://docs.aws.amazon.com/ecs/)
- [Heroku Deployment](https://devcenter.heroku.com/)
- [DigitalOcean Platform](https://www.digitalocean.com/docs/app-platform/)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment/)
