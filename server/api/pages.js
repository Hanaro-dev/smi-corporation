import { defineEventHandler } from "h3";
import DOMPurify from "dompurify";
import { validatePageInput } from "../utils/validators";
import auth from "../middleware/auth.js";

let pages = [
  { id: 1, title: "Accueil", content: "Bienvenue sur la page d'accueil." },
  { id: 2, title: "Contact", content: "Contactez-nous via ce formulaire." },
];

export default defineEventHandler(async (event) => {
  await auth(event);

  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Non autorisé." });
  }

  const method = event.node.req.method;
  const url = event.node.req.url;

  // GET /api/pages
  if (method === "GET" && url === "/api/pages") {
    const { page = 1, limit = 10 } = getQuery(event);
    const offset = (page - 1) * limit;
    const paginatedPages = pages.slice(offset, offset + limit);
    return { pages: paginatedPages, total: pages.length };
  }

  // POST /api/pages
  if (method === "POST" && url === "/api/pages") {
    const body = await readBody(event);
    const errors = validatePageInput(body);
    if (Object.keys(errors).length > 0) {
      throw createError({ statusCode: 400, message: errors });
    }
    const sanitizedContent = DOMPurify.sanitize(body.content);
    const newPage = {
      id: Date.now(),
      title: body.title,
      content: sanitizedContent || "",
    };
    pages.push(newPage);
    return newPage;
  }

  // PUT /api/pages/:id
  if (method === "PUT" && url.startsWith("/api/pages/")) {
    const id = parseInt(url.split("/").pop());
    const body = await readBody(event);
    const errors = validatePageInput(body);
    if (Object.keys(errors).length > 0) {
      throw createError({ statusCode: 400, message: errors });
    }
    const sanitizedContent = DOMPurify.sanitize(body.content);
    const page = pages.find((p) => p.id === id);
    if (page) {
      page.title = body.title;
      page.content = sanitizedContent || "";
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
