from datetime import UTC, date, datetime


def utcnow() -> datetime:
    return datetime.now(UTC)


def today() -> date:
    return date.today()
