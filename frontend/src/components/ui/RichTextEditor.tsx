"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * Lightweight, dependency-free WYSIWYG editor.
 *
 * Designed to look and feel like Summernote so it can drop into the existing
 * "Нийтлэлийн агуулга" / news editor / trip description areas without pulling
 * in a heavy package. Renders a `contentEditable` surface plus a hidden input
 * (when `name` is set) so the HTML can be submitted with regular HTML forms.
 */
export type RichTextEditorProps = {
  /** Optional controlled HTML value. Pair with `onChange`. */
  value?: string;
  /** Optional initial HTML value when used uncontrolled. */
  defaultValue?: string;
  /** Fires on every edit with the latest HTML. */
  onChange?: (html: string) => void;
  /** When provided, a hidden input mirrors the HTML for plain form posts. */
  name?: string;
  /** Editable area minimum height in px. Defaults to 240. */
  minHeight?: number;
  /** Placeholder shown when the editor is empty. */
  placeholder?: string;
  /** Disable all editing and toolbar buttons. */
  disabled?: boolean;
  /** Extra className applied to the outer wrapper. */
  className?: string;
  /** ID for the editable region (handy for `<label htmlFor>`). */
  id?: string;
};

const HEADING_OPTIONS: ReadonlyArray<{ tag: string; label: string }> = [
  { tag: "p", label: "Энгийн" },
  { tag: "h1", label: "Гарчиг 1" },
  { tag: "h2", label: "Гарчиг 2" },
  { tag: "h3", label: "Гарчиг 3" },
  { tag: "h4", label: "Гарчиг 4" },
  { tag: "blockquote", label: "Эшлэл" },
];

function sanitizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) return null;
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Convert a string of HTML into a normalized form. Mostly used to keep the
 * `defaultValue` and `value` paths consistent.
 */
function normalizeHtml(html: string | undefined): string {
  return typeof html === "string" ? html : "";
}

export default function RichTextEditor({
  value,
  defaultValue,
  onChange,
  name,
  minHeight = 240,
  placeholder = "Энд бичнэ үү...",
  disabled = false,
  className = "",
  id,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const reactId = useId();
  const editorId = id ?? `rte-${reactId}`;

  const isControlled = typeof value === "string";
  const [internalHtml, setInternalHtml] = useState<string>(
    () => normalizeHtml(isControlled ? value : defaultValue),
  );
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [sourceDraft, setSourceDraft] = useState<string>(internalHtml);
  const [isFocused, setIsFocused] = useState(false);

  const currentHtml = isControlled ? normalizeHtml(value) : internalHtml;

  // Push the latest HTML back into the contentEditable surface only when it
  // diverges from what the user is editing (e.g. controlled value changed
  // externally). This avoids fighting the browser caret on every keystroke.
  useEffect(() => {
    const el = editorRef.current;
    if (!el || isSourceMode) return;
    if (el.innerHTML !== currentHtml) {
      el.innerHTML = currentHtml;
    }
  }, [currentHtml, isSourceMode]);

  const emitChange = useCallback(
    (html: string) => {
      if (!isControlled) setInternalHtml(html);
      onChange?.(html);
    },
    [isControlled, onChange],
  );

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    emitChange(el.innerHTML);
  }, [emitChange]);

  const focusEditor = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    // Ensure there is always a selection inside the editor so execCommand
    // applies to caret position rather than failing silently.
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, []);

  const exec = useCallback(
    (command: string, valueArg?: string) => {
      if (disabled) return;
      focusEditor();
      try {
        document.execCommand(command, false, valueArg);
      } catch {
        // execCommand is deprecated but widely supported; ignore errors.
      }
      handleInput();
    },
    [disabled, focusEditor, handleInput],
  );

  const setHeading = useCallback(
    (tag: string) => {
      if (disabled) return;
      exec("formatBlock", tag === "p" ? "p" : tag);
    },
    [disabled, exec],
  );

  const insertLink = useCallback(() => {
    if (disabled) return;
    focusEditor();
    const existing = window.getSelection()?.toString() ?? "";
    const raw = window.prompt("Холбоосын URL:", existing.startsWith("http") ? existing : "https://");
    if (!raw) return;
    const safe = sanitizeUrl(raw);
    if (!safe) return;
    exec("createLink", safe);
  }, [disabled, exec, focusEditor]);

  const insertImage = useCallback(() => {
    if (disabled) return;
    focusEditor();
    const raw = window.prompt("Зургийн URL:", "https://");
    if (!raw) return;
    const safe = sanitizeUrl(raw);
    if (!safe) return;
    exec("insertImage", safe);
  }, [disabled, exec, focusEditor]);

  const toggleSource = useCallback(() => {
    if (disabled) return;
    setIsSourceMode((prev) => {
      const next = !prev;
      if (next) {
        setSourceDraft(currentHtml);
      } else {
        emitChange(sourceDraft);
      }
      return next;
    });
  }, [currentHtml, disabled, emitChange, sourceDraft]);

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      // Strip rich formatting from pasted content so the editor doesn't end up
      // with a jungle of inline styles from Word/Google Docs.
      event.preventDefault();
      const text = event.clipboardData.getData("text/plain");
      const html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\r?\n/g, "<br>");
      try {
        document.execCommand("insertHTML", false, html);
      } catch {
        // ignore
      }
      handleInput();
    },
    [disabled, handleInput],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      const meta = event.metaKey || event.ctrlKey;
      if (!meta) return;
      const key = event.key.toLowerCase();
      if (key === "b") {
        event.preventDefault();
        exec("bold");
      } else if (key === "i") {
        event.preventDefault();
        exec("italic");
      } else if (key === "u") {
        event.preventDefault();
        exec("underline");
      }
    },
    [disabled, exec],
  );

  const isEmpty = useMemo(() => {
    const stripped = currentHtml.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, "").trim();
    return stripped.length === 0;
  }, [currentHtml]);

  const wrapperClass = [
    "rte-wrapper",
    isFocused ? "is-focused" : "",
    disabled ? "is-disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClass}>
      <div className="rte-toolbar" role="toolbar" aria-label="Текст засварын самбар">
        <select
          aria-label="Догол мөрийн загвар"
          className="rte-select"
          disabled={disabled || isSourceMode}
          defaultValue="p"
          onChange={(event) => {
            setHeading(event.target.value);
            event.target.value = "p";
          }}
        >
          {HEADING_OPTIONS.map((opt) => (
            <option key={opt.tag} value={opt.tag}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="rte-divider" aria-hidden />

        <ToolbarButton title="Бүдүүн (Ctrl/⌘+B)" onClick={() => exec("bold")} disabled={disabled || isSourceMode}>
          <i className="fa-solid fa-bold" />
        </ToolbarButton>
        <ToolbarButton title="Налуу (Ctrl/⌘+I)" onClick={() => exec("italic")} disabled={disabled || isSourceMode}>
          <i className="fa-solid fa-italic" />
        </ToolbarButton>
        <ToolbarButton title="Доогуур зураас (Ctrl/⌘+U)" onClick={() => exec("underline")} disabled={disabled || isSourceMode}>
          <i className="fa-solid fa-underline" />
        </ToolbarButton>
        <ToolbarButton title="Дундуур зураас" onClick={() => exec("strikeThrough")} disabled={disabled || isSourceMode}>
          <i className="fa-solid fa-strikethrough" />
        </ToolbarButton>

        <div className="rte-divider" aria-hidden />

        <ToolbarButton title="Цэгтэй жагсаалт" onClick={() => exec("insertUnorderedList")} disabled={disabled || isSourceMode}>
          <i className="fa-solid fa-list-ul" />
        </ToolbarButton>
        <ToolbarButton title="Дугаарласан жагсаалт" onClick={() => exec("insertOrderedList")} disabled={disabled || isSourceMode}>
          <i className="fa-solid fa-list-ol" />
        </ToolbarButton>

        <div className="rte-divider" aria-hidden />

        <ToolbarButton title="Зэрэгцүүлэх: зүүн" onClick={() => exec("justifyLeft")} disabled={disabled || isSourceMode}>
          <i className="fa-solid fa-align-left" />
        </ToolbarButton>
        <ToolbarButton title="Зэрэгцүүлэх: төв" onClick={() => exec("justifyCenter")} disabled={disabled || isSourceMode}>
          <i className="fa-solid fa-align-center" />
        </ToolbarButton>
        <ToolbarButton title="Зэрэгцүүлэх: баруун" onClick={() => exec("justifyRight")} disabled={disabled || isSourceMode}>
          <i className="fa-solid fa-align-right" />
        </ToolbarButton>

        <div className="rte-divider" aria-hidden />

        <ToolbarButton title="Холбоос оруулах" onClick={insertLink} disabled={disabled || isSourceMode}>
          <i className="fa-solid fa-link" />
        </ToolbarButton>
        <ToolbarButton title="Холбоос арилгах" onClick={() => exec("unlink")} disabled={disabled || isSourceMode}>
          <i className="fa-solid fa-link-slash" />
        </ToolbarButton>
        <ToolbarButton title="Зураг оруулах (URL)" onClick={insertImage} disabled={disabled || isSourceMode}>
          <i className="fa-regular fa-image" />
        </ToolbarButton>

        <div className="rte-divider" aria-hidden />

        <ToolbarButton title="Хэлбэржилтийг арилгах" onClick={() => exec("removeFormat")} disabled={disabled || isSourceMode}>
          <i className="fa-solid fa-eraser" />
        </ToolbarButton>
        <ToolbarButton title="Буцаах" onClick={() => exec("undo")} disabled={disabled || isSourceMode}>
          <i className="fa-solid fa-rotate-left" />
        </ToolbarButton>
        <ToolbarButton title="Дахин хийх" onClick={() => exec("redo")} disabled={disabled || isSourceMode}>
          <i className="fa-solid fa-rotate-right" />
        </ToolbarButton>

        <div className="rte-toolbar-spacer" />

        <ToolbarButton
          title={isSourceMode ? "Засварлах горимд буцах" : "HTML эх код"}
          onClick={toggleSource}
          disabled={disabled}
          active={isSourceMode}
        >
          <i className="fa-solid fa-code" />
        </ToolbarButton>
      </div>

      {isSourceMode ? (
        <textarea
          className="rte-source"
          value={sourceDraft}
          onChange={(event) => setSourceDraft(event.target.value)}
          style={{ minHeight }}
          spellCheck={false}
          disabled={disabled}
          aria-label="HTML эх код"
        />
      ) : (
        <div
          ref={editorRef}
          id={editorId}
          className="rte-content"
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={() => {
            setIsFocused(false);
            handleInput();
          }}
          onFocus={() => setIsFocused(true)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          data-placeholder={placeholder}
          data-empty={isEmpty ? "true" : "false"}
          style={{ minHeight }}
          role="textbox"
          aria-multiline="true"
          aria-disabled={disabled || undefined}
        />
      )}

      {name ? <input type="hidden" name={name} value={currentHtml} /> : null}
    </div>
  );
}

type ToolbarButtonProps = {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
};

function ToolbarButton({ title, onClick, disabled, active, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={`rte-btn${active ? " is-active" : ""}`}
      onMouseDown={(event) => {
        // Prevent the editor from losing selection when the toolbar button is
        // pressed. We trigger the actual command in onClick so keyboard users
        // (Enter/Space activation) still work.
        event.preventDefault();
      }}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active || undefined}
    >
      {children}
    </button>
  );
}
