// frontend/src/api/client.js

async function parseMaybeJson(res) {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return await res.json();
    return await res.text();
  }
  
  function errorMessage(payload) {
    if (typeof payload === "string") return payload;
    return payload?.error || payload?.details || payload?.message || "Request failed";
  }
  
  // ✅ For multipart/form-data requests returning JSON
  export async function apiForm(path, formData) {
    const res = await fetch(path, {
      method: "POST",
      body: formData,
    });
  
    const payload = await parseMaybeJson(res);
  
    if (!res.ok) {
      throw new Error(errorMessage(payload));
    }
    return payload;
  }
  
  // ✅ For multipart/form-data requests returning a Blob (pdf/image/zip)
  export async function apiDownloadBlob(path, formData) {
    const res = await fetch(path, {
      method: "POST",
      body: formData,
    });
  
    if (!res.ok) {
      const payload = await parseMaybeJson(res);
      throw new Error(errorMessage(payload));
    }
  
    return await res.blob();
  }
  
  // ✅ For JSON POST requests returning JSON
  export async function apiJson(path, bodyObj) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyObj ?? {}),
    });
  
    const payload = await parseMaybeJson(res);
  
    if (!res.ok) {
      throw new Error(errorMessage(payload));
    }
    return payload;
  }
  
  // ✅ For GET requests returning JSON
  export async function apiGet(path) {
    const res = await fetch(path, { method: "GET" });
  
    const payload = await parseMaybeJson(res);
  
    if (!res.ok) {
      throw new Error(errorMessage(payload));
    }
    return payload;
  }
  