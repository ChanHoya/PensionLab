async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/news");
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response text snippet:", text.substring(0, 500));
    const data = JSON.parse(text);
    console.log("Parsed successfully! Length:", data.length);
    if (data.length > 0) {
      console.log("First item:", JSON.stringify(data[0], null, 2));
    }
  } catch (err) {
    console.error("JSON Parse Error:", err);
  }
}

test();
