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
import listPlugin from '@fullcalendar/list'
import { getAllPosts } from '@/lib/supabase';
import { savePost } from "@/lib/supabase";
import { savePostFile } from "@/lib/supabase";
import { deletePost } from "@/lib/supabase";
import { savePostPublications } from "@/lib/supabase";
const removeMd = require('remove-markdown');
import { ChannelSelector } from '@/components/channel-selector';
import { getAllPostsSocialFilter } from '@/lib/supabase';
import { updatePostPublication } from '@/lib/supabase';
import { updatePost } from '@/lib/supabase';
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from 'react-responsive-carousel';
import { ReactSortable } from "react-sortablejs";
import { useFilesContext } from "@/context/files-context"
import { useEditItemContext } from "@/context/edit-item-context"
import Switch from '@mui/material/Switch';
import Radio from '@mui/material/Radio';

import { Summary } from '@/components/summary'
import { Caption } from '@/components/caption'
import { v4 as uuidv4 } from 'uuid'
import { storeFileInfo } from "@/lib/supabase";
import { updatePostScheduleDate } from "@/lib/supabase";
import { getPostsWithIds } from "@/lib/supabase";
import { uploadFile } from '@/lib/upload-file'

import {
  X,
  ExternalLink,
  CircleCheck,
  GripVertical,
  SquarePen,
  Trash2,
  Crop,
  EllipsisVertical
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
    content_type: 'post',
    CTA_image : 'hilltops-logo-stacked.png',
    postType: 'link'

  },
  {
    label: 'Hilltops Phoenix Ads',
    spaceId: 'ticbtmcn8ib7',
    accessToken: 'ZevYwQ2O4E749EFWvAWStcN_nZh9ntUhi5dzW9fk2Dw',
    website:'www.hilltopsphoenix.com.au',
    CMSType:'contentful',
    title:'title',
    image:'image',
    text:'description',
    content_type: 'adModule',
    facebook_page_id:'1509386042722586',
    CTA_image : 'hilltops-logo-stacked.png',
    customFilterField: 'targeting',
    postType: 'photos'

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
    CTA_image : 'cowra-logo-stacked.png',
    postType: 'link'
  },
  {
    label: 'Canowindra Phoenix',
    username: 'editor',
    password: 'xKGAB%ncydDFbrClXwd5Ex%t',
    website:'www.canowindraphoenix.com.au',
    CMSType:'wordpress',
    facebook_page_id:'106626202692898',
    scheduleDate: 'acf.schedule_date',
    CTA_image : 'canowindra-logo-stacked.png',
    postType: 'link'
  },
  {
    label: 'Parkes Phoenix',
    username: 'roxane',
    password: 'SOw4vSFu*ueYUBnR$4Jkip@b',
    website:'www.parkesphoenix.com.au',
    CMSType:'wordpress',
    facebook_page_id:'973264922791233',
    scheduleDate: 'acf.schedule_date',
    CTA_image : 'parkes-logo-stacked.png',
    postType: 'link'
  },
  {
    label: 'Forbes Phoenix',
    username: 'roxane',
    password: 'f#63$^bBGRz(Om)XXcpLqt0z',
    website:'www.forbesphoenix.com.au',
    CMSType:'wordpress',
    facebook_page_id:'883736781692596',
    scheduleDate: 'acf.schedule_date',
    CTA_image : 'forbes-logo-stacked.png',
    postType: 'link'
  },
]

const convertDateUnix = (unix) => {
  return new Date(unixTimestamp * 1000);
}


const checkPublished = (publishDate, statusOriginal) => {



  var status = statusOriginal

  var date1 = new Date(publishDate);
  var date2 = new Date();
  if(date1.getTime() < date2.getTime()){

      status = "published"
  }

    return status
}

const getFileName = (path) => path.split('/').pop(); // sample-image.jpg

async function fileFromServer(path) {
  const response = await fetch(path);
  const blob = await response.blob();
  const fileName = path.split("/").pop();
  return new File([blob], fileName, { type: blob.type });
}


async function getImageType(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('Content-Type');
    return contentType;
  } catch (error) {
    console.log('Error fetching image type:', error);
  }
}

export const checkRatio = (w, h) => {

  function roundLikePHP(num, dec){
    var num_sign = num >= 0 ? 1 : -1;
    return parseFloat((Math.round((num * Math.pow(10, dec)) + (num_sign * 0.0001)) / Math.pow(10, dec)).toFixed(dec));
  }


  let round =  w / h

  let ratio = roundLikePHP(round, 2);


      if (ratio === 1)
        return false;

    // Portrait: min 0.8 | max 0.99
    // Landscape: min 1.01 | max 1.91
    if (w < h)
        if (ratio >= 0.8 && ratio <= 0.99)
            return false;

    if (w > h)
        if (ratio >= 1.01 && ratio <= 1.91)
            return false;

    return true;
}


const checkImageSize = async (imageUrl) => {
    const img = new Image();
    img.src = imageUrl;

    let imageLoadPromise = new Promise((resolve, reject) => {
      img.onload = () => {
        let checkRatioVal = checkRatio(img.width, img.height)
        resolve(checkRatioVal)
      };

    })

  let imageStatus = await imageLoadPromise

  return imageStatus

};


const capitilise = (str) => {
  return `${str[0].toUpperCase()}${str.slice(1)}`;
}

const timeTravel = (date) => {

  var scheduled = moment(date).add(30, 'm').toDate()
  var now = new Date();

  if(moment(date).diff(moment(now), "minutes") < 30){
    return true
  }else{
    return false
  }

}

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

const calculateMinTime = date => {
  let isToday = moment(date).isSame(moment(), 'day');
  if (isToday) {
      let nowAdd30Mins = moment(new Date()).add({hours: 30}).toDate();
      return nowAdd30Mins;
  }
  return moment().startOf('day').toDate();
}

const decodeEntities = (str) => {
// this prevents any overhead from creating the object each timesocialId
  var element = document.createElement('div');

  function decodeHTMLEntities (str) {
    if(str && typeof str === 'string') {

      str = str.replace(/(.*[\s+\"\']wp-caption-text[\s+\"\'].*)/g, '');
      // strip script/html tags
      str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
      str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');

      str = str.replace("&#8230;", "...");
      str = str.replace("&#8217;", "'");
      str = str.replace('&nbsp;', '\n');
      str = str.replaceAll("\\s+","");
      str = str.replace("\u00A0","");
      str = str.replace('&#8211;', '');

      str = str.split('\n').join('\n\n');
      str = str.trim();

      element.innerHTML = str;
      str = element.textContent;
      element.textContent = '';
    }

    return str;
  }

  return decodeHTMLEntities(str);
}

const decodeCaptionEntities = (str) => {
// this prevents any overhead from creating the object each timesocialId
  var element = document.createElement('div');

  function decodeHTMLEntities (str) {
    if(str && typeof str === 'string') {

      let captions = str.match(/(.*[\s+\"\']wp-caption-text[\s+\"\'].*)/g, '');

      str = str.replace(/(.*[\s+\"\']wp-caption-text[\s+\"\'].*)/g, '');
      // strip script/html tags
      str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
      str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');



      if (captions !== null){
        for (let i = 0; i < captions.length; i++) {
          captions[i] = captions[i].replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
          captions[i] = captions[i].replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
          if (captions.length > 1){
            str = str+ '\n' + 'IMAGE '+(i+1)+': ' + captions[i]
          }else{
            str = str+ '\n' + 'IMAGE: ' + captions[i]
          }

        }
      }

      str = str.replace("&#8230;", "...");
      str = str.replace("&#8217;", "'");
      str = str.replace('&nbsp;', '\n');
      str = str.replaceAll("\\s+","");
      str = str.replace("\u00A0","");
      str = str.replace('&#8211;', '');

      str = str.split('\n').join('\n\n');
      str = str.trim();

      element.innerHTML = str;
      str = element.textContent;
      element.textContent = '';
    }

    return str;
  }

  return decodeHTMLEntities(str);
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


  const [loader, setLoader] = useState(false)


  const getNotifications =  async () => {

    const onesignalDeleteResponse = await fetch('/api/one-signal/get-notifications', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId:'81ae7374-28f3-4155-9ea2-b552ab80ed78',
        }),
    });

      if (!onesignalDeleteResponse.ok) {
        showError(`Error deleting one signal post: ${onesignalDeleteResponse.status}`)
      }

      const onesignalDeleteResponseJson = await onesignalDeleteResponse.json();

  }




  const checkCalendarEventsDuplicate = (events) => {
    const calendarApi = cal.current.getApi()
    const calendarEventsCheck = calendarApi.getEvents()

    let hasChanges = false

    const newEvents = events.map((event) => {
      const duplicate = calendarEventsCheck.find(
        (calendarEvent) => calendarEvent.id === event.id
      )

      if (duplicate) {
        hasChanges = true

        return {
          ...event,
          id: uuidv4()
        }
      }

      return event
    })

    if (hasChanges) {
      setCalendarEvents(newEvents)
    }
  }


  const schedulePostCallBack = async (postData, status, savedPostPublications) => {

    const ids = savedPostPublications.map(post=>post.id)

    const posts = await getPostsWithIds(ids)

    const newPosts = posts.map((post)=>{

      const media = post?.post_files.map((media)=>{
        return {
          source: 'internal',
          ...media.file_id
        }
      })

      let status = post?.status??''

      return {
        id: post.id,
        start: post.scheduled_at,
        end: post.scheduled_at,
        allDay: false,
        title: post?.title,
        caption: post?.caption,
        scheduleDate: post?.scheduled_at,
        publishDate: post?.meta_data?.data?.publishedDate??null,
        link: post?.meta_data?.post_data?.link??null,
        slug: post?.meta_data?.post_data?.slug??null,
        base_url: post?.meta_data?.post_data?.base_url??null,
        status: status??null,
        type:post?.type??'',
        media: media??null,
        error: post?.last_error??'',
        database_info:{
          post_id:post?.post?.id,
          post_publications_id:post.id,
        },
        metaData: {
          ...post?.meta_data,
          ...post?.platform_account?.metadata
        },
        platform_account:post?.platform_account,

      }
    })


    setCalendarEvents(prev => [...prev, ...newPosts]);

    /*
    const calendarApi = cal.current.getApi()
    let event = calendarApi.getEventById(postData.id);
    if (event) {
      event.remove();
    }*/
    setCalendarEvents(prev => prev.filter((post)=> post.id !== postData.id))




    /*
    event.mutate({
      extendedProps: {
        status: status
      },
    })*/

  }



  const reloadEvents = async() => {
    if (selectedSocialPages.length > 0){
      getPostsFilter(selectedSocialPages)
    }else{

      const data = await getAllPosts()
      updateCalendarEvents(data)
    }
  }


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

      const media = post?.post_files.map((media)=>{
        return {
          source: 'internal',
          ...media.file_id
        }
      })


      let status = post?.status??''

      if (post?.platform_account === 'facebook' && status === 'scheduled'){
        status = checkPublished(
          post?.scheduled_at,
          post?.status,
        )
      }

      return {
        id: post.id,
        start: post.scheduled_at,
        end: post.scheduled_at,
        allDay: false,
        title: post?.title,
        caption: post?.caption,
        scheduleDate: post?.scheduled_at,
        publishDate: post?.meta_data?.data?.publishedDate??null,
        link: post?.meta_data?.post_data?.link??null,
        slug: post?.meta_data?.post_data?.slug??null,
        base_url: post?.meta_data?.post_data?.base_url??null,
        status: status??null,
        type:post?.type??'',
        media: media??null,
        error: post?.last_error??'',
        database_info:{
          post_id:post?.post?.id,
          post_publications_id:post.id,
        },
        metaData: {
          ...post?.meta_data,
          ...post?.platform_account?.metadata
        },
        platform_account:post?.platform_account,

      }
    })

  //  handleEvents(calendarEvents)
     setCalendarEvents(calendarEvents)

  }


}

const hasRun = useRef(false);

  useEffect(() => {
    if (!hasRun.current) {
        getPostsInit()
        hasRun.current = true; // Mark as run to prevent double execution in dev

    }
  },[])

  const handleEventReceive = (data) => {

    var scheduled = data.event.start

    var now = new Date();

    if(scheduled.getTime() < now.getTime()){
      showError("No Time travel")
      return
    }


    data.event.mutate({
      extendedProps: {
        scheduleDate: scheduled
      },
    })


    setPostData(data.event)

  }

  const updateEventTime = async(data) => {

    data.event.mutate({
      extendedProps: {
        scheduleDate: moment(data.event.start).format("YYYY-MM-DD HH:mm:ss"),
        start : moment(data.event.start).format("YYYY-MM-DD HH:mm:ss")
      },
    })

    await updatePostScheduleDate(moment(data.event.start).format("YYYY-MM-DD HH:mm:ss"), data.event._def.extendedProps.database_id)
    // update schedule date on DB

  }

  const handleEventDrop = (data) => {


    var scheduled = data.event.start
    var now = new Date();
    if(scheduled.getTime() < now.getTime()){
      showError("No Time travel")
      return
    }

    const platform = data.event._def.extendedProps.platform_account.platform

    if (data.event._def.extendedProps.status === "scheduled"){

      updateEventTime(data)

      if (platform === 'facebook'){

        return
      }

    }

  }

  const handleEventClick = (data) =>{

    setPostData(data.event)



  }

  const eventClickSelect = (data) =>{
    var scheduled = data.start
    var now = new Date();
    if(scheduled.getTime() < now.getTime()){
      showError("No Time travel")
      return
    }

    const calendarApi = cal.current.getApi()

    let id = Date.now()

    calendarApi.unselect()
    // clear date selection

    calendarApi.addEvent({
      id: id,
      start: data.startStr,
      end: data.endStr,
      media:[],
      base_url: null,
      title : null,
      link: null,
      slug: null,
      caption: 'Take a look at issue XXX...',
      emailTemplateData: null ,
      status: 'unpublished',
      scheduleDate: data.start,
      type: null
    })
    let currentEvent = calendarApi.getEventById(id);


    setPostData(currentEvent)
  }


  function handleEvents(events) {
    setCalendarEvents(events)
  }




  function renderEventContent(eventInfo) {


    const isOneSignal = eventInfo?.event?._def?.extendedProps?.platform_account?.platform === 'One Signal'
    const isFacebook = eventInfo?.event?._def?.extendedProps?.platform_account?.platform === 'facebook'
    const postId = eventInfo?.event?._def.extendedProps?.metaData?.post_id

    let className = eventInfo.event._def.extendedProps.status

    if ((isFacebook || isOneSignal) && !postId){
      className = 'error'
    }

    return (
      <div
        className={className}
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
        <b>{eventInfo.event.title !== 'null'?eventInfo.event.title:eventInfo.event._def.extendedProps.caption}</b>
      </div>
    )
  }




  const deletePostCallback = async(postData) =>{

    const postType = postData._def.extendedProps.type

    if (postData?._def?.extendedProps?.platform_account?.platform === "facebook" ||
      postData?._def?.extendedProps?.platform_account?.platform === "instagram"
    ){
      const channelId = postData._def.extendedProps.platform_account.id

      let id
      if (postType === 'video_reels'){
        id = postData?._def.extendedProps?.metaData?.post_id
      }else if (postType === 'text' || postType === 'link' || postType === 'photos') {
        id = postData?._def.extendedProps?.metaData?.post_id
      }

      if (id) {

        const facebookDeleteResponse = await fetch(`/api/facebook/delete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              channelId:channelId,
              postId:id
            }),
          })

          if (!facebookDeleteResponse.ok) {
            //throw new Error(`Upload to facebook failed with status: ${facebookResponse.status}`);
            showError(`Error deleting post on facebook: ${facebookDeleteResponse.status}`)
          }

          const facebookDeleteResponseJson = await facebookDeleteResponse.json();


      }

      showSuccess('Post Deleted')
    }


    if (postData?._def?.extendedProps?.platform_account?.platform === "One Signal"){

      const notificationId = postData?._def.extendedProps?.metaData?.notification_id
      const channelId = postData?._def.extendedProps?.platform_account?.id

      if (notificationId && channelId) {

        const onesignalDeleteResponse = await fetch('/api/one-signal/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              channelId:channelId,
              notificationId:notificationId
            }),
        });

          if (!onesignalDeleteResponse.ok) {
            showError(`Error deleting one signal post: ${onesignalDeleteResponse.status}`)
          }

          const onesignalDeleteResponseJson = await onesignalDeleteResponse.json();

          if (onesignalDeleteResponseJson?.success){
            showSuccess('Notification Deleted')
          }else{
            showError('Error deleting one signal post')
          }

      }
    }



    await deletePost([postData._def.extendedProps.database_info.post_publications_id])

    setCalendarEvents(prev => prev.filter((post)=> post.id !== postData.id))

    showSuccess('Post Deleted')
  }





  return(
    <div style={{display:'flex', height: '100%'}}>
      {postData&&
        <Share
        postData={postData}
        userId={user.id}
        close={setPostData}
        deletePostCallBack={deletePostCallback}
        cal={cal}
        scheduleCallBack={schedulePostCallBack}
      />

      }
      <div style={{flex:1, padding:'20px'}}>
        {/*}<button onClick={getNotifications}>Check One Signal</button>*/}
        {/*}  <button onClick={deleteOneSignal}>Delete One Signal</button>*/}


        <div style={{position:'relative', zIndex:2, marginBottom:'10px'}}>
          <p className='label'>Channel Filter</p>
          <ChannelSelector
            userId={user.id}

          callback={channelSelectorCallback}
        />
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
          cal={cal}
          calendarEvents={calendarEvents}
          setCalendarEvents={setCalendarEvents}
        />
      </div>
      <div style={{flex:4, minWidth: 0}}>
        <div style={loader? {display:'block'}:{display:'none'}} className={'loader_screen'}>
            <div style={{transform:'translate(-50%, -50%)'}}  className="loader"></div>
        </div>
        <FullCalendar
          key={calendarEvents.length}
          ref={cal}
          allDaySlot={false}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          slotLabelInterval={"00:30:00"}
          defaultTimedEventDuration={"00:30:00"}
          // 1. Define the custom button
          customButtons={{
            reload: {
              text: 'Reload',
              click: function() {
                reloadEvents();
              },
            },
          }}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'reload, dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          initialView='timeGridWeek'
          slotEventOverlap={false}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          nowIndicator={true}
          expandRows={true}
          nowIndicator={true}
          droppable={true}
          select={eventClickSelect}
          eventContent={renderEventContent} // custom render function
          eventClick={handleEventClick}
          eventReceive={handleEventReceive}
          eventDrop={handleEventDrop}
          events={calendarEvents}
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
  onDragStart,
  cal,
  calendarEvents,
  setCalendarEvents
  }) => {


    const [noPosts, setNoPosts] = useState(false)



      const importEvents = () => {

        const newPosts = posts.map((post)=>{
          return{
            ...post,
            start: post.scheduleDate,
            end: post.scheduleDate,
            allDay: false,

          }
        })


        setCalendarEvents(prev => [...prev, ...newPosts]);



      }


      const checkEvents = () => {
        const calendarApi = cal.current.getApi()
        const calendarEventsCheck = calendarApi.getEvents()

      }


      const checkCalendarEventsDuplicate = (events) => {
        const calendarApi = cal.current.getApi()
        const calendarEventsCheck = calendarApi.getEvents()
        const newEvents = events.map((event) => {
          const duplicate = calendarEventsCheck.find(
            (calendarEvent) => calendarEvent.id === event.id
          )

          if (duplicate) {

            return {
              ...event,
              id: uuidv4()
            }
          }

          return event
        })

        return newEvents
      }


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

      setNoPosts(false)
      setPosts([])


      if (selectedFeed.CMSType === 'contentful'){
        const client = contentful.createClient({
          space: selectedFeed.spaceId,
          accessToken: selectedFeed.accessToken,
        })


        let order
         if (selectedFeed.publishedDate){
           order = '-fields.'+selectedFeed.publishedDate
         }else{
           order = 'sys.updatedAt'
         }



        const response = await client.getEntries({
          'content_type': selectedFeed.content_type,
          'order': order,
           'limit': '100',
          'include': '10',
        })

        let date = moment(dateFilter).format('YYYY-MM-DD');

        var filterPosts = response.items


        if (selectedFeed.publishedDate){
          filterPosts = response.items.filter((item)=> item.fields[selectedFeed.publishedDate] === date)
        }


        if (filterPosts.length === 0){
          setNoPosts(true)
          return
        }

        if (selectedFeed.customFilterField){
          filterPosts = filterPosts.filter(function(node) {
               return !node.fields[`${selectedFeed.customFilterField}`]

           });
        }



        const posts = []

        for (const item of filterPosts) {
          const urlString = 'https:' + item?.fields[selectedFeed.image]?.fields?.file?.url;
          const url = new URL(urlString);
          const fileName = url.pathname.split('/').pop();
          const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");

          posts.push({
            id: item.sys.id,
            scheduleDate: item.fields[selectedFeed.scheduleDate],
            link: selectedFeed.website+'/'+item.fields[selectedFeed.slug],
            media: [
              {
                id:item?.fields[selectedFeed.image]?.sys?.id,
                file_url:'https:' + item?.fields[selectedFeed.image]?.fields?.file?.url,
                file_description: item?.fields[selectedFeed.image]?.fields?.description,
                file_name: nameWithoutExtension,
                file_type: await getImageType('https:' + item?.fields[selectedFeed.image]?.fields?.file?.url),
                source: 'external'
              }
            ],
            title: item.fields[selectedFeed.title],
            slug: item.fields[selectedFeed.slug],
            base_url: selectedFeed.website,
            status: 'unpublished',
            caption: removeMd(item.fields[selectedFeed.text]),
            publishedDate: item.fields[selectedFeed.publishedDate],
            type:selectedFeed.postType,
            platform_account:{
              external_account_id:selectedFeed.facebook_page_id
            },
            usePreview: false
          })
        }

        const checkedPosts = checkCalendarEventsDuplicate(posts)
        setPosts(checkedPosts)
      }else if (selectedFeed.CMSType === 'wordpress'){

        let date = moment(dateFilter).format('YYYY-MM-DD')+'T00:00:00';

        const wpapiUrl = 'https://' + selectedFeed.website + '/wp-json'

        const wp = new WPAPI({
            endpoint: wpapiUrl,
            username: selectedFeed.editor,
            password: selectedFeed.password,
        });


        const response = await wp.posts()
          .embed()
          .perPage(100)
          .after(start)
          .before(end)
          .orderby('date')
          .order('desc')
          .get()

          if (response.length === 0){
            setNoPosts(true)
            return
          }

        function multiIndex(obj,is) {  // obj,['1','2','3'] -> ((obj['1'])['2'])['3']
            return is.length ? multiIndex(obj[is[0]],is.slice(1)) : obj
        }
        function pathIndex(obj,is) {   // obj,'1.2.3' -> multiIndex(obj,['1','2','3'])
            return multiIndex(obj,is.split('.'))
        }

        const posts = []

        for (const item of response) {
          const urlString = item._embedded['wp:featuredmedia'][0].source_url;
          const url = new URL(urlString);
          const fileName = url.pathname.split('/').pop();
          const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");

          posts.push({
            id : item.id.toString(),
            scheduleDate: pathIndex(item, selectedFeed.scheduleDate),
            link: item.slug? 'https://' + selectedFeed.website +'/' + item.slug : null,
            media: [
              {
                id:item._embedded && item._embedded['wp:featuredmedia'][0].id,
                file_url:(item._embedded && item._embedded['wp:featuredmedia'])? item._embedded['wp:featuredmedia'][0].source_url : null,
                file_description: (item._embedded && item._embedded['wp:featuredmedia'])? decodeEntities(item._embedded['wp:featuredmedia'][0].caption.rendered) : null,
                file_name: nameWithoutExtension,
                file_type: await getImageType(item._embedded['wp:featuredmedia'][0].source_url),
                source: 'external'
              }
            ],
            title: decodeEntities(item.title.rendered),
            slug: item.slug,
            base_url: selectedFeed.website,
            status: 'unpublished',
            caption: decodeCaptionEntities(item.content.rendered),
            publishedDate: item.date,
            type:selectedFeed.postType,
            platform_account:{
              external_account_id:selectedFeed.facebook_page_id
            },
            usePreview: true
          })
        }
        const checkedPosts = checkCalendarEventsDuplicate(posts)
        setPosts(checkedPosts)
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

      {posts.length>0&&
      <button className="btn btn-sm secondary" onClick={importEvents}>Import Events</button>
      }
      {/*}<button className="btn btn-sm secondary" onClick={checkEvents}>check Events</button>*/}

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        overflowY: 'scroll',
        overflowX: 'hidden',
        alignContent: 'flex-start',
        gap: '2%'
      }}>
        {noPosts &&
          <div className='alert alert-danger'>
            No Posts
          </div>
        }
        {posts.map((post, index)=>{
          return(
            <ExternalEvent key={post.id} data={post}/>
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
  deletePostCallBack,
  close,
  cal,
  scheduleCallBack
}) => {


  const {showFiles, setShowFiles, selectedFiles, setSelectedFiles, setFilePicker } = useFilesContext();
  const [scheduleDate, setScheduleDate] = useState(postData.start)
  const [publishDate, setPublishDate] = useState(postData?._def.extendedProps.publishDate??'')

  const [selectedSocialPages, setSelectedSocialPages] = useState([])
  const [socialPages, setSocialPages] = useState([])
  const [postLink, setPostLink] = useState(postData?._def.extendedProps.link?? '')
  const [caption, setCaption] = useState(postData?._def.extendedProps.caption?? '')
  const [title, setTitle] = useState(postData?.title??'')

  const [media, setMedia] = useState(postData?._def.extendedProps.media??[])
  const videoBlobRef = useRef(null)
  const [videoSrc, setVideoSrc] = useState(null)
  const [loader, setLoader] = useState(false)
  const [videoLoader, setVideoLoader] = useState(false)
  const [scheduled, setScheduled] = useState(false)
  const [postType, setPostType] = useState(postData?._def.extendedProps.type)
  const [status, setStatus] = useState(postData?._def.extendedProps?.status)
  const [postState, setPostState]= useState('SCHEDULE')
  const [buttonText, setButtonText]= useState('Schedule')
  //const [summary, setSummary]= useState(null)
  const [channelPreviews, setChannelPreviews]= useState([])
  const [selectedChannelPreview, setSelectedChannelPreview]= useState('')
  const [instagramMediaError, setInstagramMediaError] = useState(false)
  const [instagramCaptionError, setInstagramCaptionError] = useState(false)

  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [customCaptions, setCustomCaptions] = useState([])
  const [customCaptionsToggle, setCustomCaptionsToggle] = useState(false)
  const [isInstagram, setIsInstagram] = useState(false)
  const updateImages = useRef(false)


    useEffect(()=>{

    if (media.length > 1){
      console.log('media updated', media)
    }

    },[media])

    const isOneSignal = postData?._def?.extendedProps?.platform_account?.platform === 'One Signal'
    const isFacebook = postData?._def?.extendedProps?.platform_account?.platform === 'facebook'
    const postId = postData?._def.extendedProps?.metaData?.post_id




  const getPostInfo = async () => {





if (postData?._def?.extendedProps?.platform_account?.platform === "facebook"){

    const postId = postData?._def?.extendedProps?.metaData?.post_id
    const channelId = postData?._def?.extendedProps?.platform_account?.id

    const facebookResponse = await fetch(`/api/facebook/get-post-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId:channelId,
          postId:postId,
        }),
      })

      if (!facebookResponse.ok) {
        showError(`get facebook info failed: ${facebookResponse.status}`)
      }

      const facebookResponseJson = await facebookResponse.json();

}

  if (postData?._def?.extendedProps?.platform_account?.platform === "One Signal"){

    const postId = postData?._def?.extendedProps?.metaData?.notification_id
    const channelId = postData?._def?.extendedProps?.platform_account?.id

    const onesignalResponse = await fetch(`/api/one-signal/get-notification-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId:channelId,
          notificationId:postId,
        }),
      })

      if (!onesignalResponse.ok) {
        showError(`get facebook info failed: ${facebookResponse.status}`)
      }

      const onesignalResponseJson = await onesignalResponse.json();

  }


  }


  const updatePost = async () => {

    if (postData?._def?.extendedProps?.platform_account?.platform === "facebook"){

      const channelId = postData?._def?.extendedProps?.platform_account?.id

      let endPoint

      if (postType === 'video_reels'){
        endPoint = postData?._def.extendedProps?.metaData?.post_id
      }else if (postType === 'text' || postType === 'carousel' || postType === 'link') {
        endPoint = postData?._def.extendedProps?.metaData?.post_id
      }else if (postType === 'photos') {
        endPoint = `${socialId}_${postData?._def.extendedProps?.metaData?.post_id}`
      }

      const scheduledPublishTime = (moment(scheduleDate).unix())
      //const endPoint = getFacebookPostEndpoint(postType)
      const data = getFacebookPostDataUpdate(postType)

      if (status === 'scheduled'){
        data.scheduled_publish_time = scheduledPublishTime
        data.published = false
      }else{
        data.published = true
      }

      const facebookResponse = await fetch(`/api/facebook/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channelId:channelId,
            postData:data,
            endPoint:endPoint
          }),
        })

        if (!facebookResponse.ok) {
          setLoader(false)
          showError(`Upload to facebook failed with status: ${facebookResponse.status}`)
          return
        }

        showSuccess('Post Updated')
    }

    if (postData?._def?.extendedProps?.platform_account?.platform === "instagram"){
          //
    }

    if (postData?._def?.extendedProps?.platform_account?.platform === "One Signal"){
      return
    }


    updatePostOnDatabase()


  }


  const updatePostOnDatabase = async() => {


    const publicationId = postData?._def?.extendedProps?.database_info?.post_publications_id

    const scheduledAtUTC = new Date(scheduleDate).toISOString()
    const publishedAtUTC = new Date(publishDate).toISOString()


    const calendarApi = cal.current.getApi()

    let currentEvent = calendarApi.getEventById(postData.id);

    const newMetadata = {
      "post_id": currentEvent?._def?.extendedProps?.metaData.post_id,
      "id":currentEvent?._def?.extendedProps?.metaData.post_id,
      "post_data": {
        "event_id": currentEvent.id,
        "scheduleDate": scheduledAtUTC,
        "link": currentEvent?._def?.extendedProps?.link,
        "media": media,
        "slug": currentEvent?._def?.extendedProps?.slug,
        "base_url": currentEvent?._def?.extendedProps?.base_url,
        "status": status,
        "caption": caption,
        "publishedDate": currentEvent?._def?.extendedProps?.publishedDate,
        "type": postType,
        "platform_account": currentEvent?._def?.extendedProps?.platform_account,
        "usePreview": currentEvent?._def?.extendedProps?.usePreview
      },
    }

    if (publicationId){
      await updatePostPublication(
        publicationId,
        {
        scheduled_at:scheduledAtUTC,
        published_at:publishedAtUTC??'',
        caption:caption,
        title:title,
        type:postType,
        status:status,
        meta_data:newMetadata
      })
    }

  }





  const type = postData._def.extendedProps.type

  const onChannelPreviewChange = (channel) => {
    setSelectedChannelPreview(channel)
  }

  const handlePostTypeChange = (event) => {
    setPostType(event.target.value)
  };

  useEffect(()=>{

    if (postData?._def.extendedProps.type){

      setPostType(postData?._def.extendedProps.type)
    }

  },[postData])





  const handlePostStateChange = (event) => {
    setPostState(event.target.value);
    if (event.target.value === 'SCHEDULE'){
      setButtonText('Schedule')
    }else if (event.target.value === 'PUBLISH'){
      setButtonText('Publish Now')
    }else{
      setButtonText('Save Draft')
    }
  };


  const channelSelectorCallback = (pages) => {


    setSelectedSocialPages(pages)

    // get unique vales

    const uniqueChannels = [...new Set(pages.map(item => item.platform))];

    setChannelPreviews(uniqueChannels)

    if (uniqueChannels.length ===0){
      setSelectedChannelPreview('')
    }

    if (uniqueChannels.length>0 && !selectedChannelPreview){
      setSelectedChannelPreview(uniqueChannels[0])
    }




  }

  const scheduleMultiple = async(status) => {

        try{

          setLoader(true)

          if (timeTravel(scheduleDate) && postState === 'SCHEDULE'){
            showError('No Time Travel')
            return
          }


               const savedPost = await savePost({
                 user_id:userId,
                 caption:caption,
                 title:postData.title,
                 type:postType,
                 meta_data:{
                   event_id:postData.id,
                   data:postData._def.extendedProps
                 }
               })

             const scheduledAtUTC = new Date(scheduleDate).toISOString()

             const publications = selectedSocialPages.map((acc) => {

               let captionData = caption

               if (customCaptionsToggle){
                 const findCaption = customCaptions.find((cap)=>cap.id === acc.id)

                 if (findCaption){
                   captionData = findCaption.caption
                 }
               }

               return{
                 post_id:savedPost.id,
                 platform_id: acc.id,
                 scheduled_at: scheduledAtUTC,
                 platform:acc.platform,
                 status: status,
                 caption:captionData,
                 title:title,
                 type:(acc.platform==='instagram' && postType==='link')?'photos':postType,
                 user_id:userId,
                 meta_data:{
                   post_data:{ event_id:postData.id, ...postData._def.extendedProps}
                 }
               }
           })

             const savedPostPublications = await savePostPublications(publications)

             let savedMedia = []

             for (const savedPostPublication of savedPostPublications) {
                for (const file of media) {
                  const fileId = file.source === 'external'
                    ? (
                        await storeFileInfo({
                          user_id: userId,
                          file_url: file.file_url,
                          file_type: file.file_type,
                          file_name: file.file_name,
                          file_description: file.file_description ?? null
                        })
                      ).id
                    : file.id

                  const newMedia = await savePostFile({
                    file_id: fileId,
                    usage_type: postType,
                    post_id:savedPost.id,
                    post_publication_id: savedPostPublication.id
                  })

                  savedMedia.push(newMedia)

                  console.log('savedMedia', savedMedia)

                }
              }


             const savedPostPublicationsFacebook = savedPostPublications.filter((publication)=>publication.platform === 'facebook')

             const savedPostPublicationsOneSignal = savedPostPublications.filter((publication)=>publication.platform === 'One Signal')

             console.log('postState', postState)

             if (postState === 'PUBLISH'){
               const savedPostPublicationsInstagram = savedPostPublications.filter((publication)=>publication.platform === 'instagram')


              for (const publication of savedPostPublicationsInstagram) {

                const channel = socialPages.find((social)=> social.id === publication.platform_id)

                await instagramPublish(
                  channel,
                  publication,
                  savedMedia
                )
               }
             }



             for (const publication of savedPostPublicationsFacebook) {
               const channel = socialPages.find((social)=> social.id === publication.platform_id)

               await facebookSchedule(
                 channel,
                 publication
               )
             }

              for (const publication of savedPostPublicationsOneSignal) {

                const channel = socialPages.find((social)=> social.id === publication.platform_id)

                  await onesignalSchedule(
                    channel,
                    publication
                  )
              }

              scheduleCallBack(postData, 'scheduled', savedPostPublications)

              setLoader(false)
              showSuccess('All Posts Scheduled')
              close(null)


        }catch(error){
          console.log('error', error)
          showError(error)
          setLoader(false)

        }


  }

  const getFacebookPostEndpoint = (postType) => {


    switch (postType) {
      case 'text':
      case 'link':
      case 'carousel':
        return 'feed'
        break;
      case 'photos':
        //return 'photos'
        return 'feed'
        break;
      case 'video':
        return 'videos'
        break;
      case 'photo_stories':
        return 'photo_stories'
        break;
      case 'video_reels':
        return 'video_reels'
        break;
      default:
        return null
    }

}




const getFacebookPostDataSchedule = async (postType, publication, channel) => {
  switch (postType) {
    case 'text':
      return {
        message: publication.caption,
      }

    case 'link':
    case 'carousel':
      return {
        message: publication.caption + '\n\n' + `Full story here: ${postLink}`,
        link: postLink,
      }

    case 'photos':

      const idArrays = []

      for (const file of media) {

        const facebookResponse = await fetch(`/api/facebook/upload-photo`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              channelId: channel.id,
              endPoint: 'photos',
              file : file,
              published : false
            }),
          })

          const postResponseJson = await facebookResponse.json();

          idArrays.push(postResponseJson.id)

      }

      const attached_media = idArrays.map(id => ({
        media_fbid: id
      }));

      const payload = {
        message: publication.caption,
        //published: false,
        //unpublished_content_type: 'SCHEDULED',
        attached_media
      };

      if (postState === 'SCHEDULE'){
        payload.published = false
        payload.unpublished_content_type = 'SCHEDULED'

      }else if (postState === 'PUBLISH'){
        payload.published = true
      }

      return payload

    case 'video':
      return {
        description: publication.caption,
        file_url: videoUrlState,
      }

    case 'photo_stories':
      return {
        link: postLink,
        photo_id: media[0].file_url,
      }

    case 'video_reels':

        const formData = new FormData();
        formData.append('fileUrl', media[0].file_url);
        formData.append('channelId', channel.id);

        const response = await fetch('/api/facebook/upload-facebook-reel', {
          method: 'POST',
          body: formData,
        });
        // Ensure the response is successful
        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`);
        }

        const uploadedVideo = await response.json();

        if (!uploadedVideo) return

        const videoId = uploadedVideo.videoId;

        let video_state = 'SCHEDULED'
        if (postState === 'PUBLISH'){
          video_state = 'PUBLISHED'
        }

        let description = publication.caption

        if (postLink){
          description = publication.caption + '\n\n' + `Full story here: ${postLink}`
        }

      return {
        video_id: videoId,
        upload_phase: 'finish',
        video_state: video_state,
        description: description,
        title: title
      }

    default:
      return null
  }
}

const getFacebookPostDataUpdate = (postType) => {
  switch (postType) {
    case 'text':
      return {
        message: caption,
      }

    case 'link':
    case 'carousel':
      return {
        message: caption,
        link: postLink,
      }

    case 'photos':
      return {
        message: caption,
        url: media[0].file_url,
      }

    case 'video':
      return {
        description: caption,
        file_url: videoUrlState,
      }

    case 'photo_stories':
      return {
        link: postLink,
        photo_id: media[0].file_url,
      }

    case 'video_reels':
      return {
        description:caption,
        title: postData.title
      }

    default:
      return null
  }
}

const onesignalSchedule = async(
  channel,
  publication,
) => {


        let data

        let dateString = moment(scheduleDate).format("YYYY-MM-DD HH:mm:ss")
        if (channel.metadata.gmt.startsWith("-")){
          dateString = dateString+' GMT'+channel.metadata.gmt
        }else{
          dateString = dateString+' GMT'+'+'+channel.metadata.gmt
        }

        if (channel.metadata.push_platform === 'web'){
          data = {
            "app_id" : channel.external_account_id,
            "headings" :  {"en": title},
            "contents": {"en": publication.caption},
            "included_segments" : ["Subscribed Users"],
            "url" : postLink,
            "chrome_web_image" : media[0].file_url,
            "send_after" : dateString
          }
        }else if (channel.metadata.push_platform === 'mobile'){
            data = {
              "app_id" : channel.external_account_id,
              "headings" :  {"en": title},
              "contents": {"en": publication.caption},
              "included_segments" : ["Subscribed Users"],
              "send_after" : dateString,
              "big_picture" : media[0].file_url,
              //"big_picture" : imgUrlState? imgUrlState: null,
              "data" : postData?._def.extendedProps.slug? {
                "slug" : postData?._def.extendedProps.slug
              } : null,
              'ios_badgeType' : "SetTo",
              'ios_badgeCount' : 1
            }
        }


        const onesignalResponse = await fetch('/api/one-signal/schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              channelId : channel.id,
              data:data
            }),
        });

        if (!onesignalResponse.ok) {
          setLoader(false)
          showError(`Failed to schedule One Signal: ${onesignalResponse.status}`)
        }

        const onesignalResponseJson = await onesignalResponse.json();
        const notificationId = onesignalResponseJson?.id

        if (!notificationId){
          notifyError('error Scheduling')
          return
        }


        const updateData  = {
          status: 'scheduled',
          meta_data:{
            notification_id:notificationId,
            post_data:publication.meta_data.post_data,
            ...onesignalResponseJson
          }
        }

        if (postState === 'PUBLISH'){
          updateData.published_at = new Date().toISOString()
          updateData.status = 'published'
        }

        console.log('updateData', updateData)


        await updatePostPublication(publication.id, updateData)

        showSuccess('One Signal Post Scheduled')


}


const instagramPublish = async (
  channel,
  publication,
  savedMedia
) => {
  try{

    publication.media = media

    const instagramResponse = await fetch(`/api/instagram/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: channel.id,
          publication:publication
        }),
      })

      if (!instagramResponse.ok) {
        setLoader(false)
        showError(`Upload to facebook failed with status: ${facebookResponse.status}`)
        return
      }
    showSuccess('Instgram Post Published')
    const postResponseJson = await instagramResponse.json();

    const postId = postResponseJson.id

    const updateData  = {
      status: 'published',
      meta_data:{
        post_id:postId,
        post_data:publication.meta_data.post_data,
        ...postResponseJson
      },
      published_at : new Date().toISOString()
    }

    await updatePostPublication(publication.id, updateData)
  }catch(error){
    console.log(error)
    showError(`Facebook error: ${error}`)
    setLoader(false)
  }
}

  const facebookSchedule = async (
    channel,
    publication,
  ) => {


    if (timeTravel(scheduleDate) && postState === 'SCHEDULE'){
      showError('No Time Travel')
      setLoader(false)
      return
    }


    const scheduledPublishTime = (moment(scheduleDate).unix())
    const endPoint = getFacebookPostEndpoint(postType)
    const data = await getFacebookPostDataSchedule(postType, publication, channel)

    if (!endPoint || !data){
      showError('no end point or data')
      return
    }

    if (postState === 'SCHEDULE'){
      data.scheduled_publish_time = scheduledPublishTime
      data.published = false

    }else if (postState === 'PUBLISH'){
      data.published = true
    }


    try{

      const facebookResponse = await fetch(`/api/facebook/schedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channelId: channel.id,
            postData:data,
            endPoint:endPoint
          }),
        })

        if (!facebookResponse.ok) {
          setLoader(false)
          showError(`Upload to facebook failed with status: ${facebookResponse.status}`)
          return
        }
      showSuccess('Post Scheduled')
      const postResponseJson = await facebookResponse.json();
      const postId = postResponseJson.id
      const postResponseData = postResponseJson.data

      const facebookCommentResponse = await fetch(`/api/facebook/add-comment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId: postId,
            postLink:postLink,
            channelId: channel.id,
          }),
        })

      if (!facebookCommentResponse.ok) {
        setLoader(false)
        showError(`Upload to add facebook comment: ${facebookResponse.status}`)
        return
      }

      showSuccess('Comment Added')

      let status

      const updateData  = {
        status: 'scheduled',
        meta_data:{
          post_id:postId,
          post_data:publication.meta_data.post_data,
          ...postResponseJson
        },
      }

      if (postState === 'PUBLISH'){
        updateData.published_at = new Date().toISOString()
        updateData.status = 'published'
      }


      await updatePostPublication(publication.id, updateData)
    }catch(error){
      console.log(error)
      showError(`Facebook error: ${error}`)
      setLoader(false)
    }
  }



  const updateEvent = (updateData, id) =>{
    const calendarApi = cal.current.getApi()

    let currentEvent = calendarApi.getEventById(id);

    const newProps = {...postData._def.extendedProps, ...updateData }



    /*

    currentEvent.mutate({
        extendedProps: newProps
    })*/

    setCalendarEvents(prev =>
        prev.map(event =>
          event.id === id
            ? {
                ...event,
                extendedProps: {
                  ...event.extendedProps,
                  ...newProps
                }
              }
            : event
        )
      );


  }






  const updateScheduledEvent = (updateData, id) =>{
    const calendarApi = cal.current.getApi()

    let currentEvent = calendarApi.getEventById(id);

    const newProps = {...postData._def.extendedProps, ...updateData }

    /*

    currentEvent.mutate({
        extendedProps: newProps
    })*/

    setCalendarEvents(prev =>
        prev.map(event =>
          event.id === id
            ? {
                ...event,
                extendedProps: {
                  ...event.extendedProps,
                  ...newProps
                }
              }
            : event
        )
      );


  }


  const deletePostDatabase = async() =>{
      setLoader(true)
      await deletePostCallBack(postData)
      setLoader(false)
      close(null)
  }

  const lookUpPost = async() => {

    const channelId = postData._def.extendedProps.platform_account.id
    const id = postData?._def.extendedProps?.metaData?.post_id

    const facebookesponse = await fetch(`/api/facebook/look-up-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId:channelId,
          postId:id
        }),
      })
  }

const createCaption = () => {
  let newCaption = caption + '\n'

  media.forEach(function(image, index) {
    if (image.file_description){
      newCaption = newCaption +'\n'+'Image '+(index+1)+': '+image.file_description+'\n'
    }
  });

  setCaption(newCaption)
  setUnsavedChanges(true)

}



  useEffect(() => {
    if (!showFiles && selectedFiles.length > 0) {

      if (media.length === 1){
        console.log('showFiles && selectedFiles.length > 0 setMedia', media)

      }


        setMedia(prev => [...selectedFiles, ...media])
        setSelectedFiles([])
    }

  }, [showFiles, selectedFiles]);

  return(
    <>
      <div className={'loader_screen'} style={{zIndex:3}} onClick={() => close(null)}></div>
      <div className='share-dialog dropshadow' style={{zIndex:4}}>
        <X
          onClick={() => close(null)}
          className="close-icon"
          style={{
            cursor: "pointer",
            right: "20px",
            position: "absolute",
            top: "5px",
            zIndex: '10'
          }}
        />
        <div style={loader? {display:'block'}:{display:'none'}} className={'loader_screen'}>
            <div style={{transform:'translate(-50%, -50%)'}}  className="loader"></div>
        </div>
          <div className='col-2' style={{height:'100%'}}>
            <div className='col' style={{position:'relative', overflowY: 'scroll', padding: '15px', flex:3}}>

              <h2>Share To Social Media</h2>
              <hr/>

              {postData._def.extendedProps.error&&
                <div style={{
                  background: 'var(--md-sys-color-error)',
                  color:'#ffffff',
                  padding:'10px',
                  borderRadius: '10px',
                  marginTop:'15px'
                }}>
                  {postData._def.extendedProps.error}
                </div>
              }

              {((isFacebook || isOneSignal) && !postId)?
                  (
                    <div style={{
                      background: 'var(--md-sys-color-error)',
                      color:'#ffffff',
                      padding:'10px',
                      borderRadius: '10px',
                      marginTop:'15px',
                      marginBottom:'15px',
                    }}>
                      There was an error scheduling this post
                    </div>
                ):(
                  <>
                    {status&&
                      <div className="scheduled_badge">
                        <strong>{capitilise(status)}</strong>
                        <CircleCheck />
                      </div>
                    }
                  </>
                )
              }

              <ChannelSelector
                userId={userId}
                postInfo={postData}
                setSocialPagesParent={setSocialPages}
                callback={channelSelectorCallback}
                disabled={postData?._def.extendedProps?.database_info?.post_publications_id}
              />
              {postData.title !== 'null'&&
                <h4>{postData.title}</h4>
              }

              <div className="properties-container" style={{margin:'15px 0px'}}>
                <p className='label' style={{paddingLeft:'10px'}}>Post Type</p>
                <div style={{display:'flex', alignItems:'center'}}>
                  <div style={{display:'flex', alignItems:'center'}}>
                    <Radio
                      style={{marginRight:'0px'}}
                      type="radio"
                      value="text"
                      checked={postType === 'text'}
                      onChange={handlePostTypeChange}
                      disabled={postData?._def.extendedProps?.database_info?.post_publications_id}
                    /><span style={{fontSize:'.9em'}}>Text</span>
                  </div>
                  <div style={{display:'flex', alignItems:'center'}}>
                    <Radio
                      style={{marginLeft:'10px', marginRight:'0px'}}
                      type="radio"
                      value="video_reels"
                      checked={postType === 'video_reels'}
                      onChange={handlePostTypeChange}
                      disabled={postData?._def.extendedProps?.database_info?.post_publications_id}
                    /><span style={{fontSize:'.9em'}}>Reel</span>
                  </div>
                  <div style={{display:'flex', alignItems:'center'}}>
                    <Radio
                      style={{marginLeft:'10px', marginRight:'0px'}}
                      type="radio"
                      value="link"
                      checked={postType === 'link'}
                      onChange={handlePostTypeChange}
                      disabled={postData?._def.extendedProps?.database_info?.post_publications_id}
                    /><span style={{fontSize:'.9em'}}>Link</span>
                  </div>
                  <div style={{display:'flex', alignItems:'center'}}>
                    <Radio
                      style={{marginLeft:'10px', marginRight:'0px'}}
                      type="radio"
                      value="photos"
                      checked={postType === 'photos'}
                      onChange={handlePostTypeChange}
                      disabled={postData?._def.extendedProps?.database_info?.post_publications_id}
                    /><span style={{fontSize:'.9em'}}>Photos</span>
                  </div>
                </div>
              </div>


              {(postType === 'photos' || postType === 'video_reels' || isInstagram)&&

                <div className="properties-container" style={{margin:'15px 0px'}}>
                  <p className='label'>Media</p>
                  <button className="btn secondary btn-sm" onClick={() => {
                    setSelectedFiles([])
                    setFilePicker(true)
                    setShowFiles(prevState => !prevState)
                  }}>Add Files</button>
                  <MediaList
                    key={postData.id}
                    postType={postType}
                    userId={userId}
                    media={media}
                    setMedia={setMedia}
                    channelPreviews={channelPreviews}
                    setInstagramError={setInstagramMediaError}
                  />

                </div>
              }

            {postType === 'link' &&
              <div className="properties-container" style={{margin:'15px 0px'}}>
                <p className='label'>Post Link</p>
                <div className={'form-input'} style={{display:'flex', alignItems:'center', padding: '0px 5px 0px 0px'}}>
                  <input
                    id="post-link-share"
                    style={{border:0, margin: '1px'}}
                    value={postLink}
                    onChange={(e) => setPostLink(e.target.value)}
                    className={'form-input'}
                  />
                  <a href={postLink} target="new-window" style={{height: '24px'}}>
                    <ExternalLink/>
                  </a>
                </div>
              </div>
            }
            <Caption
              caption={caption}
              setCaption={setCaption}
              customCaptions={customCaptions}
              setCustomCaptions={setCustomCaptions}
              customCaptionsToggle={customCaptionsToggle}
              setCustomCaptionsToggle={setCustomCaptionsToggle}
              selectedSocialPages={selectedSocialPages}
              setIsInstagram={setIsInstagram}
              isInstagram={isInstagram}
              instagramCaptionError={instagramCaptionError}
              setInstagramCaptionError={setInstagramCaptionError}
            />

              <button
                style={{marginRight: '10px', marginTop:'0px'}}
                className="btn primary btn-sm"
                onClick={()=>createCaption()}
                >Add Image Captions
              </button>
              <Summary text={caption} defaultPlatform={selectedChannelPreview}/>
              <div className="properties-container" style={{margin:'15px 0px'}}>
                <p className='label'>Schedule Date & Time</p>
                <div style={{margin:'10px 0px 5px 0px', display:'flex', gap:'10px'}}>
                  <div style={{display:'flex', alignItems:'center'}}>
                    <Radio
                      style={{marginRight:'0px'}}
                      type="radio"
                      value="SCHEDULE"
                      checked={postState === 'SCHEDULE'}
                      onChange={handlePostStateChange}
                      disabled={status === 'published'}
                    /><strong style={{fontSize:'.9em'}}>Schedule</strong>
                  </div>
                  <div style={{display:'flex', alignItems:'center'}}>
                    <Radio
                      style={{marginRight:'0px'}}
                      type="radio"
                      value="PUBLISH"
                      checked={postState === 'PUBLISH'}
                      onChange={handlePostStateChange}
                      disabled={status === 'published'}
                    /><strong style={{fontSize:'.9em'}}>Publish Now</strong>
                  </div>
                  <div style={{display:'flex', alignItems:'center', marginLeft: 'auto', display:'none'}}>
                    <input
                      style={{marginRight:'5px'}}
                      type="radio"
                      value="DRAFT"
                      checked={postState === 'DRAFT'}
                      onChange={handlePostStateChange}
                      disabled={status === 'published'}
                    /><span style={{fontSize:'.9em'}}>Set as draft</span>
                  </div>
                </div>
                {postState === 'SCHEDULE' &&
                  <DatePicker
                    style={{minWidth:'300px'}}
                    minDate={moment().toDate()}
                    minTime={calculateMinTime(scheduleDate)}
                    maxTime={moment().endOf('day').toDate()}
                    selected={scheduleDate}
                    onChange={(date) => setScheduleDate(date)}
                    showTimeSelect
                    className={'form-input'}
                    dateFormat="MMMM d, yyyy h:mm aa"
                  />
                }
                {instagramMediaError &&
                  <p>instagram Error</p>
                }
              </div>
              {(selectedSocialPages.length>0) &&
                <button
                  style={{marginLeft:'10px'}}
                  disabled={(status === 'published' || status === 'scheduled') || (isInstagram && instagramCaptionError) || (isInstagram && instagramMediaError) || (!postType)}
                  className="btn primary"
                  onClick={() => scheduleMultiple('scheduled')}>{buttonText}

                </button>
              }

              {postData?._def?.extendedProps?.database_info?.post_publications_id &&
                <>
                <button style={{marginLeft:'10px'}} className="btn danger" onClick={deletePostDatabase}>Delete Post</button>
                <button style={{marginLeft:'10px'}} className="btn secondary" onClick={getPostInfo}>Get Post Info</button>
                {postData?._def?.extendedProps?.platform_account?.platform !== "One Signal" &&
                  <button
                    style={{marginLeft:'10px'}}
                    className="btn primary"
                    onClick={() => updatePost()}>Update Post
                  </button>
                }
              </>
              }

            {/*}<button onClick={lookUpPost}>Look Up Post</button>*/}

            </div>
            <div className='col' style={{
              flex:2,
              position: 'relative',
              overflowY: 'scroll',
              padding: '30px 15px 10px 15px',
              backgroundColor: 'var(--md-sys-color-surface-container)'
            }}>
              {channelPreviews.length===0?(
                <div className='alert alert-danger' >
                  Please pick at least one channel
                </div>
                ):(
                  <>
                    <p>{selectedChannelPreview}</p>
                  {selectedChannelPreview && channelPreviews.length>0 &&
                    <select id="channel-select" className="form-input select" onChange={(e) => onChannelPreviewChange(e.target.value)} value={selectedChannelPreview}>
                      {channelPreviews.map((channel, index)=>{
                        return <option key={index} value={channel}>{channel}</option>
                      })
                      }
                    </select>
                  }

                    {(postType=== 'link' && selectedChannelPreview === 'facebook') &&
                      <>
                        <p>Facebook Link Preview</p>
                        <FacebookLinkPreview
                          url={postLink}
                          postData={postData}
                          caption={caption}
                          selectedSocialPages={selectedSocialPages}
                        />
                      </>
                    }
                    {(postType === 'video_reels' && media[0]?.file_type === "video/mp4") &&
                      <div className="video-container">
                        <video
                          src={media[0]?.file_url}
                          controls // Adds play, pause, etc. controls
                          className='video'
                          // poster="thumbnail.jpg" // Optional: specify a placeholder image
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    }
                    {postType === 'link' &&  selectedChannelPreview === 'instagram' &&
                      <>
                        <p>Instagram Link Preview</p>
                        <InstagramLinkPreview
                          image={media[0]?.file_url}
                          postData={postData}
                          caption={caption}
                        />
                      </>
                    }
                    {postType === 'photos' &&  selectedChannelPreview === 'instagram' &&
                      <>
                        <p>Instagram Photos Preview</p>
                        <InstagramPhotosPreview media={media} />
                      </>
                    }

                    {postType === 'photos' && selectedChannelPreview === 'facebook' &&
                      <>
                        <p>Facebook Photos Preview</p>
                        <FacebookPhotosPreview media={media}/>
                      </>
                    }

                  </>
                )
              }
            </div>
        </div>
      </div>
    </>
  )
}

const FacebookLinkPreview = ({
  url,
  postData,
  caption,
  selectedSocialPages
}) => {
  const [openGraph, setOpenGraph] = useState(null)
  const [openGraphError, setOpenGraphError] = useState(null)
  const hasRun = useRef(false);

  console.log('url', url)

const getOpenGraph = async () => {
  try {

    const response = await fetch('/api/open-graph', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url : url}),
    });

    if (!response.ok) {
      if (response.status === 500) {

        return showError(response.status);
      }
      return showError(response.status);
    }

    const data = await response.json();

    const isEmpty = Object.keys(data).length === 0;

    if (isEmpty) return

    const openGraphData = {
      ogTitle: data.result.ogTitle,
      ogType: data.result.ogType,
      ogUrl: data.result.ogUrl,
      ogDescription: data.result.ogDescription,
      ogImage: data.result.ogImage[0].url
    }

    setOpenGraph(openGraphData)

  } catch(error) {
    // Consider implementing your own error handling logic here
    setOpenGraph(null)

    return showError(error.message);
  }
  finally {
    //setLoader(false)
  }
}

const noPreview = () => {

  setOpenGraph({
    ogTitle: postData?._def?.extendedProps?.title??null,
    ogUrl: postData?._def?.extendedProps?.link??null,
    ogDescription: postData?._def?.extendedProps?.caption??null,
    ogImage: postData?._def.extendedProps?.media[0]?.file_url??null
  })
}


useEffect(()=>{
  if (!hasRun.current && postData._def.extendedProps.usePreview) {
    getOpenGraph()
    hasRun.current = true; // Mark as run to prevent double execution in dev
  }else{
    noPreview()
  }
},[])

const refreshShareAttachment = async () => {

  if (!url){
    showError(`No Url`)
    return
  }

  const facebookAccounts = selectedSocialPages.filter((account)=>account.platform === 'facebook')

  const facebookResponse = await fetch(`/api/facebook/refresh-share-attachment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channelId:facebookAccounts[0].id,
        url:url
      }),
    })

    if (!facebookResponse.ok) {
      showError(`Error refreshing post on facebook: ${facebookResponse.status}`)
    }

    const facebookResponseJson = await facebookResponse.json();

    setOpenGraph({
      ogTitle: facebookResponseJson.data?.title??null,
      ogUrl: facebookResponseJson.data?.url??null,
      ogDescription: facebookResponseJson.data?.description??null,
      ogImage: facebookResponseJson.data?.image[0]?.url??null
    })


}

return(
    <div style={{marginTop:'25px'}}>
      <div
        style={{
          background:'#ffffff',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          padding:'10px',
          position:'relative'
        }}
      >

        <div style={{position:'absolute', right:'10px'}}>
          <ThreeDotMenu>
            {(selectedSocialPages.length > 0 && url) &&
              <button onClick={refreshShareAttachment} className='btn btn-sm'>Refresh Share Attachment</button>
            }
          </ThreeDotMenu>
        </div>
        <ReadMore maxCharacterCount={50}>
            {caption}
        </ReadMore>
      </div>
        <div style={{background:'#ffffff', borderRadius:'8px'}}>
          {(openGraph?.ogImage)?(
                <div className={`${'post-preview '}`} style={{paddingTop:'52.3%',
                  backgroundImage: `url(${openGraph.ogImage})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat'
                  }}>
                </div>
            ):(
              <div className={`${'post-preview '}`} style={{paddingTop:'52.3%'}}>
              <p style={{paddingLeft:'10px'}}>no OG Image</p>
              </div>
            )
          }
          <div style={{
            padding: '10px 12px',
            border: '0.5px solid #e3e3e3',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px'
          }}>
            <div className="facebook-preview-url">
            {openGraph?.ogUrl?(
              openGraph.ogUrl
            ):(
              `No Url`
            )

            }
            </div>
            <div className="facebook-preview-title">
              {openGraph?.ogTitle? openGraph.ogTitle : postData.title !== 'null'? postData.title:`No Title`}
            </div>
            {/*}
            <div className="facebook-preview-description">
              {openGraph?.description? openGraph.description: postData._def.extendedProps.description }
            </div>
            */}
          </div>
      </div>

    </div>
  )
}


const ThreeDotMenu = ({styles, children}) => {

  const [open, setOpen] = useState(false)


  return(
    <div style={{position:'relative'}}>
      <EllipsisVertical onClick={() => setOpen(prev => !prev)}/>
        {open &&
          <div style={{
            position:'absolute',
            marginTop: '5px',
            zIndex: '100',
            backgroundColor: '#ffffff',
            borderRadius:'var(--input-border-radius)',
            padding:'10px',
            right: '100%',
            minWidth: '220px'
          }} className='dropshadow'>
            {children}
          </div>
        }
    </div>
  )

}

const InstagramLinkPreview = ({
  image,
  caption

})=>{

  return(
    <div style={{background:'#ffffff'}}>
      <img src={image} style={{width:'100%'}}/>
      <div style={{padding:'10px'}}>
        <ReadMore maxCharacterCount={50}>
          {caption}
        </ReadMore>
      </div>
    </div>

  )

}


const ReadMore = ({ children, maxCharacterCount = 100 }) => {
  const text = children;
  const [isExpanded, setIsExpanded] = useState(false);

  // If text is shorter than the limit, just show it all
  if (text.length <= maxCharacterCount) {
    return <p>{text}</p>;
  }

  return (
    <p style={{
      fontSize: '.9375rem',
      fontWeight: '400',
      whiteSpace: 'pre-wrap',
      margin: '5px 0px 5px 0px',
      overflowWrap: 'breakWord',
    }}>
      {isExpanded ? text : `${text.substring(0, maxCharacterCount)}...`}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          fontSize: '.9375rem',
          cursor: 'pointer',
          border: 'none',
          background: 'none',
          marginLeft: '5px',
          fontWeight: '600',
        }}
      >
        {isExpanded ? 'Show Less' : 'Read More'}
      </button>
    </p>
  );
};

const MediaList = ({
  postType,
  userId,
  media,
  setMedia,
  channelPreviews,
  setInstagramError
}) => {
  const { displayEditItem, setDisplayEditItem, item, setItem, setActiveTool} = useEditItemContext();

    //const [files, setFiles] = useState(media)
    const editingIndex = useRef(null)
    const editImageRef = useRef(null)
    const editImageData = useRef(null)
     const evtSourceRef = useRef(null);


    const editMedia = (media, index, tool) => {
      setActiveTool(tool)
      setDisplayEditItem(true)
      editingIndex.current = index
      setItem(media)
    }

    const handleReplace = (index, newItem) => {

      if (media.length === 1){
        console.log('setMedia handleReplace', media)

      }


      item.source = 'internal'
      setMedia(prevItems =>
        prevItems.map((item, i) => i === index ? newItem : item)
      );
    };

    useEffect(() => {
      if (!displayEditItem && item) {
          handleReplace(editingIndex.current, item)
      }

    }, [displayEditItem, item]);


    const changeSortableState = (newState) => {
      if (media.length === 1){
        console.log('setMedia changeSortableState', media)
      }

      setMedia(newState)
    }

    const checkInstagramImages = async (images) => {

        let errorArray = []

         const checkedImages = await Promise.all(images.map(async(image) => {
           let carouselImageError = await checkImageSize(image.file_url)
           if (carouselImageError){
             showError('Instagram Image Size Error')
           }
           var temp = Object.assign({}, image);
           temp.instagram_image_error = carouselImageError
           if (carouselImageError === true){
              errorArray.push(true)
           }
           return temp;
         }))

         if (media.length>1){
           console.log('media checkInstagramImages', media)
         }

         setMedia(checkedImages)


         if (errorArray.length > 0){
           setInstagramError(true)
         }else{
           setInstagramError(false)
         }
    }


    useEffect(()=>{
      const hasInstagram = channelPreviews.some(channel => channel.includes('instagram'));

      if (hasInstagram){
        checkInstagramImages(media)
      }else{
        setInstagramError(false)
      }

      //setFiles(media)

    },[media, channelPreviews])


    const removeImage = async (index) => {

      if (media.length>1){
        console.log('removeImage', media)
      }
      setMedia(prev => prev.filter((_, i) => i !== index));
      //setFiles(prev => prev.filter((_, i) => i !== index));
    }


    const checkIfImage = async (item, index) => {

      let fileType

      item

      if (item?.file_type){
        fileType = item?.file_type
      }else{
        fileType = await getImageType(item.file_url)



        if (media.length>1){
            console.log('checkIfImage setMedia', media)
        }


        setMedia(prev => prev.map((prev, i)=>{
            if (i === index){
              prev.file_type = fileType
            }
            return prev
        }))

      }
      return fileType === 'image/png' || fileType  === 'image/jpeg'
    }

    const startSSE = () => {
      if (evtSourceRef.current) return; // already running

      const evtSource = new EventSource('/api/events');
      evtSourceRef.current = evtSource;

      evtSource.onmessage = async (event) => {


        const updatedFile = getFileName(event.data);
        const currentFile = getFileName(editImageRef.current);

        if (updatedFile === currentFile) {

          const file = await fileFromServer(event.data);

          const formData = new FormData()
          formData.append('file', file)

          try{
            const res = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            })

            const result = await res.json()

            if (res.ok) {
              const fileInfo = await storeFileInfo({
                user_id:userId,
                file_url:result.url,
                file_type:file.type,
                file_name:file.name,
                file_description:editImageData.current.file_description??null
              })

              const newItem = {...fileInfo, source:'internal', chosen: editImageData.current.chosen}

              if (media.length === 1){
                console.log('media startSSE', media)
              }

              setMedia(prevItems =>
                prevItems.map((item, i) => item.id === editImageData.current.id ? newItem : item)
              );


            } else {
              console.log(result.error)
              showError(result.error)
            }
          }catch(error){
            console.log(error)
            showError('file upload error', error)
          }


        }
      };

      evtSource.onerror = () => {
        console.warn('SSE error, reconnecting next edit if needed.');
        evtSource.close();
        evtSourceRef.current = null; // allow future reconnect
      };
    };




    const editInPhotoshop = async (image) => {

        const res = await fetch('/api/edit-in-photoshop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image:image.file_url}),
        });

        const data = await res.json();

    if (data.publicUrl) {
        editImageRef.current = data.publicUrl
        editImageData.current = image
        startSSE();
      }
    }

//console.log('media', media)

  return(
    <ReactSortable
      list={media}
      setList={(newState) => changeSortableState(newState)}
      onDragOver={()=>onSortItems()}
      onDragStart={()=>onSortItems()}
      onDragEnd={()=>onSortItems()}
      >
  {media.map((item, index) => {
    const isVideo = item.file_type === "video/mp4" || item.file_url.match(/\.(mp4|mov|m4v)$/i);


        return(
            <div key={item.id}
              style={{
              display:'flex',
              alignItems: 'center',
              marginTop:'10px',
              background: 'var(--md-sys-color-surface-dim)',
              padding:'10px',
              borderRadius: '10px'
            }}>
              <GripVertical size={30} />
                <div style={{marginLeft:'10px'}}>
                  {(item.file_type === 'image/png' || item.file_type === 'image/jpeg')&&
                      <img style={{
                      width:50,
                      height:50,
                      objectFit:'cover',
                      borderRadius:'5px',
                      border: `${!item?.instagram_image_error?'5px solid var(--md-sys-color-surface-container)':'5px solid var(--md-sys-color-error)'}`
                    }}
                    src={item.file_url}/>
                  }
                  {(postType === 'video_reels' && item.file_type === 'video/mp4' || isVideo)&&
                    <video
                      src={item.file_url}
                      controls
                      autoPlay={false}
                      className="video_thumb_media_list"
                      playsInline
                    />
                  }

                </div>
              <div style={{marginLeft:'auto', height: '30px', display:'flex', alignItems:'center'}}>
                {(postType === 'photos' || postType === 'link' )&&
                  <>
                  <img onClick={() => editInPhotoshop(item)} src='/Adobe_Photoshop_CC_icon.png' style={{width:'28px', marginRight:'10px'}}/>
                  <Crop size={30} onClick={() => editMedia(item, index, 'crop')}/>
                </>
                }
                <SquarePen style={{marginLeft:'10px'}} size={30} onClick={() => editMedia(item, index, 'caption')}/>
                <Trash2 style={{marginLeft:'10px'}} size={30} onClick={() => removeImage(index)}/>
              </div>
            </div>
          )



     })
  }
  </ReactSortable>

  )
}

const InstagramImage = ({
  image,
  channelPreviews,
  setInstagramError
}) => {
  const [error, setError] = useState(false)
  const hasInstagram = channelPreviews.some(channel => channel.includes('instagram'));

  const checkImage = async() => {

    if (hasInstagram ){
        const imageCheck = await checkImageSize(image.file_url)
        if (imageCheck){
          setError(true)
          setInstagramError(true)
        }
    }

  }
useEffect(()=>{
  checkImage()
},[channelPreviews, image])

  return(
    <img style={{
    width:50,
    height:50,
    objectFit:'cover',
    borderRadius:'5px',
    border: `${!image?.instagram_image_error?'5px solid var(--md-sys-color-surface-container)':'5px solid var(--md-sys-color-error)'}`
  }}
  src={image.file_url}/>
  )
}

const FacebookPhotosPreview = ({media}) => {


    if (media.length>1){
      return(
        <div className="grid-container">
        {media.map((item, index)=>{
            return(
              <div key={index} className="grid-item">
                <img src={item.file_url}/>
              </div>
            )
          })}
        </div>

      )

    }else{
      return (
        <img src={media[0]?.file_url}/>
      )

    }

}


const InstagramPhotosPreview = ({media}) => {
    const [currentSlide, setCurrentSlide] = useState(0)


    const onCarouselChange = (args) => {
      //editCarouselImage(args)
      setCurrentSlide(args)
    };

    const getConfigurableProps = () => ({
      showArrows: true,
      showStatus: false,
      showIndicators: false,
      infiniteLoop: true,
      showThumbs: true,
      useKeyboardArrows: true,
      autoPlay: false,
      stopOnHover: true,
      swipeable: true,
      dynamicHeight: true,
      emulateTouch: true,
      autoFocus: false,
      selectedItem: 0,
      interval: 2000,
      transitionTime: 500,
      swipeScrollTolerance: 5,
      ariaLabel: 'ariaLabel',
    });


  return(
    <Carousel infiniteLoop {...getConfigurableProps()}
   //onClickItem={(e) => imageClick(e)}
     onChange={(args) => onCarouselChange(args)}
     showThumbs={false}
     selectedItem={currentSlide}
    >
    {media.map((item, index) => {
        return(
          <div>
            <img src={item.file_url} style={{width:'100%'}}/>
          </div>
        )
       })
    }
    </Carousel>
  )
}
