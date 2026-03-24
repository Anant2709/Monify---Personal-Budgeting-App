import os
import time
import hashlib
import base64
from openai import OpenAI

_client = None
_cache = {}
CACHE_TTL = 120


def get_client():
    global _client
    if _client is None:
        api_key = os.environ.get("OPENAI_API_KEY", "")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        _client = OpenAI(api_key=api_key)
    return _client


def _cache_key(prompt: str, system_instruction: str = "") -> str:
    raw = f"{prompt}|||{system_instruction}"
    return hashlib.md5(raw.encode()).hexdigest()


def generate_text(prompt: str, system_instruction: str = "") -> str:
    key = _cache_key(prompt, system_instruction)
    now = time.time()
    if key in _cache and (now - _cache[key]["ts"]) < CACHE_TTL:
        return _cache[key]["text"]

    client = get_client()
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
    )
    text = response.choices[0].message.content
    _cache[key] = {"text": text, "ts": now}
    return text


def generate_text_stream(prompt: str, system_instruction: str = ""):
    client = get_client()
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    stream = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        stream=True,
    )
    for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


def analyze_image(image_bytes: bytes, mime_type: str, prompt: str) -> str:
    client = get_client()
    b64_image = base64.b64encode(image_bytes).decode("utf-8")
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{b64_image}"},
                    },
                    {"type": "text", "text": prompt},
                ],
            }
        ],
    )
    return response.choices[0].message.content
