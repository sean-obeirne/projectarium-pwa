#!/usr/bin/env fish

# Projectarium PWA Deployment Script
# Usage: ./deploy.sh <remote-host|local>

if test (count $argv) -lt 1
    echo "Usage: ./deploy.sh <user@remote-host|local>"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh local                # Deploy locally"
    echo "  ./deploy.sh projectarium-pwa     # Deploy to remote server"
    exit 1
end

set TARGET $argv[1]

# Check if deploying locally
if test "$TARGET" = "local"
    echo "🏠 Deploying PWA locally..."
    echo ""
    
    # Check Docker
    if not command -v docker &> /dev/null
        echo "❌ Docker not found. Please install Docker first:"
        echo "   https://docs.docker.com/get-docker/"
        exit 1
    end
    
    # Check Docker Compose
    if not docker compose version &> /dev/null
        echo "❌ Docker Compose not found. Please install it first:"
        echo "   https://docs.docker.com/compose/install/"
        exit 1
    end
    
    echo "✅ Docker found"
    echo "✅ Docker Compose found"
    echo ""
    
    # Setup .env if doesn't exist
    if not test -f .env
        echo "⚙️  Creating .env file..."
        cp .env.example .env
    end
    
    # Start containers
    echo "🐳 Starting Docker containers..."
    docker compose up -d --build
    
    echo ""
    echo "✅ Local deployment complete!"
    echo ""
    echo "The PWA is now running on http://localhost:3000"
    echo ""
    echo "Management commands:"
    echo "  docker compose logs -f    # View logs"
    echo "  docker compose down       # Stop service"
    echo "  docker compose up -d      # Start service"
    echo "  docker compose restart    # Restart service"
    
    exit 0
end

# Remote deployment
set REMOTE $TARGET
set REMOTE_DIR "~/projectarium-pwa"

echo "🚀 Deploying Projectarium PWA to $REMOTE..."

# Check dependencies on remote
echo "🔍 Checking dependencies on remote..."
ssh $REMOTE 'bash -c "
    # Check for Docker
    if ! command -v docker &> /dev/null; then
        echo \"❌ Docker not found. Installing...\"
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker \$USER
        rm get-docker.sh
        echo \"✅ Docker installed! You may need to log out and back in for group changes to take effect.\"
    else
        echo \"✅ Docker found\"
    fi
    
    # Check for Docker Compose (bundled with newer Docker versions)
    if ! docker compose version &> /dev/null; then
        echo \"⚠️  Docker Compose plugin not found. Installing...\"
        
        # Try to install compose plugin
        DOCKER_CONFIG=\${DOCKER_CONFIG:-\$HOME/.docker}
        mkdir -p \$DOCKER_CONFIG/cli-plugins
        curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \\
            -o \$DOCKER_CONFIG/cli-plugins/docker-compose
        chmod +x \$DOCKER_CONFIG/cli-plugins/docker-compose
        
        if docker compose version &> /dev/null; then
            echo \"✅ Docker Compose installed\"
        else
            echo \"❌ Failed to install Docker Compose. Please install manually:\"
            echo \"   https://docs.docker.com/compose/install/\"
            exit 1
        fi
    else
        echo \"✅ Docker Compose found\"
    fi
"'

if test $status -ne 0
    echo "❌ Dependency check failed. Please install missing dependencies and try again."
    exit 1
end

# Create remote directory
ssh $REMOTE "mkdir -p $REMOTE_DIR"

# Copy necessary files
echo "📦 Copying configuration files..."
scp docker-compose.yml .env.example $REMOTE:$REMOTE_DIR/

# Setup buildx builder for cross-platform builds
echo "🔧 Setting up Docker buildx..."
docker buildx create --use --name arm-builder 2>/dev/null || docker buildx use arm-builder

# Build Docker image locally for ARM64
echo "🏗️  Building Docker image locally for ARM64..."
docker buildx build \
    --platform linux/arm64 \
    -t projectarium-pwa:latest \
    --load \
    .

if test $status -ne 0
    echo "❌ Docker build failed"
    exit 1
end

# Save and transfer image
echo "📦 Saving Docker image..."
docker save projectarium-pwa:latest | gzip > /tmp/projectarium-pwa.tar.gz

echo "📤 Transferring image to remote..."
scp /tmp/projectarium-pwa.tar.gz $REMOTE:/tmp/

echo "📥 Loading image on remote..."
ssh $REMOTE "docker load < /tmp/projectarium-pwa.tar.gz && rm /tmp/projectarium-pwa.tar.gz"

# Cleanup local temp file
rm /tmp/projectarium-pwa.tar.gz

# Setup .env
echo "⚙️  Setting up environment..."
ssh $REMOTE "cd $REMOTE_DIR && if [ ! -f .env ]; then cp .env.example .env; fi"

# Start the service (no --build flag since image is already loaded)
echo "🐳 Starting Docker containers..."
ssh $REMOTE "cd $REMOTE_DIR && docker compose up -d"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "The PWA is now running on $REMOTE:3000"
echo ""
echo "Management commands:"
echo "  ssh $REMOTE 'cd ~/projectarium-pwa && docker compose logs -f'     # View logs"
echo "  ssh $REMOTE 'cd ~/projectarium-pwa && docker compose down'        # Stop service"
echo "  ssh $REMOTE 'cd ~/projectarium-pwa && docker compose up -d'       # Start service"
echo "  ssh $REMOTE 'cd ~/projectarium-pwa && docker compose restart'     # Restart service"
echo ""
echo "⚠️  Remember to:"
echo "  1. Update .env on the server with correct NEXT_PUBLIC_API_URL"
echo "  2. Open port 3000 in your security group"
echo "  3. Setup nginx/SSL if you want HTTPS (optional)"
