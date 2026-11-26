import re
import unicodedata
import zipfile
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path, PurePosixPath, PureWindowsPath


def _starts_with(*signatures: bytes) -> Callable[[Path], bool]:
    def check(path: Path) -> bool:
        with path.open("rb") as handle:
            head = handle.read(16)
        return any(head.startswith(sig) for sig in signatures)

    return check


def _office_archive(marker: str) -> Callable[[Path], bool]:
    def check(path: Path) -> bool:
        if not _starts_with(b"PK\x03\x04")(path):
            return False
        try:
            with zipfile.ZipFile(path) as archive:
                names = set(archive.namelist())
        except zipfile.BadZipFile:
            return False
        return "[Content_Types].xml" in names and marker in names

    return check


@dataclass(frozen=True)
class FileKind:
    content_type: str
    matches: Callable[[Path], bool]


ALLOWED_FILE_KINDS: dict[str, FileKind] = {
    ".pdf": FileKind("application/pdf", _starts_with(b"%PDF-")),
    ".png": FileKind("image/png", _starts_with(b"\x89PNG\r\n\x1a\n")),
    ".jpg": FileKind("image/jpeg", _starts_with(b"\xff\xd8\xff")),
    ".jpeg": FileKind("image/jpeg", _starts_with(b"\xff\xd8\xff")),
    ".docx": FileKind(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        _office_archive("word/document.xml"),
    ),
    ".xlsx": FileKind(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        _office_archive("xl/workbook.xml"),
    ),
}

_UNSAFE_CHARS = re.compile(r'[\x00-\x1f\x7f<>:"/\\|?*]')
_WHITESPACE = re.compile(r"\s+")


def safe_display_filename(raw: str | None, *, max_length: int = 255) -> str:
    """Reduce a client-supplied filename to a bare, printable name. Never used as a storage path."""
    if not raw:
        return "file"
    name = PureWindowsPath(PurePosixPath(raw).name).name
    name = unicodedata.normalize("NFC", name)
    name = _UNSAFE_CHARS.sub("_", name)
    name = _WHITESPACE.sub(" ", name).strip(" .")
    if not name:
        return "file"
    if len(name) > max_length:
        suffix = Path(name).suffix[:16]
        name = name[: max_length - len(suffix)] + suffix
    return name


def file_extension(filename: str) -> str:
    return Path(filename).suffix.lower()
