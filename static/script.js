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
    html2canvas(board, {
        backgroundColor: "#0b1a2a",
        scale: 3,
        useCORS: true
    }).then(canvas => {

        canvas.toBlob(async (blob) => {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ "image/png": blob })
                ]);
                alert("📋 คัดลอกรูปแล้ว");
            } catch {
                const a = document.createElement("a");
                a.href = canvas.toDataURL("image/png");
                a.download = "table.png";
                a.click();
            }
        });
    });
}
