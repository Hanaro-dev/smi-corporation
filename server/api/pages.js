let pages = [
  { id: 1, title: "Accueil" },
  { id: 2, title: "Contact" },
];

export default defineEventHandler(async (event) => {
  const method = event.node.req.method;
  const url = event.node.req.url;

  // GET /api/pages
  if (method === "GET" && url === "/api/pages") {
    return pages;
  }

  // POST /api/pages
  if (method === "POST" && url === "/api/pages") {
    const body = await readBody(event);
    const newPage = { id: Date.now(), title: body.title };
    pages.push(newPage);
    return newPage;
  }

  // PUT /api/pages/:id
  if (method === "PUT" && url.startsWith("/api/pages/")) {
    const id = parseInt(url.split("/").pop());
    const body = await readBody(event);
    const page = pages.find((p) => p.id === id);
    if (page) {
      page.title = body.title;
      return page;
    }
    event.node.res.statusCode = 404;
    return { error: "Page non trouvée" };
  }

  // DELETE /api/pages/:id
  if (method === "DELETE" && url.startsWith("/api/pages/")) {
    const id = parseInt(url.split("/").pop());
    pages = pages.filter((p) => p.id !== id);
    return { success: true };
  }

  event.node.res.statusCode = 404;
  return { error: "Route non trouvée" };
});
