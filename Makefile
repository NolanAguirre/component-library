.DEFAULT_GOAL := help

.PHONY: help start build install check-dev-ids

DEV_ID_DIRS ?= src ../ui/vpr/src ../ui/lft/src ../ui/tgr/src

help:
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  help           Show this help message"
	@echo "  install        Install dependencies"
	@echo "  build          Build the component library"
	@echo "  start          Start the development server"
	@echo "  check-dev-ids  Fail on duplicate DevScope ids (DEV_ID_DIRS overrides the searched dirs)"
	@echo ""

install:
	npm install

build:
	npm run build

start:
	npm run dev

check-dev-ids:
	./scripts/check-dev-ids $(DEV_ID_DIRS)
