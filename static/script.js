const board = document.getElementById("board");
const modal = document.getElementById("modal");
const text = document.getElementById("text");
const userText = document.getElementById("userText");
const log = document.getElementById("log");

const searchInput = document.getElementById("searchInput"); // 🔥 เพิ่ม
const cells = [];

// =========================
// 🔊 เสียง
// =========================
const soundWin = new Audio("https://www.myinstants.com/media/sounds/tada-fanfare.mp3");
const soundLose = new Audio("https://www.myinstants.com/media/sounds/fail.mp3");

// 120 ช่อง
for (let i = 0; i < 120; i++) {
    const c = document.createElement("div");
    c.className = "cell";
    c.innerText = i + 1;

    c.onclick = () => openCell(i, c);

    board.appendChild(c);
    cells.push(c);
}

// =================
// 🔥 FIX: ค้นหาแล้วเปิดช่อง
// =================
function searchOpen() {
    const val = parseInt(searchInput.value);

    if (!val || val < 1 || val > 120) {
        alert("กรอกเลข 1 - 120");
        return;
    }

    const i = val - 1; // 🔥 แปลงเป็น index

    const cell = cells[i];
    if (!cell) return;

    openCell(i, cell);
}

// =================
// เปิดช่อง
// =================
async function openCell(i, cell) {

    const user = document.getElementById("userInput").value.trim();
    if (!user) return alert("ใส่ USER");

    if (cell.classList.contains("opened")) return;

    try {
        const res = await fetch(`/open/${i}`, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({user})
        });

        const data = await res.json();

        if (!res.ok || data.error) {
            alert(data.error || "เปิดไม่ได้");
            return;
        }

        cell.classList.add("opened");
        cell.innerText = data.reward;

        if (data.reward.includes("ไม่ถูกรางวัล") || data.reward === "ว่างเปล่า") {
            soundLose.currentTime = 0;
            soundLose.play();
        } else {
            soundWin.currentTime = 0;
            soundWin.play();
        }

        if (data.reward.includes("30,000") || data.reward.includes("20,000")) {
            spawnConfetti();
        }

        userText.innerText = data.user;
        text.innerText = `เปิดช่องที่ ${data.index} 🎁 ${data.reward}`;

        modal.style.display = "flex";

        updateLog();

    } catch (err) {
        alert("❌ server error");
    }
}

// =================
// 🎉 confetti
// =================
function spawnConfetti() {
    for (let i = 0; i < 25; i++) {
        const c = document.createElement("div");
        c.className = "confetti";

        c.style.left = Math.random() * window.innerWidth + "px";
        c.style.top = "0px";

        c.style.background = ["gold", "red", "cyan", "lime"][Math.floor(Math.random()*4)];

        document.body.appendChild(c);

        setTimeout(() => c.remove(), 1000);
    }
}

// =================
// ปิด popup
// =================
function closeModal() {
    modal.style.display = "none";
}

modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
});

// =================
// realtime
// =================
async function updateLog() {
    const res = await fetch("/stats");
    const data = await res.json();

    const stock = data.stock;

    document.getElementById("big").innerHTML =
        `30,000 เหลือ ${stock["30,000 "]}<br>
         20,000 เหลือ ${stock["20,000 "]}<br>
         10,000 เหลือ ${stock["10,000 "]}`;

    document.getElementById("small").innerHTML =
        `ฟรีสปิน 30 เหลือ ${stock["ฟรีสปินเบท 30"]}<br>
         ฟรีสปิน 20 เหลือ ${stock["ฟรีสปินเบท 20"]}<br>
         ฟรีสปิน 10 เหลือ ${stock["ฟรีสปินเบท 10"]}<br>
         เครดิต 300 เหลือ ${stock["เครดิตฟรี 300 "]}<br>
         เครดิต 200 เหลือ ${stock["เครดิตฟรี 200 "]}<br>
         เครดิต 100 เหลือ ${stock["เครดิตฟรี 100 "]}`;

    log.innerHTML = "";
    data.log.forEach(r => {
        const d = document.createElement("div");
        d.innerText = `${r.user} | ${r.reward}`;
        log.appendChild(d);
    });

    if (data.opened && data.rewards) {

        const allClosed = data.opened.every(o => o === 0);

        if (allClosed) {
            resetBoardUI(data.rewards);
        }

        data.opened.forEach((o, i) => {
            if (o === 1) {
                cells[i].classList.add("opened");
                cells[i].innerText = data.rewards[i];
            }
        });
    }
}

function resetBoardUI(rewards) {
    cells.forEach((c, i) => {
        c.classList.remove("opened");
        c.innerText = i + 1;
    });
}

// โหลดครั้งแรก
updateLog();

// realtime
setInterval(updateLog, 2000);

// =================
// copy table
// =================
function copyBoard() {

    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.gap = "20px";
    wrapper.style.padding = "20px";
    wrapper.style.background = "#0b1a2a";
    wrapper.style.color = "white";
    wrapper.style.fontFamily = "sans-serif";
    wrapper.style.alignItems = "flex-start";

    // =========================
    // 🔥 CLONE ตาราง
    // =========================
    const boardClone = board.cloneNode(true);

    boardClone.style.display = "grid";
    boardClone.style.gridTemplateColumns = "repeat(12, 1fr)";
    boardClone.style.gridTemplateRows = "repeat(10, 1fr)";
    boardClone.style.gap = "2px";

    const BASE_W = 1200;
    const BASE_H = 1000;

    boardClone.style.width = BASE_W + "px";
    boardClone.style.height = BASE_H + "px";

    // =========================
    // 🔥 ปรับฟอนต์ตัวเลขให้ใหญ่ขึ้น (18px)
    // =========================
    boardClone.querySelectorAll(".cell").forEach(c => {
        c.style.fontSize = "20px";    // ← ปรับจาก 13px → 18px
        c.style.padding = "0";
    });

    wrapper.appendChild(boardClone);

    // =========================
    // กล่องรางวัล (ขวา)
    // =========================
    const rewardBox = document.createElement("div");
    rewardBox.style.minWidth = "260px";
    rewardBox.style.border = "3px solid #6fd3ff";
    rewardBox.style.borderRadius = "12px";
    rewardBox.style.padding = "15px";
    rewardBox.style.background = "linear-gradient(160deg,#0f2439,#091521)";
    rewardBox.style.fontSize = "20px";

    const big = document.getElementById("big").innerText;
    const small = document.getElementById("small").innerText;

    rewardBox.innerHTML = `
        <div style="font-size:20px; margin-bottom:20px; text-align:center; font-weight:bold;">
            🏆 รางวัลคงเหลือ
        </div>

        <div>
            <b>💰 รางวัลใหญ่</b><br>
            ${big.replaceAll("\n", "<br>")}
        </div>

        <br>

        <div>
            <b>🎁 รางวัลทั่วไป</b><br>
            ${small.replaceAll("\n", "<br>")}
        </div>
    `;

    wrapper.appendChild(rewardBox);

    document.body.appendChild(wrapper);

    // =========================
    // 🔥 SCALE อัตโนมัติให้ตารางไม่ทับกรอบรางวัล
    // =========================
    const TARGET_W = 1600;
    const TARGET_H = 1000;

    const REWARD_W = 280;
    const GAP = 40;

    const availableW = TARGET_W - REWARD_W - GAP;
    const availableH = TARGET_H;

    const scaleX = availableW / BASE_W;
    const scaleY = availableH / BASE_H;

    const scale = Math.min(scaleX, scaleY);

    boardClone.style.transform = `scale(${scale})`;
    boardClone.style.transformOrigin = "top left";

    // =========================
    // แคปเป็นภาพ
    // =========================
    html2canvas(wrapper, {
        backgroundColor: "#0b1a2a",
        scale: 3,
        useCORS: true
    }).then(canvas => {

        canvas.toBlob(async (blob) => {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ "image/png": blob })
                ]);
                alert("📋 คัดลอกภาพสำเร็จ (ฟอนต์ใหญ่ขึ้น)");
            } catch {
                const a = document.createElement("a");
                a.href = canvas.toDataURL("image/png");
                a.download = "board.png";
                a.click();
            }

            wrapper.remove();
        });
    });
}
