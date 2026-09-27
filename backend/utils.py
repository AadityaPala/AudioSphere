import json
import urllib.request
import urllib.parse

def get_yt_title(url):
    oembed_url = f"https://www.youtube.com/oembed?url={urllib.parse.quote(url)}&format=json"
    try:
        with urllib.request.urlopen(oembed_url) as response:
            data = json.loads(response.read().decode())
            return data.get("title", "Unknown Title")
    except Exception:
        return "Unknown Title"