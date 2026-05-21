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
import { Summary } from '@/components/summary'
import { storeFileInfo } from "@/lib/supabase";
import { updatePostScheduleDate } from "@/lib/supabase";
import { uploadFile } from '@/lib/upload-file'

import {
  X,
  ExternalLink,
  CircleCheck,
  GripVertical,
  SquarePen,
  Trash2,
  Crop
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
    console.log('File Type:', contentType); // e.g., "image/png"
    return contentType;
  } catch (error) {
    console.error('Error fetching image type:', error);
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


  const reloadEvents = async() => {
    if (selectedSocialPages.length > 0){
      getPostsFilter(selectedSocialPages)
    }else{

      const data = await getAllPosts()
      console.log('getAllPosts', data)
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



      const media = post?.post?.post_files.map((media)=>{
        return {
          source: 'internal',
          ...media.file_id
        }
      })



      let status = post?.status??''

      if (post?.platform_account === 'facebook' && status === 'scheduled'){
        status = checkPublished(
          post?.post?.meta_data?.data?.publishedDate,
          post?.status,
        )
      }



      return {
        id: post.id,
        start: post.scheduled_at,
        end: post.scheduled_at,
        allDay: false,
        title: post?.post?.title,
        caption: post?.post?.caption,
        scheduleDate: post?.scheduled_at,
        publishDate: post?.post?.meta_data?.data?.publishedDate??null,
        link: post?.post?.meta_data?.data?.link??null,
        slug: post?.post?.meta_data?.data?.slug??null,
        base_url: post?.post?.meta_data?.data?.base_url??null,
        status: status??null,
        type:post?.post?.type??'',
        media: media??null,
        error: post?.last_error??'',
        metaData: {...post?.post?.meta_data, ...post.meta_data, ...post.platform_account.meta_data},
        platform_account:post?.platform_account,
        post_publication_id:post.id,
        database_id:post.id

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
    console.log('handleEventDrop', data)


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

    /*
    let calendarApi = cal.current.getApi()
    let currentEvent = calendarApi.getEventById(eventInfo.event._def.publicId);
    var scheduled = eventInfo.event.start
    var now = new Date();
    */


  }

  const handleEventClick = (data) =>{
    setPostData(data.event)
  }

  const eventClickSelect = (data) =>{
    setPostData(data.event)
  }


  function handleEvents(events) {
    setCalendarEvents(events)
  }




  function renderEventContent(eventInfo) {


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

  const checkOnesignal = () => {

    const options = {method: 'GET', mode: 'cors', headers: {Authorization: 'Key ODlmNjJhNWMtMGI2OC00MzRmLTg1OTMtNmIxOTI2Mjc5YTZm'}};



    fetch('https://api.onesignal.com/notifications?app_id=d140ee1c-d1b9-4d2b-925b-92bf419ca774&limit=100&kind=1&time_offset=2026-05-19T00:00:00.000Z', options)
      .then(res => res.json())
      .then(res => console.log(res))
      .catch(err => console.error(err));
  }




  const deletePostCallback = async(postData) =>{



    await deletePost([postData._def.extendedProps.post_publication_id])

    const postType = postData._def.extendedProps.type


    if (postData?._def?.extendedProps?.platform_account?.platform === "facebook"){
      const accessToken = postData._def.extendedProps.platform_account.access_token

      let id
      if (postType === 'video_reels'){
        id = postData?._def.extendedProps?.metaData?.video_id
      }else if (postType === 'text' || postType === 'link' || postType === 'photos') {
        id = postData?._def.extendedProps?.metaData?.post_id
      }

      if (!id) {
        showError('No id')
        return
      }


    const facebookDeleteResponse = await fetch(`https://graph.facebook.com/v24.0/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({access_token:accessToken}),
      })

      if (!facebookDeleteResponse.ok) {
        //throw new Error(`Upload to facebook failed with status: ${facebookResponse.status}`);
        showError(`Error deleting post: ${facebookDeleteResponse.status}`)
      }


      notify('Facebook post Deleted')


    }


    if (postData?._def?.extendedProps?.platform_account?.platform === "One Signal"){

      const id = postData?._def.extendedProps?.metaData?.notification_idq
      const appId = postData?._def.extendedProps?.platform_account?.external_account_id

      if (!id || !appId) {
        showError('No id')
        return
      }

      const onesignalDeleteResponse = await fetch(`https://onesignal.com/api/v1/notifications/${id}?app_id=${appId}`, {
          headers: {
            Authorization: "Basic "+serviceInfo.oneSignalRestApiKey,
          },
          method: "DELETE"
        })

        if (!onesignalDeleteResponse.ok) {
          //throw new Error(`Upload to facebook failed with status: ${facebookResponse.status}`);
          showError(`Error deleting one signal post: ${onesignalDeleteResponse.status}`)
        }

        notify('Notification Deleted')


    }


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
        scheduleCallBack={reloadEvents}
      />

      }
      <div style={{flex:1, padding:'20px'}}>
        {/*}<button onClick={checkOnesignal}>Check One Signal</button>*/}
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
        />
      </div>
      <div style={{flex:4, minWidth: 0}}>
        <div style={loader? {display:'block'}:{display:'none'}} className={'loader_screen'}>
            <div style={{transform:'translate(-50%, -50%)'}}  className="loader"></div>
        </div>
        <FullCalendar
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


          //initialEvents={INITIAL_EVENTS} // alternatively, use the `events` setting to fetch from a feed
          select={handleEventClick}
          eventContent={renderEventContent} // custom render function
          eventClick={handleEventClick}
          eventReceive={handleEventReceive}
          eventDrop={handleEventDrop}

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
            type:'link',
            platform_account:{
              external_account_id:selectedFeed.facebook_page_id
            },
            usePreview: false
          })


        }

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
            type:'link',
            platform_account:{
              external_account_id:selectedFeed.facebook_page_id
            },
            usePreview: true
          })
        }
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

          return(
            <ExternalEvent key={index} data={post}/>
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
  const [selectedSocialPage, setSelectedSocialPage] = useState(null)
  const [selectedSocialPages, setSelectedSocialPages] = useState([])
  const [socialPages, setSocialPages] = useState([])
  const [postLink, setPostLink] = useState(`https://${postData?._def.extendedProps.base_url}/${postData?._def.extendedProps.slug}`)
  const [caption, setCaption] = useState(postData? postData?._def.extendedProps.caption: '')
  const [media, setMedia] = useState(postData?._def.extendedProps.media??[])
  const videoBlobRef = useRef(null)
  const [videoSrc, setVideoSrc] = useState(null)
  const [loader, setLoader] = useState(false)
  const [videoLoader, setVideoLoader] = useState(false)
  const [scheduled, setScheduled] = useState(false)
  const [postType, setPostType] = useState(postData?._def.extendedProps.type)
  const [status, setStatus] = useState(postData?._def.extendedProps?.status)

  const [postState, setPostState]= useState('SCHEDULED')
  const [buttonText, setButtonText]= useState('Schedule')
  //const [summary, setSummary]= useState(null)
  const [channelPreviews, setChannelPreviews]= useState([])
  const [selectedChannelPreview, setSelectedChannelPreview]= useState('facebook')
  const [instagramError, setInstagramError] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [customCaptions, setCustomCaptions] = useState(false)

  const [customCaptionsData, setCustomCaptionsData] = useState([])


  const customCaptionsToggle = (e) => {
    setCustomCaptions(!customCaptions)
    console.log('customCaptionsToggle', e.target.value)
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
    if (event.target.value === 'SCHEDULED'){
      setButtonText('Schedule')
    }else if (event.target.value === 'PUBLISHED'){
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

  }

  const scheduleMultiple = async(status) => {

        if (timeTravel(scheduleDate)){
          showError('No Time Travel')
          return
        }

       setLoader(true)

        try{

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

               for (const file of media) {
                 if (file.source === 'external'){
                     const fileInfo = await storeFileInfo({
                       user_id:userId,
                       file_url:file.file_url,
                       file_type:file.file_type,
                       file_name:file.file_name,
                       file_description:file.file_description??null
                     })
                  await savePostFile({
                       post_id:savedPost.id,
                       file_id:fileInfo.id,
                       usage_type:postType
                     })
                 }else{
                   await savePostFile({
                     post_id:savedPost.id,
                     file_id:file.id,
                     usage_type:postType
                   })
                 }
                }

             const scheduledAtUTC = new Date(scheduleDate).toISOString()

             const publications = selectedSocialPages.map((acc) => ({
               post_id: savedPost.id,
               platform_id: acc.id,
               scheduled_at: scheduledAtUTC,
               platform:acc.platform,
               status: status
             }))

             const savedPostPublications = await savePostPublications(publications)

             const savedPostPublicationsFacebook = savedPostPublications.filter((publication)=>publication.platform === 'facebook')

             const savedPostPublicationsOneSignal = savedPostPublications.filter((publication)=>publication.platform === 'One Signal')


             for (const publication of savedPostPublicationsFacebook) {
               const channel = socialPages.find((social)=> social.id === publication.platform_id)

               if (postType === 'video_reels'){
                 await scheduleFacebookReel(
                   channel.external_account_id,
                   channel.access_token,
                   uploadedVideo.file_url,
                   publication
                 )
               }else{

                 await facebookSchedule(
                   channel.external_account_id,
                   channel.access_token,
                   publication,
                   status = 'scheduled'
                 )
               }
             }

              for (const publication of savedPostPublicationsOneSignal) {

                const channel = socialPages.find((social)=> social.id === publication.platform_id)

                await onesignalSchedule(
                  channel,
                  publication
                )

              }

        }catch(error){
          console.log('error', error)
          showError(error)
          setLoader(false)

        }

     scheduleCallBack()
     setLoader(false)
     showSuccess('All Posts Scheduled')
     close(null)
  }

  const getFacebookPostEndpoint = (postType) => {


    switch (postType) {
      case 'text':
      case 'link':
      case 'carousel':
        return 'feed'
        break;
      case 'photos':
        return 'photos'
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

const getFacebookPostData = (postType) => {
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
        published: publish,
        url: media[0].file_url,
      }

    case 'video':
      return {
        description: caption,
        published: publish,
        file_url: videoUrlState,
      }

    case 'photo_stories':
      return {
        link: postLinkState,
        published: published,
        photo_id: media[0].file_url,
      }

    case 'video_reels':
      return {
        video_id: videoId,
        upload_phase: 'finish',
        video_state: postState,
        description:
          caption +
          '\n\n' +
          `Full story here: https://${postInfo?.data.base_url}/${postInfo?.data.slug}`,
        title: postInfo.data.title
      }

    default:
      return null
  }
}

const onesignalSchedule = async(
  channel,
  publication,
) => {


        let dateString = moment(scheduleDate).format("YYYY-MM-DD HH:mm:ss")
        if (channel.metadata.gmt.startsWith("-")){
          dateString = dateString+' GMT'+channel.metadata.gmt
        }else{
          dateString = dateString+' GMT'+'+'+channel.metadata.gmt
        }

        let method = "POST";
        let cors = {
          'mode': 'cors'
        }

        let headers = {
          "Content-type": "application/json",
          "Authorization": "Basic "+channel.access_token,
        }

        if (channel.metadata.platform === 'web'){
          body = JSON.stringify({
            "app_id" : channel.external_account_id,
            "headings" :  {"en": title},
            "contents": {"en": title},
            "included_segments" : ["Subscribed Users"],
            "url" : postLink,
            "chrome_web_image" : media[0].file_url,
            "send_after" : dateString
          })
        }else if (channel.metadata.platform === 'mobile'){
            body = JSON.stringify({
              "app_id" : channel.external_account_id,
              "headings" :  {"en": title},
              "contents": {"en": title},
              "included_segments" : ["Subscribed Users"],
              "send_after" : dateString,
              "big_picture" : imgUrlState,
              //"big_picture" : imgUrlState? imgUrlState: null,
              "data" : slug? {
                "slug" : slug
              } : null,
              'ios_badgeType' : "SetTo",
              'ios_badgeCount' : 1
            })
        }

        const onesignalResponse = await fetch("https://onesignal.com/api/v1/notifications", {method, cors, headers, body})

        if (!onesignalResponse.ok) {
          setLoader(false)
          showError(`Failed to schedule One Signal: ${onesignalResponse.status}`)
        }

        const onesignalResponseJson = await onesignalResponse.json();
        const notificationId = onesignalResponseJson.id

        const updateData = {
          status: "scheduled",
          meta_data:{
            notification_id:notificationId,
            ...onesignalResponseJson
          }
        }

        await updatePostPublication(publication.id, updateData)

        showSuccess('One Signal Post Scheduled')


}

  const facebookSchedule = async (
    pageId,
    accessToken,
    publication,
    schedule = true
  ) => {

    if (timeTravel(scheduleDate)){
      showError('No Time Travel')
      setLoader(false)
      return
    }

    const scheduledPublishTime = (moment(scheduleDate).unix())
    const endPoint = getFacebookPostEndpoint(postType)
    const data = getFacebookPostData(postType)


    if (!endPoint || !data){
      showError('no end point or data')
      return
    }

    if (schedule){
      data.scheduled_publish_time = scheduledPublishTime
      data.published = false

    }else{
      data.published = true
    }

    data.access_token = accessToken

    try{

      const facebookResponse = await fetch(`https://graph.facebook.com/v24.0/${pageId}/${endPoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

    if (!facebookResponse.ok) {
      setLoader(false)
      showError(`Upload to facebook failed with status: ${facebookResponse.status}`)
    }

    showSuccess('Post Scheduled')

    const postResponseJson = await facebookResponse.json();
    const postId = postResponseJson.id

    await addFacebookComment(
      postId,
      postLink,
      accessToken
    );

      showSuccess('Comment Added')

      const updateData = {
        status: "scheduled",
        meta_data:{
          post_id:postId,
          ...postResponseJson
        },
      }

      await updatePostPublication(publication.id, updateData)
      //updateScheduledEvent(updateData)
      //setStatus('scheduled')
    //  setScheduled(true)



    }catch(error){
      showError(`Facebook error: ${error}`)
      setLoader(false)
    }
  }

  const updateScheduledEvent = (updateData) =>{
    const calendarApi = cal.current.getApi()

    let currentEvent = calendarApi.getEventById(postData._def.publicId);

    const newProps = {...postData._def.extendedProps, ...updateData }

    currentEvent.mutate({
        extendedProps: newProps
    })


  }

  const scheduleFacebookReel = async (
    pageId,
    accessToken,
    video_url,
    publication
  ) => {

    if (timeTravel(scheduleDate)){
      showError('No Time Travel')
      setLoader(false)
      return
    }

    const video = videoBlobRef.current

    const formData = new FormData();
    //formData.append('fileUrl', video_url);
    formData.append('videoBlob', video);
    formData.append('accessToken', accessToken);
    formData.append('socialId', pageId);

      const response = await fetch('/api/uploadFacebookReel', {
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

    // Unix timestamp for a future date (e.g., tomorrow at 10 AM)
    const scheduledPublishTime = (moment(scheduleDate).unix())

    try{

      const facebookResponse = await fetch(`https://graph.facebook.com/v24.0/${pageId}/${path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            video_id: videoId,
            upload_phase : 'finish',
            video_state : postState,
            description: caption + '\n\n' + `Full story here: https://${postInfo?.data.base_url}/${postInfo?.data.slug}`,
            title :postInfo.data.title,
            scheduled_publish_time: scheduledPublishTime,
            access_token: accessToken
          }),
        })

    if (!facebookResponse.ok) {
      //throw new Error(`Upload to facebook failed with status: ${facebookResponse.status}`);
      setLoader(false)
      showError(`Upload to facebook failed with status: ${facebookResponse.status}`)
    }

    showSuccess('Post Scheduled')

    const videoData = await facebookResponse.json();
    const postId = postResponseJson.post_id

    await addFacebookComment(
      videoId,
      postLink,
      selectedSocialPage.access_token
    );

      showSuccess('Comment Added')
      postScheduled(postInfo)

      // update database
      const updateData = {
        status: "published",
        meta_data:{
          video_id:videoId,
          ...videoData
        },
        published_at: new Date().toISOString()
      }

      await updatePostPublication(publication.id, updateData)
    //  updateScheduledEvent(updateData)
      //setStatus('scheduled')
    //  setScheduled(true)
      //close(null)

    }catch(error){
      showError(`Facebook error: ${error}`)
       setLoader(false)
    }

  }


  async function addFacebookComment(postId, postLink, accessToken, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const commentResponse = await fetch(
          `https://graph.facebook.com/${postId}/comments`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: 'Check out the full details here: ' + postLink,
              access_token: accessToken,
            }),
          }
        );

        if (!commentResponse.ok) {
          throw new Error(
            `Adding comments failed with status: ${commentResponse.status}`
          );
        }

        return await commentResponse.json();
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }

        // wait 1 second before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  const deletePostDatabase = async() =>{

      await deletePostCallBack(postData)
      close(null)
  }

  const lookUpPost = async() => {

    const accessToken = postData._def.extendedProps.platform_account.access_token
    const id = postData?._def.extendedProps?.metaData?.post_id

    const facebookesponse = await fetch(`https://graph.facebook.com/v24.0/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields:'message,created_time,shares',
          access_token:accessToken
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
        setMedia(prev => [...selectedFiles, ...media])
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
            <div className='col' style={{position:'relative', overflowY: 'scroll', padding: '15px', flex:1}}>

              <h2>Share To Social Media</h2>
              <hr/>

              {postData._def.extendedProps.error&&
                <div style={{
                  background: 'var(--md-sys-color-error)',
                  color:'#ffffff',
                  padding:'10px',
                  borderRadius: '10px'
                }}>
                  {postData._def.extendedProps.error}
                </div>
              }
              {status&&
                <div className="scheduled_badge">
                  <strong>{capitilise(status)}</strong>
                  <CircleCheck />
                </div>
              }

              <ChannelSelector
                userId={userId}
                postInfo={postData}
                setSocialPagesParent={setSocialPages}
                callback={channelSelectorCallback}
                disabled={postData?._def.extendedProps?.post_publication_id}
              />

              <h4>{postData.title}</h4>

              <div className="properties-container" style={{margin:'15px 0px'}}>
                <p className='label'>Post Type</p>
                <input
                  style={{marginRight:'5px'}}
                  type="radio"
                  value="text"
                  checked={postType === 'text'}
                  onChange={handlePostTypeChange}
                /><span style={{fontSize:'.9em'}}>Text</span>
                <input
                  style={{marginLeft:'10px', marginRight:'5px'}}
                  type="radio"
                  value="video_reels"
                  checked={postType === 'video_reels'}
                  onChange={handlePostTypeChange}
                /><span style={{fontSize:'.9em'}}>Reel</span>
                <input
                  style={{marginLeft:'10px', marginRight:'5px'}}
                  type="radio"
                  value="link"
                  checked={postType === 'link'}
                  onChange={handlePostTypeChange}
                /><span style={{fontSize:'.9em'}}>Link</span>
                <input
                  style={{marginLeft:'10px', marginRight:'5px'}}
                  type="radio"
                  value="photos"
                  checked={postType === 'photos'}
                  onChange={handlePostTypeChange}
                /><span style={{fontSize:'.9em'}}>Photos</span>
              </div>


              {(postType === 'photos' || postType === 'video_reels')&&

                <div className="properties-container" style={{margin:'15px 0px'}}>
                  {console.log((postType === 'photos' || postType === 'video_reels'))}
                  <p className='label'>Media</p>
                  <button className="btn secondary btn-sm" onClick={() => {
                    setSelectedFiles([])
                    setFilePicker(true)
                    setShowFiles(prevState => !prevState)
                  }}>Add Files</button>
                  <MediaList
                    postType={postType}
                    userId={userId}
                    media={media}
                    setMedia={setMedia}
                    channelPreviews={channelPreviews}
                    setInstagramError={setInstagramError}
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
            <Switch

              onChange={customCaptionsToggle}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: 'var(--md-sys-color-primary)', // Color of the thumb when checked
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: 'var(--md-sys-color-surface-tint)', // Color of the track when checked
                },
              }}
            checked={customCaptions}
          />
              <p className='label'>Post Caption</p>
              <textarea
                style={{minHeight:200}}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className={'form-input'}
                cols={8}
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
                  <div>
                    <input
                      style={{marginRight:'5px'}}
                      type="radio"
                      value="SCHEDULED"
                      checked={postState === 'SCHEDULED'}
                      onChange={handlePostStateChange}
                      disabled={status === 'published'}
                    /><strong style={{fontSize:'.9em'}}>Schedule</strong>
                  </div>
                  <div>
                    <input
                      style={{marginRight:'5px'}}
                      type="radio"
                      value="PUBLISHED"
                      checked={postState === 'PUBLISHED'}
                      onChange={handlePostStateChange}
                      disabled={status === 'published'}
                    /><strong style={{fontSize:'.9em'}}>Publish Now</strong>
                  </div>
                  <div style={{marginLeft: 'auto'}}>
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
                {instagramError &&
                  <p>instagram Error</p>
                }
              </div>
              {(selectedSocialPages.length>0 && !instagramError) &&
                <button style={{marginLeft:'10px'}} disabled={status === 'published' || status === 'scheduled'} className="btn primary" onClick={() => scheduleMultiple('scheduled')}>{buttonText}</button>
              }

              {postData._def.extendedProps.post_publication_id &&
                <button style={{marginLeft:'10px'}} className="btn danger" onClick={deletePostDatabase}>Delete Post</button>
            }
            {/*}<button onClick={lookUpPost}>Look Up Post</button>*/}

            </div>
            <div className='col' style={{
              flex:1,
              position: 'relative',
              overflowY: 'scroll',
              padding: '30px 15px 10px 15px',
              backgroundColor: 'var(--md-sys-color-surface-container)'
            }}>
              <select id="channel-select" className="form-input select" onChange={(e) => onChannelPreviewChange(e.target.value)} value={selectedChannelPreview}>
                {channelPreviews.map((channel, index)=>{
                  return <option key={index} value={channel}>{channel}</option>
                })
                }
              </select>

              {(postType=== 'link' &&  postLink && selectedChannelPreview === 'facebook') &&
                <FacebookLinkPreview
                url={postLink}
                postData={postData}
                caption={caption}
              />
              }
              {(postType === 'video_reels' && postData?._def?.extendedProps?.media[0]?.file_type === "video/mp4") &&
                <div className="video-container">
                  <video
                    src={postData?._def?.extendedProps?.media[0]?.file_url}
                    controls // Adds play, pause, etc. controls
                    className='video'
                    // poster="thumbnail.jpg" // Optional: specify a placeholder image
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              }
              {postType === 'link' &&  selectedChannelPreview === 'instagram' &&
                  <InstagramLinkPreview
                  image={postData?._def.extendedProps?.media[0]?.file_url}
                  postData={postData}
                  caption={caption}
                />
              }
              {postType === 'photos' &&  selectedChannelPreview === 'instagram' &&
                <InstagramPhotosPreview media={media} />
              }

              {postType === 'photos' &&  selectedChannelPreview === 'facebook' &&
                  <FacebookPhotosPreview media={media}/>
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
}) => {
  const [openGraph, setOpenGraph] = useState(null)
  const [openGraphError, setOpenGraphError] = useState(null)
  const hasRun = useRef(false);

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



return(
  <div style={{marginTop:'25px'}}>
    <div
      style={{
        background:'#ffffff',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        padding:'10px'
      }}
    >
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
            no OG Image
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
            {openGraph?.title? openGraph.title : postData.title}
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

    const [files, setFiles] = useState(media)
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
      setMedia(newState)
    }

    const checkInstagramImages = async (images) => {

        let errorArray = []

         const checkedImages = await Promise.all(images.map(async(image) => {
           let carouselImageError = await checkImageSize(image.file_url)
           var temp = Object.assign({}, image);
           temp.instagram_image_error = carouselImageError
           if (carouselImageError === true){
              errorArray.push(true)
           }
           return temp;
         }))

         setFiles(checkedImages)


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

      setFiles(media)

    },[media, channelPreviews])


    const removeImage = async (index) => {
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


  return(
    <ReactSortable
      list={media}
      setList={(newState) => changeSortableState(newState)}
      onDragOver={()=>onSortItems()}
      onDragStart={()=>onSortItems()}
      onDragEnd={()=>onSortItems()}
      >
  {files.map((item, index) => {
    const isVideo = item.file_type === "video/mp4" || item.file_url.match(/\.(mp4|mov|m4v)$/i);

      if (checkIfImage(item, index)){
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
                  {(postType === 'photos' && (item.file_type === 'image/png' || item.file_type === 'image/jpeg'))&&
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
                {postType === 'photos' &&
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
      }else{
        return null
      }


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
