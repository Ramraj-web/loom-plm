// Integration test for storage persistence and order/resource lifecycle
const API = "http://localhost:5000/api";

async function runTests() {
  console.log("=== STARTING STORAGE & PERSISTENCE VERIFICATION ===");
  let failed = 0;

  function assert(condition, message) {
    if (!condition) {
      console.error("❌ FAILED:", message);
      failed++;
    } else {
      console.log("✅ PASSED:", message);
    }
  }

  try {
    // 1. Health check
    const health = await fetch(`${API}/health`).then(r => r.json());
    assert(health.ok === true, "Backend health endpoint returns ok: true");

    // 2. Querying uninitialized storage keys MUST return 200 OK with value: null (NO 404s!)
    const keysToCheck = [
      "docs:TR-8899",
      "highlights:TR-8899",
      "chat:TR-8899",
      "customTypes:TR-8899"
    ];

    for (const key of keysToCheck) {
      const encoded = encodeURIComponent(key);
      const res = await fetch(`${API}/storage/${encoded}?shared=true`);
      assert(res.status === 200, `GET /api/storage/${encoded} returns HTTP 200 (not 404)`);
      const body = await res.json();
      assert(body.key === key, `Response key matches requested key (${body.key})`);
    }

    // 3. Test Order update and persistence (Steps B, C, D, E, F, G)
    console.log("\n--- Testing Order Modification & Persistence ---");
    const orderBefore = await fetch(`${API}/resources/orders/TR-8899`).then(r => r.json());
    assert(orderBefore.id === "TR-8899", "Loaded existing order TR-8899");

    const updatedOrder = {
      ...orderBefore,
      status: "At Risk",
      shippedQty: 3200,
      plannedCost: 18000,
      actualCost: 19500,
      stages: [
        { name: "Order Confirmation & Enquiry", day: "Day 1", dept: "Merchandising", status: "done" },
        { name: "Tech Pack Received", day: "Day 1", dept: "Merchandising", status: "done" },
        { name: "Fabric Booking", day: "Day 1-3", dept: "Purchase – Fabric", status: "in_progress", reason: "Fabric delay" }
      ]
    };

    const putRes = await fetch(`${API}/resources/orders/TR-8899`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedOrder)
    });
    assert(putRes.ok, "PUT /api/resources/orders/TR-8899 returns 200 OK");
    const putData = await putRes.json();
    assert(putData.status === "At Risk" && putData.shippedQty === 3200, "Order update response has modified values");

    // Simulate page refresh by fetching fresh from backend
    const orderAfter = await fetch(`${API}/resources/orders/TR-8899`).then(r => r.json());
    assert(orderAfter.status === "At Risk" && orderAfter.shippedQty === 3200, "After refresh: order modification persisted in database");
    assert(orderAfter.stages[2].reason === "Fabric delay", "After refresh: stage delay reason persisted");

    // 4. Test Chat message persistence (Steps H, I, J)
    console.log("\n--- Testing Chat Message Persistence ---");
    const chatMsg = [{
      id: 1787999000000,
      author: "Merchandiser",
      text: "Testing buyer approval delay on stage 3",
      ts: "29/08/2026, 15:10:00",
      stage: "Sampling"
    }];
    const postChat = await fetch(`${API}/storage/${encodeURIComponent("chat:TR-8899")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(chatMsg), shared: true })
    });
    assert(postChat.ok, "POST /api/storage/chat:TR-8899 returns 200 OK");

    // Refresh simulation
    const getChat = await fetch(`${API}/storage/${encodeURIComponent("chat:TR-8899")}?shared=true`).then(r => r.json());
    const parsedChat = JSON.parse(getChat.value);
    assert(Array.isArray(parsedChat) && parsedChat[0].text === "Testing buyer approval delay on stage 3", "After refresh: chat message persisted and verified");

    // 5. Test Highlights persistence (Steps K, L, M)
    console.log("\n--- Testing Highlights Persistence ---");
    const highlightsData = [{
      id: 1787999111111,
      text: "Buyer confirmed: use recycled polyester zip tags",
      dept: "Purchase – Trims",
      by: "Merchandiser (auto-extracted)",
      ts: "29/08/2026, 15:12:00",
      resolved: false,
      source: "manual"
    }];
    const postHl = await fetch(`${API}/storage/${encodeURIComponent("highlights:TR-8899")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(highlightsData), shared: true })
    });
    assert(postHl.ok, "POST /api/storage/highlights:TR-8899 returns 200 OK");

    // Refresh simulation
    const getHl = await fetch(`${API}/storage/${encodeURIComponent("highlights:TR-8899")}?shared=true`).then(r => r.json());
    const parsedHl = JSON.parse(getHl.value);
    assert(Array.isArray(parsedHl) && parsedHl[0].text === "Buyer confirmed: use recycled polyester zip tags", "After refresh: highlights persisted and verified");

    // 6. Test Documents & Custom Types persistence (Steps N, O, P)
    console.log("\n--- Testing Documents & Custom Types Persistence ---");
    const docsData = {
      "Techpacks": { name: "TR-8899-rev2.pdf", uploadedAt: "29/08/2026, 15:15:00", by: "Merchandiser" },
      "Order Sheet": { name: "TR-8899-PO-final.xlsx", uploadedAt: "29/08/2026, 15:15:30", by: "Merchandiser" }
    };
    const postDocs = await fetch(`${API}/storage/${encodeURIComponent("docs:TR-8899")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(docsData), shared: true })
    });
    assert(postDocs.ok, "POST /api/storage/docs:TR-8899 returns 200 OK");

    const customTypesData = {
      "Files": ["Special Dyeing Spec Sheet"]
    };
    const postCustom = await fetch(`${API}/storage/${encodeURIComponent("customTypes:TR-8899")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(customTypesData), shared: true })
    });
    assert(postCustom.ok, "POST /api/storage/customTypes:TR-8899 returns 200 OK");

    // Refresh simulation
    const getDocs = await fetch(`${API}/storage/${encodeURIComponent("docs:TR-8899")}?shared=true`).then(r => r.json());
    const parsedDocs = JSON.parse(getDocs.value);
    assert(parsedDocs["Techpacks"].name === "TR-8899-rev2.pdf", "After refresh: uploaded document persisted and verified");

    const getCustom = await fetch(`${API}/storage/${encodeURIComponent("customTypes:TR-8899")}?shared=true`).then(r => r.json());
    const parsedCustom = JSON.parse(getCustom.value);
    assert(parsedCustom["Files"][0] === "Special Dyeing Spec Sheet", "After refresh: custom document type persisted and verified");

    // 7. Attendance & Role persistence test
    console.log("\n--- Testing System-Wide Storage (Attendance & Role) ---");
    const attData = { "Merchandiser (John)": "present", "Cutting Master (Ramesh)": "absent" };
    await fetch(`${API}/storage/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(attData), shared: true })
    });
    const getAtt = await fetch(`${API}/storage/attendance?shared=true`).then(r => r.json());
    assert(JSON.parse(getAtt.value)["Cutting Master (Ramesh)"] === "absent", "Attendance status persisted");

    console.log("\n==========================================");
    if (failed === 0) {
      console.log("🎉 ALL PERSISTENCE TESTS PASSED! ZERO FAILURES!");
    } else {
      console.error(`💥 ${failed} TEST(S) FAILED`);
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
}

runTests();
