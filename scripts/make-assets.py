from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import soundfile as sf

root = Path(__file__).resolve().parents[1]
build = root / 'build'
build.mkdir(exist_ok=True)
image = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((12, 12, 500, 500), radius=116, fill='#587eb8')
font = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 315)
draw.text((159, 9), 'y', fill='white', font=font)
draw.ellipse((359, 111, 411, 163), fill='#b5d9f4')
image.save(build / 'icon.png')
image.save(build / 'icon.ico', sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
fixtures = root / 'tests' / 'fixtures'
fixtures.mkdir(exist_ok=True)
rate=44100
t=np.arange(rate*4)/rate
tone=(np.sin(2*np.pi*220*t)*0.08*np.minimum(t*5,1)*np.minimum((4-t)*5,1)).astype(np.float32)
sf.write(fixtures / 'test-tone.flac', tone, rate, format='FLAC')
sf.write(fixtures / 'test-tone.mp3', tone, rate, format='MP3')
print('Icon and original test-tone fixtures generated.')
