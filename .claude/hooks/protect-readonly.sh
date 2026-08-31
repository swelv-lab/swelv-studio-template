#!/usr/bin/env bash
# PreToolUse hook: hard-block any Edit/Write/NotebookEdit targeting a read-only
# folder.
#
#   reference/  someone else's live source, vendored here purely so content can
#               match it exactly. Changing it here changes nothing real and
#               silently desyncs the reference.
#   examples/   finished work in the demo brand, kept as a house-style reference.
#               New work belongs in the pipelines, not in here.
#
# Exit 2 blocks the tool call and returns the message below to the agent.
set -u

f=$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')
[ -z "$f" ] && exit 0

PROJECT="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Normalise to an absolute path so relative targets are caught too.
case "$f" in
  /*) abs="$f" ;;
  *)  abs="$PROJECT/$f" ;;
esac

case "$abs" in
  "$PROJECT"/reference/*|"$PROJECT"/reference)
    echo "Blocked: reference/ is a read-only copy of live source, here only so content can match it. Never edit it — change the real thing in its own repo." >&2
    exit 2
    ;;
  "$PROJECT"/examples/*|"$PROJECT"/examples)
    echo "Blocked: examples/ is finished reference work in the demo brand. Read it to learn the house style, but make new work in posts/ · collateral/ · decks/ · content/ instead." >&2
    exit 2
    ;;
esac

exit 0
