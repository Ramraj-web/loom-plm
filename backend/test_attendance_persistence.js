const API = "http://localhost:5000/api";

async function testAttendancePersistence() {
  console.log("=== STARTING ATTENDANCE & LEAVE PERSISTENCE VERIFICATION ===");
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
    // 1. Check current roster
    const resRosterBefore = await fetch(`${API}/storage/staff_roster?shared=true`).then(r => r.json());
    let roster = (resRosterBefore && resRosterBefore.value) ? JSON.parse(resRosterBefore.value) : [];
    console.log(`Current persisted roster count: ${roster.length}`);

    // 2. Add Joiner: Karthik Raja
    console.log("\n--- Step 1: Adding a new Joiner ---");
    const newPerson = { name: "Karthik Raja", title: "Cutting Senior", dept: "Cutting" };
    roster = [...roster.filter(p => p.name !== newPerson.name), newPerson];

    // Save roster to backend storage
    const postRoster = await fetch(`${API}/storage/staff_roster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(roster), shared: true })
    });
    assert(postRoster.ok, "POST /api/storage/staff_roster returns 200 OK");

    // Save attendance status
    const resAtt = await fetch(`${API}/storage/attendance?shared=true`).then(r => r.json());
    const attendance = (resAtt && resAtt.value) ? JSON.parse(resAtt.value) : {};
    attendance[newPerson.name] = "present";
    await fetch(`${API}/storage/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(attendance), shared: true })
    });

    // Also persist to resources/staff
    await fetch(`${API}/resources/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPerson)
    });

    // 3. Simulate Browser Refresh
    console.log("\n--- Step 2: Simulate Browser Refresh (Re-querying backend) ---");
    const refreshRoster = await fetch(`${API}/storage/staff_roster?shared=true`).then(r => r.json());
    assert(refreshRoster.status !== 404, "Storage endpoint returned status 200 OK");
    const parsedRoster = JSON.parse(refreshRoster.value);
    const foundPerson = parsedRoster.find(p => p.name === "Karthik Raja");
    assert(!!foundPerson, "Newly added person 'Karthik Raja' survived refresh");
    assert(foundPerson?.title === "Cutting Senior", "Title 'Cutting Senior' matches");
    assert(foundPerson?.dept === "Cutting", "Department 'Cutting' matches");

    const refreshAtt = await fetch(`${API}/storage/attendance?shared=true`).then(r => r.json());
    const parsedAtt = JSON.parse(refreshAtt.value);
    assert(parsedAtt["Karthik Raja"] === "present", "Attendance for 'Karthik Raja' is 'present'");

    // 4. Test Edit Person
    console.log("\n--- Step 3: Edit Person ---");
    const editedPerson = { name: "Karthik Raja S", title: "Cutting Master", dept: "Cutting" };
    const updatedRoster = parsedRoster.map(p => p.name === "Karthik Raja" ? editedPerson : p);
    await fetch(`${API}/storage/staff_roster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(updatedRoster), shared: true })
    });

    // Refresh simulation after edit
    const refreshAfterEdit = await fetch(`${API}/storage/staff_roster?shared=true`).then(r => r.json());
    const rosterAfterEdit = JSON.parse(refreshAfterEdit.value);
    const foundEdited = rosterAfterEdit.find(p => p.name === "Karthik Raja S");
    assert(!!foundEdited && foundEdited.title === "Cutting Master", "Edited person 'Karthik Raja S' (Cutting Master) survived refresh");
    assert(!rosterAfterEdit.some(p => p.name === "Karthik Raja"), "Old name 'Karthik Raja' was properly updated");

    // 5. Test Leave Request for the new person
    console.log("\n--- Step 4: Leave Request for new person ---");
    const leaveReq = {
      id: "leave-test-1",
      name: "Karthik Raja S",
      dept: "Cutting",
      from: "5 Jun",
      to: "6 Jun",
      reason: "Medical leave",
      status: "approved"
    };
    const resLeaves = await fetch(`${API}/storage/leaveRequests?shared=true`).then(r => r.json());
    const leaves = (resLeaves && resLeaves.value) ? JSON.parse(resLeaves.value) : [];
    leaves.push(leaveReq);
    await fetch(`${API}/storage/leaveRequests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(leaves), shared: true })
    });

    // Refresh simulation for leave
    const refreshLeaves = await fetch(`${API}/storage/leaveRequests?shared=true`).then(r => r.json());
    const parsedLeaves = JSON.parse(refreshLeaves.value);
    const foundLeave = parsedLeaves.find(l => l.name === "Karthik Raja S");
    assert(!!foundLeave && foundLeave.status === "approved", "Leave request for 'Karthik Raja S' survived refresh with status 'approved'");

    // 6. Test Delete / Remove Person
    console.log("\n--- Step 5: Remove Person ---");
    const rosterAfterDelete = rosterAfterEdit.filter(p => p.name !== "Karthik Raja S");
    await fetch(`${API}/storage/staff_roster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(rosterAfterDelete), shared: true })
    });

    const refreshAfterDelete = await fetch(`${API}/storage/staff_roster?shared=true`).then(r => r.json());
    const finalRoster = JSON.parse(refreshAfterDelete.value);
    assert(!finalRoster.some(p => p.name === "Karthik Raja S"), "Person deletion persisted across refresh");

    console.log("\n=======================================================");
    if (failed === 0) {
      console.log("🎉 ALL ATTENDANCE & LEAVE PERSISTENCE CHECKS PASSED!");
    } else {
      console.error(`💥 ${failed} TEST(S) FAILED`);
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
}

testAttendancePersistence();
