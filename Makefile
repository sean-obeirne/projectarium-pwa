.PHONY: help install dev build start lint clean clean-all test format check-types deploy deploy-local pwa-start pwa-stop pwa-restart pwa-status pwa-logs pwa-rebuild

# Default target
.DEFAULT_GOAL := help

# Variables
NODE_MODULES := node_modules
NEXT_DIR := .next
PACKAGE_MANAGER := npm
REMOTE ?= projectarium-pwa
SSH_KEY := ~/.ssh/projectarium-key.pem
REMOTE_HOST := ubuntu@18.210.101.173

help: ## Show this help message
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Remote PWA management:"
	@echo "  make pwa-start      - Start PWA on remote"
	@echo "  make pwa-stop       - Stop PWA on remote"
	@echo "  make pwa-restart    - Restart PWA on remote"
	@echo "  make pwa-status     - Check PWA status"
	@echo "  make pwa-logs       - View PWA logs"
	@echo "  make pwa-rebuild    - Rebuild and restart PWA"

install: ## Install dependencies
	$(PACKAGE_MANAGER) install

dev: ## Run development server
	$(PACKAGE_MANAGER) run dev

build: ## Build for production
	$(PACKAGE_MANAGER) run build

start: ## Start production server
	$(PACKAGE_MANAGER) run start

lint: ## Run ESLint
	$(PACKAGE_MANAGER) run lint

lint-fix: ## Run ESLint with auto-fix
	$(PACKAGE_MANAGER) run lint -- --fix

check-types: ## Check TypeScript types
	npx tsc --noEmit

clean: ## Clean build artifacts
	rm -rf $(NEXT_DIR)
	rm -rf out

clean-all: clean ## Clean build artifacts and dependencies
	rm -rf $(NODE_MODULES)
	rm -rf .next
	rm -rf out
	rm -rf .turbopack

setup: install ## Setup project (install dependencies)
	@echo "✓ Project setup complete"

rebuild: clean-all install build ## Clean, reinstall, and rebuild

verify: check-types lint ## Verify code (type check and lint)
	@echo "✓ Verification complete"

# Development helpers
fresh: clean install dev ## Clean build and start fresh dev server

production-test: build start ## Build and start production server

# Deployment
deploy: ## Deploy to remote server (use REMOTE=user@host to override)
	@echo "Deploying to $(REMOTE)..."
	./deploy.sh $(REMOTE)

deploy-local: ## Build for local deployment
	./deploy.sh local

# Remote PWA management
pwa-start: ## Start PWA service on remote
	@echo "▶️  Starting PWA..."
	ssh -i $(SSH_KEY) $(REMOTE_HOST) 'systemctl --user start projectarium-pwa'
	@echo "✅ PWA started!"

pwa-stop: ## Stop PWA service on remote
	@echo "⏸️  Stopping PWA..."
	ssh -i $(SSH_KEY) $(REMOTE_HOST) 'systemctl --user stop projectarium-pwa'
	@echo "✅ PWA stopped!"

pwa-restart: ## Restart PWA service on remote
	@echo "🔄 Restarting PWA..."
	ssh -i $(SSH_KEY) $(REMOTE_HOST) 'systemctl --user restart projectarium-pwa'
	@echo "✅ PWA restarted!"

pwa-status: ## Check PWA service status on remote
	ssh -i $(SSH_KEY) $(REMOTE_HOST) 'systemctl --user status projectarium-pwa'

pwa-logs: ## View PWA logs from remote (follow mode)
	@echo "📋 Showing PWA logs (Ctrl+C to exit)..."
	ssh -i $(SSH_KEY) $(REMOTE_HOST) 'journalctl --user -u projectarium-pwa -f'

pwa-copy: ## Copy files to remote (using tar+scp)
	@echo "📦 Copying files to remote..."
	tar czf /tmp/pwa.tar.gz --exclude='node_modules' --exclude='.next/cache' --exclude='.git' --exclude='deploy.sh' .
	scp -i $(SSH_KEY) /tmp/pwa.tar.gz $(REMOTE_HOST):/tmp/
	ssh -i $(SSH_KEY) $(REMOTE_HOST) 'cd ~/projectarium-pwa && tar xzf /tmp/pwa.tar.gz && rm /tmp/pwa.tar.gz'
	rm /tmp/pwa.tar.gz
	@echo "✅ Files copied!"

pwa-install: ## Install dependencies on remote
	@echo "📦 Installing dependencies on remote..."
	ssh -i $(SSH_KEY) $(REMOTE_HOST) 'cd ~/projectarium-pwa && npm install'
	@echo "✅ Dependencies installed!"

pwa-build-remote: ## Build PWA on remote
	@echo "🏗️  Building on remote..."
	ssh -i $(SSH_KEY) $(REMOTE_HOST) 'cd ~/projectarium-pwa && npm run build'
	@echo "✅ Build complete!"

pwa-rebuild: build pwa-copy pwa-install pwa-build-remote pwa-restart ## Rebuild locally, deploy, and restart remote PWA
	@echo "✅ Full rebuild and deploy complete!"
