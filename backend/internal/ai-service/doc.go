// Package ai is the root namespace for AI-related capabilities in this backend.
// Import leaf packages (e.g. ai/notifications/cycle, ai/agents); this package has no runtime API.
//
// Layout:
//   foundation   — shared types and cross-capability helpers
//   notifications — intelligent push pipeline (rules, scheduling, content, dispatch)
//   agents       — autonomous multi-step agents (tools, planning)
//   assistants   — user-facing assist flows (chat, RAG), distinct from batch notifications
package ai
