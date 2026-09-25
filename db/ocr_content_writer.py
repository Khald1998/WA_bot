#!/usr/bin/env python3
import os, sqlite3  # stdlib: filesystem paths and the SQLite driver — this module is the ONLY place the Python OCR pipeline touches the DB

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'FPG.db')  # resolve FPG.db relative to this db/ module

def open_connection():  # open the shared FPG database for the OCR writer
    con = sqlite3.connect(DB_PATH, timeout=60)  # open with a 60s connect timeout
    con.execute('PRAGMA busy_timeout=60000')  # wait up to 60s on a locked DB before erroring
    return con  # hand the connection back to the caller

def save_ocr_content(con, media_id, text):  # upsert one OCR result keyed by media_id
    con.execute('INSERT OR REPLACE INTO OCR_content(media_id, image_body) VALUES(?,?)', (media_id, text))  # upsert the OCR text keyed by media_id
    con.commit()  # persist each row immediately so partial runs still save progress
