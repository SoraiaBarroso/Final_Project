// server/api/user/role.ts
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);

  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const email = user.email;
  if (!email) {
    throw createError({ statusCode: 400, message: "User email not found" });
  }

  // Check if the user is in the 'admin' table
  const { data: adminData, error: adminError } = await client
    .from("admin")
    .select("email")
    .eq("email", email)
    .single();

  if (adminError && adminError.code !== "PGRST116") {
    // Ignore 'PGRST116' (row not found)
    console.error("Error fetching admin role:", adminError);
    throw createError({ statusCode: 500, message: "Internal Server Error" });
  }

  if (adminData) {
    return { role: "admin" };
  } else {
    // If not an admin, assume student. You can add more complex logic here if needed.
    return { role: "student" };
  }
});
