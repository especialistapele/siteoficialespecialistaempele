from io import BytesIO
from pathlib import Path
import requests
from PIL import Image, ImageOps, ImageDraw, ImageFont

BASE = "https://clwaotfbqwvxpykruwed.supabase.co/storage/v1/object/public/site-media/resultados"
OUT = Path("images")
OUT.mkdir(parents=True, exist_ok=True)

CASES = [
    ("melasma", "1789756541860"),
    ("estrias", "1790174394975"),
    ("celulite", "1790174216895"),
    ("cicatrizes-acne", "1790174135376"),
    ("remocoes-caso-01", "1789758288824"),
]

WIDTH, HEIGHT = 1600, 1000
GAP, PAD, LABEL_H = 20, 36, 74
BG = (248, 249, 251)
INK = (25, 39, 58)
ACCENT = (30, 73, 110)

def load_image(url):
    response = requests.get(url, timeout=40)
    response.raise_for_status()
    image = Image.open(BytesIO(response.content))
    image.load()
    return image.convert("RGB")

def get_font(size):
    for candidate in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
    ):
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            pass
    return ImageFont.load_default()

def build(before, after, name, dest):
    canvas = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(canvas)
    font_label = get_font(34)
    font_title = get_font(22)
    panel_w = (WIDTH - 2 * PAD - GAP) // 2
    panel_top = 140
    panel_h = HEIGHT - panel_top - PAD
    image_h = panel_h - LABEL_H
    items = [(before, "ANTES"), (after, "DEPOIS")]

    draw.text((PAD, 34), name.replace("-", " ").replace("_", " ").title(),
              font=font_title, fill=INK)
    draw.line((PAD, 92, WIDTH - PAD, 92), fill=(218, 225, 232), width=2)

    for i, (img, label) in enumerate(items):
        x = PAD + i * (panel_w + GAP)
        fitted = ImageOps.fit(img, (panel_w, image_h), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
        canvas.paste(fitted, (x, panel_top))
        draw.rectangle((x, panel_top + image_h, x + panel_w, panel_top + panel_h),
                       fill=(255, 255, 255))
        draw.text((x + 22, panel_top + image_h + 17), label, font=font_label, fill=ACCENT)
        draw.rectangle((x, panel_top, x + panel_w, panel_top + panel_h), outline=(222, 227, 232), width=2)

    canvas.save(dest, "WEBP", quality=88, method=6)
    print(f"Gerada: {dest} ({dest.stat().st_size} bytes)")

def main():
    session = requests.Session()
    session.headers.update({"User-Agent": "EspecialistaEmPele-ImageMontage/1.0"})
    for slug, stem in CASES:
        before_url = f"{BASE}/{stem}-antes.webp"
        after_url = f"{BASE}/{stem}-depois.webp"
        try:
            before = load_image(before_url)
            after = load_image(after_url)
        except Exception as exc:
            raise RuntimeError(
                f"Não foi possível obter o par completo de {slug}. "
                f"Antes: {before_url} | Depois: {after_url}. Erro: {exc}"
            ) from exc
        target = OUT / f"antes-depois-{slug}.webp"
        build(before, after, slug, target)

if __name__ == "__main__":
    main()
