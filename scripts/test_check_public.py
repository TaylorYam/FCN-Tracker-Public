"""Behavioural tests for check_public.py.

Sample strings are assembled from fragments at run time so that this file
does not itself trip the scanner.
"""

import json
import tempfile
import unittest
from pathlib import Path

import check_public as c

BS = chr(92)
CODE = str(300 + 21)  # a 3-digit code built at run time

POSITIVE = {
    "registry-id-12-digit": "id = " + "4" * 12,
    "long-digit-run": "n = " + "7" * 14,
    "broker-assignment-field": "broker" + "Codes: []",
    "salesperson-code": 'codes: ["' + CODE + '"]',
    "chat-bot-integration": "tele" + "gram bot",
    "scheduled-job-secret": "CRON" + "_SECRET=abc",
    "kv-store-credential": "KV_REST" + "_API_TOKEN",
    "hosting-platform-reference": "deployed on " + "Ver" + "cel",
    "deployment-url": "https://demo." + "ver" + "cel.app/x",
    "email-address": "mail someone" + "@" + "example.org",
    "private-filesystem-path": "C:" + BS + "Users" + BS + "someone" + BS + "file",
    "password-assignment": "pass" + "word = hunter22",
    "admin-surface": "/adm" + "in/login",
    "api-key": "api_key = '" + "z" * 20 + "'",
    "llm-provider-key": "sk-" + "ant-" + "a" * 24,
    "private-key-block": "-----BEGIN " + "PRIVATE KEY-----",
    "github-token": "gh" + "p_" + "b" * 36,
    "end-user-reference": "our cust" + "omer list",
    "account-number": "acc" + "ount no: 1234-5678-90",
    "registry-code-term": "TD" + "CC code",
}

BENIGN = [
    '"use ' + 'cli' + 'ent";',
    'id: "demo-fcn-001", code: "DEMO-FCN-001"',
    "tradeDate: \"2025-01-06\"",
    'assert.equal(formatRatePercent(0.10339999999999999), "10.34%");',
    '"resolved": "https://registry.npmjs.org/react/-/react-19.3.0.tgz"',
    'className="hover:bg-accent-blue/10 focus-visible:ring-2"',
    "return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;",
]


class ScannerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self._root = c.ROOT
        c.ROOT = self.root

    def tearDown(self):
        c.ROOT = self._root
        self.tmp.cleanup()

    def scan_line(self, line, terms=()):
        (self.root / "sample.txt").write_text(line + "\n", encoding="utf-8")
        return {f.category for f in c.scan_file("sample.txt", c.private_term_patterns(list(terms)))}

    def test_every_category_detects_its_sample(self):
        for category, line in POSITIVE.items():
            with self.subTest(category=category):
                self.assertIn(category, self.scan_line(line))

    def test_benign_lines_are_clean(self):
        for line in BENIGN:
            with self.subTest(line=line):
                self.assertEqual(self.scan_line(line), set())

    def test_forbidden_and_binary_files(self):
        (self.root / ".env.production").write_text("X=1\n")
        self.assertIn("forbidden-file", {f.category for f in c.scan_file(".env.production", [])})
        (self.root / "img.png").write_bytes(b"\x89PNG\r\n\x1a\n\0\0")
        self.assertIn("binary-file", {f.category for f in c.scan_file("img.png", [])})

    def test_private_terms(self):
        cjk = chr(0x7389) + chr(0x5c71)
        self.assertIn("private-term", self.scan_line("x " + cjk + " y", [cjk]))
        self.assertIn("private-term", self.scan_line("Example Holdings Ltd", ["Example Holdings"]))
        # short numeric codes must stand alone
        self.assertIn("private-term", self.scan_line('codes = "' + CODE + '"', [CODE]))
        self.assertIn("private-term", self.scan_line("us" + "er " + CODE, [CODE]))
        self.assertNotIn("private-term", self.scan_line("DEMO-FCN-" + CODE, [CODE]))

    def test_findings_never_expose_values(self):
        secret = "gh" + "p_" + "q" * 36
        (self.root / "s.txt").write_text(secret + "\n", encoding="utf-8")
        for f in c.scan_file("s.txt", []):
            self.assertNotIn(secret, repr(f))

    def test_allowlist_validation(self):
        (self.root / "scripts").mkdir()
        c_path = c.ALLOWLIST_PATH
        try:
            c.ALLOWLIST_PATH = self.root / "scripts" / "public_scan_allowlist.json"
            c.ALLOWLIST_PATH.write_text(json.dumps([
                {"path": "missing.txt", "category": "nope", "sha256": "xyz", "reason": "short"},
            ]))
            _, errors = c.load_allowlist([])
            joined = " ".join(errors)
            self.assertIn("unknown category", joined)
            self.assertIn("sha256", joined)
            self.assertIn("reason", joined)
            self.assertIn("stale", joined)
        finally:
            c.ALLOWLIST_PATH = c_path


if __name__ == "__main__":
    unittest.main()
