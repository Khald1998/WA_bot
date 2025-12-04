import sqlite3

def extract_mid(serialized):
    parts = serialized.split('_')
    if len(parts) >= 4:
        return parts[-2]
    return None

db_path = '/root/whatsapp-bot/FPG.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT rowid, _serialized FROM FPG_logs_old WHERE mid IS NULL OR mid = ''")
rows = cursor.fetchall()

for rowid, serialized in rows:
    mid = extract_mid(serialized)
    if mid:
        cursor.execute("UPDATE FPG_logs_old SET mid = ? WHERE rowid = ?", (mid, rowid))

conn.commit()
conn.close()
print("mid values updated successfully.")
