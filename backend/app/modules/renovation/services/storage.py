import hashlib
import shutil
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import BinaryIO

from ..core.errors import FileTooLargeError, NotFoundError, UnsupportedFileTypeError
from ..utils.files import ALLOWED_FILE_KINDS, file_extension

CHUNK_SIZE = 1024 * 1024


@dataclass(frozen=True)
class StoredFile:
    stored_filename: str
    content_type: str
    size_bytes: int
    sha256: str


class FileStorage:
    """Local disk storage. Paths are always derived from generated names, never from client input."""

    def __init__(self, root: Path, max_size_bytes: int) -> None:
        self.root = root.resolve()
        self.max_size_bytes = max_size_bytes

    def _project_dir(self, project_id: int) -> Path:
        return self.root / "projects" / str(int(project_id))

    def path_for(self, project_id: int, stored_filename: str) -> Path:
        path = (self._project_dir(project_id) / stored_filename).resolve()
        if not path.is_relative_to(self.root) or path.parent != self._project_dir(project_id).resolve():
            raise NotFoundError("Stored file not found")
        return path

    def save(self, project_id: int, source: BinaryIO, original_filename: str) -> StoredFile:
        extension = file_extension(original_filename)
        kind = ALLOWED_FILE_KINDS.get(extension)
        if kind is None:
            raise UnsupportedFileTypeError(
                f"File type '{extension or 'none'}' is not allowed",
                details={"allowed": sorted(ALLOWED_FILE_KINDS)},
            )

        directory = self._project_dir(project_id)
        directory.mkdir(parents=True, exist_ok=True)
        stored_filename = f"{uuid.uuid4().hex}{extension}"
        temp_path = directory / f".{stored_filename}.part"
        digest = hashlib.sha256()
        size = 0
        try:
            with temp_path.open("wb") as target:
                while chunk := source.read(CHUNK_SIZE):
                    size += len(chunk)
                    if size > self.max_size_bytes:
                        raise FileTooLargeError(
                            f"File exceeds the {self.max_size_bytes // (1024 * 1024)} MB limit"
                        )
                    digest.update(chunk)
                    target.write(chunk)
            if size == 0:
                raise UnsupportedFileTypeError("Uploaded file is empty")
            if not kind.matches(temp_path):
                raise UnsupportedFileTypeError(f"File content does not match the '{extension}' extension")
            final_path = directory / stored_filename
            temp_path.replace(final_path)
        except BaseException:
            temp_path.unlink(missing_ok=True)
            raise
        return StoredFile(stored_filename, kind.content_type, size, digest.hexdigest())

    def delete(self, project_id: int, stored_filename: str) -> None:
        self.path_for(project_id, stored_filename).unlink(missing_ok=True)

    def remove_project_dir(self, project_id: int) -> None:
        shutil.rmtree(self._project_dir(project_id), ignore_errors=True)
