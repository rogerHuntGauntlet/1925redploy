import { createClient } from '@supabase/supabase-js'
import type { MessageType, FileAttachment } from '../types/database'
import type { RealtimePostgresChangesPayload } from '@supabase/realtime-js'
import logger from '@/lib/logger'
import { createHash } from 'crypto'
import { MessageEncryption } from '@/lib/encryption'

interface MessagePayload {
  id: string;
  content: string;
  created_at: string;
  channel: string;
  user_id: string;
  parent_id: string | null;
  is_direct_message: boolean;
  file_attachments: FileAttachment[];
  reactions: { [key: string]: string[] };
  thread_ts: string | null;
  reply_count: number;
  last_reply_at: string | null;
  is_inline_thread: boolean;
}

type RealtimeMessagePayload = RealtimePostgresChangesPayload<MessagePayload> & {
  new: MessagePayload;
}

interface MessageInsertPayload {
  new: {
    id: string;
  };
  old: null;
  eventType: 'INSERT';
}

interface MessageReactionPayload {
  new: {
    id: string;
    reactions: { [key: string]: string[] };
  };
  old: {
    id: string;
    reactions: { [key: string]: string[] };
  } | null;
  eventType: 'UPDATE';
}

console.log('🔧 [Supabase] Starting Supabase initialization...');

// Create a singleton instance
let supabaseInstance: any = null;

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ [Supabase] Missing required environment variables!');
      throw new Error('Missing required environment variables for Supabase configuration');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();

export const testSupabaseConnection = async () => {
  try {
    console.log('🔄 [Supabase] Testing connection...');
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ [Supabase] Connection test error:', error);
      throw error;
    }
    console.log('✅ [Supabase] Connection test successful');
    return true;
  } catch (error) {
    console.error('❌ [Supabase] Connection test failed:', error);
    return false;
  }
};

// Test the connection immediately
testSupabaseConnection();

// Add a helper function to check auth status
const checkAuth = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Auth check error:', error)
    return false
  }
  if (!session) {
    console.error('No active session')
    return false
  }
  console.log('Authenticated as:', session.user.id)
  return true
}

export const fetchMessages = async (channelId: string) => {
  console.log('lib/supabase: Fetching messages for channel:', channelId)
  try {
    const isAuthed = await checkAuth()
    if (!isAuthed) {
      throw new Error('Not authenticated')
    }

    // Direct query to messages with user join
    const query = supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        channel_id,
        user_id,
        parent_id,
        file_attachments,
        user:user_profiles (
          id,
          username,
          avatar_url
        )
      `)
      .eq('channel_id', channelId)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    console.log('lib/supabase: Generated SQL:', query.toSQL());

    const { data: messages, error } = await query;

    if (error) {
      console.error('lib/supabase: Messages fetch error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    console.log('lib/supabase: Successfully fetched messages:', {
      count: messages?.length,
      firstMessage: messages?.[0],
      lastMessage: messages?.[messages?.length - 1]
    });
    return messages;
  } catch (error) {
    console.error('lib/supabase: Error fetching messages:', error);
    throw error;
  }
};

export const fetchChannelName = async (channelId: string) => {
  console.log('Fetching channel name for:', channelId)
  try {
    const isAuthed = await checkAuth()
    if (!isAuthed) {
      throw new Error('Not authenticated')
    }

    // Simple direct query to channels
    const { data: channelData, error } = await supabase
      .from('channels')
      .select('name')
      .eq('id', channelId)
      .single()

    if (error) {
      console.error('Channel fetch error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      throw error
    }

    console.log('Successfully fetched channel:', channelData?.name)
    return channelData?.name
  } catch (error) {
    console.error('Error in fetchChannelName:', error)
    throw error
  }
}

export const sendMessage = async (
  channelId: string,
  userId: string,
  content: string,
  fileAttachments: FileAttachment[] | null = null,
  parentId: string | null = null
) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        content,
        channel_id: channelId,
        user_id: userId,
        parent_id: parentId,
        file_attachments: fileAttachments
      })
      .select(`
        id,
        content,
        created_at,
        updated_at,
        channel_id,
        user_id,
        parent_id,
        file_attachments,
        user:user_profiles (
          id,
          username,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const sendReply = async (
  channelId: string,
  userId: string,
  parentId: string,
  content: string
) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        content,
        channel_id: channelId,
        user_id: userId,
        parent_id: parentId,
        file_attachments: null
      })
      .select(`
        id,
        content,
        created_at,
        updated_at,
        channel_id,
        user_id,
        parent_id,
        file_attachments,
        user:user_profiles (
          id,
          username,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending reply:', error);
    throw error;
  }
};

export const updateReaction = async (messageId: string, userId: string, emoji: string) => {
  try {
    // First get current reactions
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('reactions')
      .eq('id', messageId)
      .single();

    if (fetchError) throw fetchError;

    // Get current reactions or initialize empty object
    const currentReactions = message?.reactions || {};
    const userReactions = currentReactions[emoji] || [];
    const hasReacted = userReactions.includes(userId);

    // Update reactions
    let updatedReactions = { ...currentReactions };
    if (hasReacted) {
      // Remove reaction
      updatedReactions[emoji] = userReactions.filter((id: string) => id !== userId);
      if (updatedReactions[emoji].length === 0) {
        delete updatedReactions[emoji];
      }
    } else {
      // Add reaction
      updatedReactions[emoji] = [...userReactions, userId];
    }

    // Update the message
    const { data: updatedMessage, error: updateError } = await supabase
      .from('messages')
      .update({ reactions: updatedReactions })
      .eq('id', messageId)
      .select('reactions')
      .single();

    if (updateError) throw updateError;
    return updatedMessage.reactions;
  } catch (error) {
    console.error('Error updating reaction:', error);
    throw error;
  }
}

export const subscribeToChannel = (
  channelId: string,
  onMessage: (message: MessageType) => void,
  onReply: (reply: MessageType) => void,
  onReaction: (messageId: string, reactions: { [key: string]: string[] }) => void
) => {
  // Subscribe to new messages
  const messageChannel = supabase
    .channel(`messages:${channelId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId} and parent_id=is.null`
      },
      async (payload: RealtimeMessagePayload) => {
        console.log('New message received:', payload);
        
        try {
          const { data: newMessage, error } = await supabase
            .from('messages')
            .select(`
              *,
              user:user_profiles (
                id,
                username,
                avatar_url
              ),
              replies:messages!messages_parent_id_fkey (
                id,
                content,
                created_at,
                user_id,
                user:user_profiles (
                  id,
                  username,
                  avatar_url
                )
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) throw error;

          if (newMessage) {
            onMessage(newMessage);
          }
        } catch (error) {
          console.error('Error fetching new message details:', error);
        }
      }
    )
    .subscribe();

  // Subscribe to new replies
  const replyChannel = supabase
    .channel(`replies:${channelId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId} and parent_id=is.not.null`
      },
      async (payload: RealtimeMessagePayload) => {
        console.log('New reply received:', payload);
        
        try {
          const { data: newReply, error } = await supabase
            .from('messages')
            .select(`
              *,
              user:user_profiles (
                id,
                username,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) throw error;

          if (newReply) {
            onReply(newReply);
          }
        } catch (error) {
          console.error('Error fetching new reply details:', error);
        }
      }
    )
    .subscribe();

  // Subscribe to reaction changes
  const reactionChannel = supabase
    .channel(`reactions:${channelId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`
      },
      (payload: MessageReactionPayload) => {
        if (payload.new.reactions) {
          onReaction(payload.new.id, payload.new.reactions);
        }
      }
    )
    .subscribe();

  return () => {
    messageChannel.unsubscribe();
    replyChannel.unsubscribe();
    reactionChannel.unsubscribe();
  };
}

export const testDatabaseTables = async () => {
  try {
    // Test workspaces table
    await supabase.from('workspaces').select('*').limit(1)
    logger.log('Workspaces table exists')

    // Ensure universal workspace exists
    await ensureUniversalWorkspace()
    logger.log('Universal workspace verified')

    // Test channels table
    await supabase.from('channels').select('*').limit(1)
    logger.log('Channels table exists')

    // Test messages table
    await supabase.from('messages').select('*').limit(1)
    logger.log('Messages table exists')

    return true
  } catch (error) {
    logger.error('Error testing database tables:', error)
    throw error
  }
}

export const getWorkspaces = async (userId?: string) => {
  try {
    logger.log('🏢 [getWorkspaces] Starting to fetch workspaces...')
    
    // If userId is provided, get only their workspaces
    if (userId) {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          workspace_id,
          workspaces (
            id,
            name
          ),
          role
        `)
        .eq('user_id', userId)

      if (error) {
        logger.error('❌ [getWorkspaces] Database error:', error)
        throw error
      }

      const workspaces = data.map((item: any) => ({
        id: item.workspaces.id,
        name: item.workspaces.name,
        role: item.role,
      }))

      logger.log(`✅ [getWorkspaces] Fetched ${workspaces.length} workspaces for user`)
      return workspaces
    }
    
    // If no userId, return empty array
    return []
  } catch (error) {
    logger.error('❌ [getWorkspaces] Error:', error)
    return []
  }
}

const getAiUser = async () => {
  const { data: aiUser } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', 'ai.assistant@chatgenius.ai')
    .single();

  if (!aiUser) {
    console.error('AI user not found');
    throw new Error('AI user not found');
  }

  return aiUser;
};

const createWorkspaceChannel = async (name: 'general' | 'social' | 'work', workspaceId: string, creatorId: string, aiUserId: string) => {
  // Create channel
  const { data: channel } = await supabase
    .from('channels')
    .insert({
      name,
      workspace_id: workspaceId,
      created_by: creatorId
    })
    .select()
    .single();

  // Create intro message
  const introMessages = {
    'general': 'Welcome to the general channel! This is where we discuss everything about the workspace.',
    'social': 'This is our social space! Share fun stuff, memes, and get to know each other.',
    'work': 'Welcome to the work channel! This is where we focus on tasks and projects.'
  } as const;

  const { data: introMessage } = await supabase
    .from('messages')
    .insert({
      content: introMessages[name],
      channel: channel.id,
      user_id: creatorId,
      is_direct_message: false
    })
    .select()
    .single();

  // AI reply
  const { data: aiReply } = await supabase
    .from('messages')
    .insert({
      content: `Thanks for creating this channel! I'm the AI Assistant, and I'm here to help make this workspace more productive and fun! 🚀`,
      channel: channel.id,
      user_id: aiUserId,
      is_direct_message: false
    })
    .select()
    .single();

  // AI reactions
  const emojis = ['👍', '🎉', '🚀', '💡', '❤️'];
  for (const message of [introMessage, aiReply]) {
    for (const emoji of emojis) {
      await supabase.rpc('handle_reaction', {
        message_id: message.id,
        user_id: aiUserId,
        emoji: emoji
      });
    }
  }

  return channel;
};

const createAiWelcomeDm = async (workspaceName: string, creatorId: string, aiUserId: string) => {
  // Initial welcome message
  const { data: dmMessage } = await supabase
    .from('direct_messages')
    .insert({
      content: `Hi there! 👋 I'm your AI Assistant. I noticed you just created the "${workspaceName}" workspace. I'm here to help you make the most of it! Feel free to ask me any questions about setting up channels, inviting team members, or using any of our features. Good luck with your new workspace! 🚀`,
      sender_id: aiUserId,
      receiver_id: creatorId
    })
    .select()
    .single();

  // AI reactions to its own message
  for (const emoji of ['👋', '🎉', '🤖']) {
    await supabase.rpc('handle_reaction', {
      message_id: dmMessage.id,
      user_id: aiUserId,
      emoji: emoji
    });
  }

  // Follow-up message about channels
  await supabase
    .from('direct_messages')
    .insert({
      content: `By the way, I've already set up three channels for you: #general for team-wide announcements, #social for casual conversations, and #work for project discussions. Each channel has some starter messages to help get things going! 📚`,
      sender_id: aiUserId,
      receiver_id: creatorId
    });
};

export const createWorkspace = async (name: string, userId?: string) => {
  try {
    logger.log('🏗️ [createWorkspace] Starting workspace creation:', { name })

    if (!userId) {
      throw new Error('User ID is required to create a workspace')
    }

    // Create the workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        name
      })
      .select()
      .single()

    if (workspaceError) {
      logger.error('❌ [createWorkspace] Error creating workspace:', workspaceError)
      throw workspaceError
    }
    logger.log('✅ [createWorkspace] Workspace created:', workspace)

    // Add user as admin
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: 'admin'
      })

    if (memberError) {
      logger.error('Failed to add user as admin:', memberError)
      throw memberError
    }

    // Create default channels with created_by
    const channels = []
    
    // Create general channel
    const { data: generalChannel, error: generalError } = await supabase
      .from('channels')
      .insert({
        name: 'general',
        workspace_id: workspace.id,
        created_by: userId
      })
      .select()
      .single()

    if (generalError) {
      logger.error('Failed to create general channel:', generalError)
      throw generalError
    }
    channels.push(generalChannel)

    // Create social channel
    const { data: socialChannel, error: socialError } = await supabase
      .from('channels')
      .insert({
        name: 'social',
        workspace_id: workspace.id,
        created_by: userId
      })
      .select()
      .single()

    if (socialError) {
      logger.error('Failed to create social channel:', socialError)
      throw socialError
    }
    channels.push(socialChannel)

    // Create work channel
    const { data: workChannel, error: workError } = await supabase
      .from('channels')
      .insert({
        name: 'work',
        workspace_id: workspace.id,
        created_by: userId
      })
      .select()
      .single()

    if (workError) {
      logger.error('Failed to create work channel:', workError)
      throw workError
    }
    channels.push(workChannel)

    logger.log('✅ [createWorkspace] Workspace setup completed successfully')
    return {
      workspace,
      channels
    }

  } catch (error) {
    logger.error('❌ [createWorkspace] Error:', error)
    throw error
  }
}

export const joinWorkspace = async (workspaceId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        role: 'member'
      })

    if (error) throw error
  } catch (error) {
    logger.error('Error joining workspace:', error)
    throw error
  }
}

export const getUserByEmail = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    logger.error('Error fetching user:', error)
    return null
  }
}

export const updateUserProfileId = async (oldEmail: string, newId: string) => {
  try {
    // First, delete the old profile
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('email', oldEmail);

    if (deleteError) {
      console.error('Error deleting old profile:', deleteError);
      throw deleteError;
    }

    // Then create a new profile with the correct ID
    const username = oldEmail.split('@')[0];
    const { data: newProfile, error: insertError } = await supabase
      .from('user_profiles')
      .insert([{
        id: newId,
        email: oldEmail,
        username,
        status: 'online'
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating new profile:', insertError);
      throw insertError;
    }

    console.log('Updated user profile with correct ID:', newProfile);
    return newProfile;
  } catch (error) {
    console.error('Error in updateUserProfileId:', error);
    throw error;
  }
};

const md5 = (str: string) => createHash('md5').update(str).digest('hex');

export const createUserProfile = async (user: { id: string; email?: string }) => {
  try {
    if (!user.id) {
      throw new Error('User ID is required to create a profile');
    }

    // First check if profile exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      return existingProfile;
    }

    // Get user data from auth if email is not provided
    let email: string;
    if (!user.email) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) {
        throw new Error('Unable to get user email from auth');
      }
      email = authUser.email;
    } else {
      email = user.email;
    }

    // Extract username from email
    const username = email.split('@')[0];

    // Create new profile
    const { data: newProfile, error: insertError } = await supabase
      .from('user_profiles')
      .insert([{
        id: user.id,
        email,
        username,
        status: 'online',
        avatar_url: `https://www.gravatar.com/avatar/${md5(email.toLowerCase())}?d=mp`
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating user profile:', insertError);
      throw insertError;
    }

    if (!newProfile) {
      throw new Error('Failed to create user profile');
    }

    console.log('Created new user profile:', newProfile);
    return newProfile;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    throw error;
  }
};

export const getChannels = async (workspaceId: string, userId: string) => {
  try {
    logger.log(`Getting channels for workspace ${workspaceId} and user ${userId}`)

    if (!workspaceId || !userId) {
      logger.error('Missing required parameters:', { workspaceId, userId })
      return [] // Return empty array instead of throwing
    }

    // First verify workspace access
    const { data: members, error: memberError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single()

    if (memberError) {
      if (memberError.code === 'PGRST116') { // No rows returned
        logger.log('User is not a member of this workspace:', { userId, workspaceId })
        return [] // Return empty array for non-members
      }
      logger.error('Error checking workspace membership:', memberError)
      throw memberError
    }

    // Then fetch channels
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select(`
        id,
        name,
        workspace_id,
        created_by,
        created_at
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })

    if (channelsError) {
      logger.error('Error fetching channels:', channelsError)
      throw channelsError
    }

    logger.log(`Successfully fetched ${channels?.length || 0} channels`)
    return channels || []
  } catch (error) {
    logger.error('Error in getChannels:', error)
    return [] // Return empty array on error
  }
}

export const getUserCount = async () => {
  try {
    const { count, error } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching user count:', error);
    return 0;
  }
};

export const createChannel = async (name: string, workspaceId: string) => {
  try {
    console.log('Starting channel creation:', { name, workspaceId })
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
    console.log('User authenticated:', session.user.id)

    // Get AI user
    const { data: aiUser } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'ai.assistant@chatgenius.ai')
      .single();

    if (!aiUser) {
      console.error('AI user not found')
      throw new Error('AI user not found');
    }
    console.log('Found AI user:', aiUser.id)

    // Create the channel
    console.log('Creating channel in database...')
    const { data: channel, error } = await supabase
      .from('channels')
      .insert({
        name,
        workspace_id: workspaceId,
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating channel in database:', error)
      throw error;
    }
    console.log('Channel created:', channel)

    // Add creator to channel members
    console.log('Adding creator to channel members...')
    const { error: memberError } = await supabase
      .from('channel_members')
      .insert({
        channel_id: channel.id,
        user_id: session.user.id,
        role: 'admin'
      });

    if (memberError) {
      console.error('Error adding creator to channel:', memberError)
      throw memberError;
    }

    // Add AI user to channel members
    console.log('Adding AI user to channel members...')
    const { error: aiMemberError } = await supabase
      .from('channel_members')
      .insert({
        channel_id: channel.id,
        user_id: aiUser.id,
        role: 'member'
      });

    if (aiMemberError) {
      console.error('Error adding AI to channel:', aiMemberError)
      throw aiMemberError;
    }

    // Create welcome message
    console.log('Creating welcome message...')
    const { data: welcomeMessage, error: welcomeError } = await supabase
      .from('messages')
      .insert({
        content: `Welcome to #${name}! 🎉 This channel has been created as a dedicated space for your team to collaborate, share ideas, and communicate effectively. Here, you can discuss projects, share updates, ask questions, and keep everyone in the loop. Feel free to use threads for focused discussions, react with emojis to show engagement, and upload files when needed. Let's make this channel a vibrant hub of productivity and teamwork! Remember, clear communication is key to success. 🚀`,
        channel_id: channel.id,
        user_id: session.user.id,
        file_attachments: null,
        parent_id: null
      })
      .select()
      .single();

    if (welcomeError) {
      console.error('Error creating welcome message:', welcomeError)
      throw welcomeError;
    }
    console.log('Welcome message created:', welcomeMessage)

    // Create AI welcome reply
    console.log('Creating AI welcome reply...')
    const { data: aiReply, error: aiReplyError } = await supabase
      .from('messages')
      .insert({
        content: `Thanks for creating this channel! I'm the AI Assistant, and I'm here to help make this channel more productive and engaging! I can help with organizing discussions, providing insights, and making sure everyone stays connected. Don't hesitate to mention me if you need any assistance! 🤖✨`,
        channel_id: channel.id,
        user_id: aiUser.id,
        parent_id: welcomeMessage.id,
        file_attachments: null
      })
      .select()
      .single();

    if (aiReplyError) {
      console.error('Error creating AI reply:', aiReplyError)
      throw aiReplyError;
    }
    console.log('AI reply created:', aiReply)

    // Add reactions to both messages
    const emojis = ['👋', '🎉', '🚀', '💡', '❤️'];
    
    // Add reactions to welcome message
    for (const emoji of emojis) {
      await supabase.rpc('handle_reaction', {
        message_id: welcomeMessage.id,
        user_id: aiUser.id,
        emoji: emoji
      });
    }

    // Add reactions to AI reply
    for (const emoji of emojis) {
      await supabase.rpc('handle_reaction', {
        message_id: aiReply.id,
        user_id: aiUser.id,
        emoji: emoji
      });
    }

    return channel;
  } catch (error) {
    console.error('Error in createChannel:', error)
    throw error;
  }
};

export const getWorkspaceUsers = async (workspaceId: string) => {
  try {
    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        user_id,
        role,
        user_profiles:user_id (
          id,
          username,
          email,
          avatar_url,
          status
        )
      `)
      .eq('workspace_id', workspaceId);

    if (error) throw error;
    return data.map((item: any) => ({
      ...item.user_profiles,
      role: item.role
    }));
  } catch (error) {
    console.error('Error fetching workspace users:', error);
    return [];
  }
};

interface DirectMessage {
  id: string;
  content: string | null;
  encrypted_content?: {
    ciphertext: string;
    iv: string;
    salt: string;
  };
  is_encrypted: boolean;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  updated_at: string;
  parent_id: string | null;
  file_attachments: any[] | null;
  sender?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  receiver?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export const markMessageAsRead = async (messageId: string, userId: string) => {
  try {
    const { error } = await supabase.rpc('update_message_read_status', {
      _message_id: messageId,
      _user_id: userId
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

export async function getDirectMessages(
  userId: string,
  recipientId: string,
  beforeTimestamp?: string,
  limit: number = 20
): Promise<DirectMessage[]> {
  try {
    let query = supabase
      .from('direct_messages')
      .select(`
        *,
        sender:user_profiles!sender_id(*),
        receiver:user_profiles!receiver_id(*)
      `)
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: false })
      .limit(limit);

    // If we have a timestamp, load messages before that timestamp
    if (beforeTimestamp) {
      query = query.lt('created_at', beforeTimestamp);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    // Decrypt messages
    const sharedSecret = await MessageEncryption.generateSharedSecret(userId, recipientId);
    const decryptedMessages = await Promise.all(
      (messages || []).map(async (message: DirectMessage) => {
        if (!message.is_encrypted || !message.encrypted_content) {
          return message;
        }

        try {
          const decryptedContent = await MessageEncryption.decryptMessage(
            message.encrypted_content,
            sharedSecret
          );

          return {
            ...message,
            content: decryptedContent,
            encrypted_content: null // Remove encrypted content from client
          };
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          return {
            ...message,
            content: '[Encrypted Message - Unable to decrypt]',
            encrypted_content: null
          };
        }
      })
    );

    return decryptedMessages;
  } catch (error) {
    console.error('Error in getDirectMessages:', error);
    throw error;
  }
}

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const sendDirectMessage = async (
  senderId: string,
  receiverId: string,
  content: string,
  fileAttachments: FileAttachment[] | null = null,
  parentId: string | null = null
) => {
  try {
    // Generate shared secret for encryption
    const sharedSecret = await MessageEncryption.generateSharedSecret(senderId, receiverId);
    
    // Encrypt the message content
    const encryptedContent = await MessageEncryption.encryptMessage(content, sharedSecret);

    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        content: null, // Clear text content is not stored
        encrypted_content: encryptedContent,
        is_encrypted: true,
        sender_id: senderId,
        receiver_id: receiverId,
        parent_id: parentId,
        file_attachments: fileAttachments
      })
      .select(`
        id,
        encrypted_content,
        is_encrypted,
        created_at,
        updated_at,
        sender_id,
        receiver_id,
        parent_id,
        file_attachments,
        sender:user_profiles!sender_id (
          id,
          username,
          avatar_url
        ),
        receiver:user_profiles!receiver_id (
          id,
          username,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending direct message:', error);
    throw error;
  }
};

export const updateUserStatus = async (status: 'online' | 'offline' | 'away') => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ status })
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

export const updateDirectMessageReaction = async (messageId: string, userId: string, emoji: string) => {
  try {
    // First get current reactions
    const { data: message, error: fetchError } = await supabase
      .from('direct_messages')
      .select('reactions')
      .eq('id', messageId)
      .single();

    if (fetchError) throw fetchError;

    // Get current reactions or initialize empty object
    const currentReactions = message?.reactions || {};
    const userReactions = currentReactions[emoji] || [];
    const hasReacted = userReactions.includes(userId);

    // Update reactions
    let updatedReactions = { ...currentReactions };
    if (hasReacted) {
      // Remove reaction
      updatedReactions[emoji] = userReactions.filter((id: string) => id !== userId);
      if (updatedReactions[emoji].length === 0) {
        delete updatedReactions[emoji];
      }
    } else {
      // Add reaction
      updatedReactions[emoji] = [...userReactions, userId];
    }

    // Update the message
    const { data: updatedMessage, error: updateError } = await supabase
      .from('direct_messages')
      .update({ reactions: updatedReactions })
      .eq('id', messageId)
      .select('reactions')
      .single();

    if (updateError) throw updateError;
    return updatedMessage.reactions;
  } catch (error) {
    console.error('Error updating direct message reaction:', error);
    throw error;
  }
}

const UNIVERSAL_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000'
const UNIVERSAL_WORKSPACE_NAME = 'ChatGenius Community'

const addAllUsersToUniversalWorkspace = async () => {
  try {
    logger.log('Adding all users to universal workspace...')
    
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id')

    if (usersError) {
      logger.error('Error fetching users:', usersError)
      throw usersError
    }

    // Add each user to the universal workspace
    for (const user of users) {
      await addUserToUniversalWorkspace(user.id)
    }

    logger.log(`Added ${users.length} users to universal workspace`)
    return true
  } catch (error) {
    logger.error('Error adding all users to universal workspace:', error)
    throw error
  }
}

export const ensureUniversalWorkspace = async () => {
  try {
    // Check if universal workspace exists
    const { data: workspace, error: fetchError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', UNIVERSAL_WORKSPACE_ID)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      logger.error('Error fetching universal workspace:', fetchError)
      throw fetchError
    }

    // If workspace doesn't exist, create it
    if (!workspace) {
      logger.log('Creating universal workspace...')
      const { error: createError } = await supabase
        .from('workspaces')
        .insert({
          id: UNIVERSAL_WORKSPACE_ID,
          name: UNIVERSAL_WORKSPACE_NAME,
          description: 'A workspace for all users',
          created_at: new Date().toISOString()
        })

      if (createError) {
        logger.error('Error creating universal workspace:', createError)
        throw createError
      }

      // Create default channels
      await createDefaultChannels(UNIVERSAL_WORKSPACE_ID)
      logger.log('Universal workspace created successfully')

      // Add all existing users
      await addAllUsersToUniversalWorkspace()
    }

    return true
  } catch (error) {
    logger.error('Error ensuring universal workspace:', error)
    throw error
  }
}

export const addUserToUniversalWorkspace = async (userId: string) => {
  try {
    // Check if user is already a member
    const { data: membership, error: fetchError } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', UNIVERSAL_WORKSPACE_ID)
      .eq('user_id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      logger.error('Error checking universal workspace membership:', fetchError)
      throw fetchError
    }

    // If not a member, add them
    if (!membership) {
      logger.log(`Adding user ${userId} to universal workspace...`)
      const { error: addError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: UNIVERSAL_WORKSPACE_ID,
          user_id: userId,
          role: 'member',
          joined_at: new Date().toISOString()
        })

      if (addError) {
        logger.error('Error adding user to universal workspace:', addError)
        throw addError
      }

      logger.log(`User ${userId} added to universal workspace`)
    }

    return true
  } catch (error) {
    logger.error('Error adding user to universal workspace:', error)
    throw error
  }
}

const createDefaultChannels = async (workspaceId: string) => {
  try {
    logger.log(`Creating default channels for workspace ${workspaceId}...`)

    // Create general channel
    const { data: generalChannel, error: generalError } = await supabase
      .from('channels')
      .insert({
        name: 'general',
        description: 'General discussion channel',
        workspace_id: workspaceId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (generalError) {
      logger.error('Error creating general channel:', generalError)
      throw generalError
    }

    // Create welcome message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        content: 'Welcome to the workspace! 👋 This is the general channel for all members to chat and collaborate.',
        channel_id: generalChannel.id,
        created_at: new Date().toISOString()
      })

    if (messageError) {
      logger.error('Error creating welcome message:', messageError)
      throw messageError
    }

    logger.log('Default channels created successfully')
    return true
  } catch (error) {
    logger.error('Error creating default channels:', error)
    throw error
  }
}

export const setTypingIndicator = async (userId: string, recipientId: string, isTyping: boolean) => {
  try {
    const { error } = await supabase
      .from('typing_indicators')
      .upsert({
        user_id: userId,
        recipient_id: recipientId,
        is_typing: isTyping,
        last_typed: new Date().toISOString()
      }, {
        onConflict: 'user_id,recipient_id'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating typing indicator:', error);
    throw error;
  }
};

export const getTypingIndicator = async (userId: string, recipientId: string) => {
  try {
    const { data, error } = await supabase
      .from('typing_indicators')
      .select('is_typing, last_typed')
      .eq('user_id', recipientId)
      .eq('recipient_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.is_typing || false;
  } catch (error) {
    console.error('Error getting typing indicator:', error);
    return false;
  }
};
