from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_hash_is_not_plaintext():
    assert hash_password("secret123") != "secret123"


def test_verify_correct_and_wrong_password():
    h = hash_password("secret123")
    assert verify_password("secret123", h)
    assert not verify_password("wrong", h)


def test_verify_garbage_hash_returns_false():
    assert verify_password("x", "not-a-hash") is False


def test_token_roundtrip():
    token = create_access_token(5, "teacher")
    data = decode_access_token(token)
    assert data["sub"] == "5" and data["role"] == "teacher"


def test_tampered_token_rejected():
    token = create_access_token(5, "teacher")
    assert decode_access_token(token + "x") is None