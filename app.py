from flask import Flask, render_template, jsonify, request, session, redirect
import random
import sqlite3

app = Flask(__name__)
app.secret_key = "zcool_secret"

TOTAL = 120

# ============ ⭐ เพิ่มระบบ Users ============
USERS = {
    "admin": {"user": "zocoolsup", "pass": "win112233", "role": "admin"},
    "viewer": {"user": "zocooladmin", "pass": "admin112233", "role": "viewer"}
}
# ============================================

reward_pool = [
    ("30,000 ", 1),
    ("20,000 ", 1),
    ("10,000 ", 1),

    ("ฟรีสปินเบท 30", 7),
    ("ฟรีสปินเบท 20", 10),
    ("ฟรีสปินเบท 10", 10),
    ("เครดิตฟรี 300 ", 10),
    ("เครดิตฟรี 200 ", 10),
    ("เครดิตฟรี 100 ", 10),
]

rewards = []
stock = {}

for name, qty in reward_pool:
    stock[name] = qty
    rewards += [name] * qty

while len(rewards) < TOTAL:
    rewards.append("ไม่ถูกรางวัล")

random.shuffle(rewards)

logs = []


# ================= DB =================

def get_db():
    return sqlite3.connect("game.db", check_same_thread=False)

def init_db():
    db = get_db()
    c = db.cursor()

    c.execute("""
    CREATE TABLE IF NOT EXISTS cells (
        id INTEGER PRIMARY KEY,
        reward TEXT,
        opened INTEGER,
        user TEXT
    )
    """)

    try:
        c.execute("ALTER TABLE cells ADD COLUMN user TEXT")
    except:
        pass

    c.execute("SELECT COUNT(*) FROM cells")
    if c.fetchone()[0] == 0:
        for i in range(TOTAL):
            c.execute(
                "INSERT INTO cells (id, reward, opened, user) VALUES (?, ?, ?, ?)",
                (i, rewards[i], 0, "")
            )

    db.commit()

init_db()


# ================= ⭐ เพิ่ม ROUTE LOGIN =================

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":
        u = request.form.get("user")
        p = request.form.get("pass")

        # ตรวจ user admin
        if u == USERS["admin"]["user"] and p == USERS["admin"]["pass"]:
            session["role"] = "admin"
            return redirect("/")

        # ตรวจ user viewer
        if u == USERS["viewer"]["user"] and p == USERS["viewer"]["pass"]:
            session["role"] = "viewer"
            return redirect("/view")

        return render_template("login.html", error="❌ ชื่อผู้ใช้หรือรหัสผ่านผิด")

    return render_template("login.html")


# ================= ROUTE =================

@app.route("/")
def index():
    # ถ้าไม่ login → เด้งไป login
    if "role" not in session:
        return redirect("/login")

    return render_template("index.html")


@app.route("/view")
def view_only():
    # ต้องเป็น viewer เท่านั้น
    if session.get("role") != "viewer":
        return redirect("/login")

    return render_template("view.html")


@app.route("/admin", methods=["GET", "POST"])
def admin():

    # ⭐ viewer เข้า admin ไม่ได้
    if session.get("role") != "admin":
        return "⛔ ไม่มีสิทธิ์", 403

    if request.method == "POST":
        pwd = request.form.get("password")
        # admin route ใช้ session role แล้ว → ไม่ใช้ password เดิม
        return redirect("/admin")

    db = get_db()
    c = db.cursor()

    c.execute("SELECT reward FROM cells ORDER BY id")
    data = [row[0] for row in c.fetchall()]

    return render_template("admin.html", rewards=data)


@app.route("/admin/set", methods=["POST"])
def set_reward():

    if session.get("role") != "admin":
        return jsonify({"error": "unauthorized"}), 403

    data = request.get_json()
    i = int(data.get("index"))
    value = data.get("reward")

    db = get_db()
    c = db.cursor()

    c.execute("UPDATE cells SET reward=? WHERE id=?", (value, i))
    db.commit()

    return jsonify({"ok": True})


@app.route("/admin/reset", methods=["POST"])
def reset_admin():

    if session.get("role") != "admin":
        return jsonify({"error": "unauthorized"}), 403

    db = get_db()
    c = db.cursor()

    for i in range(TOTAL):
        c.execute(
            "UPDATE cells SET reward=?, opened=0, user='' WHERE id=?",
            ("ว่างเปล่า", i)
        )

    db.commit()
    logs.clear()

    return jsonify({"ok": True})


# ================= OPEN =================

@app.route("/open/<int:i>", methods=["POST"])
def open_cell(i):

    # ⭐ viewer เปิดช่องไม่ได้
    if session.get("role") != "admin":
        return jsonify({"error": "viewer_not_allowed"}), 403

    data = request.get_json()
    user = data.get("user")

    if i < 0 or i >= TOTAL:
        return jsonify({"error": "invalid index"}), 400

    db = get_db()
    c = db.cursor()

    c.execute("SELECT reward, opened FROM cells WHERE id=?", (i,))
    row = c.fetchone()

    if row is None:
        return jsonify({"error": "not found"}), 404

    if row[1] == 1:
        return jsonify({"error": "opened"}), 400

    reward = row[0]

    c.execute(
        "UPDATE cells SET opened=1, user=? WHERE id=?",
        (user, i)
    )
    db.commit()

    logs.append({
        "user": user,
        "reward": reward,
        "index": i + 1
    })

    return jsonify({
        "user": user,
        "reward": reward,
        "index": i + 1
    })


# ================= STATS =================

@app.route("/stats")
def stats():
    db = get_db()
    c = db.cursor()

    c.execute("SELECT reward, opened FROM cells")
    data = c.fetchall()

    stock_live = {k: v for k, v in stock.items()}

    for reward, opened_flag in data:
        if opened_flag and reward in stock_live:
            stock_live[reward] -= 1

    return jsonify({
        "log": logs,
        "stock": stock_live,
        "opened": [r[1] for r in data],
        "rewards": [r[0] for r in data]
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
