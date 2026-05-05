'use client'

import { useState, useEffect, useRef, memo, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
import * as contentful from 'contentful'
var WPAPI = require( 'wpapi' );
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, { Draggable } from '@fullcalendar/interaction'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import timeGridPlugin from '@fullcalendar/timegrid'
import { getAllPosts } from '@/lib/supabase';
const removeMd = require('remove-markdown');
import { ChannelSelector } from '@/components/channel-selector';
import { getAllPostsSocialFilter } from '@/lib/supabase';
import {
  X
} from 'lucide-react';

const FEEDS = [
  {
    label: 'Hilltops Phoenix',
    spaceId: 'ticbtmcn8ib7',
    accessToken: 'ZevYwQ2O4E749EFWvAWStcN_nZh9ntUhi5dzW9fk2Dw',
    website:'www.hilltopsphoenix.com.au',
    CMSType:'contentful',
    scheduleDate: 'scheduleDate',
    publishedDate: 'publishDate',
    slug:'slug',
    title:'title',
    image:'heroImage',
    text:'body',
    facebook_page_id:'1509386042722586',
    CTA_image : 'hilltops-logo-stacked.png'

  },
  {
    label: 'Cowra Phoenix',
    spaceId: 'blbpa6fzvcno',
    accessToken: '_jbLmb4SDG2TkgW42NOTAVjPoCS78mQGEjOIXJrRExI',
    website:'www.cowraphoenix.com.au',
    CMSType:'contentful',
    scheduleDate: 'scheduleDate',
    publishedDate: 'publishDate',
    slug:'slug',
    title:'title',
    image:'image',
    text:'copy',
    facebook_page_id:'100367901935086',
    CTA_image : 'cowra-logo-stacked.png'
  },
  {
    label: 'Canowindra Phoenix',
    username: 'editor',
    password: 'xKGAB%ncydDFbrClXwd5Ex%t',
    website:'www.canowindraphoenix.com.au',
    CMSType:'wordpress',
    facebook_page_id:'106626202692898',
    scheduleDate: 'acf.schedule_date',
    CTA_image : 'canowindra-logo-stacked.png'
  },
  {
    label: 'Parkes Phoenix',
    username: 'roxane',
    password: 'SOw4vSFu*ueYUBnR$4Jkip@b',
    website:'www.parkesphoenix.com.au',
    CMSType:'wordpress',
    facebook_page_id:'973264922791233',
    scheduleDate: 'acf.schedule_date',
    CTA_image : 'parkes-logo-stacked.png'
  },
  {
    label: 'Forbes Phoenix',
    username: 'roxane',
    password: 'f#63$^bBGRz(Om)XXcpLqt0z',
    website:'www.forbesphoenix.com.au',
    CMSType:'wordpress',
    facebook_page_id:'883736781692596',
    scheduleDate: 'acf.schedule_date',
    CTA_image : 'forbes-logo-stacked.png'
  },
]

let eventGuid = 0
let todayStr = new Date().toISOString().replace(/T.*$/, '') // YYYY-MM-DD of today

export const INITIAL_EVENTS = [
  {
    id: createEventId(),
    title: 'All-day event',
    start: todayStr
  },
  {
    id: createEventId(),
    title: 'Timed event',
    start: todayStr + 'T12:00:00'
  }
]

export function createEventId() {
  return String(eventGuid++)
}

export const Scheduler = ({user})=>{
  const [selectedFeed, setSelectedFeed] = useState(FEEDS[0])
  const [calendarEvents, setCalendarEvents] = useState([])
  const [dateFilter, setDateFilter] = useState(new Date());
  const [posts, setPosts] = useState([]);
  const [dragMedia, setDragMedia] = useState(null)
  const cal = useRef();
  const [postData, setPostData] = useState(null)
  const [selectedSocialPages, setSelectedSocialPages] = useState([])





  const onDragStart = (data) => {
    setDragMedia(data);
  };

  const channelSelectorCallback = (pages) => {
    setSelectedSocialPages(pages)
    getPostsFilter(pages)
  }

  const getPostsFilter = async (pages) => {
    if (pages.length === 0) return
    const platformIds = pages.map((page)=> page.id)
    const socialFilterData = await getAllPostsSocialFilter(platformIds)
    updateCalendarEvents(socialFilterData)

  }


  const getPostsInit = async () => {
    const data = await getAllPosts()
    updateCalendarEvents(data)
  }

const updateCalendarEvents = (data) => {

  if (data.length === 0){
      setCalendarEvents([])
  }else{
    const calendarEvents = data.map((post)=>{
      return {
        start: post.scheduled_at,
        end: post.scheduled_at,
        allDay: false,
        title: post?.post?.title,
        id:post?.post?.id,
        ...post,
      }
    })

  //  handleEvents(calendarEvents)
     setCalendarEvents(calendarEvents)

  }


}


  useEffect(() => {
    getPostsInit()

  },[])

  const handleEventReceive = (data) => {
    console.log('handleEventRecieve', data)
    setPostData(data.event)

  }

  const handleEventDrop = (data) => {
    console.log('handleEventDrop', data)

  }

  const handleEventClick = (data) =>{
    console.log('eventClick', data)
    setPostData(data.event)
  }

  const eventClickSelect = (data) =>{
    console.log('eventClickSelect', data.event.def)

    setPostData(data.event)

  }


  function handleEvents(events) {
    setCalendarEvents(events)
  }


  function renderEventContent(eventInfo) {

    console.log('eventInfo', eventInfo)
    return (
      <div
        className={eventInfo.event._def.extendedProps.status}
        style={{
        width: '100%',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'block',
        padding: '0px 5px',
        borderRadius:'3px'
      }}
        >
        <i>{eventInfo.timeText}</i><br/>
        <b>{eventInfo.event.title}</b>
      </div>
    )
  }


  return(
    <div style={{display:'flex', height: '100%'}}>
      {postData&&
        <Share postData={postData} userId={user.id} close={setPostData}/>

      }
      <div style={{flex:1, padding:'20px'}}>
        <div style={{position:'relative', zIndex:100, marginBottom:'10px'}}>
          <p className='label'>Channel Filter</p>
          <ChannelSelector userId={user.id} callback={channelSelectorCallback}/>
        </div>

        {/*}
        <select id="channel-select" className="form-input select" onChange={(e) => onChannelChange(e.target.value)} value={selectedChannel}>
          {CHANNELS.map((feed, index)=>{
            return <option key={index} value={feed.label}>{feed.label}</option>
          })
          }
        </select>
        */}

        <FeedsPanel
          selectedFeed={selectedFeed}
          setSelectedFeed={setSelectedFeed}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          posts={posts}
          setPosts={setPosts}
          onDragStart={onDragStart}
        />
      </div>
      <div style={{flex:4, minWidth: 0}}>
        <FullCalendar
          ref={cal}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          slotLabelInterval={"00:30:00"}
          defaultTimedEventDuration={"00:30:00"}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          initialView='dayGridMonth'
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          //initialEvents={INITIAL_EVENTS} // alternatively, use the `events` setting to fetch from a feed
          select={handleEventClick}
          eventContent={renderEventContent} // custom render function
          eventClick={handleEventClick}
          eventReceive={handleEventReceive}
          //eventsSet={handleEvents} // called after events are initialized/added/changed/removed
          events={calendarEvents}
          /* you can update a remote database when these fire:
          eventAdd={function(){}}
          eventChange={function(){}}
          eventRemove={function(){}}
          */
        />

        {/*
        <FullCalendar
          ref={cal}
          allDaySlot={false}
          slotLabelInterval={"00:30:00"}
          defaultTimedEventDuration={"00:30:00"}
          forceEventDuration={true}
          selectable={true}
          expandRows={true}
          rerenderDelay={10}
          eventDurationEditable={false}
          editable={true}
          droppable={true}
          plugins={[interactionPlugin, timeGridPlugin]}
          initialView='timeGridWeek'
          nowIndicator={true}
          dayHeaderContent = { function(args){
              return moment(args.date).format('ddd, MMMM Do')
            }
          }
          editable={true}
          events={calendarEvents}
          eventClick={(args) => eventClick(args)}
          select={(args) => eventClickSelect(args)}
          eventAdd={(args) => console.log('eventAdd', args)}
          eventDrop={(args) => handleEventDrop(args)}
          eventReceive={(args) => handleEventReceive(args)}
          eventContent={(args) => renderEventContent(args)}
        />*/}
      </div>
    </div>
  )
}


const FeedsPanel = ({
  selectedFeed,
  setSelectedFeed,
  dateFilter,
  setDateFilter,
  posts,
  setPosts,
  onDragStart
  }) => {


    const onFeedChange = (value) => {
      const feed = FEEDS.find(item => item.label === value);
      setSelectedFeed(feed);
      if (dateFilter){
        getFeed(feed, dateFilter);
      }

    }

    const setDateFilterFunction = (date) => {
        setDateFilter(date)
        if (selectedFeed){
          getFeed(selectedFeed, date);

        }

    }





    const getFeed = async (selectedFeed, dateFilter) => {


      if (selectedFeed.CMSType === 'contentful'){
        const client = contentful.createClient({
          space: selectedFeed.spaceId,
          accessToken: selectedFeed.accessToken,
        })

        const response = await client.getEntries({
          'content_type': 'post',
          'order': '-fields.publishDate',
           'limit': '100',
          'include': '10',
        })

        let date = moment(dateFilter).format('YYYY-MM-DD');

        const filterPosts = response.items.filter((item)=> item.fields[selectedFeed.publishedDate] === date)

        if (filterPosts.length < 1) return

        const posts = filterPosts.map((item)=>{
            return {
              id: item.sys.id,
              scheduleDate: item.fields[selectedFeed.scheduleDate],
              link: selectedFeed.website+'/'+item.fields[selectedFeed.slug],
              media: [
                {
                  file_url:'https:' + item.fields[selectedFeed.image].fields.file?.url,
                  file_description: item.fields[selectedFeed.image].fields.file?.description,
                }
              ],
              title: item.fields[selectedFeed.title],
              slug: item.fields[selectedFeed.slug],
              base_url: selectedFeed.website,
              status: 'unpublished',
              caption: removeMd(item.fields[selectedFeed.text]),
              publishedDate: item.fields[selectedFeed.publishedDate],
              type:'post',
              scheduled:false,
            }
        })


        setPosts(posts)
      }else if (selectedFeed.CMSType === 'wordpress'){

        let date = moment(dateFilter).format('YYYY-MM-DD')+'T00:00:00';

        const wpapiUrl = 'https://' + selectedFeed.website + '/wp-json'

        const wp = new WPAPI({
            endpoint: wpapiUrl,
            username: selectedFeed.editor,
            password: selectedFeed.password,
        });


        const response = await wp.posts().embed().perPage(100).order('desc').orderby('date').after(new Date(date)).get()

        function multiIndex(obj,is) {  // obj,['1','2','3'] -> ((obj['1'])['2'])['3']
            return is.length ? multiIndex(obj[is[0]],is.slice(1)) : obj
        }
        function pathIndex(obj,is) {   // obj,'1.2.3' -> multiIndex(obj,['1','2','3'])
            return multiIndex(obj,is.split('.'))
        }

        const posts = response.map((item)=>{
            return {
              id : item.id.toString(),
              scheduleDate: pathIndex(item, selectedFeed.scheduleDate),
              link: item.slug? 'https://' + selectedFeed.website +'/' + item.slug : null,
              media: [
                {
                  file_url:(item._embedded && item._embedded['wp:featuredmedia'])? item._embedded['wp:featuredmedia'][0].source_url : null,
                  file_description: (item._embedded && item._embedded['wp:featuredmedia'])? item._embedded['wp:featuredmedia'][0].caption.rendered : null,
                }
              ],
              title: decodeEntities(item.title.rendered),
              slug: item.slug,
              base_url: selectedFeed.website,
              status: 'unpublished',
              caption: decodeCaptionEntities(item.content.rendered),
              publishedDate: item.date,
              type:'post',
              scheduled:false,
            }
        })
        setPosts(posts)
      }
    }



  return(
    <div>
      <label className='label'>Publication</label>
      <select id="rss-select" className="form-input select" onChange={(e) => onFeedChange(e.target.value)} value={selectedFeed.label}>
        {FEEDS.map((feed, index)=>{
          return <option key={index} value={feed.label}>{feed.label}</option>
        })
        }
      </select>
      <div>
        <label className='label'>Publication Date Filter</label>
          <DatePicker
            selected={dateFilter}
            onChange={(date) => setDateFilterFunction(date)}
            className={'form-input'}
            dateFormat="dd/MM/yyyy"
          />
      </div>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        overflowY: 'scroll',
        overflowX: 'hidden',
        alignContent: 'flex-start',
        gap: '2%'
      }}>
        {posts.map((post, index)=>{
          const facebook = {facebook_page_id:selectedFeed.facebook_page_id}

          const postData = {...post, ...facebook}
          return(
            <ExternalEvent key={index} data={postData}/>
          )
        })}
      </div>
    </div>
  )
}

const ExternalEvent = memo(({data}) => {
  let elRef = useRef(null);
  const isMounted = useRef(false);

  useEffect(() => {
  isMounted.current = true;


  let draggable = new Draggable(elRef.current, {
    eventData: function () {
      return data;
    }
  });


  // a cleanup function
  return () => {
    isMounted.current = false;
    draggable.destroy();
  };
},[]);



return (
  <div ref={elRef} style={{width:'48%'}} className={`post_image ${data.scheduled? 'active': ''}`}>
    <img
      style={{
        height:'100px',
        objectFit:'cover',
        margin: '2% 0',
        borderRadius: 'var(--input-border-radius)'
      }}
      draggable
      src={data.media[0].file_url}
    />
  </div>
)
})

const Share = ({
  postData,
  userId,
  close
}) => {
  return(
    <>
      <div className={'loader_screen'} style={{zIndex:1000}} onClick={() => close(null)}></div>
      <div className='share-dialog dropshadow' style={{padding:'40px 15px 15px 15px', zIndex:1001}}>
        <X
          onClick={() => close(null)}
          className="close-icon"
          style={{
            cursor: "pointer",
            right: "5px",
            position: "absolute",
            top: "5px",
          }}
        />
      </div>
    </>
  )
}
