#!/usr/bin/env python3
"""
Royal Throne — Branded Image Generator for Social Media Marketing.
Generates 1080x1080 images with 6 rotating templates.

Usage:
    python generate_image.py <post_index> [output_path]

Reads from marketing/posts.json, generates branded image.
Requires: Pillow, Inter font files in /tmp/fonts/
"""

import json
import math
import os
import sys
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

# ─── Brand Colors ───
NAVY = "#080C14"
TEAL = "#00D4A0"
GOLD = "#F5A623"
WHITE = "#F0F6FF"
DARK_TEAL = "#00A37D"
LIGHT_NAVY = "#0F1A2E"

SIZE = 1080
PADDING = 80

# ─── Font Paths ───
FONT_DIR = os.environ.get("FONT_DIR", "/tmp/fonts")


def get_font(weight="Regular", size=48):
    """Load Inter font with fallback to default."""
    font_map = {
        "Regular": "Inter-Regular.ttf",
        "Bold": "Inter-Bold.ttf",
        "ExtraBold": "Inter-ExtraBold.ttf",
        "Black": "Inter-Black.ttf",
        "SemiBold": "Inter-SemiBold.ttf",
        "Medium": "Inter-Medium.ttf",
    }
    font_file = font_map.get(weight, "Inter-Regular.ttf")
    font_path = os.path.join(FONT_DIR, font_file)
    try:
        return ImageFont.truetype(font_path, size)
    except (OSError, IOError):
        # Fallback: try system fonts
        for fallback in [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ]:
            try:
                return ImageFont.truetype(fallback, size)
            except (OSError, IOError):
                continue
        return ImageFont.load_default()


def load_crown_watermark(target_size=120):
    """Load and resize the crown icon for watermark use."""
    script_dir = Path(__file__).parent.parent
    icon_path = script_dir / "assets" / "icon.png"
    if not icon_path.exists():
        return None
    try:
        icon = Image.open(icon_path).convert("RGBA")
        icon = icon.resize((target_size, target_size), Image.LANCZOS)
        # Make semi-transparent
        data = icon.getdata()
        new_data = []
        for item in data:
            if item[3] > 0:
                new_data.append((item[0], item[1], item[2], min(item[3], 40)))
            else:
                new_data.append(item)
        icon.putdata(new_data)
        return icon
    except Exception:
        return None


def draw_footer(draw, img, crown_icon=None):
    """Draw consistent footer branding on all templates."""
    footer_y = SIZE - 90
    # Separator line
    draw.line([(PADDING, footer_y), (SIZE - PADDING, footer_y)], fill=GOLD, width=2)

    footer_font = get_font("Medium", 24)
    footer_text = "Royal Throne \u2014 by Oops Studio"
    bbox = draw.textbbox((0, 0), footer_text, font=footer_font)
    text_w = bbox[2] - bbox[0]
    draw.text(
        ((SIZE - text_w) / 2, footer_y + 16),
        footer_text,
        fill=GOLD,
        font=footer_font,
    )

    # Crown watermark in bottom-right corner
    if crown_icon:
        img.paste(crown_icon, (SIZE - 160, SIZE - 160), crown_icon)


def wrap_text(text, font, draw, max_width):
    """Word-wrap text to fit within max_width pixels."""
    words = text.split()
    lines = []
    current_line = ""
    for word in words:
        test = f"{current_line} {word}".strip()
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current_line = test
        else:
            if current_line:
                lines.append(current_line)
            current_line = word
    if current_line:
        lines.append(current_line)
    return lines


def draw_centered_text(draw, text, font, fill, y, max_width=None):
    """Draw text centered horizontally, return bottom y."""
    if max_width is None:
        max_width = SIZE - PADDING * 2
    lines = wrap_text(text, font, draw, max_width)
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        draw.text(((SIZE - w) / 2, y), line, fill=fill, font=font)
        y += h + 12
    return y


# ─── Template 1: Bold Statement ───
def template_bold_statement(post, img, draw, crown):
    """Big white text on navy, teal subtext, gold separator."""
    # Background
    draw.rectangle([(0, 0), (SIZE, SIZE)], fill=NAVY)

    headline_font = get_font("Black", 64)
    sub_font = get_font("Regular", 32)

    text = post.get("image_text", "")
    subtext = post.get("image_subtext", "")

    # Calculate vertical centering
    lines = wrap_text(text, headline_font, draw, SIZE - PADDING * 2)
    total_h = len(lines) * 76
    if subtext:
        total_h += 80  # separator + subtext
    start_y = (SIZE - total_h) / 2 - 40

    # Main headline
    y = draw_centered_text(draw, text, headline_font, WHITE, start_y)

    # Gold separator
    sep_y = y + 20
    draw.line([(SIZE / 2 - 100, sep_y), (SIZE / 2 + 100, sep_y)], fill=GOLD, width=4)

    # Subtext
    if subtext:
        draw_centered_text(draw, subtext, sub_font, TEAL, sep_y + 30)

    draw_footer(draw, img, crown)


# ─── Template 2: Split Card ───
def template_split_card(post, img, draw, crown):
    """Navy top + teal gradient bottom band."""
    # Navy background
    draw.rectangle([(0, 0), (SIZE, SIZE)], fill=NAVY)

    # Teal bottom band
    band_top = SIZE - 320
    for i in range(320):
        alpha = i / 320
        r = int(8 * (1 - alpha) + 0 * alpha)
        g = int(12 * (1 - alpha) + 212 * alpha)
        b = int(20 * (1 - alpha) + 160 * alpha)
        color = f"#{r:02x}{g:02x}{b:02x}"
        draw.line([(0, band_top + i), (SIZE, band_top + i)], fill=color)

    headline_font = get_font("ExtraBold", 56)
    sub_font = get_font("Regular", 30)

    text = post.get("image_text", "")
    subtext = post.get("image_subtext", "")

    # Headline in top section
    draw_centered_text(draw, text, headline_font, WHITE, 180)

    # Subtext in bottom band
    if subtext:
        draw_centered_text(draw, subtext, sub_font, WHITE, band_top + 60)

    draw_footer(draw, img, crown)


# ─── Template 3: Centered Quote ───
def template_centered_quote(post, img, draw, crown):
    """Big gold quotation mark, centered text."""
    draw.rectangle([(0, 0), (SIZE, SIZE)], fill=NAVY)

    # Big gold quotation mark
    quote_font = get_font("Black", 240)
    draw.text((PADDING - 20, 80), "\u201c", fill=GOLD, font=quote_font)

    headline_font = get_font("Bold", 48)
    sub_font = get_font("Regular", 28)

    text = post.get("image_text", "")
    subtext = post.get("image_subtext", "")

    # Main quote text
    y = draw_centered_text(draw, text, headline_font, WHITE, 320)

    # Subtext / attribution
    if subtext:
        draw_centered_text(draw, subtext, sub_font, TEAL, y + 30)

    draw_footer(draw, img, crown)


# ─── Template 4: Stats Card ───
def template_stats_card(post, img, draw, crown):
    """Huge faded number bg, gold stat foreground."""
    draw.rectangle([(0, 0), (SIZE, SIZE)], fill=NAVY)

    stat = post.get("image_stat", "")
    text = post.get("image_text", "")
    subtext = post.get("image_subtext", "")

    # Huge faded stat in background
    if stat:
        bg_font = get_font("Black", 300)
        bbox = draw.textbbox((0, 0), stat, font=bg_font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        # Draw very faintly
        overlay = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        overlay_draw.text(
            ((SIZE - w) / 2, (SIZE - h) / 2 - 80),
            stat,
            fill=(245, 166, 35, 30),  # Gold at ~12% opacity
            font=bg_font,
        )
        img.paste(Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB"))
        draw = ImageDraw.Draw(img)

        # Gold stat foreground (smaller)
        stat_font = get_font("Black", 120)
        bbox = draw.textbbox((0, 0), stat, font=stat_font)
        w = bbox[2] - bbox[0]
        draw.text(((SIZE - w) / 2, 200), stat, fill=GOLD, font=stat_font)

    headline_font = get_font("Bold", 44)
    sub_font = get_font("Regular", 28)

    # Headline below stat
    y = draw_centered_text(draw, text, headline_font, WHITE, 400)

    if subtext:
        draw_centered_text(draw, subtext, sub_font, TEAL, y + 20)

    draw_footer(draw, img, crown)


# ─── Template 5: List Card ───
def template_list_card(post, img, draw, crown):
    """Title + teal-bulleted list items."""
    draw.rectangle([(0, 0), (SIZE, SIZE)], fill=NAVY)

    title_font = get_font("ExtraBold", 52)
    item_font = get_font("Regular", 34)
    bullet_font = get_font("Bold", 34)

    text = post.get("image_text", "")
    items = post.get("image_lines", [])

    # Title
    y = draw_centered_text(draw, text, title_font, GOLD, 120)
    y += 30

    # Gold separator
    draw.line([(PADDING, y), (SIZE - PADDING, y)], fill=GOLD, width=3)
    y += 40

    # List items
    for item in items:
        # Teal bullet
        draw.text((PADDING + 10, y), "\u25cf", fill=TEAL, font=bullet_font)
        # Wrap text for long items
        item_lines = wrap_text(item, item_font, draw, SIZE - PADDING * 2 - 60)
        for line in item_lines:
            draw.text((PADDING + 55, y), line, fill=WHITE, font=item_font)
            y += 48
        y += 8

    draw_footer(draw, img, crown)


# ─── Template 6: CTA Card ───
def template_cta_card(post, img, draw, crown):
    """Crown icon + headline + gold "button" shape."""
    draw.rectangle([(0, 0), (SIZE, SIZE)], fill=NAVY)

    # Load crown icon (larger, more prominent)
    script_dir = Path(__file__).parent.parent
    icon_path = script_dir / "assets" / "icon.png"
    if icon_path.exists():
        try:
            cta_crown = Image.open(icon_path).convert("RGBA")
            cta_crown = cta_crown.resize((200, 200), Image.LANCZOS)
            x = (SIZE - 200) // 2
            img.paste(cta_crown, (x, 100), cta_crown)
        except Exception:
            pass

    headline_font = get_font("ExtraBold", 52)
    sub_font = get_font("Regular", 30)
    btn_font = get_font("Bold", 36)

    text = post.get("image_text", "")
    subtext = post.get("image_subtext", "")

    # Headline
    y = draw_centered_text(draw, text, headline_font, WHITE, 340)

    # Subtext
    if subtext:
        y = draw_centered_text(draw, subtext, sub_font, TEAL, y + 20)

    # Gold CTA "button"
    btn_text = "DOWNLOAD FREE"
    bbox = draw.textbbox((0, 0), btn_text, font=btn_font)
    btn_w = bbox[2] - bbox[0] + 80
    btn_h = bbox[3] - bbox[1] + 40
    btn_x = (SIZE - btn_w) / 2
    btn_y = y + 50

    # Rounded rectangle button
    r = 25
    draw.rounded_rectangle(
        [(btn_x, btn_y), (btn_x + btn_w, btn_y + btn_h)],
        radius=r,
        fill=GOLD,
    )
    # Button text
    draw.text(
        (btn_x + 40, btn_y + 14),
        btn_text,
        fill=NAVY,
        font=btn_font,
    )

    # URL below button
    url_font = get_font("Regular", 22)
    url = "muhammadhamx.github.io/Royal-Throne"
    bbox = draw.textbbox((0, 0), url, font=url_font)
    url_w = bbox[2] - bbox[0]
    draw.text(((SIZE - url_w) / 2, btn_y + btn_h + 25), url, fill=TEAL, font=url_font)

    draw_footer(draw, img, crown)


# ─── Template Dispatch ───
TEMPLATES = {
    1: template_bold_statement,
    2: template_split_card,
    3: template_centered_quote,
    4: template_stats_card,
    5: template_list_card,
    6: template_cta_card,
}


def generate_image(post, output_path="marketing/output.png"):
    """Generate a branded marketing image from a post dict."""
    img = Image.new("RGB", (SIZE, SIZE), NAVY)
    draw = ImageDraw.Draw(img)
    crown = load_crown_watermark()

    template_num = post.get("template", 1)
    template_fn = TEMPLATES.get(template_num, template_bold_statement)
    template_fn(post, img, draw, crown)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    img.save(output_path, "PNG", quality=95)
    print(f"Image saved: {output_path} (template {template_num})")
    return output_path


def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_image.py <post_index> [output_path]")
        sys.exit(1)

    index = int(sys.argv[1])
    output = sys.argv[2] if len(sys.argv) > 2 else "/tmp/marketing_image.png"

    # Load posts
    script_dir = Path(__file__).parent
    posts_path = script_dir / "posts.json"
    with open(posts_path) as f:
        posts = json.load(f)

    if index < 0 or index >= len(posts):
        print(f"Error: index {index} out of range (0-{len(posts) - 1})")
        sys.exit(1)

    post = posts[index]
    generate_image(post, output)


if __name__ == "__main__":
    main()
