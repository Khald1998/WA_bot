#!/usr/bin/env python3
# OCR-fills the OCR_content tracker for a list of image media_ids.
# OCR-ONLY: writes extracted text (or '' if none) keyed by media_id. Does NOT
# extract/insert IBANs and sends nothing. Idempotent via INSERT OR REPLACE.
import sys, os, sqlite3, time
from rapidocr_onnxruntime import RapidOCR

REPO = '/root/whatsapp-bot'
# Accept either media_ids directly (e.g. `worker.py <media_id> ...`, used by the
# bot on arrival) or a single listfile path (used for manual backlog runs).
args = [a for a in sys.argv[1:] if a.strip()]
if len(args) == 1 and os.path.isfile(args[0]):
    mids = [l.strip() for l in open(args[0]) if l.strip()]
else:
    mids = [a.strip() for a in args]
if not mids:
    sys.exit(0)

engine = RapidOCR()
con = sqlite3.connect(REPO + '/FPG.db', timeout=60)
con.execute('PRAGMA busy_timeout=60000')

done = 0
for mid in mids:
    p = os.path.join(REPO, 'media', mid)
    text = ''
    if os.path.exists(p):
        try:
            res, _ = engine(p)
            if res:
                text = '\n'.join(r[1] for r in res)
        except Exception:
            pass
    con.execute('INSERT OR REPLACE INTO OCR_content(media_id, image_body) VALUES(?,?)', (mid, text))
    con.commit()
    done += 1
con.close()
print(time.strftime('%F %T'), 'ocr_engine: OCR-ed', done, 'images')
