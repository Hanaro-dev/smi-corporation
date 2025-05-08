import { User } from "../../models";
import { validateUser } from "../../utils/validators";

export default defineEventHandler(async (event) => {
  const id = event.context.params.id;
  const body = await readBody(event);

  const errors = validateUser(body);
  if (Object.keys(errors).length > 0) {
    throw createError({ statusCode: 400, message: errors });
  }

  const user = await User.findByPk(id);
  if (!user) {
    throw createError({ statusCode: 404, message: "Utilisateur non trouvé." });
  }

  Object.assign(user, body);
  await user.save();
  return user;
});
