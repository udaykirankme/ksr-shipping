
async function run() {
    try {
        console.log("Testing invalid UUID...");
        const res = await fetch("http://localhost:5000/api/admin/quotations/undefined", {
            method: "GET"
        });
        const json = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", json);
        if (res.status === 400) {
            console.log("✅ Successfully returned 400 Bad Request instead of 500 Internal Server Error");
        } else {
            console.log("❌ Failed! Returned", res.status);
        }
    } catch (e) {
        console.error(e);
    }
}
run();
