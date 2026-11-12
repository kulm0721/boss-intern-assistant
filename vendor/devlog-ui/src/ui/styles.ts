/**
 * UI Styles for DevLogger
 *
 * CSS-in-JS for Shadow DOM isolation.
 * Design philosophy: Clean, readable, non-intrusive.
 */

export const DARK_COLORS = {
  // Background
  bgPrimary: '#1e1e1e',
  bgSecondary: '#252526',
  bgHover: '#2a2a2a',
  bgHeader: '#333333',

  // Text
  textPrimary: '#cccccc',
  textSecondary: '#858585',
  textMuted: '#6e6e6e',

  // Log Levels
  levelDebug: '#6e6e6e',
  levelInfo: '#3794ff',
  levelWarn: '#cca700',
  levelError: '#f14c4c',
  diffAdded: '#50c878',
  textOnAccent: '#ffffff',
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowFloating: 'rgba(0, 0, 0, 0.3)',

  // Accents
  border: '#3c3c3c',
  scrollbar: '#4a4a4a',
  scrollbarHover: '#5a5a5a',

  // Interactive
  buttonBg: '#0e639c',
  buttonHover: '#1177bb',
} as const

export const COLORS = {
  // Background
  bgPrimary: '#ffffff',
  bgSecondary: '#f8f8f8',
  bgHover: '#f3f3f3',
  bgHeader: '#f5f5f5',

  // Text
  textPrimary: '#1f1f1f',
  textSecondary: '#5f5f5f',
  textMuted: '#8a8a8a',

  // Log Levels
  levelDebug: '#8a8a8a',
  levelInfo: '#005fb8',
  levelWarn: '#b76e00',
  levelError: '#d13438',
  diffAdded: '#22863a',
  textOnAccent: '#ffffff',
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowFloating: 'rgba(0, 0, 0, 0.3)',

  // Accents
  border: '#dcdcdc',
  scrollbar: '#c2c2c2',
  scrollbarHover: '#a8a8a8',

  // Interactive
  buttonBg: '#0e639c',
  buttonHover: '#1177bb',
} as const

const colorVariables = (colors: Record<keyof typeof COLORS, string>) =>
  Object.entries(colors)
    .map(([key, value]) => `--${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}: ${value};`)
    .join('\n    ')

export const STYLES = `
  :host {
    ${colorVariables(COLORS)}

    all: initial;
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 12px;
    line-height: 1.4;
    color: var(--text-primary);
  }

  /* Follow the system unless the page explicitly selects a light theme. */
  @media (prefers-color-scheme: dark) {
    :host {
      ${colorVariables(DARK_COLORS)}
    }

    :host-context(html[data-darkreader-scheme='light']:not([dark])) {
      ${colorVariables(COLORS)}
    }
  }

  :host-context(html[data-darkreader-scheme='dark']),
  :host-context(html[dark]) {
    ${colorVariables(DARK_COLORS)}
  }

  * {
    box-sizing: border-box;
  }

  /* Container */
  .devlogger-container {
    max-height: 700px;
    min-height: 400px;
    background: var(--bg-primary);
    display: flex;
    flex-direction: column;
    box-shadow: -2px 0 8px var(--shadow);
  }

  /* Header */
  .devlogger-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--bg-header);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .devlogger-title {
    font-weight: 600;
    font-size: 13px;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .devlogger-badge {
    background: var(--level-info);
    color: var(--text-on-accent);
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 500;
  }

  .devlogger-actions {
    display: flex;
    gap: 4px;
  }

  .devlogger-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    transition: all 0.15s ease;
  }

  .devlogger-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .devlogger-btn.active {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .devlogger-btn-primary {
    background: var(--button-bg);
    color: var(--text-on-accent);
  }

  .devlogger-btn-primary:hover {
    background: var(--button-hover);
    color: var(--text-on-accent);
  }

  /* Log List */
  .devlogger-logs {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .devlogger-logs::-webkit-scrollbar {
    width: 8px;
  }

  .devlogger-logs::-webkit-scrollbar-track {
    background: var(--bg-primary);
  }

  .devlogger-logs::-webkit-scrollbar-thumb {
    background: var(--scrollbar);
    border-radius: 4px;
  }

  .devlogger-logs::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-hover);
  }

  .devlogger-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
    font-style: italic;
  }

  /* Log Entry */
  .log-entry {
    border-bottom: 1px solid var(--border);
    padding: 8px 12px;
    transition: background 0.1s ease;
  }

  .log-entry:hover {
    background: var(--bg-hover);
  }

  .log-entry-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .log-level {
    font-weight: 600;
    font-size: 10px;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 3px;
    min-width: 45px;
    text-align: center;
  }

  .log-level-debug {
    background: color-mix(in srgb, var(--level-debug) 20%, transparent);
    color: var(--level-debug);
  }

  .log-level-info {
    background: color-mix(in srgb, var(--level-info) 15%, transparent);
    color: var(--level-info);
  }

  .log-level-warn {
    background: color-mix(in srgb, var(--level-warn) 15%, transparent);
    color: var(--level-warn);
  }

  .log-level-error {
    background: color-mix(in srgb, var(--level-error) 15%, transparent);
    color: var(--level-error);
  }

  .log-time {
    color: var(--text-muted);
    font-size: 11px;
  }

  .log-source {
    color: var(--text-secondary);
    font-size: 11px;
    margin-left: auto;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .log-source:hover {
    color: var(--level-info);
  }

  .log-context {
    font-size: 10px;
    color: var(--level-info);
    background: color-mix(in srgb, var(--level-info) 10%, transparent);
    padding: 2px 6px;
    border-radius: 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .log-entry-in-span {
    border-left: 2px solid var(--level-info);
    padding-left: 10px;
  }

  .span-group {
    border-bottom: 1px solid var(--border);
  }

  .span-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--bg-secondary);
    cursor: pointer;
  }

  .span-header:hover {
    background: var(--bg-hover);
  }

  .span-toggle {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 2px;
  }

  .span-toggle::before {
    content: '▾';
    display: inline-block;
    transition: transform 0.15s ease;
  }

  .span-group.collapsed .span-toggle::before {
    transform: rotate(-90deg);
  }

  .span-title {
    font-weight: 600;
    font-size: 12px;
    color: var(--text-primary);
  }

  .span-status {
    font-size: 10px;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 3px;
    color: var(--text-primary);
    background: var(--bg-primary);
  }

  .span-status-running {
    color: var(--level-info);
    background: color-mix(in srgb, var(--level-info) 15%, transparent);
  }

  .span-status-success {
    color: var(--level-info);
    background: color-mix(in srgb, var(--level-info) 15%, transparent);
  }

  .span-status-error {
    color: var(--level-error);
    background: color-mix(in srgb, var(--level-error) 15%, transparent);
  }

  .span-duration {
    color: var(--text-muted);
    font-size: 11px;
  }

  .span-count {
    margin-left: auto;
    color: var(--text-secondary);
    font-size: 11px;
  }

  .span-logs {
    padding-left: 4px;
  }

  .span-group.collapsed .span-logs {
    display: none;
  }

  .log-message {
    color: var(--text-primary);
    word-break: break-word;
    margin-bottom: 4px;
  }

  /* Data Display */
  .log-data {
    margin-top: 6px;
  }

  .log-data-toggle {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 2px 0;
    font-size: 11px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .log-data-toggle:hover {
    color: var(--text-primary);
  }

  .log-data-toggle::before {
    content: '▶';
    font-size: 8px;
    transition: transform 0.15s ease;
  }

  .log-data-toggle.expanded::before {
    transform: rotate(90deg);
  }

  .log-data-content {
    display: none;
    margin-top: 6px;
    padding: 8px;
    background: var(--bg-secondary);
    border-radius: 4px;
    font-size: 11px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .log-data-content.visible {
    display: block;
  }

  /* Toggle Button (floating) */
  .devlogger-toggle {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--button-bg);
    color: var(--text-on-accent);
    border: none;
    cursor: pointer;
    box-shadow: 0 2px 8px var(--shadow-floating);
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 99998;
  }

  .devlogger-toggle:hover {
    background: var(--button-hover);
    transform: scale(1.05);
  }

  .devlogger-toggle.hidden {
    display: none;
  }

  /* Footer / Status */
  .devlogger-footer {
    padding: 6px 12px;
    background: var(--bg-header);
    border-top: 1px solid var(--border);
    font-size: 11px;
    color: var(--text-muted);
    display: flex;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .devlogger-shortcut {
    opacity: 0.7;
  }

  /* Resource Monitor */
  .resource-container {
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
    padding: 8px 12px;
    display: none;
  }

  .resource-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    color: var(--text-secondary);
    font-size: 11px;
  }

  .resource-metrics {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 6px 12px;
    font-size: 11px;
  }

  .resource-label {
    color: var(--text-muted);
  }

  .resource-value {
    color: var(--text-primary);
    font-weight: 600;
  }

  .resource-note {
    margin-top: 6px;
    color: var(--text-muted);
    font-size: 11px;
  }

  /* Filter Bar */
  .filter-bar {
    padding: 8px 12px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .filter-bar.filter-active {
    background: color-mix(in srgb, var(--level-info) 8%, transparent);
    border-bottom-color: var(--level-info);
  }

  .filter-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .filter-levels {
    display: flex;
    gap: 2px;
  }

  .filter-level-btn {
    width: 24px;
    height: 24px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 10px;
    font-weight: 600;
    transition: all 0.15s ease;
  }

  .filter-level-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .filter-level-btn.active {
    color: var(--text-on-accent);
  }

  .filter-level-btn.active[data-level="debug"] {
    background: var(--level-debug);
    border-color: var(--level-debug);
  }

  .filter-level-btn.active[data-level="info"] {
    background: var(--level-info);
    border-color: var(--level-info);
  }

  .filter-level-btn.active[data-level="warn"] {
    background: var(--level-warn);
    border-color: var(--level-warn);
  }

  .filter-level-btn.active[data-level="error"] {
    background: var(--level-error);
    border-color: var(--level-error);
  }

  .filter-search {
    flex: 1;
  }

  .filter-file {
    width: 120px;
  }

  .filter-input {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 11px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s ease;
  }

  .filter-input::placeholder {
    color: var(--text-muted);
  }

  .filter-input:focus {
    border-color: var(--level-info);
  }

  .filter-clear-btn {
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 4px;
    background: color-mix(in srgb, var(--level-error) 20%, transparent);
    color: var(--level-error);
    cursor: pointer;
    font-size: 12px;
    transition: all 0.15s ease;
  }

  .filter-clear-btn:hover {
    background: var(--level-error);
    color: var(--text-on-accent);
  }

  .filter-status {
    margin-top: 6px;
    font-size: 10px;
    color: var(--level-info);
  }

  /* No results state */
  .devlogger-no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
    gap: 8px;
  }

  .devlogger-no-results-icon {
    font-size: 24px;
    opacity: 0.5;
  }

  .devlogger-no-results-text {
    font-style: italic;
  }

  /* Diff Display */
  .diff-container {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 11px;
  }

  .diff-summary {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }

  .diff-count {
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: 600;
  }

  .diff-count.diff-added {
    background: color-mix(in srgb, var(--diff-added) 20%, transparent);
    color: var(--diff-added);
  }

  .diff-count.diff-removed {
    background: color-mix(in srgb, var(--level-error) 20%, transparent);
    color: var(--level-error);
  }

  .diff-count.diff-changed {
    background: color-mix(in srgb, var(--level-warn) 20%, transparent);
    color: var(--level-warn);
  }

  .diff-count.diff-unchanged {
    background: var(--bg-hover);
    color: var(--text-muted);
  }

  .diff-changes {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .diff-entry {
    padding: 2px 6px;
    border-radius: 3px;
    display: flex;
    gap: 6px;
  }

  .diff-entry.diff-added {
    background: color-mix(in srgb, var(--diff-added) 10%, transparent);
    color: var(--diff-added);
  }

  .diff-entry.diff-removed {
    background: color-mix(in srgb, var(--level-error) 10%, transparent);
    color: var(--level-error);
  }

  .diff-entry.diff-changed {
    background: color-mix(in srgb, var(--level-warn) 10%, transparent);
    color: var(--level-warn);
  }

  .diff-icon {
    font-weight: bold;
    width: 12px;
    flex-shrink: 0;
  }

  .diff-path {
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  .diff-value {
    word-break: break-all;
  }

  .log-data-diff .log-data-toggle {
    color: var(--level-info);
  }
`
