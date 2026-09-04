import { supabase } from "./supabase";

export async function getOrCreateConversation(post, userId) {
    if (!post || !userId) return null;

    if (post.owner_id === userId) {
        console.log("não pode criar chat consigo mesmo");
        return null;
    }

    const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .or(
            `and(user1_id.eq.${userId},user2_id.eq.${post.owner_id}),and(user1_id.eq.${post.owner_id},user2_id.eq.${userId})`,
        )
        .maybeSingle();

    if (existing) return existing.id;

    const { data, error } = await supabase
        .from("conversations")
        .insert({
            post_id: post.id,
            user1_id: userId,
            user2_id: post.owner_id,
        })
        .select()
        .single();

    if (error) {
        console.error(error);
        return null;
    }

    return data.id;
}
