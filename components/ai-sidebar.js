'use client';
import { useState, useEffect } from 'react';
import { useAIContext } from "@/context/ai-context"
import { useUserContext } from "@/context/user-context"
import { trimChatHistory } from "@/lib/utils"
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
import { Accordion } from '@/components/accordion'
import { saveAiChatConversation } from '@/lib/supabase';
import { example } from '@/lib/supabase';
import { generalPerformanceQuestions } from '@/lib/constants';
import { conversionBasedWithTicketSales  } from '@/lib/constants';
import { strategyAdvice  } from '@/lib/constants';
import { ABTestingInsight } from '@/lib/constants';
import { getAiConversations } from '@/lib/supabase';
import { selectAIArray } from '@/lib/constants';
import { selectAIObject } from '@/lib/constants';
const optionKeys = Object.keys(selectAIObject);


export default function AISideBar() {
  const { user } = useUserContext();
  const { displayAI, setDisplayAI, AIdata } = useAIContext();
  const [ responses, setResponses] = useState([])
  const [ prompt, setPrompt] = useState(generalPerformanceQuestions[0])
  const [ preBuiltOption, setPreBuiltOption] = useState(selectAIObject['General Performance Questions'][0])
  const [ preBuiltOptionArray, setPreBuiltOptionArray] = useState(selectAIObject['General Performance Questions'])
  const [activePrompt, setActivePrompt] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [displayHistory, setDisplayHistory] = useState([]);
  const [converstaionId, setConversationId] = useState('');

  const [loading, setLoading] = useState(false);


  const getfeedback = async () => {
    setLoading(true);
    const ads = AIdata;
    const currentPrompt = prompt;

    setDisplayHistory((prev) => [
      ...prev,
      { role: "user", content: currentPrompt }
    ]);


    let messages = [];

    if (chatHistory.length === 0 && ads.length > 0) {
      messages = [
        {
          role: "system",
          content:
            "You are a helpful and insightful marketing assistant who specializes in Facebook ad performance. You provide clear, data-driven recommendations to optimize campaigns. Prioritize cost-efficiency, conversion rates, and real-world outcomes (like ticket sales).",
        },
        {
          role: "user",
          content: `Here is a list of Facebook ads and ticket sales data:\n\n${JSON.stringify(
            ads,
            null,
            2
          )}\n\n${currentPrompt}`,
        },
      ];
    } else {
      const trimmedHistory = trimChatHistory(chatHistory, 8); // ✅ Keep last 8 exchanges
      messages = [...trimmedHistory, { role: "user", content: currentPrompt }];
    }

    setPrompt('')

    const res = await fetch("/api/analyze-ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    const data = await res.json();
    console.log(data.result);

    const aiResponse = {
      role: "assistant",
      content: data.result,
    };

    const updatedChatHistory =
      chatHistory.length === 0
        ? [...messages, aiResponse]
        : [...chatHistory, { role: "user", content: currentPrompt }, aiResponse];

    setChatHistory(updatedChatHistory);
    setDisplayHistory((prev) => [
      ...prev,
      aiResponse
    ]);

    setLoading(false);
  };

if (AIdata){
  console.log('AIdata', AIdata)
}



  const onDragStart = (e, item) => {
    e.dataTransfer.setData('item', JSON.stringify(item));
  };

  const onDrop = async (e) => {
      if (!e.dataTransfer.getData('item')) return;
      const item = JSON.parse(e.dataTransfer.getData('item'));

      setPrompt(item.toString())
      setActivePrompt(false)

  };

  const onDragOver = (e) => {
    e.preventDefault();
    setActivePrompt(true)
  };

  const newConversation = () => {
    setChatHistory([])
    setDisplayHistory([])
  }

  const saveConversation = async() => {

  try{
    const saveData = await saveAiChatConversation(converstaionId, chatHistory, displayHistory, user.id)
    setConverstaionId(saveData)

  }catch(error){
        showError(error)
    }

  }

  const loadConversations = async() => {

    try{
      const conversations = await getAiConversations(user.id)
    }catch(error){
      showError(error)
    }

  }


  const sample = [
      {
          "role": "user",
          "content": "What optimizations would you suggest based on this data?"
      },
      {
          "role": "assistant",
          "content": "Based on this data, I would make the following recommendations:\n\n1. Increase Investment in \"Website visitors Ad: Get ready for the concert that will rock the...\": This ad has the highest ticket sales at $24,841.53, while the ad spend is relatively low at $246.03. The cost per click is also one of the lowest at $0.27, and the click-through-rate is high at about 1.24. This suggests that this ad is highly effective at driving people towards purchasing tickets.\n\n2. Optimize \"Cohuna Home Ground Post 2025\": The high cost per click (CPC) of $2.49 and low click-through-rate (CTR) of 0.07 indicate that this ad is not very efficient. Consider improving the ad's content or targeting to increase engagement. We can look at the successful elements in the \"Website visitors Ad\" to apply here.\n\n3. Explore Better Timing: The \"HGS Cohuna TV Ad\" ran from February 14 to April 6, but it had significantly lower ticket sales ($2000) compared to the \"Website visitors Ad\". Consider running ads closer to the event date, as this may increase the conversion rate and drive better ticket sales.\n\n4. Improve Cost-efficiency of Instagram Posts: The ad \"Instagram post: Orange! 🍊 Cap off an epic Orange...\" has a relatively high cost per click (CPC) at $0.67. I would recommend testing different content variations or audience targeting to lower the CPC and increase engagement.\n\n5. Potential for Higher Engagement in Low Reach Ads: The ad \"Post: \\\"Home Ground Sounds is in Cowra.\\\"\" has a high click-through rate (6.89%), but low reach (995), which suggests there might be room for greater engagement if reach was increased. Consider increasing ad spend on this ad to increase its reach and ultimately, ticket sales. \n\nRemember, before making any significant changes, it's beneficial to run A/B tests to see if these recommendations indeed improve performance."
      }
  ]



  return (
    <>
      {displayAI&&
        <div className='ai-overlay' onClick={(e) => setDisplayAI(false)}>
        </div>
      }
        <div className={`${'ai-sidebar'} ${displayAI?'active':''}`}>
          <div style={{padding:'25px'}} onClick={(e) => e.stopPropagation()}>

                {displayHistory.length>0 &&
                  <div style={{display:'flex', flexDirection:'column'}}>
                    {console.log('displayHistory', displayHistory)}
                  {displayHistory.map((message)=>{
                    return(
                      <div key={message.content} className={`${message.role==="user"?'ai-message-right':'ai-message-left'}`}>
                        <div className={`${'message'} ${message.role==="user"?'secondary':''}`}>
                          {message.role === "assistant"&&
                            <p style={{fontSize:'.8em'}}><strong>{message.role}</strong></p>
                          }
                          <div>
                            <p className='ai-message-text'>{message.content}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                }
              </div>
                }




                <div style={{marginTop:'50px'}} className={`${'drop-zone-input'} ${activePrompt?'active':''}`} onDrop={(e) => onDrop(e)} onDragOver={(e) => onDragOver(e)}>
                  <textarea
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                {/*}
                {AIdata.length>0&&
                  <div style={{flex:3, flexFlow: 'wrap', display:'flex', padding:'10px'}}>
                  {AIdata.map((data, index)=>{
                      return(
                          <div key={index} style={{padding:'10px', width:'50%', position:'relative'}}>
                            <div className={`select-tab`} style={{padding:'10px'}}>
                                <Accordion  initState={'closed'}>
                                {JSON.stringify(data, null, 2)}
                                  </Accordion>
                            </div>
                          </div>
                      )
                    })
                  }
                  </div>
                }*/}

                  <button disabled={prompt.length===0 || loading} className="btn primary" onClick={getfeedback}>{loading?'Sending':"Send"}</button>


                                <p style={{fontSize:'.8em', margin: 0}}>Drag and drop into input area</p>
                                <select className="form-input select"
                                  value={preBuiltOption}
                                  onChange={(e) => {
                                    setPreBuiltOption(e.target.value)
                                    setPreBuiltOptionArray(selectAIObject[e.target.value])
                                      console.log('e.targetValue', e.target.value)
                                  }}>
                                    {optionKeys.map((option)=>{
                                      console.log('option', option)
                                      return <option key={option} value={option}>{option}</option>
                                    })
                                  }
                                </select>

                                {preBuiltOptionArray.map((option)=>{
                                  return<div className='select-tab' draggable onDragStart={(e) => onDragStart(e, option)} key={option}>{option}</div>
                                })

                                }


                    <button onClick={newConversation} className='btn secondary'>New Converstation</button>
                    <button onClick={saveConversation} style={{marginLeft:'10px'}} className='btn secondary'>Save Conversation</button>


          </div>
        </div>
    </>
  )
}
