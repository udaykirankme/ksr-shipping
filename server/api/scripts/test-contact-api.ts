
async function run() {
    try {
        const formData = {
            name: "Test",
            phone: "",
            email: "",
            message: "Test message"
        };
        const res = await fetch("http://localhost:5000/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });
        const json = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", json);
    } catch (e) {
        console.error(e);
    }
}
run();
