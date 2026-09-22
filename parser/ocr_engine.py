#!/usr/bin/env python3
import sys, os, sqlite3, time  # stdlib imports; OCR-fills the OCR_content tracker for a list of image media_ids. OCR-ONLY: writes extracted text (or '' if none) keyed by media_id. Does NOT extract/insert IBANs and sends nothing. Idempotent via INSERT OR REPLACE.
from rapidocr_onnxruntime import RapidOCR  # the RapidOCR (ONNX runtime) engine used to read text from images

REPO = '/root/whatsapp-bot'  # absolute repo root, used to locate the DB and media folder
args = [a for a in sys.argv[1:] if a.strip()]  # non-empty CLI args; accept either media_ids directly (e.g. `worker.py <media_id> ...`, used by the bot on arrival) or a single listfile path (used for manual backlog runs).
if len(args) == 1 and os.path.isfile(args[0]):  # a single arg that is an existing file means listfile mode
    mids = [l.strip() for l in open(args[0]) if l.strip()]  # read one media_id per non-blank line
else:  # otherwise treat the args themselves as media_ids
    mids = [a.strip() for a in args]  # trim each media_id argument
if not mids:  # nothing to do when no media_ids were provided
    sys.exit(0)  # exit cleanly with no work

engine = RapidOCR()  # construct the OCR engine once for the whole batch
con = sqlite3.connect(REPO + '/FPG.db', timeout=60)  # open the shared FPG database with a 60s connect timeout
con.execute('PRAGMA busy_timeout=60000')  # wait up to 60s on a locked DB before erroring

done = 0  # count of images processed this run
for mid in mids:  # process each requested media_id
    p = os.path.join(REPO, 'media', mid)  # absolute path to the image file on disk
    text = ''  # default to empty text (stored even when the image is missing or OCR fails)
    if os.path.exists(p):  # only attempt OCR when the image file is present
        try:  # guard OCR so one bad image never aborts the batch
            res, _ = engine(p)  # run OCR; res is a list of [box, text, score] rows
            if res:  # only join when the engine returned something
                text = '\n'.join(r[1] for r in res)  # concatenate every detected text line
        except Exception:  # swallow any OCR failure
            pass  # leave text as '' for this media_id
    con.execute('INSERT OR REPLACE INTO OCR_content(media_id, image_body) VALUES(?,?)', (mid, text))  # upsert the OCR text keyed by media_id
    con.commit()  # persist each row immediately so partial runs still save progress
    done += 1  # tally this image as processed
con.close()  # release the database handle
print(time.strftime('%F %T'), 'ocr_engine: OCR-ed', done, 'images')  # emit a timestamped summary line
