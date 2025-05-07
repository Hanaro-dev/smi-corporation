import { defineEventHandler, useRuntimeConfig } from "h3";

let pages = [
  { id: 1, title: "Accueil", content: "Bienvenue sur la page d'accueil." },
  { id: 2, title: "Contact", content: "Contactez-nous via ce formulaire." },
];

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Non autorisé." });
  }

  const method = event.node.req.method;
  const url = event.node.req.url;

  // GET /api/pages
  if (method === "GET" && url === "/api/pages") {
    return pages;
  }

  // POST /api/pages
  if (method === "POST" && url === "/api/pages") {
    const body = await readBody(event);
    const newPage = {
      id: Date.now(),
      title: body.title,
      content: body.content || "",
    };
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
      page.content = body.content || "";
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
