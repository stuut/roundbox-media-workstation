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
import { deletePostFiles } from "@/lib/supabase";
import { DateTime } from "luxon";
import { updatePostFilesSortOrder } from "@/lib/supabase"
import Checkbox from '@mui/material/Checkbox';
import {
  X,
  ExternalLink,
  CircleCheck,
  GripVertical,
  SquarePen,
  Trash2,
  Crop,
  EllipsisVertical,
  RefreshCcw
} from 'lucide-react';





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

export const Scheduler = ({user, feeds})=>{
  const [selectedFeed, setSelectedFeed] = useState(feeds[0])
  const [calendarEvents, setCalendarEvents] = useState([])
  const [dateFilter, setDateFilter] = useState(new Date());
  const [posts, setPosts] = useState([]);
  const [dragMedia, setDragMedia] = useState(null)
  const cal = useRef();
  const [postData, setPostData] = useState(null)
  const [selectedSocialPages, setSelectedSocialPages] = useState([])


  const [loader, setLoader] = useState(false)



  //const FEEDS = feeds


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

      const media = post?.post_files
      .sort((a, b) => a.sort_order - b.sort_order)
      .filter((media) => media.file_id)
      .map((media)=>{
          return {
            source: 'internal',
            database_id:media.id,
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
        schedule_date: post?.scheduled_at,
        published_at: post?.published_at??null,
        link: post?.link??null,
        slug: post?.slug??null,
        base_url: post?.base_url??null,
        status: status??null,
        type:post?.type??'',
        media: media??null,
        error: post?.last_error??'',
        database_info:{
          post_publications_id:post.id,
        },
        meta_data: post?.meta_data,
        platform_account:post?.platform_account,

      }
    })

    setCalendarEvents(prev => [...prev, ...newPosts]);

    // remove event
    setCalendarEvents(prev => prev.filter((post)=> post.id !== postData.id))


    setPosts(prev =>
        prev.map(post =>
          post.id === postData.id
            ? {
                ...post,
                status: 'scheduled'
              }
            : post
        )
      );


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

      const media = post?.post_files
      .sort(
        (a, b) => a.sort_order - b.sort_order
      )
      .filter((media) => media.file_id)
      .map((media)=>{

          return {
            source: 'internal',
            database_id:media.id,
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
        schedule_date: post?.scheduled_at,
        published_at: post?.published_at??null,
        link: post?.link??null,
        slug: post?.slug??null,
        base_url: post?.base_url??null,
        status: status??null,
        type:post?.type??'',
        media: media??null,
        error: post?.last_error??'',
        database_info:{
          post_publications_id:post.id,
        },
        meta_data: post?.meta_data,
        platform_account:post?.platform_account,
        add_comment:data?.event?._def?.extendedProps.add_comment,
      }
    })
     setCalendarEvents(calendarEvents)
  }
}

const hasRun = useRef(false);

  useEffect(() => {
    if (!hasRun.current) {
        //getPostsInit()
        hasRun.current = true; // Mark as run to prevent double execution in dev

    }
  },[])

  const handleEventReceive = (data) => {

    console.log('handleEventReceive', data)

    var scheduled = data.event.start
    var now = new Date();

    if(scheduled.getTime() < now.getTime()){
      showError("No Time travel")
      return
    }

    setPostData({
      id: data?.event?.id,
      start: data?.event?.startStr,
      end: data?.event?.endStr,
      allDay: false,
      title: data?.event?.title,
      caption: data?.event?._def?.extendedProps?.caption,
      schedule_date: scheduled,
      published_at: data?.event?._def?.extendedProps?.published_at,
      link: data?.event?._def?.extendedProps?.link,
      slug: data?.event?._def?.extendedProps?.slug,
      base_url: data?.event?._def?.extendedProps?.base_url,
      status: data?.event?._def?.extendedProps?.status,
      type:data?.event?._def?.extendedProps.type,
      media: data?.event?._def?.extendedProps.media,
      error: data?.event?._def?.extendedProps.error,
      database_info:data?.event?._def?.extendedProps.database_info,
      meta_data: data?.event?._def?.extendedProps?.meta_data,
      platform_account:data?.event?._def?.extendedProps.platform_account,
      add_comment:data?.event?._def?.extendedProps?.add_comment,
    })

  }


  const updateFacebookPostScheduleDate = async (channelId, endPoint, scheduleDate) => {

    const scheduledPublishTime = (moment(scheduleDate).unix())

    const facebookResponse = await fetch(`/api/facebook/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId:channelId,
          postData:{
            scheduled_publish_time:scheduledPublishTime
          },
          endPoint:endPoint
        }),
      })

      if (!facebookResponse.ok) {
        setLoader(false)
        showError(`Upload to facebook failed with status: ${facebookResponse.status}`)
        return
      }

      //updatePostOnDatabase()

      showSuccess('Post Updated')

  }



  const handleEventDrop = async (data) => {


    if (data.event.status === "published") return

    var scheduled = data.event.start
    var now = new Date();
    if(scheduled.getTime() < now.getTime()){
      showError("No Time travel")
      return
    }

    setCalendarEvents(prev =>
        prev.map(event =>
          event.id === data.event.id
            ? {
                ...event,
                scheduleDate: scheduled,
                start:data?.event?.startStr,
                end:data?.event?.endStr,
              }
            : event
        )
      );



    const publicationId =  data.event._def?.extendedProps?.database_info?.post_publications_id??null

    const channelId = data.event._def?.extendedProps?.platform_account?.id??null

    const postId = data.event._def?.extendedProps?.meta_data?.post_id??null

    const platform = data.event._def?.extendedProps?.platform_account.platform??null

    if (publicationId){

      const scheduledAtUTC = new Date(scheduled).toISOString()
      await updatePostScheduleDate(scheduledAtUTC, publicationId)

      if (platform === 'facebook' && postId && channelId){
        await updateFacebookPostScheduleDate(channelId, postId, scheduled)

      }

    }

    showSuccess('Date updated')

  }

  const handleEventClick = (data) =>{





    const newEvent = {
      id: data?.event?.id,
      start: data?.event?.startStr,
      end: data?.event?.endStr,
      allDay: false,
      title: data?.event?.title,
      caption: data?.event?._def?.extendedProps?.caption,
      schedule_date: data?.event?.start,
      published_at: data?.event?._def?.extendedProps?.published_at,
      link: data?.event?._def?.extendedProps?.link,
      slug: data?.event?._def?.extendedProps?.slug,
      base_url: data?.event?._def?.extendedProps?.base_url,
      status: data?.event?._def?.extendedProps?.status,
      type:data?.event?._def?.extendedProps.type,
      media: data?.event?._def?.extendedProps.media,
      error: data?.event?._def?.extendedProps.error,
      database_info:data?.event?._def?.extendedProps.database_info,
      meta_data: data?.event?._def?.extendedProps?.meta_data,
      platform_account:data?.event?._def?.extendedProps.platform_account,
      add_comment:data?.event?._def?.extendedProps.add_comment,
    }


    setPostData(newEvent)
  }

  const handleNewEventClick = (data) =>{

    var scheduled = data.start
    var now = new Date();
    if(scheduled.getTime() < now.getTime()){
      showError("No Time travel")
      return
    }


    const newEvent = {
      id: uuidv4(),
      start: data.startStr,
      end: data.endStr,
      allDay: false,
      title: null,
      caption: 'Take a look at issue XXX...',
      schedule_date: data.start,
      published_at: null,
      link: null,
      slug: null,
      base_url: null,
      status: 'unpublished',
      type:null,
      media: [],
      error: null,
      database_info:{
        post_publications_id:null,
      },
      meta_data: null,
      platform_account:null,
      add_comment:false
    }

    setCalendarEvents(prev => [...prev, newEvent]);

    setPostData(newEvent)
  }


  function renderEventContent(eventInfo) {

    const postType = eventInfo?.event?._def?.extendedProps?.type

    const isOneSignalPost = eventInfo?.event?._def?.extendedProps?.platform_account?.platform === 'One Signal'
    const isFacebookPost = eventInfo?.event?._def?.extendedProps?.platform_account?.platform === 'facebook'
    const isInstagramPost = eventInfo?.event?._def?.extendedProps?.platform_account?.platform === 'instagram'

    const postId = eventInfo?.event?._def.extendedProps?.meta_data?.post_id

    let className = eventInfo.event._def.extendedProps.status

    if ((isFacebookPost || isOneSignalPost) && !postId){
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
        borderRadius:'3px',
        padding: (postType === 'photos' && eventInfo?.event?._def?.extendedProps?.media.length>0)? '0px' : '5px'
      }}
        >
        {postType === 'photos' && eventInfo?.event?._def?.extendedProps?.media.length>0?(
          <>
            <img src={eventInfo?.event?._def?.extendedProps?.media[0].file_url}/>
          </>

        ):(
          <>
            <i>{eventInfo.timeText}</i><br/>
            {eventInfo.event._def.extendedProps.caption&&
              <b>{eventInfo.event._def.extendedProps.caption}</b>
            }
            {!eventInfo.event._def.extendedProps.caption && eventInfo.event.title &&
              <b>{eventInfo.event.title}</b>
            }
          </>
        )
      }

      </div>
    )
  }




  const deletePostCallback = async(postData) => {

    const postType = postData.type

    if (postData?.platform_account?.platform === "facebook" ||
      postData?.platform_account?.platform === "instagram"
    ){
      const channelId = postData.platform_account.id

      let id
      if (postType === 'video_reels'){
        id = postData?.meta_data?.post_id
      }else if (postType === 'text' || postType === 'link' || postType === 'photos') {
        id = postData?.meta_data?.post_id
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


    if (postData?.platform_account?.platform === "One Signal"){

      const notificationId = postData?.meta_data?.post_id
      const channelId = postData?.platform_account?.id

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



    await deletePost([postData.database_info.post_publications_id])

    setCalendarEvents(prev => prev.filter((post)=> post.id !== postData.id))


    setPosts(prev =>
        prev.map(post =>
          post.id === postData.id
            ? {
                ...post,
                status: 'unpublished'
              }
            : post
        )
      );



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
        calendarEvents={calendarEvents}
        setCalendarEvents={setCalendarEvents}
        updateFacebookPostScheduleDate={updateFacebookPostScheduleDate}
        autoClose={true}

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
          feeds={feeds}
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
          dayHeaderContent = { function(args){
              return moment(args.date).format('ddd, MMMM Do')
            }
          }
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
          select={handleNewEventClick}
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
  feeds,
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
    const [loader, setLoader] = useState(false)

      const importEvents = () => {

        const newPosts = posts.map((post)=>{
          return{
            ...post,
            start: post.schedule_date,
            end: post.schedule_date,
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
      const feed = feeds.find(item => item.label === value);
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





    const getFeed = async (selectedFeed, dateFeed = dateFilter) => {

      if (!selectedFeed) return

      setLoader(true)
      setNoPosts(false)
      setPosts([])


      if (selectedFeed.CMSType === 'contentful'){



        let order
         if (selectedFeed.publishedDate){
           order = '-fields.'+selectedFeed.publishedDate
         }else{
           order = 'sys.updatedAt'
         }


        const contentfulResponse  = await fetch('/api/contentful/get-content', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                feedId: selectedFeed.id,
                order: order,
                contentType: selectedFeed.content_type
              }),
          });

          const response = await contentfulResponse.json();

        let date = moment(dateFeed).format('YYYY-MM-DD');

        var filterPosts = response.data

        if (selectedFeed.useDateFilter){
          filterPosts = response.data.filter((item)=> item.fields[selectedFeed.publishedDate] === date)
        }

        if (selectedFeed.customFilterField){
          filterPosts = filterPosts.filter(function(node) {
               return !node.fields[`${selectedFeed.customFilterField}`]
           });
        }

        if (filterPosts?.length === 0){
          setNoPosts(true)
          setLoader(false)
          return
        }



        const posts = []

        for (const item of filterPosts) {
          const urlString = 'https:' + item?.fields[selectedFeed.image]?.fields?.file?.url;


          posts.push({
            id: item.sys.id,
            start: DateTime.fromISO(item.fields[selectedFeed.scheduleDate]).toISO(),
            end: DateTime.fromISO(item.fields[selectedFeed.scheduleDate]).toISO(),
            allDay: false,
            title: item.fields[selectedFeed.title],
            caption: removeMd(item.fields[selectedFeed.text]),
            schedule_date: item.fields[selectedFeed.scheduleDate],
            link: 'https://' + selectedFeed.website+'/'+item.fields[selectedFeed.slug],
            slug: item.fields[selectedFeed.slug],
            base_url: selectedFeed.website,
            status: 'unpublished',
            type:selectedFeed.postType,
            media: [
              {
                id:item?.fields[selectedFeed.image]?.sys?.id,
                file_url:'https:' + item?.fields[selectedFeed.image]?.fields?.file?.url,
                file_description: item?.fields[selectedFeed.image]?.fields?.description,
                file_name: item.fields[selectedFeed.image].fields.file?.fileName,
                file_type: item.fields[selectedFeed.image].fields.file?.contentType,
                source: 'external'
              }
            ],
            error: null,
            database_info:null,
            meta_data: null,
            platform_account:{
              external_account_id:selectedFeed.facebook_page_id
            },
            add_comment:selectedFeed.addComment
          })
        }

        const checkedPosts = checkCalendarEventsDuplicate(posts)

        setPosts(checkedPosts)
      }else if (selectedFeed.CMSType === 'wordpress'){


      const wordpressResponse  = await fetch('/api/wordpress/get-content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              feedId: selectedFeed.id,
              dateFilter: selectedFeed.useDateFilter?dateFeed:null
            }),
        });

        const response = await wordpressResponse.json();

        if (response?.data.length === 0){
          setLoader(false)
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

        for (const item of response?.data) {


          const isCustomApi = selectedFeed.query_field

          /*
          const urlString = !isCustomApi? (item._embedded && item._embedded['wp:featuredmedia'])? item._embedded['wp:featuredmedia'][0].source_url : null : item[`${selectedFeed.query_image_field}`]

          const url = new URL(urlString);
          const fileName = url.pathname.split('/').pop();
          const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
          */

          let scheduleDate
          let formattedDate

          if (selectedFeed.scheduleDate){
            scheduleDate = pathIndex(item, selectedFeed?.scheduleDate)

            formattedDate = DateTime
            .fromISO(scheduleDate.replace(' ', 'T'))
            .toISO({ suppressMilliseconds: true });
          }



          posts.push({
            id : !isCustomApi? item.id.toString():item[`${selectedFeed.query_id_field}`],
            start: selectedFeed.scheduleDate? formattedDate : null,
            end: selectedFeed.scheduleDate? formattedDate : null,
            allDay: false,
            title: !isCustomApi? decodeEntities(item.title.rendered) : item[`${selectedFeed.query_title_field}`]??null,
            caption: !isCustomApi? decodeCaptionEntities(item.content.rendered) : item[`${selectedFeed.query_caption_field}`]??null,
            schedule_date: scheduleDate??null,
            link: !isCustomApi? item.slug? 'https://' + selectedFeed.website +'/' + item.slug : null : item[`${selectedFeed.query_link_field}`]??null,
            slug: item.slug??null,
            base_url: selectedFeed.website??null,
            status: 'unpublished',
            type:selectedFeed.postType,
            media: [
              {
                id:!isCustomApi && item?._embedded['wp:featuredmedia']? item?._embedded['wp:featuredmedia'][0]?.id : uuidv4(),
                file_url:!isCustomApi? (item._embedded && item._embedded['wp:featuredmedia'])? item._embedded['wp:featuredmedia'][0].source_url : null : item[`${selectedFeed.query_image_field}`]??null,
                file_description: (item._embedded && item._embedded['wp:featuredmedia'])? decodeEntities(item._embedded['wp:featuredmedia'][0].caption.rendered) : null,
                file_name: (item._embedded && item._embedded['wp:featuredmedia'])? item._embedded['wp:featuredmedia'][0].title.rendered : null,
                file_type: !isCustomApi && item?._embedded['wp:featuredmedia']? item?._embedded['wp:featuredmedia'][0]?.mime_type : await getImageType(item[`${selectedFeed.query_image_field}`]),
                source: 'external'
              }
            ],
            error: null,
            database_info:null,
            meta_data: null,
            platform_account:{
              external_account_id:selectedFeed.facebook_page_id
            },
            add_comment:selectedFeed.addComment
          })
        }


        const checkedPosts = checkCalendarEventsDuplicate(posts)
        setPosts(checkedPosts)
      }

        setLoader(false)
    }



  return(
    <div>
        <div style={{display:'flex', alignItems:'end', gap:'5px', paddingRight:'10px'}}>
            <div style={{flex:2}}>
              <label className='label'>Publication</label>
              <select id="rss-select" className="form-input select" onChange={(e) => onFeedChange(e.target.value)} value={selectedFeed.label}>
                {feeds.map((feed, index)=>{
                  return <option key={index} value={feed.label}>{feed.label}</option>
                })
                }
              </select>
            </div>
            <button onClick={() => getFeed(selectedFeed, dateFilter)} className='btn btn-sm primary' style={{height: '36px', margin: '10px 0px'}}>
              <RefreshCcw  style={{verticalAlign: 'middle', color:'white'}} size={20}/>
            </button>
          </div>

        {selectedFeed.useDateFilter&&
            <div>
              <label className='label'>Publication Date Filter</label>
                <DatePicker
                  selected={dateFilter}
                  onChange={(date) => setDateFilterFunction(date)}
                  className={'form-input'}
                  dateFormat="dd/MM/yyyy"
                />
            </div>

        }

      {(posts.length>0 && selectedFeed.useEventImport) &&
      <button className="btn btn-sm secondary" onClick={importEvents}>Import Events</button>
      }

      <div style={{
        position:'relative',
        display: 'flex',
        flexWrap: 'wrap',
        overflowY: posts.length>0 ? 'scroll' : 'hidden',
        overflowX: 'hidden',
        alignContent: 'flex-start',
        gap: '2%',
      }}>
        <div style={{
          display: loader?'block':'none',
          position: 'relative',
          height: '100px',
          width: '100%',
          background:'none'
        }}

        className={'loader_screen'}>
       <div style={{transform:'translate(-50%, -50%)'}}  className="loader"></div>
        </div>
        {noPosts &&
          <div className='alert alert-danger'>
            That's a bummer, man
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
    <div ref={elRef} style={{width:'48%'}} className={`post_image ${data.status}`}>
      <img
        style={{
          height:'100px',
          objectFit:'cover',
          margin: '2% 0',
          borderRadius: 'var(--input-border-radius)'
        }}
        draggable
        src={data.media[0].file_url}
        alt={data.media[0].file_name}
        title={data.title}
      />
    </div>
  )
})

export const Share = ({
  postData,
  userId,
  deletePostCallBack,
  close,
  scheduleCallBack,
  calendarEvents,
  setCalendarEvents,
  updateFacebookPostScheduleDate,
  autoClose
}) => {

  const {showFiles, setShowFiles, selectedFiles, setSelectedFiles, setFilePicker, setFileLimit } = useFilesContext();
  const [scheduleDate, setScheduleDate] = useState(postData.schedule_date)
  const [publishedDate, setPublishedDate] = useState(postData?.published_at??'')
  const [addComment, setAddComment] = useState(postData?.add_comment??false)
  const [addCaptionLink, setAddCaptionLink] = useState(true)
  const [activeCaption, setActiveCaption] = useState(null)
  const [selectedSocialPages, setSelectedSocialPages] = useState([])
  const [socialPages, setSocialPages] = useState([])
  const [postLink, setPostLink] = useState(postData?.link?? '')
  const [caption, setCaption] = useState(postData?.caption?? '')
  const [title, setTitle] = useState(postData?.title??'')
  const [slug, setSlug] = useState(postData?.slug??'')

  const [media, setMedia] = useState(postData?.media??[])
  const [videoSrc, setVideoSrc] = useState(null)
  const [loader, setLoader] = useState(false)
  const [videoLoader, setVideoLoader] = useState(false)
  const [scheduled, setScheduled] = useState(false)
  const [postType, setPostType] = useState(postData?.type)
  const [status, setStatus] = useState(postData?.status)
  const [postState, setPostState]= useState('SCHEDULE')
  const [buttonText, setButtonText]= useState('Schedule')
  //const [summary, setSummary]= useState(null)
  const [channelPreviews, setChannelPreviews]= useState([])
  const [selectedChannelPreview, setSelectedChannelPreview]= useState('')
  const [instagramMediaError, setInstagramMediaError] = useState(false)
  const [instagramCaptionError, setInstagramCaptionError] = useState(false)
  const [postTypeError, setPostTypeError] = useState(false)

  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [customCaptions, setCustomCaptions] = useState([])
  const [customCaptionsToggle, setCustomCaptionsToggle] = useState(false)
  const [isInstagram, setIsInstagram] = useState(false)
  const updateImages = useRef(false)
  const videoBlobRef = useRef(null)



    const isOneSignalPost = postData?.platform_account?.platform === 'One Signal'
    const isFacebookPost = postData?.platform_account?.platform === 'facebook'
    const isInstagramPost = postData?.platform_account?.platform === 'instagram'

    const postId = postData?.meta_data?.post_id
    const type = postData?.type
    const publicationId = postData?.database_info?.post_publications_id??null
    const channelId = postData?.platform_account?.id
    const channel = postData?.platform_account

const getMinTime = () => {
  const now = moment();

  if (!scheduleDate || moment(scheduleDate).isSame(now, 'day')) {
    return now.add(30, 'minutes').toDate();
  }

  return moment(scheduleDate).startOf('day').toDate();
};


const checkInstagramImages = async (images) => {
  let hasMediaChanges = false;

  const checkedImages = await Promise.all(
    images.map(async (image) => {
      const instagramImageCheck = await checkImageSize(image.file_url);

      if (image.instagram_image_error !== instagramImageCheck) {
        hasMediaChanges = true;
      }

      return {
        ...image,
        instagram_image_error: instagramImageCheck,
      };
    })
  );

  const hasInstagramErrors = checkedImages.some(
    image => image?.instagram_image_error
  );

  if (hasMediaChanges) {
    setMedia(checkedImages);
  }

  setInstagramMediaError(hasInstagramErrors);

};

    useEffect(()=>{

      if(instagramMediaError){
        showError('Instagram Image Size Error')
      }

    },[instagramMediaError])

    useEffect(() => {
      const hasInstagram = channelPreviews.some(channel =>
        channel.includes('instagram')
      );

      if (!hasInstagram || media.length === 0) return;

      checkInstagramImages(media);
    }, [media, channelPreviews]);




    const checkPostType = (images) => {

      if (!postType) return

      let hasTypeChanges = false;

      const checkedImages = images.map((file)=>{

        if (!file?.file_type || !file?.file_url) return

        const isImage = file?.file_type === "image/png" || file?.file_type === 'image/jpeg' || file?.file_url?.match(/\.(jpg|jpeg|png)$/i);
        const isVideo = file?.file_type === "video/mp4" || file?.file_type === 'video/webm' || file?.file_url?.match(/\.(mp4|mov|m4v)$/i);

        const postTypeCheck = (!isVideo && postType === 'video_reels') || (!isImage && postType === 'photos')

        if (file.post_type_error !== postTypeCheck){
          hasTypeChanges = true;
        }

        return {
          ...file,
          post_type_error: postTypeCheck,
        };

      })

      const hasPostTypeErrors = checkedImages.some(
        image => image?.post_type_error
      );


      if (hasTypeChanges) {
        setMedia(checkedImages);
      }

      setPostTypeError(hasPostTypeErrors);

    }


    useEffect(()=>{

      if (media.length > 0 && postType){
        checkPostType(media)
      }

    },[media, postType])



    useEffect(()=>{

      if (postTypeError){
        showError('Post Type Error')
      }


    },[postTypeError])




  const getPostInfo = async () => {


    if (postData?.platform_account?.platform === "facebook"){

        const postId = postData?.meta_data?.post_id
        const channelId = postData?.platform_account?.id

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

    if (postData?.platform_account?.platform === "One Signal"){

      const postId = postData?.meta_data?.post_id
      const channelId = postData?.platform_account?.id

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

    if (postData?.platform_account?.platform === "facebook"){

      const channelId = postData?.platform_account?.id
      const channel = postData?.platform_account

      let endPoint

      if (postType === 'video_reels' || postType === 'text' || postType === 'carousel' || postType === 'link'){

        endPoint = postData?.meta_data?.post_id

      }else if (postType === 'photos') {
        //endPoint = `${channelId}_${postData?.meta_data?.post_id}`
          endPoint = postData?.meta_data?.post_id
      }

      if (!endPoint) return

      const scheduledPublishTime = (moment(scheduleDate).unix())
      //const endPoint = getFacebookPostEndpoint(postType)
      const data = await getFacebookPostDataSchedule(postType, null, channel)

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

        //updatePostOnDatabase()

        showSuccess('Post Updated')
    }

    if (postData?.platform_account?.platform === "instagram"){

      if (status === 'scheduled'){
        ///updatePostOnDatabase()
      }
          //
    }

    if (postData?.platform_account?.platform === "One Signal"){
      if (status === 'scheduled'){
        //updatePostOnDatabase()
      }
    }

  }


  const updatePostOnDatabase = async() => {


    const publicationId = postData?.database_info?.post_publications_id

    const scheduledAtUTC = new Date(scheduleDate).toISOString()


    if (postState === 'PUBLISH'){
      newMetadata.published_at = new Date().toISOString()
    }

    const updateData = {
      scheduled_at:scheduledAtUTC,
      status: status,
      caption:caption,
      title:title,
      type:postType,
      status:status,
      link: postData?.link??null,
      slug: postData?.slug??null,
      base_url: postData?.base_url??null,
    }

    if (postState === 'PUBLISH'){
      updateData.published_at = new Date().toISOString()
    }


    if (publicationId){
      await updatePostPublication(
        publicationId,
        updateData
      )
    }

  }







  const onChannelPreviewChange = (channel) => {
    setSelectedChannelPreview(channel)
  }

  const handlePostTypeChange = (event) => {
    setPostType(event.target.value)
    if (event.target.value === 'photos'){
      setAddComment(false)
    }else if (event.target.value === 'link' && postData?.add_comment){
      setAddComment(true)
    }
  };

  useEffect(()=>{

    if (postData?.type){
      setPostType(postData?.type)

      if (postData?.type === 'photos'){
        setAddComment(false)
      }else if (event.target.value === 'link' && postData?.add_comment){
        setAddComment(true)
      }
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
            setLoader(false)
            return
          }


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

                 platform_id: acc.id,
                 scheduled_at: scheduledAtUTC,
                 platform:acc.platform,
                 status: status,
                 caption:captionData,
                 title:title,
                 type:(acc.platform==='instagram' && postType==='link')?'photos':postType,
                 user_id:userId,
                 link:postLink,
                 slug:slug,
                 base_url:postData.base_url
               }
           })

             const savedPostPublications = await savePostPublications(publications)

             /*

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
                    post_publication_id: savedPostPublication.id
                  })
                }
              }*/


              const mediaWithIds = [];


              for (const file of media) {
                let fileId

                if (file.source === 'external'){

                  const fileServer = await fileFromServer(file.file_url);

                  const formData = new FormData()
                  formData.append('file', fileServer)

                  const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                  })

                  const result = await res.json()

                  if (!res.ok) return


                  const fileUpload = await storeFileInfo({
                    user_id: userId,
                    file_url: result.url,
                    file_type: fileServer.type,
                    file_name: fileServer.name,
                    file_description: file.file_description ?? null
                  })

                  console.log('fileUpload', fileUpload)

                  fileId = fileUpload.id

                }else{
                  fileId = file.id
                }

                mediaWithIds.push({
                  ...file,
                  file_id:fileId
                });
              }


              /*
              for (const file of media) {
                const fileId =
                  file.source === 'external'
                    ? (
                      //
                        await storeFileInfo({
                          user_id: userId,
                          file_url: file.file_url,
                          file_type: file.file_type,
                          file_name: file.file_name,
                          file_description: file.file_description ?? null
                        })
                      ).id
                    : file.id;

                mediaWithIds.push({
                  ...file,
                  file_id:fileId
                });
              }*/



              for (const savedPostPublication of savedPostPublications) {
                for (const [index, file] of mediaWithIds.entries()) {
                  await savePostFile({
                    file_id: file.file_id,
                    usage_type: postType,
                    post_publication_id: savedPostPublication.id,
                    sort_order: index
                  });
                }
              }



             const savedPostPublicationsFacebook = savedPostPublications.filter((publication)=>publication.platform === 'facebook')

             const savedPostPublicationsOneSignal = savedPostPublications.filter((publication)=>publication.platform === 'One Signal')


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

              let scheduleStatus
              if (postState === 'SCHEDULE'){
                scheduleStatus = 'scheduled'
              }else if (postState === 'PUBLISH'){
                scheduleStatus = 'published'
              }

              setStatus(scheduleStatus)
              scheduleCallBack(postData, scheduleStatus, savedPostPublications)

              setLoader(false)
              showSuccess('All Posts Scheduled')
              if (autoClose){
                close(null)
              }

              
              


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
        message: publication? publication.caption : caption,
      }

    case 'link':
    case 'carousel':

      const postCaption = publication? publication.caption : caption

      return {
        message:`${postCaption} ${addCaptionLink? `\n\n Full story here: ${postLink}` : ''}`,
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
        message: publication? publication.caption : caption,
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
        description: publication? publication.caption : caption,
        file_url: media[0].file_url,
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

        let description = publication?.caption?publication?.caption:caption

        if (postLink){

          const postCaption = publication? publication.caption : caption

          description = `${postCaption} ${addCaptionLink? `\n\n Full story here: ${postLink}` : ''}`
        }


      return {
        video_id: videoId,
        upload_phase: 'finish',
        video_state: video_state,
        description: description,
        title: title??description
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
              "data" : postData?.slug? {
                "slug" : postData?.slug
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
            post_id:notificationId,
          }
        }

        if (postState === 'PUBLISH'){
          updateData.published_at = new Date().toISOString()
          updateData.status = 'published'
        }


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

     
      if (endPoint !== 'video_reels' && endPoint !== 'videos'){
         console.log('endPoint', endPoint)
        data.published = false
      }
     

    }else if (postState === 'PUBLISH'){

      if (endPoint !== 'video_reels' && endPoint !== 'videos'){
        data.published = true
      }
    }


    //return
  
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

      let postId = postResponseJson.id

      if (endPoint === 'video_reels'){
        postId = data.video_id
      }

      const postResponseData = postResponseJson.data

      if (addComment){
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
      }

      const updateData  = {
        status: 'scheduled',
        meta_data:{
          post_id:postId,
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



  const deletePostDatabase = async() =>{
      setLoader(true)
      await deletePostCallBack(postData)
      setLoader(false)
      close(null)
  }

  const lookUpPost = async() => {

    const channelId = postData?.platform_account?.id
    const id = postData?.meta_data?.post_id

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

const updateDate = async(date)=>{

  const scheduledAtUTC = new Date(date).toISOString()

  setCalendarEvents(prev =>
      prev.map(event =>
        event.id === postData.id
          ? {
              ...event,
              scheduleDate: scheduledAtUTC,
              start:DateTime.fromJSDate(date).toFormat("yyyy-MM-dd'T'HH:mm:ssZZ"),
              end:DateTime.fromJSDate(date).toFormat("yyyy-MM-dd'T'HH:mm:ssZZ"),
            }
          : event
      )
    );

  if (publicationId){

    const scheduledAtUTC = new Date(date).toISOString()

    await updatePostScheduleDate(scheduledAtUTC, publicationId)

    if (isFacebookPost && postId && channelId){
      await updateFacebookPostScheduleDate(channelId, postId, date)
    }


  }

  showSuccess('Date updated Share')

}

const handleDateChange = (date) => {

  setScheduleDate(date)

  if (setCalendarEvents && calendarEvents){
     updateDate(date)
  }
 

}

/*
useEffect(() => {
    updateDate(scheduleDate)
}, [scheduleDate]);
*/





const addNewFiles = async(selectedFiles) => {

  console.log('addNewFiles')

  const newFiles = selectedFiles.map((file)=>{
    return{
      source :'internal',
      database_id:file.id,
      ...file
    }
  })

  if (publicationId){
    const newInternaFiles = []

    for (const file of newFiles) {
      const newMedia = await savePostFile({
        file_id: file.id,
        usage_type: postType,
        post_publication_id: publicationId
      })

      const newFile = {
        database_id:newMedia.id,
        ...file
      }
      newInternaFiles.push(newFile)
    }

    if(postData.id){
      setCalendarEvents(prev =>
          prev.map(event =>
            event.id === postData.id
              ? {
                  ...event,
                  media: [...newInternaFiles, ...media]
                }
              : event
          )
        );
    }

    setMedia(prev => [...newInternaFiles, ...media])
    // update file index
    showSuccess('Post Files Updated')

  }else{

    setMedia(prev => [...newFiles, ...media])
    if(postData.id){
      setCalendarEvents(prev =>
          prev.map(event =>
            event.id === postData.id
              ? {
                  ...event,
                  media: [...newFiles, ...media]
                }
              : event
          )
        );
      }

  }
  setSelectedFiles([])
}





  useEffect(() => {
    if (!showFiles && selectedFiles.length > 0) {
      addNewFiles(selectedFiles)
    }
  }, [showFiles, selectedFiles]);




  const handleLinkBlur = async() => {
    if (publicationId){
      await updatePostPublication(publicationId,
        {
          link:postLink
        }
      )
    }
    if (postId){
      setCalendarEvents(prev =>
          prev.map(event =>
            event.id === postId
              ? {
                  ...event,
                  link: postLink
                }
              : event
          )
        );
    }

  }

  const activeCaptionCallback = (data) => {

    console.log('data', data)
    setActiveCaption(data)

  }

  return(
    <>
      <div className={'loader_screen'} style={{zIndex:3}} onClick={loader? null : () => close(null)}></div>
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
              {postData.error&&
                <div style={{
                  background: 'var(--md-sys-color-error)',
                  color:'#ffffff',
                  padding:'10px',
                  borderRadius: '10px',
                  marginTop:'15px'
                }}>
                  {postData.error}
                </div>
              }

              {((isFacebookPost || isOneSignalPost) && !postId)?
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
                disabled={postData?.database_info?.post_publications_id}
              />
              {postData.title !== 'null'&&
                <h4>{postData.title}</h4>
              }
              <p>{postType}</p>
              <div className={`properties-container ${postData?.database_info?.post_publications_id?'disabled':''}`} style={{margin:'15px 0px'}}>
                <p className='label' style={{paddingLeft:'10px'}}>Post Type</p>
                <div style={{display:'flex', alignItems:'center'}}>
                  <div style={{display:'flex', alignItems:'center'}}>
                    <Radio
                      style={{marginRight:'0px'}}
                      type="radio"
                      value="text"
                      checked={postType === 'text'}
                      onChange={handlePostTypeChange}
                      disabled={postData?.database_info?.post_publications_id}
                    /><span style={{fontSize:'.9em'}}>Text</span>
                  </div>
                  <div style={{display:'flex', alignItems:'center'}}>
                    <Radio
                      style={{marginLeft:'10px', marginRight:'0px'}}
                      type="radio"
                      value="video_reels"
                      checked={postType === 'video_reels'}
                      onChange={handlePostTypeChange}
                      disabled={postData?.database_info?.post_publications_id}
                    /><span style={{fontSize:'.9em'}}>Reel</span>
                  </div>
                  <div style={{display:'flex', alignItems:'center'}}>
                    <Radio
                      style={{marginLeft:'10px', marginRight:'0px'}}
                      type="radio"
                      value="link"
                      checked={postType === 'link'}
                      onChange={handlePostTypeChange}
                      disabled={postData?.database_info?.post_publications_id}
                    /><span style={{fontSize:'.9em'}}>Link</span>
                  </div>
                  <div style={{display:'flex', alignItems:'center'}}>
                    <Radio
                      style={{marginLeft:'10px', marginRight:'0px'}}
                      type="radio"
                      value="photos"
                      checked={postType === 'photos'}
                      onChange={handlePostTypeChange}
                      disabled={postData?.database_info?.post_publications_id}
                    /><span style={{fontSize:'.9em'}}>Photos</span>
                  </div>
                </div>
              </div>

              {(postType === 'photos' ||
                postType === 'video_reels' ||
                selectedChannelPreview==='instagram' ||
                activeCaption?.platform === 'instagram' )&&

                <div
                  className={`properties-container ${(isInstagramPost || isOneSignalPost) && postData.status === 'published'?'disabled':''}`}
                  style={{margin:'15px 0px'}}>
                  <p className='label'>Media</p>
                  <button className="btn secondary btn-sm" onClick={() => {
                    setFileLimit(0)
                    setSelectedFiles([])
                    setFilePicker(true)
                    setShowFiles(prevState => !prevState)
                  }}>Add Files</button>
                  <MediaList
                    key={postData.id}
                    postType={postType}
                    postId={postData?.id}
                    publicationId={publicationId}
                    userId={userId}
                    media={media}
                    setMedia={setMedia}
                    instagramError={instagramMediaError}
                    setPostTypeError={setPostTypeError}
                    calendarEvents={calendarEvents}
                    setCalendarEvents={setCalendarEvents}
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
                    onBlur={handleLinkBlur}
                  />
                  <a href={postLink} target="new-window" style={{height: '24px'}}>
                    <ExternalLink/>
                  </a>
                </div>
              </div>
            }
            <Caption
              publicationId={publicationId}
              postId={postData?.id}
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
              calendarEvents={calendarEvents}
              setCalendarEvents={setCalendarEvents}
              postData={postData}
              activeCaptionCallback={activeCaptionCallback}
            />

              <div className={`${(isInstagramPost || isOneSignalPost) && postData.status === 'published'?'disabled':''}`}>
                <button
                  style={{marginRight: '10px', marginTop:'0px'}}
                  className="btn primary btn-sm"
                  onClick={()=>createCaption()}
                  >Add Image Captions
                </button>
              </div>
              <div className={`${(isInstagramPost || isOneSignalPost) && postData.status === 'published'?'disabled':''}`}>
                <Summary text={caption} defaultPlatform={selectedChannelPreview}/>
              </div>

              <div
                className={`properties-container ${(isInstagramPost || isOneSignalPost) && postData.status === 'published'?'disabled':''}`}
                style={{margin:'15px 0px'}}
              >
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
                    disabled={status === 'published'}
                    style={{minWidth:'300px'}}
                    minDate={moment().toDate()}
                    minTime={getMinTime()}
                    maxTime={moment().endOf('day').toDate()}
                    selected={scheduleDate}
                    onChange={(date) => handleDateChange(date)}
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
                  disabled={
                    (status === 'published' || status === 'scheduled') ||
                    (isInstagram && instagramCaptionError) ||
                    (isInstagram && instagramMediaError) ||
                    (!postType) ||
                    (postTypeError)
                }
                  className="btn primary"
                  onClick={() => scheduleMultiple('scheduled')}>{buttonText}

                </button>
              }

              {postData?.database_info?.post_publications_id &&
                <>
                <button style={{marginLeft:'10px'}} className="btn danger" onClick={deletePostDatabase}>Delete Post</button>
                <button style={{marginLeft:'10px'}} className="btn secondary" onClick={getPostInfo}>Get Post Info</button>
                {isFacebookPost &&
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
                  {selectedChannelPreview && channelPreviews.length>0 &&
                    <select id="channel-select" className="form-input select" onChange={(e) => onChannelPreviewChange(e.target.value)} value={selectedChannelPreview}>
                      {channelPreviews.map((channel, index)=>{
                        return <option key={index} value={channel}>{channel}</option>
                      })
                      }
                    </select>
                  }
                  {console.log('media', media)}
                  {console.log('postType ', postType )}

                    {(postType=== 'link' && selectedChannelPreview === 'facebook') &&
                      <>
                        <FacebookLinkPreview
                          url={postLink}
                          postData={postData}
                          caption={caption}
                          customCaptions={customCaptions}
                          customCaptionsToggle={customCaptionsToggle}
                          selectedSocialPages={selectedSocialPages}
                          addComment={addComment}
                          setAddComment={setAddComment}
                          addCaptionLink={addCaptionLink}
                          setAddCaptionLink={setAddCaptionLink}
                          status={status}

                        />
                      </>
                    }
                    {(postType === 'video_reels' && media[0]?.file_type === "video/mp4") &&
                      <div className="video-container" style={{position:'relative'}}>
                        {selectedChannelPreview === 'facebook'&&
                          <div style={{
                              position: 'absolute',
                              right: '5px',
                              top: '10px',
                              }}>
                            <ThreeDotMenu>
                              {status === 'unpublished'&&
                                <>
                                <div>
                                    <label style={{display: 'flex', alignItems: 'center', fontSize: 'var(--sm-font-size)', gap:'5px'}}>
                                    <Checkbox
                                      id={'add-comment'}
                                      className="form-check-input"
                                      type="checkbox"
                                      onChange={() => setAddComment(prev => !prev)}
                                      checked={addComment}
                                      sx={{
                                        color: 'var(--md-sys-color-secondary)',
                                        '&.Mui-checked': {
                                          color: 'var(--md-sys-color-primary)',
                                        },
                                      }}
                                    />
                                    Add First Comment with Link
                                  </label>
                                  </div>
                                  <div style={{marginTop:'10px'}}>
                                  <label style={{display: 'flex', alignItems: 'center', fontSize: 'var(--sm-font-size)', gap:'5px'}}>
                                  <Checkbox
                                    id={'add-comment'}
                                    className="form-check-input"
                                    type="checkbox"
                                    onChange={() => setAddCaptionLink(prev => !prev)}
                                    checked={addCaptionLink}
                                    sx={{
                                      color: 'var(--md-sys-color-secondary)',
                                      '&.Mui-checked': {
                                        color: 'var(--md-sys-color-primary)',
                                      },
                                    }}
                                  />
                                  Add Link in Caption
                                </label>
                                </div>
                                </>
                              }
                            </ThreeDotMenu>
                          </div>
                        }
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
                        <InstagramPhotosPreview
                          media={media}
                          caption={caption}
                          customCaptions={customCaptions}
                          customCaptionsToggle={customCaptionsToggle}
                          selectedSocialPages={selectedSocialPages}
                          addComment={addComment}
                          setAddComment={setAddComment}
                          addCaptionLink={addCaptionLink}
                          setAddCaptionLink={setAddCaptionLink}
                          status={status}
                        />
                      </>
                    }
                    {postType === 'photos' &&  selectedChannelPreview === 'instagram' &&
                      <>

                        <InstagramPhotosPreview
                          media={media}
                          caption={caption}
                          customCaptions={customCaptions}
                          customCaptionsToggle={customCaptionsToggle}
                          selectedSocialPages={selectedSocialPages}
                          addComment={addComment}
                          setAddComment={setAddComment}
                          addCaptionLink={addCaptionLink}
                          setAddCaptionLink={setAddCaptionLink}
                          status={status}
                        />
                      </>
                    }

                    {postType === 'photos' && selectedChannelPreview === 'facebook' &&
                      <>

                        <FacebookPhotosPreview
                          media={media}
                          caption={caption}
                          customCaptions={customCaptions}
                          customCaptionsToggle={customCaptionsToggle}
                          selectedSocialPages={selectedSocialPages}
                          addComment={addComment}
                          setAddComment={setAddComment}
                          addCaptionLink={addCaptionLink}
                          setAddCaptionLink={setAddCaptionLink}
                          status={status}
                        />
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
  customCaptions,
  customCaptionsToggle,
  selectedSocialPages,
  addComment,
  setAddComment,
  addCaptionLink,
  setAddCaptionLink,
  status
}) => {
  const [openGraph, setOpenGraph] = useState(null)
  const [openGraphError, setOpenGraphError] = useState(null)
  const [postUrl, setPostUrl] = useState(url)
  const [captionText, setCaptionText] = useState(caption)
  const [loader, setLoader] = useState(false)




  useEffect(() => {
    if (customCaptions?.length>0 && customCaptionsToggle){
      const facebookCaption = customCaptions.find((cap)=> cap.platform === 'facebook')
      setCaptionText(facebookCaption.caption)
    }else{
      setCaptionText(caption)
    }

  },[caption, customCaptions, customCaptionsToggle])



const getOpenGraph = async (url) => {
  try {
    setLoader(true)

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
    setLoader(false)
  }
}

const noPreview = () => {

  setOpenGraph({
    ogTitle: postData?.title??null,
    ogUrl: postData?.link??null,
    ogDescription: postData?.caption??null,
    ogImage: postData?.media[0]?.file_url??null
  })
}




useEffect(()=>{


  if (URL.canParse(url)) {


    if (url.startsWith('https://www.hilltopsphoenix.com.au')) return
    if (url.startsWith('https://www.cowraphoenix.com.au')) return



    getOpenGraph(url)

    //getOpenGraph()
    //hasRun.current = true; // Mark as run to prevent double execution in dev
  }else{
    noPreview()
  }
},[url])

const refreshShareAttachment = async () => {

  if (!url){
    showError(`No Url`)
    return
  }

  try{

  setLoader(true)

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

    showSuccess('Attachment updated')

    }catch(err){
        showError(err)
    }finally{
      setLoader(false)
    }
}


return(
    <div style={{marginTop:'25px', position: 'relative'}}>
      <div style={loader? {display:'block'}:{display:'none'}} className={'loader_screen'}>
        <div style={{transform:'translate(-50%, -50%)'}}  className="loader"></div>
      </div>
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
              {(selectedSocialPages?.length > 0 && url) &&
                <>
                  <button onClick={refreshShareAttachment} className='btn btn-sm clear'>Refresh Share Attachment</button>
                </>
              }
              {status === 'unpublished'&&
                <>
                <div>
                    <label style={{display: 'flex', alignItems: 'center', fontSize: 'var(--sm-font-size)', gap:'5px'}}>
                    <Checkbox
                      id={'add-comment'}
                      className="form-check-input"
                      type="checkbox"
                      onChange={() => setAddComment(prev => !prev)}
                      checked={addComment}
                      sx={{
                        color: 'var(--md-sys-color-secondary)',
                        '&.Mui-checked': {
                          color: 'var(--md-sys-color-primary)',
                        },
                      }}
                    />
                    Add First Comment with Link
                  </label>
                  </div>
                   <div style={{marginTop:'10px'}}>
                  <label style={{display: 'flex', alignItems: 'center', fontSize: 'var(--sm-font-size)', gap:'5px'}}>
                  <Checkbox
                    id={'add-comment'}
                    className="form-check-input"
                    type="checkbox"
                    onChange={() => setAddCaptionLink(prev => !prev)}
                    checked={addCaptionLink}
                    sx={{
                      color: 'var(--md-sys-color-secondary)',
                      '&.Mui-checked': {
                        color: 'var(--md-sys-color-primary)',
                      },
                    }}
                  />
                  Add Link in Caption
                </label>
                </div>
                </>
              }
            </ThreeDotMenu>
          </div>
        <div style={{marginTop:'30px'}}>
          {captionText&&
            <ReadMore maxCharacterCount={50}>
                {captionText}
            </ReadMore>
          }
        </div>
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

          </div>
      </div>

    </div>
  )
}


const ThreeDotMenu = ({styles, children}) => {

  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return(
    <div ref={dropdownRef} style={{position:'relative'}}>
      <EllipsisVertical onClick={() => setOpen(prev => !prev)}/>
        {open &&
          <div style={{
            position:'absolute',
            marginTop: '5px',
            zIndex: '100',
            backgroundColor: '#ffffff',
            borderRadius:'var(--input-border-radius)',
            padding:'10px',
            right: 'calc(100% + -10px)',
            minWidth: '250px'
          }} className='dropshadow'>
            <div>
              {children}
            </div>
          </div>
        }
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
  publicationId,
  postType,
  postId,
  userId,
  media,
  setMedia,
  instagramError,
  calendarEvents,
  setCalendarEvents
}) => {
    const { displayEditItem, setDisplayEditItem, item, setItem, setActiveTool} = useEditItemContext();

    const [files, setFiles] = useState(media)
    const editingIndex = useRef(null)
    const editImageRef = useRef(null)
    const editImageData = useRef(null)
    const evtSourceRef = useRef(null);


    console.log('MediaList channelPreviews')

    const editMedia = (media, index, tool) => {
      setActiveTool(tool)
      setDisplayEditItem(true)
      editingIndex.current = index

      setItem(media)
    }

    const handleEditReplace = async(index, newItem) => {

      item.source = 'internal'
      setMedia(prevItems =>
        prevItems.map((item, i) => i === index ? newItem : item)
      );

      if (publicationId){
        const newMedia = await savePostFile({
          file_id: newItem.id,
          usage_type: postType,
          post_publication_id: publicationId
        })

        const newFile = {
          database_id:newMedia.id,
          ...newItem
        }

        if (postId){
          setCalendarEvents(prev =>
              prev.map(event =>
                event.id === postId
                  ? {
                      ...event,
                      media: media.map((item, i) => i === index ? newFile : item)
                    }
                  : event
              )
            );
        }

        showSuccess('Post Files Updated')
      }else{
        if (postId){
          setCalendarEvents(prev =>
              prev.map(event =>
                event.id === postId
                  ? {
                      ...event,
                      media: media.map((item, i) => i === index ? newItem : item)
                    }
                  : event
              )
            );
        }
      }
    };


    useEffect(() => {
      if (!displayEditItem && item) {
          handleEditReplace(editingIndex.current, item)
          setItem(null)
      }
    }, [displayEditItem, item]);


    const changeSortableState = (newState) => {
      setMedia(newState)
    }


    const updateMediaOrder = async(media) =>{

      const mediaSortOrder = media.filter((media) => media.database_id)
      .map((media, index)=>{
        return { id: media.database_id, sort_order: index }
      })

      const uniqueArray = mediaSortOrder.filter((item, index, self) =>
        index === self.findIndex(t => t.id === item.id)
      );


      await updatePostFilesSortOrder(uniqueArray)
    }



    useEffect(()=>{

      console.log('media', media)

      setFiles(media)

      if (media.length !== 0 && publicationId){

        updateMediaOrder(media)
      }

    },[media])








    const removeImage = async (index) => {


      setMedia(prev => prev.filter((_, i) => i !== index));


        if (publicationId){

          const remove = media[index]

          if (remove?.source === 'internal' && remove?.database_id !== null){
              await deletePostFiles([remove.database_id])
          }

          setCalendarEvents(prev =>
              prev.map(event =>
                event.id === postId
                  ? {
                      ...event,
                      media: media.filter((_, i) => i !== index)
                    }
                  : event
              )
            );


        }else{
          setCalendarEvents(prev =>
              prev.map(event =>
                event.id === postId
                  ? {
                      ...event,
                      media: media.filter((_, i) => i !== index)
                    }
                  : event
              )
            );
        }



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

              console.log('edit photoshop')

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
      list={files}
      setList={(newState) => changeSortableState(newState)}
      onDragOver={()=>onSortItems()}
      onDragStart={()=>onSortItems()}
      onDragEnd={()=>onSortItems()}
      // Require holding down the item for 200ms before it moves
      delay={200}
      // Only apply this delay rule on mobile/touch screens
      delayOnTouchOnly={true}
      // Prevents minor micro-twitches on sensitive touchscreens from canceling the drag
      touchStartThreshold={20}
      >
  {files.map((item, index) => {
    const isVideo = item?.file_type === "video/mp4" || item?.file_url?.match(/\.(mp4|mov|m4v)$/i);

    if (!item?.file_url) return <div key={index}></div>

        return(
            <div key={index}
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
                  {(item?.file_type === 'image/png' || item?.file_type === 'image/jpeg')&&
                      <img style={{
                      width:50,
                      height:50,
                      objectFit:'cover',
                      borderRadius:'5px',
                      border: `${(item?.instagram_image_error || item?.post_type_error)?'5px solid var(--md-sys-color-error)':'5px solid var(--md-sys-color-surface-container)'}`
                    }}
                    src={item.file_url}/>
                  }
                  {(postType === 'video_reels' && item?.file_type === 'video/mp4' || isVideo)&&
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


const FacebookPhotosPreview = ({
  media,
  caption,
  customCaptions,
  customCaptionsToggle,
  addComment,
  setAddComment,
  status
}) => {
  const [captionText, setCaptionText] = useState(caption)

  useEffect(() => {

    if (customCaptions?.length>0 && customCaptionsToggle){
      const instagramCaption = customCaptions.find((cap)=> cap.platform === 'facebook')
      if (instagramCaption){
        setCaptionText(instagramCaption?.caption)
      }
      
    }else{
      setCaptionText(caption)
    }

  },[caption, customCaptions, customCaptionsToggle])


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
            {status === 'unpublished'&&
              <>
              
                <div>
                    <label style={{display: 'flex', alignItems: 'center', fontSize: 'var(--sm-font-size)', gap:'5px'}}>
                    <Checkbox
                      id={'add-comment'}
                      className="form-check-input"
                      type="checkbox"
                      onChange={() => setAddComment(prev => !prev)}
                      checked={addComment}
                      sx={{
                        color: 'var(--md-sys-color-secondary)',
                        '&.Mui-checked': {
                          color: 'var(--md-sys-color-primary)',
                        },
                      }}
                    />
                    Add First Comment with Link
                  </label>
                </div>
           
                {/*}
                <div style={{marginTop:'10px'}}>
                  <label style={{display: 'flex', alignItems: 'center', fontSize: 'var(--sm-font-size)', gap:'5px'}}>
                    <Checkbox
                      id={'add-comment'}
                      className="form-check-input"
                      type="checkbox"
                      onChange={() => setAddCaptionLink(prev => !prev)}
                      checked={addCaptionLink}
                      sx={{
                        color: 'var(--md-sys-color-secondary)',
                        '&.Mui-checked': {
                          color: 'var(--md-sys-color-primary)',
                        },
                      }}
                    />
                    Add Link in Caption
                  </label>
                </div>*/}
              </>
            }
          </ThreeDotMenu>
        </div>
        <div style={{marginTop: '30px'}}>
          {media.length>1?(
            <>
              <div className="grid-container">
                {media.map((item, index)=>{
                    return(
                      <div key={index} className="grid-item">
                        <img src={item.file_url}/>
                      </div>
                    )
                  })}
                </div>
                {captionText&&
                  <ReadMore maxCharacterCount={50}>
                      {captionText}
                  </ReadMore>
                }
            </>

            ):(
              <>
                <img src={media[0]?.file_url}/>
                {captionText&&
                  <ReadMore maxCharacterCount={50}>
                      {captionText}
                  </ReadMore>
                }
              </>
            )
          }
        </div>
      </div>
    </div>
  )
}


const InstagramPhotosPreview = ({
  media,
  caption,
  customCaptions,
  customCaptionsToggle,
}) => {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [captionText, setCaptionText] = useState(caption)


    useEffect(() => {

      if (customCaptions?.length>0 && customCaptionsToggle){
        const instagramCaption = customCaptions.find((cap)=> cap.platform === 'instagram')
        setCaptionText(instagramCaption.caption)
      }else{
        setCaptionText(caption)
      }

    },[caption, customCaptions, customCaptionsToggle])


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
    <div style={{background:'#ffffff'}}>
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
    {captionText&&
      <div style={{padding:'10px'}}>
        <ReadMore maxCharacterCount={50}>
          {captionText}
        </ReadMore>
      </div>
    }
    </div>
  )
}
