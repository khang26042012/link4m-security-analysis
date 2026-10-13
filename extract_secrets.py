
import re, json

with open('/data/data/com.dsharnessmobile.shell/files/home/tmp/deobf/link4m_clean_pass1.js', 'r', encoding='utf-8') as f:
    code = f.read()

print("File size:", len(code), "bytes")

# Extract URLs
urls = sorted(set(re.findall(r'https?://[a-zA-Z0-9./?=_&#%:-]+', code)))
print(f"=== FOUND {len(urls)} URLs ===")
for u in urls:
    print("  *", u)

# Extract domains mentioned
domains = sorted(set(re.findall(r'[a-zA-Z0-9.-]+\.(?:net|com|org|vn|io|space|xyz|ru)', code)))
print(f"=== FOUND {len(domains)} DOMAINS ===")
for d in domains:
    print("  *", d)

# Extract GM_ functions
gm_calls = sorted(set(re.findall(r'GM_[a-zA-Z]+', code)))
print(f"=== GM APIs CALLED ===")
print(" ", gm_calls)

# Extract Discord
discord = sorted(set(re.findall(r'https?://(?:discord\.gg|discord\.com)[a-zA-Z0-9./?=_&#%:-]+', code)))
print(f"=== DISCORD LINKS ===")
for d in discord:
    print("  *", d)

# Extract long string constants (API keys, endpoints, patterns)
long_strs = sorted(set(re.findall(r'"([^"\\]{12,150})"', code)))
print(f"=== TOTAL LONG STRINGS: {len(long_strs)} ===")
interesting = [s for s in long_strs if any(w in s.lower() for w in ['api', 'token', 'key', 'auth', 'bypass', 'captcha', 'ocr', 'link', 'traffic', 'session', 'user', 'eval', 'script'])]
print(f"=== INTERESTING STRINGS ({len(interesting)}) ===")
for s in interesting[:40]:
    print("  ->", repr(s))
