.DEFAULT_GOAL := help

.PHONY: help start

help:
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  help           Show this help message"
	@echo "  start          Start the development server"
	@echo ""

start:
	npm run dev
