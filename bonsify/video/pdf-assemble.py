# Joins a folder of slide JPEGs into one PDF. Usage: python3 pdf-assemble.py <folder> <out.pdf>
import sys, glob
from PIL import Image
files = sorted(f for f in glob.glob(sys.argv[1] + "/*.jpg") if not f.endswith("-f.jpg"))
ims = []
for f in files:
    im = Image.open(f).convert("RGB")
    im = im.resize((1600, round(1600 * im.height / im.width)), Image.LANCZOS)
    foot = f[:-4] + "-f.jpg"
    if glob.glob(foot):
        ft = Image.open(foot).convert("RGB")
        ft = ft.resize((1600, round(1600 * ft.height / ft.width)), Image.LANCZOS)
        page = Image.new("RGB", (1600, im.height + ft.height))
        page.paste(im, (0, 0)); page.paste(ft, (0, im.height))
        im = page
    ims.append(im)
ims[0].save(sys.argv[2], save_all=True, append_images=ims[1:], resolution=120.0, quality=76, optimize=True)
