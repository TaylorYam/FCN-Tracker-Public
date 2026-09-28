#!/usr/bin/env python3
"""Public-content safety scanner for the FCN Tracker portfolio edition.

Scans every file that would be published (git-tracked files plus untracked
files that are not git-ignored; falls back to a directory walk outside git)
for content that must never appear in the public repository:

  * registry-style 12-digit product identifiers and other long digit runs
  * broker / salesperson code fields and assignment patterns
  * chat-bot integration identifiers and tokens
  * scheduled-job secrets, KV-store credentials, hosting-platform references
  * deployment URLs, e-mail addresses, private filesystem paths
  * passwords, API keys, private keys, GitHub tokens, LLM-provider keys
  * end-user references and account numbers
  * admin surfaces, registry-code terminology, forbidden file types
  * binary files (must be reviewed individually)
  * optional PRIVATE terms (employer names, known production values) that are
    supplied at run time and therefore never stored in this repository:
      - env PUBLIC_SCAN_PRIVATE_TERMS  (newline- or comma-separated), and/or
      - env PUBLIC_SCAN_TERMS_FILE     (path to a file, one term per line)

Output: one line per finding with PATH and CATEGORY only. Matched values are
never printed. Use --lines to add line numbers for local review.

Exit status: 1 if any finding is not individually allowlisted, else 0.

Allowlist (scripts/public_scan_allowlist.json): every entry pins ONE reviewed
line (or one binary file) by path, category and SHA-256 of the stripped line
text (or of the file bytes). Editing that line invalidates the entry, which
forces a fresh manual review. Use --propose to print candidate entries
(hashes only) for findings that a human has reviewed and accepted.

Patterns are assembled from fragments so this file can scan itself without
matching its own source.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ALLOWLIST_PATH = ROOT / "scripts" / "public_scan_allowlist.json"
ALLOWLIST_REL = "scripts/public_scan_allowlist.json"

SKIP_DIRS = {".git", "node_modules", ".next", "out", ".turbo", ".cache"}
MAX_TEXT_BYTES = 5_000_000


def j(*parts: str) -> str:
    """Join pattern fragments (keeps literal keywords out of this source)."""
    return "".join(parts)


I = re.IGNORECASE

# (category, compiled pattern). Order is irrelevant; each category is
# reported at most once per line.
CONTENT_RULES: list[tuple[str, re.Pattern[str]]] = [
    ("registry-id-12-digit", re.compile(r"(?<![\d.])\d{12}(?!\d)")),
    ("long-digit-run", re.compile(r"(?<![\d.])(?:\d{10,11}|\d{13,19})(?!\d)")),
    ("broker-assignment-field", re.compile(j("broker", r"[_\s-]?", "codes?"), I)),
    (
        "salesperson-code",
        re.compile(
            j(
                r"(?:",
                "broker|sales",
                r"(?:person|\s*rep)?|agent|",
                "us",
                "er",
                r")[\s_-]*(?:code|id|no\.?|number)?\W{0,6}[\"']?\d{3}[\"']?(?!\d)",
            ),
            I,
        ),
    ),
    ("salesperson-code", re.compile(j("營", "業員|業", "務員|使用", "者|理", "專"))),
    ("salesperson-code", re.compile(j(r"/b", r"/(?:\d{3}\b|\[code\])"))),
    ("salesperson-code", re.compile(r"\[\s*[\"']\d{3}[\"']\s*(?:,\s*[\"']\d{3}[\"']\s*)*\]")),
    ("chat-bot-integration", re.compile(j("tele", "gram"), I)),
    ("chat-bot-integration", re.compile(j(r"\bT", r"G_[A-Z_]+"))),
    ("chat-bot-integration", re.compile(j(r"\bBOT", r"_TOKEN\b|\bchat", r"_id\b"), I)),
    ("scheduled-job-secret", re.compile(j("CRON", "_SECRET"), I)),
    ("scheduled-job-secret", re.compile(j(r"/api", r"/cron\b"), I)),
    ("kv-store-credential", re.compile(j(r"\bKV_", r"(?:REST_API\w*|URL)\b|UPST", r"ASH\w*"), I)),
    ("hosting-platform-reference", re.compile(j("ver", "cel"), I)),
    (
        "deployment-url",
        re.compile(
            j(
                r"https?://[^\s\"'<>)]*\.(?:",
                "ver", r"cel\.app|", "ver", r"cel\.sh|netlify\.app|herokuapp\.com|",
                r"onrender\.com|fly\.dev|pages\.dev)",
            ),
            I,
        ),
    ),
    ("email-address", re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}")),
    ("private-filesystem-path", re.compile(r"\b[A-Za-z]:(?:\\\\?|/)(?:[A-Za-z0-9_ .-]+[\\/])")),
    ("private-filesystem-path", re.compile(j(r"(?:^|[\s\"'(=])/(?:Us", r"ers|ho", r"me)/[A-Za-z0-9._-]+"))),
    ("private-filesystem-path", re.compile(j("App", "Data|One", r"Drive\b"), I)),
    ("password-assignment", re.compile(j(r"\b(?:pass", r"(?:word|wd)?|pwd)\s*[:=]\s*[\"']?[^\s\"',;)]{3,}"), I)),
    ("admin-surface", re.compile(j(r"/adm", r"in\b|\bADM", r"IN_[A-Z_]+|adm", r"in[_-]?(?:pass|token|secret|cookie)"), I)),
    (
        "api-key",
        re.compile(
            j(
                r"\b(?:api[_-]?key|sec", r"ret|access[_-]?tok", r"en|auth[_-]?tok", r"en)",
                r"\s*[:=]\s*[\"'][^\"'\s]{8,}[\"']",
            ),
            I,
        ),
    ),
    ("api-key", re.compile(j("AK", r"IA[0-9A-Z]{16}|AI", r"za[0-9A-Za-z_\-]{35}|xox", r"[baprs]-[0-9A-Za-z-]{10,}"))),
    ("api-key", re.compile(j(r"\bBear", r"er\s+[A-Za-z0-9._\-]{20,}|sk_", r"live_[0-9a-zA-Z]{16,}"))),
    ("llm-provider-key", re.compile(j(r"\bsk-", r"(?:ant-|proj-)?[A-Za-z0-9_\-]{20,}"))),
    ("llm-provider-key", re.compile(j("ANTHR", r"OPIC_\w+|OPEN", r"AI_API_KEY|@anth", "ropic-ai/"))),
    ("private-key-block", re.compile(j("-----BEG", r"IN [A-Z ]*PRIV", "ATE KEY-----"))),
    ("github-token", re.compile(j(r"\bgh", r"[pousr]_[A-Za-z0-9]{36,}|github", r"_pat_[A-Za-z0-9_]{22,}"))),
    ("github-token", re.compile(j(r"\bGITHUB", r"_(?:PAT|TOKEN)\b"))),
    ("end-user-reference", re.compile(j(r"\bcli", r"ents?\b|\bcust", r"omers?\b"), I)),
    ("end-user-reference", re.compile(j("客", "戶|顧", "客|客", "人"))),
    (
        "account-number",
        re.compile(j(r"\b(?:acc", r"ount|acct)[\s#:_-]*(?:no\.?|number|#)?\s*[:=]?\s*\d[\d -]{5,}\d"), I),
    ),
    ("account-number", re.compile(j("(?:帳", "號|帳", "戶)", r"\W{0,6}\d{4,}"))),
    ("registry-code-term", re.compile(j(r"\bTD", r"CC\b"), I)),
    ("registry-code-term", re.compile(j("集", "保"))),
]

# Precise, documented exemptions (not blanket skips).
LINE_EXEMPTIONS: dict[str, re.Pattern[str]] = {
    # The React Server Components directive is a code token, not a person.
    "end-user-reference": re.compile(j(r"""^\s*["']use cli""", r"""ent["'];?\s*$""")),
}

FORBIDDEN_NAME_RULES: list[re.Pattern[str]] = [
    re.compile(r"^\.env(\..*)?$", I),
    re.compile(j("^ver", r"cel\.json$"), I),
    re.compile(r"\.(pem|key|p12|pfx|jks|keystore)$", I),
    re.compile(r"^id_(rsa|dsa|ecdsa|ed25519)", I),
    re.compile(r"\.(xlsx|xlsm|xls|csv|tsv|sqlite|db|log|har)$", I),
    re.compile(r"\.tsbuildinfo$", I),
]
FORBIDDEN_DIR_PARTS = {".data", j(".ver", "cel"), ".env"}


@dataclass(frozen=True)
class Finding:
    path: str
    category: str
    line: int  # 0 = whole file
    digest: str

    def key(self) -> tuple[str, str, str]:
        return (self.path, self.category, self.digest)


def sha256_text(s: str) -> str:
    return hashlib.sha256(s.strip().encode("utf-8")).hexdigest()


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def load_private_terms() -> list[str]:
    terms: list[str] = []
    raw = os.environ.get("PUBLIC_SCAN_PRIVATE_TERMS", "")
    terms += [t.strip() for t in re.split(r"[\n,]", raw) if t.strip()]
    file_env = os.environ.get("PUBLIC_SCAN_TERMS_FILE", "")
    if file_env:
        p = Path(file_env)
        if not p.is_file():
            print("public-scan: PUBLIC_SCAN_TERMS_FILE is set but not readable", file=sys.stderr)
            sys.exit(2)
        for line in p.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                terms.append(line)
    return sorted(set(terms))


def private_term_patterns(terms: list[str]) -> list[re.Pattern[str]]:
    pats = []
    for t in terms:
        esc = re.escape(t)
        if t.isdigit() and len(t) <= 4:
            # Short codes must stand alone (quoted, after a route segment or a role
            # word); the numeric tail of an identifier such as DEMO-FCN-001 does not.
            pats.append(re.compile(rf"(?<![A-Za-z0-9_-]){esc}(?![A-Za-z0-9_])"))
        elif t.isdigit():
            pats.append(re.compile(rf"(?<!\d){esc}(?!\d)"))
        elif re.fullmatch(r"[A-Za-z0-9 ._-]+", t):
            pats.append(re.compile(rf"(?<![A-Za-z0-9]){esc}(?![A-Za-z0-9])", I))
        else:
            pats.append(re.compile(esc, I))
    return pats


def list_files() -> list[str]:
    try:
        out = subprocess.run(
            ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
            cwd=ROOT,
            capture_output=True,
            check=True,
        ).stdout
        files = sorted({f for f in out.decode("utf-8").split("\0") if f})
        return [f for f in files if (ROOT / f).is_file()]
    except (OSError, subprocess.CalledProcessError):
        files = []
        for dirpath, dirnames, filenames in os.walk(ROOT):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for name in filenames:
                files.append(Path(dirpath, name).relative_to(ROOT).as_posix())
        return sorted(files)


def is_binary(data: bytes) -> bool:
    if b"\0" in data[:8192]:
        return True
    try:
        data.decode("utf-8")
        return False
    except UnicodeDecodeError:
        return True


def scan_file(rel: str, private_pats: list[re.Pattern[str]]) -> list[Finding]:
    findings: list[Finding] = []
    path = ROOT / rel
    name = path.name
    parts = set(Path(rel).parts[:-1])

    data = path.read_bytes()
    file_digest = sha256_bytes(data)

    if any(r.search(name) for r in FORBIDDEN_NAME_RULES) or parts & FORBIDDEN_DIR_PARTS:
        findings.append(Finding(rel, "forbidden-file", 0, file_digest))

    if len(data) > MAX_TEXT_BYTES or is_binary(data):
        findings.append(Finding(rel, "binary-file", 0, file_digest))
        return findings

    text = data.decode("utf-8")
    # Path names themselves can leak identifiers too.
    for category, rx in CONTENT_RULES:
        if category in ("registry-id-12-digit", "private-filesystem-path") and rx.search(rel):
            findings.append(Finding(rel, f"{category}-in-path", 0, sha256_text(rel)))

    if rel == ALLOWLIST_REL:
        return findings  # validated structurally in load_allowlist()

    for lineno, line in enumerate(text.splitlines(), start=1):
        digest = None
        seen: set[str] = set()
        for category, rx in CONTENT_RULES:
            if category in seen:
                continue
            ex = LINE_EXEMPTIONS.get(category)
            if ex and ex.search(line):
                continue
            if rx.search(line):
                seen.add(category)
                digest = digest or sha256_text(line)
                findings.append(Finding(rel, category, lineno, digest))
        for rx in private_pats:
            if rx.search(line):
                digest = digest or sha256_text(line)
                findings.append(Finding(rel, "private-term", lineno, digest))
                break
    return findings


KNOWN_CATEGORIES = {c for c, _ in CONTENT_RULES} | {
    "forbidden-file",
    "binary-file",
    "private-term",
    "registry-id-12-digit-in-path",
    "private-filesystem-path-in-path",
}


def load_allowlist(private_pats: list[re.Pattern[str]]) -> tuple[set[tuple[str, str, str]], list[str]]:
    errors: list[str] = []
    if not ALLOWLIST_PATH.exists():
        return set(), errors
    try:
        entries = json.loads(ALLOWLIST_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return set(), [f"{ALLOWLIST_REL}: invalid JSON"]
    if not isinstance(entries, list):
        return set(), [f"{ALLOWLIST_REL}: must be a JSON list"]
    keys: set[tuple[str, str, str]] = set()
    for i, e in enumerate(entries):
        where = f"{ALLOWLIST_REL}[{i}]"
        if not isinstance(e, dict) or set(e) != {"path", "category", "sha256", "reason"}:
            errors.append(f"{where}: keys must be exactly path, category, sha256, reason")
            continue
        if e["category"] not in KNOWN_CATEGORIES:
            errors.append(f"{where}: unknown category")
        if not re.fullmatch(r"[0-9a-f]{64}", str(e["sha256"])):
            errors.append(f"{where}: sha256 must be 64 lowercase hex characters")
        reason = str(e["reason"])
        if not (10 <= len(reason) <= 200):
            errors.append(f"{where}: reason must be 10-200 characters")
        for category, rx in CONTENT_RULES:
            if rx.search(reason) or rx.search(str(e["path"])):
                errors.append(f"{where}: reason/path itself matches {category}")
        if any(rx.search(reason) for rx in private_pats):
            errors.append(f"{where}: reason itself matches private-term")
        if not (ROOT / str(e["path"])).is_file():
            errors.append(f"{where}: path does not exist (stale entry)")
        keys.add((str(e["path"]), str(e["category"]), str(e["sha256"])))
    return keys, errors


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--lines", action="store_true", help="include line numbers (never values)")
    ap.add_argument("--propose", action="store_true", help="print allowlist candidates (hashes only)")
    args = ap.parse_args()

    terms = load_private_terms()
    private_pats = private_term_patterns(terms)
    allowed, allow_errors = load_allowlist(private_pats)

    files = list_files()
    findings: list[Finding] = []
    for rel in files:
        findings.extend(scan_file(rel, private_pats))

    used: set[tuple[str, str, str]] = set()
    blocking: list[Finding] = []
    for f in findings:
        if f.key() in allowed:
            used.add(f.key())
        else:
            blocking.append(f)
    stale = allowed - used

    print(f"public-scan: {len(files)} files scanned, {len(findings)} raw findings, "
          f"{len(findings) - len(blocking)} allowlisted after review")
    print(f"public-scan: private term list {'loaded (' + str(len(terms)) + ' terms)' if terms else 'not provided'}")

    for f in blocking:
        loc = f"{f.path}:{f.line}" if args.lines and f.line else f.path
        print(f"FINDING  {loc}  [{f.category}]")
    for e in allow_errors:
        print(f"ALLOWLIST ERROR  {e}")
    for path, category, _ in sorted(stale):
        print(f"STALE ALLOWLIST ENTRY  {path}  [{category}]  (no longer matches; remove it)")

    if args.propose and blocking:
        print(json.dumps(
            [{"path": f.path, "category": f.category, "sha256": f.digest, "reason": "REVIEW: explain why this is safe"}
             for f in blocking],
            indent=2,
        ))

    if blocking or allow_errors or stale:
        print(f"public-scan: FAILED ({len(blocking)} unreviewed findings, "
              f"{len(allow_errors)} allowlist errors, {len(stale)} stale entries)")
        return 1
    print("public-scan: PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
