"""Cover letter text handling: parse a letter into parts and rebuild it.

The agent never lets the model write the letter header or the sign-off. The header (name,
city and country, phone, email, date) is built from the candidate's profile and the
closing is always "Sincerely," plus the candidate's name, so contact details can never be
invented and placeholders such as "[Your Name]" can never appear.
"""
import datetime
import re
from dataclasses import dataclass, field
from typing import List, Optional

from .text_utils import split_sentences, word_count

GREETING_RE = re.compile(r"^\s*(dear|hello|hi)\b", re.I)
CLOSING_RE = re.compile(
    r"^\s*(sincerely|yours sincerely|yours faithfully|yours truly|best regards|kind regards|warm regards|regards|respectfully|best)\s*,?\s*$",
    re.I,
)
PLACEHOLDER_RE = re.compile(
    r"\[[^\]\n]{1,60}\]|\{[^}\n]{1,60}\}|<[^>\n]{1,60}>|\byour name\b|\bhiring manager'?s? name\b|\bcompany name\b|\byour address\b",
    re.I,
)
EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
PHONE_RE = re.compile(r"(?<![\w])\+?\d[\d\s().-]{6,}\d(?![\w])")
DATE_RE = re.compile(
    r"\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b",
    re.I,
)
DEFAULT_GREETING = "Dear Hiring Manager,"
DEFAULT_CLOSING = "Sincerely,"


@dataclass
class ParsedLetter:
    header: List[str] = field(default_factory=list)   # lines before the greeting
    greeting: str = ""
    paragraphs: List[str] = field(default_factory=list)
    closing: str = ""
    signature: str = ""
    has_greeting: bool = False
    has_closing: bool = False

    @property
    def body(self) -> str:
        return " ".join(self.paragraphs)


def clean_letter_text(text: str) -> str:
    text = (text or "").replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("```", "").replace("**", "")
    return text.strip()


def digits(value: str) -> str:
    return re.sub(r"\D", "", value or "")


def phones_in(text: str) -> List[str]:
    """Phone-like numbers in ``text`` (at least 9 digits, so year ranges are not mistaken for phones)."""
    return [m.group(0).strip() for m in PHONE_RE.finditer(text or "") if len(digits(m.group(0))) >= 9]


def emails_in(text: str) -> List[str]:
    return EMAIL_RE.findall(text or "")


def parse_letter(text: str) -> ParsedLetter:
    """Split a letter into header, greeting, body paragraphs, closing and signature."""
    # each block is a list of non-empty lines
    blocks = []
    for raw in re.split(r"\n\s*\n", clean_letter_text(text)):
        lines = [l.strip() for l in raw.splitlines() if l.strip()]
        if lines:
            blocks.append(lines)

    greeting_at = next((i for i, b in enumerate(blocks) if GREETING_RE.match(b[0])), None)
    first_body = 0
    if greeting_at is None:
        # no greeting: the header is the run of short blocks before the first real paragraph
        first_body = next((i for i, b in enumerate(blocks) if word_count(" ".join(b)) >= 12), len(blocks))
    search_from = greeting_at if greeting_at is not None else first_body
    closing_at = next(
        (i for i in range(len(blocks) - 1, search_from - 1, -1) if CLOSING_RE.match(blocks[i][0])),
        None,
    )

    parsed = ParsedLetter()
    body_blocks: List[List[str]] = []

    if greeting_at is not None:
        parsed.has_greeting = True
        parsed.header = [l for b in blocks[:greeting_at] for l in b]
        parsed.greeting = blocks[greeting_at][0]
        if len(blocks[greeting_at]) > 1:  # the first paragraph written straight under the greeting
            body_blocks.append(blocks[greeting_at][1:])
        body_start = greeting_at + 1
    else:
        parsed.header = [l for b in blocks[:first_body] for l in b]
        body_start = first_body

    body_end = closing_at if closing_at is not None else len(blocks)
    body_blocks.extend(blocks[body_start:body_end])

    if closing_at is not None:
        parsed.has_closing = True
        closing_block = blocks[closing_at]
        parsed.closing = closing_block[0]
        signature_lines = closing_block[1:] + [l for b in blocks[closing_at + 1:] for l in b]
        parsed.signature = " ".join(signature_lines)

    parsed.paragraphs = [" ".join(b) for b in body_blocks]
    return parsed


def city_country(address: str) -> str:
    parts = [p.strip() for p in (address or "").split(",") if p.strip()]
    if len(parts) > 1:
        return ", ".join(parts[-2:])
    return parts[0] if parts else ""


def format_date(day: datetime.date) -> str:
    return f"{day.day} {day.strftime('%B %Y')}"


def build_header(personal_information: dict, today: Optional[datetime.date] = None) -> List[str]:
    """Name, city and country, phone, email and date, in that order, skipping what is missing."""
    pi = personal_information or {}
    today = today or datetime.date.today()
    lines = [
        str(pi.get("name") or "").strip(),
        city_country(str(pi.get("address") or "")),
        str(pi.get("phone") or pi.get("phone_number") or "").strip(),
        str(pi.get("email") or "").strip(),
        format_date(today),
    ]
    return [l for l in lines if l]


def compose_letter(header: List[str], greeting: str, paragraphs: List[str], name: str, closing: str = DEFAULT_CLOSING) -> str:
    blocks: List[str] = []
    if header:
        blocks.append("\n".join(header))
    blocks.append(greeting or DEFAULT_GREETING)
    blocks.extend(p for p in paragraphs if p.strip())
    blocks.append(f"{closing}\n{name}".rstrip())
    return "\n\n".join(blocks)


def normalise_model_paragraphs(greeting: Optional[str], paragraphs, name: str) -> tuple:
    """Take what the model returned and keep only a greeting and body paragraphs.

    Sign-offs, the candidate's name on its own and any header lines the model added are dropped,
    because the closing and the header are built from the profile.
    """
    greeting = (greeting or "").strip() or DEFAULT_GREETING
    if not GREETING_RE.match(greeting):
        greeting = DEFAULT_GREETING
    clean: List[str] = []
    for item in paragraphs if isinstance(paragraphs, list) else []:
        if not isinstance(item, str):
            continue
        text = clean_letter_text(item)
        if not text:
            continue
        first_line = text.splitlines()[0]
        if CLOSING_RE.match(first_line) or (GREETING_RE.match(first_line) and len(text.splitlines()) == 1):
            continue
        if name and text.strip().lower() == name.strip().lower():
            continue
        clean.append(" ".join(l.strip() for l in text.splitlines() if l.strip()))
    return greeting, clean


def sentences_of(paragraphs: List[str]) -> List[str]:
    out: List[str] = []
    for p in paragraphs:
        out.extend(split_sentences(p))
    return out
