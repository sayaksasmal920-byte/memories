async function test() {
  const url = "https://memoryvault-media-sayak.s3.us-east-005.backblazeb2.com/photo/946f9f8d-9e18-4946-b4b1-de91fa5e432a.jpg";
  try {
    console.log("Fetching url...");
    const res = await fetch(url);
    console.log("Status:", res.status);
    console.log("OK:", res.ok);
    const buf = await res.arrayBuffer();
    console.log("Buffer length:", buf.byteLength);
  } catch (err) {
    console.error("Fetch failed with error:", err);
  }
}
test();
