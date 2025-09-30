// server/api/user/role.ts
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);
    
    if (!user) {
      throw createError({ statusCode: 401, message: "Unauthorized - No user session found" });
    }

    const client = await serverSupabaseClient(event);
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
      throw createError({ statusCode: 500, message: "Database error while checking admin role" });
    }

    if (adminData) {
      return { role: "admin" };
    } else {
      // If not an admin, assume student. You can add more complex logic here if needed.
      return { role: "student" };
    }
  } catch (error: any) {
    console.error("Role API error:", error);
    
    // If it's already a createError, re-throw it
    if (error?.statusCode) {
      throw error;
    }
    
    // For any other error, return a generic server error
    throw createError({ 
      statusCode: 500, 
      message: "Auth session missing or invalid" 
    });
  }
});
