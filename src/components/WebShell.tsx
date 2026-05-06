"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

type Entry = {
  id: number;
  prompt?: string;
  input?: string;
  lines: string[];
  tone?: "normal" | "success" | "error" | "muted";
};

type FileNode = {
  type: "file";
  body: string[];
};

type DirectoryNode = {
  type: "dir";
  children: Record<string, FileNode | DirectoryNode>;
};

const fileSystem: DirectoryNode = {
  type: "dir",
  children: {
    bakery: {
      type: "dir",
      children: {
        "menu.txt": {
          type: "file",
          body: [
            "bubble-clock.html       fizzy time display",
            "terrain-3d.html         procedural landscape",
            "web-shell               command-line glaze",
          ],
        },
        "oven.log": {
          type: "file",
          body: [
            "06:00 preheat neon oven",
            "06:15 pipe custard prompts",
            "06:42 ship fresh demo batch",
          ],
        },
      },
    },
    demos: {
      type: "dir",
      children: {
        "README.md": {
          type: "file",
          body: [
            "# Unique Donut Demos",
            "Every route is a small interactive experiment.",
            "Try: open shop",
          ],
        },
      },
    },
    "welcome.txt": {
      type: "file",
      body: [
        "Welcome to donutsh, the Unique Donut browser shell.",
        "Type help to see available commands.",
      ],
    },
  },
};

const commandHelp = [
  "help                 show commands",
  "ls [path]            list files",
  "cd [path]            change directory",
  "pwd                  print working directory",
  "cat <file>           read a file",
  "echo <text>          print text",
  "date                 show local browser time",
  "whoami               show current user",
  "history              show command history",
  "open <shop|home>     navigate around the site",
  "clear                clear the terminal",
];

function splitPath(path: string): string[] {
  return path.split("/").filter(Boolean);
}

function normalizePath(current: string[], target: string): string[] {
  if (!target || target === ".") return current;

  const parts = target.startsWith("/") ? [] : [...current];

  for (const part of splitPath(target)) {
    if (part === ".") continue;
    if (part === "..") {
      parts.pop();
      continue;
    }
    parts.push(part);
  }

  return parts;
}

function getNode(path: string[]): FileNode | DirectoryNode | undefined {
  let node: FileNode | DirectoryNode = fileSystem;

  for (const segment of path) {
    if (node.type !== "dir") return undefined;
    node = node.children[segment];
    if (!node) return undefined;
  }

  return node;
}

function promptFor(path: string[]) {
  return `guest@uniquedonut:${path.length ? `/${path.join("/")}` : "/"}$`;
}

export default function WebShell() {
  const [cwd, setCwd] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState<Entry[]>([
    {
      id: 0,
      lines: [
        "donutsh 1.0.0",
        "Sandboxed browser shell ready. Type help to begin.",
      ],
      tone: "success",
    },
  ]);
  const [history, setHistory] = useState<string[]>([]);
  const historyIndexRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const prompt = useMemo(() => promptFor(cwd), [cwd]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [entries]);

  function pushEntry(entry: Omit<Entry, "id">) {
    setEntries((current) => [...current, { id: current.length, ...entry }]);
  }

  function runCommand(rawCommand: string) {
    const trimmed = rawCommand.trim();

    if (!trimmed) {
      pushEntry({ prompt, input: rawCommand, lines: [] });
      return;
    }

    const [command = "", ...args] = trimmed.split(/\s+/);
    const rest = trimmed.slice(command.length).trim();

    setHistory((current) => [...current, trimmed]);
    historyIndexRef.current = null;

    if (command === "clear") {
      setEntries([]);
      return;
    }

    if (command === "help") {
      pushEntry({ prompt, input: rawCommand, lines: commandHelp });
      return;
    }

    if (command === "pwd") {
      pushEntry({ prompt, input: rawCommand, lines: [`/${cwd.join("/")}`.replace(/\/$/, "") || "/"] });
      return;
    }

    if (command === "ls") {
      const targetPath = normalizePath(cwd, args[0] ?? ".");
      const node = getNode(targetPath);

      if (!node) {
        pushEntry({ prompt, input: rawCommand, lines: [`ls: ${args[0]}: No such file or directory`], tone: "error" });
        return;
      }

      if (node.type === "file") {
        pushEntry({ prompt, input: rawCommand, lines: [targetPath.at(-1) ?? "/"] });
        return;
      }

      const names = Object.entries(node.children).map(([name, child]) =>
        child.type === "dir" ? `${name}/` : name,
      );
      pushEntry({ prompt, input: rawCommand, lines: names.length ? names : ["empty"] });
      return;
    }

    if (command === "cd") {
      const targetPath = normalizePath(cwd, args[0] ?? "/");
      const node = getNode(targetPath);

      if (!node) {
        pushEntry({ prompt, input: rawCommand, lines: [`cd: ${args[0]}: No such file or directory`], tone: "error" });
        return;
      }

      if (node.type !== "dir") {
        pushEntry({ prompt, input: rawCommand, lines: [`cd: ${args[0]}: Not a directory`], tone: "error" });
        return;
      }

      pushEntry({ prompt, input: rawCommand, lines: [] });
      setCwd(targetPath);
      return;
    }

    if (command === "cat") {
      if (!args[0]) {
        pushEntry({ prompt, input: rawCommand, lines: ["cat: missing file operand"], tone: "error" });
        return;
      }

      const targetPath = normalizePath(cwd, args[0]);
      const node = getNode(targetPath);

      if (!node) {
        pushEntry({ prompt, input: rawCommand, lines: [`cat: ${args[0]}: No such file`], tone: "error" });
        return;
      }

      if (node.type !== "file") {
        pushEntry({ prompt, input: rawCommand, lines: [`cat: ${args[0]}: Is a directory`], tone: "error" });
        return;
      }

      pushEntry({ prompt, input: rawCommand, lines: node.body });
      return;
    }

    if (command === "echo") {
      pushEntry({ prompt, input: rawCommand, lines: [rest] });
      return;
    }

    if (command === "date") {
      pushEntry({ prompt, input: rawCommand, lines: [new Date().toString()] });
      return;
    }

    if (command === "whoami") {
      pushEntry({ prompt, input: rawCommand, lines: ["guest"] });
      return;
    }

    if (command === "history") {
      pushEntry({
        prompt,
        input: rawCommand,
        lines: history.length ? history.map((item, index) => `${index + 1}  ${item}`) : ["history is empty"],
      });
      return;
    }

    if (command === "open") {
      const target = args[0];
      const routes: Record<string, string> = {
        home: "/",
        shop: "/shop",
      };

      if (!target || !routes[target]) {
        pushEntry({ prompt, input: rawCommand, lines: ["open: expected shop or home"], tone: "error" });
        return;
      }

      pushEntry({ prompt, input: rawCommand, lines: [`opening ${target}...`], tone: "success" });
      window.location.href = routes[target];
      return;
    }

    pushEntry({
      prompt,
      input: rawCommand,
      lines: [`${command}: command not found`, "Type help for available commands."],
      tone: "error",
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runCommand(input);
    setInput("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!history.length) return;
      const current = historyIndexRef.current;
      const next = current === null ? history.length - 1 : Math.max(0, current - 1);
      historyIndexRef.current = next;
      setInput(history[next] ?? "");
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const current = historyIndexRef.current;
      if (current === null) return;
      const next = current + 1;
      if (next >= history.length) {
        historyIndexRef.current = null;
        setInput("");
        return;
      }
      historyIndexRef.current = next;
      setInput(history[next] ?? "");
    }
  }

  return (
    <section
      className="mx-auto flex min-h-[78vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-[#6BCB77]/50 bg-[#08140f] shadow-[0_0_48px_rgba(107,203,119,0.18)]"
      aria-label="Web shell"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center justify-between border-b border-[#6BCB77]/30 bg-[#102018] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#FF6B9D]" />
          <span className="h-3 w-3 rounded-full bg-[#FFD93D]" />
          <span className="h-3 w-3 rounded-full bg-[#6BCB77]" />
        </div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#6BCB77]">
          donutsh
        </p>
        <p className="hidden text-xs text-[#FEFEFE]/50 sm:block">browser sandbox</p>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-5 font-mono text-sm leading-6 text-[#FEFEFE] sm:text-base"
      >
        {entries.map((entry) => (
          <div key={entry.id} className="mb-3">
            {entry.prompt ? (
              <p>
                <span className="text-[#6BCB77]">{entry.prompt}</span>{" "}
                <span className="text-[#FFD93D]">{entry.input}</span>
              </p>
            ) : null}
            {entry.lines.map((line, index) => (
              <p
                key={`${entry.id}-${index}`}
                className={
                  entry.tone === "error"
                    ? "text-[#FF6B9D]"
                    : entry.tone === "success"
                      ? "text-[#6BCB77]"
                      : entry.tone === "muted"
                        ? "text-[#FEFEFE]/55"
                        : "text-[#FEFEFE]/85"
                }
              >
                {line || " "}
              </p>
            ))}
          </div>
        ))}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <label className="shrink-0 text-[#6BCB77]" htmlFor="web-shell-input">
            {prompt}
          </label>
          <input
            ref={inputRef}
            id="web-shell-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            className="min-w-0 flex-1 bg-transparent text-[#FFD93D] caret-[#FF6B9D] outline-none"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </form>
      </div>
    </section>
  );
}
