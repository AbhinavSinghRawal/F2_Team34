const dnsCache = {};

let timerInterval;
let startTime;

let totalQueries = 0;
let cacheHits = 0;
let cacheMisses = 0;
let totalLookupTime = 0;

const resolveBtn = document.getElementById("resolveBtn");

const nodes = [
    document.getElementById("user"),
    document.getElementById("local"),
    document.getElementById("root"),
    document.getElementById("tld"),
    document.getElementById("auth")
];

const packet = document.getElementById("packet");

// -------------------- Packet Movement --------------------

function movePacketTo(node) {
    const network = document.querySelector(".network-area");
    const netRect = network.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();

    packet.style.left = (nodeRect.left - netRect.left + nodeRect.width / 2 - 8) + "px";
    packet.style.top = (nodeRect.top - netRect.top + nodeRect.height / 2 - 8) + "px";
}

// -------------------- Real DNS Lookup --------------------

async function getRealDNS(domain) {
    const response = await fetch("/resolve", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ domain })
    });

    return await response.json();
}

// -------------------- Timer --------------------

function startTimer() {
    totalQueries++;
    startTime = Date.now();

    timerInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        document.getElementById("timer").textContent = elapsed.toFixed(2) + " s";
    }, 100);
}

function stopTimer() {
    clearInterval(timerInterval);

    const elapsed = (Date.now() - startTime) / 1000;
    document.getElementById("timer").textContent = elapsed.toFixed(2) + " s";

    return elapsed;
}

// -------------------- Dashboard --------------------

function updateDashboard() {
    document.getElementById("totalQueries").textContent = totalQueries;
    document.getElementById("cacheHits").textContent = cacheHits;
    document.getElementById("cacheMisses").textContent = cacheMisses;

    const avg = totalQueries === 0 ? 0 : totalLookupTime / totalQueries;

    document.getElementById("avgLookup").textContent = avg.toFixed(2) + " s";
}

// -------------------- Live Log --------------------

function addLog(message) {
    const container = document.getElementById("logContainer");

    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.textContent = "• " + message;

    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
}

function clearLog() {
    document.getElementById("logContainer").innerHTML = "";
}

// -------------------- Resolve Button --------------------

resolveBtn.addEventListener("click", async () => {

    const domain = document.getElementById("domainInput").value.trim().toLowerCase();

    if (domain === "") {
        alert("Enter a domain.");
        return;
    }

    document.getElementById("domainResult").textContent = domain;
    document.getElementById("ipResult").textContent = "-";
    document.getElementById("statusResult").textContent = "Resolving...";
    document.getElementById("timer").textContent = "0.00 s";

    clearLog();
    startTimer();

    addLog(`User requested "${domain}"`);

    nodes.forEach(n => n.classList.remove("active"));
    packet.style.display = "block";

    // ==================== CACHE HIT ====================

    if (dnsCache[domain]) {

        addLog("Checking Local DNS Cache...");
        addLog("Cache Hit - Returning cached IP.");

        document.getElementById("statusResult").textContent = "Cache Hit";

        for (let i = 0; i < 2; i++) {
            movePacketTo(nodes[i]);
            nodes[i].classList.add("active");

            await new Promise(r => setTimeout(r, 500));

            nodes[i].classList.remove("active");
        }

        packet.style.display = "none";
        document.getElementById("ipResult").textContent = dnsCache[domain];

        const elapsed = stopTimer();

        cacheHits++;
        totalLookupTime += elapsed;
        updateDashboard();

        addLog("Lookup completed successfully.");

        return;
    }

    // ==================== CACHE MISS ====================

    document.getElementById("statusResult").textContent = "Cache Miss";

    const messages = [
        "Checking Local DNS Cache...",
        "Local DNS forwarded the query to Root DNS.",
        "Root redirected to .com TLD Server.",
        "Querying Authoritative DNS Server...",
        "Receiving DNS response..."
    ];

    for (let i = 0; i < nodes.length; i++) {

        addLog(messages[i]);

        movePacketTo(nodes[i]);

        nodes[i].classList.add("active");

        await new Promise(r => setTimeout(r, 700));

        nodes[i].classList.remove("active");
    }

    packet.style.display = "none";

    const result = await getRealDNS(domain);

    if (result.success) {

        dnsCache[domain] = result.ip;

        document.getElementById("ipResult").textContent = result.ip;
        document.getElementById("statusResult").textContent = "Resolved";

        addLog(`Authoritative Server returned ${result.ip}`);
        addLog("DNS Resolution Complete.");

    } else {

        document.getElementById("statusResult").textContent = "Domain Not Found";
        document.getElementById("ipResult").textContent = "-";

        addLog("Authoritative Server returned NXDOMAIN.");
        addLog("Domain does not exist.");
    }

    const elapsed = stopTimer();

    cacheMisses++;
    totalLookupTime += elapsed;
    updateDashboard();

});