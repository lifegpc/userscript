self.addEventListener("fetch", async (e) => {
    const r = e.request;
    const u = new URL(r.url);
    if (u.hostname == "e-hentai.org" || u.hostname == 'exhentai.org') return;
    const cache = await caches.open("eh_tag_img");
    const response = await cache.match(r);
    if (response) {
        return response;
    }
    const res = await fetch(r);
    if (res.ok) {
        await cache.put(r, res.clone());
    }
    return res;
})
