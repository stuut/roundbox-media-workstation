import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client'
const supabase = createClient()
import { useUserContext } from '@/context/user-context'
import { getAllUsers } from "@/lib/supabase";
import { getAllConversationsforaUser } from "@/lib/supabase";
import { isInArray } from '@/lib/utils'
import User from "@/components/user";
import { useMessageListener } from '@/components/use-message-listener';
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';

export default function ChatConversations({alert}) {
  const [recipientId, setRecipientId] = useState('');
  const [message, setMessage] = useState('');
  const [initMessage, setInitMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [noUsers, setNoUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [myConversations, setMyConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedConversationMessages, setSelectedConversationMessages] = useState(null);




  const { user } = useUserContext();

  const getUsersData = async () => {
    try {
        const Allusers = await getAllUsers()
        const filteredUsers = Allusers.filter((node, index)=>{
            return user.id !== node.id
        })

        if (filteredUsers.length === 0){
          setNoUsers(true)
        }else{
          setNoUsers(false)
        }

        setUsers(filteredUsers);
    } catch (error) {
      console.log(error.message);
    }
  }

  useEffect(()=>{
    getUsersData()
    getMyConversations()
  },[])



  const getMyConversations = async () => {

    try {
      const conversations = await getAllConversationsforaUser(user.id)
      setMyConversations(conversations)

    } catch (error) {
      console.log(error.message);
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault();
    setLoading(true);

    try{

      const { error: messageError } = await supabase
        .from('messages')
        .insert([{
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: message
        }]);

      if (messageError) throw messageError;


    }catch(error){
      console.error('Error:', error);
      alert(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }

  }



  const createConversation = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create conversation
      const { data: convo, error: convoError } = await supabase
        .from('conversations')
        .insert([{
          name: null,
          created_by:user.id
        }])
        .select()
        .single();

      if (convoError) throw convoError;

      const conversationId = convo.id;

      const membersPayload = selectedUsers.map(user_id => ({
        user_id: user_id,
        conversation_id: conversationId
      }));

      membersPayload.push({
        user_id: user.id,
        conversation_id: conversationId
      })

      // 2. Add sender and recipient to conversation_members
      const { error: membersError } = await supabase
        .from('conversation_members')
        .insert(membersPayload);

      if (membersError) throw membersError;

      // 3. Send initial message
      const { error: messageError } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: user.id,
          content: message
        }]);

      if (messageError) throw messageError;

      alert('Conversation started!');
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const selectUserFunction = (data) => {
    if (isInArray(data, selectedUsers)){
      const removed = selectedUsers.filter(remove => {
        return remove !== data
      });
      setSelectedUsers(removed);
    }else{
      setSelectedUsers(selectedUsers => [...selectedUsers, data])
    }
  }

  useMessageListener(user.id, (newMsg) => {


    if (newMsg.conversation_id === selectedConversation.id){
        setSelectedConversationMessages(prev => [...prev, newMsg])

    }

    alert(true)


  console.log('🔔 New message:', newMsg);
});

  return (
    <div style={{display:'flex'}}>
      <div style={{padding:'0px 15px', flex:1}}>
        {myConversations.map((convo, index) => {
          const selected = selectedConversation?convo.conversation.id === selectedConversation.id ?true: false:false
            return(
              <div
                key={index}
                onClick={() => {
                  if (selected){
                    setSelectedConversation(null)
                    setSelectedConversationMessages(null)
                  }else{

                    setSelectedConversation(convo.conversation)
                    setSelectedConversationMessages(convo.conversation.messages)
                  }

                }}
                style={{cursor:'pointer'}}
                className={`${'select-tab'} ${selected ?'active':''}`}
              >
                <div style={{display:'flex'}}>
                  {convo.conversation.conversation_members.map((member, index)=>{
                      return(
                          <img key={member.user_id} style={{objectFit:'cover', width:'30px', height:'30px', borderRadius:'100%'}} src={member.users.avatar_url ? member.users.avatar_url : selected?'/account-active.svg':'/account.svg'}/>
                      )
                    })
                  }
                </div>
              </div>
            )
        })}
      </div>
      <div style={{padding:'0px 15px', flex:3}}>

        {selectedConversation ?(

                <div style={{display:'flex', flexDirection:'column'}}>
                  {selectedConversationMessages.map((message)=>{
                    return(
                      <div key={message.id} className={`${message.sender_id===user.id?'message-right':'message-left'}`}>
                        <div className={`${'message'} ${message.sender_id===user.id?'primary':'secondary'}`}>
                          {message.content}
                        </div>
                        {message?.sender&&
                          <>
                          {message?.sender.avatar_url?(
                            <div className={`${'message-avatar'} `}>
                              <img src={message?.sender.avatar_url} />
                            </div>
                            ):(
                            <div className={`${'message-avatar'}`}>
                              <img src='/account.svg' />
                            </div>
                          )}
                        </>
                        }
                    </div>
                    )
                  })}
                  <form onSubmit={sendMessage}>
                    <textarea
                      className='form-input'
                      placeholder="Your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className='btn primary'
                      disabled={loading}
                    >
                      {loading ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                </div>

            ):(
              <div>
                <h3>New Conversation</h3>
                {users.map((user, index)=>{
                    return(
                      <div
                        key={index}
                        onClick={() => selectUserFunction(user.id)}
                        style={{cursor:'pointer', padding:'5px 10px 5px 10px'}}
                        className={`${'select-tab'} ${isInArray(user.id, selectedUsers)?'active': ''}`}
                      >
                        <User size={'small'} userInfo={user} active={isInArray(user.id, selectedUsers)?true:false}/>
                      </div>
                    )
                })}
                <form onSubmit={createConversation}>
                  <textarea
                    className='form-input'
                    placeholder="Your message..."
                    value={initMessage}
                    onChange={(e) => setInitMessage(e.target.value)}
                    required
                  />

                  <button
                    type="submit"
                    className='btn primary'
                    disabled={loading || !selectedUsers.length>0 }
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            )
        }
      </div>
    </div>
  );
}
