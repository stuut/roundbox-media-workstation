'use client';
import { useState, useEffect } from 'react';
import { useAIContext } from "@/context/ai-context"
import { useUserContext } from "@/context/user-context"
import { trimChatHistory } from "@/lib/utils"
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';

import { generalPerformanceQuestions } from '@/lib/constants';
import { conversionBasedWithTicketSales  } from '@/lib/constants';
import { strategyAdvice  } from '@/lib/constants';
import { ABTestingInsight } from '@/lib/constants';

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

    if (chatHistory.length === 0) {
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
                            <p>{message.content}</p>
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
                {(AIdata.length>0 && prompt.length>0)&&
                  <button disabled={loading} className="btn primary" onClick={getfeedback}>{loading?'Sending':"Send"}</button>
                }

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



          </div>
        </div>
    </>
  )
}
